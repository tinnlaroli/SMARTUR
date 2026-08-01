"""
Tests para src/synthetic_training.py — modo de entrenamiento sintético opt-in.

Cubre lo que no depende de I/O ni de un engine completo:
  - synth_training_enabled(): OFF por defecto, ON solo con valores afirmativos.
  - synth_n_personas(): default y override por env, con manejo de valores inválidos.
  - build_synthetic_ratings/split: generan estructura latente APRENDIBLE
    (usuarios que se repiten en varios ítems) — lo contrario del dataset base.
"""
import os

import pandas as pd
import pytest

import synthetic_training as st


@pytest.fixture
def biz_df():
    """Catálogo mínimo con categorías mapeables a tipos de turismo."""
    return pd.DataFrame({
        'business_id': [f'poi_{i}' for i in range(12)],
        'categories': [
            'Parks, Hiking', 'Museums, History', 'Restaurants, Food',
            'Nature, Botanical', 'Landmarks, Cathedral', 'Hiking, Mountain',
            'Cafes, Market', 'Hacienda, Rural', 'Waterfall, Outdoor',
            'Monument, Museum', 'Gastronomy, Restaurants', 'Volcano, Adventure',
        ],
        'price_level': [1, 2, 3, 2, 4, 1, 2, 3, 1, 2, 3, 4],
    })


@pytest.fixture(autouse=True)
def _clean_env():
    """Aísla las variables de entorno del modo sintético entre tests."""
    saved = {k: os.environ.get(k) for k in ('SMARTUR_SYNTH_TRAINING', 'SMARTUR_SYNTH_PERSONAS')}
    for k in saved:
        os.environ.pop(k, None)
    yield
    for k, v in saved.items():
        if v is None:
            os.environ.pop(k, None)
        else:
            os.environ[k] = v


def test_disabled_by_default():
    assert st.synth_training_enabled() is False


@pytest.mark.parametrize('val', ['1', 'true', 'TRUE', 'yes', 'on', 'Y', 't'])
def test_enabled_with_truthy_values(val):
    os.environ['SMARTUR_SYNTH_TRAINING'] = val
    assert st.synth_training_enabled() is True


@pytest.mark.parametrize('val', ['0', 'false', 'no', 'off', '', 'nope'])
def test_disabled_with_falsy_values(val):
    os.environ['SMARTUR_SYNTH_TRAINING'] = val
    assert st.synth_training_enabled() is False


def test_n_personas_default():
    assert st.synth_n_personas() == st._DEFAULT_N_PERSONAS


def test_n_personas_override():
    os.environ['SMARTUR_SYNTH_PERSONAS'] = '150'
    assert st.synth_n_personas() == 150


def test_n_personas_invalid_falls_back_to_default():
    os.environ['SMARTUR_SYNTH_PERSONAS'] = 'abc'
    assert st.synth_n_personas() == st._DEFAULT_N_PERSONAS
    os.environ['SMARTUR_SYNTH_PERSONAS'] = '-5'
    assert st.synth_n_personas() == st._DEFAULT_N_PERSONAS


def test_build_ratings_has_learnable_structure(biz_df):
    """La diferencia clave con el dataset base: los usuarios se REPITEN en
    varios ítems (>=2 ratings), que es lo que permite al CF/RF aprender."""
    ratings = st.build_synthetic_ratings(biz_df, n_personas=60, save_backup=False)
    assert set(ratings.columns) == {'user_id', 'business_id', 'stars'}
    assert len(ratings) > 60  # más ratings que personas -> hay repetición
    # Al menos la mayoría de las personas calificó 2+ ítems (estructura densa).
    repeat_rate = (ratings.groupby('user_id').size() >= 2).mean()
    assert repeat_rate >= 0.8
    # Ratings en el rango válido de estrellas.
    assert ratings['stars'].between(1, 5).all()


def test_build_split_is_deterministic_and_partitions(biz_df):
    train1, test1 = st.build_synthetic_split(biz_df, n_personas=50)
    train2, test2 = st.build_synthetic_split(biz_df, n_personas=50)
    # Semilla fija -> reproducible.
    assert train1.equals(train2)
    assert test1.equals(test2)
    # Partición ~80/20 sin solaparse en tamaño total.
    total = len(train1) + len(test1)
    assert abs(len(test1) / total - 0.2) < 0.05
