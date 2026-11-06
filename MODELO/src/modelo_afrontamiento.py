"""Modelo PSS-10 -> qué tipo de actividad le ayuda a la persona a bajar el malestar.

Datos: COVIDiSTRESS Global Survey, ronda 1 (OSF z39us; Yamada et al. 2021, Scientific Data
8:3), submuestra de México. Es el único conjunto público encontrado que trae la PSS-10 ítem
por ítem **y** una medida de qué actividades le sirven a cada persona:

    Expl_Coping: "I have found the following helpful for reducing feelings of discomfort
    during the Coronavirus situation" (1 = Strongly disagree ... 6 = Strongly agree).

La redacción se verificó en el archivo oficial de Qualtrics del proyecto
(OSF 2ftma, "COVIDiSTRESS global survey Qualtrics file w. all translations.qsf").

Ítems usados y motivo WELLTUR al que se asocian (asociación de criterio experto, documentada):
    9  "Watching tv-shows or movies"                         -> descanso pasivo     -> M1
    2  "Face-to-face interactions with friends and family"   -> convivencia         -> M5
    3  "Phone calls ... with friends and family"             -> convivencia         -> M5
    14 "Dedicating myself to an activity or hobby"           -> actividad/pasatiempo-> M2, M4
    15 "God, religion or spirituality"                       -> espiritualidad      -> M9

Objetivo: puntaje **relativo** de cada actividad (valor del ítem menos el promedio de los 16
ítems de la persona). Así se modela qué le sirve *más que lo demás* y no la tendencia general
de algunas personas a calificar todo alto o bajo.

Entradas: solo los 10 ítems de la PSS-10, que es lo que la app pregunta.

Se comparan, con validación cruzada repetida (5 pliegues x 5 repeticiones):
    - línea base: el promedio de entrenamiento para todas las personas;
    - Ridge con el total de la PSS-10;
    - Ridge con los 10 ítems;
    - Gradient Boosting (HistGradientBoosting) con los 10 ítems.
Se elige el modelo más simple cuyo nDCG por persona no sea peor que el mejor por más de un
error estándar. El modelo elegido se reentrena con todos los datos y se exporta como JSON
(`models/welltur_afrontamiento_v1.json`) para usarse sin dependencias en el ranker.

Uso:  python src/modelo_afrontamiento.py
"""
from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.model_selection import RepeatedKFold

sys.path.insert(0, str(Path(__file__).resolve().parent))
from normas_pss10 import CSV_DEFAULT, ITEMS, items_puntuados  # noqa: E402

RAIZ = Path(__file__).resolve().parents[1]
SALIDA_MODELO = RAIZ / "models" / "welltur_afrontamiento_v1.json"
SALIDA_REPORTE = RAIZ / "reports" / "modelo_afrontamiento_v1.json"

AFRONTAMIENTO = [f"Expl_Coping_{i}" for i in range(1, 17)]
OBJETIVOS = {
    "descanso_pasivo": {"items": [9], "motivos": {"M1": 1.0}},
    "convivencia": {"items": [2, 3], "motivos": {"M5": 1.0}},
    "actividad_pasatiempo": {"items": [14], "motivos": {"M2": 0.5, "M4": 0.5}},
    "espiritualidad": {"items": [15], "motivos": {"M9": 1.0}},
}
SEMILLA = 2026


def cargar(ruta: Path | str = CSV_DEFAULT) -> tuple[np.ndarray, np.ndarray, pd.DataFrame]:
    d = pd.read_csv(ruta, low_memory=False, encoding="latin-1")
    mx = d[d["Country"].astype(str).str.strip().eq("Mexico")].copy()
    pss = items_puntuados(mx[ITEMS].apply(pd.to_numeric, errors="coerce"))
    cop = mx[AFRONTAMIENTO].apply(pd.to_numeric, errors="coerce")
    # PSS-10 completa (la app exige al menos 8; aquí se pide completa para no imputar) y los
    # 16 ítems de afrontamiento, que se necesitan para el puntaje relativo.
    ok = pss.notna().all(axis=1) & cop.notna().all(axis=1) & cop.isin(range(1, 7)).all(axis=1)
    pss, cop = pss[ok], cop[ok]
    relativo = cop.sub(cop.mean(axis=1), axis=0)
    y = np.column_stack([
        relativo[[f"Expl_Coping_{i}" for i in o["items"]]].mean(axis=1).to_numpy()
        for o in OBJETIVOS.values()
    ])
    return pss.to_numpy(float), y, mx[ok]


def ndcg_por_persona(y_real: np.ndarray, y_pred: np.ndarray) -> np.ndarray:
    """nDCG del orden predicho de las 4 actividades frente a lo que la persona reportó."""
    rel = y_real - y_real.min(axis=1, keepdims=True)  # ganancia >= 0
    descuento = 1 / np.log2(np.arange(2, y_real.shape[1] + 2))
    orden_pred = np.argsort(-y_pred, axis=1, kind="stable")
    orden_ideal = np.argsort(-rel, axis=1, kind="stable")
    dcg = (np.take_along_axis(rel, orden_pred, axis=1) * descuento).sum(axis=1)
    idcg = (np.take_along_axis(rel, orden_ideal, axis=1) * descuento).sum(axis=1)
    return np.where(idcg > 0, dcg / np.where(idcg > 0, idcg, 1), 1.0)


def _modelos() -> dict:
    return {
        "linea_base_promedio": None,
        "ridge_total_pss": lambda: Ridge(alpha=1.0),
        "ridge_10_items": lambda: Ridge(alpha=1.0),
        "gradient_boosting_10_items": lambda: HistGradientBoostingRegressor(
            max_iter=150, learning_rate=0.05, max_depth=3, min_samples_leaf=50, random_state=SEMILLA),
    }


def _entradas(nombre: str, x: np.ndarray) -> np.ndarray:
    return x.sum(axis=1, keepdims=True) if nombre == "ridge_total_pss" else x


def _ajustar_predecir(nombre: str, fabrica, x_tr, y_tr, x_te) -> np.ndarray:
    if fabrica is None:
        return np.tile(y_tr.mean(axis=0), (len(x_te), 1))
    xt, xe = _entradas(nombre, x_tr), _entradas(nombre, x_te)
    return np.column_stack([fabrica().fit(xt, y_tr[:, k]).predict(xe) for k in range(y_tr.shape[1])])


def validar(x: np.ndarray, y: np.ndarray, pliegues: int = 5, repeticiones: int = 5) -> dict:
    cv = RepeatedKFold(n_splits=pliegues, n_repeats=repeticiones, random_state=SEMILLA)
    resultados: dict[str, dict[str, list]] = {n: {"ndcg": [], "r2": [], "acierto_top1": []} for n in _modelos()}
    for tr, te in cv.split(x):
        for nombre, fabrica in _modelos().items():
            pred = _ajustar_predecir(nombre, fabrica, x[tr], y[tr], x[te])
            resultados[nombre]["ndcg"].append(float(ndcg_por_persona(y[te], pred).mean()))
            sse = ((y[te] - pred) ** 2).sum(axis=0)
            sst = ((y[te] - y[tr].mean(axis=0)) ** 2).sum(axis=0)
            resultados[nombre]["r2"].append((1 - sse / sst).tolist())
            top_real = y[te].max(axis=1, keepdims=True)
            elegido = np.argmax(pred, axis=1)
            resultados[nombre]["acierto_top1"].append(
                float(np.mean(y[te][np.arange(len(te)), elegido] >= top_real[:, 0] - 1e-9)))
    resumen = {}
    base = np.array(resultados["linea_base_promedio"]["ndcg"])
    for nombre, r in resultados.items():
        nd = np.array(r["ndcg"])
        dif = nd - base
        resumen[nombre] = {
            "ndcg_media": round(float(nd.mean()), 4),
            "ndcg_ee": round(float(nd.std(ddof=1) / np.sqrt(len(nd))), 4),
            "dif_vs_base": round(float(dif.mean()), 4),
            "dif_ic95": [round(float(np.percentile(dif, 2.5)), 4), round(float(np.percentile(dif, 97.5)), 4)],
            "pliegues_mejor_que_base": int((dif > 0).sum()),
            "r2_por_objetivo": dict(zip(OBJETIVOS, np.round(np.mean(r["r2"], axis=0), 4).tolist())),
            "acierto_top1": round(float(np.mean(r["acierto_top1"])), 4),
        }
    return resumen


def elegir(resumen: dict) -> str:
    candidatos = ["ridge_total_pss", "ridge_10_items", "gradient_boosting_10_items"]
    mejor = max(candidatos, key=lambda n: resumen[n]["ndcg_media"])
    umbral = resumen[mejor]["ndcg_media"] - resumen[mejor]["ndcg_ee"]
    # Del más simple al más complejo: el primero dentro de un error estándar del mejor.
    return next(n for n in candidatos if resumen[n]["ndcg_media"] >= umbral)


def exportar(nombre: str, x: np.ndarray, y: np.ndarray, resumen: dict, n_mx: int) -> dict:
    if nombre == "gradient_boosting_10_items":
        raise RuntimeError("El exportador JSON solo cubre modelos lineales; revisar la elección.")
    xe = _entradas(nombre, x)
    coeficientes = {}
    for k, objetivo in enumerate(OBJETIVOS):
        m = Ridge(alpha=1.0).fit(xe, y[:, k])
        coeficientes[objetivo] = {"intercepto": float(m.intercept_), "pesos": [float(c) for c in m.coef_]}
    artefacto = {
        "modelo": "welltur_afrontamiento_v1",
        "entrenado": date.today().isoformat(),
        "fuente": ("COVIDiSTRESS Global Survey ronda 1 (OSF z39us), México; "
                   "Expl_Coping 1-6 relativo a la persona"),
        "n": int(len(y)),
        "n_mexico_total": n_mx,
        "entrada": "total_pss10" if nombre == "ridge_total_pss" else "items_pss10_puntuados_0a4",
        "objetivos": {k: {"items_expl_coping": v["items"], "motivos": v["motivos"]} for k, v in OBJETIVOS.items()},
        "coeficientes": coeficientes,
        "promedio_poblacional": dict(zip(OBJETIVOS, np.round(y.mean(axis=0), 4).tolist())),
        "de_poblacional": dict(zip(OBJETIVOS, np.round(y.std(axis=0), 4).tolist())),
        "validacion": resumen[nombre],
        "algoritmo_elegido": nombre,
    }
    SALIDA_MODELO.write_text(json.dumps(artefacto, ensure_ascii=False, indent=2), encoding="utf-8")
    return artefacto


def main() -> None:
    x, y, mx = cargar()
    print(f"México con PSS-10 y afrontamiento completos: n = {len(y)}")
    resumen = validar(x, y)
    for nombre, r in resumen.items():
        print(f"{nombre:28s} nDCG {r['ndcg_media']:.4f} ± {r['ndcg_ee']:.4f} | dif {r['dif_vs_base']:+.4f} "
              f"IC95 {r['dif_ic95']} | mejor en {r['pliegues_mejor_que_base']}/25 | top1 {r['acierto_top1']:.3f} "
              f"| R2 {r['r2_por_objetivo']}")
    elegido = elegir(resumen)
    print("Elegido:", elegido)
    artefacto = exportar(elegido, x, y, resumen, n_mx=int(len(mx)))
    SALIDA_REPORTE.write_text(json.dumps({"comparacion": resumen, "elegido": elegido,
                                          "n": artefacto["n"]}, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Escrito:", SALIDA_MODELO.relative_to(RAIZ), "y", SALIDA_REPORTE.relative_to(RAIZ))


if __name__ == "__main__":
    main()
