"""
Tests para src/cf.py — instrumentación de qué "camino" toma cada predicción
de CF (knn real / svd fallback / fallback constante a la media).

Contexto: 198K usuarios vs 233 items en Yelp = matriz muy dispersa. La
sospecha es que la mayoría de las predicciones de evaluación caen en
'fallback_mean' (sin señal real de vecinos), lo que explica por qué CF no
le gana al baseline. Este contador permite medirlo objetivamente en vez
de asumirlo.
"""
from cf import (
    REAL_SIGNAL_SOURCES,
    get_prediction_stats,
    predict_cf_pearson,
    predict_cf_pearson_with_source,
    reset_prediction_stats,
)


class _FakeEngineColdStart:
    """user_id/item_id no existen en el índice -> fuerza cold-start total."""
    def __init__(self):
        self.train_data = __import__('pandas').DataFrame({'stars': [3.0, 4.0, 5.0]})

    def get_user_idx(self, user_id):
        return None

    def get_biz_idx(self, item_id):
        return None


def test_reset_prediction_stats_limpia_contadores():
    reset_prediction_stats()
    predict_cf_pearson('u1', 'i1', _FakeEngineColdStart())
    stats = get_prediction_stats()
    assert stats['fallback_mean'] == 1

    reset_prediction_stats()
    stats = get_prediction_stats()
    assert stats['fallback_mean'] == 0
    assert stats['total'] == 0
    assert stats['fallback_rate'] is None


def test_cold_start_total_incrementa_fallback_mean():
    reset_prediction_stats()
    result = predict_cf_pearson('usuario_inexistente', 'item_inexistente', _FakeEngineColdStart())
    stats = get_prediction_stats()
    assert result == 4.0  # media de [3, 4, 5]
    assert stats['fallback_mean'] == 1
    assert stats['knn'] == 0
    assert stats['svd'] == 0
    assert stats['total'] == 1
    assert stats['fallback_rate'] == 1.0


def test_fallback_rate_se_calcula_correctamente_con_multiples_llamadas():
    reset_prediction_stats()
    engine = _FakeEngineColdStart()
    for _ in range(3):
        predict_cf_pearson('u', 'i', engine)  # siempre cold-start -> fallback_mean
    stats = get_prediction_stats()
    assert stats['total'] == 3
    assert stats['fallback_mean'] == 3
    assert stats['fallback_rate'] == 1.0


# ---------------------------------------------------------------------------
# predict_cf_pearson_with_source — permite al ranking (fusion.recommend_hybrid)
# distinguir una predicción con señal real de un promedio de relleno. Es la
# base del arreglo que desbloqueó al CF-KNN: antes el proxy de calidad ganaba
# SIEMPRE para POIs locales y predict_cf_pearson nunca se ejecutaba.
# ---------------------------------------------------------------------------

def test_with_source_sin_senal_devuelve_fallback_mean():
    reset_prediction_stats()
    score, source = predict_cf_pearson_with_source('u1', 'i1', _FakeEngineColdStart())
    assert source == 'fallback_mean'
    assert source not in REAL_SIGNAL_SOURCES  # el ranking NO debe usar este score
    assert score == 4.0


def test_with_source_es_consistente_con_predict_cf_pearson():
    """Ambas APIs deben dar el mismo score — with_source solo agrega la fuente."""
    engine = _FakeEngineColdStart()
    reset_prediction_stats()
    solo_score = predict_cf_pearson('u1', 'i1', engine)
    reset_prediction_stats()
    score, _ = predict_cf_pearson_with_source('u1', 'i1', engine)
    assert solo_score == score


def test_with_source_tambien_cuenta_en_las_estadisticas():
    reset_prediction_stats()
    predict_cf_pearson_with_source('u1', 'i1', _FakeEngineColdStart())
    stats = get_prediction_stats()
    assert stats['total'] == 1
    assert stats['fallback_mean'] == 1


def test_real_signal_sources_no_incluye_el_relleno():
    """Guarda de regresión: si alguien agrega 'fallback_mean' a las fuentes
    'reales', el ranking volvería a usar promedios sin información como si
    fueran señal colaborativa — justo el bug que este arreglo resuelve."""
    assert 'fallback_mean' not in REAL_SIGNAL_SOURCES
    assert 'knn' in REAL_SIGNAL_SOURCES
    assert 'svd' in REAL_SIGNAL_SOURCES
