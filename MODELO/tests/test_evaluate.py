"""
Smoke tests para las métricas de ranking puras de src/evaluate.py.

src/evaluate.py y src/optimize_alpha.py SÍ importan limpiamente sin SKIP_MODEL_BOOT
ni DB real (solo dependen de sklearn/numpy + módulos locales, sin efectos
secundarios a nivel de import). Sin embargo, sus funciones de "orquestación"
principales (evaluar_modelo(), evaluar_predicciones(), evaluar_ranking(),
optimize()) instancian SmarturEngine(data_source='mexico') y requieren los
CSV/datos reales de Yelp + un SmarturContextModel entrenado — no son aptas
para un smoke test rápido y aisladas de datos.

Por eso solo cubrimos aquí las funciones puras de métricas de ranking
(dcg_at_k, ndcg_at_k, precision_at_k, hit_rate_at_k), que no requieren ni
engine ni modelos y sí tienen lógica propia que vale la pena verificar.
optimize_alpha.py no expone funciones puras adicionales fuera de optimize()
(su lógica de _ranking_metrics está anidada dentro de la función principal),
así que no se agrega un test dedicado para ese módulo — solo se confirmó
manualmente que `import optimize_alpha` no falla.
"""
import pytest

from evaluate import dcg_at_k, ndcg_at_k, precision_at_k, hit_rate_at_k


def test_dcg_at_k_perfect_order():
    # Relevancias en orden ideal descendente
    relevances = [3.0, 2.0, 1.0]
    dcg = dcg_at_k(relevances, k=3)
    import math
    expected = sum(r / math.log2(i + 2) for i, r in enumerate(relevances))
    assert dcg == pytest.approx(expected)


def test_dcg_at_k_empty_returns_zero():
    assert dcg_at_k([], k=5) == 0.0


def test_ndcg_at_k_perfect_ranking_is_one():
    # Si el orden ya es ideal (descendente), NDCG debe ser 1.0
    relevances = [3.0, 2.0, 1.0, 0.0]
    assert ndcg_at_k(relevances, k=4) == pytest.approx(1.0)


def test_ndcg_at_k_worst_ranking_is_less_than_one():
    # Orden invertido (peor caso) debe dar NDCG < 1.0 (asumiendo relevancias no todas iguales)
    relevances = [0.0, 1.0, 2.0, 3.0]
    ndcg = ndcg_at_k(relevances, k=4)
    assert 0.0 <= ndcg < 1.0


def test_ndcg_at_k_all_zero_relevance_is_zero():
    assert ndcg_at_k([0.0, 0.0, 0.0], k=3) == 0.0


def test_precision_at_k_counts_hits_correctly():
    recommended = ['a', 'b', 'c', 'd']
    relevant = {'b', 'd', 'z'}
    # top-2 = ['a','b'] -> 1 hit de 2
    assert precision_at_k(recommended, relevant, k=2) == pytest.approx(0.5)
    # top-4 = todos -> 2 hits de 4
    assert precision_at_k(recommended, relevant, k=4) == pytest.approx(0.5)


def test_precision_at_k_empty_list_is_zero():
    assert precision_at_k([], {'a'}, k=5) == 0.0


def test_hit_rate_at_k_hit_and_miss():
    recommended = ['a', 'b', 'c']
    assert hit_rate_at_k(recommended, {'c', 'z'}, k=3) == 1.0
    assert hit_rate_at_k(recommended, {'z'}, k=3) == 0.0
