"""
Analisis grafico de viabilidad del modelo SMARTUR v4
Ejecuta evaluacion completa y genera visualizaciones.
"""
import json, os, sys, warnings, logging
warnings.filterwarnings('ignore')
logging.getLogger().setLevel(logging.ERROR)

os.environ['PYTHONIOENCODING'] = 'utf-8'
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
from matplotlib.patches import FancyBboxPatch
from pathlib import Path

BASE   = Path(__file__).resolve().parent.parent
MODELS = BASE / 'models'
SRC    = BASE / 'src'
OUTPUT = BASE / 'analysis_output'
OUTPUT.mkdir(exist_ok=True)

sys.path.insert(0, str(SRC))

# ── Load / Compute Metrics ──────────────────────────────────────────
print("Cargando engine y modelos...")
from engine import SmarturEngine
from rf_model import SmarturContextModel
from gbm_model import SmarturGbmModel
from model_metrics import compare_algorithms

engine = SmarturEngine(data_source='mexico')
engine.prepare_pearson_matrix()

rf_model = SmarturContextModel()
rf_model.train(engine.train_data)

gbm_model = SmarturGbmModel()
gbm_model.train(engine.train_data)

print("Ejecutando evaluacion completa (sample=800)...")
metrics = compare_algorithms(engine, rf_model, gbm_model, sample_size=800)

algos = metrics.get('algorithms', {})
best_algo = metrics.get('best_algorithm', '?')
best_alpha = metrics.get('best_alpha', 0.2)
sample_size = metrics.get('sample_size', 0)
error_dist = metrics.get('error_distribution', {})
ranking = metrics.get('ranking', {})
data_quality = metrics.get('data_quality', {})
pred_dist = metrics.get('prediction_distribution', {})

feat_imp = {}
if (MODELS / 'rf_feature_importances.json').exists():
    with open(MODELS / 'rf_feature_importances.json') as f:
        raw = json.load(f)
    # format: list of {feature: ..., importance: ...}
    if isinstance(raw, list):
        feat_imp = {item.get('feature', f'f{i}'): item.get('importance', 0) for i, item in enumerate(raw)}
    elif isinstance(raw, dict):
        feat_imp = raw

training_history = []
if (MODELS / 'training_history.json').exists():
    with open(MODELS / 'training_history.json') as f:
        training_history = json.load(f)

print(f"  Algoritmos: {list(algos.keys())}")
print(f"  Best: {best_algo} | Alpha: {best_alpha} | Sample: {sample_size}")
print(f"  Error dist: {list(error_dist.keys())}")
print(f"  Ranking: NDCG={ranking.get('ndcg_at_5', 'N/A')}, Precision={ranking.get('precision_at_5', 'N/A')}, HitRate={ranking.get('hit_rate_at_10', 'N/A')}")
print(f"  Data quality: {list(data_quality.keys()) if data_quality else 'N/A'}")
print(f"  Feature importances: {len(feat_imp)} features")
print(f"  Training history: {len(training_history)} entries")

# ══════════════════════════════════════════════════════════════════════
# FIGURE 1: RMSE / MAE Comparison
# ══════════════════════════════════════════════════════════════════════
def plot_rmse_mae():
    names, rmse_vals, mae_vals, colors_list = [], [], [], []
    palette = {
        'baseline':       '#9E9E9E',
        'cf_knn_pearson': '#42A5F5',
        'random_forest':  '#EF5350',
        'gradient_boosting': '#AB47BC',
        'hybrid_cf_rf':   '#FFA726',
        'hybrid_triple':  '#66BB6A',
    }
    label_map = {
        'baseline':       'Baseline\n(mean)',
        'cf_knn_pearson': 'CF\n(Pearson+KNN)',
        'random_forest':  'Random\nForest',
        'gradient_boosting': 'Gradient\nBoosting',
        'hybrid_cf_rf':   'Hybrid\nCF+RF',
        'hybrid_triple':  'Hybrid\nTriple',
    }
    order = ['baseline', 'cf_knn_pearson', 'random_forest', 'gradient_boosting', 'hybrid_cf_rf', 'hybrid_triple']
    for key in order:
        if key in algos:
            names.append(label_map.get(key, key))
            rmse_vals.append(algos[key]['rmse'])
            mae_vals.append(algos[key]['mae'])
            colors_list.append(palette.get(key, '#999'))

    x = np.arange(len(names))
    w = 0.35
    fig, ax = plt.subplots(figsize=(12, 6))
    bars1 = ax.bar(x - w/2, rmse_vals, w, label='RMSE', color=[c + 'CC' for c in colors_list], edgecolor=colors_list, linewidth=1.2)
    bars2 = ax.bar(x + w/2, mae_vals, w, label='MAE', color=colors_list, edgecolor=[c + '88' for c in colors_list], linewidth=1.2)

    for bar in bars1:
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.02, f'{bar.get_height():.2f}',
                ha='center', va='bottom', fontsize=8, fontweight='bold')
    for bar in bars2:
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.02, f'{bar.get_height():.2f}',
                ha='center', va='bottom', fontsize=8)

    # highlight best
    candidates = {k: v['rmse'] for k, v in algos.items() if k != 'baseline'}
    best_key = min(candidates, key=candidates.get)
    keys_order = [k for k in order if k in algos]
    best_idx = keys_order.index(best_key)
    ax.annotate(f'* Best: {label_map.get(best_key, best_key)}',
                xy=(best_idx, algos[best_key]['rmse']),
                xytext=(best_idx, algos[best_key]['rmse'] + 0.6),
                fontsize=10, fontweight='bold', color='#D32F2F',
                arrowprops=dict(arrowstyle='->', color='#D32F2F', lw=1.5))

    ax.set_xticks(x)
    ax.set_xticklabels(names, fontsize=9)
    ax.set_ylabel('Error (stars)', fontsize=12, fontweight='bold')
    ax.set_title('Precision de Prediccion: RMSE vs MAE por Algoritmo', fontsize=14, fontweight='bold', pad=15)
    ax.legend(fontsize=11, loc='upper left')
    ax.set_ylim(0, max(rmse_vals) * 1.3)
    ax.axhline(y=1.0, color='#4CAF50', linestyle='--', alpha=0.3, linewidth=1)
    ax.axhline(y=1.5, color='#FFC107', linestyle='--', alpha=0.3, linewidth=1)
    ax.grid(axis='y', alpha=0.3)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    fig.savefig(OUTPUT / '01_rmse_mae_comparison.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    print("  [OK] 01_rmse_mae_comparison.png")

# ══════════════════════════════════════════════════════════════════════
# FIGURE 2: Error Distribution
# ══════════════════════════════════════════════════════════════════════
def plot_error_distribution():
    if not error_dist:
        print("  [NO] error_distribution - skipping fig 2")
        return
    thresholds, pcts = [], []
    for t in [0.5, 1.0, 1.5, 2.0]:
        key = f'within_{str(t).replace(".", "_")}'
        if key in error_dist:
            thresholds.append(str(t))
            pcts.append(error_dist[key])
    if not thresholds:
        return

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5.5))
    colors_bar = ['#4CAF50', '#8BC34A', '#FFC107', '#FF9800']
    bars = ax1.bar(thresholds, pcts, color=colors_bar, edgecolor='#333', linewidth=1.2, width=0.6)
    for bar, pct in zip(bars, pcts):
        ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1.5,
                 f'{pct:.1f}%', ha='center', va='bottom', fontsize=13, fontweight='bold')
    ax1.set_ylim(0, 105)
    ax1.set_xlabel('Error absoluto (estrellas)', fontsize=12, fontweight='bold')
    ax1.set_ylabel('% de predicciones', fontsize=12, fontweight='bold')
    ax1.set_title('Distribucion del Error Absoluto', fontsize=13, fontweight='bold')
    ax1.spines['top'].set_visible(False)
    ax1.spines['right'].set_visible(False)
    ax1.grid(axis='y', alpha=0.3)

    cumulative = np.cumsum(pcts)
    ax2.fill_between(range(len(thresholds)), cumulative, alpha=0.25, color='#1976D2')
    ax2.plot(range(len(thresholds)), cumulative, 'o-', color='#1976D2', linewidth=2.5, markersize=8)
    for i, (t, c) in enumerate(zip(thresholds, cumulative)):
        ax2.text(i, c + 1.5, f'{c:.1f}%', ha='center', va='bottom', fontsize=11, fontweight='bold')
    ax2.set_xticks(range(len(thresholds)))
    ax2.set_xticklabels([f'<= {t}' for t in thresholds])
    ax2.set_ylim(0, 110)
    ax2.set_xlabel('Umbral de error', fontsize=12, fontweight='bold')
    ax2.set_ylabel('% acumulado', fontsize=12, fontweight='bold')
    ax2.set_title('Precision Acumulada del Sistema', fontsize=13, fontweight='bold')
    ax2.spines['top'].set_visible(False)
    ax2.spines['right'].set_visible(False)
    ax2.grid(axis='y', alpha=0.3)
    plt.tight_layout()
    fig.savefig(OUTPUT / '02_error_distribution.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    print("  [OK] 02_error_distribution.png")

# ══════════════════════════════════════════════════════════════════════
# FIGURE 3: Ranking Metrics
# ══════════════════════════════════════════════════════════════════════
def plot_ranking_metrics():
    if not ranking or ranking.get('ndcg_at_5') is None:
        print("  [NO] ranking metrics - skipping fig 3")
        return
    labels = ['NDCG@5', 'Precision@5', 'Hit Rate@10']
    values = [ranking.get('ndcg_at_5', 0), ranking.get('precision_at_5', 0), ranking.get('hit_rate_at_10', 0)]
    colors_rank = ['#1976D2', '#388E3C', '#F57C00']

    fig, ax = plt.subplots(figsize=(8, 5))
    bars = ax.bar(labels, values, color=colors_rank, edgecolor='#333', linewidth=1.2, width=0.5)
    for bar, v in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.015,
                f'{v:.2%}', ha='center', va='bottom', fontsize=13, fontweight='bold')

    ax.set_ylim(0, 1.0)
    ax.set_ylabel('Tasa', fontsize=12, fontweight='bold')
    ax.set_title('Metricas de Ranking del Sistema Hibrido', fontsize=14, fontweight='bold', pad=10)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(axis='y', alpha=0.3)
    ax.yaxis.set_major_formatter(mticker.PercentFormatter(1.0))
    ax.text(0.5, -0.15,
            f'Evaluados {ranking.get("users_evaluated", 0)} usuarios con >=3 interacciones en test set',
            transform=ax.transAxes, ha='center', fontsize=9, color='#666')
    plt.tight_layout()
    fig.savefig(OUTPUT / '03_ranking_metrics.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    print("  [OK] 03_ranking_metrics.png")


# ══════════════════════════════════════════════════════════════════════
# FIGURE 4: Feature Importances (Top 15)
# ══════════════════════════════════════════════════════════════════════
def plot_feature_importances():
    if not feat_imp:
        print("  [NO] feature importances - skipping fig 4")
        return
    items = sorted(feat_imp.items(), key=lambda x: x[1], reverse=True)[:15]
    names_f = [i[0] for i in items][::-1]
    vals_f = [i[1] for i in items][::-1]

    fig, ax = plt.subplots(figsize=(10, 6))
    colors_f = plt.cm.Blues(np.linspace(0.35, 0.85, len(names_f)))
    bars = ax.barh(range(len(names_f)), vals_f, color=colors_f, edgecolor='#333', linewidth=0.8, height=0.65)
    for i, (bar, v) in enumerate(zip(bars, vals_f)):
        ax.text(bar.get_width() + 0.002, bar.get_y() + bar.get_height()/2,
                f'{v:.3f}', ha='left', va='center', fontsize=9, fontweight='bold')
    ax.set_yticks(range(len(names_f)))
    ax.set_yticklabels(names_f, fontsize=9)
    ax.set_xlabel('Importancia', fontsize=12, fontweight='bold')
    ax.set_title('Top 15 Caracteristicas mas Importantes (Random Forest)', fontsize=14, fontweight='bold', pad=10)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.invert_yaxis()
    ax.set_xlim(0, max(vals_f) * 1.15)
    plt.tight_layout()
    fig.savefig(OUTPUT / '04_feature_importances.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    print("  [OK] 04_feature_importances.png")


# ══════════════════════════════════════════════════════════════════════
# FIGURE 5: Prediction Distribution (actual vs predicted star buckets)
# ══════════════════════════════════════════════════════════════════════
def plot_prediction_distribution():
    if not pred_dist:
        print("  [NO] prediction_distribution - skipping fig 5")
        return
    actual_buckets = pred_dist.get('actual_buckets', [])
    predicted_buckets = pred_dist.get('predicted_buckets', [])
    if not actual_buckets or not predicted_buckets:
        return
    stars = [str(a[0]) for a in actual_buckets]
    actual_counts = [a[1] for a in actual_buckets]
    pred_counts = [p[1] for p in predicted_buckets]

    x = np.arange(len(stars))
    w = 0.35
    fig, ax = plt.subplots(figsize=(9, 5.5))
    ax.bar(x - w/2, actual_counts, w, label='Actual (test set)', color='#42A5F5', edgecolor='#1565C0', linewidth=1)
    ax.bar(x + w/2, pred_counts, w, label='Predicho (sistema)', color='#FF7043', edgecolor='#D84315', linewidth=1, alpha=0.85)
    ax.set_xticks(x)
    ax.set_xticklabels(stars, fontsize=12)
    ax.set_xlabel('Rating (estrellas)', fontsize=12, fontweight='bold')
    ax.set_ylabel('Cantidad de predicciones', fontsize=12, fontweight='bold')
    ax.set_title('Distribucion: Ratings Reales vs Predichos', fontsize=14, fontweight='bold')
    ax.legend(fontsize=11)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(axis='y', alpha=0.3)
    plt.tight_layout()
    fig.savefig(OUTPUT / '05_prediction_distribution.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    print("  [OK] 05_prediction_distribution.png")


# ══════════════════════════════════════════════════════════════════════
# FIGURE 6: Data Quality Dashboard
# ══════════════════════════════════════════════════════════════════════
def plot_data_quality_summary():
    if not data_quality:
        print("  [NO] data_quality - skipping fig 6")
        return
    dq_labels, dq_values = [], []
    mappings = [
        ('total_interactions', 'Interacciones\nentrenamiento'),
        ('total_test', 'Interacciones\ntest'),
        ('users_count', 'Usuarios\nen matriz'),
        ('businesses_count', 'Negocios\nen matriz'),
        ('features_count', 'Caracteristicas\nML'),
        ('real_smartur_interactions', 'Interacciones\nreales SMARTUR'),
    ]
    for key, label in mappings:
        if key in data_quality and data_quality[key] is not None:
            dq_labels.append(label)
            dq_values.append(data_quality[key])
    if not dq_values:
        return

    fig, ax = plt.subplots(figsize=(10, 5))
    colors_dq = plt.cm.viridis(np.linspace(0.2, 0.8, len(dq_values)))
    bars = ax.bar(range(len(dq_values)), dq_values, color=colors_dq, edgecolor='#333', linewidth=1, width=0.55)
    for bar, v in zip(bars, dq_values):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + max(dq_values)*0.02,
                f'{v:,}', ha='center', va='bottom', fontsize=11, fontweight='bold')
    ax.set_xticks(range(len(dq_values)))
    ax.set_xticklabels(dq_labels, fontsize=9)
    ax.set_ylabel('Cantidad', fontsize=12, fontweight='bold')
    ax.set_title('Calidad y Escala de Datos de Entrenamiento', fontsize=14, fontweight='bold', pad=10)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(axis='y', alpha=0.3)
    plt.tight_layout()
    fig.savefig(OUTPUT / '06_data_quality.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    print("  [OK] 06_data_quality.png")


# ══════════════════════════════════════════════════════════════════════
# FIGURE 7: Training History
# ══════════════════════════════════════════════════════════════════════
def plot_training_history():
    if not training_history or len(training_history) < 2:
        print("  [NO] training history - skipping fig 7")
        return
    timestamps = [t.get('timestamp', str(i))[-8:] for i, t in enumerate(training_history)]
    rmse_hist = [t.get('rmse', 0) for t in training_history]
    mae_hist = [t.get('mae', 0) for t in training_history]
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot(range(len(timestamps)), rmse_hist, 'o-', color='#EF5350', linewidth=2, markersize=7, label='RMSE')
    ax.plot(range(len(timestamps)), mae_hist, 's--', color='#42A5F5', linewidth=2, markersize=7, label='MAE')
    for i, (r, m) in enumerate(zip(rmse_hist, mae_hist)):
        ax.text(i, r + 0.03, f'{r:.3f}', ha='center', va='bottom', fontsize=8, fontweight='bold', color='#EF5350')
    ax.set_xticks(range(len(timestamps)))
    ax.set_xticklabels(timestamps, fontsize=8, rotation=45)
    ax.set_xlabel('Fecha de entrenamiento', fontsize=11, fontweight='bold')
    ax.set_ylabel('Error', fontsize=12, fontweight='bold')
    ax.set_title('Evolucion del Error a traves de Entrenamientos', fontsize=14, fontweight='bold')
    ax.legend(fontsize=11)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(axis='y', alpha=0.3)
    plt.tight_layout()
    fig.savefig(OUTPUT / '07_training_history.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    print("  [OK] 07_training_history.png")


# ══════════════════════════════════════════════════════════════════════
# FIGURE 8: Viability Summary
# ══════════════════════════════════════════════════════════════════════
def plot_viability_summary():
    best_rmse = min((v['rmse'] for k, v in algos.items() if k != 'baseline'), default=2.0)
    candidates = {k: v['rmse'] for k, v in algos.items() if k != 'baseline'}
    best_algo_name = min(candidates, key=candidates.get) if candidates else '?'
    pct_within_1 = error_dist.get('within_1_0', 0)
    ndcg = ranking.get('ndcg_at_5', 0)
    hit_rate = ranking.get('hit_rate_at_10', 0)
    users = data_quality.get('users_count', 0)
    bizs = data_quality.get('businesses_count', 0)

    dims = [
        ('Precision\n(RMSE)', f'{best_rmse:.2f}',
         'OK' if best_rmse < 1.5 else ('--' if best_rmse < 2.0 else '!!'),
         '#4CAF50' if best_rmse < 1.5 else ('#FFC107' if best_rmse < 2.0 else '#F44336')),
        ('Error <=1 estrella', f'{pct_within_1:.0f}%',
         'OK' if pct_within_1 >= 50 else ('--' if pct_within_1 >= 35 else '!!'),
         '#4CAF50' if pct_within_1 >= 50 else ('#FFC107' if pct_within_1 >= 35 else '#F44336')),
        ('Ranking\n(NDCG@5)', f'{ndcg:.0%}',
         'OK' if ndcg >= 0.40 else ('--' if ndcg >= 0.25 else '!!'),
         '#4CAF50' if ndcg >= 0.40 else ('#FFC107' if ndcg >= 0.25 else '#F44336')),
        ('Hit Rate\n@10', f'{hit_rate:.0%}',
         'OK' if hit_rate >= 0.70 else ('--' if hit_rate >= 0.50 else '!!'),
         '#4CAF50' if hit_rate >= 0.70 else ('#FFC107' if hit_rate >= 0.50 else '#F44336')),
        ('Cobertura\ndatos', f'{users:,} users\n{bizs:,} POIs',
         'OK' if users >= 50000 else ('--' if users >= 10000 else '!!'),
         '#4CAF50' if users >= 50000 else ('#FFC107' if users >= 10000 else '#F44336')),
    ]

    fig, ax = plt.subplots(figsize=(12, 5))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis('off')

    ax.text(5, 5.4, 'VIABILIDAD DEL MODELO - Panel Resumen', fontsize=16, fontweight='bold',
            ha='center', va='center', color='#1a1a2e',
            bbox=dict(facecolor='white', edgecolor='#1a1a2e', boxstyle='round,pad=0.5'))

    for i, (label, value, symbol, color) in enumerate(dims):
        x0 = 0.5 + i * 1.8
        card = FancyBboxPatch((x0, 3.0), 1.6, 1.8, facecolor='white', edgecolor=color,
                              linewidth=2.5, boxstyle='round,pad=0.08')
        ax.add_patch(card)
        ax.text(x0 + 0.8, 4.5, symbol, ha='center', va='center', fontsize=20, color=color, fontweight='bold')
        ax.text(x0 + 0.8, 3.85, value, ha='center', va='center', fontsize=13, fontweight='bold', color='#333')
        ax.text(x0 + 0.8, 3.2, label, ha='center', va='center', fontsize=9, color='#555')
        if i == 0:
            ax.text(x0 + 0.8, 2.75, f'Best: {best_algo_name}', ha='center', va='center', fontsize=7.5, color='#888')
        ax.text(x0 + 0.8, 2.45, f'sample={sample_size}', ha='center', va='center', fontsize=7, color='#aaa')

    ax.text(0.5, 1.6, 'OK = Bueno    -- = Aceptable    !! = Requiere mejora', fontsize=10, color='#666',
            ha='left', va='center')
    ax.text(0.5, 1.0, f'Alpha hibrido optimo: {best_alpha} | '
            f'Usuarios evaluados ranking: {ranking.get("users_evaluated", 0)}',
            fontsize=9, color='#888', ha='left', va='center')

    fig.savefig(OUTPUT / '08_viability_summary.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    print("  [OK] 08_viability_summary.png")


# ══════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════
if __name__ == '__main__':
    print("\nGenerando graficos...\n")
    plot_rmse_mae()
    plot_error_distribution()
    plot_ranking_metrics()
    plot_feature_importances()
    plot_prediction_distribution()
    plot_data_quality_summary()
    plot_training_history()
    plot_viability_summary()

    print(f"\n{'=' * 60}")
    print(f"  Todos los graficos guardados en: {OUTPUT}")
    print(f"{'=' * 60}")
