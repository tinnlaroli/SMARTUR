"""
SMARTUR Evaluación v3
Incluye métricas de predicción (RMSE, MAE) y métricas de ranking (NDCG@K, Precision@K, Hit Rate@K).
"""
import sys
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error
from math import sqrt, log2
from engine import SmarturEngine
from rf_model import SmarturContextModel
from cf import predict_cf_pearson
from fusion import recommend_hybrid
from context_encoder import MAPEO_CATEGORIAS


def _infer_user_context(user_id, engine):
    """
    Deriva un contexto aproximado del usuario desde su historial de ratings en el
    set de entrenamiento. Permite evaluar el sistema en condiciones cercanas a las
    reales (con contexto) en lugar del modo cold-start sin preferencias.
    """
    user_train = engine.train_data[engine.train_data['user_id'] == user_id]
    if user_train.empty:
        return None

    user_data = user_train.merge(
        engine.df_biz[['business_id', 'categories', 'price_level', 'is_romantic', 'is_good_for_kids']],
        on='business_id', how='left'
    )
    liked = user_data[user_data['stars'] >= 4]

    cats_liked = ' '.join(liked['categories'].fillna('').str.lower())
    tipos = [
        t for t, cats in MAPEO_CATEGORIAS.items()
        if any(c.lower() in cats_liked for c in cats)
    ]

    budget_mean = liked['price_level'].mean() if not liked.empty else 2.0
    budget_val = int(round(float(budget_mean))) if not np.isnan(float(budget_mean)) else 2
    budget_val = max(1, min(4, budget_val))
    budget = {1: 'bajo', 2: 'medio', 3: 'alto', 4: 'premium'}[budget_val]

    likes_romantic = bool(liked['is_romantic'].eq(1).any()) if 'is_romantic' in liked.columns else False
    likes_kids = bool(liked['is_good_for_kids'].eq(1).any()) if 'is_good_for_kids' in liked.columns else False

    if likes_kids:
        group = 'familia'
    elif likes_romantic:
        group = 'pareja'
    else:
        group = 'solo'

    return {
        'tiposTurismo': tipos or ['cultural'],
        'presupuesto_bucket': budget,
        'group_type': group,
        'edad_range': '25-34',
        'wants_tours': False,
        'needs_hotel': False,
        'pref_food': True,
        'requiere_accesibilidad': False,
        'pref_outdoor': False,
    }


# ---------------------------------------------------------------------------
# Métricas de Ranking
# ---------------------------------------------------------------------------

def dcg_at_k(relevances, k):
    """Discounted Cumulative Gain para los primeros k elementos."""
    relevances = np.array(relevances[:k], dtype=float)
    if len(relevances) == 0:
        return 0.0
    discounts = np.array([1.0 / log2(i + 2) for i in range(len(relevances))])
    return float(np.sum(relevances * discounts))


def ndcg_at_k(relevances, k):
    """Normalized DCG: DCG@k / IDCG@k (ranking ideal)."""
    actual_dcg = dcg_at_k(relevances, k)
    ideal_relevances = sorted(relevances, reverse=True)
    ideal_dcg = dcg_at_k(ideal_relevances, k)
    if ideal_dcg == 0:
        return 0.0
    return actual_dcg / ideal_dcg


def precision_at_k(recommended_ids, relevant_ids, k):
    """Fracción de los top-K recomendados que son realmente relevantes."""
    top_k = recommended_ids[:k]
    if len(top_k) == 0:
        return 0.0
    hits = sum(1 for rid in top_k if rid in relevant_ids)
    return hits / len(top_k)


def hit_rate_at_k(recommended_ids, relevant_ids, k):
    """1 si al menos un favorito aparece en top-K, 0 si no."""
    top_k = set(recommended_ids[:k])
    return 1.0 if top_k & set(relevant_ids) else 0.0


# ---------------------------------------------------------------------------
# Evaluación de predicción punto a punto (RMSE / MAE)
# ---------------------------------------------------------------------------

def evaluar_predicciones(engine, context_model, sample_size=1000):
    """Evalúa RMSE y MAE para cada componente del sistema."""
    n_test = len(engine.test_data)
    n_eval = min(sample_size, n_test)
    test_sample = engine.test_data.sample(n_eval, random_state=42)

    actuals, preds_cf, preds_rf, preds_hybrid = [], [], [], []
    errores = 0

    print(f"Evaluando {n_eval} de {n_test} interacciones del test set...")
    print("  Pre-computando contextos de usuario...")
    unique_users = test_sample['user_id'].unique()
    user_contexts = {uid: _infer_user_context(uid, engine) for uid in unique_users}

    total = len(test_sample)
    for idx, (_, row) in enumerate(test_sample.iterrows()):
        if idx % 100 == 0:
            pct = idx / total * 100
            sys.stdout.write(f"\r  Progreso: {idx}/{total} ({pct:.0f}%)")
            sys.stdout.flush()

        try:
            p_cf = predict_cf_pearson(row['user_id'], row['business_id'], engine)
            user_ctx = user_contexts.get(row['user_id'])
            p_rf = float(context_model.predict_with_context([row['business_id']], user_context=user_ctx)[0])
            if np.isnan(p_cf) or np.isnan(p_rf):
                errores += 1
                continue
            p_hybrid = (0.1 * p_cf) + (0.9 * p_rf)

            actuals.append(row['stars'])
            preds_cf.append(p_cf)
            preds_rf.append(p_rf)
            preds_hybrid.append(p_hybrid)
        except Exception as e:
            errores += 1
            if errores <= 3:
                print(f"\n  [warn] Error en u={row['user_id']}, b={row['business_id']}: {e}")

    print(f"\r  Progreso: {total}/{total} (100%)     ")

    actuals = np.array(actuals)
    preds_cf = np.array(preds_cf)
    preds_rf = np.array(preds_rf)
    preds_hybrid = np.array(preds_hybrid)

    media_global = engine.train_data['stars'].mean()
    preds_baseline = np.full_like(actuals, media_global)

    print(f"\nPredicciones exitosas: {len(actuals)}")
    print(f"Predicciones fallidas: {errores}")

    print("\n+--------------------------------+---------+--------+")
    print("| Componente                     |  RMSE   |  MAE   |")
    print("+--------------------------------+---------+--------+")

    for nombre, preds in [
        ("Baseline (media global)", preds_baseline),
        ("CF (Pearson + KNN)", preds_cf),
        ("RF contextual (con contexto)", preds_rf),
        ("Hibrido v3 (a=0.1)", preds_hybrid),
    ]:
        rmse = sqrt(mean_squared_error(actuals, preds))
        mae = mean_absolute_error(actuals, preds)
        print(f"| {nombre:<30s} | {rmse:.4f}  | {mae:.4f} |")

    print("+--------------------------------+---------+--------+")

    errors_abs = np.abs(actuals - preds_hybrid)
    print("\nDistribucion de error absoluto (Hibrido v3):")
    for threshold in [0.5, 1.0, 1.5, 2.0]:
        pct = (errors_abs <= threshold).mean() * 100
        print(f"  |error| <= {threshold}: {pct:.1f}%")

    return {
        'rmse_hybrid': sqrt(mean_squared_error(actuals, preds_hybrid)),
        'mae_hybrid': mean_absolute_error(actuals, preds_hybrid),
    }


# ---------------------------------------------------------------------------
# Evaluación de Ranking (NDCG@K, Precision@K, Hit Rate@K)
# ---------------------------------------------------------------------------

def evaluar_ranking(engine, context_model, n_users=100, k=5, relevance_threshold=4):
    """
    Evalúa métricas de ranking sobre una muestra de usuarios del test set.

    Un ítem es 'relevante' si el usuario le dio >= relevance_threshold estrellas.

    Args:
        engine: SmarturEngine inicializado
        context_model: SmarturContextModel entrenado
        n_users: número de usuarios a evaluar
        k: top-K para las métricas
        relevance_threshold: mínimo de estrellas para considerar un ítem relevante
    """
    print(f"\n=== Metricas de Ranking (K={k}) ===\n")

    # Obtener usuarios con suficientes interacciones en test
    user_counts = engine.test_data.groupby('user_id').size()
    eligible_users = user_counts[user_counts >= 3].index.tolist()

    if len(eligible_users) == 0:
        print("  No hay usuarios con suficientes interacciones para evaluar ranking.")
        return {}

    eval_users = eligible_users[:min(n_users, len(eligible_users))]
    print(f"  Evaluando {len(eval_users)} usuarios con >= 3 interacciones en test...\n")

    ndcg_scores = []
    precision_scores = []
    hit_scores = []

    for idx, user_id in enumerate(eval_users):
        if idx % 20 == 0:
            sys.stdout.write(f"\r  Progreso: {idx}/{len(eval_users)}")
            sys.stdout.flush()

        try:
            # Obtener los ítems relevantes reales del usuario en test
            user_test = engine.test_data[engine.test_data['user_id'] == user_id]
            relevant_ids = set(
                user_test[user_test['stars'] >= relevance_threshold]['business_id'].tolist()
            )

            if len(relevant_ids) == 0:
                continue  # Sin ítems relevantes, no contribuye a las métricas

            # Generar recomendaciones con contexto inferido del historial del usuario
            user_ctx = _infer_user_context(user_id, engine)
            recs = recommend_hybrid(
                user_id, engine, context_model, alpha=0.1, context=user_ctx, top_n=k * 2
            )
            rec_ids = [r['item_id'] for r in recs]

            # Construir vector de relevancia para NDCG
            relevances = []
            for rid in rec_ids[:k]:
                user_rating = user_test.loc[
                    user_test['business_id'] == rid, 'stars'
                ]
                if len(user_rating) > 0:
                    relevances.append(float(user_rating.values[0]))
                else:
                    relevances.append(0.0)

            # Calcular métricas
            ndcg_scores.append(ndcg_at_k(relevances, k))
            precision_scores.append(precision_at_k(rec_ids, relevant_ids, k))
            hit_scores.append(hit_rate_at_k(rec_ids, relevant_ids, k * 2))

        except Exception:
            continue

    print(f"\r  Progreso: {len(eval_users)}/{len(eval_users)}     ")

    results = {}
    if ndcg_scores:
        results['ndcg'] = float(np.mean(ndcg_scores))
        results['precision'] = float(np.mean(precision_scores))
        results['hit_rate'] = float(np.mean(hit_scores))
        results['n_users_evaluated'] = len(ndcg_scores)

        print(f"\n+---------------------------+---------+")
        print(f"| Metrica                   |  Valor  |")
        print(f"+---------------------------+---------+")
        print(f"| NDCG@{k:<22d} | {results['ndcg']:.4f}  |")
        print(f"| Precision@{k:<17d} | {results['precision']:.4f}  |")
        print(f"| Hit Rate@{k*2:<18d} | {results['hit_rate']:.4f}  |")
        print(f"+---------------------------+---------+")
        print(f"\n  Usuarios evaluados: {len(ndcg_scores)}")
    else:
        print("  No se pudieron calcular métricas de ranking.")
        results['n_users_evaluated'] = 0

    return results


# ---------------------------------------------------------------------------
# Evaluación local con datos reales SMARTUR
# ---------------------------------------------------------------------------

def evaluar_ranking_local(
    context_model,
    lightfm_model=None,
    content_model=None,
    k: int = 5,
    min_users: int = 20,
    min_interactions: int = 3,
) -> dict | None:
    """
    Evalúa NDCG@k, Precision@k y Hit Rate@k usando interacciones reales de SMARTUR.

    Retorna None si no hay suficientes datos (señal para usar eval Yelp como fallback).
    Solo cuenta cuando hay >= min_users usuarios con >= min_interactions cada uno.

    Ventaja sobre evaluar_ranking(): los ítems recomendados (POIs de Altas Montañas)
    y los ítems del test set son los mismos, por lo que NDCG refleja calidad real.
    """
    try:
        from poi_repository import fetch_real_interactions, fetch_traveler_profile
        from fusion import recommend_hybrid
        import numpy as np
    except ImportError as e:
        import logging
        logging.getLogger(__name__).warning(f"[eval_local] Import error: {e}")
        return None

    df = fetch_real_interactions(min_events=1)
    if df is None or df.empty:
        return None

    # Keep only users with enough interactions for a meaningful 80/20 split
    user_counts = df.groupby('user_id').size()
    eligible = user_counts[user_counts >= min_interactions].index.tolist()

    if len(eligible) < min_users:
        import logging
        logging.getLogger(__name__).info(
            f"[eval_local] Solo {len(eligible)} usuarios elegibles (mínimo {min_users}) "
            "— usando eval Yelp como fallback."
        )
        return None

    ndcg_scores, precision_scores, hit_scores, pref_scores = [], [], [], []

    for uid in eligible:
        user_df = df[df['user_id'] == uid].sort_values('implicit_score', ascending=False)
        n_total = len(user_df)
        split = max(1, int(n_total * 0.8))

        # Train items (used to warm context if needed) and test items (ground truth)
        test_items = set(user_df.iloc[split:]['item_id'].tolist())
        if not test_items:
            continue

        # Relevant items: those the user liked (implicit_score >= 4.0)
        relevant = set(
            user_df[user_df['implicit_score'] >= 4.0]['item_id'].tolist()
        ) & test_items
        if not relevant:
            # All test items count as relevant (weak signal scenario)
            relevant = test_items

        # Contexto real del usuario (tiposTurismo/presupuesto/grupo) — sin esto
        # preference_match_rate no mide nada, porque el boost de preferencia
        # necesita saber qué declaró el usuario para poder compararlo.
        try:
            user_context = fetch_traveler_profile(uid) or {}
        except Exception:
            user_context = {}

        try:
            recs = recommend_hybrid(
                user_id=str(uid),
                engine=None,          # will use local POIs only
                context_model=context_model,
                alpha=0.4,
                context=user_context,
                top_n=max(k * 2, 10),
                lightfm_model=lightfm_model,
                content_model=content_model,
            )
        except Exception:
            continue

        if not recs:
            continue

        rec_ids = [r['item_id'] for r in recs[:k]]
        pref_scores.extend(r.get('pred_pref', 0.0) for r in recs[:k])

        # NDCG@k
        dcg = sum(
            1.0 / np.log2(pos + 2)
            for pos, rid in enumerate(rec_ids)
            if rid in relevant
        )
        ideal_hits = min(len(relevant), k)
        idcg = sum(1.0 / np.log2(pos + 2) for pos in range(ideal_hits))
        ndcg_scores.append(dcg / idcg if idcg > 0 else 0.0)

        # Precision@k
        hits_at_k = sum(1 for rid in rec_ids if rid in relevant)
        precision_scores.append(hits_at_k / k)

        # Hit Rate@k (binary: did at least one relevant item appear?)
        hit_scores.append(1.0 if hits_at_k > 0 else 0.0)

    if not ndcg_scores:
        return None

    results = {
        'ndcg':      float(np.mean(ndcg_scores)),
        'precision': float(np.mean(precision_scores)),
        'hit_rate':  float(np.mean(hit_scores)),
    }
    if pref_scores:
        # Qué % de las recomendaciones evaluadas realmente coinciden con lo
        # que el usuario declaró (tiposTurismo/presupuesto/grupo) — mide
        # alineación con preferencias, algo que NDCG/precision (basados en
        # estrellas) no capturan directamente.
        results['preference_match_rate'] = float(
            np.mean([1.0 if p >= 0.5 else 0.0 for p in pref_scores])
        )
    return results


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def evaluar_modelo(sample_size=1000):
    print("=== Evaluacion SMARTUR v3 ===\n")

    engine = SmarturEngine(data_source='mexico')
    engine.prepare_pearson_matrix()

    context_model = SmarturContextModel()
    context_model.train(engine.train_data)

    # Métricas de predicción (RMSE/MAE)
    pred_results = evaluar_predicciones(engine, context_model, sample_size)

    # Métricas de ranking (NDCG, Precision, Hit Rate)
    rank_results = evaluar_ranking(engine, context_model, n_users=100, k=5)

    print("\n=== Evaluacion SMARTUR v3 completada ===")
    return {**pred_results, **rank_results}


if __name__ == "__main__":
    evaluar_modelo()
