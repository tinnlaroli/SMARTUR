"""Evalúa ranking sobre el bootstrap sintético y compara baselines/modelos.

No escribe ``algorithm_metrics.json`` porque sus usuarios son inventados. El
reporte queda en ``bootstrap_ranking_metrics.json`` para validar el pipeline.
"""
from __future__ import annotations

import json
import os
from math import log2

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

from engine import SmarturEngine
from synthetic_persona_validation import generate_personas, generate_ratings, _persona_declared_context
from synthetic_training import synth_n_personas
from rf_model import SmarturContextModel
from lightfm_model import SmarturLightFMModel


def _ndcg(ids, relevant, k):
    hits = [1.0 if x in relevant else 0.0 for x in ids[:k]]
    dcg = sum(v / log2(i + 2) for i, v in enumerate(hits))
    ideal = sum(1.0 / log2(i + 2) for i in range(min(k, len(relevant))))
    return dcg / ideal if ideal else 0.0


def _minmax(values):
    values = np.asarray(values, dtype=float)
    lo, hi = float(np.nanmin(values)), float(np.nanmax(values))
    return np.full(len(values), 0.5) if hi - lo < 1e-9 else (values - lo) / (hi - lo)


def run(n_personas=None, seed=42, k=10):
    base = SmarturEngine(data_source="mexico")
    catalog = base.df_biz.copy()
    personas = generate_personas(n_personas or synth_n_personas(), seed=seed)
    ratings = generate_ratings(personas, catalog, seed=seed)
    train, test = train_test_split(ratings, test_size=0.2, random_state=seed)

    engine = object.__new__(SmarturEngine)
    engine.df = train.copy(); engine.train_data = train.copy(); engine.test_data = test.copy()
    engine.df_biz = catalog.copy(); engine._user_idx_map = None; engine._biz_idx_map = None
    engine.user_item_matrix = engine.matrix_centered = None
    engine.user_item_matrix_index = engine.user_item_matrix_columns = None
    engine.user_means = engine.knn_model = None
    engine.prepare_pearson_matrix()

    rf = SmarturContextModel(); rf.load()
    lfm = SmarturLightFMModel(); lfm.load()
    users = {p["persona_id"]: _persona_declared_context(p) for _, p in personas.iterrows()}
    candidates = catalog["business_id"].astype(str).tolist()
    popularity = train.groupby("business_id").size().to_dict()
    means = train.groupby("business_id")["stars"].mean().to_dict()
    algorithms = {name: [] for name in ("popularity", "item_mean", "lightfm", "rf", "hybrid")}
    evaluated = 0

    for uid, test_user in test.groupby("user_id"):
        relevant = set(test_user.loc[test_user.stars >= 4, "business_id"].astype(str))
        if not relevant:
            continue
        seen = set(train.loc[train.user_id == uid, "business_id"].astype(str))
        pool = [x for x in candidates if x not in seen]
        if not pool:
            continue
        ctx = users.get(uid, {})
        pop = np.array([popularity.get(x, 0) for x in pool], dtype=float)
        avg = np.array([means.get(x, train.stars.mean()) for x in pool], dtype=float)
        lfm_score = np.asarray(lfm.predict(str(uid), pool, user_context=ctx), dtype=float)
        rf_score = np.asarray(rf.predict_with_context(pool, user_context=ctx), dtype=float)
        scores = {
            "popularity": pop,
            "item_mean": avg,
            "lightfm": lfm_score,
            "rf": rf_score,
            "hybrid": 0.7 * _minmax(lfm_score) + 0.3 * _minmax(rf_score),
        }
        for name, values in scores.items():
            order = np.argsort(-np.nan_to_num(values, nan=-1e9))
            recs = [pool[i] for i in order[:k]]
            algorithms[name].append({
                "ndcg": _ndcg(recs, relevant, k),
                "recall": len(set(recs) & relevant) / len(relevant),
                "hit_rate": 1.0 if set(recs) & relevant else 0.0,
            })
        evaluated += 1

    result = {"dataset_type": "synthetic_bootstrap", "synthetic_augmented": True,
              "n_users_evaluated": evaluated, "k": k, "algorithms": {}}
    for name, rows in algorithms.items():
        result["algorithms"][name] = {
            metric: float(np.mean([r[metric] for r in rows])) if rows else 0.0
            for metric in ("ndcg", "recall", "hit_rate")
        }
    out = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models", "bootstrap_ranking_metrics.json"))
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(result, fh, indent=2, ensure_ascii=False)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return result


if __name__ == "__main__":
    run()
