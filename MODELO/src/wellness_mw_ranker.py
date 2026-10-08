"""Preference-first M/W ranker for reviewed WELLTUR experiences.

This transparent content baseline is the operational fallback while no real
traveler choices exist. The learned artifact in the research workspace is
synthetic-only and must never be used to rank the real catalogue.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any
import unicodedata

MOTIVES = {f"M{i}" for i in range(1, 10)}
MODALITIES = {f"W{i}" for i in range(1, 8)}


def _normalize(value: Any) -> str:
    raw = unicodedata.normalize("NFKD", str(value or ""))
    return "".join(char for char in raw if not unicodedata.combining(char)).strip().casefold()


def _priority_weights(codes: list[str]) -> dict[str, int]:
    return {code: 3 - index for index, code in enumerate(codes)}


def _effort_level(value: Any) -> int | None:
    if value is None:
        return None
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None
    return min((1, 2, 3), key=lambda level: abs((level - 1) / 2 - numeric))


def _load_promoted_model() -> dict[str, Any] | None:
    """Load only a real-feedback artifact that passed the held-out promotion gate."""
    path = Path(os.environ.get(
        "WELLNESS_MW_MODEL_PATH",
        Path(__file__).resolve().parents[1] / "models" / "wellness_mw_ranker.joblib",
    ))
    if not path.is_file():
        return None
    try:
        import joblib
        artifact = joblib.load(path)
        expected_tags = [*[f"M{i}" for i in range(1, 10)], *[f"W{i}" for i in range(1, 8)]]
        evaluation = artifact.get("evaluation") or {}
        weights = artifact.get("weights")
        if (artifact.get("validated_for_serving") is not True or
            artifact.get("training_scope") != "real_opt_in_feedback" or
            artifact.get("tag_schema") != expected_tags or
            len(weights or []) != len(expected_tags) or
            int(evaluation.get("holdout_users", 0)) < 30 or
            float(evaluation.get("ndcg_at_5_delta", 0)) < 0.02):
            return None
        return artifact
    except Exception:
        return None


def recommend_from_mw_preferences(
    destinations: list[dict[str, Any]],
    preferences: dict[str, Any],
    top_n: int = 5,
    model_artifact: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Rank admin-approved, M/W-reviewed experiences by declared priorities.

    M and W are kept as separate axes. This method does not infer a latent
    traveler class or promise an outcome; it returns auditable tag matches.
    """
    if not isinstance(preferences, dict):
        raise ValueError("preferences debe ser un objeto.")
    motives = preferences.get("motive_priorities") or []
    modalities = preferences.get("modality_preferences") or []
    if not isinstance(motives, list) or not isinstance(modalities, list):
        raise ValueError("motive_priorities y modality_preferences deben ser listas ordenadas.")
    if len(motives) > 3 or len(modalities) > 3:
        raise ValueError("Selecciona hasta tres prioridades M y tres modalidades W.")
    if len(set(motives)) != len(motives) or len(set(modalities)) != len(modalities):
        raise ValueError("No repitas prioridades.")
    if not set(motives).issubset(MOTIVES) or not set(modalities).issubset(MODALITIES):
        raise ValueError("Hay códigos M/W desconocidos.")
    if not motives and not modalities:
        raise ValueError("Selecciona al menos una prioridad M o modalidad W.")
    top_n = int(top_n)
    if top_n < 1 or top_n > 10:
        raise ValueError("top_n debe estar entre 1 y 10.")
    max_effort = preferences.get("max_effort", 3)
    if max_effort not in (1, 2, 3):
        raise ValueError("max_effort debe ser 1, 2 o 3.")
    needs_accessible = bool(preferences.get("needs_accessible", False))
    region_filter = _normalize(preferences.get("region_filter"))

    motive_weights = _priority_weights(motives)
    modality_weights = _priority_weights(modalities)
    max_score = sum(motive_weights.values()) + sum(modality_weights.values())
    model = model_artifact if model_artifact and model_artifact.get("validated_for_serving") is True else _load_promoted_model()
    tag_order = [*[f"M{i}" for i in range(1, 10)], *[f"W{i}" for i in range(1, 8)]]
    trained_weights = model.get("weights") if model else None
    ranked: list[tuple[float, int, str, dict[str, Any], list[str], list[str], dict[str, str]]] = []

    for place in destinations:
        if place.get("is_wellness") is not True or place.get("wellness_status") != "approved":
            continue
        if not place.get("wellness_mw_reviewed_at") or not place.get("wellness_mw_evidence"):
            continue
        if region_filter and _normalize(place.get("estado")) != region_filter:
            continue
        accessible = place.get("is_accessible") is True
        if needs_accessible and not accessible:
            continue
        effort = _effort_level(place.get("demanda_fisica"))
        if effort is not None and effort > max_effort:
            continue

        place_motives = set(place.get("wellness_motives") or []) & MOTIVES
        place_modalities = set(place.get("wellness_modalities") or []) & MODALITIES
        evidence = place.get("wellness_mw_evidence") or {}
        evidence = evidence if isinstance(evidence, dict) else {}
        if any(not isinstance(evidence.get(code), str) or len(evidence[code].strip()) < 10
               for code in place_motives | place_modalities):
            continue
        matched_m = [code for code in motives if code in place_motives]
        matched_w = [code for code in modalities if code in place_modalities]
        score = sum(motive_weights[code] for code in matched_m)
        score += sum(modality_weights[code] for code in matched_w)
        if score <= 0:
            continue
        priority_vector = {**motive_weights, **modality_weights}
        learned_score = sum(
            priority_vector.get(code, 0) * float(trained_weights[index])
            for index, code in enumerate(tag_order)
            if code in place_motives or code in place_modalities
        ) if trained_weights else float(score)
        matched_evidence = {code: evidence[code] for code in [*matched_m, *matched_w]}
        ranked.append((learned_score, score, _normalize(place.get("nombre_lugar")), place, matched_m, matched_w, matched_evidence))

    ranked.sort(key=lambda row: (-row[0], -row[1], row[2], str(row[3].get("id_destino", ""))))
    results = []
    for ranking_score, score, _, place, matched_m, matched_w, match_evidence in ranked[:top_n]:
        results.append({
            "id_destino": str(place["id_destino"]),
            "nombre_lugar": str(place.get("nombre_lugar") or ""),
            "estado": str(place.get("estado") or ""),
            "categoria_wellness": str(place.get("categoria_wellness") or ""),
            "rank": len(results) + 1,
            "match_pct": round(score / max_score * 100, 1),
            "score": score,
            "ranking_score": round(float(ranking_score), 6),
            "matched_M": matched_m,
            "matched_W": matched_w,
            "place_motives": sorted(set(place.get("wellness_motives") or []) & MOTIVES),
            "place_modalities": sorted(set(place.get("wellness_modalities") or []) & MODALITIES),
            "match_evidence": match_evidence,
            "demanda_fisica": _effort_level(place.get("demanda_fisica")),
            "image_url": place.get("image_url"),
            "lat": place.get("lat"),
            "lon": place.get("lon"),
            "descripcion_bienestar": str(place.get("descripcion_bienestar") or ""),
        })
    return {
        "algorithm": "learned_pairwise_mw_v1" if model else "explicit_mw_content_baseline_v1",
        "ml_status": "trained_on_real_opt_in_feedback" if model else "not_trained_on_real_traveler_feedback",
        "motive_priorities": motives,
        "modality_preferences": modalities,
        "destinations": results,
        "notice": "Coincidencias con preferencias declaradas y etiquetas revisadas; no es un perfil psicológico ni una promesa de bienestar.",
    }
