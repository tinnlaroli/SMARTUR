"""Modelo ML contextual para ordenar lugares según preferencias declaradas.

Este modelo aprende una relación entre el contexto que el usuario declara y
los atributos del lugar. No usa el identificador del usuario ni su historial,
por lo que sirve para cold-start. El filtrado colaborativo (KNN/SVD) permanece
separado y se activa únicamente cuando existe evidencia de usuarios similares.
"""
from __future__ import annotations

import os
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor

from context_encoder import MAPEO_CATEGORIAS, TOURISM_TYPES


_MODELS = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
MODEL_PATH = os.path.join(_MODELS, "preference_context_model.joblib")


class PreferenceContextModel:
    """Regresor ML pequeño para puntuación contextual de lugares (1..5)."""

    VERSION = 1

    def __init__(self):
        self.model = HistGradientBoostingRegressor(
            max_iter=150,
            max_leaf_nodes=15,
            learning_rate=0.06,
            l2_regularization=1.0,
            random_state=42,
        )
        self.feature_names: list[str] = []
        self.is_fitted = False

    @staticmethod
    def _item_type_flags(categories: Any) -> dict[str, int]:
        text = str(categories or "").lower()
        return {
            t: int(any(str(keyword).lower() in text for keyword in keywords))
            for t, keywords in MAPEO_CATEGORIAS.items()
        }

    @staticmethod
    def _budget_value(context: dict[str, Any]) -> float:
        value = context.get("presupuesto_bucket", context.get("budget", 2))
        if isinstance(value, str):
            return {"bajo": 1, "medio": 2, "alto": 3, "premium": 4}.get(
                value.strip().lower(), 2
            )
        try:
            return float(np.clip(float(value), 1, 4))
        except (TypeError, ValueError):
            return 2.0

    @classmethod
    def _context_types(cls, context: dict[str, Any]) -> set[str]:
        values = context.get("tiposTurismo", context.get("top_type", []))
        if isinstance(values, str):
            values = [values]
        return {str(v).strip().lower() for v in (values or [])}

    @classmethod
    def _features(cls, catalog: pd.DataFrame, contexts: pd.DataFrame) -> pd.DataFrame:
        """Construye features sin usar user_id como predictor."""
        rows: list[dict[str, float]] = []
        for _, row in catalog.reset_index(drop=True).iterrows():
            item_types = cls._item_type_flags(row.get("categories", ""))
            context = row.get("_context", {}) or {}
            user_types = cls._context_types(context)
            budget = cls._budget_value(context)
            try:
                price = float(row.get("price_level", 2) or 2)
            except (TypeError, ValueError):
                price = 2.0
            feature: dict[str, float] = {}
            for tourism_type in TOURISM_TYPES:
                feature[f"user_{tourism_type}"] = float(tourism_type in user_types)
                feature[f"item_{tourism_type}"] = float(item_types[tourism_type])
                feature[f"match_{tourism_type}"] = (
                    feature[f"user_{tourism_type}"] * feature[f"item_{tourism_type}"]
                )
            feature["user_budget"] = budget
            feature["item_price"] = price
            feature["budget_delta"] = abs(budget - price)
            feature["budget_fit"] = max(0.0, 1.0 - feature["budget_delta"] / 3.0)
            for key in ("group_type", "wants_tours", "needs_hotel", "pref_food", "pref_outdoor", "requiere_accesibilidad"):
                value = context.get(key, context.get({
                    "wants_tours": "wants_tours",
                    "needs_hotel": "needs_hotel",
                    "pref_food": "pref_food",
                    "pref_outdoor": "pref_outdoor",
                    "requiere_accesibilidad": "requiere_accesibilidad",
                }.get(key, key), False))
                if key == "group_type":
                    for group in ("solo", "pareja", "familia", "amigos"):
                        feature[f"group_{group}"] = float(str(value).lower() == group)
                else:
                    feature[f"context_{key}"] = float(bool(value))
            rows.append(feature)
        result = pd.DataFrame(rows).fillna(0.0)
        return result

    @classmethod
    def _context_for_user(cls, contexts: pd.DataFrame, user_id: Any) -> dict[str, Any]:
        row = contexts[contexts["user_id"].astype(str) == str(user_id)]
        if row.empty:
            return {}
        data = row.iloc[0].to_dict()
        return {k: v for k, v in data.items() if k != "user_id" and pd.notna(v)}

    def fit(self, ratings: pd.DataFrame, contexts: pd.DataFrame, catalog: pd.DataFrame) -> "PreferenceContextModel":
        rows = ratings.copy()
        rows["business_id"] = rows["business_id"].astype(str)
        catalog = catalog.copy()
        catalog["business_id"] = catalog["business_id"].astype(str)
        item = catalog.set_index("business_id")
        feature_rows = []
        targets = []
        for _, rating in rows.iterrows():
            if rating["business_id"] not in item.index:
                continue
            record = item.loc[rating["business_id"]].to_dict()
            record["_context"] = self._context_for_user(contexts, rating["user_id"])
            feature_rows.append(record)
            targets.append(float(rating["stars"]))
        if not feature_rows:
            raise ValueError("No hay interacciones compatibles con el catálogo para entrenar PreferenceContextModel")
        X = self._features(pd.DataFrame(feature_rows), pd.DataFrame())
        self.feature_names = X.columns.tolist()
        self.model.fit(X[self.feature_names], np.asarray(targets))
        self.is_fitted = True
        return self

    def predict(self, catalog: pd.DataFrame, context: dict[str, Any] | None = None) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("PreferenceContextModel no está entrenado")
        rows = catalog.copy()
        rows["_context"] = [context or {}] * len(rows)
        X = self._features(rows, pd.DataFrame())
        for name in self.feature_names:
            if name not in X:
                X[name] = 0.0
        return np.clip(self.model.predict(X[self.feature_names]), 1.0, 5.0)

    def save(self, path: str = MODEL_PATH) -> str:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump({"version": self.VERSION, "model": self}, path)
        return path

    def load(self, path: str = MODEL_PATH) -> bool:
        if not os.path.exists(path):
            return False
        payload = joblib.load(path)
        loaded = payload.get("model", payload) if isinstance(payload, dict) else payload
        self.__dict__.update(loaded.__dict__)
        return bool(self.is_fitted)
