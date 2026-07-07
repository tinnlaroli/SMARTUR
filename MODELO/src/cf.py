import numpy as np

# Contador de qué "camino" toma cada predicción de CF — instrumentación para
# medir qué tan seguido el KNN cae en el fallback constante (media global/del
# usuario) en vez de predecir con señal real. Con 198K usuarios y 233 items
# en el dataset de Yelp, la sospecha es que la mayoría de las predicciones
# de evaluación caen en 'fallback_mean', lo que explicaría por qué el
# baseline (predecir la media) le gana a CF en RMSE. No es thread-safe a
# propósito: los loops de evaluación (compare_algorithms, _compute_simple_
# metrics) corren secuenciales en un solo proceso.
_prediction_source_counts = {'knn': 0, 'svd': 0, 'fallback_mean': 0}


def reset_prediction_stats():
    """Reinicia los contadores — llamar antes de un batch de evaluación."""
    global _prediction_source_counts
    _prediction_source_counts = {'knn': 0, 'svd': 0, 'fallback_mean': 0}


def get_prediction_stats() -> dict:
    """Devuelve los contadores acumulados desde el último reset, más el %
    de predicciones que NO tuvieron señal real de vecinos (fallback_mean)."""
    counts = dict(_prediction_source_counts)
    total = sum(counts.values())
    counts['total'] = total
    counts['fallback_rate'] = round(counts['fallback_mean'] / total, 4) if total > 0 else None
    return counts


def predict_cf_pearson(user_id, item_id, engine, k=20):
    """
    Predicción utilizando Filtrado Colaborativo Basado en Memoria (K-NN user-based approach).
    Predice la puntuación (1 a 5 estrellas) matemática extrapolada que un `user_id` le otorgaría
    a un `item_id` determinado, en base as su similitud vectorial (con coseno geométrico) respecto
    a una vecindad con los K-usuarios más similares a su perfil.

    Fórmula Matemática general:
        Pred = Media_u + Σ(Sim · (Rating_v − Media_v)) / Σ|Sim|

    Args:
        user_id (str): Identificador textual en la db del usuario objetivo.
        item_id (str): Identificador de Yelp o negocio a calificar.
        engine (SmarturEngine): Referencia general en memoria al Motor construido con scikit Sparse matrix.
        k (int): Cantidad máxima de vecinos a buscar.
        
    Returns:
        float: Una predicción de puntaje inferido delimitado (clip) entre 1.0 y 5.0. 
               Devuelve por defecto la media del individuo si no hay datos de vecinos disponibles.
    """
    user_idx = engine.get_user_idx(user_id)
    item_idx = engine.get_biz_idx(item_id)

    if user_idx is None or item_idx is None:
        # Si el usuario o el item solicitado sufren de cold-start total
        _prediction_source_counts['fallback_mean'] += 1
        return engine.train_data['stars'].mean()

    user_vector = engine.matrix_centered[user_idx]
    n_neighbors = min(k + 1, engine.matrix_centered.shape[0])
    distances, indices = engine.knn_model.kneighbors(
        user_vector, n_neighbors=n_neighbors
    )

    neighbor_indices = indices[0]
    similarities = 1 - distances[0]

    weighted_sum = 0.0
    sim_sum = 0.0

    for i, neighbor_id in enumerate(neighbor_indices):
        if neighbor_id == user_idx:
            continue

        rating = engine.user_item_matrix[neighbor_id, item_idx]
        if rating > 0:
            diff = engine.matrix_centered[neighbor_id, item_idx]
            weighted_sum += similarities[i] * diff
            sim_sum += abs(similarities[i])

    user_mean = float(engine.user_means[user_id])
    if np.isnan(user_mean):
        user_mean = float(engine.train_data['stars'].mean())

    if sim_sum == 0:
        # No KNN neighbors rated this item -> try SVD dot-product for a better estimate
        if hasattr(engine, 'user_latent') and hasattr(engine, 'item_latent'):
            u = engine.user_index.get(user_id)
            it = engine.item_index.get(item_id)
            if u is not None and it is not None:
                try:
                    svd_pred = float(np.dot(engine.user_latent[u], engine.item_latent[it]))
                    # SVD output is on centered scale; shift back to [1, 5]
                    svd_pred = float(np.clip(svd_pred + user_mean, 1, 5))
                    if not np.isnan(svd_pred):
                        _prediction_source_counts['svd'] += 1
                        return svd_pred
                    _prediction_source_counts['fallback_mean'] += 1
                    return user_mean
                except Exception:
                    pass
        _prediction_source_counts['fallback_mean'] += 1
        return user_mean

    prediction = user_mean + (weighted_sum / sim_sum)
    result = float(np.clip(prediction, 1, 5))
    if np.isnan(result):
        _prediction_source_counts['fallback_mean'] += 1
        return user_mean
    _prediction_source_counts['knn'] += 1
    return result
