"""
K-fold cross-validation para los 3 algoritmos principales del motor de
recomendación: CF Pearson KNN, Random Forest y Gradient Boosting.

Complementa (no reemplaza) el train/test split de 80/20 que ya usan
model_metrics.py / api.py._compute_simple_metrics. Cada algoritmo se
reentrena K veces sobre una muestra del dataset, dejando fuera un fold
distinto cada vez para evaluar, y se reporta la media/desviación de
RMSE, MAE y tiempo de ejecución por fold.
"""
import logging
import time

import numpy as np
import pandas as pd
from math import sqrt
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import KFold

from cf import predict_cf_pearson
from engine import SmarturEngine
from evaluate import _infer_user_context
from gbm_model import SmarturGbmModel
from rf_model import SmarturContextModel

logger = logging.getLogger(__name__)

DEFAULT_K = 5
DEFAULT_SAMPLE_SIZE = 3000


def _rmse_mae(actuals, preds) -> dict:
    return {
        'rmse': float(sqrt(mean_squared_error(actuals, preds))),
        'mae': float(mean_absolute_error(actuals, preds)),
    }


def _make_fold_engine(train_fold_df: pd.DataFrame, df_biz: pd.DataFrame) -> SmarturEngine:
    """
    Instancia liviana de SmarturEngine que NO lee CSVs de disco (bypassa
    __init__) — solo sirve para reutilizar prepare_pearson_matrix() y
    _infer_user_context() sobre los datos de un fold específico.
    """
    fold_engine = object.__new__(SmarturEngine)
    fold_engine.train_data = train_fold_df
    fold_engine.df_biz = df_biz
    fold_engine._user_idx_map = None
    fold_engine._biz_idx_map = None
    fold_engine.prepare_pearson_matrix()
    return fold_engine


def run_kfold_cv(
    engine: SmarturEngine,
    k: int = DEFAULT_K,
    sample_size: int = DEFAULT_SAMPLE_SIZE,
    random_state: int = 42,
) -> dict:
    """
    Ejecuta k-fold cross-validation para cf_knn_pearson, random_forest y
    gradient_boosting sobre una muestra de `sample_size` interacciones
    (train + test combinados del engine ya cargado). Retorna un dict listo
    para persistir/serializar con RMSE/MAE promedio ± desviación estándar
    y tiempo de ejecución promedio por algoritmo.
    """
    full_df = pd.concat([engine.train_data, engine.test_data], ignore_index=True)
    n = min(sample_size, len(full_df))
    sample = full_df.sample(n, random_state=random_state).reset_index(drop=True)

    kf = KFold(n_splits=k, shuffle=True, random_state=random_state)

    metrics = {
        'cf_knn_pearson':    {'rmse': [], 'mae': [], 'time_ms': []},
        'random_forest':     {'rmse': [], 'mae': [], 'time_ms': []},
        'gradient_boosting': {'rmse': [], 'mae': [], 'time_ms': []},
    }

    fold_num = 0
    for train_idx, test_idx in kf.split(sample):
        fold_num += 1
        train_fold = sample.iloc[train_idx].reset_index(drop=True)
        test_fold = sample.iloc[test_idx].reset_index(drop=True)
        logger.info(f"[cv] Fold {fold_num}/{k} — train={len(train_fold)}, test={len(test_fold)}")

        # Engine liviano del fold, compartido por RF/GBM para inferir contexto
        # de usuario (_infer_user_context) y por CF para el KNN/Pearson.
        fold_ctx_engine = None
        try:
            fold_ctx_engine = object.__new__(SmarturEngine)
            fold_ctx_engine.train_data = train_fold
            fold_ctx_engine.df_biz = engine.df_biz
        except Exception as exc:
            logger.warning(f"[cv] Fold {fold_num}: no se pudo preparar engine de contexto: {exc}")

        # ── CF Pearson KNN ──────────────────────────────────────────────
        t0 = time.time()
        try:
            fold_cf_engine = _make_fold_engine(train_fold, engine.df_biz)
            actuals, preds = [], []
            for _, row in test_fold.iterrows():
                p = predict_cf_pearson(row['user_id'], row['business_id'], fold_cf_engine)
                if not np.isnan(p):
                    actuals.append(row['stars'])
                    preds.append(p)
            if actuals:
                m = _rmse_mae(actuals, preds)
                metrics['cf_knn_pearson']['rmse'].append(m['rmse'])
                metrics['cf_knn_pearson']['mae'].append(m['mae'])
        except Exception as exc:
            logger.warning(f"[cv] Fold {fold_num} CF falló: {exc}")
        metrics['cf_knn_pearson']['time_ms'].append((time.time() - t0) * 1000)

        # ── Random Forest ───────────────────────────────────────────────
        t0 = time.time()
        try:
            rf = SmarturContextModel()
            rf.train(train_fold, dynamic_override=True)
            actuals, preds = [], []
            for _, row in test_fold.iterrows():
                ctx = _infer_user_context(row['user_id'], fold_ctx_engine) if fold_ctx_engine else None
                p = float(rf.predict_with_context([row['business_id']], user_context=ctx)[0])
                actuals.append(row['stars'])
                preds.append(p)
            if actuals:
                m = _rmse_mae(actuals, preds)
                metrics['random_forest']['rmse'].append(m['rmse'])
                metrics['random_forest']['mae'].append(m['mae'])
        except Exception as exc:
            logger.warning(f"[cv] Fold {fold_num} RF falló: {exc}")
        metrics['random_forest']['time_ms'].append((time.time() - t0) * 1000)

        # ── Gradient Boosting ───────────────────────────────────────────
        t0 = time.time()
        try:
            gbm = SmarturGbmModel()
            gbm.train(train_fold)
            actuals, preds = [], []
            for _, row in test_fold.iterrows():
                ctx = _infer_user_context(row['user_id'], fold_ctx_engine) if fold_ctx_engine else None
                p = float(gbm.predict_with_context([row['business_id']], user_context=ctx)[0])
                actuals.append(row['stars'])
                preds.append(p)
            if actuals:
                m = _rmse_mae(actuals, preds)
                metrics['gradient_boosting']['rmse'].append(m['rmse'])
                metrics['gradient_boosting']['mae'].append(m['mae'])
        except Exception as exc:
            logger.warning(f"[cv] Fold {fold_num} GBM falló: {exc}")
        metrics['gradient_boosting']['time_ms'].append((time.time() - t0) * 1000)

    summary = {'k': k, 'sample_size': n, 'algorithms': {}}
    for algo, vals in metrics.items():
        rmses, maes, times = vals['rmse'], vals['mae'], vals['time_ms']
        summary['algorithms'][algo] = {
            'rmse_mean': float(np.mean(rmses)) if rmses else None,
            'rmse_std':  float(np.std(rmses)) if rmses else None,
            'mae_mean':  float(np.mean(maes)) if maes else None,
            'mae_std':   float(np.std(maes)) if maes else None,
            'avg_execution_time_ms': float(np.mean(times)) if times else None,
            'folds_completed': len(rmses),
        }
    return summary
