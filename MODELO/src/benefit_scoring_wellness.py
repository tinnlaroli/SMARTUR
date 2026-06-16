"""
benefit_scoring_wellness.py — Puntúa destinos por alineación terapéutica.

Porta benefit_scoring.py de ATARAXIA con category bonuses aumentados a ±0.20-0.25
(eran ±0.12) para que el tipo de lugar tenga impacto real en el ranking.
El YAML en data/wellness/benefit_profiles.yaml define los pesos por perfil;
si se especifican valores más bajos ahí, esta capa aplica un piso mínimo de ±0.20.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import yaml

_ROOT = Path(__file__).resolve().parent.parent
_BENEFIT_YAML = _ROOT / "data" / "wellness" / "benefit_profiles.yaml"

DIM_COLS = ["nivel_aislamiento", "restauracion_pasiva", "demanda_fisica"]

# Bonus/penalty mínimo garantizado por categoría principal
# Si el YAML especifica menos, se usa este valor mínimo (mejora vs. ATARAXIA)
MIN_CATEGORY_BONUS = 0.20
MIN_CATEGORY_PENALTY = -0.20


@lru_cache(maxsize=1)
def load_benefit_profiles() -> dict[str, Any]:
    if not _BENEFIT_YAML.exists():
        return _default_profiles()
    with _BENEFIT_YAML.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def _default_profiles() -> dict[str, Any]:
    return {
        "Burnout": {
            "description": "Recuperación cognitiva — silencio, baja demanda, retiro",
            "weights": {"restauracion_pasiva": 0.45, "nivel_aislamiento": 0.25, "demanda_fisica": -0.35},
            "category_bonus": {"Retiro_Silencio": 0.22, "Spa": 0.20, "Termal": 0.20},
        },
        "Fatiga_Fisica": {
            "description": "Recuperación corporal — termal, spa, mínimo esfuerzo",
            "weights": {"restauracion_pasiva": 0.35, "demanda_fisica": -0.45, "nivel_aislamiento": 0.15},
            "category_bonus": {"Termal": 0.25, "Spa": 0.22, "Lago": 0.20},
        },
        "Hiperactividad_Ansiosa": {
            "description": "Regulación — aislamiento, estructura pasiva",
            "weights": {"nivel_aislamiento": 0.35, "restauracion_pasiva": 0.30, "demanda_fisica": -0.25},
            "category_bonus": {"Retiro_Silencio": 0.22, "Bosque": 0.20, "Montaña": 0.18},
            "category_penalty": {"Ecoturismo_Activo": -0.20},
        },
    }


def _enforce_min_bonus(
    cat_bonus: dict[str, float],
    cat_penalty: dict[str, float],
) -> tuple[dict[str, float], dict[str, float]]:
    """Garantiza que los bonuses/penalties no sean menores al mínimo definido."""
    bonus_out = {k: max(v, MIN_CATEGORY_BONUS) for k, v in cat_bonus.items()}
    penalty_out = {k: min(v, MIN_CATEGORY_PENALTY) for k, v in cat_penalty.items()}
    return bonus_out, penalty_out


def compute_benefit_scores(
    destinations: pd.DataFrame,
    perfil: str,
) -> np.ndarray:
    """Score 0-1 por destino: qué tan óptimo es para el perfil dado."""
    profiles = load_benefit_profiles()
    cfg = profiles.get(perfil) or profiles.get("Burnout", {})
    weights = cfg.get("weights") or {}
    raw_bonus = cfg.get("category_bonus") or {}
    raw_penalty = cfg.get("category_penalty") or {}

    cat_bonus, cat_penalty = _enforce_min_bonus(raw_bonus, raw_penalty)

    scores = np.zeros(len(destinations), dtype=float)
    cat_col = "categoria_wellness" if "categoria_wellness" in destinations.columns else "categoria_principal"

    for idx, row in enumerate(destinations.itertuples(index=False)):
        row_d = row._asdict() if hasattr(row, "_asdict") else dict(zip(destinations.columns, row))
        s = 0.0
        for dim, w in weights.items():
            if dim not in row_d:
                continue
            val = float(row_d[dim])
            w = float(w)
            if dim == "demanda_fisica" and w < 0:
                s += abs(w) * (1.0 - val)
            else:
                s += w * val
        cat = str(row_d.get(cat_col, ""))
        s += float(cat_bonus.get(cat, 0.0))
        s += float(cat_penalty.get(cat, 0.0))
        scores[idx] = s

    lo, hi = float(scores.min()), float(scores.max())
    if hi > lo:
        scores = (scores - lo) / (hi - lo)
    else:
        scores = np.full_like(scores, 0.5)
    return scores


def profile_benefit_description(perfil: str) -> str:
    profiles = load_benefit_profiles()
    cfg = profiles.get(perfil) or {}
    return str(cfg.get("description", ""))
