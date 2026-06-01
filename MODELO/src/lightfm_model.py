"""
SMARTUR LightFM Model — Factorización Matricial con side features (WARP loss).

Por qué LightFM resuelve el cold-start de SMARTUR:
  - Todos los usuarios reales son cold-start en CF (IDs enteros vs. UUIDs Yelp)
  - LightFM aprende embeddings TANTO de ítems como de sus features (categorías, precio...)
  - Para un usuario nuevo, predice con sus features de perfil (tiposTurismo, grupo, etc.)
    sin necesitar historial de interacciones

Pérdida WARP (Weighted Approximate-Rank Pairwise):
  Optimiza directamente la calidad del ranking (NDCG), mejor que MSE para listas Top-N.
"""

import os
import re
import logging
import numpy as np
import pandas as pd
import joblib

_DIR = os.path.dirname(os.path.abspath(__file__))
_MODELS = os.path.join(_DIR, '..', 'models')
_logger = logging.getLogger('smartur-api')

# ── Feature definitions ──────────────────────────────────────────────────────

USER_FEATURE_NAMES = [
    'uf:tur_naturaleza', 'uf:tur_aventura', 'uf:tur_gastronomico',
    'uf:tur_cultural', 'uf:tur_rural',
    'uf:group_solo', 'uf:group_pareja', 'uf:group_familia', 'uf:group_amigos',
    'uf:budget_1', 'uf:budget_2', 'uf:budget_3', 'uf:budget_4',
    'uf:wants_accessibility', 'uf:pref_outdoor',
    'uf:wants_tours', 'uf:needs_hotel', 'uf:pref_food',
]

ITEM_FEATURE_NAMES = [
    'if:price_1', 'if:price_2', 'if:price_3', 'if:price_4',
    'if:is_accessible', 'if:outdoor', 'if:is_good_for_kids', 'if:is_romantic',
    'if:cat_nature', 'if:cat_culture', 'if:cat_gastronomy',
    'if:cat_adventure', 'if:cat_rural',
    'if:cat_waterfall', 'if:cat_volcano', 'if:cat_museum',
    'if:cat_park', 'if:cat_hiking',
    'if:cat_hotel', 'if:cat_restaurant', 'if:cat_tours',
]

_TOURISM_PATTERNS = {
    'naturaleza': r'park|hiking|nature|waterfall|volcano|mountain|viewpoint|botanical',
    'aventura':   r'adventure|hiking|active life|rafting|mountain biking|volcano',
    'gastronomico': r'restaurant|food|caf[eé]|gastronomy|market|local food',
    'cultural':   r'museum|culture|history|hacienda|monument|cathedral|sanctuary|architecture',
    'rural':      r'rural|hacienda|bed & breakfast|campground|farm',
}

_ITEM_CAT_PATTERNS = {
    'cat_nature':     r'nature|park|hiking|waterfall|volcano|mountain|viewpoint|outdoor',
    'cat_culture':    r'culture|museum|history|hacienda|monument|cathedral|sanctuary',
    'cat_gastronomy': r'gastronomy|restaurant|food|market|local food',
    'cat_adventure':  r'adventure|hiking|active|rafting|mountain biking',
    'cat_rural':      r'rural|hacienda|bed & breakfast|campground',
    'cat_waterfall':  r'waterfall|cascad',
    'cat_volcano':    r'volcano',
    'cat_museum':     r'museum',
    'cat_park':       r'\bpark\b|parque',
    'cat_hiking':     r'hiking|senderismo',
    'cat_hotel':      r'hotel|accommodation|hostel',
    'cat_restaurant': r'restaurant|food|caf[eé]|gastronomy',
    'cat_tours':      r'tours?\b|excursion',
}

_BUDGET_MAP = {'bajo': 1, 'medio': 2, 'alto': 3, 'premium': 4}


# ── Feature builders (module-level, reused in train + inference) ─────────────

def context_to_user_features(context: dict) -> list:
    """
    Converts a context dict (from mobile form or traveler profile) to a list of
    active LightFM user feature tags (e.g. ['uf:tur_naturaleza', 'uf:budget_2']).
    """
    if not context:
        return ['uf:budget_2', 'uf:group_amigos', 'uf:pref_food']

    active = []

    # Tourism types (multi-hot)
    tipos = context.get('tiposTurismo', [])
    if isinstance(tipos, str):
        tipos = [tipos]
    for t in ['naturaleza', 'aventura', 'gastronomico', 'cultural', 'rural']:
        if t in tipos:
            active.append(f'uf:tur_{t}')

    # Group type (one-hot)
    gtype = str(context.get('group_type', 'amigos')).lower().strip()
    matched_group = False
    for g in ['solo', 'pareja', 'familia', 'amigos']:
        if g == gtype:
            active.append(f'uf:group_{g}')
            matched_group = True
            break
    if not matched_group:
        active.append('uf:group_amigos')

    # Budget (one-hot)
    braw = str(context.get('presupuesto_bucket', 'medio')).lower().strip()
    b = _BUDGET_MAP.get(braw, 2)
    active.append(f'uf:budget_{b}')

    # Boolean preferences
    if context.get('requiere_accesibilidad', False):
        active.append('uf:wants_accessibility')
    if context.get('pref_outdoor', False):
        active.append('uf:pref_outdoor')
    if context.get('wants_tours', False):
        active.append('uf:wants_tours')
    if context.get('needs_hotel', False):
        active.append('uf:needs_hotel')
    if context.get('pref_food', True):
        active.append('uf:pref_food')

    return active if active else ['uf:budget_2', 'uf:group_amigos']


def biz_row_to_item_features(row) -> list:
    """
    Converts a business row (dict or pandas Series) to a list of active
    LightFM item feature tags.
    """
    if hasattr(row, 'to_dict'):
        row = row.to_dict()

    active = []

    # Price level (one-hot)
    price = max(1, min(4, int(row.get('price_level', 2) or 2)))
    active.append(f'if:price_{price}')

    # Binary attributes
    for attr in ['is_accessible', 'outdoor', 'is_good_for_kids', 'is_romantic']:
        if int(row.get(attr, 0) or 0):
            active.append(f'if:{attr}')

    # Category flags
    cats = str(row.get('categories', '') or '').lower()
    for feat, pattern in _ITEM_CAT_PATTERNS.items():
        if re.search(pattern, cats):
            active.append(f'if:{feat}')

    return active if active else ['if:price_2']


# ── Main class ───────────────────────────────────────────────────────────────

class SmarturLightFMModel:
    """
    LightFM with WARP loss. Supports cold-start users via feature embeddings.

    Training data:  Yelp CSV reviews + optional real SMARTUR interactions
    User features:  tiposTurismo, grupo, presupuesto, prefs booleanas
    Item features:  categorías, precio, accesibilidad, outdoor, kids, romantic
    Cold-start:     predice con embeddings de features del perfil del usuario
                    (no necesita historial de ratings)
    """

    def __init__(self):
        self._model = None
        self._dataset = None
        self._item_features_matrix = None   # scipy sparse (n_items, n_item_features)
        self._user_features_matrix = None   # scipy sparse (n_users, n_user_features)
        self._known_users: set = set()
        self._known_items: set = set()
        self.is_fitted: bool = False

    # ── Training ─────────────────────────────────────────────────────────────

    def train(self, reviews_df: pd.DataFrame, biz_df: pd.DataFrame) -> bool:
        """
        Trains LightFM.

        Args:
            reviews_df: DataFrame with [user_id, business_id, stars]
            biz_df:     DataFrame with [business_id, categories, price_level, ...]
                        Can also have 'id' column (local POIs).
        Returns:
            True on success, False if lightfm is not installed.
        """
        try:
            from lightfm import LightFM
            from lightfm.data import Dataset
        except ImportError:
            _logger.error("[LightFM] Librería no instalada. Ejecutar: pip install 'lightfm>=1.17'")
            return False

        _logger.info("[LightFM] Iniciando entrenamiento...")

        # Normalize IDs to str
        rev = reviews_df.copy()
        rev['user_id'] = rev['user_id'].astype(str)
        rev['business_id'] = rev['business_id'].astype(str)

        # Use only ratings >= 3.5 as positive interactions (implicit feedback)
        pos_rev = rev[rev['stars'].astype(float) >= 3.5]
        if len(pos_rev) == 0:
            _logger.warning("[LightFM] No hay interacciones positivas (stars >= 3.5). Abortando.")
            return False

        user_ids = rev['user_id'].unique().tolist()
        item_ids = rev['business_id'].unique().tolist()

        _logger.info(f"[LightFM] Dataset: {len(user_ids)} usuarios, {len(item_ids)} ítems, "
                     f"{len(pos_rev)} interacciones positivas")

        # ── Build LightFM Dataset ────────────────────────────────────────────
        dataset = Dataset()
        dataset.fit(
            users=user_ids,
            items=item_ids,
            user_features=USER_FEATURE_NAMES,
            item_features=ITEM_FEATURE_NAMES,
        )

        # Interactions matrix (weighted by stars)
        interactions, weights = dataset.build_interactions([
            (r['user_id'], r['business_id'], float(r['stars']))
            for _, r in pos_rev.iterrows()
        ])

        # ── User features (inferred from liked items) ────────────────────────
        _logger.info("[LightFM] Construyendo features de usuario...")
        user_features_list = self._build_training_user_features(rev)
        user_features_matrix = dataset.build_user_features(user_features_list)

        # ── Item features ────────────────────────────────────────────────────
        _logger.info("[LightFM] Construyendo features de ítem...")
        biz_lookup = self._build_biz_lookup(biz_df)
        item_features_list = [
            (iid, biz_row_to_item_features(biz_lookup.get(iid, {})))
            for iid in item_ids
        ]
        item_features_matrix = dataset.build_item_features(item_features_list)

        # ── Train ────────────────────────────────────────────────────────────
        model = LightFM(
            no_components=96,
            loss='warp',
            learning_rate=0.05,
            item_alpha=1e-6,
            user_alpha=1e-6,
            random_state=42,
        )

        n_epochs = 50
        _logger.info(f"[LightFM] Entrenando {n_epochs} epochs con pérdida WARP (96 componentes)...")
        model.fit(
            interactions,
            user_features=user_features_matrix,
            item_features=item_features_matrix,
            sample_weight=weights,
            epochs=n_epochs,
            num_threads=4,
            verbose=False,
        )

        self._model = model
        self._dataset = dataset
        self._item_features_matrix = item_features_matrix
        self._user_features_matrix = user_features_matrix
        self._known_users = set(user_ids)
        self._known_items = set(item_ids)
        self.is_fitted = True

        _logger.info(
            f"[LightFM] Listo: {n_epochs} epochs, loss=warp, "
            f"{interactions.shape[0]} usuarios, {interactions.shape[1]} ítems"
        )
        self.save()
        return True

    def _build_training_user_features(self, rev: pd.DataFrame) -> list:
        """
        Infers user feature vectors from their liked items.
        Fully vectorized via pandas groupby().any() — handles 60k+ users in seconds.
        """
        if 'categories' not in rev.columns:
            return [(uid, ['uf:budget_2', 'uf:group_amigos'])
                    for uid in rev['user_id'].unique()]

        cats   = rev['categories'].fillna('').str.lower()
        liked  = rev['stars'].astype(float) >= 4.0
        uids   = rev['user_id']

        # Vectorized: one groupby per feature (single pass through data per pattern)
        def _user_has(pattern):
            return (liked & cats.str.contains(pattern, regex=True, na=False)).groupby(uids).any()

        feat_series = {
            f'uf:tur_{t}': _user_has(p) for t, p in _TOURISM_PATTERNS.items()
        }
        feat_series['uf:pref_outdoor'] = _user_has(
            r'park|hiking|nature|outdoor|volcano|mountain')
        feat_series['uf:wants_tours']  = _user_has(r'tours?\b|excursion')
        feat_series['uf:pref_food']    = _user_has(r'restaurant|food|caf[eé]|gastronomy')

        all_uids = uids.unique()
        result = []
        for uid in all_uids:
            active = ['uf:group_amigos', 'uf:budget_2']  # stable defaults
            for feat, series in feat_series.items():
                if uid in series.index and series[uid]:
                    active.append(feat)
            result.append((uid, active))

        return result

    def _build_biz_lookup(self, biz_df: pd.DataFrame) -> dict:
        """Returns a {business_id_str -> row_dict} lookup."""
        if biz_df is None or biz_df.empty:
            return {}
        df = biz_df.copy()
        if 'business_id' not in df.columns and 'id' in df.columns:
            df['business_id'] = df['id'].astype(str)
        if 'business_id' in df.columns:
            df['business_id'] = df['business_id'].astype(str)
            return df.set_index('business_id').to_dict('index')
        return {}

    # ── Inference ────────────────────────────────────────────────────────────

    def predict(self, user_id: str, item_ids: list, user_context: dict = None) -> list:
        """
        Scores items for a user. Returns a list of scores ∈ [1, 5].

        - If user_context is supplied (real form data), always uses feature-based
          scoring — more accurate than the inferred training features.
        - Otherwise falls back to warm (trained embedding) for known users, or
          cold-start feature scoring for unknown users.
        """
        if not self.is_fitted or not item_ids:
            return [3.0] * len(item_ids)

        # When we have real context (from the mobile form), prefer it
        if user_context:
            return self._predict_with_context_features(item_ids, user_context)

        str_uid = str(user_id)
        if str_uid in self._known_users:
            return self._predict_warm(str_uid, item_ids)

        # Cold-start without context -> neutral scores based on item popularity
        return self._predict_cold_item_bias(item_ids)

    def _predict_warm(self, user_id: str, item_ids: list) -> list:
        """Prediction using trained user embedding (warm user)."""
        try:
            user_map, _, item_map, _ = self._dataset.mapping()
            uid_idx = user_map.get(user_id)
            if uid_idx is None:
                return self._predict_cold_item_bias(item_ids)

            scores = []
            for item_id in item_ids:
                iid_idx = item_map.get(str(item_id))
                if iid_idx is None:
                    scores.append(3.0)
                    continue
                raw = float(self._model.predict(
                    user_ids=np.array([uid_idx], dtype=np.int32),
                    item_ids=np.array([iid_idx], dtype=np.int32),
                    item_features=self._item_features_matrix,
                    user_features=self._user_features_matrix,
                    num_threads=1,
                )[0])
                scores.append(float(np.clip(raw * 2.0 + 3.0, 1.0, 5.0)))
            return scores
        except Exception as exc:
            _logger.warning(f"[LightFM] Warm predict error: {exc}")
            return self._predict_cold_item_bias(item_ids)

    def _predict_with_context_features(self, item_ids: list, user_context: dict) -> list:
        """
        Cold-start-aware scoring using LightFM's learned feature embeddings.

        Manually computes:
          score = user_feature_bias + item_bias + item_feature_bias
                + dot(user_feature_emb, item_emb + item_feature_emb)

        This is the correct LightFM prediction formula when the user's embedding
        comes purely from their feature vector (no identity embedding).
        """
        try:
            _, uf_map, item_map, _ = self._dataset.mapping()
            n_users = len(self._known_users)
            n_items = len(self._known_items)

            # Active user feature column indices (offset by n_users in embedding matrix)
            user_feat_tags = context_to_user_features(user_context)
            uf_col_indices = [uf_map[tag] for tag in user_feat_tags if tag in uf_map]

            if uf_col_indices:
                uf_embed_idx = [n_users + c for c in uf_col_indices]
                user_repr = np.sum(self._model.user_embeddings[uf_embed_idx], axis=0)
                user_bias = float(np.sum(self._model.user_biases[uf_embed_idx]))
            else:
                user_repr = np.zeros(self._model.no_components)
                user_bias = 0.0

            scores = []
            for item_id in item_ids:
                iid_idx = item_map.get(str(item_id))
                if iid_idx is None:
                    scores.append(3.0)
                    continue

                # Item representation: identity + feature embeddings
                # _item_features_matrix row has column indices in the non-augmented feature space
                item_feat_row = self._item_features_matrix[iid_idx]
                if_col_indices = item_feat_row.indices  # columns in (n_items, n_item_features) X matrix

                # In augmented matrix: identity col = iid_idx; side feature cols = n_items + c
                if_embed_idx = [iid_idx] + [n_items + c for c in if_col_indices]
                item_repr = np.sum(self._model.item_embeddings[if_embed_idx], axis=0)
                item_bias = float(np.sum(self._model.item_biases[if_embed_idx]))

                raw = user_bias + item_bias + float(np.dot(user_repr, item_repr))
                scores.append(float(np.clip(raw * 2.0 + 3.0, 1.0, 5.0)))

            return scores
        except Exception as exc:
            _logger.warning(f"[LightFM] Context-feature predict error: {exc}")
            return self._predict_cold_item_bias(item_ids)

    def _predict_cold_item_bias(self, item_ids: list) -> list:
        """
        Last-resort fallback: rank items by their LightFM item bias (popularity signal).
        Returns scores ∈ [1, 5].
        """
        try:
            _, _, item_map, _ = self._dataset.mapping()
            scores = []
            for item_id in item_ids:
                iid_idx = item_map.get(str(item_id))
                if iid_idx is None:
                    scores.append(3.0)
                    continue
                raw = float(self._model.item_biases[iid_idx])
                scores.append(float(np.clip(raw * 2.0 + 3.0, 1.0, 5.0)))
            return scores
        except Exception:
            return [3.0] * len(item_ids)

    # ── Persistence ──────────────────────────────────────────────────────────

    def save(self, path: str = None) -> None:
        if path is None:
            path = os.path.join(_MODELS, 'lightfm_model.joblib')
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump({
            'model':                 self._model,
            'dataset':               self._dataset,
            'item_features_matrix':  self._item_features_matrix,
            'user_features_matrix':  self._user_features_matrix,
            'known_users':           self._known_users,
            'known_items':           self._known_items,
        }, path)
        _logger.info(f"[LightFM] Modelo guardado en {path}")

    def load(self, path: str = None) -> bool:
        if path is None:
            path = os.path.join(_MODELS, 'lightfm_model.joblib')
        if not os.path.exists(path):
            return False
        try:
            data = joblib.load(path)
            self._model                = data['model']
            self._dataset              = data['dataset']
            self._item_features_matrix = data['item_features_matrix']
            self._user_features_matrix = data.get('user_features_matrix')
            self._known_users          = data.get('known_users', set())
            self._known_items          = data.get('known_items', set())
            self.is_fitted = True
            _logger.info(f"[LightFM] Modelo cargado desde {path}")
            return True
        except Exception as exc:
            _logger.warning(f"[LightFM] Error cargando modelo: {exc}")
            return False
