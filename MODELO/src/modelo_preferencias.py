"""Modelo perfil -> preferencia de experiencias wellness (WELLTUR, Etapa A).

Con la encuesta real de oct-2026 (n≈137) estima qué tipos de experiencia (P10)
prefieren las personas y cómo cambia esa preferencia con el estrés percibido.

Pasos:
1. `evaluar_ml`: compara modelos de ML (regresión logística con todo el perfil o
   solo con estrés/bienestar) contra la popularidad, con validación cruzada repetida
   por persona. Sirve para decidir con datos si el ML aporta sobre el baseline.
2. `estimar_efectos`: regresión logística por tipo con el estrés estandarizado;
   odds ratio por +1 DE, IC 95 % y corrección FDR (Benjamini-Hochberg).
3. `construir_artefacto`: modelo final transparente. P(tipo | estrés) usa el
   intercepto de cada tipo y solo los efectos de estrés con q < Q_UMBRAL; el resto
   queda en 0 (no se personaliza sin evidencia). Se guarda como JSON versionado.

Uso:
    python modelo_preferencias.py
"""
from __future__ import annotations

import hashlib
import json
import math
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import statsmodels.api as sm
from scipy.stats import wilcoxon
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import RepeatedKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from statsmodels.stats.multitest import multipletests

from encuesta_etl import ESTRESORES, OUT_DEFAULT, PREF_A_W, PREFERENCIAS, SINTOMAS

BASE = Path(__file__).resolve().parent.parent
ARTEFACTO_PATH = BASE / "models" / "welltur_preferencias_v1.json"

FEATURES_PERFIL = ["estres_0_100", "bienestar_0_100", "satisfaccion", "edad_ord"] + SINTOMAS + ESTRESORES
FEATURES_ESTRES = ["estres_0_100", "bienestar_0_100"]
K = 3
C_REGULARIZACION = 0.1
Q_UMBRAL = 0.05


# ---------------------------------------------------------------- 1. ML vs baseline

def _pipeline() -> object:
    return make_pipeline(
        SimpleImputer(strategy="median"),
        StandardScaler(),
        # Sin class_weight: el intercepto conserva la popularidad de cada tipo y las
        # probabilidades quedan calibradas para compararse entre tipos al ordenar.
        LogisticRegression(C=C_REGULARIZACION, max_iter=2000),
    )


def _ajustar(df: pd.DataFrame, features: list[str]) -> dict[str, object]:
    return {pref: _pipeline().fit(df[features], df[pref]) for pref in PREFERENCIAS}


def _predecir(modelos: dict[str, object], df: pd.DataFrame, features: list[str]) -> np.ndarray:
    return np.column_stack([modelos[p].predict_proba(df[features])[:, 1] for p in PREFERENCIAS])


def ndcg_at_k(scores: np.ndarray, verdad: np.ndarray, k: int = K) -> float:
    orden = np.argsort(-scores, kind="stable")[:k]
    dcg = sum(verdad[i] / np.log2(r + 2) for r, i in enumerate(orden))
    ideal = sum(1 / np.log2(r + 2) for r in range(min(k, int(verdad.sum()))))
    return float(dcg / ideal) if ideal > 0 else np.nan


def precision_at_k(scores: np.ndarray, verdad: np.ndarray, k: int = K) -> float:
    orden = np.argsort(-scores, kind="stable")[:k]
    return float(verdad[orden].sum() / k)


def evaluar_ml(df: pd.DataFrame, repeticiones: int = 20, semilla: int = 42) -> dict:
    """Validación cruzada 5-fold repetida; métricas por persona promediadas entre repeticiones."""
    verdad = df[PREFERENCIAS].to_numpy()
    metodos = ["perfil_completo", "solo_estres_bienestar", "popularidad"]
    ndcg = {m: np.zeros((repeticiones, len(df))) for m in metodos}
    prec = {m: np.zeros((repeticiones, len(df))) for m in metodos}

    for n, (tr, te) in enumerate(RepeatedKFold(n_splits=5, n_repeats=repeticiones, random_state=semilla).split(df)):
        rep = n // 5
        entren, prueba = df.iloc[tr], df.iloc[te]
        puntajes = {
            "perfil_completo": _predecir(_ajustar(entren, FEATURES_PERFIL), prueba, FEATURES_PERFIL),
            "solo_estres_bienestar": _predecir(_ajustar(entren, FEATURES_ESTRES), prueba, FEATURES_ESTRES),
            "popularidad": np.tile(entren[PREFERENCIAS].mean().to_numpy(), (len(te), 1)),
        }
        for m, s in puntajes.items():
            for j, fila in enumerate(te):
                ndcg[m][rep, fila] = ndcg_at_k(s[j], verdad[fila])
                prec[m][rep, fila] = precision_at_k(s[j], verdad[fila])

    rng = np.random.default_rng(semilla)
    por_persona = {m: np.nanmean(ndcg[m], axis=0) for m in metodos}
    resumen: dict = {"n_personas": int(len(df)), "k": K, "repeticiones": repeticiones, "metodos": {}}
    for m in metodos:
        resumen["metodos"][m] = {
            f"ndcg@{K}": round(float(np.nanmean(por_persona[m])), 4),
            f"precision@{K}": round(float(np.nanmean(prec[m])), 4),
        }
    for m in ["perfil_completo", "solo_estres_bienestar"]:
        dif = por_persona[m] - por_persona["popularidad"]
        dif = dif[~np.isnan(dif)]
        boot = [rng.choice(dif, len(dif)).mean() for _ in range(5000)]
        resumen["metodos"][m].update({
            "dif_vs_popularidad": round(float(dif.mean()), 4),
            "ic95_dif": [round(float(np.percentile(boot, 2.5)), 4), round(float(np.percentile(boot, 97.5)), 4)],
            "wilcoxon_p": round(float(wilcoxon(dif).pvalue), 4),
        })
    return resumen


# ---------------------------------------------------------------- 2. efectos del estrés

def estimar_efectos(df: pd.DataFrame, predictor: str = "estres_0_100") -> pd.DataFrame:
    d = df.dropna(subset=[predictor])
    z = (d[predictor] - d[predictor].mean()) / d[predictor].std()
    filas = []
    for pref in PREFERENCIAS:
        res = sm.Logit(d[pref], sm.add_constant(z.rename("z"))).fit(disp=0)
        lo, hi = res.conf_int().loc["z"]
        filas.append({
            "preferencia": pref, "prevalencia": round(float(d[pref].mean()), 3),
            "intercepto": float(res.params["const"]), "beta_z": float(res.params["z"]),
            "or_por_de": round(math.exp(res.params["z"]), 3),
            "ic95_or": [round(math.exp(lo), 3), round(math.exp(hi), 3)],
            "p": round(float(res.pvalues["z"]), 4),
        })
    tabla = pd.DataFrame(filas)
    tabla["q_fdr"] = multipletests(tabla["p"], method="fdr_bh")[1].round(4)
    tabla.attrs.update({"n": int(len(d)), "media": float(d[predictor].mean()), "de": float(d[predictor].std())})
    return tabla


# ---------------------------------------------------------------- 3. artefacto final

def _logit(p: float) -> float:
    p = min(max(p, 1e-4), 1 - 1e-4)
    return math.log(p / (1 - p))


def construir_artefacto(df: pd.DataFrame, ruta_datos: Path) -> dict:
    efectos = estimar_efectos(df, "estres_0_100")
    tipos = {}
    for fila in efectos.to_dict("records"):
        con_evidencia = bool(fila["q_fdr"] < Q_UMBRAL)
        tipos[fila["preferencia"]] = {
            "intercepto": round(fila["intercepto"] if con_evidencia else _logit(fila["prevalencia"]), 4),
            "beta_estres_z": round(fila["beta_z"], 4) if con_evidencia else 0.0,
            "prevalencia": fila["prevalencia"], "or_por_de": fila["or_por_de"],
            "ic95_or": fila["ic95_or"], "p": fila["p"], "q_fdr": fila["q_fdr"], "usa_estres": con_evidencia,
        }
    return {
        "modelo": "welltur_preferencias_v1",
        "tipo": "logistica_por_tipo_con_seleccion_fdr",
        "entrenado_en": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "fuente": "encuesta_real_oct_2026",
        "datos": ruta_datos.name,
        "sha256_datos": hashlib.sha256(ruta_datos.read_bytes()).hexdigest(),
        "n": efectos.attrs["n"],
        "estres": {"media": round(efectos.attrs["media"], 3), "de": round(efectos.attrs["de"], 3)},
        "q_umbral": Q_UMBRAL,
        "tipos": tipos,
        "pref_a_w": PREF_A_W,
        "evaluacion_ml": evaluar_ml(df),
    }


def probabilidades(artefacto: dict, estres_0_100: float | None) -> dict[str, float]:
    """P(tipo de experiencia | estrés). Sin dato de estrés devuelve la popularidad."""
    z = 0.0
    if estres_0_100 is not None:
        z = (estres_0_100 - artefacto["estres"]["media"]) / artefacto["estres"]["de"]
    return {
        tipo: round(1 / (1 + math.exp(-(t["intercepto"] + t["beta_estres_z"] * z))), 4)
        for tipo, t in artefacto["tipos"].items()
    }


def pesos_w(probs: dict[str, float], pref_a_w: dict[str, dict[str, int]] = PREF_A_W) -> dict[str, float]:
    """Convierte P(tipo de experiencia) en pesos normalizados por modalidad W1-W7."""
    pesos = {f"W{i}": 0.0 for i in range(1, 8)}
    for tipo, prob in probs.items():
        for w, intensidad in pref_a_w[tipo].items():
            pesos[w] += prob * intensidad
    total = sum(pesos.values()) or 1.0
    return {w: round(v / total, 4) for w, v in pesos.items()}


def entrenar_y_guardar(ruta_datos: Path | str = OUT_DEFAULT) -> dict:
    ruta_datos = Path(ruta_datos)
    artefacto = construir_artefacto(pd.read_csv(ruta_datos), ruta_datos)
    ARTEFACTO_PATH.parent.mkdir(parents=True, exist_ok=True)
    ARTEFACTO_PATH.write_text(json.dumps(artefacto, ensure_ascii=False, indent=2), encoding="utf-8")
    return artefacto


if __name__ == "__main__":
    a = entrenar_y_guardar()
    print(json.dumps({k: a[k] for k in ("n", "estres", "tipos")}, ensure_ascii=False, indent=2))
    for nivel in (20, 50, 80):
        print(nivel, pesos_w(probabilidades(a, nivel)))
