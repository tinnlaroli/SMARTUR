"""
Genera una imagen "presumible" del sistema WellTur para presentacion.
Muestra el pipeline end-to-end + calidad de recomendaciones + impacto.
"""
import sys, os, warnings, json
warnings.filterwarnings('ignore')
os.environ['PYTHONIOENCODING'] = 'utf-8'

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import matplotlib.patheffects as pe
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
SRC = BASE / 'src'
OUTPUT = BASE / 'analysis_output'
sys.path.insert(0, str(SRC))

from wellness_classifier import WellnessProfileClassifier, get_classifier, MODO_VIAJE_LABELS, MODO_VIAJE_DESCRIPTION
from wellness_matchmaker import load_destinations, recommend_wellness, PROFILE_IDEAL

clf = get_classifier()
clf.load()
meta = clf.metrics

destinations = load_destinations()

# =========================================================================
# FIGURE: WellTur System Showcase
# =========================================================================
fig = plt.figure(figsize=(20, 14))
fig.patch.set_facecolor('#FAFBFC')

gs = fig.add_gridspec(4, 4, hspace=0.35, wspace=0.35,
                      left=0.04, right=0.96, top=0.94, bottom=0.04)

# TITLE
fig.text(0.5, 0.975, 'WellTur - Sistema de Recomendacion de Bienestar', fontsize=20, fontweight='bold',
         ha='center', color='#1a1a2e', fontfamily='sans-serif')
fig.text(0.5, 0.958, 'Clasificador de perfil + Matchmaking con 182 destinos enriquecidos via NLP', fontsize=11,
         ha='center', color='#666', fontfamily='sans-serif')

# 1. Profiles Panel (top-left)
ax1 = fig.add_subplot(gs[0, 0:2])
ax1.set_xlim(0, 10)
ax1.set_ylim(0, 6)
ax1.axis('off')
ax1.set_facecolor('#FAFBFC')

profiles_data = [
    ('modo_calma',   '#4CAF50', 'Burnout',    '0.75, 0.90, 0.20', 'Retiro_Silencio, Spa, Termal', 'Restauracion cognitiva'),
    ('modo_restauracion', '#2196F3', 'Fatiga_Fisica', '0.55, 0.85, 0.15', 'Termal, Spa, Lago', 'Recuperacion corporal'),
    ('modo_equilibrio', '#FF9800', 'Hiperactividad_Ansiosa', '0.70, 0.75, 0.35', 'Retiro_Silencio, Bosque, Montana', 'Regulacion y silencio'),
]

ax1.text(5, 5.5, 'Perfiles de Viaje WellTur', fontsize=14, fontweight='bold', ha='center', color='#1a1a2e')
for idx, (name, color, internal, ideal, cats, desc) in enumerate(profiles_data):
    y0 = 3.8 - idx * 1.7
    card = FancyBboxPatch((0.3, y0), 9.4, 1.4, facecolor='white', edgecolor=color,
                          linewidth=2, boxstyle='round,pad=0.12')
    ax1.add_patch(card)
    bar = FancyBboxPatch((0.3, y0), 0.15, 1.4, facecolor=color, edgecolor='none', boxstyle='round,pad=0.02')
    ax1.add_patch(bar)
    ax1.text(0.8, y0 + 1.0, name, fontsize=13, fontweight='bold', color=color, va='center')
    ax1.text(0.8, y0 + 0.4, f'Vector ideal: [{ideal}]', fontsize=8.5, color='#555', va='center')
    ax1.text(5.5, y0 + 1.0, f'Categorias: {cats}', fontsize=9, color='#444', va='center')
    ax1.text(5.5, y0 + 0.4, desc, fontsize=9, color='#777', va='center', style='italic')

# 2. Architecture Pipeline (top-right)
ax2 = fig.add_subplot(gs[0, 2:4])
ax2.set_xlim(0, 10)
ax2.set_ylim(0, 6)
ax2.axis('off')
ax2.set_facecolor('#FAFBFC')

ax2.text(5, 5.5, 'Pipeline de Recomendacion', fontsize=14, fontweight='bold', ha='center', color='#1a1a2e')

steps = [
    (0.5, 3.3, '#E3F2FD', '#1565C0', 'Usuario\nresponde\nQ1-Q4 (1-4)'),
    (2.5, 3.3, '#E8F5E9', '#2E7D32', 'Clasificador\nHistGBM+\nCalibratedCV'),
    (4.5, 3.3, '#FFF3E0', '#E65100', 'Matchmaker\nCosSim + soft\npenalties'),
    (6.5, 3.3, '#F3E5F5', '#6A1B9A', 'Benefit\nScoring\n(YAML + cat)'),
    (8.5, 3.3, '#E0F2F1', '#00695C', 'Top-3\nrecomendaciones\ndestinos'),
]

for x, y, bg, edge, label in steps:
    box = FancyBboxPatch((x - 0.85, y - 0.55), 1.7, 1.1, facecolor=bg, edgecolor=edge,
                          linewidth=1.5, boxstyle='round,pad=0.08')
    ax2.add_patch(box)
    ax2.text(x, y, label, fontsize=7.5, ha='center', va='center', color='#333', fontweight='bold')

for i in range(len(steps) - 1):
    x1 = steps[i][0] + 0.85
    x2 = steps[i+1][0] - 0.85
    ax2.annotate('', xy=(x2, 3.3), xytext=(x1, 3.3),
                 arrowprops=dict(arrowstyle='->', color='#888', lw=1.5))

boxes_info = [
    (0.7, 1.6, '#FCE4EC', 'Confianza ML\n>0.58 -> ML\n<0.58 -> reglas'),
    (3.2, 1.6, '#E8EAF6', 'Feature cols:\n4 raw + 3 derivadas\ncarga_global, etc'),
    (5.8, 1.6, '#FFF8E1', 'Score final =\n0.50*benef+\n0.35*alin+0.05*sent'),
    (8.3, 1.6, '#F1F8E9', '182 destinos\nenriquecidos\n208k reviews analizadas'),
]
for x, y, bg, txt in boxes_info:
    box = FancyBboxPatch((x - 0.75, y - 0.4), 1.5, 0.8, facecolor=bg, edgecolor='#ccc',
                          linewidth=1, boxstyle='round,pad=0.06')
    ax2.add_patch(box)
    ax2.text(x, y, txt, fontsize=6.8, ha='center', va='center', color='#444')

# 3. Recommendations Panel (middle row)
ax3 = fig.add_subplot(gs[1, :])
ax3.set_xlim(0, 10)
ax3.set_ylim(0, 5)
ax3.axis('off')

test_cases = [
    (2, 2, 4, 3, 'Burnout', 'modo_calma', '#4CAF50'),
    (3, 4, 2, 3, 'Fatiga_Fisica', 'modo_restauracion', '#2196F3'),
    (1, 3, 3, 4, 'Hiperactividad_Ansiosa', 'modo_equilibrio', '#FF9800'),
]

ax3.text(5, 4.6, 'Recomendaciones Generadas por Perfil', fontsize=14, fontweight='bold', ha='center', color='#1a1a2e')

for col_idx, (q1, q2, q3, q4, perfil, modo, color) in enumerate(test_cases):
    x0 = 0.4 + col_idx * 3.3
    recs = recommend_wellness(destinations, perfil, q1, q2, q3, q4, top_n=3, stress_confidence=0.85)

    label = MODO_VIAJE_LABELS.get(modo, modo)
    ax3.text(x0 + 1.5, 4.1, f'{label}', fontsize=11, fontweight='bold', ha='center', color=color)
    ax3.text(x0 + 1.5, 3.8, f'Q={q1},{q2},{q3},{q4} | conf=85%', fontsize=7, ha='center', color='#888')

    y_h = 3.3
    header = FancyBboxPatch((x0, y_h - 0.22), 3.0, 0.32, facecolor=color, edgecolor=color,
                            linewidth=1, boxstyle='round,pad=0.02')
    ax3.add_patch(header)
    ax3.text(x0 + 0.05, y_h, '#', fontsize=7, fontweight='bold', color='white', va='center')
    ax3.text(x0 + 0.55, y_h, 'Destino', fontsize=7, fontweight='bold', color='white', va='center')
    ax3.text(x0 + 2.2, y_h, 'Match', fontsize=7, fontweight='bold', color='white', va='center')
    ax3.text(x0 + 2.7, y_h, 'Cat', fontsize=7, fontweight='bold', color='white', va='center')

    for rank, r in enumerate(recs):
        y_r = 2.9 - rank * 0.5
        bg_r = '#F8F9FA' if rank % 2 == 0 else 'white'
        row_bg = FancyBboxPatch((x0, y_r - 0.18), 3.0, 0.32, facecolor=bg_r, edgecolor='#eee',
                                linewidth=0.5, boxstyle='round,pad=0.01')
        ax3.add_patch(row_bg)
        ax3.text(x0 + 0.05, y_r, str(rank+1), fontsize=8, va='center', color='#666')
        ax3.text(x0 + 0.55, y_r, r['nombre_lugar'][:22], fontsize=7.5, va='center', color='#333', fontweight='bold')
        ax3.text(x0 + 2.2, y_r, f"{r['match_pct']:.0f}%", fontsize=8, va='center', color=color, fontweight='bold')
        ax3.text(x0 + 2.7, y_r, r['categoria_wellness'][:8], fontsize=6.5, va='center', color='#888')

    if col_idx < 2:
        ax3.annotate('', xy=(x0+3.2, 2.0), xytext=(x0+3.2, 3.5),
                     arrowprops=dict(arrowstyle='->', color='#ccc', lw=1, linestyle='dashed'))

# 4. Metrics Panel (bottom row)
ax4 = fig.add_subplot(gs[2, :])
ax4.set_xlim(0, 10)
ax4.set_ylim(0, 6)
ax4.axis('off')

ax4.text(5, 5.5, 'Rendimiento del Sistema', fontsize=14, fontweight='bold', ha='center', color='#1a1a2e')

accuracy = meta.get('accuracy', 0)
f1 = meta.get('macro_f1', 0)

metric_cards = [
    ('Precision\nClasificador', f'{accuracy:.0%}', f'{accuracy:.0%} aciertos sobre 3 clases\n(aleatorio seria 33%)', '#4CAF50'),
    ('Macro F1', f'{f1:.0%}', f'Promedio ponderado de\nprecision/recall por perfil', '#2196F3'),
    ('Destinos\nen catalogo', '182', f'10 categorias wellness\nEnriquecidos con NLP 208k reviews', '#9C27B0'),
    ('Reviews\nanalizadas', '208k', f'Rest-Mex 2025 + NLP\n69,921 Attractive + 36 keywords', '#FF9800'),
    ('Feedback\nLoop', 'SI', f'fit_rating (1-5) por sesion\nReentrenamiento con datos reales', '#607D8B'),
]

for idx, (label, value, desc, color) in enumerate(metric_cards):
    x0 = 0.25 + idx * 1.95
    card = FancyBboxPatch((x0, 2.0), 1.7, 2.8, facecolor='white', edgecolor=color,
                          linewidth=2, boxstyle='round,pad=0.08')
    ax4.add_patch(card)
    strip = FancyBboxPatch((x0, 4.3), 1.7, 0.5, facecolor=color, edgecolor='none', boxstyle='round,pad=0.02')
    ax4.add_patch(strip)
    ax4.text(x0 + 0.85, 4.55, label, fontsize=8.5, ha='center', va='center', color='white', fontweight='bold')
    ax4.text(x0 + 0.85, 3.7, value, fontsize=20, ha='center', va='center', color=color, fontweight='bold')
    ax4.text(x0 + 0.85, 2.6, desc, fontsize=7.5, ha='center', va='center', color='#555')

# 5. Performance per class
ax5 = fig.add_subplot(gs[3, 1:3])
ax5.set_facecolor('#FAFBFC')

report = meta.get('classification_report', {})
classes_plot = ['Burnout', 'Fatiga_Fisica', 'Hiperactividad_Ansiosa']
f1_vals = [report[c]['f1-score'] for c in classes_plot]
colors_cls = ['#4CAF50', '#2196F3', '#FF9800']

bars = ax5.barh(classes_plot, f1_vals, color=colors_cls, edgecolor='#333', linewidth=1.2, height=0.55)
for bar, v in zip(bars, f1_vals):
    ax5.text(bar.get_width() + 0.01, bar.get_y() + bar.get_height()/2,
             f'{v:.0%}', va='center', fontsize=11, fontweight='bold', color='#333')
ax5.set_xlim(0, 1.0)
ax5.set_xlabel('F1-Score', fontsize=11, fontweight='bold')
ax5.set_title('F1-Score por Perfil', fontsize=12, fontweight='bold', color='#1a1a2e')
ax5.spines['top'].set_visible(False)
ax5.spines['right'].set_visible(False)
ax5.grid(axis='x', alpha=0.3)

# 6. Mejoras
ax6 = fig.add_subplot(gs[3, 0])
ax6.set_xlim(0, 10)
ax6.set_ylim(0, 5)
ax6.axis('off')

ax6.text(5, 4.5, 'Como mejorar', fontsize=12, fontweight='bold', ha='center', color='#D32F2F')
tips = [
    '1. Reemplazar datos\n   sinteticos por reales',
    '2. Feedback loop con\n   fit_rating 1-5',
    '3. Reentrenar cada 100\n   nuevas evaluaciones',
    '4. Aumentar features:\n   edad, genero, epoca',
]
for i, tip in enumerate(tips):
    y = 3.5 - i * 0.85
    ax6.text(0.5, y, tip, fontsize=7.5, color='#444', va='center')

# 7. Data quality
ax7 = fig.add_subplot(gs[3, 3])
ax7.set_xlim(0, 10)
ax7.set_ylim(0, 5)
ax7.axis('off')

ax7.text(5, 4.5, 'Calidad de Datos', fontsize=12, fontweight='bold', ha='center', color='#1a1a2e')
data_items = [
    ('Entrenamiento', '5,000 registros sinteticos', '#FFC107'),
    ('Modelo', 'HistGBM+Calibrado, 7 features', '#2196F3'),
    ('Destinos', '182 en 10 categorias', '#4CAF50'),
    ('Reviews', '208k con NLP wellness', '#9C27B0'),
    ('Enriquecimiento', 'Sentiment scores 0-1', '#FF9800'),
]
for i, (label, val, color) in enumerate(data_items):
    y = 3.7 - i * 0.65
    ax7.text(0.3, y, label, fontsize=8, fontweight='bold', color=color, va='center')
    ax7.text(5.0, y, val, fontsize=7.5, color='#555', va='center')

# Footer
fig.text(0.5, 0.01, 'Generado: SMARTUR v4 - WellTur | datos: REST-MEX 2025 + SECTUR + NLP',
         fontsize=8, ha='center', color='#aaa')

fig.savefig(OUTPUT / 'welltur_showcase.png', dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor())
plt.close(fig)
print(f"[OK] welltur_showcase.png")
