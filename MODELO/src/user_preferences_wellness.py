"""
user_preferences_wellness.py — Boosts por preferencias del viajero en matchmaking wellness.

Porta user_preferences.py de ATARAXIA.
El boost de interés se subió a +0.15 para alinearse con los category bonuses ampliados.
"""
from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

INTEREST_TO_CATEGORIES: dict[str, set[str]] = {
    "naturaleza":  {"Bosque", "Montaña", "Lago", "Ecoturismo_Activo"},
    "aventura":    {"Montaña", "Ecoturismo_Activo", "Lago"},
    "relax":       {"Spa", "Termal", "Retiro_Silencio"},
    "cultural":    {"Retiro_Silencio", "Montaña"},
    "gastronomia": {"Spa", "Termal"},
    "bienestar":   {"Spa", "Termal", "Retiro_Silencio"},
    "espiritual":  {"Retiro_Silencio", "Montaña"},
}

PLACE_TO_CATEGORIES: dict[str, set[str]] = {
    "aire":        {"Bosque", "Montaña", "Lago", "Ecoturismo_Activo", "Termal"},
    "cerrado":     {"Spa", "Termal", "Retiro_Silencio"},
    "indiferente": set(),
}


def normalize_preferences(raw: dict[str, Any] | None) -> dict[str, Any] | None:
    if not raw:
        return None
    interests = raw.get("interests") or []
    if isinstance(interests, str):
        interests = [interests]
    return {
        "interests":        [str(i).lower().strip() for i in interests if i],
        "activity_level":   int(raw.get("activity_level") or 3),
        "preferred_place":  str(raw.get("preferred_place") or "indiferente").lower(),
        "has_accessibility": bool(raw.get("has_accessibility")),
    }


def apply_preference_boost(
    scores: np.ndarray,
    destinations: pd.DataFrame,
    preferences: dict[str, Any] | None,
    perfil: str,
) -> np.ndarray:
    """Ajusta scores (+15% max por interés, -8/10% por demand o accesibilidad)."""
    prefs = normalize_preferences(preferences)
    if prefs is None or len(destinations) == 0:
        return scores

    cat_col = "categoria_wellness" if "categoria_wellness" in destinations.columns else "categoria_principal"
    boosted = scores.copy()
    boost_cats: set[str] = set(PLACE_TO_CATEGORIES.get(prefs["preferred_place"], set()))

    for interest in prefs["interests"]:
        boost_cats |= INTEREST_TO_CATEGORIES.get(interest, set())

    activity = prefs["activity_level"]
    max_demand = 0.35 if activity <= 2 else (0.55 if activity <= 3 else 0.75)

    for idx, row in enumerate(destinations.itertuples(index=False)):
        row_d = row._asdict() if hasattr(row, "_asdict") else dict(zip(destinations.columns, row))
        cat = str(row_d.get(cat_col, ""))
        demand = float(row_d.get("demanda_fisica", 0.5))

        factor = 1.0
        if cat in boost_cats:
            factor += 0.15   # aumentado de 0.12 a 0.15

        if demand > max_demand and perfil in ("Burnout", "Fatiga_Fisica"):
            factor -= 0.08

        if prefs["has_accessibility"] and demand > 0.6:
            factor -= 0.10

        boosted[idx] *= factor

    lo, hi = float(boosted.min()), float(boosted.max())
    if hi > lo:
        boosted = (boosted - lo) / (hi - lo)
    return boosted
