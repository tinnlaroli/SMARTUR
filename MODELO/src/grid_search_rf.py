"""
Grid search for Random Forest hyperparameters.
Usage:
    python grid_search_rf.py                       # Run grid search on a subset
    python grid_search_rf.py --retrain              # Retrain full model with best params after grid
    python grid_search_rf.py --best-only            # Skip grid, just retrain with saved best params
"""
import argparse
import itertools
import json
import os
import sys
import time
from math import sqrt

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split

from engine import SmarturEngine
from rf_model import SmarturContextModel, _MODELS, _DATA
from context_encoder import MAPEO_CATEGORIAS

_PARAM_GRID = {
    'n_estimators': [100, 200, 300],
    'max_depth': [8, 12, 16, None],
    'min_samples_leaf': [2, 5, 10],
}

_GRID_TRAIN_SIZE = 15000
_EVAL_SIZE = 5000
_RESULTS_PATH = os.path.join(_MODELS, 'rf_grid_search_results.json')
_BEST_PARAMS_PATH = os.path.join(_MODELS, 'rf_best_params.json')


def _extract_subset(df, n, seed=42):
    if len(df) <= n:
        return df
    return df.sample(n, random_state=seed)


def run_grid():
    print("=" * 60, flush=True)
    print("  Grid Search RF — SMARTUR (optimizado)", flush=True)
    print("=" * 60, flush=True)

    engine = SmarturEngine()
    engine.prepare_pearson_matrix()
    print(f"\nTrain: {len(engine.train_data)} rows, Test: {len(engine.test_data)}", flush=True)
    print(f"Users: {engine.user_item_matrix.shape[0]}, Items: {engine.user_item_matrix.shape[1]}", flush=True)

    train_subset = _extract_subset(engine.train_data, _GRID_TRAIN_SIZE)
    train_idx, val_idx = train_test_split(
        train_subset.index, test_size=min(_EVAL_SIZE, int(len(train_subset) * 0.25)),
        random_state=42
    )
    train_df = train_subset.loc[train_idx]
    val_df = engine.train_data.loc[val_idx]

    print(f"Grid train: {len(train_df)} rows, validation: {len(val_df)} rows", flush=True)

    # Batch-compute user contexts using vectorized groupby
    print("Computing user contexts...", flush=True)
    ctx_t0 = time.time()
    val_user_ids = val_df['user_id'].unique()
    user_train = engine.train_data[engine.train_data['user_id'].isin(val_user_ids)]
    user_biz = user_train.merge(
        engine.df_biz[['business_id', 'categories', 'price_level', 'is_romantic', 'is_good_for_kids']],
        on='business_id', how='left'
    )
    val_user_contexts = {}
    for uid in val_user_ids:
        u_data = user_biz[user_biz['user_id'] == uid]
        liked = u_data[u_data['stars'] >= 4]
        cats_liked = ' '.join(liked['categories'].fillna('').str.lower()) if not liked.empty else ''
        tipos = [t for t, cats in MAPEO_CATEGORIAS.items() if any(c.lower() in cats_liked for c in cats)]
        budget_mean = liked['price_level'].mean() if not liked.empty else 2.0
        budget_val = int(round(float(budget_mean))) if not np.isnan(float(budget_mean)) else 2
        budget_val = max(1, min(4, budget_val))
        budget = {1: 'bajo', 2: 'medio', 3: 'alto', 4: 'premium'}[budget_val]
        likes_romantic = bool(liked['is_romantic'].eq(1).any()) if 'is_romantic' in liked.columns and not liked.empty else False
        likes_kids = bool(liked['is_good_for_kids'].eq(1).any()) if 'is_good_for_kids' in liked.columns and not liked.empty else False
        if likes_kids:
            group = 'familia'
        elif likes_romantic:
            group = 'pareja'
        else:
            group = 'solo'
        val_user_contexts[uid] = {
            'tiposTurismo': tipos or ['cultural'],
            'presupuesto_bucket': budget,
            'group_type': group,
            'edad_range': '25-34',
            'wants_tours': False,
            'needs_hotel': False,
            'pref_food': True,
            'requiere_accesibilidad': False,
            'pref_outdoor': False,
        }
    print(f"  {len(val_user_ids)} contexts computed in {time.time() - ctx_t0:.1f}s", flush=True)

    param_keys = list(_PARAM_GRID.keys())
    param_values = list(_PARAM_GRID.values())
    combinations = list(itertools.product(*param_values))
    total = len(combinations)
    print(f"\nGrid: {total} combinaciones\n", flush=True)
    print(f"{'#':>3}  {'n_est':>5} {'depth':>5} {'leaf':>5} {'RMSE':>8} {'MAE':>8}  {'time':>7}", flush=True)
    print("-" * 60, flush=True)

    results = []
    best_rmse = float('inf')
    best_params = None
    start_total = time.time()

    for i, combo in enumerate(combinations):
        params = dict(zip(param_keys, combo))
        t0 = time.time()

        print(f"\n--- Combo #{i+1}/{total}: {params} ---", flush=True)

        cm = SmarturContextModel()
        cm.model.set_params(**params)

        print("  [train] Starting...", flush=True)
        try:
            cm.train(train_df, dynamic_override=False)
        except Exception as e:
            print(f"  ERROR training: {e}", flush=True)
            continue
        print(f"  [train] Done in {time.time() - t0:.1f}s", flush=True)

        # Batch predict per user context
        pt0 = time.time()
        actuals, preds = [], []
        val_grouped = val_df.groupby('user_id')
        for uid, group in val_grouped:
            ctx = val_user_contexts.get(uid)
            if ctx is None:
                continue
            biz_ids = group['business_id'].tolist()
            try:
                p_vals = cm.predict_with_context(biz_ids, user_context=ctx)
            except Exception:
                continue
            for star, p in zip(group['stars'].tolist(), p_vals):
                if np.isnan(p):
                    continue
                actuals.append(star)
                preds.append(float(p))

        print(f"  [predict] {len(actuals)} valid predictions in {time.time() - pt0:.1f}s", flush=True)
        if len(actuals) < 30:
            print("  SKIP: < 30 valid predictions", flush=True)
            continue

        actuals_np = np.array(actuals)
        preds_np = np.array(preds)
        rmse = float(sqrt(mean_squared_error(actuals_np, preds_np)))
        mae = float(mean_absolute_error(actuals_np, preds_np))
        elapsed = time.time() - t0

        entry = {**params, 'rmse': rmse, 'mae': mae, 'n_valid': len(actuals)}
        results.append(entry)

        marker = ""
        if rmse < best_rmse:
            best_rmse = rmse
            best_params = params.copy()
            marker = "  ← BEST"

        print(
            f"  #{i+1:>3}  {params['n_estimators']:>5} "
            f"{str(params['max_depth'] or '∞'):>5} "
            f"{params['min_samples_leaf']:>5} "
            f"{rmse:>8.4f} {mae:>8.4f}  {elapsed:>6.1f}s{marker}",
            flush=True
        )

    total_time = time.time() - start_total
    results.sort(key=lambda r: r['rmse'])

    print("\n" + "=" * 60, flush=True)
    print(f"  BEST PARAMS (RMSE={best_rmse:.4f}):", flush=True)
    for k, v in best_params.items():
        print(f"    {k}: {v}", flush=True)
    print(f"  Tiempo total: {total_time:.0f}s ({total_time/60:.1f}min)", flush=True)
    print("=" * 60, flush=True)

    os.makedirs(_MODELS, exist_ok=True)
    with open(_RESULTS_PATH, 'w') as f:
        json.dump({
            'best_params': best_params,
            'best_rmse': best_rmse,
            'total_combinations': total,
            'total_time_s': round(total_time, 1),
            'results': results,
        }, f, indent=2, default=str)
    with open(_BEST_PARAMS_PATH, 'w') as f:
        json.dump(best_params, f, indent=2, default=str)

    print(f"\nResultados guardados en {_RESULTS_PATH}", flush=True)
    return best_params, best_rmse, results


def retrain_with_best_params(best_params):
    print("\n" + "=" * 60)
    print("  Re-entrenando RF completo con best params...")
    print("=" * 60)
    engine = SmarturEngine()
    engine.prepare_pearson_matrix()
    cm = SmarturContextModel()
    cm.model.set_params(**best_params)
    print(f"Params: {best_params}")
    print(f"Training on full dataset: {len(engine.train_data)} rows...")
    cm.train(engine.train_data, dynamic_override=False)
    print("RF completo entrenado y guardado.")
    return cm


def main():
    parser = argparse.ArgumentParser(description='Grid Search RF SMARTUR')
    parser.add_argument('--retrain', action='store_true')
    parser.add_argument('--best-only', action='store_true')
    args = parser.parse_args()

    if args.best_only:
        if not os.path.exists(_BEST_PARAMS_PATH):
            print("No saved best params found. Run without --best-only first.")
            sys.exit(1)
        with open(_BEST_PARAMS_PATH) as f:
            best_params = json.load(f)
        print(f"Loaded best params: {best_params}")
        retrain_with_best_params(best_params)
        return

    best_params, best_rmse, results = run_grid()

    if args.retrain:
        retrain_with_best_params(best_params)

    print("\nTop 5:")
    for r in results[:5]:
        print(f"  RMSE={r['rmse']:.4f}  MAE={r['mae']:.4f}  "
              f"n_est={r['n_estimators']}  depth={r['max_depth']}  leaf={r['min_samples_leaf']}")


if __name__ == '__main__':
    main()
