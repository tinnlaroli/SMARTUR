import logging
import os
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

"""
SMARTUR API Base File
Define los Endpoints de recomendación mediante FastAPI.
Conecta los flujos entre el Engine de Pearson y el Modelo Contextual de RF.
"""

from engine import SmarturEngine
from rf_model import SmarturContextModel, _MODELS
from fusion import recommend_hybrid
import json
from pathlib import Path
from poi_repository import fetch_pois, get_poi_connection, fetch_traveler_profile

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smartur-api")

engine          = None
context_model   = None
gbm_model       = None
lightfm_model   = None   # LightFM: cold-start-aware matrix factorization (WARP loss)
content_model_cb = None  # ContentModel: TF-IDF fallback for cold-start
quality_scores: dict = {}  # {business_id: normalized quality ∈ [0,1]} from service_evaluation
_scheduler      = None   # APScheduler instance — module-level so endpoints can read/update it


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Carga los modelos pesados una sola vez al iniciar la API."""
    global engine, context_model, gbm_model, lightfm_model, content_model_cb, quality_scores
    if os.getenv("SKIP_MODEL_BOOT") == "1":
        logger.warning("SKIP_MODEL_BOOT=1: saltando carga de modelos en arranque")
        yield
        return
    try:
        logger.info("Cargando Motor de Pearson + SVD (Engine)...")
        engine = SmarturEngine()
        engine.prepare_pearson_matrix()

        logger.info("Cargando Modelo de Contexto (Random Forest)...")
        context_model = SmarturContextModel()
        if not context_model.load():
            logger.info("Modelo RF no encontrado, entrenando ahora por única vez...")
            context_model.train(engine.train_data)

        logger.info("Cargando Gradient Boosting (GBM)...")
        from gbm_model import SmarturGbmModel
        gbm_model = SmarturGbmModel()
        if not gbm_model.load():
            logger.info("Modelo GBM no encontrado, entrenando ahora por única vez...")
            gbm_model.train(engine.train_data)

        # ── LightFM (cold-start matrix factorization) ──────────────────────
        logger.info("Cargando LightFM (cold-start WARP factorization)...")
        try:
            from lightfm_model import SmarturLightFMModel
            lightfm_model = SmarturLightFMModel()
            if not lightfm_model.load():
                logger.info("Modelo LightFM no encontrado, entrenando en arranque...")
                ok = lightfm_model.train(engine.train_data, context_model.df_biz)
                if not ok:
                    lightfm_model = None
                    logger.warning("LightFM no disponible (¿falta instalar la librería?).")
        except Exception as lfm_err:
            lightfm_model = None
            logger.warning(f"LightFM no disponible: {lfm_err}")

        # ── ContentModel (TF-IDF fallback) ────────────────────────────────
        logger.info("Cargando ContentModel (TF-IDF fallback)...")
        try:
            from content_model import SmarturContentModel
            content_model_cb = SmarturContentModel()
            content_model_cb.fit(context_model.df_biz)
        except Exception as cm_err:
            content_model_cb = None
            logger.warning(f"ContentModel no disponible: {cm_err}")

        # ── Quality scores (inference boost from service_evaluation) ──────────
        try:
            from poi_repository import fetch_quality_scores
            quality_scores = fetch_quality_scores()
            logger.info(f"[init] Quality scores cargados: {len(quality_scores)} servicios evaluados")
        except Exception as qs_err:
            quality_scores = {}
            logger.warning(f"[init] Quality scores no disponibles: {qs_err}")

        lfm_status = "LightFM✓" if lightfm_model is not None else "LightFM✗"
        cm_status  = "ContentModel✓" if content_model_cb is not None else "ContentModel✗"
        logger.info(f"SMARTUR v4 listo (RF + GBM + SVD/CF + {lfm_status} + {cm_status}).")
    except Exception as e:
        logger.error(f"Error crítico en el arranque: {e}")
        # Falla rápido y ruidosamente; previene iniciar en un estado degradado "zombie"
        raise RuntimeError(f"Boot abortado: Los modelos no pudieron cargar ({e})")

    # ── Scheduled nightly retraining ─────────────────────────────────────
    # APScheduler runs _run_full_training() every day at 02:00 UTC so that
    # new user interactions accumulated during the day are incorporated
    # automatically — no admin button needed.
    global _scheduler
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        _scheduler = BackgroundScheduler(timezone='UTC')
        _scheduler.add_job(
            _run_full_training,
            trigger='cron',
            hour=2, minute=0,
            id='nightly_retrain',
            replace_existing=True,
            misfire_grace_time=3600,  # allow up to 1h late start (e.g. if container was down)
        )
        _scheduler.start()
        logger.info("[scheduler] Reentrenamiento nocturno programado (02:00 UTC diario)")
    except Exception as sched_err:
        logger.warning(f"[scheduler] No disponible: {sched_err}")

    yield

    # ── Teardown ──────────────────────────────────────────────────────────
    if _scheduler is not None:
        try:
            _scheduler.shutdown(wait=False)
        except Exception:
            pass


app = FastAPI(title="SMARTUR Recommender API v2", version="2.1", lifespan=lifespan)

_CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class RecItem(BaseModel):
    item_id: str
    title: str
    description: str = ''
    category: str = ''
    score: float
    pred_cf: float
    pred_rf: float
    kind: str = 'poi'
    reason_tags: list[str] = []  # human-readable explanation tags, e.g. ["Coincide con naturaleza", "A 3.2 km"]


class RecommendationResponse(BaseModel):
    user_id: str
    recommendations: List[RecItem]
    alpha: float


class RecommendRequest(BaseModel):
    alpha: float = 0.4
    context: Optional[Dict[str, Any]] = None
    top_n: int = 5


@app.get("/health")
def health():
    """
    Endpoint pasivo para sondear la disponibilidad y estado de carga de la API.
    Aporta métricas rápidas del estado interno del Engine y el RandomForest en RAM.
    """
    return {
        "status": "ok",
        "engine_ready":   engine is not None and engine.user_item_matrix is not None,
        "rf_ready":       context_model is not None and getattr(context_model, 'is_fitted', False),
        "gbm_ready":      gbm_model is not None and getattr(gbm_model, 'is_fitted', False),
        "svd_ready":      engine is not None and hasattr(engine, 'user_latent'),
        "lightfm_ready":  lightfm_model is not None and getattr(lightfm_model, 'is_fitted', False),
        "content_ready":  content_model_cb is not None and getattr(content_model_cb, 'is_fitted', False),
        "users_count":    engine.user_item_matrix.shape[0] if engine and engine.user_item_matrix is not None else 0,
        "skip_model_boot": os.getenv("SKIP_MODEL_BOOT") == "1",
    }


@app.get("/health/poi-db")
def health_poi_db():
    """Chequea conectividad a Postgres para POIs locales."""
    try:
        with get_poi_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"POI DB unavailable: {e}")


# ---------------------------------------------------------------------------
# Scheduler config — readable and writable from the admin dashboard
# ---------------------------------------------------------------------------

@app.get("/scheduler")
def get_scheduler_config():
    """
    Returns the current nightly retraining schedule.
    Readable by the PLATAFORMA admin dashboard.
    """
    if _scheduler is None:
        return {"enabled": False, "hour": 2, "minute": 0, "next_run": None}
    job = _scheduler.get_job('nightly_retrain')
    if job is None:
        return {"enabled": False, "hour": 2, "minute": 0, "next_run": None}
    # APScheduler CronTrigger stores fields in a list; find hour/minute by name
    try:
        trigger = job.trigger
        field_map = {f.name: f for f in trigger.fields}
        hour   = int(str(field_map['hour'].expressions[0]))
        minute = int(str(field_map['minute'].expressions[0]))
    except Exception:
        hour, minute = 2, 0
    next_run = job.next_run_time.isoformat() if job.next_run_time else None
    return {"enabled": True, "hour": hour, "minute": minute, "next_run": next_run}


class SchedulerConfigRequest(BaseModel):
    enabled: bool
    hour: int = Field(default=2, ge=0, le=23)
    minute: int = Field(default=0, ge=0, le=59)


@app.put("/scheduler")
def put_scheduler_config(payload: SchedulerConfigRequest):
    """
    Enable/disable and/or reschedule nightly retraining.
    Changes take effect immediately without restarting the container.
    Called by the PLATAFORMA admin dashboard scheduler card.
    """
    if _scheduler is None:
        raise HTTPException(status_code=503, detail="Scheduler no disponible en este entorno.")

    if not payload.enabled:
        try:
            _scheduler.remove_job('nightly_retrain')
        except Exception:
            pass  # already removed — not an error
        logger.info("[scheduler] Reentrenamiento automático DESHABILITADO desde el dashboard")
        return {"ok": True, "enabled": False, "next_run": None}

    _scheduler.add_job(
        _run_full_training,
        trigger='cron',
        hour=payload.hour,
        minute=payload.minute,
        id='nightly_retrain',
        replace_existing=True,
        misfire_grace_time=3600,
    )
    job = _scheduler.get_job('nightly_retrain')
    next_run = job.next_run_time.isoformat() if job and job.next_run_time else None
    logger.info(
        f"[scheduler] Reprogramado a {payload.hour:02d}:{payload.minute:02d} UTC "
        "desde el dashboard"
    )
    return {
        "ok": True, "enabled": True,
        "hour": payload.hour, "minute": payload.minute,
        "next_run": next_run,
    }


@app.get("/recommend/{user_id}", response_model=RecommendationResponse)
def get_recommendation(
    user_id: str,
    alpha: float = Query(0.4, ge=0.0, le=1.0),
    top_n: int = Query(5, ge=1, le=50),
):
    if engine is None or context_model is None:
        raise HTTPException(status_code=503, detail="Modelos no cargados.")

    try:
        recs = recommend_hybrid(
            user_id, engine, context_model,
            alpha=alpha, top_n=top_n,
            lightfm_model=lightfm_model, content_model=content_model_cb,
        )
        return RecommendationResponse(
            user_id=user_id,
            recommendations=[RecItem(**r) for r in recs],
            alpha=alpha,
        )
    except Exception as e:
        logger.error(f"Error en GET recommend: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recommend/{user_id}", response_model=RecommendationResponse)
def post_recommendation(user_id: str, payload: RecommendRequest):
    if engine is None or context_model is None:
        raise HTTPException(status_code=503, detail="Modelos no cargados.")

    try:
        logger.info(f"Recomendación POST para usuario: {user_id}")

        # Smart merge: DB profile fills gaps; request overrides only non-empty fields.
        # This prevents an empty request context from masking a rich DB profile,
        # which was causing cold-start users to get flat (all-zero) feature vectors.
        try:
            profile_ctx = fetch_traveler_profile(user_id) or {}
        except Exception as e:
            profile_ctx = {}
            logger.warning(f"No se pudo cargar perfil de viajero para {user_id}: {e}")

        request_ctx = dict(payload.context) if payload.context else {}
        merged_context = dict(profile_ctx)  # base: DB profile
        for key, val in request_ctx.items():
            # Request field wins only if it's actually set (non-empty/non-null)
            if val is not None and val != [] and val != '':
                merged_context[key] = val
        if profile_ctx:
            logger.info(f"Perfil de viajero cargado para usuario {user_id}")

        recs = recommend_hybrid(
            user_id=user_id,
            engine=engine,
            context_model=context_model,
            alpha=payload.alpha,
            context=merged_context,
            top_n=payload.top_n,
            lightfm_model=lightfm_model,
            content_model=content_model_cb,
            quality_scores=quality_scores,
        )
        return RecommendationResponse(
            user_id=user_id,
            recommendations=[
                RecItem(
                    item_id=r.get('item_id', ''),
                    title=r.get('title', ''),
                    description=r.get('description', ''),
                    category=r.get('category', ''),
                    score=r.get('score', 0.0),
                    pred_cf=r.get('pred_cf', 0.0),
                    pred_rf=r.get('pred_rf', 0.0),
                    kind=r.get('kind', 'poi'),
                    reason_tags=r.get('reason_tags', []),
                )
                for r in recs
            ],
            alpha=payload.alpha,
        )
    except Exception as e:
        logger.error(f"Error en POST recommend: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/metrics")
def get_metrics():
    """
    Returns the latest stored algorithm metrics for the admin dashboard.
    Priority:
      1. DB table ml_model_metrics (most recent row)
      2. models/algorithm_metrics.json (written by _run_full_training)
    """
    # 1. Try DB first
    try:
        _persist_metrics_to_db  # ensure helper is defined (imported below function)
        import psycopg2
        conn = psycopg2.connect(
            host=os.environ.get("DB_HOST", "localhost"),
            port=int(os.environ.get("DB_PORT", 5432)),
            dbname=os.environ.get("DB_NAME", "smartur"),
            user=os.environ.get("DB_USER", "postgres"),
            password=os.environ.get("DB_PASSWORD", ""),
        )
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT metrics_json FROM ml_model_metrics ORDER BY created_at DESC LIMIT 1"
                )
                row = cur.fetchone()
        finally:
            conn.close()
        if row:
            return row[0]  # psycopg2 returns jsonb as dict automatically
    except Exception as db_err:
        logger.warning(f"[metrics] DB fallback: {db_err}")

    # 2. Fall back to JSON file in the models volume
    metrics_path = Path(_MODELS) / "algorithm_metrics.json"
    if not metrics_path.exists():
        raise HTTPException(status_code=404, detail="No hay métricas almacenadas todavía.")
    try:
        with open(metrics_path, encoding="utf-8") as f:
            data = json.load(f)
        # Reject placeholder content written before first real training
        if "status" in data and "note" in data and len(data) == 2:
            raise HTTPException(status_code=404, detail="Métricas aún no calculadas. Llama a /train primero.")
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error leyendo métricas: {e}")
        raise HTTPException(status_code=500, detail="Error al leer métricas.")


def _compute_simple_metrics(engine_obj, rf_model, sample_size: int = 800) -> dict:
    """
    Computes CF-Pearson + Random-Forest metrics on held-out test data.
    Does NOT require a GBM model (simplified vs. compare_algorithms).
    Returns a dict compatible with the ml_model_metrics schema.

    NOTE: This function is kept as a fallback for when GBM is not loaded.
    Prefer compare_algorithms() when gbm_model is available.
    """
    import numpy as np
    from math import sqrt
    from sklearn.metrics import mean_absolute_error, mean_squared_error
    from cf import predict_cf_pearson
    from evaluate import _infer_user_context
    from model_metrics import DEFAULT_METRICS

    try:
        test_data = getattr(engine_obj, 'test_data', None)
        if test_data is None or len(test_data) == 0:
            logger.warning("[metrics] No hay datos de prueba — usando métricas por defecto.")
            return dict(DEFAULT_METRICS)

        n_eval = min(sample_size, len(test_data))
        test_sample = test_data.sample(n_eval, random_state=42)

        # Pre-compute user contexts so predict_with_context gets real signal
        user_contexts = {
            uid: _infer_user_context(uid, engine_obj)
            for uid in test_sample['user_id'].unique()
        }

        actuals, preds_cf, preds_rf = [], [], []
        for _, row in test_sample.iterrows():
            try:
                p_cf = predict_cf_pearson(row['user_id'], row['business_id'], engine_obj)
                ctx  = user_contexts.get(row['user_id'])
                p_rf = float(rf_model.predict_with_context([row['business_id']], user_context=ctx)[0])

                # Only skip if RF is invalid (CF always returns a fallback mean)
                if np.isnan(p_rf):
                    continue
                if np.isnan(p_cf):
                    p_cf = p_rf  # graceful CF fallback when KNN has no neighbors

                actuals.append(row['stars'])
                preds_cf.append(p_cf)
                preds_rf.append(p_rf)
            except Exception:
                continue

        if len(actuals) < 30:
            logger.warning(f"[metrics] Solo {len(actuals)} muestras válidas — usando métricas por defecto.")
            return dict(DEFAULT_METRICS)

        actuals  = np.asarray(actuals, dtype=float)
        preds_cf = np.asarray(preds_cf, dtype=float)
        preds_rf = np.asarray(preds_rf, dtype=float)

        def _rmse_mae(a, p):
            return {
                'rmse': float(sqrt(mean_squared_error(a, p))),
                'mae':  float(mean_absolute_error(a, p)),
            }

        # Find best blending alpha (CF weight) for hybrid
        best_alpha, best_rmse_h = 0.2, float('inf')
        for alpha in np.arange(0.0, 1.05, 0.1):
            hybrid = alpha * preds_cf + (1.0 - alpha) * preds_rf
            rmse_h = sqrt(mean_squared_error(actuals, hybrid))
            if rmse_h < best_rmse_h:
                best_rmse_h = rmse_h
                best_alpha  = float(alpha)

        hybrid_preds = best_alpha * preds_cf + (1.0 - best_alpha) * preds_rf
        baseline     = np.full_like(actuals, actuals.mean())

        algorithms = {
            'baseline':       _rmse_mae(actuals, baseline),
            'cf_knn_pearson': _rmse_mae(actuals, preds_cf),
            'random_forest':  _rmse_mae(actuals, preds_rf),
            'hybrid_cf_rf':   {**_rmse_mae(actuals, hybrid_preds), 'alpha': best_alpha},
        }

        candidates = {k: algorithms[k]['rmse'] for k in ('cf_knn_pearson', 'random_forest', 'hybrid_cf_rf')}
        best_algorithm = min(candidates, key=candidates.get)

        return {
            'best_algorithm': best_algorithm,
            'best_alpha':     best_alpha if best_algorithm == 'hybrid_cf_rf' else 0.2,
            'local_blend':    {'rf': 1.0, 'gbm': 0.0},
            'algorithms':     algorithms,
            'sample_size':    len(actuals),
        }
    except Exception as exc:
        logger.error(f"[metrics] Error calculando métricas: {exc}")
        return dict(DEFAULT_METRICS)


def _persist_metrics_to_db(metrics_json: dict) -> bool:
    """
    Inserts ML training metrics into the ml_model_metrics table
    using the same PostgreSQL connection as poi_repository.
    """
    try:
        import psycopg2
        import json as _json

        conn = psycopg2.connect(
            host=os.getenv('POI_DB_HOST', 'localhost'),
            port=int(os.getenv('POI_DB_PORT', 5432)),
            database=os.getenv('POI_DB_NAME', 'smartur'),
            user=os.getenv('POI_DB_USER', 'postgres'),
            password=os.getenv('POI_DB_PASSWORD', os.getenv('DB_PASSWORD', '12345678')),
            options='-c client_encoding=UTF8',
        )
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO ml_model_metrics (metrics_json) VALUES (%s)",
                    (_json.dumps(metrics_json, ensure_ascii=False),),
                )
        conn.close()
        return True
    except Exception as exc:
        logger.error(f"[train] No se pudo persistir métricas en DB: {exc}")
        return False


def _run_full_training():
    """
    Background worker: retrains all models (RF + GBM + LightFM), refreshes
    Pearson/SVD matrix, computes full algorithm comparison metrics, appends
    ranking metrics, and persists to DB.
    """
    global engine, context_model, gbm_model, lightfm_model, content_model_cb, quality_scores
    try:
        import pandas as pd
        from model_metrics import save_metrics, compare_algorithms
        from poi_repository import fetch_real_interactions, fetch_evaluation_scores

        # ── 1. Merge real DB interactions (if any accumulated) ───────────────
        # Threshold lowered 50→10 so early adopters immediately influence training.
        # Weight scaled adaptively (3× min → 10× max) to compensate for the 266K
        # Yelp corpus — without this, SMARTUR signals are drowned out.
        _MIN_REAL = 10
        try:
            real_df = fetch_real_interactions(min_events=1)
            if real_df is not None and len(real_df) >= _MIN_REAL:
                real_df = real_df.rename(columns={'item_id': 'business_id', 'implicit_score': 'stars'})
                real_df['user_id'] = real_df['user_id'].astype(str)
                n_repeats = max(3, min(10, len(real_df) // 5))
                tiles = [real_df] * n_repeats
                engine.train_data = pd.concat([engine.train_data] + tiles, ignore_index=True)
                logger.info(
                    f"[train] Datos reales: {len(real_df)} interacciones, ponderadas {n_repeats}×"
                )
            else:
                n_real = len(real_df) if real_df is not None else 0
                logger.info(f"[train] Solo {n_real} interacciones reales (mínimo {_MIN_REAL}) — usando solo CSV.")
        except Exception as exc:
            logger.warning(f"[train] Interacciones reales no disponibles: {exc}")

        # ── 1b. Merge admin evaluation scores ───────────────────────────────
        try:
            eval_df = fetch_evaluation_scores()
            if eval_df is not None and len(eval_df) > 0:
                # evaluation scores only cover tourist services (svc_N IDs)
                # Merge columns must match training schema
                eval_df['user_id'] = eval_df['user_id'].astype(str)
                eval_df = eval_df.rename(columns={'business_id': 'business_id', 'stars': 'stars'})
                engine.train_data = pd.concat(
                    [engine.train_data, eval_df], ignore_index=True
                )
                logger.info(f"[train] {len(eval_df)} scores de evaluación admin integrados al entrenamiento.")
        except Exception as exc:
            logger.warning(f"[train] Scores de evaluación admin no disponibles: {exc}")

        # ── 2. Rebuild Pearson + SVD matrix ──────────────────────────────────
        logger.info("[train] Actualizando matriz de Pearson + SVD...")
        engine.prepare_pearson_matrix()

        # ── 3. Retrain RF ────────────────────────────────────────────────────
        logger.info("[train] Reentrenando Random Forest...")
        context_model.train(engine.train_data)

        # ── 4. Retrain GBM ───────────────────────────────────────────────────
        if gbm_model is not None:
            logger.info("[train] Reentrenando Gradient Boosting...")
            gbm_model.train(engine.train_data)
        else:
            logger.warning("[train] GBM no cargado — solo RF+CF en comparativa.")

        # ── 4b. Retrain LightFM ──────────────────────────────────────────────
        if lightfm_model is not None:
            logger.info("[train] Reentrenando LightFM...")
            try:
                lightfm_model.train(engine.train_data, context_model.df_biz)
            except Exception as lfm_err:
                logger.warning(f"[train] LightFM reentrenamiento falló: {lfm_err}")

        # ── 4c. Refit ContentModel ───────────────────────────────────────────
        if content_model_cb is not None:
            try:
                content_model_cb.fit(context_model.df_biz)
            except Exception as cm_err:
                logger.warning(f"[train] ContentModel refit falló: {cm_err}")

        # ── 5. Full algorithm comparison ─────────────────────────────────────
        logger.info("[train] Calculando comparativa de algoritmos...")
        if gbm_model is not None:
            metrics = compare_algorithms(engine, context_model, gbm_model, sample_size=800)
        else:
            metrics = _compute_simple_metrics(engine, context_model)

        # ── 6. Ranking metrics (NDCG@5, Precision@5, Hit Rate@10) ────────────
        # Prefer local SMARTUR evaluation when we have enough real interactions;
        # Yelp eval always returns NDCG≈0 because recommender returns Veracruz POIs.
        try:
            from evaluate import evaluar_ranking, evaluar_ranking_local
            ranking = evaluar_ranking_local(
                context_model=context_model,
                lightfm_model=lightfm_model,
                content_model=content_model_cb,
                k=5,
            )
            if ranking is not None:
                metrics['ranking'] = ranking
                logger.info(
                    f"[train] Ranking local SMARTUR — NDCG@5={ranking.get('ndcg', 0):.4f}, "
                    f"P@5={ranking.get('precision', 0):.4f}, "
                    f"HR@10={ranking.get('hit_rate', 0):.4f}"
                )
            else:
                # Fallback: Yelp-based eval (will show NDCG≈0 by design)
                ranking = evaluar_ranking(engine, context_model, n_users=50, k=5)
                if ranking:
                    metrics['ranking'] = ranking
                    logger.info("[train] Ranking Yelp (fallback — sin suficientes datos reales SMARTUR)")
        except Exception as exc:
            logger.warning(f"[train] Ranking evaluation omitida: {exc}")

        # ── 7. Persist locally ───────────────────────────────────────────────
        save_metrics(metrics)
        _best_algo = metrics.get('best_algorithm', '—')
        _rmse_val  = metrics.get('algorithms', {}).get(_best_algo, {}).get('rmse')
        _rmse_str  = f"{_rmse_val:.4f}" if isinstance(_rmse_val, (int, float)) else '—'
        logger.info(f"[train] Métricas guardadas — mejor algoritmo: {_best_algo} (RMSE={_rmse_str})")

        # ── 8. Persist to DB (only if we have real algorithm data) ──────────
        if not metrics.get('algorithms'):
            logger.warning("[train] Métricas vacías — no se persiste en DB (datos insuficientes).")
        elif _persist_metrics_to_db(metrics):
            logger.info("[train] Métricas persistidas en DB correctamente.")
        else:
            logger.warning("[train] Métricas solo disponibles en archivo local (DB no actualizada).")

        # ── 9. Refresh quality scores in-memory (new evaluations during training) ──
        try:
            from poi_repository import fetch_quality_scores
            quality_scores = fetch_quality_scores()
            logger.info(f"[train] Quality scores refrescados: {len(quality_scores)} servicios")
        except Exception as exc:
            logger.warning(f"[train] Quality scores no actualizados: {exc}")

        logger.info(f"[train] Entrenamiento completado. Muestra: {metrics.get('sample_size', '?')} predicciones.")
    except Exception as e:
        logger.error(f"[train] Error en background training: {e}", exc_info=True)


@app.post("/train")
def train_full(background_tasks: BackgroundTasks):
    """
    Inicia el reentrenamiento completo en background (fire-and-forget).
    Actualiza la matriz de Pearson y el modelo Random Forest.
    Returns immediately with { ok: true }.
    """
    if engine is None or context_model is None:
        raise HTTPException(status_code=503, detail="Modelos no cargados.")
    background_tasks.add_task(_run_full_training)
    return {"ok": True, "message": "Entrenamiento iniciado en background"}


@app.post("/train-rf")
def train_rf():
    """
    Llamado bajo demanda de re-entrenamiento del Random Forest contextual.
    Esto vuelve a generar el árbol utilizando datos actuales de la Base e ignora el archivo local previo, 
    creando un fichero `.joblib` en disco en los procesos intermedios que quedará para los futuros arranques.
    """
    if engine is None or context_model is None:
        raise HTTPException(status_code=503, detail="Modelos no cargados.")
    try:
        logger.info("Forzando entrenamiento del modelo Random Forest...")
        context_model.train(engine.train_data)
        return {"status": "ok", "message": "Modelo entrenado y guardado correctamente."}
    except Exception as e:
        logger.error(f"Error entrenando modelo: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
