"""Estilo común de gráficas del laboratorio WELLTUR (notebooks y cartel).

Paleta categórica validada (orden fijo, nunca cíclico) y marcas finas sobre una
superficie clara. Las figuras se guardan en `MODELO/reports/figuras/`.
"""
from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt

FIGURAS = Path(__file__).resolve().parent.parent / "reports" / "figuras"

SUPERFICIE = "#fcfcfb"
TEXTO = "#0b0b0b"
TEXTO_2 = "#52514e"
REJILLA = "#e4e3df"
SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"]

ETIQUETAS_PREF = {
    "pref_cascadas_rios": "Cascadas, ríos y naturaleza",
    "pref_caminatas": "Caminatas en bosque/montaña",
    "pref_relajacion": "Relajación, meditación, respiración",
    "pref_hospedaje_tranquilo": "Hospedaje tranquilo",
    "pref_cultural": "Cultura y artesanía",
    "pref_gastronomia": "Gastronomía local",
    "pref_baja_intensidad": "Recreación de baja intensidad",
    "pref_comunidades": "Convivencia con comunidades rurales",
}

ETIQUETAS_W = {
    "W1": "W1 Pausa y descanso", "W2": "W2 Naturaleza", "W3": "W3 Movimiento",
    "W4": "W4 Mente-cuerpo", "W5": "W5 Culinaria", "W6": "W6 Cultura", "W7": "W7 Autocuidado",
}


def aplicar_estilo() -> None:
    plt.rcParams.update({
        "figure.facecolor": SUPERFICIE, "axes.facecolor": SUPERFICIE, "savefig.facecolor": SUPERFICIE,
        "axes.edgecolor": REJILLA, "axes.labelcolor": TEXTO_2, "text.color": TEXTO,
        "xtick.color": TEXTO_2, "ytick.color": TEXTO_2, "axes.grid": True, "grid.color": REJILLA,
        "grid.linewidth": 0.8, "axes.spines.top": False, "axes.spines.right": False,
        "axes.titlesize": 13, "axes.titleweight": "bold", "axes.titlelocation": "left",
        "font.size": 11, "figure.dpi": 110, "savefig.dpi": 200, "savefig.bbox": "tight",
    })


def guardar(fig, nombre: str) -> Path:
    FIGURAS.mkdir(parents=True, exist_ok=True)
    ruta = FIGURAS / f"{nombre}.png"
    fig.savefig(ruta)
    return ruta
