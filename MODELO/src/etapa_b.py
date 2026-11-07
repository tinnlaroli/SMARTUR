"""Etapa B de WELLTUR: ¿los datos reales de la app justifican reentrenar el efecto del estrés?

Entrada: sesiones con consentimiento que tienen PSS-10 (las envía el API desde la BD). Cada
sesión trae los lugares mostrados (con sus modalidades W y posición) y lo que la persona hizo
con ellos: abrir el detalle, elegirlo (cómo llegar / visitar / guardar) o calificarlo.

Objetivo por lugar mostrado: y = 1 si lo abrió, lo eligió o lo calificó con 4-5.

Se comparan con validación cruzada agrupada por persona (nadie aparece en entrenamiento y
prueba a la vez):
    A) modelo actual: coincidencia con lo pedido + posición en la lista + modalidad;
    B) A + interacción estrés × modalidad (el efecto que la etapa A tomó de la encuesta).
Métricas: log-loss y AUC fuera de muestra; diferencia B - A por pliegue.

Decisión: solo se sugiere promover B si hay al menos `meta` sesiones y la mejora en log-loss
es positiva en todos los pliegues. Nunca se promueve sola: la decide una persona.
"""
from __future__ import annotations

import math
from collections import Counter
from typing import Any

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import log_loss, roc_auc_score
from sklearn.model_selection import GroupKFold

MODALIDADES = [f"W{i}" for i in range(1, 8)]
MIN_PARA_ESTIMAR = 30  # por debajo, solo descriptivos
# Normas mexicanas de la PSS-10 (COVIDiSTRESS, ponderadas por la edad de la encuesta).
PSS_MEDIA, PSS_DE = 18.612, 7.455


def _filas(sesiones: list[dict[str, Any]]):
    x_a, x_b, y, grupos = [], [], [], []
    for s in sesiones:
        z = (float(s["pss10_total"]) - PSS_MEDIA) / PSS_DE
        pedidas = set(s.get("modalidades_pedidas") or [])
        for it in s.get("items") or []:
            mods = [m for m in str(it.get("modalidades") or "").split(",") if m in MODALIDADES]
            if not mods:
                continue
            onehot = [1.0 if w in mods else 0.0 for w in MODALIDADES]
            coincide = 1.0 if pedidas & set(mods) else 0.0
            pos = float(it.get("posicion") or 5)
            base = [coincide, 1.0 / pos, *onehot]
            x_a.append(base)
            x_b.append(base + [z * v for v in onehot])
            calif = it.get("calificacion")
            y.append(1 if (it.get("abierto") or it.get("elegido") or (calif is not None and calif >= 4)) else 0)
            grupos.append(s.get("user_id", s.get("session_id")))
    return np.array(x_a), np.array(x_b), np.array(y), np.array(grupos)


def _descriptivos(sesiones: list[dict[str, Any]], y: np.ndarray) -> dict[str, Any]:
    sat = [s["satisfaccion"] for s in sesiones if s.get("satisfaccion") is not None]
    pss = [float(s["pss10_total"]) for s in sesiones]
    rho = None
    pares = [(float(s["pss10_total"]), s["satisfaccion"]) for s in sesiones if s.get("satisfaccion") is not None]
    if len(pares) >= 10:
        a, b = np.array(pares).T
        if a.std() > 0 and b.std() > 0:
            rho = float(np.corrcoef(np.argsort(np.argsort(a)), np.argsort(np.argsort(b)))[0, 1])
    return {
        "n_sesiones": len(sesiones),
        "n_personas": len({s.get("user_id") for s in sesiones}),
        "n_lugares_mostrados": int(len(y)),
        "tasa_interes": float(y.mean()) if len(y) else None,
        "satisfaccion_promedio": float(np.mean(sat)) if sat else None,
        "satisfaccion_n": len(sat),
        "pss10_media": float(np.mean(pss)) if pss else None,
        "rho_pss_satisfaccion": rho,
        "motivos_mas_pedidos": Counter(m for s in sesiones for m in (s.get("motivos") or [])).most_common(5),
    }


def evaluar(sesiones: list[dict[str, Any]], meta: int = 200) -> dict[str, Any]:
    x_a, x_b, y, grupos = _filas(sesiones)
    desc = _descriptivos(sesiones, y)
    n = desc["n_sesiones"]
    salida: dict[str, Any] = {"meta": meta, "faltan": max(0, meta - n), "lista_para_promover": False, **desc}
    if n < MIN_PARA_ESTIMAR or len(set(y.tolist())) < 2 or len(set(grupos.tolist())) < 5:
        salida["estado"] = "insuficiente"
        salida["mensaje"] = (f"Hay {n} sesiones con PSS-10; se necesitan al menos {MIN_PARA_ESTIMAR} para estimar "
                             f"y {meta} para decidir. Sigue en uso el modelo de la etapa A.")
        return salida

    pliegues = min(5, len(set(grupos.tolist())))
    cv = GroupKFold(n_splits=pliegues)
    res = {"A": {"logloss": [], "auc": []}, "B": {"logloss": [], "auc": []}}
    for tr, te in cv.split(x_a, y, grupos):
        if len(set(y[tr].tolist())) < 2:
            continue
        for nombre, x in (("A", x_a), ("B", x_b)):
            m = LogisticRegression(C=1.0, max_iter=2000).fit(x[tr], y[tr])
            p = np.clip(m.predict_proba(x[te])[:, 1], 1e-6, 1 - 1e-6)
            res[nombre]["logloss"].append(log_loss(y[te], p, labels=[0, 1]))
            res[nombre]["auc"].append(roc_auc_score(y[te], p) if len(set(y[te].tolist())) == 2 else math.nan)

    dif = np.array(res["A"]["logloss"]) - np.array(res["B"]["logloss"])  # > 0: B mejor
    final = LogisticRegression(C=1.0, max_iter=2000).fit(x_b, y)
    coef_interaccion = final.coef_[0][-len(MODALIDADES):]
    salida.update({
        "estado": "evaluado",
        "pliegues": len(dif),
        "logloss_A": float(np.mean(res["A"]["logloss"])),
        "logloss_B": float(np.mean(res["B"]["logloss"])),
        "auc_A": float(np.nanmean(res["A"]["auc"])),
        "auc_B": float(np.nanmean(res["B"]["auc"])),
        "mejora_logloss": float(dif.mean()),
        "pliegues_mejor_B": int((dif > 0).sum()),
        "or_estres_por_modalidad": {w: round(float(math.exp(c)), 3) for w, c in zip(MODALIDADES, coef_interaccion)},
    })
    mejora_consistente = len(dif) > 0 and bool((dif > 0).all())
    salida["lista_para_promover"] = n >= meta and mejora_consistente
    if salida["lista_para_promover"]:
        salida["mensaje"] = ("Con datos reales, añadir el estrés por modalidad mejora la predicción en todos los "
                             "pliegues. Se sugiere promoverlo; la decisión es de una persona.")
    elif n < meta:
        salida["mensaje"] = (f"Resultados preliminares con {n} sesiones: aún faltan {meta - n} para decidir. "
                             "Sigue en uso el modelo de la etapa A.")
    else:
        salida["mensaje"] = ("Con los datos reales, el estrés por modalidad no mejora de forma consistente. "
                             "Se mantiene el modelo de la etapa A.")
    return salida
