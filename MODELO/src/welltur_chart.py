"""
Grafica tipo chart del clasificador wellness: barras, F1, accuracy.
Colores: Verde bosque #254117, Amarillo mostaza #ffbd59, Rosa viejo #cd6184
"""
import sys, os, warnings
warnings.filterwarnings('ignore')
os.environ['PYTHONIOENCODING'] = 'utf-8'

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
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

VERDE = '#254117'
AMARILLO = '#ffbd59'
ROSA = '#cd6184'
BG = '#FAF6F0'

fig = plt.figure(figsize=(12, 8))
fig.patch.set_facecolor(BG)

gs = fig.add_gridspec(2, 3, hspace=0.35, wspace=0.35,
                      left=0.08, right=0.95, top=0.92, bottom=0.08)

# ── Title ──
fig.text(0.5, 0.955, 'Clasificador de Perfil WellTur', fontsize=16, fontweight='bold',
         ha='center', color=VERDE)
fig.text(0.5, 0.935, 'Rendimiento del modelo ML por clase y metrica global',
         fontsize=9, ha='center', color='#666')

# ── 1. F1-Score por perfil (horizontal bars) ──
ax1 = fig.add_subplot(gs[:, 0])
report = meta.get('classification_report', {})
classes = ['Burnout', 'Fatiga_Fisica', 'Hiperactividad_Ansiosa']
modos = ['modo_calma', 'modo_restauracion', 'modo_equilibrio']
f1_vals = [report[c]['f1-score'] for c in classes]
precision_vals = [report[c]['precision'] for c in classes]
recall_vals = [report[c]['recall'] for c in classes]
colors_bar = [VERDE, AMARILLO, ROSA]

y_pos = np.arange(len(classes))
ax1.barh(y_pos, f1_vals, height=0.5, color=colors_bar, edgecolor='#333', linewidth=0.8, zorder=3)
for i, (v, c) in enumerate(zip(f1_vals, colors_bar)):
    ax1.text(v + 0.02, i, f'{v:.0%}', va='center', fontsize=11, fontweight='bold', color=c)
ax1.set_yticks(y_pos)
ax1.set_yticklabels([f'{c}\n({m})' for c, m in zip(classes, modos)], fontsize=8.5)
ax1.set_xlim(0, 1.0)
ax1.set_xlabel('F1-Score', fontsize=10, fontweight='bold', color=VERDE)
ax1.set_title('F1-Score por Perfil', fontsize=11, fontweight='bold', color=VERDE, pad=8)
ax1.spines['top'].set_visible(False)
ax1.spines['right'].set_visible(False)
ax1.spines['left'].set_color('#ccc')
ax1.spines['bottom'].set_color('#ccc')
ax1.grid(axis='x', alpha=0.2, zorder=0)
ax1.set_facecolor('white')
ax1.xaxis.set_major_formatter(mticker.PercentFormatter(1.0))

# Add vertical reference line
ax1.axvline(x=meta.get('macro_f1', 0), color=ROSA, linestyle='--', linewidth=1.2, alpha=0.6, zorder=2)
ax1.text(meta.get('macro_f1', 0) + 0.02, len(classes) - 0.5,
         f'Macro F1={meta.get("macro_f1", 0):.0%}', fontsize=7.5, color=ROSA, fontweight='bold')

# ── 2. Precision / Recall / F1 grouped bars ──
ax2 = fig.add_subplot(gs[0, 1])
x = np.arange(len(classes))
w = 0.22
ax2.bar(x - w, precision_vals, w, label='Precision', color=VERDE, edgecolor='#333', linewidth=0.5, alpha=0.85)
ax2.bar(x, recall_vals, w, label='Recall', color=AMARILLO, edgecolor='#333', linewidth=0.5, alpha=0.85)
ax2.bar(x + w, f1_vals, w, label='F1', color=ROSA, edgecolor='#333', linewidth=0.5, alpha=0.85)
ax2.set_xticks(x)
ax2.set_xticklabels([c[:8] for c in classes], fontsize=8)
ax2.set_ylim(0, 1.0)
ax2.set_ylabel('Score', fontsize=9, fontweight='bold', color=VERDE)
ax2.set_title('Precision / Recall / F1', fontsize=11, fontweight='bold', color=VERDE, pad=8)
ax2.legend(fontsize=7, loc='lower right')
ax2.spines['top'].set_visible(False)
ax2.spines['right'].set_visible(False)
ax2.spines['left'].set_color('#ccc')
ax2.spines['bottom'].set_color('#ccc')
ax2.grid(axis='y', alpha=0.2)
ax2.set_facecolor('white')
ax2.yaxis.set_major_formatter(mticker.PercentFormatter(1.0))

# Annotate best class
best_idx = int(np.argmax(f1_vals))
ax2.annotate(f'Mejor: {classes[best_idx]}',
             xy=(best_idx, f1_vals[best_idx]),
             xytext=(best_idx + 0.5, f1_vals[best_idx] + 0.15),
             fontsize=8, fontweight='bold', color=colors_bar[best_idx],
             arrowprops=dict(arrowstyle='->', color=colors_bar[best_idx], lw=1.2))

# ── 3. Confusion matrix (estimated) ──
ax3 = fig.add_subplot(gs[0, 2])
n_test = meta.get('n_test', 1000)
conf_matrix = np.zeros((3, 3))
for i, true_class in enumerate(classes):
    support = report[true_class]['support']
    recall = report[true_class]['recall']
    tp = recall * support
    fn = support - tp
    other_support = sum(report[c]['support'] for c in classes if c != true_class)
    for j, pred_class in enumerate(classes):
        if i == j:
            conf_matrix[i][j] = tp
        else:
            other_recall = report[pred_class]['recall']
            conf_matrix[i][j] = fn * (report[pred_class]['support'] / other_support) if other_support > 0 else 0
conf_matrix = np.round(conf_matrix).astype(int)

im = ax3.imshow(conf_matrix, cmap='Greens', vmin=0, vmax=conf_matrix.max()*1.2)
ax3.set_xticks(range(3))
ax3.set_yticks(range(3))
ax3.set_xticklabels([c[:8] for c in classes], fontsize=7, rotation=15)
ax3.set_yticklabels([c[:8] for c in classes], fontsize=7)
ax3.set_xlabel('Predicho', fontsize=9, fontweight='bold', color=VERDE)
ax3.set_ylabel('Real', fontsize=9, fontweight='bold', color=VERDE)
ax3.set_title('Matriz de Confusion', fontsize=11, fontweight='bold', color=VERDE, pad=8)
for i in range(3):
    for j in range(3):
        ax3.text(j, i, str(conf_matrix[i][j]), ha='center', va='center',
                fontsize=12, fontweight='bold',
                color='white' if conf_matrix[i][j] > conf_matrix.max() * 0.5 else '#333')
fig.colorbar(im, ax=ax3, shrink=0.75)

# ── 4. Accuracy gauge ──
ax4 = fig.add_subplot(gs[1, 1])
accuracy = meta.get('accuracy', 0)
f1 = meta.get('macro_f1', 0)

# Donut chart
sizes = [accuracy, 1 - accuracy]
colors_donut = [VERDE, '#E8E0D6']
ax4.pie(sizes, colors=colors_donut, startangle=90, counterclock=False,
        wedgeprops=dict(width=0.3, edgecolor='white', linewidth=2))
ax4.text(0, 0, f'{accuracy:.0%}', ha='center', va='center', fontsize=22, fontweight='bold', color=VERDE)
ax4.text(0, -0.25, 'Accuracy', ha='center', va='center', fontsize=9, color='#666')
ax4.set_title('Accuracy Global', fontsize=11, fontweight='bold', color=VERDE, pad=8)

# ── 5. Data quality bars ──
ax5 = fig.add_subplot(gs[1, 2])
ax5.axis('off')
ax5.set_title('Escala del Modelo', fontsize=11, fontweight='bold', color=VERDE, pad=8, x=0.5)

data_items = [
    ('Registros\ntrain', f"{meta.get('n_train', 0):,}", VERDE),
    ('Registros\ntest', f"{meta.get('n_test', 0):,}", AMARILLO),
    ('Features\nML', str(meta.get('n_features', 0)), ROSA),
    ('Threshold\nhibrido', f"{meta.get('hybrid_threshold', 0.58):.2f}", VERDE),
    ('Destinos\nwellness', str(len(destinations)), AMARILLO),
]

for i, (label, value, color) in enumerate(data_items):
    y = 0.75 - i * 0.16
    ax5.text(0.02, y, label, fontsize=7, va='center', color='#666')
    ax5.text(0.85, y, value, fontsize=10, fontweight='bold', va='center', color=color, ha='right')
    if i < len(data_items) - 1:
        ax5.plot([0.02, 0.85], [y - 0.06, y - 0.06], color='#E8E0D6', linewidth=0.5)

# ── 6. Bottom insight text ──
fig.text(0.5, 0.045,
         'SMARTUR v4 — WellTur | 3 perfiles, 182 destinos, 208k reviews analizadas | Datos sinteticos, feedback loop implementado',
         fontsize=7.5, ha='center', color='#999')

fig.savefig(OUTPUT / 'welltur_classifier_chart.png', dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor())
plt.close(fig)
print(f"[OK] welltur_classifier_chart.png")
