"""
Tests para src/cf.py — instrumentación de qué "camino" toma cada predicción
de CF (knn real / svd fallback / fallback constante a la media).

Contexto: 198K usuarios vs 233 items en Yelp = matriz muy dispersa. La
sospecha es que la mayoría de las predicciones de evaluación caen en
'fallback_mean' (sin señal real de vecinos), lo que explica por qué CF no
le gana al baseline. Este contador permite medirlo objetivamente en vez
de asumirlo.
"""
from cf import predict_cf_pearson, reset_prediction_stats, get_prediction_stats


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
