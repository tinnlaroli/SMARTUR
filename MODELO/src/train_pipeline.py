"""Entrenamiento y auditoría reproducible del recomendador SMARTUR.

Este comando es el flujo de investigación/bootstrapping, no un script que
invente usuarios de producción. Mientras la aplicación no tenga usuarios
reales, genera un benchmark sintético controlado sobre el catálogo local y
guarda los artefactos con una marca explícita de origen.

Uso desde MODELO/src:

    python train_pipeline.py --personas 2500 --promote

``--promote`` escribe el modelo bootstrap en ``MODELO/models``. Las métricas
se guardan en ``models/bootstrap_metrics.json`` y nunca se presentan como
eficacia de usuarios reales.
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import time
from math import sqrt

import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split

from engine import SmarturEngine
from synthetic_training import build_synthetic_ratings
from synthetic_persona_validation import RANDOM_STATE
from cf import predict_cf_pearson

logger = logging.getLogger("smartur.train_pipeline")


def _score(actual, predicted):
    return {
        "rmse": float(sqrt(mean_squared_error(actual, predicted))),
        "mae": float(mean_absolute_error(actual, predicted)),
    }


def _make_engine(train_df, catalog):
    """Construye un engine aislado para no mutar el engine del API."""
    engine = object.__new__(SmarturEngine)
    engine.df = train_df.copy()
    engine.train_data = train_df.copy()
    engine.test_data = train_df.iloc[0:0].copy()
    engine.df_biz = catalog.copy()
    engine.user_item_matrix = None
    engine.matrix_centered = None
    engine.user_item_matrix_index = None
    engine.user_item_matrix_columns = None
    engine.user_means = None
    engine.knn_model = None
    engine._user_idx_map = None
    engine._biz_idx_map = None
    engine.prepare_pearson_matrix()
    return engine


def _evaluate(train_df, test_df, catalog):
    train_engine = _make_engine(train_df, catalog)
    actual = test_df["stars"].to_numpy(dtype=float)
    global_mean = float(train_df["stars"].mean())
    item_means = train_df.groupby("business_id")["stars"].mean()
    item_pred = test_df["business_id"].map(item_means).fillna(global_mean).to_numpy(dtype=float)
    cf_pred = np.array([
        predict_cf_pearson(row.user_id, row.business_id, train_engine)
        for row in test_df.itertuples()
    ], dtype=float)
    return {
        "baseline_global": _score(actual, np.full(len(actual), global_mean)),
        "item_mean": _score(actual, item_pred),
        "cf_knn_pearson": _score(actual, cf_pred),
        "n_test": int(len(test_df)),
        "n_users": int(train_df.user_id.nunique()),
        "n_items": int(train_df.business_id.nunique()),
    }


def _catalog_quality(catalog):
    required = ["business_id", "categories"]
    missing = [c for c in required if c not in catalog.columns]
    if missing:
        raise ValueError(f"El catálogo no tiene columnas obligatorias: {missing}")
    users = 0
    return {
        "items": int(catalog["business_id"].nunique()),
        "duplicate_item_ids": int(catalog["business_id"].duplicated().sum()),
        "missing_categories": int(catalog["categories"].isna().sum()),
        "missing_coordinates": int(sum(
            c in catalog.columns and catalog[c].isna().sum()
            for c in ("latitude", "longitude")
        )),
        "source": "smartur_catalog_bootstrap",
    }


def run(personas=2500, promote=False, seed=RANDOM_STATE):
    started = time.time()
    base = SmarturEngine(data_source="mexico")
    catalog = base.df_biz.copy()
    quality = _catalog_quality(catalog)

    # El benchmark se crea sobre los ítems locales. Así se prueba el ranking
    # que realmente verá el usuario y no un catálogo externo desconectado.
    # Generar una sola vez: el CSV de respaldo, el split, las métricas y los
    # artefactos promovidos deben describir exactamente las mismas filas.
    ratings = build_synthetic_ratings(catalog, n_personas=personas, seed=seed)
    train_df, test_df = train_test_split(ratings, test_size=0.2, random_state=seed)
    train_df = train_df.reset_index(drop=True)
    test_df = test_df.reset_index(drop=True)
    # Los modelos de features necesitan el texto/categorías del POI. El
    # enriquecimiento desde el catálogo es la fuente de verdad y también
    # cubre datasets sintéticos antiguos que no traían esa columna.
    if "categories" not in train_df.columns:
        item_categories = catalog[["business_id", "categories"]].copy()
        item_categories["business_id"] = item_categories["business_id"].astype(str)
        train_df["business_id"] = train_df["business_id"].astype(str)
        test_df["business_id"] = test_df["business_id"].astype(str)
        train_df = train_df.merge(item_categories, on="business_id", how="left")
        test_df = test_df.merge(item_categories, on="business_id", how="left")
    repeat_rate = float((ratings.groupby("user_id").size() >= 5).mean())
    metrics = _evaluate(train_df, test_df, catalog)
    report = {
        "dataset_type": "synthetic_bootstrap",
        "synthetic_augmented": True,
        "warning": "No representa usuarios reales; solo valida la capacidad del pipeline.",
        "seed": seed,
        "personas": personas,
        "ratings": int(len(ratings)),
        "repeat_user_rate_ge5": repeat_rate,
        "catalog_quality": quality,
        "metrics": metrics,
        "elapsed_seconds": round(time.time() - started, 2),
    }

    models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
    os.makedirs(models_dir, exist_ok=True)
    with open(os.path.join(models_dir, "bootstrap_metrics.json"), "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2, ensure_ascii=False)
    logger.info("Reporte bootstrap guardado en %s", os.path.join(models_dir, "bootstrap_metrics.json"))

    if promote:
        # Entrenamiento bootstrap reproducible sobre el catálogo local. Los
        # artefactos quedan acompañados por la marca synthetic_augmented y no
        # deben confundirse con métricas de usuarios reales.
        ratings.to_csv(os.path.join(models_dir, "synthetic_training_backup.csv"), index=False)
        from rf_model import SmarturContextModel
        rf = SmarturContextModel()
        # RF hace su propio merge con el catálogo; quitar la copia de
        # categories evita que pandas la renombre a categories_user y rompe
        # el extractor de features. LightFM sí recibe la columna completa.
        rf_train_df = train_df.drop(columns=["categories"], errors="ignore")
        rf.train(rf_train_df, dynamic_override=True)
        try:
            from lightfm_model import SmarturLightFMModel
            lfm = SmarturLightFMModel()
            lfm.train(train_df, catalog)
        except Exception as exc:
            logger.warning("LightFM no pudo entrenarse en bootstrap: %s", exc)
        with open(os.path.join(models_dir, "training_manifest.json"), "w", encoding="utf-8") as fh:
            json.dump({
                "dataset_type": "synthetic_bootstrap",
                "synthetic_augmented": True,
                "seed": seed,
                "personas": personas,
                "catalog_items": quality["items"],
                "warning": "Reentrenar con datos reales antes de interpretar eficacia.",
            }, fh, indent=2, ensure_ascii=False)
        logger.warning(
            "Bootstrap promovido como dataset de entrenamiento. Mantener "
            "SMARTUR_SYNTH_TRAINING activo hasta que existan datos reales."
        )
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--personas", type=int, default=2500)
    parser.add_argument("--seed", type=int, default=RANDOM_STATE)
    parser.add_argument("--promote", action="store_true")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    print(json.dumps(run(args.personas, args.promote, args.seed), indent=2, ensure_ascii=False))
