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
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split

from engine import SmarturEngine
from synthetic_training import build_synthetic_ratings
from synthetic_persona_validation import RANDOM_STATE, TOURISM_TYPES, generate_personas
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


def _synthetic_contexts(personas):
    """Contexto declarado de cada persona, separado de sus ratings."""
    contexts = personas.copy()
    affinity_cols = [f"aff_{t}" for t in TOURISM_TYPES]
    contexts["top_type"] = contexts[affinity_cols].idxmax(axis=1).str.replace(
        "aff_", "", regex=False
    )
    contexts["presupuesto_bucket"] = contexts["budget"].map(
        {1: "bajo", 2: "medio", 3: "alto", 4: "premium"}
    )
    contexts["tiposTurismo"] = contexts["top_type"].map(lambda value: [value])
    return contexts[["persona_id", "presupuesto_bucket", "tiposTurismo"]].rename(
        columns={"persona_id": "user_id"}
    )


def _preference_ml_metrics(train_df, test_df, catalog, contexts):
    from sklearn.metrics import mean_absolute_error, mean_squared_error
    from preference_model import PreferenceContextModel

    model = PreferenceContextModel().fit(train_df, contexts, catalog)
    item_catalog = catalog.copy()
    item_catalog["business_id"] = item_catalog["business_id"].astype(str)
    item_catalog = item_catalog.set_index("business_id")
    test_rows = test_df[test_df["business_id"].astype(str).isin(item_catalog.index)].copy()
    predictions = []
    for _, rating in test_rows.iterrows():
        item = item_catalog.loc[str(rating["business_id"])].to_dict()
        item["business_id"] = str(rating["business_id"])
        context = model._context_for_user(contexts, rating["user_id"])
        predictions.append(float(model.predict(pd.DataFrame([item]), context)[0]))
    actual = test_rows["stars"].to_numpy(dtype=float)
    pred = np.asarray(predictions, dtype=float)
    return model, {
        "rmse": float(np.sqrt(mean_squared_error(actual, pred))),
        "mae": float(mean_absolute_error(actual, pred)),
        "n_test": int(len(actual)),
        "algorithm": "hist_gradient_boosting_preference_context",
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
    persona_rows = generate_personas(personas, seed=seed)
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
    contexts = _synthetic_contexts(persona_rows)
    preference_model, preference_metrics = _preference_ml_metrics(
        train_df, test_df, catalog, contexts
    )
    metrics["preference_context_ml"] = preference_metrics
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
        preference_model.save(os.path.join(models_dir, "preference_context_model.joblib"))
        # RF y LightFM históricos quedan disponibles como fallback/estudio,
        # pero no se vuelven a entrenar por defecto: el benchmark mostró que
        # no mejoran al modelo contextual y solo aumentan tiempo y memoria.
        if os.environ.get("SMARTUR_TRAIN_LEGACY_MODELS", "").lower() in {"1", "true", "yes"}:
            from rf_model import SmarturContextModel
            rf = SmarturContextModel()
            rf_train_df = train_df.drop(columns=["categories"], errors="ignore")
            rf.train(rf_train_df, dynamic_override=True)
            try:
                from lightfm_model import SmarturLightFMModel
                lfm = SmarturLightFMModel()
                lfm.train(train_df, catalog)
            except Exception as exc:
                logger.warning("LightFM no pudo entrenarse en bootstrap: %s", exc)
        else:
            logger.info("RF/LightFM legacy omitidos; usar SMARTUR_TRAIN_LEGACY_MODELS=1 para auditoría")
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
