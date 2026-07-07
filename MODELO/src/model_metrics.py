"""
Comparativa formal de los 3 algoritmos ML y persistencia de métricas / configuración óptima.
"""
import json
import logging
import os
from math import sqrt

import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error

from cf import predict_cf_pearson

_DIR = os.path.dirname(os.path.abspath(__file__))
_METRICS_PATH = os.path.join(_DIR, '..', 'models', 'algorithm_metrics.json')
logger = logging.getLogger(__name__)

DEFAULT_METRICS = {
    'best_algorithm': 'hybrid',
    'best_alpha': 0.2,
    'local_blend': {'rf': 0.55, 'gbm': 0.45},
    'algorithms': {},
    'ranking': {},
    'error_distribution': {},
    'prediction_distribution': {},
    'data_quality': {},
}


def _rmse_mae(actuals, preds):
    actuals = np.asarray(actuals, dtype=float)
    preds = np.asarray(preds, dtype=float)
    return {
        'rmse': float(sqrt(mean_squared_error(actuals, preds))),
        'mae': float(mean_absolute_error(actuals, preds)),
    }


def compare_algorithms(engine, rf_model, gbm_model, sample_size=5000, hybrid_alpha=0.2):
    """
    Evalúa CF+KNN, Random Forest y Gradient Boosting; elige el mejor por RMSE.
    Retorna métricas y pesos recomendados para producción.
    """
    from evaluate import _infer_user_context, evaluar_ranking

    n_eval = min(sample_size, len(engine.test_data))
    test_sample = engine.test_data.sample(n_eval, random_state=42)

    actuals, preds_cf, preds_rf, preds_gbm = [], [], [], []
    user_contexts = {
        uid: _infer_user_context(uid, engine)
        for uid in test_sample['user_id'].unique()
    }

    for _, row in test_sample.iterrows():
        try:
            p_cf = predict_cf_pearson(row['user_id'], row['business_id'], engine)
            ctx = user_contexts.get(row['user_id'])
            p_rf = float(
                rf_model.predict_with_context([row['business_id']], user_context=ctx)[0]
            )
            p_gbm = float(
                gbm_model.predict_with_context([row['business_id']], user_context=ctx)[0]
            )
            if np.isnan(p_cf) or np.isnan(p_rf) or np.isnan(p_gbm):
                continue
            actuals.append(row['stars'])
            preds_cf.append(p_cf)
            preds_rf.append(p_rf)
            preds_gbm.append(p_gbm)
        except Exception:
            continue

    if len(actuals) < 50:
        return DEFAULT_METRICS

    actuals = np.array(actuals)
    preds_cf = np.array(preds_cf)
    preds_rf = np.array(preds_rf)
    preds_gbm = np.array(preds_gbm)

    media = float(engine.train_data['stars'].mean())
    preds_baseline = np.full_like(actuals, media)

    metrics = {
        'baseline': _rmse_mae(actuals, preds_baseline),
        'cf_knn_pearson': _rmse_mae(actuals, preds_cf),
        'random_forest': _rmse_mae(actuals, preds_rf),
        'gradient_boosting': _rmse_mae(actuals, preds_gbm),
    }

    # Alpha grid search constrained to [0.1, 0.9] to guarantee genuine blending.
    # Unconstrained search can collapse to alpha=1.0 (pure CF) when RF underperforms,
    # making hybrid indistinguishable from CF in the dashboard.
    alphas = np.arange(0.1, 0.95, 0.1)
    best_alpha, best_hybrid_rmse = hybrid_alpha, float('inf')
    for alpha in alphas:
        hybrid = alpha * preds_cf + (1 - alpha) * preds_rf
        rmse = sqrt(mean_squared_error(actuals, hybrid))
        if rmse < best_hybrid_rmse:
            best_hybrid_rmse = rmse
            best_alpha = float(round(alpha, 1))

    hybrid_preds = best_alpha * preds_cf + (1 - best_alpha) * preds_rf
    metrics['hybrid_cf_rf'] = {
        **_rmse_mae(actuals, hybrid_preds),
        'alpha': best_alpha,
    }

    triple = 0.15 * preds_cf + 0.50 * preds_rf + 0.35 * preds_gbm
    metrics['hybrid_triple'] = _rmse_mae(actuals, triple)

    # 'baseline' SÍ compite — antes se excluía a propósito, lo que garantizaba
    # que el sistema nunca pudiera admitir que predecir el promedio simple le
    # gana a CF/RF/GBM/híbrido. Eso ocultaba el problema real (falta de señal
    # aprendida) detrás de un "mejor algoritmo" que en realidad no lo era.
    candidates = {
        'baseline': metrics['baseline']['rmse'],
        'cf_knn_pearson': metrics['cf_knn_pearson']['rmse'],
        'random_forest': metrics['random_forest']['rmse'],
        'gradient_boosting': metrics['gradient_boosting']['rmse'],
        'hybrid_cf_rf': metrics['hybrid_cf_rf']['rmse'],
        'hybrid_triple': metrics['hybrid_triple']['rmse'],
    }
    best_algorithm = min(candidates, key=candidates.get)
    if best_algorithm == 'baseline':
        logger.warning(
            f"[compare_algorithms] El baseline (RMSE={metrics['baseline']['rmse']:.4f}) "
            f"le gana a CF/RF/GBM/híbrido — el modelo no aporta valor medible hoy."
        )

    rf_rmse = metrics['random_forest']['rmse']
    gbm_rmse = metrics['gradient_boosting']['rmse']
    total_inv = (1 / rf_rmse) + (1 / gbm_rmse)
    w_rf = (1 / rf_rmse) / total_inv
    w_gbm = (1 / gbm_rmse) / total_inv

    result = {
        'best_algorithm': best_algorithm,
        'best_alpha': best_alpha if best_algorithm == 'hybrid_cf_rf' else hybrid_alpha,
        'production_alpha': hybrid_alpha,
        'local_blend': {'rf': round(w_rf, 3), 'gbm': round(w_gbm, 3)},
        'algorithms': metrics,
        'sample_size': len(actuals),
    }

    # Enrich with error_distribution, prediction_distribution, data_quality
    _actuals = np.asarray(actuals, dtype=float)
    errors_abs = np.abs(_actuals - hybrid_preds)
    ed = {}
    for t in [0.5, 1.0, 1.5, 2.0]:
        key = f'within_{str(t).replace(".", "_")}'
        ed[key] = round(float((errors_abs <= t).mean() * 100), 1)
    result['error_distribution'] = ed

    actual_buckets = []
    pred_buckets = []
    for star in range(1, 6):
        actual_buckets.append([star, int((_actuals == star).sum())])
        pred_buckets.append([
            star,
            int(((hybrid_preds >= star - 0.5) & (hybrid_preds < star + 0.5)).sum()),
        ])
    result['prediction_distribution'] = {
        'actual_buckets': actual_buckets,
        'predicted_buckets': pred_buckets,
    }

    if engine is not None:
        # Augment data_quality with real SMARTUR interaction count if available
        real_count = 0
        try:
            from poi_repository import fetch_real_interactions
            real_df = fetch_real_interactions()
            real_count = len(real_df) if real_df is not None else 0
        except Exception:
            pass

        result['data_quality'] = {
            'total_interactions': int(len(engine.train_data)) if hasattr(engine, 'train_data') and engine.train_data is not None else 0,
            'total_test': int(len(engine.test_data)) if hasattr(engine, 'test_data') and engine.test_data is not None else 0,
            'users_count': int(engine.user_item_matrix.shape[0]) if engine and engine.user_item_matrix is not None else 0,
            'businesses_count': int(engine.user_item_matrix.shape[1]) if engine and engine.user_item_matrix is not None else 0,
            'top_categories': getattr(rf_model, 'top_categories', [])[:10],
            'features_count': len(getattr(rf_model, 'features', [])),
            'real_smartur_interactions': real_count,
            'uses_real_data': real_count >= 10,
        }

    # Ranking metrics (NDCG@5, Precision@5, Hit Rate@10)
    try:
        ranking = evaluar_ranking(engine, rf_model, n_users=150, k=5)
        result['ranking'] = {
            'ndcg_at_5': round(ranking.get('ndcg', 0.0), 4),
            'precision_at_5': round(ranking.get('precision', 0.0), 4),
            'hit_rate_at_10': round(ranking.get('hit_rate', 0.0), 4),
            'users_evaluated': ranking.get('n_users_evaluated', 0),
        }
    except Exception as e:
        result['ranking'] = {'ndcg_at_5': None, 'precision_at_5': None, 'hit_rate_at_10': None, 'error': str(e)}

    return result


def save_metrics(metrics):
    os.makedirs(os.path.dirname(_METRICS_PATH), exist_ok=True)
    with open(_METRICS_PATH, 'w', encoding='utf-8') as f:
        json.dump(metrics, f, indent=2, ensure_ascii=False)


def load_metrics():
    if not os.path.exists(_METRICS_PATH):
        return dict(DEFAULT_METRICS)
    try:
        with open(_METRICS_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        merged = dict(DEFAULT_METRICS)
        merged.update(data)
        if 'local_blend' not in merged or not merged['local_blend']:
            merged['local_blend'] = DEFAULT_METRICS['local_blend']
        return merged
    except (json.JSONDecodeError, OSError):
        return dict(DEFAULT_METRICS)
