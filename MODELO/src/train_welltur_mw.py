"""Train a WELLTUR pairwise ranker only from opted-in, real traveler feedback.

The command abstains without a sufficiently large user-held-out evaluation. It
never falls back to synthetic data and only promotes a model if it beats the
explicit preference-match baseline on held-out users with a positive bootstrap
confidence interval for nDCG@5 delta.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any

import numpy as np

TAG_ORDER = [*[f"M{i}" for i in range(1, 10)], *[f"W{i}" for i in range(1, 8)]]
POSITIVE_EVENTS = {"saved", "selected", "visited"}
NEGATIVE_EVENTS = {"dismissed"}

OPT_IN_FEEDBACK_QUERY = """
SELECT t.user_id, s.session_id, t.motive_priorities, t.modality_preferences,
       f.item_id, f.event_type, f.rating,
       shown.motive_tags_snapshot, shown.modality_tags_snapshot
  FROM wellness_trip_preference_assessment t
  JOIN wellness_recommendation_session s
    ON s.trip_preference_id = t.trip_preference_id AND s.user_id = t.user_id
  JOIN wellness_recommendation_item_feedback f ON f.session_id = s.session_id
  JOIN wellness_recommendation_item_feedback shown
    ON shown.session_id = f.session_id AND shown.item_id = f.item_id
   AND shown.event_type = 'impression'
  JOIN "user" u ON u.user_id = t.user_id
 WHERE t.consent_given = TRUE
   AND u.role_id = 2 AND u.is_active = TRUE AND u.is_seeded = FALSE
   AND u.email NOT ILIKE '%@smartur.demo'
   AND f.event_type IN ('saved','dismissed','selected','visited','rated')
 ORDER BY t.user_id, s.session_id, f.created_at
"""


def _labels_from_rows(rows: list[dict[str, Any]]) -> dict[tuple[int, str], dict[str, Any]]:
    """Reduce repeated events to one explicit label per session/item."""
    items: dict[tuple[int, str], dict[str, Any]] = {}
    for row in rows:
        event = row["event_type"]
        label: int | None = 1 if event in POSITIVE_EVENTS else 0 if event in NEGATIVE_EVENTS else None
        if event == "rated":
            rating = int(row.get("rating") or 0)
            label = 1 if rating >= 4 else 0 if rating <= 2 else None
        if label is None:
            continue
        key = (int(row["session_id"]), str(row["item_id"]))
        existing = items.get(key)
        # Explicit ratings override clicks; a later positive or negative action
        # overrides an earlier implicit save/dismiss action deterministically.
        source_priority = 2 if event == "rated" else 1
        if existing is None or source_priority >= existing["source_priority"]:
            items[key] = {
                "user_id": int(row["user_id"]),
                "session_id": int(row["session_id"]),
                "item_id": str(row["item_id"]),
                "label": label,
                "event_type": event,
                "motive_priorities": list(row.get("motive_priorities") or []),
                "modality_preferences": list(row.get("modality_preferences") or []),
                "motive_tags": list(row.get("motive_tags_snapshot") or []),
                "modality_tags": list(row.get("modality_tags_snapshot") or []),
                "source_priority": source_priority,
            }
    return items


def _feature(profile: dict[str, list[str]], item: dict[str, Any]) -> np.ndarray:
    vector = np.zeros(len(TAG_ORDER), dtype=np.float64)
    for priorities_key, tags_key in (
        ("motive_priorities", "motive_tags"),
        ("modality_preferences", "modality_tags"),
    ):
        priorities = profile.get(priorities_key) or []
        tags = set(item.get(tags_key) or [])
        for index, code in enumerate(priorities[:3]):
            if code in tags and code in TAG_ORDER:
                vector[TAG_ORDER.index(code)] = 3 - index
    return vector


def _session_groups(items: dict[tuple[int, str], dict[str, Any]]) -> dict[int, list[dict[str, Any]]]:
    sessions: dict[int, list[dict[str, Any]]] = {}
    for item in items.values():
        sessions.setdefault(item["session_id"], []).append(item)
    return sessions


def _pairs(sessions: dict[int, list[dict[str, Any]]], users: set[int]) -> tuple[np.ndarray, np.ndarray]:
    features: list[np.ndarray] = []
    labels: list[int] = []
    for rows in sessions.values():
        if not rows or rows[0]["user_id"] not in users:
            continue
        positives = [row for row in rows if row["label"] == 1]
        negatives = [row for row in rows if row["label"] == 0]
        for positive in positives:
            for negative in negatives:
                profile = {
                    "motive_priorities": positive["motive_priorities"],
                    "modality_preferences": positive["modality_preferences"],
                }
                delta = _feature(profile, positive) - _feature(profile, negative)
                if not np.any(delta):
                    continue
                features.extend((delta, -delta))
                labels.extend((1, 0))
    if not features:
        return np.empty((0, len(TAG_ORDER))), np.empty((0,), dtype=int)
    return np.vstack(features), np.asarray(labels, dtype=int)


def _ndcg_at_5(rows: list[dict[str, Any]], coefficients: np.ndarray | None) -> float | None:
    if not any(row["label"] == 1 for row in rows) or not any(row["label"] == 0 for row in rows):
        return None
    profile = {
        "motive_priorities": rows[0]["motive_priorities"],
        "modality_preferences": rows[0]["modality_preferences"],
    }
    scored = []
    for row in rows:
        feature = _feature(profile, row)
        score = float(feature @ coefficients) if coefficients is not None else float(feature.sum())
        scored.append((score, row["label"], row["item_id"]))
    scored.sort(key=lambda value: (-value[0], value[2]))
    relevance = [item[1] for item in scored[:5]]
    dcg = sum(rel / np.log2(index + 2) for index, rel in enumerate(relevance))
    ideal = sorted((row["label"] for row in rows), reverse=True)[:5]
    idcg = sum(rel / np.log2(index + 2) for index, rel in enumerate(ideal))
    return float(dcg / idcg) if idcg else None


def _user_ndcg(sessions: dict[int, list[dict[str, Any]]], users: set[int], coefficients: np.ndarray | None) -> dict[int, float]:
    grouped: dict[int, list[float]] = {}
    for rows in sessions.values():
        if not rows or rows[0]["user_id"] not in users:
            continue
        metric = _ndcg_at_5(rows, coefficients)
        if metric is not None:
            grouped.setdefault(rows[0]["user_id"], []).append(metric)
    return {user: float(np.mean(values)) for user, values in grouped.items()}


def _bootstrap_delta_ci(baseline: dict[int, float], learned: dict[int, float], seed: int = 20261008) -> list[float]:
    users = sorted(set(baseline) & set(learned))
    if len(users) < 2:
        return [0.0, 0.0]
    deltas = np.asarray([learned[user] - baseline[user] for user in users], dtype=np.float64)
    rng = np.random.default_rng(seed)
    samples = rng.choice(deltas, size=(2000, len(deltas)), replace=True).mean(axis=1)
    return [float(value) for value in np.quantile(samples, [0.025, 0.975])]


def _read_opt_in_rows() -> list[dict[str, Any]]:
    import psycopg2
    from psycopg2.extras import RealDictCursor

    connection = psycopg2.connect(
        host=os.environ.get("POI_DB_HOST", "postgres"),
        port=int(os.environ.get("POI_DB_PORT", 5432)),
        dbname=os.environ.get("POI_DB_NAME", "smartur"),
        user=os.environ.get("POI_DB_USER", "postgres"),
        password=os.environ.get("POI_DB_PASSWORD", os.environ.get("DB_PASSWORD", "")),
        connect_timeout=5,
    )
    try:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(OPT_IN_FEEDBACK_QUERY)
            return [dict(row) for row in cursor.fetchall()]
    finally:
        connection.close()


def train(rows: list[dict[str, Any]], *, min_users: int = 200, min_pairs: int = 1000,
          seed: int = 20261008) -> dict[str, Any]:
    items = _labels_from_rows(rows)
    sessions = _session_groups(items)
    users = sorted({row["user_id"] for row in items.values()})
    if len(users) < min_users:
        return {"status": "insufficient_data", "reason": "not_enough_distinct_opt_in_tourists",
                "users_with_explicit_feedback": len(users), "minimum_users": min_users,
                "labeled_session_items": len(items), "promoted": False}

    rng = np.random.default_rng(seed)
    shuffled = np.asarray(users, dtype=int)
    rng.shuffle(shuffled)
    n_test = max(30, int(np.ceil(len(users) * 0.20)))
    n_validation = max(20, int(np.ceil(len(users) * 0.10)))
    test_users = set(int(user) for user in shuffled[:n_test])
    validation_users = set(int(user) for user in shuffled[n_test:n_test + n_validation])
    train_users = set(int(user) for user in shuffled[n_test + n_validation:])
    x_train, y_train = _pairs(sessions, train_users)
    x_val, y_val = _pairs(sessions, validation_users)
    x_test, y_test = _pairs(sessions, test_users)
    if len(y_train) < min_pairs:
        return {"status": "insufficient_data", "reason": "not_enough_pairwise_choices",
                "users_with_explicit_feedback": len(users), "train_pairs": len(y_train),
                "minimum_pairs": min_pairs, "promoted": False}
    if len(y_val) < 20 or len(y_test) < 60:
        return {"status": "insufficient_data", "reason": "not_enough_held_out_comparisons",
                "train_pairs": len(y_train), "validation_pairs": len(y_val),
                "test_pairs": len(y_test), "promoted": False}

    from sklearn.linear_model import LogisticRegression

    candidates = []
    val_baseline = _user_ndcg(sessions, validation_users, None)
    for c_value in (0.01, 0.1, 1.0, 10.0):
        estimator = LogisticRegression(C=c_value, fit_intercept=False, solver="liblinear", max_iter=1000)
        estimator.fit(x_train, y_train)
        val_learned = _user_ndcg(sessions, validation_users, estimator.coef_[0])
        common_users = set(val_baseline) & set(val_learned)
        score = float(np.mean([val_learned[user] for user in common_users])) if common_users else -1.0
        candidates.append((score, c_value, estimator))
    _, selected_c, model = max(candidates, key=lambda candidate: (candidate[0], -candidate[1]))

    baseline = _user_ndcg(sessions, test_users, None)
    learned = _user_ndcg(sessions, test_users, model.coef_[0])
    common_users = sorted(set(baseline) & set(learned))
    if len(common_users) < 30:
        return {"status": "insufficient_data", "reason": "fewer_than_30_test_users_with_positive_and_negative_feedback",
                "test_users_evaluable": len(common_users), "promoted": False}
    deltas = [learned[user] - baseline[user] for user in common_users]
    delta_ci = _bootstrap_delta_ci(baseline, learned, seed)
    pairwise_accuracy = float(np.mean((model.predict(x_test) == y_test)))
    baseline_pair_accuracy = float(np.mean((x_test.sum(axis=1) >= 0) == (y_test == 1)))
    mean_ndcg_baseline = float(np.mean([baseline[user] for user in common_users]))
    mean_ndcg_learned = float(np.mean([learned[user] for user in common_users]))
    delta = mean_ndcg_learned - mean_ndcg_baseline
    promoted = delta >= 0.02 and delta_ci[0] > 0.0
    evaluation = {
        "train_users": len(train_users), "validation_users": len(validation_users),
        "holdout_users": len(common_users), "train_pairs": int(len(y_train)),
        "validation_pairs": int(len(y_val)), "test_pairs": int(len(y_test)),
        "selected_C": selected_c,
        "baseline_ndcg_at_5": mean_ndcg_baseline,
        "learned_ndcg_at_5": mean_ndcg_learned,
        "ndcg_at_5_delta": delta,
        "ndcg_delta_95_ci": delta_ci,
        "baseline_pairwise_accuracy": baseline_pair_accuracy,
        "learned_pairwise_accuracy": pairwise_accuracy,
        "user_level_deltas": deltas,
        "promotion_gate": {"minimum_ndcg_delta": 0.02, "ci_lower_bound_gt_zero": True,
                           "minimum_holdout_users": 30},
    }
    return {"status": "promoted" if promoted else "baseline_retained",
            "reason": None if promoted else "learned_model_did_not_clear_predeclared_baseline_gate",
            "promoted": promoted, "users_with_explicit_feedback": len(users),
            "training_scope": "real_opt_in_feedback", "tag_schema": TAG_ORDER,
            "weights": model.coef_[0].astype(float).tolist(), "evaluation": evaluation}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--min-users", type=int, default=200)
    parser.add_argument("--min-pairs", type=int, default=1000)
    parser.add_argument("--output", default=os.environ.get(
        "WELLNESS_MW_MODEL_PATH", str(Path(__file__).resolve().parents[1] / "models" / "wellness_mw_ranker.joblib")))
    args = parser.parse_args()
    rows = _read_opt_in_rows()
    result = train(rows, min_users=args.min_users, min_pairs=args.min_pairs)
    if result.get("promoted"):
        import joblib
        result["validated_for_serving"] = True
        result.pop("user_level_deltas", None)
        output = Path(args.output)
        output.parent.mkdir(parents=True, exist_ok=True)
        temporary = output.with_suffix(output.suffix + ".tmp")
        joblib.dump(result, temporary)
        os.replace(temporary, output)
        result["model_path"] = str(output)
    else:
        result["validated_for_serving"] = False
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
