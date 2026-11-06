"""Modelo bayesiano jerárquico estrés -> preferencias (WELLTUR, alternativa a la selección FDR).

En lugar de estimar cada tipo de experiencia por separado y quedarse solo con los
significativos, los 8 efectos del estrés comparten una distribución común
(partial pooling): los efectos ruidosos se encogen hacia el promedio y no se descartan.

    y_ij ~ Bernoulli(logit⁻¹(a_j + b_j · z_i))     z_i = estrés estandarizado
    a_j  ~ Normal(logit(prevalencia_j), 1.5)
    b_j  = μ_b + τ_b · e_j,  e_j ~ Normal(0, 1)      (parametrización no centrada)
    μ_b  ~ Normal(0, 0.5),   τ_b ~ HalfNormal(0.5)

Se compara contra la popularidad y el modelo FDR con validación cruzada por persona
(nDCG@3 y log-loss), y se guarda un artefacto con el mismo formato que usa el ranker.

Uso:
    python modelo_bayesiano.py [repeticiones]
"""
from __future__ import annotations

import json
import logging
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd

from encuesta_etl import OUT_DEFAULT, PREF_A_W, PREFERENCIAS
from modelo_preferencias import ndcg_at_k

logging.getLogger("pymc").setLevel(logging.ERROR)

BASE = Path(__file__).resolve().parent.parent
ARTEFACTO_PATH = BASE / "models" / "welltur_preferencias_bayes_v1.json"
CV_PATH = BASE / "reports" / "bayes_cv.json"


def _logit(p: np.ndarray) -> np.ndarray:
    p = np.clip(p, 1e-3, 1 - 1e-3)
    return np.log(p / (1 - p))


def _log_posterior(theta: np.ndarray, Y: np.ndarray, z: np.ndarray, a0: np.ndarray) -> float:
    k = Y.shape[1]
    a, e, mu_b, log_tau = theta[:k], theta[k:2 * k], theta[2 * k], theta[2 * k + 1]
    tau = math.exp(log_tau)
    b = mu_b + tau * e
    eta = a[None, :] + z[:, None] * b[None, :]
    loglik = float((Y * eta - np.logaddexp(0.0, eta)).sum())
    prior = (-0.5 * (((a - a0) / 1.5) ** 2).sum() - 0.5 * (e ** 2).sum()
             - 0.5 * (mu_b / 0.5) ** 2 - 0.5 * (tau / 0.5) ** 2 + log_tau)  # HalfNormal + jacobiano de log τ
    return loglik + prior


def _cadena(Y, z, a0, rng, iteraciones: int, calentamiento: int, adelgazar: int) -> np.ndarray:
    """Metropolis adaptativo (Haario et al., 2001): la propuesta aprende la covarianza del posterior."""
    k = Y.shape[1]
    d = 2 * k + 2
    theta = np.concatenate([a0, np.zeros(k), [0.0, math.log(0.2)]]) + rng.normal(0, 0.05, d)
    lp = _log_posterior(theta, Y, z, a0)
    cov = np.eye(d) * 0.01
    historia, muestras = [], []
    for t in range(iteraciones):
        if t >= 1000 and t % 500 == 0 and t <= calentamiento:
            cov = np.cov(np.array(historia[-5000:]).T) * (2.38 ** 2 / d) + np.eye(d) * 1e-6
        propuesta = rng.multivariate_normal(theta, cov)
        lp_prop = _log_posterior(propuesta, Y, z, a0)
        if math.log(rng.random()) < lp_prop - lp:
            theta, lp = propuesta, lp_prop
        historia.append(theta)
        if t >= calentamiento and (t - calentamiento) % adelgazar == 0:
            muestras.append(theta)
    return np.array(muestras)


def ajustar_pymc(Y: np.ndarray, z: np.ndarray, semilla: int = 0, draws: int = 1000, cadenas: int = 2) -> dict:
    """Mismo modelo con NUTS (PyMC): referencia para validar el muestreador propio."""
    import pymc as pm

    with pm.Model():
        a = pm.Normal("a", mu=_logit(Y.mean(axis=0)), sigma=1.5, shape=Y.shape[1])
        mu_b = pm.Normal("mu_b", 0.0, 0.5)
        tau_b = pm.HalfNormal("tau_b", 0.5)
        e = pm.Normal("e", 0.0, 1.0, shape=Y.shape[1])
        b = pm.Deterministic("b", mu_b + tau_b * e)
        pm.Bernoulli("y", logit_p=a[None, :] + b[None, :] * z[:, None], observed=Y)
        traza = pm.sample(draws=draws, tune=1000, chains=cadenas, cores=1, target_accept=0.95,
                          random_seed=semilla, progressbar=False, compute_convergence_checks=False)
    post = traza.posterior
    junta = lambda v: post[v].values.reshape(-1, post[v].shape[-1]).T
    return {
        "a": junta("a"), "b": junta("b"), "mu_b": post["mu_b"].values.ravel(), "tau_b": post["tau_b"].values.ravel(),
        "rhat_max": max(_rhat(post[v].values if post[v].ndim == 3 else post[v].values[:, :, None])
                        for v in ("a", "b", "mu_b", "tau_b")),
    }


def ajustar(Y: np.ndarray, z: np.ndarray, semilla: int = 0, draws: int = 1000, cadenas: int = 2) -> dict:
    k = Y.shape[1]
    a0 = _logit(Y.mean(axis=0))
    rng = np.random.default_rng(semilla)
    adelgazar = 10
    calentamiento = 10_000
    trazas = np.stack([_cadena(Y, z, a0, rng, calentamiento + draws * adelgazar, calentamiento, adelgazar)
                       for _ in range(cadenas)])                        # (cadenas, draws, d)
    a = trazas[:, :, :k]
    mu_b, tau = trazas[:, :, 2 * k], np.exp(trazas[:, :, 2 * k + 1])
    b = mu_b[:, :, None] + tau[:, :, None] * trazas[:, :, k:2 * k]
    junta = lambda x: x.reshape(-1, x.shape[-1]).T                       # (tipos, muestras)
    return {
        "a": junta(a), "b": junta(b), "mu_b": mu_b.ravel(), "tau_b": tau.ravel(),
        "rhat_max": max(_rhat(a), _rhat(b), _rhat(mu_b[:, :, None]), _rhat(tau[:, :, None])),
    }


def _rhat(x: np.ndarray) -> float:
    """R-hat de Gelman-Rubin por parámetro (cadenas en el eje 0); devuelve el máximo."""
    x = x.reshape(x.shape[0], x.shape[1], -1)
    n = x.shape[1]
    medias = x.mean(axis=1)
    b = n * medias.var(axis=0, ddof=1)
    w = x.var(axis=1, ddof=1).mean(axis=0)
    return float(np.max(np.sqrt(((n - 1) / n * w + b / n) / w)))


def predecir(post: dict, z: np.ndarray) -> np.ndarray:
    """Probabilidad posterior media por persona y tipo."""
    eta = post["a"][None, :, :] + post["b"][None, :, :] * z[:, None, None]
    return (1 / (1 + np.exp(-eta))).mean(axis=2)


def _logloss(p: np.ndarray, y: np.ndarray) -> float:
    p = np.clip(p, 1e-6, 1 - 1e-6)
    return float(-(y * np.log(p) + (1 - y) * np.log(1 - p)).mean())


def evaluar(df: pd.DataFrame, repeticiones: int = 3) -> dict:
    from sklearn.model_selection import KFold
    import statsmodels.api as sm
    from statsmodels.stats.multitest import multipletests

    d = df.dropna(subset=["estres_0_100"]).reset_index(drop=True)
    Y = d[PREFERENCIAS].to_numpy()
    resultados = {m: {"ndcg": [], "logloss": []} for m in ("popularidad", "fdr", "bayes_jerarquico")}
    for rep in range(repeticiones):
        for tr, te in KFold(5, shuffle=True, random_state=100 + rep).split(d):
            x = d["estres_0_100"].to_numpy()
            media, de = x[tr].mean(), x[tr].std(ddof=1)
            ztr, zte = (x[tr] - media) / de, (x[te] - media) / de
            pop = np.tile(Y[tr].mean(axis=0), (len(te), 1))
            # Modelo FDR ajustado solo con el entrenamiento (como el de producción).
            pv, coef = [], []
            for j in range(Y.shape[1]):
                r = sm.Logit(Y[tr, j], sm.add_constant(ztr)).fit(disp=0)
                pv.append(r.pvalues[1]); coef.append(r.params)
            q = multipletests(pv, method="fdr_bh")[1]
            fdr = np.column_stack([
                1 / (1 + np.exp(-(c[0] + c[1] * zte))) if q[j] < 0.05 else np.full(len(te), Y[tr, j].mean())
                for j, c in enumerate(coef)])
            bayes = predecir(ajustar(Y[tr], ztr, semilla=rep), zte)
            for nombre, s in (("popularidad", pop), ("fdr", fdr), ("bayes_jerarquico", bayes)):
                resultados[nombre]["ndcg"] += [ndcg_at_k(s[k], Y[i]) for k, i in enumerate(te)]
                resultados[nombre]["logloss"].append(_logloss(s, Y[te]))
    resumen = {}
    base = np.array(resultados["popularidad"]["ndcg"])
    rng = np.random.default_rng(0)
    for nombre, r in resultados.items():
        nd = np.array(r["ndcg"])
        fila = {"ndcg@3": round(float(np.nanmean(nd)), 4), "logloss": round(float(np.mean(r["logloss"])), 4)}
        if nombre != "popularidad":
            dif = (nd - base)[~np.isnan(base)]
            boot = [rng.choice(dif, len(dif)).mean() for _ in range(3000)]
            fila["dif_ndcg_vs_popularidad"] = round(float(dif.mean()), 4)
            fila["ic95"] = [round(float(np.percentile(boot, 2.5)), 4), round(float(np.percentile(boot, 97.5)), 4)]
        resumen[nombre] = fila
    return {"n": int(len(d)), "repeticiones": repeticiones, "metodos": resumen}


def construir_artefacto(df: pd.DataFrame) -> dict:
    d = df.dropna(subset=["estres_0_100"]).reset_index(drop=True)
    x = d["estres_0_100"].to_numpy()
    media, de = float(x.mean()), float(x.std(ddof=1))
    post = ajustar(d[PREFERENCIAS].to_numpy(), (x - media) / de, draws=2000)
    tipos = {}
    for j, tipo in enumerate(PREFERENCIAS):
        b = post["b"][j]
        tipos[tipo] = {
            "intercepto": round(float(post["a"][j].mean()), 4),
            "beta_estres_z": round(float(b.mean()), 4),
            "or_por_de": round(math.exp(float(b.mean())), 3),
            "ic94_or": [round(math.exp(float(np.percentile(b, 3))), 3), round(math.exp(float(np.percentile(b, 97))), 3)],
            "prob_efecto_positivo": round(float((b > 0).mean()), 3),
            "prevalencia": round(float(d[tipo].mean()), 3),
            "usa_estres": True,
        }
    return {
        "modelo": "welltur_preferencias_bayes_v1",
        "tipo": "logistica_bayesiana_jerarquica_partial_pooling",
        "entrenado_en": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "fuente": "encuesta_real_oct_2026",
        "n": int(len(d)),
        "estres": {"media": round(media, 3), "de": round(de, 3)},
        "hiperparametros": {"mu_b": round(float(post["mu_b"].mean()), 4), "tau_b": round(float(post["tau_b"].mean()), 4)},
        "rhat_max": round(post["rhat_max"], 4),
        "tipos": tipos,
        "pref_a_w": PREF_A_W,
    }


if __name__ == "__main__":
    reps = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    datos = pd.read_csv(OUT_DEFAULT)
    cv = evaluar(datos, reps)
    CV_PATH.parent.mkdir(parents=True, exist_ok=True)
    CV_PATH.write_text(json.dumps(cv, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(cv, ensure_ascii=False, indent=1))
    artefacto = construir_artefacto(datos)
    ARTEFACTO_PATH.write_text(json.dumps(artefacto, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: artefacto[k] for k in ("hiperparametros", "rhat_max", "tipos")}, ensure_ascii=False, indent=1))
