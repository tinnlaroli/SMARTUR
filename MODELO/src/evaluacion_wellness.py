"""
Evaluacion completa del subsistema wellness: clasificador + matchmaker + beneficio.
Genera metricas y graficos de viabilidad.
"""
import sys, json, os, warnings
warnings.filterwarnings('ignore')
os.environ['PYTHONIOENCODING'] = 'utf-8'

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
from pathlib import Path

BASE   = Path(__file__).resolve().parent.parent
SRC    = BASE / 'src'
MODELS = BASE / 'models'
OUTPUT = BASE / 'analysis_output'
OUTPUT.mkdir(exist_ok=True)
sys.path.insert(0, str(SRC))

print("=" * 60)
print("  SMARTUR v4 — Evaluacion de Viabilidad WellTur")
print("=" * 60)

# ─── 1. CARGAR CLASIFICADOR ───────────────────────────────────────────
print("\n[1] Cargando clasificador wellness...")
from wellness_classifier import WellnessProfileClassifier, get_classifier, MODO_VIAJE_LABELS, MODO_VIAJE_DESCRIPTION

clf = get_classifier()
loaded = clf.load()
print(f"  Modelo en disco: {'SI' if loaded else 'NO'}")
if loaded:
    meta = clf.metrics
    print(f"  Accuracy: {meta.get('accuracy', '?'):.4f}")
    print(f"  Macro F1: {meta.get('macro_f1', '?'):.4f}")
    print(f"  Metodo:   {meta.get('hybrid_threshold', 0.58)} threshold hybrid")

# ─── 2. TEST CLASIFICADOR ─────────────────────────────────────────────
print("\n[2] Probando clasificacion con casos representativos...")
test_cases = [
    # (q1, q2, q3, q4, desc)
    (1, 1, 1, 1, "Alta energia, sin tension, sin rumiacion, calmado"),
    (4, 4, 4, 4, "Baja energia, alta tension, alta rumiacion, nervioso"),
    (2, 1, 3, 2, "Energia media, sin tension, rumiacion moderada"),
    (3, 3, 2, 3, "Poca energia, tension media, algo de rumiacion, nervioso"),
    (1, 3, 1, 2, "Alta energia, tension alta, sin rumiacion"),
    (3, 4, 4, 4, "Baja energia, alta tension, alta rumiacion, nervioso"),
    (2, 2, 2, 2, "Todo neutral"),
    (4, 1, 1, 1, "Baja energia, sin tension, sin rumiacion"),
    (1, 3, 3, 4, "Alta energia pero tension+rumiacion+ansiedad"),
    (2, 2, 4, 3, "Rumiacion muy alta"),
]

print(f"  {'Q1':>3} {'Q2':>3} {'Q3':>3} {'Q4':>3}  {'Perfil':<25} {'Modo Viaje':<20} {'Confianza':>9} {'Metodo':<12}")
print(f"  {'-'*3} {'-'*3} {'-'*3} {'-'*3}  {'-'*25} {'-'*20} {'-'*9} {'-'*12}")
for q1, q2, q3, q4, desc in test_cases:
    perfil, modo, proba_map, conf, metodo = clf.predict(q1, q2, q3, q4)
    label = MODO_VIAJE_LABELS.get(modo, modo)
    print(f"  {q1:>3} {q2:>3} {q3:>3} {q4:>3}  {perfil:<25} {label:<20} {conf:.3f}     {metodo:<12}")

# ─── 3. CARGAR DESTINOS ───────────────────────────────────────────────
print("\n[3] Cargando destinos wellness enriquecidos...")
from wellness_matchmaker import load_destinations, recommend_wellness, PROFILE_IDEAL, PROFILE_SOFT_RULES

destinations = load_destinations()
print(f"  Destinos cargados: {len(destinations)}")
if not destinations.empty:
    cat_col = "categoria_wellness" if "categoria_wellness" in destinations.columns else "categoria_principal"
    print(f"  Categorias: {destinations[cat_col].value_counts().to_dict()}")
    print(f"  Tiene sentiment_score: {'wellness_sentiment_score' in destinations.columns}")
    if 'wellness_sentiment_score' in destinations.columns:
        print(f"  Sentiment promedio: {destinations['wellness_sentiment_score'].mean():.3f}")
        print(f"  Sentiment min-max:  {destinations['wellness_sentiment_score'].min():.3f} - {destinations['wellness_sentiment_score'].max():.3f}")

# ─── 4. TEST MATCHMAKER ───────────────────────────────────────────────
print("\n[4] Probando matchmaker con perfiles representativos...")
test_profiles = [
    (2, 2, 4, 3, "Burnout", "Rumiacion alta + energia media"),
    (3, 4, 2, 3, "Fatiga_Fisica", "Tension fisica alta + poca energia"),
    (1, 3, 3, 4, "Hiperactividad_Ansiosa", "Alta energia + ansiedad + rumiacion"),
    (3, 3, 3, 3, None, "Todo alto (carga global maxima)"),
    (1, 1, 1, 1, None, "Todo bajo (sin estres aparente)"),
]

for q1, q2, q3, q4, forced_perfil, desc in test_profiles:
    if forced_perfil:
        perfil = forced_perfil
        modo = {"Burnout": "modo_calma", "Fatiga_Fisica": "modo_restauracion", "Hiperactividad_Ansiosa": "modo_equilibrio"}[perfil]
    else:
        perfil, modo, _, conf_tmp, _ = clf.predict(q1, q2, q3, q4)
        forced_perfil = perfil

    label = MODO_VIAJE_LABELS.get(modo, modo)
    print(f"\n  --- {desc} ---")
    print(f"  Q={q1},{q2},{q3},{q4} -> Perfil={forced_perfil} -> {label}")

    recs = recommend_wellness(
        destinations=destinations,
        perfil=forced_perfil,
        q1=q1, q2=q2, q3=q3, q4=q4,
        top_n=3,
        stress_confidence=0.85,
    )
    print(f"  {'Rank':<6} {'Destino':<30} {'Match%':>7} {'Benef%':>7} {'Alineac%':>9} {'Categoria':<20}")
    print(f"  {'-'*5} {'-'*30} {'-'*7} {'-'*7} {'-'*9} {'-'*20}")
    for r in recs:
        print(f"  {r['rank']:<6} {r['nombre_lugar'][:28]:<30} {r['match_pct']:>6.1f}% {r['beneficio_optimo_pct']:>6.1f}% {r['alineacion_pct']:>8.1f}% {r['categoria_wellness'][:18]:<20}")

# ─── 5. SENTIMENT SCORE DISTRIBUTION ─────────────────────────────────
print("\n[5] Analizando distribucion de sentiment scores...")
if 'wellness_sentiment_score' in destinations.columns:
    scores = destinations['wellness_sentiment_score'].dropna()
    print(f"  Media: {scores.mean():.3f}  Mediana: {scores.median():.3f}  Std: {scores.std():.3f}")
    print(f"  Q1: {scores.quantile(0.25):.3f}  Q3: {scores.quantile(0.75):.3f}")
    bins = [0, 0.3, 0.5, 0.7, 0.8, 1.0]
    labels_b = ['0-0.3', '0.3-0.5', '0.5-0.7', '0.7-0.8', '0.8-1.0']
    cats = pd.cut(scores, bins=bins, labels=labels_b)
    for lb, cnt in cats.value_counts().sort_index().items():
        print(f"  {lb}: {cnt} destinos")

# ─── 6. GENERAR GRAFICOS ──────────────────────────────────────────────
print("\n[6] Generando graficos...\n")

# --- FIG 1: Matriz de confusion (desde classification_report) ---
def plot_confusion_heatmap():
    if not loaded:
        return
    report = meta.get('classification_report', {})
    classes = ['Burnout', 'Fatiga_Fisica', 'Hiperactividad_Ansiosa']
    if not all(c in report for c in classes):
        print("  [NO] datos suficientes para confusion matrix")
        return

    n_test = meta.get('n_test', 1000)
    # Estimar matrix desde recall y support
    conf_matrix = np.zeros((3, 3))
    for i, true_class in enumerate(classes):
        support = report[true_class]['support']
        recall = report[true_class]['recall']
        # TP = recall * support
        tp = recall * support
        # Distribuir FN proporcionalmente entre otras clases (aproximacion)
        fn = support - tp
        other_support = sum(report[c]['support'] for c in classes if c != true_class)
        for j, pred_class in enumerate(classes):
            if i == j:
                conf_matrix[i][j] = tp
            else:
                other_recall = report[pred_class]['recall']
                conf_matrix[i][j] = fn * (report[pred_class]['support'] / other_support) if other_support > 0 else 0

    conf_matrix = np.round(conf_matrix).astype(int)
    fig, ax = plt.subplots(figsize=(7, 5.5))
    im = ax.imshow(conf_matrix, cmap='Blues', vmin=0, vmax=conf_matrix.max()*1.2)
    ax.set_xticks(range(3))
    ax.set_yticks(range(3))
    ax.set_xticklabels(classes, fontsize=10)
    ax.set_yticklabels(classes, fontsize=10)
    ax.set_xlabel('Predicho', fontsize=12, fontweight='bold')
    ax.set_ylabel('Real', fontsize=12, fontweight='bold')
    ax.set_title('Matriz de Confusion (estimada, n=1000)', fontsize=13, fontweight='bold')
    for i in range(3):
        for j in range(3):
            ax.text(j, i, str(conf_matrix[i][j]), ha='center', va='center',
                    fontsize=14, fontweight='bold',
                    color='white' if conf_matrix[i][j] > conf_matrix.max() * 0.5 else 'black')
    fig.colorbar(im, ax=ax, shrink=0.75)
    plt.tight_layout()
    fig.savefig(OUTPUT / 'w01_confusion_matrix.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    print("  [OK] w01_confusion_matrix.png")

# --- FIG 2: Per-class metrics bar chart ---
def plot_per_class_metrics():
    if not loaded:
        return
    report = meta.get('classification_report', {})
    classes = ['Burnout', 'Fatiga_Fisica', 'Hiperactividad_Ansiosa']
    if not all(c in report for c in classes):
        return
    metrics_names = ['precision', 'recall', 'f1-score']
    x = np.arange(len(classes))
    w = 0.22
    fig, ax = plt.subplots(figsize=(9, 5))
    for i, metric in enumerate(metrics_names):
        vals = [report[c][metric] for c in classes]
        bars = ax.bar(x + (i - 1) * w, vals, w, label=metric.capitalize(),
                      edgecolor='#333', linewidth=0.8)
        for bar, v in zip(bars, vals):
            ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01,
                    f'{v:.2f}', ha='center', va='bottom', fontsize=7.5, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(classes, fontsize=10)
    ax.set_ylim(0, 1.0)
    ax.set_ylabel('Score', fontsize=12, fontweight='bold')
    ax.set_title('Metricas por Clase del Clasificador Wellness', fontsize=13, fontweight='bold')
    ax.legend(fontsize=10)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(axis='y', alpha=0.3)
    plt.tight_layout()
    fig.savefig(OUTPUT / 'w02_per_class_metrics.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    print("  [OK] w02_per_class_metrics.png")

# --- FIG 3: Vectores ideales 3D (radar chart) ---
def plot_ideal_vectors_radar():
    categories = ['Aislamiento', 'Restauracion', 'Demanda (invertida)']
    profiles_names = ['modo_calma\n(Burnout)', 'modo_restauracion\n(Fatiga_Fisica)', 'modo_equilibrio\n(Hiperactividad)']
    # demanda invertida: mayor demanda -> menor puntaje
    ideals = {
        'modo_calma':        [PROFILE_IDEAL['Burnout'][0], PROFILE_IDEAL['Burnout'][1], 1 - PROFILE_IDEAL['Burnout'][2]],
        'modo_restauracion': [PROFILE_IDEAL['Fatiga_Fisica'][0], PROFILE_IDEAL['Fatiga_Fisica'][1], 1 - PROFILE_IDEAL['Fatiga_Fisica'][2]],
        'modo_equilibrio':   [PROFILE_IDEAL['Hiperactividad_Ansiosa'][0], PROFILE_IDEAL['Hiperactividad_Ansiosa'][1], 1 - PROFILE_IDEAL['Hiperactividad_Ansiosa'][2]],
    }
    colors = {'modo_calma': '#4CAF50', 'modo_restauracion': '#2196F3', 'modo_equilibrio': '#FF9800'}

    angles = np.linspace(0, 2 * np.pi, len(categories), endpoint=False).tolist()
    angles += angles[:1]

    fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))
    for pname, vals in ideals.items():
        values = vals + vals[:1]
        ax.fill(angles, values, alpha=0.08, color=colors[pname])
        ax.plot(angles, values, 'o-', linewidth=2.5, label=pname, color=colors[pname], markersize=7)
        for ang, val in zip(angles, values):
            ax.plot(ang, val, 'o', color=colors[pname], markersize=7)

    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(categories, fontsize=11, fontweight='bold')
    ax.set_ylim(0, 1.0)
    ax.set_yticks([0.2, 0.4, 0.6, 0.8, 1.0])
    ax.set_yticklabels(['0.2', '0.4', '0.6', '0.8', '1.0'], fontsize=8, color='#888')
    ax.set_title('Vectores Ideales por Perfil de Viaje', fontsize=14, fontweight='bold', pad=20)
    ax.legend(loc='upper right', bbox_to_anchor=(1.35, 1.1), fontsize=10)
    plt.tight_layout()
    fig.savefig(OUTPUT / 'w03_ideal_vectors_radar.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    print("  [OK] w03_ideal_vectors_radar.png")

# --- FIG 4: Distribution de destinos por categoria y perfil ideal ---
def plot_destinations_distribution():
    if destinations.empty:
        return
    cat_col = "categoria_wellness" if "categoria_wellness" in destinations.columns else "categoria_principal"
    cat_counts = destinations[cat_col].value_counts()

    fig, ax = plt.subplots(figsize=(10, 5.5))
    colors_cat = plt.cm.Set2(np.linspace(0, 1, len(cat_counts)))
    bars = ax.bar(range(len(cat_counts)), cat_counts.values, color=colors_cat, edgecolor='#333', linewidth=1)
    for bar, v in zip(bars, cat_counts.values):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.3,
                str(v), ha='center', va='bottom', fontsize=10, fontweight='bold')
    ax.set_xticks(range(len(cat_counts)))
    ax.set_xticklabels(cat_counts.index, fontsize=9, rotation=30, ha='right')
    ax.set_ylabel('Cantidad de destinos', fontsize=12, fontweight='bold')
    ax.set_title('Distribucion de Destinos Wellness por Categoria', fontsize=13, fontweight='bold')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(axis='y', alpha=0.3)
    plt.tight_layout()
    fig.savefig(OUTPUT / 'w04_destinations_distribution.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    print("  [OK] w04_destinations_distribution.png")

# --- FIG 5: Sentiment scores by category ---
def plot_sentiment_by_category():
    if destinations.empty or 'wellness_sentiment_score' not in destinations.columns:
        return
    cat_col = "categoria_wellness" if "categoria_wellness" in destinations.columns else "categoria_principal"
    grouped = destinations.groupby(cat_col)['wellness_sentiment_score'].agg(['mean', 'std', 'count']).sort_values('mean', ascending=False)

    fig, ax = plt.subplots(figsize=(10, 5.5))
    colors_s = plt.cm.viridis((grouped['mean'] - grouped['mean'].min()) / (grouped['mean'].max() - grouped['mean'].min() + 0.001))
    bars = ax.bar(range(len(grouped)), grouped['mean'], yerr=grouped['std'], color=colors_s,
                  edgecolor='#333', linewidth=1, capsize=4)
    for i, (bar, row) in enumerate(zip(bars, grouped.itertuples())):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.02,
                f'{row.mean:.3f}', ha='center', va='bottom', fontsize=8, fontweight='bold')
    ax.set_xticks(range(len(grouped)))
    ax.set_xticklabels(grouped.index, fontsize=9, rotation=30, ha='right')
    ax.set_ylabel('Wellness Sentiment Score', fontsize=12, fontweight='bold')
    ax.set_title('Sentimiento Wellness Promedio por Categoria de Destino', fontsize=13, fontweight='bold')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(axis='y', alpha=0.3)
    ax.set_ylim(0, 1.0)
    plt.tight_layout()
    fig.savefig(OUTPUT / 'w05_sentiment_by_category.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    print("  [OK] w05_sentiment_by_category.png")

# --- FIG 6: Viability summary dashboard ---
def plot_wellness_viability_summary():
    if not loaded:
        return
    fig, ax = plt.subplots(figsize=(12, 6))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis('off')

    accuracy = meta.get('accuracy', 0)
    f1 = meta.get('macro_f1', 0)
    n_train = meta.get('n_train', 0)
    n_test = meta.get('n_test', 0)
    n_dest = len(destinations) if not destinations.empty else 0
    n_features = meta.get('n_features', 0)
    avg_sent = destinations['wellness_sentiment_score'].mean() if not destinations.empty and 'wellness_sentiment_score' in destinations.columns else 0

    ax.text(5, 6.6, 'VIABILIDAD WELLTUR - Panel Resumen', fontsize=16, fontweight='bold',
            ha='center', va='center', color='#1a1a2e',
            bbox=dict(facecolor='white', edgecolor='#1a1a2e', boxstyle='round,pad=0.5'))

    dims = [
        ('Clasificador\nAccuracy', f'{accuracy:.1%}',
         'OK' if accuracy >= 0.70 else ('--' if accuracy >= 0.50 else '!!'),
         '#4CAF50' if accuracy >= 0.70 else ('#FFC107' if accuracy >= 0.50 else '#F44336')),
        ('Macro F1', f'{f1:.1%}',
         'OK' if f1 >= 0.70 else ('--' if f1 >= 0.50 else '!!'),
         '#4CAF50' if f1 >= 0.70 else ('#FFC107' if f1 >= 0.50 else '#F44336')),
        ('Dataset\nentrenamiento', f'{n_train} registros\n(sintetico)',
         '--' if n_train > 0 else '!!',
         '#FFC107'),
        ('Cobertura\ndestinos', f'{n_dest} destinos\n182 enriquecidos',
         'OK' if n_dest >= 150 else ('--' if n_dest >= 50 else '!!'),
         '#4CAF50' if n_dest >= 150 else ('#FFC107' if n_dest >= 50 else '#F44336')),
        ('Sentimiento\nwellness', f'{avg_sent:.3f} avg',
         'OK' if avg_sent >= 0.6 else ('--' if avg_sent >= 0.4 else '!!'),
         '#4CAF50' if avg_sent >= 0.6 else ('#FFC107' if avg_sent >= 0.4 else '#F44336')),
    ]

    for i, (label, value, symbol, color) in enumerate(dims):
        x0 = 0.3 + i * 1.9
        from matplotlib.patches import FancyBboxPatch
        card = FancyBboxPatch((x0, 4.0), 1.7, 2.0, facecolor='white', edgecolor=color,
                              linewidth=2.5, boxstyle='round,pad=0.08')
        ax.add_patch(card)
        ax.text(x0 + 0.85, 5.6, symbol, ha='center', va='center', fontsize=22, color=color, fontweight='bold')
        ax.text(x0 + 0.85, 4.85, value, ha='center', va='center', fontsize=11, fontweight='bold', color='#333')
        ax.text(x0 + 0.85, 4.1, label, ha='center', va='center', fontsize=9, color='#555')

    # Recommendations
    recs_text = (
        "Recomendaciones:\n"
        "  1. Reemplazar datos sinteticos con respuestas reales de usuarios SMARTUR\n"
        "  2. El accuracy 52.7% es mejor que aleatorio (33%) pero bajo para produccion\n"
        "  3. Fatiga_Fisica es la clase mejor clasificada (F1=0.62)\n"
        "  4. Burnout tiene el F1 mas bajo (0.44) - necesita mas/major datos\n"
        "  5. Usar fit_rating (feedback loop) para reentrenar con senal real"
    )
    ax.text(0.5, 2.2, recs_text, fontsize=9, color='#444', ha='left', va='top',
            bbox=dict(facecolor='#f5f5f5', edgecolor='#ddd', boxstyle='round,pad=0.5'))

    ax.text(0.5, 0.3, 'OK = Bueno    -- = Aceptable    !! = Requiere mejora', fontsize=9, color='#888', ha='left', va='center')

    fig.savefig(OUTPUT / 'w06_wellness_viability_summary.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    print("  [OK] w06_wellness_viability_summary.png")

# --- Generate all ---
plot_confusion_heatmap()
plot_per_class_metrics()
plot_ideal_vectors_radar()
plot_destinations_distribution()
plot_sentiment_by_category()
plot_wellness_viability_summary()

print(f"\n{'=' * 60}")
print(f"  Graficos guardados en: {OUTPUT}")
print(f"{'=' * 60}")
