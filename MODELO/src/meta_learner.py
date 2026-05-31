"""
SMARTUR Meta-Learner v1 — Stacked Generalization for Blend Weights.

En lugar de pesos fijos por tipo de ítem, un modelo de stacking
aprende directamente la función f(pred_cf, pred_rf, ..., user_features) → rating.

Arquitectura:
  Level 0: CF, RF, LightFM, ContentModel, GBM (predictions como features)
  Level 1: HistGradientBoostingRegressor (meta-modelo)

Entrenamiento: nightly en _run_full_training(), sample de engine.test_data.
Inferencia: predict_score() → score final sin weights manuales.
"""

import json
import os
import joblib
import numpy as np
import pandas as pd
from typing import Optional, Tuple, List
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_squared_error
from math import sqrt

from cf import predict_cf_pearson
from context_encoder import MAPEO_CATEGORIAS

_DIR = os.path.dirname(os.path.abspath(__file__))
_MODELS = os.path.join(_DIR, '..', 'models')

_ITEM_TYPES = ['cultural', 'food', 'lodging', 'nature', 'adventure', 'generic']


def _classify_item_type(categories: str) -> str:
    c = categories.lower() if categories else ''
    if any(k in c for k in ['museum', 'monument', 'history', 'cathedral', 'sanctuary',
                            'art', 'cultural', 'zocalo', 'plaza', 'teatro', 'mural',
                            'religion', 'architecture', 'ruinas']):
        return 'cultural'
    if any(k in c for k in ['restaurant', 'food', 'cafe', 'gastronomy', 'market',
                            'bakery', 'coffee', 'bar', 'dining', 'mariscos',
                            'antojitos', 'taco', 'mole', 'tamal']):
        return 'food'
    if any(k in c for k in ['hotel', 'bed & breakfast', 'hostel', 'inn', 'lodge',
                            'cabaña', 'campground', 'accommodation', 'guest']):
        return 'lodging'
    if any(k in c for k in ['park', 'waterfall', 'nature', 'botanical', 'viewpoint',
                            'mountain', 'volcano', 'river', 'lake', 'laguna',
                            'cascada', 'mirador', 'ecoturismo', 'selva', 'rio']):
        return 'nature'
    if any(k in c for k in ['hiking', 'adventure', 'rafting', 'canopy', 'rapel',
                            'tirolesa', 'senderismo', 'ciclismo', 'kayak',
                            'camping', 'espeleologia']):
        return 'adventure'
    return 'generic'


def _extract_item_type_ohe(item_type: str) -> List[float]:
    return [1.0 if t == item_type else 0.0 for t in _ITEM_TYPES]


class MetaBlender:
    """Stacked meta-learner for blend weights.

    Train: collects base model predictions + features, fits HGBR → rating.
    Predict: given user + item_ids + model predictions, outputs final score.
    """

    def __init__(self) -> None:
        self.model: Optional[HistGradientBoostingRegressor] = None
        self.is_fitted = False
        self.feature_names: List[str] = []

    def _build_training_data(
        self,
        engine,
        rf_model,
        lightfm_model=None,
        content_model=None,
        gbm_model=None,
        sample_size: int = 800,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Sample test rows, compute all base model predictions + features."""

        n_eval = min(sample_size, len(engine.test_data))
        test_sample = engine.test_data.sample(n_eval, random_state=42)

        rows = []
        for _, row in test_sample.iterrows():
            uid = row['user_id']
            bid = row['business_id']
            try:
                p_cf = predict_cf_pearson(uid, bid, engine)
                if np.isnan(p_cf):
                    continue
            except Exception:
                continue

            ctx = {'tiposTurismo': [], 'presupuesto_bucket': 'medio',
                   'group_type': 'solo', 'edad_range': '25-34'}
            try:
                p_rf = float(rf_model.predict_with_context([bid], user_context=ctx)[0])
                if np.isnan(p_rf):
                    continue
            except Exception:
                continue

            p_gbm = p_rf
            if gbm_model is not None and getattr(gbm_model, 'is_fitted', False):
                try:
                    p_gbm = float(gbm_model.predict_with_context([bid], user_context=ctx)[0])
                except Exception:
                    pass

            p_lfm = p_rf
            if lightfm_model is not None and getattr(lightfm_model, 'is_fitted', False):
                try:
                    p_lfm = float(lightfm_model.predict(str(uid), [bid], user_context=ctx)[0])
                except Exception:
                    pass

            p_cm = 3.0
            if content_model is not None and getattr(content_model, 'is_fitted', False):
                try:
                    p_cm = float(content_model.predict_with_context([bid], user_context=ctx)[0])
                except Exception:
                    pass

            cats = ''
            if hasattr(rf_model, 'df_biz') and rf_model.df_biz is not None:
                biz_row = rf_model.df_biz[rf_model.df_biz['business_id'] == bid]
                if not biz_row.empty:
                    cats = str(biz_row.iloc[0].get('categories', '') or '')

            item_type = _classify_item_type(cats)
            type_ohe = _extract_item_type_ohe(item_type)

            u_rating_count = int((engine.train_data['user_id'] == uid).sum()) if engine.train_data is not None else 0
            i_rating_count = int((engine.train_data['business_id'] == bid).sum()) if engine.train_data is not None else 0

            rows.append({
                'pred_cf': p_cf, 'pred_rf': p_rf, 'pred_lfm': p_lfm,
                'pred_cm': p_cm, 'pred_gbm': p_gbm,
                'type_cultural': type_ohe[0], 'type_food': type_ohe[1],
                'type_lodging': type_ohe[2], 'type_nature': type_ohe[3],
                'type_adventure': type_ohe[4], 'type_generic': type_ohe[5],
                'u_rating_count': np.log1p(u_rating_count),
                'i_rating_count': np.log1p(i_rating_count),
                'actual': row['stars'],
            })

        if len(rows) < 50:
            return np.array([]), np.array([])

        df = pd.DataFrame(rows)
        self.feature_names = [c for c in df.columns if c != 'actual']
        X = df[self.feature_names].fillna(0).values
        y = df['actual'].values
        return X, y

    def train(self, engine, rf_model, lightfm_model=None,
              content_model=None, gbm_model=None, sample_size: int = 800) -> None:
        """Fit the meta-learner on test data."""
        X, y = self._build_training_data(
            engine, rf_model, lightfm_model, content_model, gbm_model, sample_size
        )
        if len(X) < 50:
            print("[MetaBlender] Datos insuficientes para entrenar.")
            return

        self.model = HistGradientBoostingRegressor(
            max_iter=200, max_depth=3, learning_rate=0.1,
            min_samples_leaf=20, random_state=42, early_stopping=False,
        )
        self.model.fit(X, y)
        self.is_fitted = True

        train_preds = self.model.predict(X)
        rmse = sqrt(mean_squared_error(y, train_preds))
        print(f"[MetaBlender] Entrenado: {len(X)} muestras, RMSE={rmse:.4f}")

    def predict_score(
        self,
        pred_cf: float, pred_rf: float, pred_lfm: float,
        pred_cm: float, pred_gbm: float,
        item_type: str = 'generic',
        u_rating_count: int = 0,
        i_rating_count: int = 0,
    ) -> float:
        """Predict final score from base model predictions + features."""
        if not self.is_fitted or self.model is None:
            return 0.0

        type_ohe = _extract_item_type_ohe(item_type)
        feat = np.array([[
            pred_cf, pred_rf, pred_lfm, pred_cm, pred_gbm,
            type_ohe[0], type_ohe[1], type_ohe[2], type_ohe[3],
            type_ohe[4], type_ohe[5],
            np.log1p(u_rating_count), np.log1p(i_rating_count),
        ]])
        return float(np.clip(self.model.predict(feat)[0], 1.0, 5.0))

    def save(self, path: Optional[str] = None) -> None:
        if path is None:
            path = os.path.join(_MODELS, 'meta_blender.joblib')
        if not self.is_fitted:
            return
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump({'model': self.model, 'feature_names': self.feature_names}, path)
        print(f"[MetaBlender] Guardado en {path}")

    def load(self, path: Optional[str] = None) -> bool:
        if path is None:
            path = os.path.join(_MODELS, 'meta_blender.joblib')
        if not os.path.exists(path):
            return False
        data = joblib.load(path)
        self.model = data['model']
        self.feature_names = data.get('feature_names', [])
        self.is_fitted = True
        print("[MetaBlender] Cargado desde disco.")
        return True
