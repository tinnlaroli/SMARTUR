"""
Genera la mejor imagen del sistema WellTur: recomendaciones por perfil side-by-side.
Muestra como el mismo usuario con diferentes estados obtiene recomendaciones
radicalmente distintas y coherentes con su perfil.
"""
import sys, os, warnings
warnings.filterwarnings('ignore')
os.environ['PYTHONIOENCODING'] = 'utf-8'

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
SRC = BASE / 'src'
OUTPUT = BASE / 'analysis_output'
sys.path.insert(0, str(SRC))

from wellness_classifier import get_classifier, MODO_VIAJE_LABELS
from wellness_matchmaker import load_destinations, recommend_wellness

clf = get_classifier()
clf.load()
meta = clf.metrics
destinations = load_destinations()

# El mismo usuario con 3 estados de animo distintos -> 3 perfiles -> 3 recomendaciones diferentes
scenarios = [
    (2, 1, 4, 3, 'Burnout',       'modo_calma',        '#2E7D32',
     'Usuario agotado\nmentalmente\n(Q1=2, Q2=1, Q3=4, Q4=3)',
     'Busca silencio y\ndesconexion total'),
    (3, 4, 2, 3, 'Fatiga_Fisica', 'modo_restauracion', '#1565C0',
     'Usuario con tension\nfisica alta\n(Q1=3, Q2=4, Q3=2, Q4=3)',
     'Busca recuperacion\ncorporal y descanso'),
    (1, 3, 3, 4, 'Hiperactividad_Ansiosa', 'modo_equilibrio', '#E65100',
     'Usuario ansioso\ny sobre-estimulado\n(Q1=1, Q2=3, Q3=3, Q4=4)',
     'Busca regulacion\ny paz interior'),
]

# ── FIGURE: WellTur Personalization Showcase ──
fig = plt.figure(figsize=(16, 10))
fig.patch.set_facecolor('#0F1117')  # dark premium bg

fig.text(0.5, 0.955, 'WellTur — Sistema de Recomendacion Inteligente de Bienestar',
         fontsize=18, fontweight='bold', ha='center', color='white',
         fontfamily='sans-serif')
fig.text(0.5, 0.938, 'El mismo usuario, 3 estados de animo distintos -> 3 recomendaciones personalizadas',
         fontsize=10, ha='center', color='#8899AA', fontfamily='sans-serif')

# ── Title separator ──
fig.text(0.5, 0.928, '━' * 80, fontsize=6, ha='center', color='#333844')

# Subtitle
fig.text(0.5, 0.915, 'Un unico usuario completa el test Q1-Q4 en 3 momentos diferentes. El sistema clasifica su estado y genera recomendaciones a la medida.',
         fontsize=8.5, ha='center', color='#5A6A7A', style='italic')

for idx, (q1, q2, q3, q4, perfil, modo, color, title, subtitle) in enumerate(scenarios):
    x0 = 0.04 + idx * 0.325
    y0 = 0.08
    w, h = 0.30, 0.81

    ax = fig.add_axes([x0, y0, w, h])
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    ax.set_facecolor('#1A1D26')

    # Card background
    card = FancyBboxPatch((0, 0), 1, 1, facecolor='#1A1D26', edgecolor=color,
                          linewidth=1.5, boxstyle='round,pad=0.02')
    ax.add_patch(card)

    # Profile header
    header = FancyBboxPatch((0, 0.88), 1, 0.12, facecolor=color, edgecolor='none',
                            boxstyle='round,pad=0.02')
    ax.add_patch(header)
    modo_label = MODO_VIAJE_LABELS.get(modo, modo)
    ax.text(0.5, 0.935, modo_label, fontsize=14, fontweight='bold',
            ha='center', va='center', color='white')
    ax.text(0.5, 0.90, f'Perfil: {perfil}', fontsize=7.5,
            ha='center', va='center', color='white', alpha=0.85)

    # Scenario description
    ax.text(0.06, 0.835, title, fontsize=7.5, color='#CCD4DC', va='top', linespacing=1.4)
    ax.text(0.55, 0.835, subtitle, fontsize=7.5, color='#8899AA', va='top', style='italic', linespacing=1.4)

    # Divider
    ax.plot([0.06, 0.94], [0.785, 0.785], color='#2A2D37', linewidth=1)

    # Recommendations
    recs = recommend_wellness(destinations, perfil, q1, q2, q3, q4, top_n=3, stress_confidence=0.85)

    # Table header
    ax.text(0.06, 0.762, 'R', fontsize=7, fontweight='bold', color=color, va='center')
    ax.text(0.14, 0.762, 'Destino', fontsize=7, fontweight='bold', color=color, va='center')
    ax.text(0.72, 0.762, 'Match', fontsize=7, fontweight='bold', color=color, va='center')
    ax.text(0.86, 0.762, 'Categoria', fontsize=7, fontweight='bold', color=color, va='center')

    for rank, r in enumerate(recs):
        y_r = 0.71 - rank * 0.065
        bg_row = '#242732' if rank % 2 == 0 else '#1A1D26'
        row_bg = FancyBboxPatch((0.03, y_r - 0.025), 0.94, 0.052, facecolor=bg_row,
                                edgecolor='none', boxstyle='round,pad=0.01')
        ax.add_patch(row_bg)

        # Rank circle
        circle = plt.Circle((0.075, y_r + 0.001), 0.018, facecolor=color, edgecolor='none')
        ax.add_patch(circle)
        ax.text(0.075, y_r + 0.001, str(rank+1), fontsize=6.5, fontweight='bold',
                ha='center', va='center', color='white')

        ax.text(0.14, y_r + 0.001, r['nombre_lugar'][:25], fontsize=7.5,
                va='center', color='#E8ECF0', fontweight='bold')

        # Match bar
        match = r['match_pct'] / 100.0
        bar_match = FancyBboxPatch((0.60, y_r - 0.008), 0.30 * match, 0.018,
                                   facecolor=color, edgecolor='none',
                                   boxstyle='round,pad=0.01')
        ax.add_patch(bar_match)
        ax.text(0.72, y_r + 0.001, f"{r['match_pct']:.0f}%", fontsize=8,
                ha='center', va='center', color='white', fontweight='bold')

        ax.text(0.86, y_r + 0.001, r['categoria_wellness'][:12], fontsize=6.5,
                va='center', color='#8899AA')

    # Benefits section
    ax.plot([0.06, 0.94], [0.505, 0.505], color='#2A2D37', linewidth=1)

    # Match quality indicator
    avg_match = np.mean([r['match_pct'] for r in recs])
    ax.text(0.06, 0.48, 'Calidad de recomendacion', fontsize=7, color='#8899AA', va='center')
    ax.text(0.06, 0.44, f"Match promedio: {avg_match:.0f}%", fontsize=8.5,
            color='white', fontweight='bold', va='center')

    # Category diversity
    cats = [r['categoria_wellness'] for r in recs]
    ax.text(0.50, 0.48, 'Diversidad', fontsize=7, color='#8899AA', va='center')
    ax.text(0.50, 0.44, f"{len(set(cats))}/{len(cats)} categorias unicas",
            fontsize=8.5, color='white', fontweight='bold', va='center')

    # Destination count badge
    ax.text(0.78, 0.48, 'Catalogo', fontsize=7, color='#8899AA', va='center')
    ax.text(0.78, 0.44, '182 destinos', fontsize=8.5, color='white', fontweight='bold', va='center')

    # Bottom metrics
    ax.plot([0.06, 0.94], [0.395, 0.395], color='#2A2D37', linewidth=1)

    # Mini metric boxes
    dims_info = [
        ('Aislamiento', f"{np.mean([r['nivel_aislamiento'] for r in recs]):.2f}"),
        ('Restauracion', f"{np.mean([r['restauracion_pasiva'] for r in recs]):.2f}"),
        ('Demanda', f"{np.mean([r['demanda_fisica'] for r in recs]):.2f}"),
    ]
    for mi, (dlabel, dval) in enumerate(dims_info):
        dx = 0.08 + mi * 0.30
        dm_card = FancyBboxPatch((dx, 0.33), 0.27, 0.05, facecolor='#242732',
                                 edgecolor='#333844', linewidth=0.8, boxstyle='round,pad=0.02')
        ax.add_patch(dm_card)
        ax.text(dx + 0.135, 0.353, dval, fontsize=10, fontweight='bold',
                ha='center', va='center', color=color)
        ax.text(dx + 0.135, 0.31, dlabel, fontsize=6.5,
                ha='center', va='center', color='#8899AA')

    # Vector ideal bar
    ideal = {
        'Burnout': [0.75, 0.90, 0.20],
        'Fatiga_Fisica': [0.55, 0.85, 0.15],
        'Hiperactividad_Ansiosa': [0.70, 0.75, 0.35],
    }[perfil]
    ax.plot([0.06, 0.94], [0.28, 0.28], color='#2A2D37', linewidth=1)
    ax.text(0.06, 0.255, 'Vector ideal del perfil', fontsize=6.5, color='#8899AA', va='center')
    for bi, (ival, ilabel) in enumerate(zip(ideal, ['Aislamiento', 'Restauracion', 'Demanda'])):
        bx = 0.50 + bi * 0.15
        ax.text(bx, 0.255, f'{ilabel}: {ival:.2f}', fontsize=6.5, color='#CCD4DC', va='center')

    # Icons row
    icon_texts = {
        'modo_calma':        ['Retiro_Silencio', 'Spa', 'Termal'],
        'modo_restauracion': ['Termal', 'Spa', 'Lago'],
        'modo_equilibrio':   ['Retiro_Silencio', 'Bosque', 'Montana'],
    }[modo]
    ax.plot([0.06, 0.94], [0.225, 0.225], color='#2A2D37', linewidth=1)
    ax.text(0.06, 0.20, 'Categorias recomendadas:', fontsize=6.5, color='#8899AA', va='center')
    for ci, ct in enumerate(icon_texts):
        cx = 0.50 + ci * 0.15
        ax.text(cx, 0.20, ct, fontsize=6.5, color=color, va='center', fontweight='bold')

    # Score bars at bottom
    score_colors = [color, color, color]
    for si, sc in enumerate(['Beneficio', 'Alineacion', 'Sentiment']):
        sx = 0.06 + si * 0.305
        s_val = [r['beneficio_optimo_pct']/100 for r in recs]
        sa_val = [r['alineacion_pct']/100 for r in recs]
        ax.text(sx + 0.03, 0.145, sc, fontsize=6, color='#8899AA', va='center')
        val_mean = np.mean(s_val if si == 0 else sa_val if si == 1 else [r.get('wellness_sentiment_score', 0.5) for r in recs])
        bar_bg = FancyBboxPatch((sx, 0.105), 0.27, 0.025, facecolor='#242732',
                                edgecolor='none', boxstyle='round,pad=0.01')
        ax.add_patch(bar_bg)
        bar_fg = FancyBboxPatch((sx, 0.105), 0.27 * val_mean, 0.025,
                                facecolor=color, edgecolor='none',
                                boxstyle='round,pad=0.01', alpha=0.8)
        ax.add_patch(bar_fg)
        ax.text(sx + 0.03, 0.09, f'{val_mean:.0%}', fontsize=7, fontweight='bold',
                color='white', va='center')

# ── Footer ──
fig.text(0.5, 0.025, 'SMARTUR v4 — WellTur | 182 destinos | 208k reviews analizadas via NLP | Clasificador HistGBM + CalibratedCV',
         fontsize=7.5, ha='center', color='#5A6A7A', fontfamily='monospace')

# ── Legend ──
legend_ax = fig.add_axes([0.25, 0.01, 0.5, 0.025])
legend_ax.axis('off')
legend_ax.text(0.5, 0.5, 'Accuracy: 52.7%  |  Macro F1: 0.52  |  Destinos: 182  |  Reviews analizadas: 208,051  |  Feedback loop: SI',
               fontsize=8, ha='center', va='center', color='#8899AA', fontfamily='monospace')

fig.savefig(OUTPUT / 'welltur_personalization_showcase.png', dpi=200, bbox_inches='tight',
            facecolor=fig.get_facecolor(), edgecolor='none')
plt.close(fig)
print(f"[OK] welltur_personalization_showcase.png ({OUTPUT / 'welltur_personalization_showcase.png'})")
