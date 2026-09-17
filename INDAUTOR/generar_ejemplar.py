# -*- coding: utf-8 -*-
"""
Genera el "Ejemplar de la obra" para el registro de programa de cómputo ante
INDAUTOR: código fuente del motor de recomendación SMARTUR (MODELO), paginado,
con portada de identificación. Produce dos PDF:
  - SMARTUR_codigo_completo.pdf     (todo el código, referencia)
  - SMARTUR_INDAUTOR_ejemplar.pdf   (portada + primeras 10 y últimas 10 páginas)
"""
import os
from datetime import date
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages

SRC = os.path.join(os.path.dirname(__file__), "..", "MODELO", "src")

# Orden: primero el núcleo novedoso (blend híbrido), luego el resto del motor.
FILES = [
    "fusion.py", "cf.py", "engine.py", "rf_model.py", "context_encoder.py",
    "content_model.py", "lightfm_model.py", "gbm_model.py", "model_metrics.py",
    "cross_validation.py", "evaluate.py", "poi_repository.py",
    "synthetic_training.py", "synthetic_persona_validation.py",
    "route_optimizer.py", "api.py",
]

OBRA   = "SMARTUR: Motor Híbrido de Recomendación Turística"
TIPO   = "Programa de cómputo"
AUTORES = [
    ("Martín Lara Olivares"),
    ("Fernanda Pacheco Banda"),
    ("Aarón Ochoa Ramírez"),
]
INSTIT = "Universidad Tecnológica del Centro de Veracruz — Cuitláhuac, Veracruz, México"

# ── Layout ──────────────────────────────────────────────────────────────────
LINES_PER_PAGE = 60
MAX_CHARS      = 98
FONT_SIZE      = 6.3
PAGE_W, PAGE_H = 8.5, 11.0   # Carta


def _wrap(line: str):
    """Parte líneas largas en trozos de MAX_CHARS, con sangría de continuación."""
    line = line.replace("\t", "    ").rstrip("\n")
    if len(line) <= MAX_CHARS:
        return [line]
    out, first = [], True
    while line:
        cut = MAX_CHARS if first else MAX_CHARS - 4
        out.append(("" if first else "    ") + line[:cut])
        line = line[cut:]
        first = False
    return out


def build_display_lines():
    """Devuelve lista de (texto, tipo) donde tipo ∈ {'head','code'}."""
    disp = []
    for fname in FILES:
        path = os.path.join(SRC, fname)
        if not os.path.exists(path):
            continue
        disp.append((f"  ===== MODELO/src/{fname} =====", "head"))
        with open(path, encoding="utf-8") as fh:
            for i, raw in enumerate(fh.readlines(), 1):
                for j, seg in enumerate(_wrap(raw)):
                    num = f"{i:>4} " if j == 0 else "     "
                    disp.append((num + seg, "code"))
        disp.append(("", "code"))
    return disp


def paginate(disp):
    return [disp[i:i + LINES_PER_PAGE] for i in range(0, len(disp), LINES_PER_PAGE)]


def draw_cover(pdf):
    fig = plt.figure(figsize=(PAGE_W, PAGE_H))
    fig.text(0.5, 0.86, "EJEMPLAR DE LA OBRA", ha="center", fontsize=13,
             fontweight="bold", family="DejaVu Sans")
    fig.text(0.5, 0.82, "Registro de Programa de Cómputo — INDAUTOR", ha="center",
             fontsize=9, family="DejaVu Sans", color="#444")
    fig.text(0.5, 0.70, OBRA, ha="center", fontsize=12, fontweight="bold",
             family="DejaVu Sans", wrap=True)
    fig.text(0.5, 0.645, f"Tipo de obra: {TIPO}", ha="center", fontsize=9,
             family="DejaVu Sans", color="#333")
    y = 0.52
    fig.text(0.5, y + 0.05, "Autores", ha="center", fontsize=10, fontweight="bold",
             family="DejaVu Sans")
    for nombre in AUTORES:
        fig.text(0.5, y, f"{nombre}  ", ha="center",
                 fontsize=9.5, family="DejaVu Sans")
        y -= 0.035
    fig.text(0.5, 0.33, INSTIT, ha="center", fontsize=8.5, family="DejaVu Sans",
             color="#333", wrap=True)
    fig.text(0.5, 0.16,
             "Contenido: código fuente del motor de recomendación (MODELO).\n"
             "Este ejemplar contiene las primeras 10 y las últimas 10 páginas\n"
             "del listado de código fuente, conforme al requisito de INDAUTOR.",
             ha="center", fontsize=8, family="DejaVu Sans", color="#555")
    fig.text(0.5, 0.06, date.today().strftime("Cuitláhuac, Veracruz — %d/%m/%Y"),
             ha="center", fontsize=8.5, family="DejaVu Sans", color="#333")
    for a in fig.axes:
        a.axis("off")
    pdf.savefig(fig)
    plt.close(fig)


def draw_page(pdf, page_lines, page_no, total):
    fig = plt.figure(figsize=(PAGE_W, PAGE_H))
    txt = []
    for text, kind in page_lines:
        txt.append(text)
    body = "\n".join(txt)
    fig.text(0.06, 0.955, body, ha="left", va="top", family="monospace",
             fontsize=FONT_SIZE, color="#111")
    # Encabezado y pie
    fig.text(0.06, 0.975, OBRA, ha="left", fontsize=6.5, family="DejaVu Sans",
             color="#777")
    fig.text(0.94, 0.975, f"Pág. {page_no} de {total}", ha="right", fontsize=6.5,
             family="DejaVu Sans", color="#777")
    for a in fig.axes:
        a.axis("off")
    pdf.savefig(fig)
    plt.close(fig)


def main():
    disp = build_display_lines()
    pages = paginate(disp)
    total = len(pages)
    out_dir = os.path.dirname(__file__)

    # PDF completo (referencia)
    full = os.path.join(out_dir, "SMARTUR_codigo_completo.pdf")
    with PdfPages(full) as pdf:
        draw_cover(pdf)
        for n, pg in enumerate(pages, 1):
            draw_page(pdf, pg, n, total)

    # PDF ejemplar: portada + primeras 10 + últimas 10 páginas de código
    first = list(range(0, min(10, total)))
    last = list(range(max(0, total - 10), total))
    sel = first + [None] + last if total > 20 else list(range(total))
    ejemplar = os.path.join(out_dir, "SMARTUR_INDAUTOR_ejemplar.pdf")
    with PdfPages(ejemplar) as pdf:
        draw_cover(pdf)
        for idx in sel:
            if idx is None:
                fig = plt.figure(figsize=(PAGE_W, PAGE_H))
                fig.text(0.5, 0.5, "[ … páginas intermedias omitidas … ]",
                         ha="center", fontsize=10, family="DejaVu Sans", color="#888")
                for a in fig.axes:
                    a.axis("off")
                pdf.savefig(fig)
                plt.close(fig)
            else:
                draw_page(pdf, pages[idx], idx + 1, total)

    print(f"Código completo: {total} páginas -> {os.path.basename(full)}")
    print(f"Ejemplar INDAUTOR: portada + primeras 10 + últimas 10 -> {os.path.basename(ejemplar)}")


if __name__ == "__main__":
    main()
