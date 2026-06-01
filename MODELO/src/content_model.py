"""
SMARTUR Content Model — TF-IDF Cold-Start Fallback.

Usado como fallback cuando LightFM no está disponible.
Calcula similitud coseno entre el perfil de preferencias del usuario (vector TF-IDF
de sus tipos de turismo) y los POIs (vector TF-IDF de sus categorías).

No requiere historial de interacciones ni dependencias adicionales (sklearn).
"""

import logging
import numpy as np
import pandas as pd

_logger = logging.getLogger('smartur-api')

# Mapeo tipo de turismo -> términos de búsqueda para el query del usuario
_TURISMO_QUERY = {
    'naturaleza':   'park hiking nature waterfall volcano mountain viewpoint botanical outdoor',
    'aventura':     'adventure hiking active volcano mountain rafting biking nature park',
    'gastronomico': 'restaurant food gastronomy cafe market traditional local',
    'cultural':     'museum culture history hacienda monument cathedral sanctuary architecture art',
    'rural':        'rural hacienda bed breakfast campground farm countryside',
}

_BUDGET_PRICE_HINT = {'bajo': '1', 'medio': '2', 'alto': '3', 'premium': '4'}


class SmarturContentModel:
    """
    TF-IDF content-based recommender.

    - fit(biz_df): builds TF-IDF matrix from item categories + attributes
    - score(item_ids, user_context): cosine similarity between user query and items
    - Returns scores in [1, 5]
    """

    def __init__(self):
        self._tfidf = None           # fitted TfidfVectorizer
        self._item_matrix = None     # sparse (n_items, n_features)
        self._item_ids = []          # ordered list of business_id
        self.is_fitted = False

    def fit(self, biz_df: pd.DataFrame) -> None:
        """Build TF-IDF matrix from the business corpus."""
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer

            if biz_df is None or biz_df.empty:
                return

            df = biz_df.copy()
            id_col = 'business_id' if 'business_id' in df.columns else 'id'
            df['_bid'] = df[id_col].astype(str)

            # Build text document for each item: categories + binary attributes as pseudo-words
            docs = []
            for _, row in df.iterrows():
                cats = str(row.get('categories', '') or '')
                parts = [cats]

                # Numeric attributes -> pseudo-words
                price = int(row.get('price_level', 2) or 2)
                parts.append(f'price_{price}')
                if int(row.get('is_accessible', 0) or 0):
                    parts.append('accessible accessibility')
                if int(row.get('outdoor', 0) or 0):
                    parts.append('outdoor nature')
                if int(row.get('is_good_for_kids', 0) or 0):
                    parts.append('kids family children')
                if int(row.get('is_romantic', 0) or 0):
                    parts.append('romantic couple pareja')

                docs.append(' '.join(parts).lower())

            self._tfidf = TfidfVectorizer(
                analyzer='word',
                token_pattern=r'[a-záéíóúüñ&]+',
                min_df=1,
                max_features=3000,
                sublinear_tf=True,
            )
            self._item_matrix = self._tfidf.fit_transform(docs)
            self._item_ids = df['_bid'].tolist()
            self.is_fitted = True
            _logger.info(f"[ContentModel] TF-IDF listo: {len(self._item_ids)} ítems, "
                         f"{self._item_matrix.shape[1]} features")
        except Exception as exc:
            _logger.warning(f"[ContentModel] Error en fit(): {exc}")

    def score(self, item_ids: list, user_context: dict = None) -> list:
        """
        Compute content similarity scores for the given item_ids.

        Args:
            item_ids: list of business_id strings to score
            user_context: dict with tiposTurismo, presupuesto_bucket, etc.

        Returns:
            list of float scores in [1, 5], same length as item_ids.
        """
        if not self.is_fitted:
            return [3.0] * len(item_ids)

        try:
            from sklearn.metrics.pairwise import cosine_similarity

            query_text = self._build_query(user_context)
            query_vec = self._tfidf.transform([query_text])

            # Build index from item_id -> matrix row
            id_to_row = {iid: i for i, iid in enumerate(self._item_ids)}

            scores = []
            for item_id in item_ids:
                row_idx = id_to_row.get(str(item_id))
                if row_idx is None:
                    scores.append(3.0)
                    continue
                sim = float(cosine_similarity(query_vec, self._item_matrix[row_idx])[0, 0])
                # Map cosine sim [0, 1] -> [1, 5]: 0 sim -> 1.0, perfect sim -> 5.0
                scores.append(float(np.clip(1.0 + sim * 4.0, 1.0, 5.0)))

            return scores
        except Exception as exc:
            _logger.warning(f"[ContentModel] Error en score(): {exc}")
            return [3.0] * len(item_ids)

    def _build_query(self, user_context: dict) -> str:
        """Builds a pseudo-document representing user preferences for TF-IDF matching."""
        if not user_context:
            return 'culture gastronomy park restaurant'

        parts = []

        # Tourism types -> pseudo-words
        tipos = user_context.get('tiposTurismo', [])
        if isinstance(tipos, str):
            tipos = [tipos]
        for t in tipos:
            q = _TURISMO_QUERY.get(t, '')
            if q:
                parts.append(q)

        # Boolean prefs -> pseudo-words
        if user_context.get('pref_outdoor', False):
            parts.append('outdoor nature park hiking')
        if user_context.get('wants_tours', False):
            parts.append('tours excursion adventure')
        if user_context.get('needs_hotel', False):
            parts.append('hotel accommodation rural')
        if user_context.get('requiere_accesibilidad', False):
            parts.append('accessible accessibility')

        # Group type hints
        gtype = str(user_context.get('group_type', '')).lower()
        if gtype == 'familia':
            parts.append('kids family children')
        elif gtype == 'pareja':
            parts.append('romantic couple')

        # Budget hint
        budget = str(user_context.get('presupuesto_bucket', 'medio')).lower()
        price_hint = _BUDGET_PRICE_HINT.get(budget, '2')
        parts.append(f'price_{price_hint}')

        return ' '.join(parts) if parts else 'culture gastronomy park restaurant'
