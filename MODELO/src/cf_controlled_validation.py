"""Auditoría reproducible de KNN-CF bajo condiciones colaborativas válidas.

No forma parte del arranque de producción. Construye usuarios con gustos por
clusters, exposición compartida al mismo catálogo y suficientes ratings. Sirve
para verificar que Pearson+KNN sí recupera señal cuando existe solapamiento;
el bootstrap turístico principal se evalúa por separado porque representa el
catálogo y el contexto de SMARTUR.
"""
from __future__ import annotations

import argparse
import json
import os

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split

from cf import predict_cf_pearson
from engine import SmarturEngine


def run(seed: int = 42, users: int = 240, items: int = 30) -> dict:
    rng = np.random.default_rng(seed)
    clusters = max(3, min(8, items // 4))
    rows = []
    for user in range(users):
        for item in range(items):
            expected = 4.7 if item % clusters == user % clusters else 2.0
            rows.append({
                "user_id": f"cf_user_{user}",
                "business_id": f"cf_item_{item}",
                "stars": float(np.clip(round(expected + rng.normal(0, 0.15)), 1, 5)),
            })
    ratings = pd.DataFrame(rows)
    train, test = train_test_split(ratings, test_size=0.2, random_state=seed)
    engine = object.__new__(SmarturEngine)
    engine.df = train.copy()
    engine.train_data = train.copy()
    engine.test_data = test.copy()
    engine.df_biz = pd.DataFrame({"business_id": [f"cf_item_{i}" for i in range(items)]})
    engine.user_item_matrix = None
    engine.matrix_centered = None
    engine.user_item_matrix_index = None
    engine.user_item_matrix_columns = None
    engine.user_means = None
    engine.knn_model = None
    engine._user_idx_map = None
    engine._biz_idx_map = None
    engine.prepare_pearson_matrix()

    actual = test["stars"].to_numpy(dtype=float)
    global_mean = float(train["stars"].mean())
    item_mean = test["business_id"].map(train.groupby("business_id")["stars"].mean())
    item_mean = item_mean.fillna(global_mean).to_numpy(dtype=float)
    cf_pred = np.asarray([
        predict_cf_pearson(row.user_id, row.business_id, engine)
        for row in test.itertuples()
    ], dtype=float)

    def score(pred):
        return {
            "rmse": float(np.sqrt(mean_squared_error(actual, pred))),
            "mae": float(mean_absolute_error(actual, pred)),
        }

    report = {
        "dataset_type": "controlled_collaborative_synthetic",
        "warning": "Demuestra capacidad de CF con solapamiento; no representa usuarios reales.",
        "seed": seed,
        "users": users,
        "items": items,
        "ratings": int(len(ratings)),
        "avg_train_items_per_user": float(train.groupby("user_id").size().mean()),
        "metrics": {
            "baseline_global": score(np.full(len(test), global_mean)),
            "item_mean": score(item_mean),
            "cf_knn_pearson": score(cf_pred),
        },
    }
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--users", type=int, default=240)
    parser.add_argument("--items", type=int, default=30)
    parser.add_argument("--output", default="../models/cf_controlled_metrics.json")
    args = parser.parse_args()
    report = run(args.seed, args.users, args.items)
    output = os.path.abspath(os.path.join(os.path.dirname(__file__), args.output))
    os.makedirs(os.path.dirname(output), exist_ok=True)
    with open(output, "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2, ensure_ascii=False)
    print(json.dumps(report, indent=2, ensure_ascii=False))
