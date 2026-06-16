"""
restmex_enricher.py — Deriva wellness_sentiment_score por lugar desde Rest-Mex 2025.

Carga las 243k reseñas, filtra las de tipo Attractive, busca keywords de bienestar
y promedia la Polarity para producir un score por Town. El output enriquece
destinos_wellness.csv con una columna wellness_sentiment_score.

Uso:
    python restmex_enricher.py               # analiza y exporta
    python restmex_enricher.py --report      # solo imprime análisis sin exportar
    python restmex_enricher.py --top 20      # muestra top-N lugares por score
"""
from __future__ import annotations

import argparse
import logging
from pathlib import Path

import numpy as np
import pandas as pd

_logger = logging.getLogger("restmex-enricher")

_SRC = Path(__file__).resolve().parent
_ROOT = _SRC.parent
_DATA = _ROOT / "data"
_RESTMEX_CSV = _DATA / "Rest-Mex_2025_Train_DataSet" / "Rest-Mex_2025_train.csv"
_DESTINOS_CSV = _DATA / "wellness" / "destinos_wellness.csv"
_OUTPUT_CSV = _DATA / "wellness" / "destinos_wellness_enriched.csv"
_SCORES_JSON = _DATA / "wellness" / "wellness_scores_by_town.json"

# Términos positivos de bienestar — presencia en review aumenta el peso
WELLNESS_KEYWORDS_POS = [
    "tranquilo", "tranquila", "tranquilidad",
    "relajante", "relajante", "relajacion", "relajación",
    "silencio", "silencioso", "silenciosa",
    "naturaleza",
    "descanso", "descansar", "descansado",
    "paz", "pacifico", "pacífico",
    "aislado", "aislamiento",
    "refugio",
    "meditacion", "meditación",
    "espiritual", "espiritualidad",
    "sanacion", "sanación", "sanar",
    "bienestar",
    "recargar",
    "contemplacion", "contemplación",
    "nirvana",
    "sereno", "serenidad", "serena",
    "apacible",
]

# Términos negativos que indican lo contrario al bienestar
WELLNESS_KEYWORDS_NEG = [
    "ruidoso", "ruido", "bullicio",
    "aglomerado", "aglomeración", "multitud",
    "estresante",
    "concurrido",
]


def _normalize_text(s: str) -> str:
    import unicodedata
    return unicodedata.normalize("NFKD", str(s).lower()).encode("ascii", "ignore").decode("ascii")


def _wellness_keyword_score(text: str) -> float:
    """Retorna 1.0 si el texto contiene keywords positivos, -0.5 si negativos, 0 si ninguno."""
    norm = _normalize_text(text)
    has_pos = any(kw in norm for kw in WELLNESS_KEYWORDS_POS)
    has_neg = any(kw in norm for kw in WELLNESS_KEYWORDS_NEG)
    if has_pos and not has_neg:
        return 1.0
    if has_pos and has_neg:
        return 0.5
    if has_neg:
        return -0.5
    return 0.0


def load_restmex(csv_path: Path = _RESTMEX_CSV) -> pd.DataFrame:
    if not csv_path.exists():
        raise FileNotFoundError(f"Rest-Mex CSV no encontrado: {csv_path}")
    df = pd.read_csv(csv_path, encoding="utf-8")
    _logger.info("Rest-Mex cargado: %d reseñas", len(df))
    return df


def compute_wellness_scores(df: pd.DataFrame, min_reviews: int = 3) -> pd.DataFrame:
    """
    Para cada Town en reviews de tipo Attractive, calcula:
      - wellness_sentiment_score: promedio de Polarity de reviews con keywords wellness
      - wellness_review_count: cuántas reviews con keywords se usaron
      - total_review_count: total reviews del Town en Attractive
      - keyword_hit_rate: fracción de reviews con keywords positivos

    Solo se incluyen Towns con al menos `min_reviews` reseñas totales.
    """
    attractive = df[df["Type"] == "Attractive"].copy()
    _logger.info("Reseñas Attractive: %d", len(attractive))

    attractive["full_text"] = (
        attractive["Title"].fillna("") + " " + attractive["Review"].fillna("")
    )
    attractive["kw_score"] = attractive["full_text"].apply(_wellness_keyword_score)
    attractive["has_wellness"] = attractive["kw_score"] > 0

    rows = []
    for town, group in attractive.groupby("Town"):
        total = len(group)
        if total < min_reviews:
            continue

        wellness_reviews = group[group["has_wellness"]]
        if len(wellness_reviews) == 0:
            # No hay reseñas con keywords de bienestar — score basado en Polarity general
            score = float(group["Polarity"].mean()) / 5.0 * 0.6  # máximo 0.60 sin keywords
            wcount = 0
            hit_rate = 0.0
        else:
            # Score ponderado: Polarity normalizada × keyword_score
            weighted = (wellness_reviews["Polarity"] / 5.0) * wellness_reviews["kw_score"]
            score = float(weighted.mean())
            score = min(1.0, max(0.0, score))
            wcount = len(wellness_reviews)
            hit_rate = round(wcount / total, 3)

        rows.append({
            "town": town,
            "wellness_sentiment_score": round(score, 4),
            "wellness_review_count": wcount,
            "total_review_count": total,
            "keyword_hit_rate": hit_rate,
            "avg_polarity_all": round(float(group["Polarity"].mean()), 3),
            "avg_polarity_wellness": round(float(wellness_reviews["Polarity"].mean()), 3) if len(wellness_reviews) > 0 else None,
        })

    result = pd.DataFrame(rows).sort_values("wellness_sentiment_score", ascending=False)
    _logger.info("Towns con score wellness: %d", len(result))
    return result


def enrich_destinos(
    scores_df: pd.DataFrame,
    destinos_path: Path = _DESTINOS_CSV,
) -> pd.DataFrame:
    """
    Hace match entre destinos_wellness.csv (nombre_lugar/estado) y el score por Town.
    Match fuzzy: verifica si el town aparece en el nombre_lugar o viceversa.
    """
    if not destinos_path.exists():
        _logger.warning("destinos_wellness.csv no encontrado — retornando scores sin merge")
        return scores_df

    destinos = pd.read_csv(destinos_path, encoding="utf-8")

    # Crear lookup normalizado: town → score
    scores_lookup: dict[str, float] = {}
    for _, row in scores_df.iterrows():
        scores_lookup[_normalize_text(str(row["town"]))] = float(row["wellness_sentiment_score"])

    def _find_score(nombre: str, estado: str) -> float | None:
        norm_nombre = _normalize_text(str(nombre))
        norm_estado = _normalize_text(str(estado))
        # Exact match on nombre
        if norm_nombre in scores_lookup:
            return scores_lookup[norm_nombre]
        # Partial: town contained in nombre
        for town_norm, score in scores_lookup.items():
            if town_norm in norm_nombre or norm_nombre in town_norm:
                return score
        # Try estado as fallback (state-level average)
        state_scores = [v for k, v in scores_lookup.items() if norm_estado in k or k in norm_estado]
        if state_scores:
            return round(float(np.mean(state_scores)), 4)
        return None

    destinos["wellness_sentiment_score"] = destinos.apply(
        lambda r: _find_score(r["nombre_lugar"], r.get("estado", "")), axis=1
    )
    # Fill unmatched with median
    med = destinos["wellness_sentiment_score"].median()
    destinos["wellness_sentiment_score"] = destinos["wellness_sentiment_score"].fillna(round(med, 4))

    matched = destinos["wellness_sentiment_score"].notna().sum()
    _logger.info(
        "Destinos enriquecidos: %d/%d con score wellness",
        matched, len(destinos),
    )
    return destinos


def print_report(scores_df: pd.DataFrame, top_n: int = 20) -> None:
    print(f"\n{'─'*60}")
    print(f"{'TOP LUGARES DE BIENESTAR (Rest-Mex 2025)':^60}")
    print(f"{'─'*60}")
    top = scores_df.head(top_n)
    for _, row in top.iterrows():
        bar = "█" * int(row["wellness_sentiment_score"] * 20)
        print(
            f"  {row['town']:<30} {row['wellness_sentiment_score']:.3f} {bar}"
        )
    print(f"\nTotal towns analizados: {len(scores_df)}")
    print(f"Score promedio: {scores_df['wellness_sentiment_score'].mean():.3f}")
    print(f"Score máximo:   {scores_df['wellness_sentiment_score'].max():.3f}")

    # Derivar ideal vectors summary (qué categorías tienen score alto)
    print(f"\n{'─'*60}")
    print("VALIDACIÓN DE VECTORES IDEALES:")
    print("  Towns con score ≥ 0.75 (candidatos Burnout/Calma):")
    high = scores_df[scores_df["wellness_sentiment_score"] >= 0.75]
    print(f"    {len(high)} towns — {', '.join(high['town'].head(5).tolist())}")
    print("  Towns con score 0.55-0.75 (Fatiga_Fisica/Restauración):")
    mid = scores_df[
        (scores_df["wellness_sentiment_score"] >= 0.55) &
        (scores_df["wellness_sentiment_score"] < 0.75)
    ]
    print(f"    {len(mid)} towns — {', '.join(mid['town'].head(5).tolist())}")


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", action="store_true", help="Solo análisis, sin exportar")
    parser.add_argument("--top", type=int, default=20, help="Top-N lugares a mostrar")
    parser.add_argument("--min-reviews", type=int, default=3, help="Mínimo de reseñas por town")
    args = parser.parse_args()

    df = load_restmex()
    scores_df = compute_wellness_scores(df, min_reviews=args.min_reviews)

    if args.report:
        print_report(scores_df, top_n=args.top)
        return

    # Export scores por town
    _SCORES_JSON.parent.mkdir(parents=True, exist_ok=True)
    scores_df.to_json(_SCORES_JSON, orient="records", force_ascii=False, indent=2)
    _logger.info("Scores por town → %s", _SCORES_JSON)

    # Enrich destinos_wellness.csv
    enriched = enrich_destinos(scores_df)
    enriched.to_csv(_OUTPUT_CSV, index=False, encoding="utf-8")
    _logger.info("destinos_wellness_enriched.csv → %s", _OUTPUT_CSV)

    print_report(scores_df, top_n=args.top)


if __name__ == "__main__":
    main()
