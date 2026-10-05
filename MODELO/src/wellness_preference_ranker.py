"""Transparent content ranker for explicit Welltur travel preferences.

This is a deterministic recommender, not a stress or health classifier.
"""
from __future__ import annotations

from typing import Any
import unicodedata

WELLNESS_DIMENSIONS = {
    "physical", "mental", "emotional", "spiritual", "social", "environmental"
}


def _normalize(value: Any) -> str:
    raw = unicodedata.normalize("NFKD", str(value or ""))
    return "".join(ch for ch in raw if not unicodedata.combining(ch)).strip().casefold()


def _activity_fit(demand: float, preference: str) -> float:
    if preference == "low":
        return max(0.0, 1.0 - demand)
    if preference == "high":
        return demand
    return max(0.0, 1.0 - abs(demand - 0.5) * 2.0)


def _normalize_demand(value: Any) -> float | None:
    if value is None:
        return None
    demand = min(1.0, max(0.0, float(value)))
    # New catalog entries use three labeled effort levels. Snap legacy numeric
    # values to the same ordinal scale instead of implying 5%-level precision.
    return min((0.0, 0.5, 1.0), key=lambda level: abs(level - demand))


def recommend_from_preferences(
    destinations: list[dict[str, Any]],
    preferences: dict[str, Any],
    top_n: int = 3,
) -> list[dict[str, Any]]:
    requested = set(preferences.get("wellness_dimensions") or [])
    activity = str(preferences.get("activity_level") or "moderate")
    region = _normalize(preferences.get("region_filter"))
    if not requested or len(requested) > 3 or not requested.issubset(WELLNESS_DIMENSIONS):
        raise ValueError("Selecciona entre una y tres dimensiones de bienestar válidas.")
    if activity not in {"low", "moderate", "high"}:
        raise ValueError("activity_level debe ser low, moderate o high.")

    candidates = destinations
    if region:
        candidates = [d for d in destinations if _normalize(d.get("estado")) == region]

    ranked: list[tuple[float, float | None, dict[str, Any], float | None, set[str]]] = []
    for destination in candidates:
        dimensions = set(destination.get("wellness_dimensions") or []) & WELLNESS_DIMENSIONS
        if not dimensions:
            continue
        overlap = len(requested & dimensions) / len(requested)
        if overlap == 0:
            continue
        demand = _normalize_demand(destination.get("demanda_fisica"))
        activity_fit = (
            _activity_fit(demand, activity)
            if demand is not None
            else None
        )
        ranked.append((overlap, activity_fit, destination, demand, dimensions))

    ranked.sort(key=lambda pair: (
        -pair[0],
        -(pair[1] if pair[1] is not None else -1.0),
        _normalize(pair[2].get("nombre_lugar")),
    ))
    results = []
    for rank, (overlap, activity_fit, item, demand, dimensions) in enumerate(ranked[:top_n], start=1):
        results.append({
            "id_destino": str(item["id_destino"]),
            "nombre_lugar": str(item.get("nombre_lugar") or ""),
            "estado": str(item.get("estado") or ""),
            "categoria_wellness": str(item.get("categoria_wellness") or ""),
            "match_pct": round(overlap * 100, 1),
            "rank": rank,
            "demanda_fisica": demand,
            "wellness_dimensions": sorted(requested & dimensions),
            "image_url": item.get("image_url"),
            "lat": item.get("lat"),
            "lon": item.get("lon"),
            "descripcion_bienestar": str(item.get("descripcion_bienestar") or ""),
        })
    return results
