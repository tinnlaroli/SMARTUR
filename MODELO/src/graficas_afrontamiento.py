"""Gráficas de la comparación de modelos y del modelo PSS-10 -> afrontamiento (sección 4j).

Genera en reports/figuras/:
    11_benchmark_encuesta.png         11 modelos vs. popularidad con la encuesta (n = 137)
    11_afrontamiento_modelos.png      4 modelos + variante con edad/sexo, COVIDiSTRESS (n = 6,224)
    11_afrontamiento_r2.png           R² fuera de muestra por actividad y modelo
    11_afrontamiento_direccion.png    hacia dónde mueve el estrés cada actividad (Spearman, IC 95 %)
    11_afrontamiento_por_pss.png      cómo responde el modelo elegido según el puntaje PSS-10
    11_pesos_w_por_pss.png            pesos W1-W7 del ranker v3 con estrés bajo vs. alto

Uso:  python src/graficas_afrontamiento.py      (tarda ~2 min por la validación con edad/sexo)
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from scipy.stats import spearmanr  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
import modelo_afrontamiento as ma  # noqa: E402
import welltur_ranker_v2 as rk  # noqa: E402

RAIZ = Path(__file__).resolve().parents[1]
FIG = RAIZ / "reports" / "figuras"

# Paleta de referencia validada (dataviz: luminosidad, croma, daltonismo y contraste).
SUPERFICIE, TINTA, TINTA_2, REJILLA, NEUTRO = "#fcfcfb", "#0b0b0b", "#52514e", "#e4e3df", "#b5b3ad"
ENFASIS = "#2a78d6"                       # modelo elegido / una sola serie
SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"]   # orden fijo: azul, naranja, aqua, amarillo
POSITIVO, NEGATIVO = "#2a78d6", "#eb6834"  # polos divergentes; el 0 va en gris

NOMBRES_ACT = {
    "descanso_pasivo": "Descanso pasivo\n(series/películas) → M1",
    "convivencia": "Convivir con familia\ny amistades → M5",
    "actividad_pasatiempo": "Actividad o\npasatiempo → M2/M4",
    "espiritualidad": "Espiritualidad → M9",
}
CORTO_ACT = {"descanso_pasivo": "Descanso pasivo", "convivencia": "Convivencia",
             "actividad_pasatiempo": "Actividad/pasatiempo", "espiritualidad": "Espiritualidad"}


def _estilo(ax, titulo: str, subtitulo: str | None = None) -> None:
    ax.set_facecolor(SUPERFICIE)
    for lado in ("top", "right"):
        ax.spines[lado].set_visible(False)
    for lado in ("left", "bottom"):
        ax.spines[lado].set_color(NEUTRO)
    ax.tick_params(colors=TINTA_2, labelsize=9)
    ax.grid(axis="x", color=REJILLA, linewidth=0.8)
    ax.set_axisbelow(True)
    ax.set_title(titulo, loc="left", fontsize=12.5, fontweight="bold", color=TINTA, pad=22 if subtitulo else 10)
    if subtitulo:
        ax.text(0, 1.02, subtitulo, transform=ax.transAxes, fontsize=9, color=TINTA_2, va="bottom")


def _guardar(fig, nombre: str) -> None:
    fig.patch.set_facecolor(SUPERFICIE)
    fig.savefig(FIG / nombre, dpi=200, bbox_inches="tight", facecolor=SUPERFICIE)
    plt.close(fig)
    print("  ✓", nombre)


def _forest(ax, etiquetas, centros, ic, elegido_idx=None, base_label="línea base") -> None:
    y = np.arange(len(etiquetas))[::-1]
    for i, (c, (lo, hi)) in enumerate(zip(centros, ic)):
        color = ENFASIS if i == elegido_idx else NEUTRO
        ax.plot([lo, hi], [y[i], y[i]], color=color, linewidth=2, solid_capstyle="round")
        ax.plot(c, y[i], "o", markersize=8, color=color, markeredgecolor=SUPERFICIE, markeredgewidth=2, zorder=3)
        ax.text(hi, y[i], f"  {c:+.4f}", va="center", fontsize=8.5,
                color=TINTA if i == elegido_idx else TINTA_2, fontweight="bold" if i == elegido_idx else None)
    ax.axvline(0, color=TINTA_2, linewidth=1, linestyle=(0, (4, 3)))
    ax.text(0, y[0] + 0.7, f" {base_label}", fontsize=8.5, color=TINTA_2, va="bottom")
    ax.set_yticks(y, etiquetas, fontsize=9.5, color=TINTA)
    ax.set_ylim(-0.7, len(etiquetas) - 0.1)


def benchmark_encuesta() -> None:
    d = json.loads((RAIZ / "reports" / "experimentos_modelos.json").read_text(encoding="utf-8"))
    a = d["tarea_a_arranque_en_frio"]
    base = a["popularidad"]["ndcg@3"]
    nombres = {
        "knn_usuarios_estres_k15": "kNN por estrés", "logistica_L2_estres": "Logística L2 con estrés",
        "random_forest_encogido_50": "Random Forest (encogido)", "random_forest_perfil": "Random Forest (perfil)",
        "knn_usuarios_perfil_k15": "kNN por perfil", "logistica_L1_perfil": "Logística lasso (perfil)",
        "gradient_boosting_perfil": "Gradient Boosting (perfil)", "logistica_L2_perfil": "Logística 26 variables",
        "naive_bayes_perfil": "Naive Bayes", "red_neuronal_mlp_perfil": "Red neuronal MLP",
    }
    filas = sorted(((nombres[k], v["ndcg@3"] - base, v["ic95"]) for k, v in a.items() if k in nombres),
                   key=lambda f: -f[1])
    fig, ax = plt.subplots(figsize=(8.6, 5.4))
    _estilo(ax, "Encuesta WELLTUR: ningún modelo complejo supera a la popularidad",
            f"Diferencia de nDCG@3 vs. popularidad ({base:.3f}), IC 95 %, validación cruzada 5×10, n = 137")
    _forest(ax, [f[0] for f in filas], [f[1] for f in filas], [f[2] for f in filas],
            elegido_idx=None, base_label="popularidad")
    ax.set_xlabel("← peor que la popularidad        mejor →", color=TINTA_2, fontsize=9)
    ax.text(1.0, -0.13, "En uso: popularidad + efecto del estrés (OR 1.74, q = 0.041).",
            transform=ax.transAxes, ha="right", fontsize=8.5, color=TINTA_2)
    _guardar(fig, "11_benchmark_encuesta.png")


def comparacion_afrontamiento(x, y, mx) -> dict:
    resumen = json.loads((RAIZ / "reports" / "modelo_afrontamiento_v1.json").read_text(encoding="utf-8"))["comparacion"]
    edad = pd.to_numeric(mx["Dem_age"], errors="coerce").to_numpy(float)
    ok = ~np.isnan(edad)
    xd = np.column_stack([x, (edad - 40) / 10, (mx["Dem_gender"] == "Female").to_numpy(float)])[ok]
    demo = ma.validar(xd, y[ok])["ridge_10_items"]
    filas = [
        ("Ridge · 10 ítems PSS-10 (elegido)", resumen["ridge_10_items"]),
        ("Ridge · 10 ítems + edad + sexo", demo),
        ("Ridge · total PSS-10", resumen["ridge_total_pss"]),
        ("Gradient Boosting · 10 ítems", resumen["gradient_boosting_10_items"]),
    ]
    fig, ax = plt.subplots(figsize=(8.6, 3.9))
    _estilo(ax, "COVIDiSTRESS México: la PSS-10 apenas mejora al promedio",
            "Diferencia de nDCG (orden de 4 actividades por persona) vs. promedio, IC 95 %, CV 5×5, n = 6,224")
    _forest(ax, [f[0] for f in filas], [f[1]["dif_vs_base"] for f in filas],
            [f[1]["dif_ic95"] for f in filas], elegido_idx=0, base_label="promedio poblacional (nDCG 0.9103)")
    yy = np.arange(len(filas))[::-1]
    for i, f in enumerate(filas):
        ax.text(1.02, yy[i], f"gana {f[1]['pliegues_mejor_que_base']}/25 pliegues",
                transform=ax.get_yaxis_transform(), ha="left", va="center", fontsize=8.5, color=TINTA_2)
    ax.set_xlim(-0.0026, 0.0042)
    ax.set_xlabel("← peor que el promedio        mejor →", color=TINTA_2, fontsize=9)
    _guardar(fig, "11_afrontamiento_modelos.png")
    resumen["ridge_10_items_edad_sexo"] = demo
    return resumen


def r2_por_actividad(resumen: dict) -> None:
    modelos = [("ridge_10_items", "Ridge · 10 ítems (elegido)"), ("ridge_10_items_edad_sexo", "Ridge · + edad y sexo"),
               ("ridge_total_pss", "Ridge · total PSS-10"), ("gradient_boosting_10_items", "Gradient Boosting")]
    fig, axes = plt.subplots(1, 4, figsize=(11.5, 3.2), sharey=True, sharex=True)
    yy = np.arange(len(modelos))[::-1]
    for ax, objetivo in zip(axes, ma.OBJETIVOS):
        vals = [resumen[m]["r2_por_objetivo"][objetivo] * 100 for m, _ in modelos]
        colores = [ENFASIS if i == 0 else NEUTRO for i in range(len(modelos))]
        ax.barh(yy, vals, color=colores, height=0.6, edgecolor=SUPERFICIE, linewidth=2)
        for i, v in enumerate(vals):
            ax.text(v + (0.08 if v >= 0 else -0.08), yy[i], f"{v:.2f}", va="center",
                    ha="left" if v >= 0 else "right", fontsize=8, color=TINTA if i == 0 else TINTA_2)
        ax.axvline(0, color=TINTA_2, linewidth=0.8)
        ax.set_title(CORTO_ACT[objetivo], fontsize=10, color=TINTA, loc="left")
        for lado in ("top", "right", "left"):
            ax.spines[lado].set_visible(False)
        ax.spines["bottom"].set_color(NEUTRO)
        ax.tick_params(colors=TINTA_2, labelsize=8, left=False)
        ax.grid(axis="x", color=REJILLA, linewidth=0.8)
        ax.set_axisbelow(True)
        ax.set_facecolor(SUPERFICIE)
        ax.set_xlabel("R² (%)", color=TINTA_2, fontsize=8.5)
    axes[0].set_yticks(yy, [n for _, n in modelos], fontsize=9, color=TINTA)
    axes[0].set_xlim(-1.2, 4.2)
    fig.suptitle("Varianza explicada fuera de muestra por actividad: siempre menos del 4 %",
                 x=0.0, ha="left", fontsize=12.5, fontweight="bold", color=TINTA, y=1.06)
    _guardar(fig, "11_afrontamiento_r2.png")


def direccion(x, y) -> None:
    pss = x.sum(axis=1)
    n = len(pss)
    filas = []
    for k, objetivo in enumerate(ma.OBJETIVOS):
        rho, p = spearmanr(pss, y[:, k])
        z, se = np.arctanh(rho), 1 / np.sqrt(n - 3)  # IC de Fisher
        filas.append((NOMBRES_ACT[objetivo], rho, np.tanh(z - 1.96 * se), np.tanh(z + 1.96 * se), p))
    filas.sort(key=lambda f: -f[1])
    fig, ax = plt.subplots(figsize=(8.6, 3.8))
    _estilo(ax, "A más estrés, se valora más descansar y convivir",
            f"Correlación de Spearman entre PSS-10 y utilidad relativa de cada actividad, IC 95 %, n = {n:,}")
    yy = np.arange(len(filas))[::-1]
    for i, (nombre, rho, lo, hi, p) in enumerate(filas):
        color = POSITIVO if rho > 0 else NEGATIVO
        ax.barh(yy[i], rho, height=0.5, color=color, edgecolor=SUPERFICIE, linewidth=2)
        ax.plot([lo, hi], [yy[i], yy[i]], color=TINTA_2, linewidth=1.3)
        exp = int(np.floor(np.log10(p)))
        ax.text(hi + 0.004 if rho > 0 else lo - 0.004, yy[i],
                rf"ρ = {rho:+.3f}  (p = ${p / 10 ** exp:.0f}\times10^{{{exp}}}$)" if p < 0.001 else f"ρ = {rho:+.3f}  (p = {p:.3f})",
                va="center", ha="left" if rho > 0 else "right", fontsize=8.5, color=TINTA)
    ax.axvline(0, color=TINTA_2, linewidth=1)
    ax.set_yticks(yy, [f[0] for f in filas], fontsize=9, color=TINTA)
    ax.set_xlim(-0.16, 0.16)
    ax.set_xlabel("← menos útil con estrés alto        más útil con estrés alto →", color=TINTA_2, fontsize=9)
    _guardar(fig, "11_afrontamiento_direccion.png")


def respuesta_por_pss() -> None:
    modelo = rk.cargar_afrontamiento()
    totales = np.arange(0, 41)
    fig, ax = plt.subplots(figsize=(8.6, 4.4))
    _estilo(ax, "Lo que aprende el modelo elegido según el puntaje PSS-10",
            "Afinidad predicha por actividad (desviaciones estándar respecto al promedio de México)")
    ax.grid(axis="y", color=REJILLA, linewidth=0.8)
    for color, objetivo in zip(SERIES, ma.OBJETIVOS):
        c = modelo["coeficientes"][objetivo]
        pred = [c["intercepto"] + sum(c["pesos"]) * (t / 10) for t in totales]  # ítems iguales a t/10
        z = (np.array(pred) - modelo["promedio_poblacional"][objetivo]) / modelo["de_poblacional"][objetivo]
        ax.plot(totales, z, color=color, linewidth=2, label=CORTO_ACT[objetivo])
        ax.text(40.6, z[-1], CORTO_ACT[objetivo], va="center", fontsize=8.5, color=TINTA)
    ax.axhline(0, color=TINTA_2, linewidth=1, linestyle=(0, (4, 3)))
    ax.axvspan(18.6 - 7.5, 18.6 + 7.5, color=REJILLA, alpha=0.5, zorder=0)
    ax.text(18.6, ax.get_ylim()[1], "media ± 1 DE (normas MX)", ha="center", va="top", fontsize=8, color=TINTA_2)
    ax.set_xlabel("Puntaje PSS-10 (0–40)", color=TINTA_2, fontsize=9)
    ax.set_xlim(0, 40)
    ax.legend(loc="upper left", bbox_to_anchor=(0, -0.13), ncol=4, frameon=False, fontsize=8.5, labelcolor=TINTA)
    _guardar(fig, "11_afrontamiento_por_pss.png")


def pesos_w() -> None:
    art = rk.cargar_artefacto()
    def pesos(total: int) -> dict:
        # Respuestas crudas que dan ese total: negativos = v, positivos invertidos = 4 - v.
        v = total / 10
        crudos = [round(4 - v) if i in rk.PSS10_INVERTIDOS else round(v) for i in range(1, 11)]
        afin = rk.afinidad_afrontamiento(crudos)
        return rk.combinar_pesos(rk.estres_desde_pss10(total, art), [], art, afinidad=afin)
    bajo, alto = pesos(10), pesos(30)
    orden = sorted(rk.MODALIDADES, key=lambda w: -(alto[w] - bajo[w]))
    fig, ax = plt.subplots(figsize=(8.6, 4.4))
    _estilo(ax, "Ranker v3: cómo cambia la prioridad de cada modalidad con el estrés",
            "Peso del perfil (sin preferencias declaradas) con PSS-10 = 10 vs. PSS-10 = 30")
    yy = np.arange(len(orden))[::-1]
    for i, w in enumerate(orden):
        ax.plot([bajo[w] * 100, alto[w] * 100], [yy[i], yy[i]], color=NEUTRO, linewidth=2)
        ax.plot(bajo[w] * 100, yy[i], "o", color=NEUTRO, markersize=8, markeredgecolor=SUPERFICIE, markeredgewidth=2)
        ax.plot(alto[w] * 100, yy[i], "o", color=ENFASIS, markersize=9, markeredgecolor=SUPERFICIE, markeredgewidth=2)
        ax.text(max(bajo[w], alto[w]) * 100 + 0.6, yy[i], f"{(alto[w] - bajo[w]) * 100:+.1f} pts",
                va="center", fontsize=8.5, color=TINTA)
    ax.set_yticks(yy, [f"{w} · {rk.NOMBRES_W[w]}" for w in orden], fontsize=9, color=TINTA)
    ax.plot([], [], "o", color=NEUTRO, label="PSS-10 = 10 (estrés bajo)")
    ax.plot([], [], "o", color=ENFASIS, label="PSS-10 = 30 (estrés alto)")
    ax.legend(loc="upper right", frameon=False, fontsize=8.5, labelcolor=TINTA)
    ax.set_xlim(right=36)
    ax.set_xlabel("Peso de la modalidad en el perfil (%)", color=TINTA_2, fontsize=9)
    _guardar(fig, "11_pesos_w_por_pss.png")


def main() -> None:
    FIG.mkdir(parents=True, exist_ok=True)
    plt.rcParams["font.family"] = "DejaVu Sans"
    benchmark_encuesta()
    x, y, mx = ma.cargar()
    resumen = comparacion_afrontamiento(x, y, mx)
    r2_por_actividad(resumen)
    direccion(x, y)
    respuesta_por_pss()
    pesos_w()


if __name__ == "__main__":
    main()
