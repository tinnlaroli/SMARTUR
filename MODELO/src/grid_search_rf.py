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

    engine = SmarturEngine(data_source='mexico')


    engine = SmarturEngine(data_source='mexico')
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
