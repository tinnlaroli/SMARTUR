"""
SMARTUR Fusion v4: Retrieval → filtros → ranking con 3 algoritmos ML.

Algoritmos:
  1. CF Pearson + KNN (colaborativo)
  2. Random Forest contextual
  3. Gradient Boosting contextual

En producción (POIs locales): ensemble RF+GBM con pesos del mejor modelo evaluado.
"""

import pandas as pd

from cf import predict_cf_pearson
from context_encoder import MAPEO_CATEGORIAS
from model_metrics import load_metrics
from poi_repository import fetch_all_items


def filtro_duro(biz_df, context):
    """Elimina candidatos que violen restricciones binarias del usuario."""
    if not context:
        return biz_df

    filtered = biz_df.copy()

    if context.get('requiere_accesibilidad') is True:
        if 'is_accessible' in filtered.columns:
            filtered = filtered[filtered['is_accessible'] == 1]

    if context.get('pref_outdoor') is True:
        if 'outdoor' in filtered.columns:
            filtered = filtered[filtered['outdoor'] == 1]

    if context.get('needs_hotel') is True:
        mask = filtered['categories'].str.contains(
            'Hotels & Travel|Hotels|hotel', case=False, na=False
        )
        filtered = filtered[mask]

    if context.get('pref_food') is False:
        mask = ~filtered['categories'].str.contains(
            'Restaurants|Food|restaurant', case=False, na=False
        )
        filtered = filtered[mask]

    return filtered


def _diversify(recs, biz_cat_lookup, top_n, max_per_main_cat=2):
    """Limita repetición de la misma categoría principal en el top-N."""
    cat_counts = {}
    selected = []
    overflow = []

    for rec in recs:
        cats_str = str(biz_cat_lookup.get(rec['item_id'], ''))
        main_cat = cats_str.split(',')[0].strip() if cats_str else 'Unknown'
        if cat_counts.get(main_cat, 0) < max_per_main_cat:
            selected.append(rec)
            cat_counts[main_cat] = cat_counts.get(main_cat, 0) + 1
        else:
            overflow.append(rec)
        if len(selected) >= top_n:
            break

    if len(selected) < top_n:
        selected.extend(overflow[: top_n - len(selected)])
    return selected[:top_n]


def filtrar_candidatos_por_contexto(biz_df, context):
    """Filtro suave por tiposTurismo."""
    if not context:
        return biz_df

    filtered_df = biz_df.copy()

    if 'tiposTurismo' in context and context['tiposTurismo']:
        yelp_categories = []
        for tipo in context['tiposTurismo']:
            yelp_categories.extend(MAPEO_CATEGORIAS.get(tipo, []))
        if yelp_categories:
            mask = filtered_df['categories'].str.contains(
                '|'.join(yelp_categories), case=False, na=False
            )
            if mask.any():
                filtered_df = filtered_df[mask]

    return filtered_df


def _content_boost(row, context, encoder):
    """Señal content-based: overlap de intereses y match de presupuesto (0–1)."""
    if not context:
        return 0.5
    user_feats = encoder.encode_user(context)
    match = encoder.compute_match_features(user_feats, row)
    overlap = float(match.get('interest_overlap', 0))
    budget_penalty = 1.0 - min(1.0, float(match.get('budget_delta', 0)) / 3.0)
    return min(1.0, 0.15 * overlap + 0.85 * budget_penalty)


def recommend_hybrid(
    user_id,
    engine,
    context_model,
    alpha=0.4,
    context=None,
    top_n=5,
    gbm_model=None,
    metrics_config=None,
):
    """
    Pipeline híbrido con 3 algoritmos ML.
    POIs locales: ensemble RF + GBM + boost content-based (sin CF Yelp).
    """
    metrics_config = metrics_config or load_metrics()
    local_blend = metrics_config.get('local_blend', {'rf': 0.55, 'gbm': 0.45})
    w_rf = float(local_blend.get('rf', 0.55))
    w_gbm = float(local_blend.get('gbm', 0.45))
    best_algo = metrics_config.get('best_algorithm', 'hybrid_triple')

    try:
        local_pois = fetch_all_items()
        local_biz = context_model.prepare_local_items(local_pois)
    except Exception:
        local_biz = pd.DataFrame()

    if local_biz.empty:
        return []

    local_biz = context_model._add_category_features(local_biz)
    biz_candidates = local_biz
    use_local_only = True

    refined_df = filtro_duro(biz_candidates, context)
    refined_df = filtrar_candidatos_por_contexto(refined_df, context)
    if refined_df.empty:
        refined_df = biz_candidates

    final_ids = refined_df['business_id'].tolist()
    ref_df = local_biz
    rf_scores = context_model.predict_with_context(
        final_ids, user_context=context, df_biz_override=ref_df
    )
    rf_map = dict(zip(final_ids, rf_scores))

    gbm_map = {}
    if gbm_model is not None and getattr(gbm_model, 'is_fitted', False):
        gbm_scores = gbm_model.predict_with_context(
            final_ids, user_context=context, df_biz_override=ref_df
        )
        gbm_map = dict(zip(final_ids, gbm_scores))

    biz_cat_lookup = ref_df.set_index('business_id')['categories'].to_dict()
    all_biz_names = ref_df.set_index('business_id')['name'].to_dict()
    biz_kind_lookup = (
        ref_df.set_index('business_id')['kind'].to_dict() if 'kind' in ref_df.columns else {}
    )
    matrix_col_set = set(engine.user_item_matrix_columns) if engine.user_item_matrix_columns is not None else set()
    biz_indexed = ref_df.set_index('business_id')

    recommendations = []
    encoder = context_model.encoder

    for biz_id in final_ids:
        score_rf = float(rf_map.get(biz_id, 3.0))
        score_gbm = float(gbm_map.get(biz_id, score_rf))

        if use_local_only:
            score_cf = score_rf
            contextual = w_rf * score_rf + w_gbm * score_gbm
            if biz_id in biz_indexed.index:
                boost = _content_boost(biz_indexed.loc[biz_id], context, encoder)
                contextual = 0.85 * contextual + 0.15 * (1.0 + 4.0 * boost)
            final_score = contextual
        elif biz_id in matrix_col_set:
            score_cf = predict_cf_pearson(user_id, biz_id, engine)
            if best_algo == 'gradient_boosting' and gbm_map:
                final_score = score_gbm
            elif best_algo == 'random_forest':
                final_score = score_rf
            elif best_algo == 'cf_knn_pearson':
                final_score = score_cf
            else:
                final_score = alpha * score_cf + (1 - alpha) * (w_rf * score_rf + w_gbm * score_gbm)
        else:
            score_cf = float(engine.train_data['stars'].mean())
            final_score = w_rf * score_rf + w_gbm * score_gbm

        nombre = all_biz_names.get(biz_id, 'Desconocido')
        kind = biz_kind_lookup.get(biz_id, 'poi')

        image_url = None
        if 'image_url' in ref_df.columns:
            col = ref_df.loc[ref_df['business_id'] == biz_id, 'image_url']
            if not col.empty:
                image_url = col.iloc[0]
        if pd.isna(image_url):
            image_url = None

        recommendations.append({
            'item_id': str(biz_id),
            'title': str(nombre),
            'score': float(round(final_score, 3)),
            'pred_cf': float(round(score_cf, 3)),
            'pred_rf': float(round(score_rf, 3)),
            'pred_gbm': float(round(score_gbm, 3)),
            'kind': kind,
            'image_url': image_url,
        })

    sorted_recs = sorted(recommendations, key=lambda x: x['score'], reverse=True)
    return _diversify(sorted_recs, biz_cat_lookup, top_n)
