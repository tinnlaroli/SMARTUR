"""
Tercer algoritmo ML: Gradient Boosting contextual (mismas features que RF).
Complementa CF+KNN y Random Forest en la comparativa de modelos.
"""
import json
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor

from rf_model import SmarturContextModel, _DATA, _MODELS, _compute_dist_km


class SmarturGbmModel(SmarturContextModel):
    """Gradient Boosting Regressor sobre vector [Item + User + Match]."""

    def __init__(self, business_path=None):
        super().__init__(business_path=business_path)
        self.model = GradientBoostingRegressor(
            n_estimators=150,
            max_depth=6,
            learning_rate=0.08,
            min_samples_leaf=8,
            subsample=0.85,
            random_state=42,
        )

    def train(self, reviews_df, df_biz_extra=None):
        if df_biz_extra is not None:
            biz_ids_extra = df_biz_extra['business_id'].unique()
            self.df_biz = pd.concat([
                self.df_biz[~self.df_biz['business_id'].isin(biz_ids_extra)],
                df_biz_extra
            ], ignore_index=True)
            print(f"[GBM] Añadidos {len(df_biz_extra)} negocios extra (Rest-Mex)")
        train_df = reviews_df.merge(self.df_biz, on='business_id', suffixes=('_user', '_biz'))
        self._extract_top_categories(train_df)

        # Compute geographic distance from Altas Montañas center (proxy for training data)
        train_df['dist_km'] = _compute_dist_km(train_df)

        train_df = self._add_category_features(train_df)
        train_df = self._simulate_user_contexts(train_df)

        self.features = self.numeric_features + self.cat_features + self.encoder.all_context_feature_names
        X = train_df[self.features].fillna(0)
        y = train_df['stars_user']

        print(
            f"GBM contextual: entrenando sobre {X.shape[0]} interacciones "
            f"con {X.shape[1]} variables."
        )
        self.model.fit(X, y)

        # ── Feature importances ────────────────────────────────────────────
        fi = pd.DataFrame({
            'feature': self.features,
            'importance': self.model.feature_importances_,
        }).sort_values('importance', ascending=False)
        fi.to_json(os.path.join(_MODELS, 'gbm_feature_importances.json'), orient='records', indent=2)

        # ── Hyperparameters ────────────────────────────────────────────────
        hp = {k: str(v) for k, v in self.model.get_params().items()}
        with open(os.path.join(_MODELS, 'gbm_hyperparams.json'), 'w') as _f:
            json.dump(hp, _f, indent=2)
        print(f"[GBM] Feature importances + hyperparams guardados. Top: {fi.head(1)['feature'].values[0]}")

        os.makedirs(_MODELS, exist_ok=True)
        joblib.dump(
            {
                'model': self.model,
                'top_categories': self.top_categories,
                'features': self.features,
            },
            os.path.join(_MODELS, 'gbm_context_yelp.joblib'),
        )
        self.is_fitted = True
        print("Gradient Boosting contextual entrenado y guardado.")

    def load(self, model_path=None):
        if model_path is None:
            model_path = os.path.join(_MODELS, 'gbm_context_yelp.joblib')
        if os.path.exists(model_path):
            data = joblib.load(model_path)
            self.model = data['model']
            self.top_categories = data['top_categories']
            self.features = data['features']
            self.is_fitted = True
            self.cat_features = [f'cat_{c}' for c in self.top_categories]
            print("Gradient Boosting contextual cargado desde disco.")
            return True
        return False
