"""
Gráfica única para cartel con colores: Verde bosque #254117, Amarillo mostaza #ffbd59, Rosa viejo #cd6184
"""
import sys, os, warnings
warnings.filterwarnings('ignore')
os.environ['PYTHONIOENCODING'] = 'utf-8'

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
SRC = BASE / 'src'
OUTPUT = BASE / 'analysis_output'
sys.path.insert(0, str(SRC))

from wellness_classifier import get_classifier, MODO_VIAJE_LABELS
from wellness_matchmaker import load_destinations, recommend_wellness

clf = get_classifier()
clf.load()
destinations = load_destinations()

# Brand colors
VERDE = '#254117'
AMARILLO = '#ffbd59'
ROSA = '#cd6184'
BLANCO = '#FAF6F0'
GRIS = '#5A5A5A'

# ── Labels corregidas ortográficamente ──
MODO_CALMA_LABEL = 'Modo Calma'
MODO_RESTAURACION_LABEL = 'Modo Restauración'
MODO_EQUILIBRIO_LABEL = 'Modo Equilibrio'

profiles = [
    (2, 2, 4, 3, 'Burnout', 'modo_calma',
     'Agotamiento\nmental',
     'Desconexión total\ny silencio',
     'Retiro_Silencio, Spa, Termal',
     MODO_CALMA_LABEL),
    (3, 4, 2, 3, 'Fatiga_Fisica', 'modo_restauracion',
     'Tensión\nfísica',
     'Recuperación\ncorporal',
     'Termal, Spa, Lago',
     MODO_RESTAURACION_LABEL),
    (1, 3, 3, 4, 'Hiperactividad_Ansiosa', 'modo_equilibrio',
     'Sobre-\nestimulación',
     'Regulación\ny paz interior',
     'Retiro_Silencio, Bosque, Montaña',
     MODO_EQUILIBRIO_LABEL),
]

colors_profiles = [VERDE, AMARILLO, ROSA]

fig, ax = plt.subplots(figsize=(14, 7.5))
fig.patch.set_facecolor(BLANCO)
ax.set_xlim(0, 14)
ax.set_ylim(0, 7.5)
ax.axis('off')

# Title
ax.text(7, 7.15, 'WellTur', fontsize=24, fontweight='bold', ha='center', color=VERDE,
        fontfamily='sans-serif')
ax.text(7, 6.8, 'Recomendaciones personalizadas de bienestar', fontsize=11, ha='center', color=GRIS)

# Separator
ax.plot([2, 12], [6.5, 6.5], color=AMARILLO, linewidth=2)
ax.plot([2, 12], [6.45, 6.45], color=ROSA, linewidth=1, alpha=0.5)

# Subtitle
ax.text(7, 6.2, 'El sistema analiza tu estado emocional (Q1-Q4) y te recomienda el destino ideal',
         fontsize=8.5, ha='center', color=GRIS, style='italic')

# Three profile columns
for idx, (q1, q2, q3, q4, perfil, modo, problema, solucion, categorias, modo_label) in enumerate(profiles):
    x0 = 0.8 + idx * 4.3
    color = colors_profiles[idx]

    # Card background
    card = FancyBboxPatch((x0, 0.5), 3.8, 5.3, facecolor='white', edgecolor=color,
                          linewidth=2.5, boxstyle='round,pad=0.12')
    ax.add_patch(card)

    # Profile header bar
    header = FancyBboxPatch((x0, 5.0), 3.8, 0.8, facecolor=color, edgecolor='none',
                            boxstyle='round,pad=0.12')
    ax.add_patch(header)
    ax.text(x0 + 1.9, 5.4, modo_label, fontsize=13, fontweight='bold', ha='center', va='center', color='white')

    # Problem / Solution
    ax.text(x0 + 0.5, 4.6, 'Estado:', fontsize=7.5, fontweight='bold', color=GRIS, va='center')
    ax.text(x0 + 1.5, 4.6, problema, fontsize=8, color='#444', va='center', linespacing=1.3)
    ax.text(x0 + 0.5, 4.0, 'Necesita:', fontsize=7.5, fontweight='bold', color=GRIS, va='center')
    ax.text(x0 + 1.5, 4.0, solucion, fontsize=8, color='#444', va='center', linespacing=1.3)

    # Divider
    ax.plot([x0 + 0.3, x0 + 3.5], [3.65, 3.65], color='#E0D8CC', linewidth=1)

    # Recommendations
    recs = recommend_wellness(destinations, perfil, q1, q2, q3, q4, top_n=3, stress_confidence=0.85)

    ax.text(x0 + 1.9, 3.45, 'Recomendaciones', fontsize=8, fontweight='bold', ha='center', color=color)

    for rank, r in enumerate(recs):
        y_r = 2.95 - rank * 0.5

        # Match score badge
        circle = plt.Circle((x0 + 0.35, y_r + 0.05), 0.18, facecolor=color, edgecolor='none')
        ax.add_patch(circle)
        ax.text(x0 + 0.35, y_r + 0.05, f"{r['match_pct']:.0f}%", fontsize=7,
                ha='center', va='center', color='white', fontweight='bold')

        # Destination name
        ax.text(x0 + 0.7, y_r + 0.05, r['nombre_lugar'][:20], fontsize=8,
                va='center', color='#222', fontweight='bold')

        # Category
        ax.text(x0 + 2.6, y_r + 0.05, r['categoria_wellness'][:16], fontsize=7,
                va='center', color=GRIS)

        # Match bar
        match_pct = r['match_pct'] / 100.0
        bar_bg = FancyBboxPatch((x0 + 0.3, y_r - 0.22), 3.2, 0.06, facecolor='#F0ECE6',
                                edgecolor='none', boxstyle='round,pad=0.01')
        ax.add_patch(bar_bg)
        bar_fg = FancyBboxPatch((x0 + 0.3, y_r - 0.22), 3.2 * match_pct, 0.06,
                                facecolor=color, edgecolor='none',
                                boxstyle='round,pad=0.01', alpha=0.3)
        ax.add_patch(bar_fg)

    # Bottom metrics
    ax.plot([x0 + 0.3, x0 + 3.5], [1.2, 1.2], color='#E0D8CC', linewidth=0.8)

    avg_match = np.mean([r['match_pct'] for r in recs])
    ax.text(x0 + 1.9, 0.95, f"Coincidencia promedio: {avg_match:.0f}%", fontsize=8.5,
            ha='center', va='center', color=color, fontweight='bold')

# Footer legend
ax.text(7, 0.2, '182 destinos turísticos en México  |  208,051 opiniones analizadas con NLP  |  Clasificador ML con 52.7% de precisión',
        fontsize=7.5, ha='center', color=GRIS)
ax.text(7, 0.05, 'WELLTUR  |  Modelo entrenado con REST-MEX 2025 + datos SECTUR',
        fontsize=7, ha='center', color='#999')

fig.savefig(OUTPUT / 'welltur_cartel.png', dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor())
plt.close(fig)
print(f"[OK] welltur_cartel.png")
