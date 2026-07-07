"""
Tests para src/engine.py — filtro k-core (Fase 1 del plan de mejora del
modelo: densificar el dataset de entrenamiento).

No se instancia SmarturEngine completo (requiere CSVs reales en disco) —
se testea _apply_k_core_filter de forma aislada con DataFrames sintéticos.
"""
import pandas as pd

from engine import _apply_k_core_filter, K_CORE_MIN_INTERACTIONS


def _make_df(user_counts: dict[str, int]) -> pd.DataFrame:
    """user_counts = {'u1': 3, 'u2': 1, ...} -> genera esa cantidad de filas por usuario."""
    rows = []
    for uid, n in user_counts.items():
        for i in range(n):
            rows.append({'user_id': uid, 'business_id': f'b{i}', 'stars': 4.0})
    return pd.DataFrame(rows)


def test_filtra_usuarios_con_pocas_interacciones():
    # u1 tiene 10 (queda), u2 tiene 1 (se va), u3 tiene 6 (queda)
    df = _make_df({'u1': 10, 'u2': 1, 'u3': 6})
    # Rellenar con más usuarios de bajo historial para superar el safety net (500 filas)
    extra = {f'padding_{i}': 8 for i in range(70)}
    df = pd.concat([df, _make_df(extra)], ignore_index=True)

    out = _apply_k_core_filter(df, min_interactions=5)
    assert 'u2' not in set(out['user_id'])
    assert 'u1' in set(out['user_id'])
    assert 'u3' in set(out['user_id'])


def test_respeta_min_interactions_configurable():
    df = _make_df({'u1': 3, 'u2': 5})
    extra = {f'padding_{i}': 8 for i in range(70)}
    df = pd.concat([df, _make_df(extra)], ignore_index=True)

    out = _apply_k_core_filter(df, min_interactions=5)
    assert 'u1' not in set(out['user_id'])  # 3 < 5
    assert 'u2' in set(out['user_id'])      # 5 >= 5


def test_safety_net_devuelve_sin_filtrar_si_queda_muy_chico():
    # Dataset sintético pequeño (como en otros tests): filtrar dejaría
    # menos de 500 filas -> debe devolver el df original sin tocar.
    df = _make_df({'u1': 3, 'u2': 2, 'u3': 1})
    out = _apply_k_core_filter(df, min_interactions=5)
    assert len(out) == len(df)


def test_default_min_interactions_es_la_constante_del_modulo():
    df = _make_df({'u1': K_CORE_MIN_INTERACTIONS - 1, 'u2': K_CORE_MIN_INTERACTIONS})
    extra = {f'padding_{i}': 8 for i in range(70)}
    df = pd.concat([df, _make_df(extra)], ignore_index=True)

    out = _apply_k_core_filter(df)  # sin pasar min_interactions explícito
    assert 'u1' not in set(out['user_id'])
    assert 'u2' in set(out['user_id'])


def test_df_vacio_no_falla():
    df = pd.DataFrame(columns=['user_id', 'business_id', 'stars'])
    out = _apply_k_core_filter(df)
    assert out.empty


def test_sin_columna_user_id_devuelve_igual():
    df = pd.DataFrame({'foo': [1, 2, 3]})
    out = _apply_k_core_filter(df)
    assert out is df or out.equals(df)
