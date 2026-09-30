"""Adaptador de catálogo para el recomendador de SMARTUR.

El ranking de producción usa PreferenceContextModel, KNN-CF y TF-IDF. Este
módulo conserva únicamente la normalización de POIs y las columnas de catálogo
que necesita el pipeline; no entrena ni carga un Random Forest.
"""
from __future__ import annotations

import os
import numpy as np
import pandas as pd

from context_encoder import MAPEO_CATEGORIAS

_DIR = os.path.dirname(os.path.abspath(__file__))
_DATA = os.path.join(_DIR, "..", "data")
_MODELS = os.path.join(_DIR, "..", "models")
TOP_N_CATEGORIES = 15
TOURISM_ANCHOR_CATEGORIES = [
    "Parks", "Hiking", "Museums", "Hotels", "Hotels & Travel",
    "Arts & Entertainment", "Active Life", "Tours",
    "Landmarks & Historical Buildings", "Bed & Breakfast", "Campgrounds",
    "Zoos", "Botanical Gardens", "nature", "culture", "gastronomy", "park",
    "viewpoint", "waterfall", "volcano", "mountain", "hacienda", "cathedral",
    "sanctuary", "market", "museum", "history", "monument", "zocalo",
    "botanical garden",
]


class CatalogContext:
    """Normaliza el catálogo sin construir un modelo predictivo legacy."""

    is_fitted = True

    def __init__(self, business_path=None, data_source="mexico"):
        if business_path is None:
            name = "data_negocios_mexico.csv" if data_source == "mexico" else "data_negocios_limpio.csv"
            business_path = os.path.join(_DATA, name)
        self.df_biz = pd.read_csv(business_path)
        self.top_categories = []
        self.cat_features = []
        self.features = []
        self._local_defaults = {
            "review_count": 10,
            "is_open": 1,
            "is_good_for_kids": 0,
            "is_romantic": 0,
        }
        self._extract_top_categories(self.df_biz)

    def _extract_top_categories(self, df):
        if "categories" not in df.columns:
            self.top_categories = list(TOURISM_ANCHOR_CATEGORIES)
        else:
            cats = df["categories"].dropna().str.split(",").explode().str.strip()
            top = cats.value_counts().head(TOP_N_CATEGORIES).index.tolist()
            present = set(top)
            self.top_categories = top + [c for c in TOURISM_ANCHOR_CATEGORIES if c not in present]
        self.cat_features = [f"cat_{c}" for c in self.top_categories]

    def _add_category_features(self, df):
        result = df.copy()
        if "review_count" in result.columns:
            result["review_count"] = np.log1p(result["review_count"].fillna(0))
        categories = result["categories"].fillna("") if "categories" in result.columns else pd.Series("", index=result.index)
        for cat in self.top_categories:
            result[f"cat_{cat}"] = categories.str.contains(cat, case=False, regex=False).astype(int)
        for col in ("review_count", "is_open", "price_level", "is_accessible", "outdoor", "is_good_for_kids", "is_romantic", "dist_km"):
            if col not in result.columns:
                result[col] = 0
        return result

    def prepare_local_items(self, poi_df):
        if poi_df is None or poi_df.empty:
            return pd.DataFrame(columns=self.df_biz.columns)
        df = poi_df.copy()
        df["business_id"] = df.apply(
            lambda r: str(r["id"]) if str(r["id"]).startswith("svc_") else f"poi_{r['id']}", axis=1
        )
        df["name"] = df["name"].fillna("Local POI")

        def join_categories(row):
            parts = []
            raw = row.get("categories_raw")
            if isinstance(raw, str) and raw.strip():
                parts.append(raw.strip())
            mapped = row.get("categories_mapped", [])
            if isinstance(mapped, list) and mapped:
                parts.extend(mapped)
            return ",".join(parts)

        df["categories"] = df.apply(join_categories, axis=1)
        if "description" not in df.columns:
            df["description"] = ""
        df["description"] = df["description"].fillna("")
        for col, default in (("price_level", 2), ("is_accessible", 0), ("outdoor", 0), ("latitude", 0), ("longitude", 0)):
            if col not in df.columns:
                df[col] = default
        df["price_level"] = df["price_level"].fillna(2).astype(int)
        df["is_accessible"] = df["is_accessible"].fillna(0).astype(int)
        df["outdoor"] = df["outdoor"].fillna(0).astype(int)
        df["latitude"] = df["latitude"].fillna(18.85).astype(float)
        df["longitude"] = df["longitude"].fillna(-96.95).astype(float)
        for col, default in self._local_defaults.items():
            if col not in df.columns:
                df[col] = default
            df[col] = df[col].fillna(default)
        return df

    # Compatibilidad con endpoints antiguos: el score contextual real lo
    # produce PreferenceContextModel. Estos métodos ya no entrenan RF.
    def load(self, *args, **kwargs):
        return True

    def train(self, *args, **kwargs):
        return self

    def predict_with_context(self, business_ids, **kwargs):
        return np.full(len(business_ids), 3.0, dtype=float)

    def predict_context(self, business_ids, **kwargs):
        return self.predict_with_context(business_ids, **kwargs)

