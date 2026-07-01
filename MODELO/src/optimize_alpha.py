"""
Grid-search para encontrar el alpha optimo del sistema hibrido SMARTUR.

Prueba valores de 0.0 a 1.0 y reporta dos familias de metricas por alpha:
  - RMSE / MAE   (error de prediccion punto a punto)
  - NDCG@5 / Precision@5  (calidad de ranking sobre los items held-out
    de cada usuario — lo que realmente ve el turista en el top-N)

El alpha recomendado se elige por NDCG, no por RMSE: para recomendacion
top-N importa el ORDEN de los items, no el error absoluto de la estrella
predicha. (El RMSE del hibrido puede ser peor que el baseline de media
global y aun asi rankear mucho mejor.)
"""
import sys
from collections import defaultdict

import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error
from math import sqrt
from engine import SmarturEngine
from rf_model import SmarturContextModel
from cf import predict_cf_pearson
from evaluate import _infer_user_context, ndcg_at_k, precision_at_k


def optimize(sample_size=1000):
    print("=== Optimizacion de alpha para SMARTUR v2 ===\n")

    engine = SmarturEngine(data_source='mexico')
    engine.prepare_pearson_matrix()

    context_model = SmarturContextModel()
    context_model.train(engine.train_data)

    n_eval = min(sample_size, len(engine.test_data))
    test_sample = engine.test_data.sample(n_eval, random_state=42)

    actuals, cf_preds, rf_preds = [], [], []
    errores = 0

    total = len(test_sample)
    print(f"Pre-computando contextos de usuario para {len(test_sample['user_id'].unique())} usuarios...")
    user_contexts = {uid: _infer_user_context(uid, engine) for uid in test_sample['user_id'].unique()}

    print(f"Pre-computando {n_eval} predicciones CF y RF con contexto...")
    # Por-usuario: listas paralelas de (actual, p_cf, p_rf) para ranking held-out
    per_user = defaultdict(lambda: {'actual': [], 'cf': [], 'rf': []})

    for idx, (_, row) in enumerate(test_sample.iterrows()):
        if idx % 100 == 0:
            sys.stdout.write(f"\r  Progreso: {idx}/{total} ({idx/total*100:.0f}%)")
            sys.stdout.flush()
        try:
            p_cf = predict_cf_pearson(row['user_id'], row['business_id'], engine)
            user_ctx = user_contexts.get(row['user_id'])
            p_rf = float(context_model.predict_with_context([row['business_id']], user_context=user_ctx)[0])
            if np.isnan(p_cf) or np.isnan(p_rf):
                errores += 1
                continue
            actuals.append(row['stars'])
            cf_preds.append(p_cf)
            rf_preds.append(p_rf)
            u = per_user[row['user_id']]
            u['actual'].append(float(row['stars']))
            u['cf'].append(p_cf)
            u['rf'].append(p_rf)
        except Exception:
            errores += 1

    print(f"\r  Progreso: {total}/{total} (100%)     ")

    actuals = np.array(actuals)
    cf_preds = np.array(cf_preds)
    rf_preds = np.array(rf_preds)

    # Solo usuarios con >= 3 items held-out permiten medir ranking con sentido
    rank_users = {
        uid: {k: np.array(v) for k, v in d.items()}
        for uid, d in per_user.items()
        if len(d['actual']) >= 3
    }

    print(f"\nPredicciones validas: {len(actuals)} (errores: {errores})")
    print(f"Usuarios con >= 3 items held-out para ranking: {len(rank_users)}\n")

    def _ranking_metrics(alpha, k=5, relevance_threshold=4.0):
        """NDCG@k y Precision@k promediados sobre usuarios elegibles."""
        ndcgs, precs = [], []
        for d in rank_users.values():
            scores = alpha * d['cf'] + (1 - alpha) * d['rf']
            order = np.argsort(-scores)                # mejor score primero
            ranked_relevances = d['actual'][order].tolist()
            ndcgs.append(ndcg_at_k(ranked_relevances, k))
            # Precision@k: items relevantes = rating real >= threshold
            relevant_idx = set(np.where(d['actual'] >= relevance_threshold)[0].tolist())
            if relevant_idx:
                precs.append(precision_at_k(order.tolist(), relevant_idx, k))
        return (
            float(np.mean(ndcgs)) if ndcgs else 0.0,
            float(np.mean(precs)) if precs else 0.0,
        )

    # Grid search
    alphas = np.arange(0.0, 1.05, 0.1)
    best_alpha_rmse, best_rmse = 0.0, float('inf')
    best_alpha_ndcg, best_ndcg = 0.0, -1.0

    print("  alpha |  RMSE   |  MAE    | NDCG@5  | Prec@5")
    print("  ------|---------|---------|---------|--------")

    rows = []
    for alpha in alphas:
        hybrid = alpha * cf_preds + (1 - alpha) * rf_preds
        rmse = sqrt(mean_squared_error(actuals, hybrid))
        mae = mean_absolute_error(actuals, hybrid)
        ndcg, prec = _ranking_metrics(alpha)
        rows.append((alpha, rmse, mae, ndcg, prec))
        if rmse < best_rmse:
            best_rmse, best_alpha_rmse = rmse, alpha
        if ndcg > best_ndcg:
            best_ndcg, best_alpha_ndcg = ndcg, alpha

    for alpha, rmse, mae, ndcg, prec in rows:
        markers = []
        if alpha == best_alpha_rmse:
            markers.append('mejor RMSE')
        if alpha == best_alpha_ndcg:
            markers.append('mejor NDCG')
        suffix = f"  <-- {', '.join(markers)}" if markers else ''
        print(f"  {alpha:.1f}   | {rmse:.4f}  | {mae:.4f}  | {ndcg:.4f}  | {prec:.4f}{suffix}")

    print(f"\n===============================================")
    print(f"  ALPHA RECOMENDADO (por NDCG@5): {best_alpha_ndcg:.1f}")
    print(f"    NDCG@5 = {best_ndcg:.4f}")
    print(f"  (por RMSE seria {best_alpha_rmse:.1f}, RMSE = {best_rmse:.4f})")
    print(f"===============================================")
    print(f"\nActualiza alpha={best_alpha_ndcg} en fusion.py, api.py y clientes")
    print("(el ranking top-N es lo que ve el usuario; RMSE es secundario).")

    return best_alpha_ndcg


if __name__ == "__main__":
    optimize()
