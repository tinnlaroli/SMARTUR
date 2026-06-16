"""
wellness_matchmaker.py — Matchmaking de destinos wellness con soft penalties.

Mejoras vs. ATARAXIA:
  - Filtros duros → soft penalties (-0.08 a -0.15 en score, no exclusión)
  - Category bonuses ampliados a ±0.20-0.25 (eran ±0.12)
  - Integración de wellness_sentiment_score como 4ª dimensión (peso 0.10)
  - Vectores ideales derivables desde restmex_enricher (en lugar de arbitrarios)
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

from benefit_scoring_wellness import compute_benefit_scores, profile_benefit_description
from user_preferences_wellness import apply_preference_boost

_SRC = Path(__file__).resolve().parent
_ROOT = _SRC.parent
_DESTINOS_CSV = _ROOT / "data" / "wellness" / "destinos_wellness_enriched.csv"
_DESTINOS_FALLBACK = _ROOT / "data" / "wellness" / "destinos_wellness.csv"

STRESS_PROFILES = ("Burnout", "Fatiga_Fisica", "Hiperactividad_Ansiosa")

# Soft penalties: umbrales que reducen el score pero no excluyen el destino
PROFILE_SOFT_RULES: dict[str, dict[str, Any]] = {
    "Burnout": {
        "soft_min_restauracion": 0.55,      # penalty si < 0.55
        "soft_max_demanda": 0.45,            # penalty si > 0.45
        "boost_categories": {"Retiro_Silencio", "Spa", "Termal"},
        "penalty_categories": set(),
    },
    "Fatiga_Fisica": {
        "soft_max_demanda": 0.38,
        "boost_categories": {"Termal", "Spa", "Lago"},
        "penalty_categories": set(),
    },
    "Hiperactividad_Ansiosa": {
        "soft_min_aislamiento": 0.45,
        "soft_max_demanda": 0.55,
        "boost_categories": {"Retiro_Silencio", "Bosque", "Montaña"},
        "penalty_categories": {"Ecoturismo_Activo"},
    },
}

# Vectores ideales [aislamiento, restauracion, demanda] — validados con Rest-Mex
# Derivados empíricamente: places con Polarity >= 4.5 + wellness keywords
PROFILE_IDEAL: dict[str, np.ndarray] = {
    "Burnout":              np.array([0.75, 0.90, 0.20]),
    "Fatiga_Fisica":        np.array([0.55, 0.85, 0.15]),
    "Hiperactividad_Ansiosa": np.array([0.70, 0.75, 0.35]),
}

# Pesos del score final
W_BENEFIT    = 0.50
W_ALIGNMENT  = 0.35
W_CONFIDENCE = 0.10  # reducido para dar lugar a sentiment
W_SENTIMENT  = 0.05  # 4ª dimensión Rest-Mex


def _norm_q(value: int, lo: int = 1, hi: int = 4) -> float:
    if hi <= lo:
        return 0.5
    return float(value - lo) / float(hi - lo)


def build_user_vector(q1: int, q2: int, q3: int, q4: int, perfil: str) -> np.ndarray:
    """
    Mezcla el vector ideal del perfil con la señal de las respuestas Q.
    Formula: 0.60 × ideal_base + 0.40 × q_signal
    """
    base = PROFILE_IDEAL.get(perfil, PROFILE_IDEAL["Burnout"]).copy()
    q_signal = np.array([
        1.0 - _norm_q(q1),   # aislamiento: menos energía → más aislamiento
        _norm_q(q3),          # restauracion: más rumiación → más restauración pasiva
        1.0 - _norm_q(q2),   # demanda física: más tensión → menos demanda
    ])
    blended = 0.60 * base + 0.40 * q_signal
    return np.clip(blended, 0.0, 1.0)


def _apply_soft_penalties(
    scores: np.ndarray,
    df: pd.DataFrame,
    perfil: str,
) -> np.ndarray:
    """
    Aplica penalizaciones suaves (-0.08 a -0.15) por incumplimiento de umbrales.
    NO excluye destinos — solo los baja en el ranking.
    """
    rules = PROFILE_SOFT_RULES.get(perfil, {})
    out = scores.copy()

    for i, row in enumerate(df.itertuples(index=False)):
        row_d = row._asdict() if hasattr(row, "_asdict") else dict(zip(df.columns, row))
        rest = float(row_d.get("restauracion_pasiva", 0.5))
        demanda = float(row_d.get("demanda_fisica", 0.5))
        aisl = float(row_d.get("nivel_aislamiento", 0.5))
        cat = str(row_d.get("categoria_wellness") or row_d.get("categoria_principal", ""))

        # Soft penalties
        if "soft_min_restauracion" in rules and rest < rules["soft_min_restauracion"]:
            deficit = rules["soft_min_restauracion"] - rest
            out[i] -= 0.08 + 0.10 * deficit  # hasta -0.18 en el peor caso

        if "soft_max_demanda" in rules and demanda > rules["soft_max_demanda"]:
            excess = demanda - rules["soft_max_demanda"]
            out[i] -= 0.08 + 0.10 * excess

        if "soft_min_aislamiento" in rules and aisl < rules["soft_min_aislamiento"]:
            deficit = rules["soft_min_aislamiento"] - aisl
            out[i] -= 0.08 + 0.08 * deficit

        # Category bonuses/penalties — ahora ±0.20-0.25
        if cat in rules.get("boost_categories", set()):
            out[i] += 0.22
        if cat in rules.get("penalty_categories", set()):
            out[i] -= 0.20

    return out


def _dest_matrix(df: pd.DataFrame) -> np.ndarray:
    return df[["nivel_aislamiento", "restauracion_pasiva", "demanda_fisica"]].astype(float).values


def _diversify_top(
    df: pd.DataFrame,
    order: np.ndarray,
    top_n: int,
    max_per_category: int = 1,
) -> list[int]:
    picked: list[int] = []
    cat_count: dict[str, int] = {}
    cat_col = "categoria_wellness" if "categoria_wellness" in df.columns else "categoria_principal"
    for idx in order:
        if len(picked) >= top_n:
            break
        cat = str(df.iloc[int(idx)].get(cat_col, ""))
        if cat_count.get(cat, 0) >= max_per_category:
            continue
        picked.append(int(idx))
        cat_count[cat] = cat_count.get(cat, 0) + 1
    for idx in order:
        if int(idx) not in picked:
            picked.append(int(idx))
        if len(picked) >= top_n:
            break
    return picked


def load_destinations() -> pd.DataFrame:
    """Carga destinos wellness enriquecidos (con wellness_sentiment_score si existen)."""
    path = _DESTINOS_CSV if _DESTINOS_CSV.exists() else _DESTINOS_FALLBACK
    if not path.exists():
        return pd.DataFrame()
    df = pd.read_csv(path, encoding="utf-8")
    if "wellness_sentiment_score" not in df.columns:
        df["wellness_sentiment_score"] = 0.5
    return df


def recommend_wellness(
    destinations: pd.DataFrame,
    perfil: str,
    q1: int,
    q2: int,
    q3: int,
    q4: int,
    top_n: int = 3,
    stress_confidence: float | None = None,
    user_preferences: dict[str, Any] | None = None,
    region_filter: str | None = None,
) -> list[dict[str, Any]]:
    """
    Recomienda destinos wellness para el perfil dado.

    Args:
        destinations: DataFrame con columnas nivel_aislamiento, restauracion_pasiva,
                      demanda_fisica, wellness_sentiment_score, categoria_wellness/principal.
        perfil: nombre técnico interno ('Burnout', 'Fatiga_Fisica', 'Hiperactividad_Ansiosa').
        q1-q4: respuestas del usuario (1-4).
        top_n: número de recomendaciones.
        stress_confidence: confianza del clasificador ML (0-1).
        user_preferences: dict con interests, activity_level, etc.
        region_filter: si se proporciona, prioriza (no excluye) destinos de ese estado.

    Returns:
        Lista de dicts con campos: id_destino, nombre_lugar, match_pct, etc.
    """
    if destinations.empty:
        return []

    df = destinations.copy()
    cat_col = "categoria_wellness" if "categoria_wellness" in df.columns else "categoria_principal"

    # Priorizar región si se especifica (soft: clone ponderado, no exclusión)
    regional_boost = np.zeros(len(df))
    if region_filter:
        mask = df.get("estado", pd.Series([""] * len(df))).str.lower() == region_filter.lower()
        regional_boost[mask] = 0.05

    user_vec = build_user_vector(q1, q2, q3, q4, perfil).reshape(1, -1)
    dest_mat = _dest_matrix(df)

    alignment = cosine_similarity(dest_mat, user_vec).ravel()
    alignment = np.clip(alignment, 0.0, 1.0)

    benefit = compute_benefit_scores(df, perfil)
    conf = float(stress_confidence) if stress_confidence is not None else 1.0
    sentiment = df["wellness_sentiment_score"].astype(float).fillna(0.5).values

    final = (
        W_BENEFIT * benefit
        + W_ALIGNMENT * alignment
        + W_CONFIDENCE * conf * 0.1
        + W_SENTIMENT * sentiment
        + regional_boost
    )

    final = _apply_soft_penalties(final, df, perfil)
    final = apply_preference_boost(final, df, user_preferences, perfil)
    final = np.clip(final, 0.0, 1.0)

    if final.max() > 0:
        match_pct = (final / final.max()) * 100.0
        beneficio_pct = benefit * 100.0
    else:
        match_pct = np.zeros_like(final)
        beneficio_pct = np.zeros_like(final)

    order = np.argsort(-final)
    top_indices = _diversify_top(df, order, top_n)

    beneficio_desc = profile_benefit_description(perfil)
    results = []
    for rank, idx in enumerate(top_indices, start=1):
        row = df.iloc[int(idx)]
        results.append({
            "id_destino": str(row.get("id_destino", row.get("dest_id", f"D-{idx}"))),
            "nombre_lugar": str(row.get("nombre_lugar", "")),
            "estado": str(row.get("estado", "")),
            "categoria_wellness": str(row.get(cat_col, "")),
            "match_pct": round(float(match_pct[idx]), 1),
            "beneficio_optimo_pct": round(float(beneficio_pct[idx]), 1),
            "alineacion_pct": round(float(alignment[idx]) * 100.0, 1),
            "wellness_sentiment_score": round(float(sentiment[idx]), 3),
            "rank": rank,
            "nivel_aislamiento": float(row["nivel_aislamiento"]),
            "restauracion_pasiva": float(row["restauracion_pasiva"]),
            "demanda_fisica": float(row["demanda_fisica"]),
            "lat": float(row["lat"]) if pd.notna(row.get("lat")) else None,
            "lon": float(row["lon"]) if pd.notna(row.get("lon")) else None,
            "descripcion_bienestar": str(row.get("descripcion_bienestar") or row.get("descripcion") or ""),
            "beneficio_descripcion": beneficio_desc,
        })
    return results
