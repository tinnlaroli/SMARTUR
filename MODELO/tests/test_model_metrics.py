"""
Tests para src/model_metrics.py — selección de "mejor algoritmo".

No se mockea todo compare_algorithms() (requeriría un engine/rf_model/gbm_model
completos); en vez de eso se verifica la lógica de selección de candidatos
aislada, replicando exactamente cómo se arma el dict `candidates` en
compare_algorithms() (model_metrics.py) y _compute_simple_metrics() (api.py).

Contexto del bug que estos tests cubren: antes, 'baseline' (predecir el
promedio simple) se excluía a propósito del dict `candidates`, así que
`best_algorithm` NUNCA podía ser 'baseline' aunque tuviera el menor RMSE.
Eso ocultaba que CF/RF/híbrido no le ganaban a un promedio constante.
"""


def _select_best_algorithm(algorithms_rmse: dict[str, float]) -> str:
    """Replica la selección real: candidates ahora SÍ incluye 'baseline'."""
    candidates = dict(algorithms_rmse)
    return min(candidates, key=candidates.get)


def test_baseline_puede_ganar_si_tiene_menor_rmse():
    # Caso real observado en producción: baseline le gana a todo lo demás.
    rmse = {
        'baseline': 0.9113,
        'cf_knn_pearson': 0.9198,
        'random_forest': 2.2273,
        'hybrid_cf_rf': 0.9198,
    }
    assert _select_best_algorithm(rmse) == 'baseline'


def test_hybrid_gana_cuando_realmente_tiene_menor_rmse():
    rmse = {
        'baseline': 0.95,
        'cf_knn_pearson': 0.90,
        'random_forest': 1.10,
        'hybrid_cf_rf': 0.80,
    }
    assert _select_best_algorithm(rmse) == 'hybrid_cf_rf'


def test_baseline_no_gana_si_algoritmo_real_es_mejor():
    rmse = {
        'baseline': 1.0,
        'cf_knn_pearson': 0.7,
        'random_forest': 0.8,
        'hybrid_cf_rf': 0.65,
    }
    best = _select_best_algorithm(rmse)
    assert best != 'baseline'
    assert best == 'hybrid_cf_rf'
