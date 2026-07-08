"""
Tests para src/cross_validation.py — k-fold cross-validation de CF/RF/GBM.

No se mockea el pipeline completo de RF/GBM (requeriría replicar toda la
tabla de negocios + features de contexto de rf_model.py, que ya está
cubierto por sus propios tests). Aquí se testea:
  - _rmse_mae (matemática pura)
  - _make_fold_engine + CF Pearson sobre un fold sintético (el camino que
    no depende de features de negocio)
La integración completa de run_kfold_cv (CF + RF + GBM juntos) se verificó
manualmente contra los datos reales de producción — ver notas de la sesión.
"""
import numpy as np
import pandas as pd

from cross_validation import _rmse_mae, _make_fold_engine


def test_rmse_mae_caso_perfecto():
    m = _rmse_mae([4.0, 5.0, 3.0], [4.0, 5.0, 3.0])
    assert m['rmse'] == 0.0
    assert m['mae'] == 0.0


def test_rmse_mae_caso_con_error():
    m = _rmse_mae([5.0, 5.0], [4.0, 3.0])
    assert m['mae'] == 1.5
    assert m['rmse'] > m['mae']  # RMSE penaliza más los errores grandes


def test_make_fold_engine_permite_prediccion_cf():
    train_fold = pd.DataFrame({
        'user_id':     ['u1', 'u1', 'u2', 'u2', 'u3'],
        'business_id': ['b1', 'b2', 'b1', 'b2', 'b1'],
        'stars':       [5, 4, 4, 5, 3],
    })
    df_biz = pd.DataFrame({'business_id': ['b1', 'b2'], 'categories': ['restaurant', 'hotel']})

    fold_engine = _make_fold_engine(train_fold, df_biz)

    assert fold_engine.user_item_matrix is not None
    assert fold_engine.knn_model is not None
    # Usuario/negocio conocidos en el fold -> debe devolver una predicción válida en rango
    from cf import predict_cf_pearson
    pred = predict_cf_pearson('u1', 'b1', fold_engine)
    assert 1.0 <= pred <= 5.0


def test_make_fold_engine_cold_start_usuario_desconocido():
    train_fold = pd.DataFrame({
        'user_id':     ['u1', 'u2'],
        'business_id': ['b1', 'b1'],
        'stars':       [5, 4],
    })
    df_biz = pd.DataFrame({'business_id': ['b1'], 'categories': ['restaurant']})
    fold_engine = _make_fold_engine(train_fold, df_biz)

    from cf import predict_cf_pearson
    pred = predict_cf_pearson('usuario_no_visto', 'b1', fold_engine)
    assert pred == np.mean([5, 4])  # fallback a la media global del fold
