"""Banco de pruebas de modelos para WELLTUR con la encuesta real (mismo protocolo para todos).

Tarea A — arranque en frío: con el perfil (estrés, bienestar, síntomas, estresores, edad)
ordenar los 8 tipos de experiencia de P10. Métricas por persona: nDCG@3 y Precision@3.

Tarea B — completar preferencias (escenario de la app): la persona declara la mitad de sus
elecciones de P10 y el modelo ordena los tipos restantes; se mide si las elecciones ocultas
quedan arriba (HitRate@2, MRR). Es la situación real: el usuario marca algunas modalidades.

Todos los modelos usan validación cruzada 5-fold repetida separando personas; las
diferencias contra popularidad se reportan con IC 95 % bootstrap por persona.

Uso:
    python experimentos_modelos.py [repeticiones]
"""
from __future__ import annotations

import json
import sys
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import KFold
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import NearestNeighbors
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from encuesta_etl import ESTRESORES, OUT_DEFAULT, PREFERENCIAS, SINTOMAS
from modelo_preferencias import ndcg_at_k, precision_at_k

warnings.filterwarnings("ignore")
BASE = Path(__file__).resolve().parent.parent
SALIDA = BASE / "reports" / "experimentos_modelos.json"

PERFIL = ["estres_0_100", "bienestar_0_100", "satisfaccion", "edad_ord"] + SINTOMAS + ESTRESORES
ESTRES = ["estres_0_100", "bienestar_0_100"]


# ---------------------------------------------------------------- modelos tarea A

def _clf_por_tipo(fabrica, features):
    """Un clasificador binario por tipo de experiencia; devuelve P(tipo) por persona."""
    def ajustar_predecir(tr: pd.DataFrame, te: pd.DataFrame) -> np.ndarray:
        cols = []
        for p in PREFERENCIAS:
            y = tr[p].to_numpy()
            if y.min() == y.max():
                cols.append(np.full(len(te), y.mean()))
                continue
            modelo = make_pipeline(SimpleImputer(strategy="median"), StandardScaler(), fabrica()).fit(tr[features], y)
            cols.append(modelo.predict_proba(te[features])[:, 1])
        return np.column_stack(cols)
    return ajustar_predecir


def _popularidad(tr: pd.DataFrame, te: pd.DataFrame) -> np.ndarray:
    return np.tile(tr[PREFERENCIAS].mean().to_numpy(), (len(te), 1))


def _knn_usuarios(k: int, features):
    """Filtrado colaborativo usuario-usuario: promedia P10 de las k personas de perfil más parecido."""
    def ajustar_predecir(tr: pd.DataFrame, te: pd.DataFrame) -> np.ndarray:
        prep = make_pipeline(SimpleImputer(strategy="median"), StandardScaler()).fit(tr[features])
        nn = NearestNeighbors(n_neighbors=min(k, len(tr))).fit(prep.transform(tr[features]))
        _, idx = nn.kneighbors(prep.transform(te[features]))
        vecinos = tr[PREFERENCIAS].to_numpy()[idx].mean(axis=1)
        return 0.5 * vecinos + 0.5 * tr[PREFERENCIAS].mean().to_numpy()  # suavizado hacia popularidad
    return ajustar_predecir


def _mezcla_popularidad(base, peso: float):
    """Modelo encogido hacia la popularidad: peso * modelo + (1 - peso) * popularidad."""
    def ajustar_predecir(tr, te):
        return peso * base(tr, te) + (1 - peso) * _popularidad(tr, te)
    return ajustar_predecir


MODELOS_A = {
    "popularidad": _popularidad,
    "logistica_L2_estres": _clf_por_tipo(lambda: LogisticRegression(C=0.1, max_iter=2000), ESTRES),
    "logistica_L2_perfil": _clf_por_tipo(lambda: LogisticRegression(C=0.1, max_iter=2000), PERFIL),
    "logistica_L1_perfil": _clf_por_tipo(lambda: LogisticRegression(C=0.1, penalty="l1", solver="liblinear"), PERFIL),
    "naive_bayes_perfil": _clf_por_tipo(GaussianNB, PERFIL),
    "random_forest_perfil": _clf_por_tipo(lambda: RandomForestClassifier(300, min_samples_leaf=8, random_state=0), PERFIL),
    "gradient_boosting_perfil": _clf_por_tipo(
        lambda: HistGradientBoostingClassifier(max_depth=2, learning_rate=0.05, max_iter=80, l2_regularization=1.0), PERFIL),
    "red_neuronal_mlp_perfil": _clf_por_tipo(
        lambda: MLPClassifier((8,), alpha=1.0, max_iter=2000, random_state=0), PERFIL),
    "knn_usuarios_perfil_k15": _knn_usuarios(15, PERFIL),
    "knn_usuarios_estres_k15": _knn_usuarios(15, ESTRES),
    "random_forest_encogido_50": _mezcla_popularidad(
        _clf_por_tipo(lambda: RandomForestClassifier(300, min_samples_leaf=8, random_state=0), PERFIL), 0.5),
}


def tarea_a(df: pd.DataFrame, repeticiones: int, semilla: int = 42) -> dict:
    verdad = df[PREFERENCIAS].to_numpy()
    puntos = {m: np.full((repeticiones, len(df)), np.nan) for m in MODELOS_A}
    prec = {m: np.full((repeticiones, len(df)), np.nan) for m in MODELOS_A}
    for rep in range(repeticiones):
        for tr, te in KFold(5, shuffle=True, random_state=semilla + rep).split(df):
            for nombre, modelo in MODELOS_A.items():
                s = modelo(df.iloc[tr], df.iloc[te])
                for j, fila in enumerate(te):
                    puntos[nombre][rep, fila] = ndcg_at_k(s[j], verdad[fila])
                    prec[nombre][rep, fila] = precision_at_k(s[j], verdad[fila])
    return _resumir(puntos, prec, "ndcg@3", "precision@3", semilla)


# ---------------------------------------------------------------- modelos tarea B

def _ocultar(fila: np.ndarray, rng: np.random.Generator) -> tuple[np.ndarray, np.ndarray]:
    elegidas = np.flatnonzero(fila)
    ocultas = rng.choice(elegidas, size=len(elegidas) // 2, replace=False)
    observadas = fila.copy()
    observadas[ocultas] = 0
    return observadas, ocultas


def _b_popularidad(Ytr, Xtr, obs, x):
    return Ytr.mean(axis=0)


def _b_coocurrencia(Ytr, Xtr, obs, x):
    """CF ítem-ítem: P(i | j) promediada sobre los tipos j que la persona declaró."""
    conteo = Ytr.T @ Ytr
    cond = conteo / np.maximum(np.diag(conteo)[:, None], 1)
    vistos = np.flatnonzero(obs)
    return cond[vistos].mean(axis=0) if len(vistos) else Ytr.mean(axis=0)


def _b_knn_usuarios(Ytr, Xtr, obs, x, k=15):
    """CF usuario-usuario por similitud coseno de las elecciones declaradas."""
    norma = np.linalg.norm(Ytr, axis=1) * (np.linalg.norm(obs) or 1)
    sim = (Ytr @ obs) / np.maximum(norma, 1e-9)
    idx = np.argsort(-sim)[:k]
    return 0.5 * Ytr[idx].mean(axis=0) + 0.5 * Ytr.mean(axis=0)


def _b_logistica(Ytr, Xtr, obs, x, con_estres=False):
    salida = np.zeros(Ytr.shape[1])
    for i in range(Ytr.shape[1]):
        otras = np.delete(np.arange(Ytr.shape[1]), i)
        X = Ytr[:, otras]
        xq = obs[otras]
        if con_estres:
            X, xq = np.hstack([X, Xtr]), np.concatenate([xq, x])
        modelo = make_pipeline(SimpleImputer(strategy="median"), StandardScaler(),
                               LogisticRegression(C=0.3, max_iter=2000)).fit(X, Ytr[:, i])
        salida[i] = modelo.predict_proba(xq[None, :])[0, 1]
    return salida


MODELOS_B = {
    "popularidad": _b_popularidad,
    "coocurrencia_item_item": _b_coocurrencia,
    "knn_usuario_usuario": _b_knn_usuarios,
    "logistica_tipos": _b_logistica,
    "logistica_tipos_mas_estres": lambda *a: _b_logistica(*a, con_estres=True),
}


def tarea_b(df: pd.DataFrame, repeticiones: int, semilla: int = 42) -> dict:
    Y = df[PREFERENCIAS].to_numpy()
    X = SimpleImputer(strategy="median").fit_transform(df[ESTRES])
    elegibles = np.flatnonzero(Y.sum(axis=1) >= 2)
    hit = {m: np.full((repeticiones, len(df)), np.nan) for m in MODELOS_B}
    mrr = {m: np.full((repeticiones, len(df)), np.nan) for m in MODELOS_B}
    for rep in range(repeticiones):
        rng = np.random.default_rng(semilla + rep)
        for tr, te in KFold(5, shuffle=True, random_state=semilla + rep).split(df):
            for fila in set(te) & set(elegibles):
                obs, ocultas = _ocultar(Y[fila], rng)
                candidatos = np.flatnonzero(obs == 0)
                for nombre, modelo in MODELOS_B.items():
                    s = modelo(Y[tr], X[tr], obs, X[fila])[candidatos]
                    orden = candidatos[np.argsort(-s, kind="stable")]
                    posiciones = [int(np.where(orden == o)[0][0]) + 1 for o in ocultas]
                    hit[nombre][rep, fila] = np.mean([p <= 2 for p in posiciones])
                    mrr[nombre][rep, fila] = np.mean([1 / p for p in posiciones])
    return _resumir(hit, mrr, "hitrate@2", "mrr", semilla)


# ---------------------------------------------------------------- resumen

def _resumir(m1: dict, m2: dict, n1: str, n2: str, semilla: int) -> dict:
    rng = np.random.default_rng(semilla)
    base = np.nanmean(m1["popularidad"], axis=0)
    resultado = {}
    for nombre in m1:
        por_persona = np.nanmean(m1[nombre], axis=0)
        fila = {n1: round(float(np.nanmean(por_persona)), 4), n2: round(float(np.nanmean(m2[nombre])), 4)}
        if nombre != "popularidad":
            dif = (por_persona - base)[~np.isnan(base)]
            boot = [rng.choice(dif, len(dif)).mean() for _ in range(3000)]
            fila["dif_vs_popularidad"] = round(float(dif.mean()), 4)
            fila["ic95"] = [round(float(np.percentile(boot, 2.5)), 4), round(float(np.percentile(boot, 97.5)), 4)]
            fila["supera_baseline"] = bool(np.percentile(boot, 2.5) > 0)
        resultado[nombre] = fila
    return dict(sorted(resultado.items(), key=lambda kv: -kv[1][n1]))


def ejecutar(repeticiones: int = 10) -> dict:
    df = pd.read_csv(OUT_DEFAULT)
    resultados = {
        "n_personas": int(len(df)),
        "repeticiones": repeticiones,
        "tarea_a_arranque_en_frio": tarea_a(df, repeticiones),
        "tarea_b_completar_preferencias": tarea_b(df, repeticiones),
    }
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    SALIDA.write_text(json.dumps(resultados, ensure_ascii=False, indent=2), encoding="utf-8")
    return resultados


if __name__ == "__main__":
    reps = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    print(json.dumps(ejecutar(reps), ensure_ascii=False, indent=1))
