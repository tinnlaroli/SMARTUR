"""
SMARTUR Fusion v4: Pipeline de dos etapas (Retrieval -> Ranking).

Fase A (Retrieval):
  1. Pool amplio de ~200 candidatos vía KNN/Pearson
  2. Filtro duro: elimina ítems que violen restricciones binarias
  3. Filtro suave: prioriza categorías según tiposTurismo

Fase B (Ranking) — 4 señales:
  - CF/SVD Pearson (warm users only)
  - RF contextual [Item + User + Match features]
  - LightFM WARP (cold-start + warm via feature embeddings)
  - ContentModel TF-IDF (fallback cuando LightFM no disponible)

Blending:
  Cold-start: 0.60 LightFM + 0.40 RF
  Warm user:  0.30 LightFM + 0.30 CF + 0.40 RF
"""

import numpy as np
import pandas as pd

from cf import REAL_SIGNAL_SOURCES, predict_cf_pearson_with_source
from context_encoder import MAPEO_CATEGORIAS
from poi_repository import fetch_all_items

# Center of Altas Montañas region — used as user location fallback
_ALTAS_MONTANAS_LAT = 18.95
_ALTAS_MONTANAS_LON = -97.05

# Peso del boost de preferencia declarada dentro del blend final. Se deja como
# constante nombrada (en vez de enterrarlo en la fórmula) para poder ajustarlo
# con datos reales más adelante sin tocar la lógica de recommend_hybrid.
PREFERENCE_BOOST_WEIGHT = 0.2

# presupuesto_bucket (fetch_traveler_profile, poi_repository.py) es un string;
# price_level en df_biz es numérico (misma escala 1-4 que usa rf_model.py para
# user_budget). Se mapea aquí para poder comparar ambos.
_BUDGET_BUCKET_LEVEL = {'bajo': 1, 'medio': 2, 'alto': 3, 'premium': 4}

# Keywords per tourism type for explanation tags
_TOURISM_KEYWORDS: dict[str, list[str]] = {
    'naturaleza':    ['park', 'hiking', 'waterfall', 'nature', 'botanical', 'outdoor', 'mountain', 'volcano'],
    'aventura':      ['adventure', 'hiking', 'mountain', 'volcano', 'outdoor'],
    'cultural':      ['museum', 'history', 'monument', 'landmark', 'cathedral', 'market'],
    'gastronomico':  ['restaurant', 'food', 'gastronomy', 'cafe', 'market'],
    'rural':         ['hacienda', 'ranch', 'rural', 'countryside', 'sanctuary'],
}


def _compute_dist_km_series(df: pd.DataFrame, user_lat: float, user_lon: float) -> pd.Series:
    """Haversine distance (km) from (user_lat, user_lon) to each row in df."""
    R = 6371.0
    lat1 = np.radians(user_lat)
    lon1 = np.radians(user_lon)
    lat2 = np.radians(df['latitude'].fillna(user_lat))
    lon2 = np.radians(df['longitude'].fillna(user_lon))
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2) ** 2
    return (2 * R * np.arcsin(np.sqrt(a))).clip(0, 500)


def _build_reason_tags(
    biz_id: str,
    cats: str,
    context: dict,
    quality_scores: dict | None,
    dist_km: float | None,
) -> list[str]:
    """
    Generates up to 2 human-readable explanation tags for a recommendation:
    1. Tourism-type match (e.g. "Coincide con naturaleza")
    2. Quality signal (e.g. "Muy bien evaluado")   — OR —
       Distance signal  (e.g. "A 3.2 km de ti")
    """
    tags: list[str] = []
    cats_lower = cats.lower() if cats else ''
    tipos: list[str] = context.get('tiposTurismo', []) or []

    # Tourism match
    for tipo in tipos:
        keywords = _TOURISM_KEYWORDS.get(tipo, [])
        if any(k in cats_lower for k in keywords):
            tags.append(f"Coincide con {tipo}")
            break

    if len(tags) < 2:
        # Quality signal (priority over distance when service is well evaluated)
        q = (quality_scores or {}).get(biz_id, 0.0)
        if q >= 0.7:
            tags.append("Muy bien evaluado")
        elif q >= 0.5:
            tags.append("Bien evaluado")
        # Distance signal (fallback when no quality data)
        elif dist_km is not None:
            if dist_km < 5:
                tags.append(f"A {dist_km:.1f} km de ti")
            elif dist_km < 15:
                tags.append(f"Cerca ({dist_km:.0f} km)")

    return tags[:2]

# ---------------------------------------------------------------------------
# Filtros
# ---------------------------------------------------------------------------

def filtro_duro(biz_df, context):
    """
    Elimina candidatos que violen restricciones binarias del usuario.
    Son condiciones de 'no-negociable' (deal-breakers).
    """
    if not context:
        return biz_df

    filtered = biz_df.copy()

    # Accesibilidad: si el usuario la requiere, eliminar negocios sin ella
    if context.get('requiere_accesibilidad') is True:
        if 'is_accessible' in filtered.columns:
            filtered = filtered[filtered['is_accessible'] == 1]

    # Outdoor: si el usuario lo prefiere como requisito duro
    if context.get('pref_outdoor') is True:
        if 'outdoor' in filtered.columns:
            filtered = filtered[filtered['outdoor'] == 1]

    # Hotel: si el usuario lo necesita como base
    if context.get('needs_hotel') is True:
        mask = filtered['categories'].str.contains('Hotels & Travel|Hotels', case=False, na=False)
        filtered = filtered[mask]

    # Comida: si el usuario NO quiere comida
    if context.get('pref_food') is False:
        mask = ~filtered['categories'].str.contains('Restaurants|Food', case=False, na=False)
        filtered = filtered[mask]

    return filtered


def _diversify(recs, biz_cat_lookup, top_n, max_per_main_cat=2):
    """
    Re-rankea la lista ordenada por score para que el top-N tenga
    máximo max_per_main_cat ítems con la misma categoría principal.
    Mantiene el orden de relevancia y solo desplaza los duplicados al final.
    """
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
        selected.extend(overflow[:top_n - len(selected)])
    return selected[:top_n]


def _categorias_para_tipos(tipos: list[str]) -> list[str]:
    """Expande una lista de tiposTurismo a sus palabras clave de categoría
    (MAPEO_CATEGORIAS) — compartido entre el filtro suave (legado) y el
    boost de preferencia."""
    categorias: list[str] = []
    for tipo in tipos or []:
        categorias.extend(MAPEO_CATEGORIAS.get(tipo, []))
    return categorias


def filtrar_candidatos_por_contexto(biz_df, context):
    """Filtro suave: prioriza negocios cuyas categorías coincidan con tiposTurismo."""
    if not context:
        return biz_df

    filtered_df = biz_df.copy()

    if 'tiposTurismo' in context and context['tiposTurismo']:
        yelp_categories = _categorias_para_tipos(context['tiposTurismo'])
        if yelp_categories:
            mask = filtered_df['categories'].str.contains(
                '|'.join(yelp_categories), case=False, na=False
            )
            # Si ningún candidato coincide, mantener todos (degradación graciosa)
            if mask.any():
                filtered_df = filtered_df[mask]

    return filtered_df


# Categorías que cuentan como "turismo sostenible" — mismo criterio que ya
# se usa para tiposTurismo naturaleza/rural (áreas naturales, comunidades
# rurales), no hay una bandera dedicada de sostenibilidad a nivel de ítem.
_SUSTAINABLE_TIPOS = ['naturaleza', 'rural']


def preference_match_score(
    categories: str,
    context: dict | None,
    price_level: float | None = None,
    is_romantic: int = 0,
    is_good_for_kids: int = 0,
    outdoor: int = 0,
) -> float:
    """
    Qué tan bien encaja un candidato con las preferencias DECLARADAS por el
    usuario (perfil real), independiente de lo que CF/RF hayan aprendido de
    calificaciones. Devuelve un valor en [0, 1]:
      - 0.45 si la categoría coincide con algún tiposTurismo declarado
      - 0.20 según qué tan cerca esté price_level del presupuesto_bucket
        (penalización gradual, no todo-o-nada)
      - 0.10 si el tipo de grupo (group_type) coincide con las banderas
        is_romantic/is_good_for_kids del ítem
      - 0.15 si preferred_place ('aire'/'cerrado') coincide con el flag
        outdoor del ítem
      - 0.10 si sustainable_preferences está activo y la categoría es de
        naturaleza/rural

    Estas dos últimas señales ('preferred_place', 'sustainable_preferences')
    ya se le preguntan al usuario en el perfil (traveler_profile) y se
    guardan en la BD, pero antes nunca llegaban al motor de recomendación
    — se pedían y se ignoraban.

    A diferencia de filtrar_candidatos_por_contexto (que excluye candidatos
    y puede degradar en silencio a "sin filtro" si el match da cero), esto
    nunca elimina candidatos — solo reordena empujando hacia arriba lo que
    sí coincide, así que la preferencia declarada siempre tiene efecto en el
    ranking aunque el catálogo de categorías esté mal etiquetado.
    """
    if not context:
        return 0.0

    score = 0.0
    cats_lower = (categories or '').lower()

    # Tipo de turismo (peso mayor)
    tipos = context.get('tiposTurismo') or []
    keywords = _categorias_para_tipos(tipos)
    if keywords and any(k.lower() in cats_lower for k in keywords):
        score += 0.45

    # Presupuesto (peso menor, gradual)
    bucket = context.get('presupuesto_bucket')
    bucket_level = _BUDGET_BUCKET_LEVEL.get(bucket) if bucket else None
    if bucket_level is not None and price_level is not None:
        try:
            delta = abs(float(price_level) - bucket_level)
            score += 0.20 * max(0.0, 1.0 - delta / 3.0)
        except (TypeError, ValueError):
            pass

    # Tipo de grupo (peso menor)
    group_type = (context.get('group_type') or '').lower()
    if group_type == 'familia' and is_good_for_kids:
        score += 0.10
    elif group_type == 'pareja' and is_romantic:
        score += 0.10

    # Lugar preferido (aire libre / cerrado) — 'indiferente' no suma ni resta.
    preferred_place = (context.get('preferred_place') or 'indiferente').lower()
    if preferred_place == 'aire' and outdoor:
        score += 0.15
    elif preferred_place == 'cerrado' and not outdoor:
        score += 0.15

    # Preferencia de turismo sostenible
    if context.get('sustainable_preferences'):
        sustainable_keywords = _categorias_para_tipos(_SUSTAINABLE_TIPOS)
        if sustainable_keywords and any(k.lower() in cats_lower for k in sustainable_keywords):
            score += 0.10

    return min(1.0, score)


def _resolve_cf_score(
    user_id,
    biz_id,
    engine,
    *,
    matrix_col_set: set,
    local_id_set: set,
    quality_scores: dict | None,
    global_mean_rating: float,
) -> tuple[float, str]:
    """
    Decide la señal colaborativa de un candidato y de dónde salió.

    ORDEN IMPORTANTE — aquí vivía un bug estructural: antes se preguntaba
    PRIMERO `if biz_id in local_id_set` (y se usaba el proxy de calidad).
    Como en producción TODOS los candidatos son POIs locales, esa rama
    siempre ganaba y `predict_cf_pearson` NUNCA se ejecutaba para un lugar
    recomendado — el CF-KNN estaba muerto y no podía despertar por más
    interacciones reales que se acumularan.

    Ahora se intenta el CF SIEMPRE primero, y el proxy de calidad solo entra
    cuando el CF no tiene señal real (devuelve 'fallback_mean', o sea un
    promedio sin información). Así el CF-KNN se activa solo en cuanto haya
    interacciones reales sobre POIs locales: los IDs ya coinciden (poi_N /
    svc_N tanto en fetch_all_items como en fetch_real_interactions) y esas
    interacciones ya se mezclan al entrenamiento del engine.

    Returns:
        (score, signal) donde signal ∈ {'knn','svd','quality_proxy','global_mean'}
        — 'knn'/'svd' significan que el CF realmente aportó.
    """
    if engine is not None and biz_id in matrix_col_set:
        cf_pred, cf_source = predict_cf_pearson_with_source(user_id, biz_id, engine)
        if cf_source in REAL_SIGNAL_SOURCES:
            return cf_pred, cf_source

    # Sin señal CF real todavía.
    if biz_id in local_id_set:
        # Proxy: evaluación de calidad del admin (service_evaluation) — así al
        # menos los POIs locales se diferencian entre sí en vez de compartir
        # un score plano.
        q = (quality_scores or {}).get(biz_id)
        if q is not None:
            return 3.0 + 2.0 * q, 'quality_proxy'

    return global_mean_rating, 'global_mean'


# ---------------------------------------------------------------------------
# Pipeline principal
# ---------------------------------------------------------------------------

def recommend_hybrid(
    user_id, engine, context_model,
    alpha=0.4, context=None, top_n=5,
    lightfm_model=None, content_model=None,
    quality_scores=None,
):
    """
    Sistema Híbrido SMARTUR v4 (Retrieval + Ranking multi-señal).

    Modo producción (local POIs disponibles):
      - Candidatos: SOLO POIs de la BD local (Altas Montañas, Veracruz)
      - Ranking: LightFM + RF (cold-start); LightFM + CF + RF (warm)

    Modo desarrollo/fallback (sin BD local):
      - Candidatos: 200 negocios Yelp vía KNN
      - Ranking: α × CF + (1-α) × RF (+ LightFM si disponible)
    """
    # ── Fase A: Retrieval ────────────────────────────────────────────────
    try:
        local_pois = fetch_all_items()
        local_biz = context_model.prepare_local_items(local_pois)
    except Exception:
        local_biz = pd.DataFrame()

    if not local_biz.empty:
        # Producción: POIs locales como pool exclusivo.
        # Usamos un alpha reducido (no cero) para que la señal latente de CF/SVD
        # siga contribuyendo al score final, especialmente con el fallback SVD.
        local_biz = context_model._add_category_features(local_biz)
        biz_candidates = local_biz
        try:
            from model_metrics import load_metrics as _lm
            _saved_alpha = float(_lm().get('best_alpha', 0.2))
            # Reducir alpha a 30% del óptimo global para dar más peso al RF contextual
            # que sí fue entrenado con features de los POIs locales.
            effective_alpha = max(0.05, _saved_alpha * 0.3)
        except Exception:
            effective_alpha = 0.1  # fallback conservador
    else:
        # Fallback desarrollo: candidatos Yelp KNN
        if engine is None:
            return []   # no local POIs and no engine -> cannot recommend
        candidate_ids = engine.get_candidate_pool(user_id, top_n=200)
        biz_candidates = engine.df_biz[engine.df_biz['business_id'].isin(candidate_ids)]
        effective_alpha = alpha

    # Filtro duro (restricciones binarias — deal-breakers reales, ej. accesibilidad)
    refined_df = filtro_duro(biz_candidates, context)

    # Fallback: si el filtro duro vació la lista, usar pool sin filtrar
    if refined_df.empty:
        refined_df = biz_candidates

    # NOTA: el filtro suave por tiposTurismo (filtrar_candidatos_por_contexto)
    # ya NO se aplica aquí — excluía candidatos por texto libre y podía
    # degradar en silencio a "sin filtro" si el match daba cero resultados
    # (categories_raw/categories_mapped son texto sin validación fuerte).
    # En su lugar, la preferencia declarada se usa como boost de score más
    # abajo (preference_match_score) — nunca excluye, siempre tiene efecto.

    final_ids = refined_df['business_id'].tolist()

    # ── Fase B: Ranking ──────────────────────────────────────────────────
    ref_df = local_biz if not local_biz.empty else (engine.df_biz if engine is not None else pd.DataFrame())
    rf_scores = context_model.predict_with_context(final_ids, user_context=context, df_biz_override=ref_df)
    rf_map = dict(zip(final_ids, rf_scores))

    biz_cat_lookup  = ref_df.set_index('business_id')['categories'].to_dict()
    all_biz_names   = ref_df.set_index('business_id')['name'].to_dict()
    biz_kind_lookup = ref_df.set_index('business_id')['kind'].to_dict() if 'kind' in ref_df.columns else {}
    biz_desc_lookup = ref_df.set_index('business_id')['description'].to_dict() if 'description' in ref_df.columns else {}
    local_id_set    = set(local_biz['business_id']) if not local_biz.empty else set()
    matrix_col_set  = set(engine.user_item_matrix_columns) if engine is not None else set()

    # Lookups para el boost de preferencia (preference_match_score)
    price_lookup       = ref_df.set_index('business_id')['price_level'].to_dict() if 'price_level' in ref_df.columns else {}
    is_romantic_lookup = ref_df.set_index('business_id')['is_romantic'].to_dict() if 'is_romantic' in ref_df.columns else {}
    is_kids_lookup     = ref_df.set_index('business_id')['is_good_for_kids'].to_dict() if 'is_good_for_kids' in ref_df.columns else {}
    outdoor_lookup     = ref_df.set_index('business_id')['outdoor'].to_dict() if 'outdoor' in ref_df.columns else {}

    # ── Distance map for explanation tags ────────────────────────────────
    # Use user-supplied lat/lon from context; fall back to region center.
    dist_km_map: dict[str, float] = {}
    if not ref_df.empty and 'latitude' in ref_df.columns and 'longitude' in ref_df.columns:
        try:
            user_lat = float(context.get('lat') or _ALTAS_MONTANAS_LAT)
            user_lon = float(context.get('lon') or _ALTAS_MONTANAS_LON)
            distances = _compute_dist_km_series(ref_df, user_lat, user_lon)
            dist_km_map = dict(zip(ref_df['business_id'], distances))
        except Exception:
            pass  # explanation tags gracefully degrade without distance

    # ── LightFM or ContentModel scores ───────────────────────────────────
    # Determine cold-start status for blending weights
    is_cold_start = str(user_id) not in (
        getattr(lightfm_model, '_known_users', set()) if lightfm_model else set()
    ) and str(user_id) not in (getattr(engine, 'user_index', {}) or {})

    if lightfm_model is not None and getattr(lightfm_model, 'is_fitted', False):
        lfm_scores  = lightfm_model.predict(str(user_id), final_ids, user_context=context)
        lfm_map     = dict(zip(final_ids, lfm_scores))
        use_content = False
    elif content_model is not None and getattr(content_model, 'is_fitted', False):
        cb_scores  = content_model.score(final_ids, user_context=context)
        lfm_map    = dict(zip(final_ids, cb_scores))
        use_content = True
    else:
        lfm_map     = {}
        use_content = False

    recommendations = []

    global_mean_rating = engine.train_data['stars'].mean() if engine is not None else 3.5

    for biz_id in final_ids:
        # ── Señal colaborativa (CF-KNN) con fallback a calidad ────────────
        # ORDEN IMPORTANTE. Antes la rama `if biz_id in local_id_set` iba
        # PRIMERO y siempre ganaba: como en producción todos los candidatos
        # son POIs locales, predict_cf_pearson NUNCA se ejecutaba para un
        # lugar recomendado — el CF-KNN estaba estructuralmente muerto y no
        # podía despertar por más datos reales que se acumularan.
        #
        # Ahora se intenta CF primero SIEMPRE, y solo se usa el proxy de
        # calidad (evaluación del admin) cuando el CF no tiene señal real
        # (devuelve 'fallback_mean', o sea un promedio sin información).
        # Así el CF se activa solo en cuanto haya interacciones reales sobre
        # POIs locales — los IDs ya coinciden (poi_N / svc_N tanto en
        # fetch_all_items como en fetch_real_interactions), y esas
        # interacciones ya se mezclan al entrenamiento del engine.
        score_cf, cf_signal = _resolve_cf_score(
            user_id, biz_id, engine,
            matrix_col_set=matrix_col_set,
            local_id_set=local_id_set,
            quality_scores=quality_scores,
            global_mean_rating=global_mean_rating,
        )

        score_rf  = rf_map.get(biz_id, 3.0)
        score_lfm = lfm_map.get(biz_id, 3.0)
        cats      = biz_cat_lookup.get(biz_id, '')

        # Blending weights:
        #   Cold-start user -> lean on LightFM (feature-based) + RF (content)
        #   Warm user       -> balanced: LightFM + CF + RF
        if lfm_map:
            if is_cold_start:
                final_score = 0.60 * score_lfm + 0.40 * score_rf
            else:
                final_score = 0.30 * score_lfm + 0.30 * score_cf + 0.40 * score_rf
        else:
            # LightFM not available -> classic blend
            final_score = (effective_alpha * score_cf) + ((1 - effective_alpha) * score_rf)

        # Boost de preferencia declarada (perfil real del usuario), no de lo
        # que CF/RF aprendieron de calificaciones. Nunca excluye candidatos —
        # solo empuja hacia arriba lo que coincide con tiposTurismo/presupuesto/
        # grupo, así que la preferencia siempre influye en el ranking aunque
        # el modelo no tenga suficientes datos para haberla aprendido solo.
        score_pref = preference_match_score(
            cats, context,
            price_level=price_lookup.get(biz_id),
            is_romantic=is_romantic_lookup.get(biz_id, 0),
            is_good_for_kids=is_kids_lookup.get(biz_id, 0),
            outdoor=outdoor_lookup.get(biz_id, 0),
        )
        final_score = (
            (1 - PREFERENCE_BOOST_WEIGHT) * final_score
            + PREFERENCE_BOOST_WEIGHT * (score_pref * 5.0)
        )

        # Quality boost from admin service_evaluation (service_evaluation.total_score).
        # Non-linear: 0 boost for quality ≤ 0.5 (score ≤ 50/100), +0.3 max at quality = 1.0.
        # This rewards well-evaluated services without demoting unevaluated POIs.
        if quality_scores:
            q = quality_scores.get(biz_id, 0.0)
            if q > 0.5:
                quality_boost = 0.3 * (q - 0.5) / 0.5  # linear: 0 @ q=0.5, 0.3 @ q=1.0
                final_score = min(5.0, final_score + quality_boost)

        nombre = all_biz_names.get(biz_id, 'Desconocido')
        kind   = biz_kind_lookup.get(biz_id, 'poi')
        desc   = biz_desc_lookup.get(biz_id, '') or ''

        recommendations.append({
            'item_id':     str(biz_id),
            'title':       str(nombre),
            'description': str(desc),
            'category':    str(cats),
            'score':       float(round(final_score, 3)),
            'pred_cf':     float(round(score_cf, 3)),
            # De dónde salió pred_cf: 'knn'/'svd' = CF real aportó;
            # 'quality_proxy'/'global_mean' = CF aún sin señal (esperando
            # interacciones reales sobre este POI). Permite ver en /metrics
            # cuándo el CF-KNN por fin despierta, sin adivinar.
            'cf_signal':   cf_signal,
            'pred_rf':     float(round(score_rf, 3)),
            'pred_pref':   float(round(score_pref, 3)),
            'kind':        kind,
            'reason_tags': _build_reason_tags(
                biz_id, cats, context or {},
                quality_scores, dist_km_map.get(biz_id),
            ),
        })

    sorted_recs = sorted(recommendations, key=lambda x: x['score'], reverse=True)
    return _diversify(sorted_recs, biz_cat_lookup, top_n)
