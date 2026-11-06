"""Normas mexicanas de la PSS-10 (COVIDiSTRESS) y equivalencia con el índice de estrés de la encuesta.

El modelo de preferencias aprendió el efecto del estrés con el índice propio de la encuesta
WELLTUR (0-100, ítems inspirados en la PSS) y lo usa estandarizado (z). La app aplica la
PSS-10 oficial, así que hay que llevar el puntaje PSS-10 (0-40) a esa misma escala z.

No existe una muestra que haya respondido ambos instrumentos, por lo que se usa
equiparación lineal por normas: z = (PSS-10 - media) / DE, con la media y la DE de la
población mexicana de COVIDiSTRESS ponderadas con la mezcla de edades de la encuesta
WELLTUR. Supuesto explícito: una persona en el mismo percentil de estrés de su población
ocupa el mismo percentil en ambos instrumentos.

Fuente: COVIDiSTRESS Global Survey (Yamada et al., 2021, Scientific Data 8:3,
doi:10.1038/s41597-020-00784-9; datos en OSF, doi:10.17605/OSF.IO/Z39US), archivo final del
30 de mayo de 2020. Se descarga en data/externos/covidistress/ (no se sube a git).

Uso:
    python normas_pss10.py [ruta_csv_covidistress]
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

BASE = Path(__file__).resolve().parents[1]
CSV_DEFAULT = BASE / "data" / "externos" / "covidistress" / "covidistress_2020-05-30_final.csv"
ENCUESTA = BASE / "data" / "encuesta" / "encuesta_limpia.csv"
ARTEFACTO = BASE / "models" / "welltur_preferencias_v1.json"
SALIDA = BASE / "reports" / "normas_pss10_mexico.json"

ITEMS = [f"Scale_PSS10_UCLA_{i}" for i in range(1, 11)]
INVERTIDOS = (4, 5, 7, 8)  # puntuación oficial (Mapi, Scaling and Scoring v2.0)
GRUPOS = {  # rango de edad de la encuesta WELLTUR -> años
    "De 18 a 24 años": (18, 24), "De 25 a 34 años": (25, 34), "De 35 a 44 años": (35, 44),
    "De 45 a 54 años": (45, 54), "55 años o más": (55, 120),
}


def items_puntuados(items: pd.DataFrame) -> pd.DataFrame:
    """Ítems en escala 0-4 con 4, 5, 7 y 8 invertidos (COVIDiSTRESS los codifica 1-5)."""
    x = items.apply(pd.to_numeric, errors="coerce") - 1
    for i in INVERTIDOS:
        x.iloc[:, i - 1] = 4 - x.iloc[:, i - 1]
    return x


def puntaje_pss10(items: pd.DataFrame) -> pd.Series:
    """Total 0-40; acepta hasta 2 faltantes (media de los respondidos × 10)."""
    x = items_puntuados(items)
    validos = x.notna().sum(axis=1) >= 8
    return (x.mean(axis=1) * 10).where(validos)


def alfa_cronbach(items: pd.DataFrame) -> float:
    x = items.dropna()
    k = x.shape[1]
    return float(k / (k - 1) * (1 - x.var(ddof=1).sum() / x.sum(axis=1).var(ddof=1)))


def calcular(ruta_csv: Path | str = CSV_DEFAULT) -> dict:
    d = pd.read_csv(ruta_csv, low_memory=False, encoding="latin-1")
    mx = d[d["Country"].astype(str).str.strip().eq("Mexico")].copy()
    mx["pss10"] = puntaje_pss10(mx[ITEMS])
    mx["edad"] = pd.to_numeric(mx["Dem_age"], errors="coerce")
    mx = mx.dropna(subset=["pss10", "edad"])
    mx = mx[mx["edad"].between(18, 110)]

    items_0a4 = items_puntuados(mx[ITEMS])
    por_grupo = {}
    for rango, (lo, hi) in GRUPOS.items():
        g = mx.loc[mx["edad"].between(lo, hi), "pss10"]
        por_grupo[rango] = {"n": int(g.size), "media": round(float(g.mean()), 3), "de": round(float(g.std(ddof=1)), 3)}

    enc = pd.read_csv(ENCUESTA)
    pesos = enc["edad_rango"].value_counts(normalize=True).reindex(list(GRUPOS)).fillna(0)
    # Mezcla de normales por grupo de edad: media ponderada y varianza total (dentro + entre grupos).
    medias = np.array([por_grupo[r]["media"] for r in GRUPOS])
    des = np.array([por_grupo[r]["de"] for r in GRUPOS])
    w = pesos.to_numpy()
    media_mezcla = float((w * medias).sum())
    de_mezcla = float(np.sqrt((w * (des ** 2 + (medias - media_mezcla) ** 2)).sum()))

    return {
        "fuente": "COVIDiSTRESS Global Survey, México, 30-may-2020 (doi:10.17605/OSF.IO/Z39US)",
        "n_mexico": int(mx.shape[0]),
        "alfa_cronbach": round(alfa_cronbach(items_0a4.loc[mx.index]), 3),
        "media_general": round(float(mx["pss10"].mean()), 3),
        "de_general": round(float(mx["pss10"].std(ddof=1)), 3),
        "por_grupo_edad": por_grupo,
        "pesos_edad_encuesta": {r: round(float(p), 4) for r, p in pesos.items()},
        "equivalencia": {
            "metodo": "equiparación lineal por normas ponderadas por la edad de la encuesta WELLTUR",
            "media": round(media_mezcla, 3),
            "de": round(de_mezcla, 3),
        },
        "advertencia": ("Datos de abril-mayo de 2020 (pandemia), muestra en línea no probabilística y "
                        "72 % mujeres: el estrés de referencia puede estar algo elevado."),
    }


def actualizar_artefacto(normas: dict, ruta: Path = ARTEFACTO) -> None:
    artefacto = json.loads(ruta.read_text(encoding="utf-8"))
    artefacto["equivalencia_pss10"] = {
        **normas["equivalencia"],
        "fuente": normas["fuente"],
        "n": normas["n_mexico"],
    }
    ruta.write_text(json.dumps(artefacto, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    normas = calcular(sys.argv[1] if len(sys.argv) > 1 else CSV_DEFAULT)
    SALIDA.write_text(json.dumps(normas, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    actualizar_artefacto(normas)
    print(json.dumps(normas, ensure_ascii=False, indent=2))
