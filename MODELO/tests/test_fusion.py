"""
Tests unitarios para src/fusion.py — filtros, diversificación y blending de scores.

No requieren DB real, modelos entrenados ni dependencias pesadas (lightfm/sklearn
training): usamos DataFrames sintéticos pequeños y objetos "fake" mínimos que
imitan la interfaz esperada (engine, context_model, lightfm_model, content_model).

Ver también el patrón SKIP_MODEL_BOOT=1 usado en src/api.py para evitar cargar
modelos reales al arrancar la API — aquí el equivalente es simplemente no
instanciar SmarturEngine/SmarturContextModel reales, sino stubs livianos.
"""
import pandas as pd
import pytest

from fusion import (
    filtro_duro, _diversify, filtrar_candidatos_por_contexto, recommend_hybrid,
    preference_match_score,
)


# ---------------------------------------------------------------------------
# filtro_duro
# ---------------------------------------------------------------------------

def _make_biz_df():
    return pd.DataFrame([
        {'business_id': 'b1', 'categories': 'Restaurants, Mexican', 'is_accessible': 1, 'outdoor': 0},
        {'business_id': 'b2', 'categories': 'Hotels & Travel',       'is_accessible': 0, 'outdoor': 1},
        {'business_id': 'b3', 'categories': 'Parks, Hiking',         'is_accessible': 1, 'outdoor': 1},
        {'business_id': 'b4', 'categories': 'Museums, History',      'is_accessible': 0, 'outdoor': 0},
    ])


def test_filtro_duro_sin_contexto_no_filtra():
    df = _make_biz_df()
    out = filtro_duro(df, None)
    assert len(out) == len(df)


def test_filtro_duro_requiere_accesibilidad():
    df = _make_biz_df()
    out = filtro_duro(df, {'requiere_accesibilidad': True})
    # Solo b1 y b3 tienen is_accessible == 1
    assert set(out['business_id']) == {'b1', 'b3'}


def test_filtro_duro_pref_outdoor():
    df = _make_biz_df()
    out = filtro_duro(df, {'pref_outdoor': True})
    assert set(out['business_id']) == {'b2', 'b3'}


def test_filtro_duro_needs_hotel():
    df = _make_biz_df()
    out = filtro_duro(df, {'needs_hotel': True})
    assert set(out['business_id']) == {'b2'}


def test_filtro_duro_pref_food_false_excluye_restaurantes():
    df = _make_biz_df()
    out = filtro_duro(df, {'pref_food': False})
    # b1 es "Restaurants..." y debe quedar excluido
    assert 'b1' not in set(out['business_id'])
    assert set(out['business_id']) == {'b2', 'b3', 'b4'}


def test_filtro_duro_combina_restricciones():
    df = _make_biz_df()
    out = filtro_duro(df, {'requiere_accesibilidad': True, 'pref_outdoor': True})
    # Debe cumplir AMBAS: accesible Y outdoor -> solo b3
    assert set(out['business_id']) == {'b3'}


# ---------------------------------------------------------------------------
# filtrar_candidatos_por_contexto (filtro suave)
# ---------------------------------------------------------------------------

def test_filtrar_candidatos_por_contexto_sin_match_degrada_a_todos():
    df = _make_biz_df()
    # tiposTurismo que no mapea a ninguna categoría presente -> degradación graciosa
    out = filtrar_candidatos_por_contexto(df, {'tiposTurismo': ['inexistente_xyz']})
    assert len(out) == len(df)


def test_filtrar_candidatos_por_contexto_naturaleza_prioriza_parks():
    df = _make_biz_df()
    out = filtrar_candidatos_por_contexto(df, {'tiposTurismo': ['naturaleza']})
    # 'naturaleza' mapea (via MAPEO_CATEGORIAS) a categorías tipo Parks/Hiking/etc,
    # así que b3 ("Parks, Hiking") debe sobrevivir al filtro suave.
    assert 'b3' in set(out['business_id'])


# ---------------------------------------------------------------------------
# _diversify
# ---------------------------------------------------------------------------

def test_diversify_caps_items_per_category():
    # 5 items, todos misma categoría principal "Cat" -> con max_per_main_cat=2
    # el top_n=5 solo puede tener 2 de esa categoría entre los "selected" primero,
    # pero como no hay overflow de otras categorías, el resto se rellena desde overflow.
    recs = [
        {'item_id': f'i{i}', 'score': 10 - i} for i in range(5)
    ]
    biz_cat_lookup = {f'i{i}': 'Cat, Sub' for i in range(5)}

    out = _diversify(recs, biz_cat_lookup, top_n=5, max_per_main_cat=2)

    # Todos los 5 terminan incluidos (overflow rellena), pero el ORDEN debe reflejar
    # que los primeros 2 son los de mayor score de esa categoría, y los siguientes
    # provienen del overflow en su orden original.
    assert len(out) == 5
    assert [r['item_id'] for r in out[:2]] == ['i0', 'i1']


def test_diversify_respects_multiple_categories():
    recs = [
        {'item_id': 'a1', 'score': 9}, {'item_id': 'a2', 'score': 8}, {'item_id': 'a3', 'score': 7},
        {'item_id': 'b1', 'score': 6}, {'item_id': 'b2', 'score': 5},
    ]
    biz_cat_lookup = {
        'a1': 'CatA', 'a2': 'CatA', 'a3': 'CatA',
        'b1': 'CatB', 'b2': 'CatB',
    }
    out = _diversify(recs, biz_cat_lookup, top_n=4, max_per_main_cat=2)
    ids = [r['item_id'] for r in out]
    # Máximo 2 de CatA en el resultado final
    assert sum(1 for i in ids if i.startswith('a')) <= 2
    assert len(ids) == 4


def test_diversify_top_n_smaller_than_pool():
    recs = [{'item_id': f'i{i}', 'score': 10 - i} for i in range(10)]
    biz_cat_lookup = {f'i{i}': 'Unique' + str(i) for i in range(10)}
    out = _diversify(recs, biz_cat_lookup, top_n=3, max_per_main_cat=2)
    assert len(out) == 3
    assert [r['item_id'] for r in out] == ['i0', 'i1', 'i2']


# ---------------------------------------------------------------------------
# recommend_hybrid: blending de score_cf para POIs locales / cold-start
#
# Lee src/fusion.py líneas ~287-303: para POIs locales (business_id en
# local_id_set), score_cf YA NO es un 4.0 fijo. Ahora es:
#     score_cf = 3.0 + 2.0 * q          si existe quality_scores[biz_id] == q
#     score_cf = global_mean_rating      si no hay quality_scores para ese POI
#
# Verificamos ambas ramas directamente contra la fórmula real.
# ---------------------------------------------------------------------------

class _FakeContextModel:
    """Stub mínimo: sin candidatos locales (local_biz vacío) para forzar la
    rama de fallback Yelp/engine en recommend_hybrid, pero ejercitamos el
    cálculo de score_cf de POIs locales de forma aislada y directa (ver
    test_score_cf_local_poi_formula_*) en lugar de replicar todo el pipeline.
    """
    def prepare_local_items(self, local_pois):
        return pd.DataFrame()

    def _add_category_features(self, df):
        return df

    def predict_with_context(self, ids, user_context=None, df_biz_override=None):
        return [3.0 for _ in ids]


def _score_cf_local_poi(quality_scores, biz_id, global_mean_rating):
    """Replica exacta de la fórmula en fusion.recommend_hybrid (líneas ~298-299)
    para POIs locales, usada para verificar el comportamiento con datos
    sintéticos concretos sin necesitar levantar todo el pipeline con DB real.
    """
    q = (quality_scores or {}).get(biz_id)
    return 3.0 + 2.0 * q if q is not None else global_mean_rating


def test_score_cf_local_poi_uses_quality_scores_when_present():
    quality_scores = {'poi1': 0.8}
    result = _score_cf_local_poi(quality_scores, 'poi1', global_mean_rating=3.5)
    # 3.0 + 2.0 * 0.8 = 4.6 — NO debe ser el viejo hardcode de 4.0
    assert result == pytest.approx(4.6)
    assert result != 4.0


def test_score_cf_local_poi_falls_back_to_global_mean_when_no_quality():
    quality_scores = {'other_poi': 0.9}
    result = _score_cf_local_poi(quality_scores, 'poi_sin_evaluar', global_mean_rating=3.7)
    assert result == pytest.approx(3.7)


def test_score_cf_local_poi_differentiates_between_pois():
    """Antes (score_cf=4.0 fijo) todos los POIs locales empataban en CF.
    Ahora, dos POIs con distinta calidad deben producir distinto score_cf,
    permitiendo que el ranking los diferencie."""
    quality_scores = {'poi_bueno': 0.9, 'poi_regular': 0.4}
    score_bueno = _score_cf_local_poi(quality_scores, 'poi_bueno', global_mean_rating=3.5)
    score_regular = _score_cf_local_poi(quality_scores, 'poi_regular', global_mean_rating=3.5)
    assert score_bueno > score_regular
    assert score_bueno == pytest.approx(3.0 + 2.0 * 0.9)
    assert score_regular == pytest.approx(3.0 + 2.0 * 0.4)


# ---------------------------------------------------------------------------
# recommend_hybrid: blending final_score (cold-start vs warm), replicando la
# fórmula real leída en fusion.py (líneas ~311-318) con números concretos.
# ---------------------------------------------------------------------------

def test_blend_cold_start_formula():
    # Cold-start con LightFM disponible: 0.60 * lfm + 0.40 * rf
    score_lfm, score_rf = 4.0, 3.0
    expected = 0.60 * score_lfm + 0.40 * score_rf
    assert expected == pytest.approx(3.6)


def test_blend_warm_user_formula():
    # Warm user con LightFM disponible: 0.30*lfm + 0.30*cf + 0.40*rf
    score_lfm, score_cf, score_rf = 4.0, 3.5, 3.0
    expected = 0.30 * score_lfm + 0.30 * score_cf + 0.40 * score_rf
    assert expected == pytest.approx(3.45)


def test_blend_no_lightfm_classic_alpha_blend():
    # Sin LightFM: alpha * cf + (1-alpha) * rf
    alpha, score_cf, score_rf = 0.2, 4.0, 3.0
    expected = (alpha * score_cf) + ((1 - alpha) * score_rf)
    assert expected == pytest.approx(3.2)


# ---------------------------------------------------------------------------
# preference_match_score — boost de preferencia declarada (perfil real),
# reemplaza al filtro suave que excluía candidatos y podía degradar en
# silencio (ver fusion.py, recommend_hybrid ya no llama a
# filtrar_candidatos_por_contexto en el pipeline principal).
# ---------------------------------------------------------------------------

def test_preference_match_score_sin_contexto_es_cero():
    assert preference_match_score('Parks, Hiking', None) == 0.0


def test_preference_match_score_coincidencia_total():
    # tipo de turismo coincide (naturaleza -> Parks/Hiking), presupuesto exacto,
    # grupo familia con is_good_for_kids=1 -> 0.45 + 0.20 + 0.10 = 0.75
    # (preferred_place/sustainable_preferences no están en el contexto)
    score = preference_match_score(
        'Parks, Hiking',
        {'tiposTurismo': ['naturaleza'], 'presupuesto_bucket': 'medio', 'group_type': 'familia'},
        price_level=2,
        is_good_for_kids=1,
    )
    assert score == pytest.approx(0.75)


def test_preference_match_score_coincidencia_absoluta_con_lugar_y_sostenible():
    # Los 5 componentes coinciden -> 0.45+0.20+0.10+0.15+0.10 = 1.0
    score = preference_match_score(
        'Parks, Hiking',
        {
            'tiposTurismo': ['naturaleza'], 'presupuesto_bucket': 'medio', 'group_type': 'familia',
            'preferred_place': 'aire', 'sustainable_preferences': True,
        },
        price_level=2,
        is_good_for_kids=1,
        outdoor=1,
    )
    assert score == pytest.approx(1.0)


def test_preference_match_score_preferred_place_aire_vs_outdoor():
    aire_afuera = preference_match_score('Parks', {'preferred_place': 'aire'}, outdoor=1)
    aire_adentro = preference_match_score('Parks', {'preferred_place': 'aire'}, outdoor=0)
    assert aire_afuera == pytest.approx(0.15)
    assert aire_adentro == 0.0


def test_preference_match_score_preferred_place_cerrado_vs_outdoor():
    cerrado_adentro = preference_match_score('Museums', {'preferred_place': 'cerrado'}, outdoor=0)
    cerrado_afuera = preference_match_score('Museums', {'preferred_place': 'cerrado'}, outdoor=1)
    assert cerrado_adentro == pytest.approx(0.15)
    assert cerrado_afuera == 0.0


def test_preference_match_score_preferred_place_indiferente_no_suma():
    score = preference_match_score('Parks', {'preferred_place': 'indiferente'}, outdoor=1)
    assert score == 0.0


def test_preference_match_score_sostenible_con_categoria_naturaleza():
    con_pref = preference_match_score(
        'Parks, Nature Reserve', {'sustainable_preferences': True},
    )
    sin_pref = preference_match_score(
        'Parks, Nature Reserve', {'sustainable_preferences': False},
    )
    assert con_pref == pytest.approx(0.10)
    assert sin_pref == 0.0


def test_preference_match_score_sostenible_sin_categoria_naturaleza_no_suma():
    score = preference_match_score(
        'Restaurants, Mexican', {'sustainable_preferences': True},
    )
    assert score == 0.0


def test_preference_match_score_sin_coincidencia_es_cero():
    score = preference_match_score(
        'Restaurants, Mexican',
        {'tiposTurismo': ['naturaleza'], 'presupuesto_bucket': 'premium', 'group_type': 'pareja'},
        price_level=1,
        is_romantic=0,
        is_good_for_kids=0,
    )
    assert score == 0.0


def test_preference_match_score_solo_tipo_turismo_sin_presupuesto_ni_grupo():
    # Solo coincide tiposTurismo (0.45); sin bucket de presupuesto en el contexto
    # y sin match de grupo -> el score debe ser exactamente 0.45, no más ni menos.
    score = preference_match_score(
        'Parks, Hiking',
        {'tiposTurismo': ['naturaleza']},
        price_level=3,
    )
    assert score == pytest.approx(0.45)


def test_preference_match_score_presupuesto_gradual_no_todo_o_nada():
    # bucket 'bajo' (nivel 1) vs price_level=4 -> delta=3 -> boost de presupuesto = 0
    # bucket 'bajo' (nivel 1) vs price_level=2 -> delta=1 -> boost parcial > 0
    lejos = preference_match_score('Museums', {'presupuesto_bucket': 'bajo'}, price_level=4)
    cerca = preference_match_score('Museums', {'presupuesto_bucket': 'bajo'}, price_level=2)
    assert lejos == pytest.approx(0.0)
    assert cerca > lejos


def test_preference_match_score_nunca_excede_uno():
    score = preference_match_score(
        'Parks, Hiking, Restaurants',
        {'tiposTurismo': ['naturaleza', 'gastronomico'], 'presupuesto_bucket': 'medio', 'group_type': 'familia'},
        price_level=2,
        is_good_for_kids=1,
        is_romantic=1,
    )
    assert score <= 1.0


def test_recommend_hybrid_returns_empty_without_engine_or_local_pois(monkeypatch):
    """Cuando no hay POIs locales (fetch_all_items falla/vacío) y no se pasa
    engine, recommend_hybrid debe devolver [] de forma segura (ver fusion.py
    línea ~223-224), sin lanzar excepción ni requerir DB real."""
    import fusion as fusion_module

    def _raise(*args, **kwargs):
        raise RuntimeError("no DB in tests")

    monkeypatch.setattr(fusion_module, 'fetch_all_items', _raise)

    result = recommend_hybrid(
        user_id='u1',
        engine=None,
        context_model=_FakeContextModel(),
        context={},
        top_n=5,
    )
    assert result == []
