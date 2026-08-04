"""
Tests para el relevo automático de criterio de selección (RMSE -> NDCG):
api._apply_ranking_based_selection.

Verifica que el sistema solo cambie su métrica-norte a NDCG cuando el ranking
es CONFIABLE (evaluación local sobre >= min_users usuarios reales), y que en
todos los demás casos conserve el RMSE como proxy estable.
"""
import os

os.environ.setdefault('SKIP_MODEL_BOOT', '1')
os.environ.setdefault('POI_DB_HOST', 'localhost')
os.environ.setdefault('POI_DB_NAME', 'smartur')
os.environ.setdefault('POI_DB_USER', 'postgres')
os.environ.setdefault('POI_DB_PASSWORD', '')

import api  # noqa: E402


def _base_metrics():
    """Métricas típicas post-entrenamiento, con criterio RMSE ya fijado."""
    return {
        'best_algorithm': 'hybrid_cf_rf',
        'selection_metric': 'rmse',
        'selection_rationale': 'Seleccionado por menor RMSE (0.900).',
    }


def test_ranking_confiable_cambia_a_ndcg():
    m = _base_metrics()
    m['ranking'] = {'ndcg': 0.72, 'precision': 0.6, 'hit_rate': 0.8,
                    'preference_match_rate': 0.65, 'n_users_evaluated': 25}
    api._apply_ranking_based_selection(m)
    assert m['selection_metric'] == 'ndcg'
    assert 'NDCG@5 = 0.720' in m['selection_rationale']
    assert '25 usuarios reales' in m['selection_rationale']
    assert '65.0%' in m['selection_rationale']  # preference match formateado


def test_pocos_usuarios_mantiene_rmse():
    m = _base_metrics()
    m['ranking'] = {'ndcg': 0.9, 'n_users_evaluated': 12}  # < 20
    api._apply_ranking_based_selection(m)
    assert m['selection_metric'] == 'rmse'


def test_umbral_exacto_es_confiable():
    m = _base_metrics()
    m['ranking'] = {'ndcg': 0.5, 'n_users_evaluated': 20}  # == min_users
    api._apply_ranking_based_selection(m)
    assert m['selection_metric'] == 'ndcg'


def test_sin_ranking_mantiene_rmse():
    m = _base_metrics()
    api._apply_ranking_based_selection(m)
    assert m['selection_metric'] == 'rmse'


def test_ranking_con_error_mantiene_rmse():
    m = _base_metrics()
    m['ranking'] = {'error': 'sin datos', 'n_users_evaluated': 30}
    api._apply_ranking_based_selection(m)
    assert m['selection_metric'] == 'rmse'


def test_ndcg_none_mantiene_rmse():
    m = _base_metrics()
    m['ranking'] = {'ndcg': None, 'n_users_evaluated': 30}
    api._apply_ranking_based_selection(m)
    assert m['selection_metric'] == 'rmse'


def test_modo_sintetico_nunca_usa_ndcg():
    """Aunque el ranking sea 'confiable', en modo sintético no se representa a
    usuarios reales — debe conservar el criterio previo."""
    m = _base_metrics()
    m['synthetic_augmented'] = True
    m['ranking'] = {'ndcg': 0.99, 'n_users_evaluated': 500}
    api._apply_ranking_based_selection(m)
    assert m['selection_metric'] == 'rmse'


def test_preference_match_ausente_no_rompe():
    m = _base_metrics()
    m['ranking'] = {'ndcg': 0.42, 'n_users_evaluated': 22}  # sin preference_match_rate
    api._apply_ranking_based_selection(m)
    assert m['selection_metric'] == 'ndcg'
    assert 'NDCG@5 = 0.420' in m['selection_rationale']
