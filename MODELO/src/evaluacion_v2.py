"""Evaluación offline del ranker WELLTUR v2 con las personas reales de la encuesta.

Cada persona encuestada se usa como consulta: el ranker recibe solo su índice de estrés
(sin sus respuestas de P10) y recomienda 5 lugares del catálogo DENUE. Un lugar cuenta
como relevante si su categoría corresponde a un tipo de experiencia que esa persona
eligió en P10. Se compara con el mismo ranker sin estrés (popularidad) y con un orden
aleatorio. Además reporta propiedades operativas: % MiPyME, cobertura y municipios.
"""
from __future__ import annotations

import json

import numpy as np
import pandas as pd

from encuesta_etl import PREF_A_W
from welltur_ranker_v2 import recomendar

CATEGORIA_A_PREF = {
    "Naturaleza": {"pref_cascadas_rios", "pref_caminatas"},
    "Naturaleza_Aventura": {"pref_caminatas", "pref_cascadas_rios"},
    "Hospedaje_Naturaleza": {"pref_hospedaje_tranquilo", "pref_caminatas"},
    "Hospedaje": {"pref_hospedaje_tranquilo"},
    "Balneario": {"pref_baja_intensidad", "pref_cascadas_rios"},
    "Spa_Temazcal": {"pref_relajacion"},
    "Mente_Cuerpo": {"pref_relajacion"},
    "Gastronomia": {"pref_gastronomia"},
    "Cafe_de_Altura": {"pref_gastronomia", "pref_cultural"},
    "Cultura": {"pref_cultural"},
    "Artesania": {"pref_cultural", "pref_comunidades"},
}


def catalogo_como_destinos(catalogo: pd.DataFrame) -> list[dict]:
    """Convierte el CSV del ETL DENUE al formato de lugar aprobado que recibe el ranker."""
    destinos = []
    for r in catalogo.itertuples():
        modalidades = json.loads(r.wellness_modalities.replace("'", '"'))
        destinos.append({
            "id_destino": f"denue:{r.denue_clee}", "nombre_lugar": r.nombre, "estado": "Veracruz",
            "municipio": r.municipio, "categoria_wellness": r.categoria_wellness, "is_wellness": True,
            "wellness_status": "approved", "wellness_modalities": modalidades,
            "wellness_mw_evidence": json.loads(r.evidencia), "es_mipyme": bool(r.es_mipyme),
            "demanda_fisica": r.demanda_fisica, "lat": r.latitud, "lon": r.longitud,
        })
    return destinos


def _relevante(categoria: str, elegidas: set[str]) -> int:
    return int(bool(CATEGORIA_A_PREF.get(categoria, set()) & elegidas))


def _ndcg(rel: list[int]) -> float:
    dcg = sum(r / np.log2(i + 2) for i, r in enumerate(rel))
    ideal = sum(1 / np.log2(i + 2) for i in range(sum(rel))) if sum(rel) else 0
    return dcg / ideal if ideal else 0.0


def modalidades_declaradas(tipos: set[str], maximo: int = 3) -> list[str]:
    """Traduce tipos de P10 a las modalidades W que la persona marcaría en la app (por intensidad)."""
    suma: dict[str, int] = {}
    for tipo in tipos:
        for w, intensidad in PREF_A_W[tipo].items():
            suma[w] = suma.get(w, 0) + intensidad
    return [w for w, _ in sorted(suma.items(), key=lambda kv: (-kv[1], kv[0]))[:maximo]]


def evaluar_escenario_app(catalogo: list[dict], encuesta: pd.DataFrame, alfas=(0.0, 0.3, 0.6, 0.8, 1.0),
                          k: int = 5, repeticiones: int = 5, semilla: int = 11) -> pd.DataFrame:
    """La persona declara la mitad de sus elecciones de P10 (como modalidades W); el top 5 se juzga
    contra la otra mitad, que el ranker nunca ve. Compara α (peso de lo declarado) con y sin estrés."""
    prefs = [c for c in encuesta.columns if c.startswith("pref_")]
    rng = np.random.default_rng(semilla)
    filas = []
    personas = encuesta.dropna(subset=["estres_0_100"])
    personas = personas[personas[prefs].sum(axis=1) >= 2]
    for rep in range(repeticiones):
        for _, persona in personas.iterrows():
            elegidas = [p for p in prefs if persona[p] == 1]
            ocultas = set(rng.choice(elegidas, size=len(elegidas) // 2, replace=False))
            declaradas = modalidades_declaradas(set(elegidas) - ocultas)
            for alfa in alfas:
                for con_estres in (False, True):
                    pref = {"modality_preferences": declaradas}
                    if con_estres:
                        pref["estres_0_100"] = float(persona["estres_0_100"])
                    lista = recomendar(catalogo, pref, top_n=k, alfa=alfa)["destinations"]
                    rel = [_relevante(d["categoria_wellness"], ocultas) for d in lista]
                    rel_todas = [_relevante(d["categoria_wellness"], set(elegidas)) for d in lista]
                    filas.append({"rep": rep, "id_respuesta": persona["id_respuesta"], "alfa": alfa,
                                  "estres": con_estres, f"precision@{k}_ocultas": np.mean(rel),
                                  f"precision@{k}_todas": np.mean(rel_todas), f"ndcg@{k}_todas": _ndcg(rel_todas)})
    return pd.DataFrame(filas)


def evaluar(catalogo: list[dict], encuesta: pd.DataFrame, k: int = 5, semilla: int = 7) -> tuple[pd.DataFrame, dict]:
    prefs = [c for c in encuesta.columns if c.startswith("pref_")]
    rng = np.random.default_rng(semilla)
    filas, vistos, municipios = [], {"v2_estres": set(), "v2_sin_estres": set()}, {"v2_estres": set(), "v2_sin_estres": set()}
    for _, persona in encuesta.dropna(subset=["estres_0_100"]).iterrows():
        elegidas = {p for p in prefs if persona[p] == 1}
        listas = {
            "v2_estres": recomendar(catalogo, {"estres_0_100": float(persona["estres_0_100"])}, top_n=k)["destinations"],
            "v2_sin_estres": recomendar(catalogo, {}, top_n=k)["destinations"],
            "aleatorio": [catalogo[i] for i in rng.choice(len(catalogo), k, replace=False)],
        }
        for metodo, lista in listas.items():
            rel = [_relevante(d.get("categoria_wellness", ""), elegidas) for d in lista]
            filas.append({"id_respuesta": persona["id_respuesta"], "metodo": metodo,
                          f"precision@{k}": np.mean(rel), f"ndcg@{k}": _ndcg(rel),
                          "mipyme@5": np.mean([bool(d.get("es_mipyme")) for d in lista])})
            if metodo in vistos:
                vistos[metodo].update(d["id_destino"] for d in lista)
                municipios[metodo].update(d.get("municipio", "") for d in lista)
    detalle = pd.DataFrame(filas)
    resumen = {
        "personas": int(detalle["id_respuesta"].nunique()),
        "metricas": detalle.groupby("metodo")[[f"precision@{k}", f"ndcg@{k}", "mipyme@5"]].mean().round(4).to_dict("index"),
        "lugares_distintos_mostrados": {m: len(v) for m, v in vistos.items()},
        "municipios_distintos_mostrados": {m: len(v) for m, v in municipios.items()},
    }
    return detalle, resumen
