"""
Tests para src/lightfm_model.py — _predict_with_context_features.

Cubre el bug real encontrado en logs de producción: "index out of bounds"
al calcular predicciones con contexto. Causa raíz confirmada leyendo el
código fuente real de lightfm.data.Dataset.fit_partial()/_FeatureBuilder:
uf_map (user_feature_map) y las columnas de item_features_matrix YA vienen
con el offset de identidad aplicado internamente por LightFM (identidades
primero, features declaradas después, mismo contador) — el código sumaba
n_users/n_items una segunda vez, duplicando el offset.

No se instala/importa lightfm real aquí (pesado, no disponible en este
entorno de test) — se simula la estructura mínima que LightFM produce
realmente (confirmado contra el código fuente de la librería en el
contenedor de producción) usando numpy/scipy puro.
"""
import numpy as np
import scipy.sparse as sp

from lightfm_model import SmarturLightFMModel


def _make_fake_model():
    """
    3 usuarios (identidad: índices 0-2) + 2 features de usuario (índices 3-4)
    2 ítems (identidad: índices 0-1) + 1 feature de ítem (índice 2)
    — misma convención de offset que LightFM real: identidad primero,
    features después, en el mismo contador.
    """
    m = object.__new__(SmarturLightFMModel)
    m.is_fitted = True

    class _FakeDataset:
        def mapping(self):
            user_id_map = {'u1': 0, 'u2': 1, 'u3': 2}
            uf_map = {
                'u1': 0, 'u2': 1, 'u3': 2,  # identidad (igual índice que user_id_map)
                'uf:tur_naturaleza': 3, 'uf:budget_2': 4,  # features declaradas
            }
            item_id_map = {'i1': 0, 'i2': 1}
            if_map = {'i1': 0, 'i2': 1, 'if:price_2': 2}
            return user_id_map, uf_map, item_id_map, if_map

    m._dataset = _FakeDataset()

    k = 4  # no_components
    n_user_rows = 5  # 3 identidad + 2 features
    n_item_rows = 3  # 2 identidad + 1 feature
    rng = np.random.default_rng(42)

    class _FakeLightFM:
        no_components = k
        user_embeddings = rng.normal(size=(n_user_rows, k)).astype(np.float32)
        user_biases = rng.normal(size=n_user_rows).astype(np.float32)
        item_embeddings = rng.normal(size=(n_item_rows, k)).astype(np.float32)
        item_biases = rng.normal(size=n_item_rows).astype(np.float32)

    m._model = _FakeLightFM()

    # item_features_matrix: fila por ítem, cada fila incluye su propia
    # columna de identidad (LightFM la agrega automáticamente) + features.
    row = [0, 1]
    col = [0, 1]  # identidad de i1 en col 0, identidad de i2 en col 1
    data = [1.0, 1.0]
    # ambos ítems comparten la feature 'if:price_2' (col 2)
    row += [0, 1]
    col += [2, 2]
    data += [1.0, 1.0]
    m._item_features_matrix = sp.csr_matrix((data, (row, col)), shape=(2, 3))

    m._known_users = {'u1', 'u2', 'u3'}
    m._known_items = {'i1', 'i2'}
    return m


def test_predict_with_context_no_index_error():
    """El caso exacto que fallaba en producción: no debe lanzar IndexError."""
    m = _make_fake_model()
    scores = m.predict('u1', ['i1', 'i2'], user_context={'tiposTurismo': ['naturaleza'], 'presupuesto_bucket': 'medio'})
    assert len(scores) == 2
    for s in scores:
        assert 1.0 <= s <= 5.0


def test_predict_with_context_unknown_item_falls_back_to_neutral():
    m = _make_fake_model()
    scores = m.predict('u1', ['i1', 'no_existe'], user_context={'tiposTurismo': ['naturaleza']})
    assert len(scores) == 2
    assert scores[1] == 3.0  # ítem desconocido -> score neutro


def test_predict_with_context_partial_tag_match_does_not_crash():
    m = _make_fake_model()
    # Solo 'uf:budget_2' existe en el uf_map simulado — el resto de tags
    # generados (group/pref_food) no están, no debe fallar por eso.
    scores = m.predict('u1', ['i1'], user_context={'tiposTurismo': ['tag_inexistente']})
    assert len(scores) == 1
    assert 1.0 <= scores[0] <= 5.0
