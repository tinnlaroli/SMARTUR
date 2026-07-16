import asyncio
import logging
import os
import threading
import time
from datetime import datetime, timezone
import pandas as pd
from concurrent.futures import ThreadPoolExecutor
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
from route_optimizer import optimize_route as _aco_optimize
import json
from pathlib import Path
from poi_repository import fetch_pois, get_poi_connection, fetch_traveler_profile
from restmex_repository import fetch_restmex_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smartur-api")

engine          = None
context_model   = None
lightfm_model   = None   # LightFM: cold-start-aware matrix factorization (WARP loss)
content_model_cb = None  # ContentModel: TF-IDF fallback for cold-start
quality_scores: dict = {}  # {business_id: normalized quality ∈ [0,1]} from service_evaluation
# data_warmth ∈ [0,1]: qué tan "caliente" está el sistema en datos reales.
# Controla el blend dinámico en fusion.recommend_hybrid — con warmth≈0 la
# preferencia declarada domina; con warmth→1 los modelos aprendidos toman el
# control. Se recalcula al arrancar y tras cada reentrenamiento.
_data_warmth: float = 0.0
# Umbral de "madurez": nº de usuarios reales con historial suficiente (>=3 items
# interactuados) para confiar al 100% en los modelos aprendidos. Se mide por
# USUARIOS con historial, no por interacciones crudas — 1000 eventos de 15
# usuarios no dan señal colaborativa; lo que CF/RF necesitan es DIVERSIDAD de
# usuarios con historial repetido. Constante nombrada y ajustable con el tiempo.
_WARMTH_TARGET_USERS = 100
_WARMTH_MIN_ITEMS_PER_USER = 3
_scheduler      = None   # APScheduler instance — module-level so endpoints can read/update it
_restmex_cache  = None   # tuple of (reviews_df, biz_df)
_training_in_progress = False   # True mientras se entrena en background al arrancar
_models_lock    = threading.RLock()  # Guards global model references during swap

# Connection pool for /metrics — reuses DB connections instead of opening one per request
_db_pool        = None
_db_pool_lock   = threading.Lock()

# Default context for cold-start users with no profile in DB (Altas Montañas region, Veracruz)
_REGION_DEFAULT_CONTEXT = {
    "presupuesto_bucket": "medio",
    "edad_range": "25-34",
    "tiposTurismo": ["cultural"],
    "group_type": "pareja",
    "wants_tours": False,
    "needs_hotel": False,
    "pref_food": True,
    "requiere_accesibilidad": False,
    "pref_outdoor": False,
    "has_visited_region": False,
}


def _get_db_pool():
    global _db_pool
    if _db_pool is None:
        with _db_pool_lock:
            if _db_pool is None:
                import psycopg2.pool as _pg_pool
                _db_pool = _pg_pool.ThreadedConnectionPool(
                    minconn=1,
                    maxconn=5,
                    host=os.environ.get("POI_DB_HOST", "localhost"),
                    port=int(os.environ.get("POI_DB_PORT", 5432)),
                    dbname=os.environ.get("POI_DB_NAME", "smartur"),
                    user=os.environ.get("POI_DB_USER", "postgres"),
                    password=os.environ.get("POI_DB_PASSWORD", os.environ.get("DB_PASSWORD", "")),
                )
    return _db_pool

def _get_restmex_data():
    global _restmex_cache
    if _restmex_cache is None:
        _restmex_cache = fetch_restmex_data()
    return _restmex_cache

def _merge_restmex(train_data, peso=0.3):
    reviews, biz = _get_restmex_data()
    if reviews is not None and len(reviews) > 100:
        tile_count = max(1, int(peso * len(train_data) / len(reviews)))
        tiles = [reviews] * tile_count
        train_data = pd.concat([train_data] + tiles, ignore_index=True)
        logger.info(f"Rest-Mex: {len(reviews)} reseñas x{tile_count}")
        return train_data, biz
    return train_data, None


def _refresh_data_warmth() -> float:
    """Recalcula _data_warmth desde la DIVERSIDAD de usuarios reales con
    historial suficiente (no desde interacciones crudas).
        warmth = min(1, usuarios_con_>=N_items / _WARMTH_TARGET_USERS)
    Si falla la consulta, deja el warmth en 0.0 (lado seguro: la preferencia
    declarada domina)."""
    global _data_warmth
    try:
        from poi_repository import fetch_real_interactions
        df = fetch_real_interactions(min_events=1)
        if df is None or df.empty:
            eligible = 0
        else:
            counts = df.groupby('user_id').size()
            eligible = int((counts >= _WARMTH_MIN_ITEMS_PER_USER).sum())
        _data_warmth = min(1.0, eligible / _WARMTH_TARGET_USERS)
        logger.info(
            f"[warmth] {eligible} usuarios con >={_WARMTH_MIN_ITEMS_PER_USER} items "
            f"(de {_WARMTH_TARGET_USERS} objetivo) -> data_warmth={_data_warmth:.3f}"
        )
    except Exception as exc:
        logger.warning(f"[warmth] No se pudo calcular data_warmth: {exc}")
        _data_warmth = 0.0
    return _data_warmth


def _load_or_train_models(do_train: bool = False) -> None:
    """
    Carga los modelos desde disco. Si do_train=True y alguno falta, lo entrena.
    Diseñado para ejecutarse en un ThreadPoolExecutor (CPU-bound).
    """
    global engine, context_model, lightfm_model, content_model_cb, quality_scores, _training_in_progress

    try:
        logger.info("[boot] Cargando Motor de Pearson + SVD (Engine)...")
        engine = SmarturEngine(data_source='mexico')
        engine.prepare_pearson_matrix()
        # Seed data (seed_pois_mexico.py) ya incluye REST-MEX 2025/2022.
        # No llamar _merge_restmex para evitar duplicar 208K reseñas con
        # business_ids inconsistentes (idx%40 genera 40 IDs por Town+Type).
        restmex_biz = None

        logger.info("[boot] Cargando Modelo de Contexto (Random Forest)...")
        context_model = SmarturContextModel()
        if not context_model.load():
            if do_train:
                logger.info("[boot] Modelo RF no encontrado — entrenando en segundo plano...")
                context_model.train(engine.train_data, df_biz_extra=restmex_biz)
            else:
                context_model = None

        logger.info("[boot] Cargando LightFM (cold-start WARP)...")
        try:
            from lightfm_model import SmarturLightFMModel
            lightfm_model = SmarturLightFMModel()
            if not lightfm_model.load():
                if do_train and context_model is not None:
                    ok = lightfm_model.train(engine.train_data, context_model.df_biz)
                    if not ok:
                        lightfm_model = None
                else:
                    lightfm_model = None
        except Exception as lfm_err:
            lightfm_model = None
            logger.warning(f"[boot] LightFM no disponible: {lfm_err}")

        logger.info("[boot] Cargando ContentModel (TF-IDF)...")
        try:
            from content_model import SmarturContentModel
            content_model_cb = SmarturContentModel()
            if context_model is not None:
                content_model_cb.fit(context_model.df_biz)
        except Exception as cm_err:
            content_model_cb = None
            logger.warning(f"[boot] ContentModel no disponible: {cm_err}")

        try:
            from poi_repository import fetch_quality_scores
            quality_scores = fetch_quality_scores()
            logger.info(f"[boot] Quality scores: {len(quality_scores)} servicios")
        except Exception:
            quality_scores = {}

        # Estado inicial del blend dinámico (frío hasta que la BD diga otra cosa).
        _refresh_data_warmth()

        lfm_st = "LightFM✓" if lightfm_model else "LightFM✗"
        cm_st  = "ContentModel✓" if content_model_cb else "ContentModel✗"
        logger.info(f"[boot] SMARTUR v4 listo (RF + SVD/CF + {lfm_st} + {cm_st}).")
    except Exception as e:
        logger.error(f"[boot] Error cargando modelos: {e}")
    finally:
        _training_in_progress = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Arranque no bloqueante: carga modelos desde disco (ms) y, si falta alguno,
    lanza el entrenamiento en un hilo separado sin bloquear el servidor.
    """
    global _training_in_progress

    if os.getenv("SKIP_MODEL_BOOT") == "1":
        logger.warning("SKIP_MODEL_BOOT=1: saltando carga de modelos en arranque")
        yield
        return

    # Intentar cargar modelos desde disco sin entrenar (rápido)
    _load_or_train_models(do_train=False)

    # Si algún modelo no está listo, entrenar en background (no bloquea el API)
    models_ready = (
        engine is not None and
        context_model is not None
    )
    if not models_ready:
        missing = [n for n, v in [("engine", engine), ("rf", context_model)] if v is None]
        logger.warning(
            f"[boot] ⚠️  API arrancando con modelos faltantes: {missing}. "
            "Los endpoints /recommend devolverán 503 hasta que el entrenamiento termine."
        )
        logger.info("[boot] Modelos faltantes — iniciando entrenamiento en hilo de fondo. "
                    "API disponible en modo degradado.")
        _training_in_progress = True
        loop = asyncio.get_event_loop()
        executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="smartur-train")
        loop.run_in_executor(executor, _load_or_train_models, True)

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

_CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]

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
    # Fuente real de pred_cf: 'knn'/'svd' = el CF-KNN aportó señal real;
    # 'quality_proxy'/'global_mean' = todavía sin interacciones reales sobre
    # este lugar, se usó la evaluación del admin o el promedio.
    cf_signal: str = 'none'
    pred_rf: float
    pred_pref: float = 0.0
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
        "engine_ready":        engine is not None and engine.user_item_matrix is not None,
        "rf_ready":            context_model is not None and getattr(context_model, 'is_fitted', False),
        "svd_ready":           engine is not None and hasattr(engine, 'user_latent'),
        "lightfm_ready":       lightfm_model is not None and getattr(lightfm_model, 'is_fitted', False),
        "content_ready":       content_model_cb is not None and getattr(content_model_cb, 'is_fitted', False),
        "users_count":         engine.user_item_matrix.shape[0] if engine and engine.user_item_matrix is not None else 0,
        "training_in_progress": _training_in_progress,
        "skip_model_boot":     os.getenv("SKIP_MODEL_BOOT") == "1",
        # Estado del blend dinámico: warmth=0 → la preferencia declarada domina;
        # warmth=1 → los modelos aprendidos (CF/RF/LightFM) toman el control.
        "data_warmth":         round(_data_warmth, 3),
        "pref_weight":         round(0.65 - 0.45 * _data_warmth, 3),
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
            quality_scores=quality_scores, data_warmth=_data_warmth,
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

        # If request sent raw 'interests' but no 'tiposTurismo' exists yet (cold-start with no
        # DB profile), convert them so filtrar_candidatos_por_contexto can use them.
        if 'tiposTurismo' not in merged_context and merged_context.get('interests'):
            from poi_repository import _INTEREST_MAP
            tipos = []
            for interest in merged_context['interests']:
                mapped = _INTEREST_MAP.get(str(interest).lower().strip())
                if mapped and mapped not in tipos:
                    tipos.append(mapped)
            if tipos:
                merged_context['tiposTurismo'] = tipos

        # Cold-start fallback: use region defaults when no profile or form context is available
        if not merged_context:
            merged_context = dict(_REGION_DEFAULT_CONTEXT)
            logger.info(f"[cold-start] Sin contexto para usuario {user_id} — usando defaults de región")

        with _models_lock:
            _engine = engine
            _ctx    = context_model
            _lfm    = lightfm_model
            _cb     = content_model_cb
            _qs     = quality_scores

        recs = recommend_hybrid(
            user_id=user_id,
            engine=_engine,
            context_model=_ctx,
            alpha=payload.alpha,
            context=merged_context,
            top_n=payload.top_n,
            lightfm_model=_lfm,
            content_model=_cb,
            quality_scores=_qs,
            data_warmth=_data_warmth,
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
                    cf_signal=r.get('cf_signal', 'none'),
                    pred_rf=r.get('pred_rf', 0.0),
                    pred_pref=r.get('pred_pref', 0.0),
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
    Includes feature_importances, hyperparameters, and training_history.
    """
    _BASE = Path(_MODELS)
    data = {}

    # 1. Try DB first (pooled connection — no new TCP handshake per request)
    try:
        pool = _get_db_pool()
        conn = pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT metrics_json FROM ml_model_metrics ORDER BY created_at DESC LIMIT 1"
                )
                row = cur.fetchone()
        finally:
            pool.putconn(conn)
        if row:
            data = row[0]  # psycopg2 returns jsonb as dict automatically
    except Exception as db_err:
        logger.warning(f"[metrics] DB fallback: {db_err}")

    # 2. Fall back to JSON file in the models volume
    if not data:
        metrics_path = _BASE / "algorithm_metrics.json"
        if not metrics_path.exists():
            raise HTTPException(status_code=404, detail="No hay métricas almacenadas todavía.")
        try:
            with open(metrics_path, encoding="utf-8") as f:
                data = json.load(f)
            if "status" in data and "note" in data and len(data) == 2:
                raise HTTPException(status_code=404, detail="Métricas aún no calculadas. Llama a /train primero.")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error leyendo métricas: {e}")
            raise HTTPException(status_code=500, detail="Error al leer métricas.")

    # 3. Enrich with feature importances and hyperparameters
    fi_path = _BASE / "rf_feature_importances.json"
    if fi_path.exists():
        try:
            with open(fi_path) as f:
                data["feature_importances"] = json.load(f)
        except Exception as e:
            logger.warning(f"[metrics] No se pudieron cargar feature importances: {e}")

    hp_path = _BASE / "rf_hyperparams.json"
    if hp_path.exists():
        try:
            with open(hp_path) as f:
                data["hyperparameters"] = json.load(f)
        except Exception as e:
            logger.warning(f"[metrics] No se pudieron cargar hyperparams: {e}")

    # 4. Enrich with GBM feature importances and hyperparams
    gbm_fi_path = _BASE / "gbm_feature_importances.json"
    if gbm_fi_path.exists():
        try:
            with open(gbm_fi_path) as f:
                data["gbm_feature_importances"] = json.load(f)
        except Exception as e:
            logger.warning(f"[metrics] No se pudieron cargar GBM feature importances: {e}")

    gbm_hp_path = _BASE / "gbm_hyperparams.json"
    if gbm_hp_path.exists():
        try:
            with open(gbm_hp_path) as f:
                data["gbm_hyperparameters"] = json.load(f)
        except Exception as e:
            logger.warning(f"[metrics] No se pudieron cargar GBM hyperparams: {e}")

    # 5. Enrich with training history
    history_path = _BASE / "training_history.json"
    if history_path.exists():
        try:
            with open(history_path) as f:
                data["training_history"] = json.load(f)
        except Exception as e:
            logger.warning(f"[metrics] No se pudo cargar training history: {e}")

    return data


def _enrich_metrics(actuals, preds, engine_obj, context_model):
    """Adds error_distribution, prediction_distribution, and data_quality to a metrics dict."""
    import numpy as np
    actuals = np.asarray(actuals, dtype=float)
    preds = np.asarray(preds, dtype=float)
    errors_abs = np.abs(actuals - preds)

    # Error distribution
    ed = {}
    for t in [0.5, 1.0, 1.5, 2.0]:
        ed[f'within_{str(t).replace(".", "_")}'] = round(float((errors_abs <= t).mean() * 100), 1)
    error_distribution = ed

    # Prediction distribution (actual vs predicted counts per star level)
    actual_buckets = []
    pred_buckets = []
    for star in range(1, 6):
        actual_buckets.append([star, int((actuals == star).sum())])
        pred_buckets.append([star, int(((preds >= star - 0.5) & (preds < star + 0.5)).sum())])
    prediction_distribution = {
        'actual_buckets': actual_buckets,
        'predicted_buckets': pred_buckets,
    }

    # Data quality
    data_quality = {
        'total_interactions': int(len(engine_obj.train_data)) if hasattr(engine_obj, 'train_data') and engine_obj.train_data is not None else 0,
        'total_test': int(len(engine_obj.test_data)) if hasattr(engine_obj, 'test_data') and engine_obj.test_data is not None else 0,
        'users_count': int(engine_obj.user_item_matrix.shape[0]) if engine_obj and engine_obj.user_item_matrix is not None else 0,
        'businesses_count': int(engine_obj.user_item_matrix.shape[1]) if engine_obj and engine_obj.user_item_matrix is not None else 0,
        'top_categories': getattr(context_model, 'top_categories', [])[:10],
        'features_count': len(getattr(context_model, 'features', [])),
    }

    return {
        'error_distribution': error_distribution,
        'prediction_distribution': prediction_distribution,
        'data_quality': data_quality,
    }


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
    from cf import predict_cf_pearson, reset_prediction_stats, get_prediction_stats
    from evaluate import _infer_user_context
    from model_metrics import DEFAULT_METRICS

    try:
        test_data = getattr(engine_obj, 'test_data', None)
        if test_data is None or len(test_data) == 0:
            logger.warning("[metrics] No hay datos de prueba — usando métricas por defecto.")
            return dict(DEFAULT_METRICS)

        n_eval = min(sample_size, len(test_data))
        test_sample = test_data.sample(n_eval, random_state=42)
        reset_prediction_stats()

        # Pre-compute user contexts so predict_with_context gets real signal
        user_contexts = {
            uid: _infer_user_context(uid, engine_obj)
            for uid in test_sample['user_id'].unique()
        }

        actuals, preds_cf, preds_rf, business_ids = [], [], [], []
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
                business_ids.append(row['business_id'])
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

        # item_mean: promedio de calificaciones por negocio en el TRAIN set,
        # aplicado al test set (fallback a la media global si el negocio no
        # aparece en train). Candidato mucho más barato que CF/RF/híbrido —
        # cero entrenamiento, solo un groupby. Es un baseline "justo" para
        # datos sintéticos generados centrados en el promedio de cada
        # negocio (ver seed_pois_mexico.py/pre_procesamiento_mexico.py): si
        # item_mean le gana a CF/RF, es señal de que la personalización no
        # está aportando nada por encima de "cuánto le gusta este lugar a
        # la gente en general", sin necesidad de retrain para saberlo.
        item_means_train = engine_obj.train_data.groupby('business_id')['stars'].mean()
        global_mean = float(actuals.mean())
        preds_item_mean = np.array(
            [float(item_means_train.get(bid, global_mean)) for bid in business_ids]
        )

        algorithms = {
            'baseline':       _rmse_mae(actuals, baseline),
            'item_mean':      _rmse_mae(actuals, preds_item_mean),
            'cf_knn_pearson': _rmse_mae(actuals, preds_cf),
            'random_forest':  _rmse_mae(actuals, preds_rf),
            'hybrid_cf_rf':   {**_rmse_mae(actuals, hybrid_preds), 'alpha': best_alpha},
        }

        # 'baseline'/'item_mean' SÍ compiten — antes 'baseline' se excluía a
        # propósito de "candidates", lo que garantizaba que el sistema nunca
        # pudiera admitir que predecir el promedio simple le gana a
        # CF/RF/híbrido. Eso ocultaba el problema real (el modelo no aporta
        # valor) en vez de reportarlo. 'item_mean' es aún más informativo:
        # si gana, significa que ni siquiera hace falta CF/RF — con el
        # promedio de calificaciones de cada negocio alcanza.
        candidates = {
            k: algorithms[k]['rmse']
            for k in ('baseline', 'item_mean', 'cf_knn_pearson', 'random_forest', 'hybrid_cf_rf')
        }
        best_algorithm = min(candidates, key=candidates.get)
        if best_algorithm in ('baseline', 'item_mean'):
            logger.warning(
                f"[metrics] '{best_algorithm}' (RMSE={algorithms[best_algorithm]['rmse']:.4f}) "
                f"le gana a CF/RF/híbrido — el modelo no está aportando valor medible hoy."
            )

        cf_stats = get_prediction_stats()
        if cf_stats.get('fallback_rate') is not None and cf_stats['fallback_rate'] > 0.5:
            logger.warning(
                f"[metrics] {cf_stats['fallback_rate']*100:.1f}% de las predicciones de CF "
                f"cayeron en fallback (sin vecinos con señal real) — dataset demasiado disperso."
            )

        result = {
            'best_algorithm': best_algorithm,
            'best_alpha':     best_alpha if best_algorithm == 'hybrid_cf_rf' else 0.2,
            'local_blend':    {'rf': 1.0, 'gbm': 0.0},
            'algorithms':     algorithms,
            'sample_size':    len(actuals),
            'cf_prediction_sources': cf_stats,
        }
        enrich = _enrich_metrics(actuals, hybrid_preds, engine_obj, rf_model)
        result.update(enrich)
        return result
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
            password=os.getenv('POI_DB_PASSWORD', os.getenv('DB_PASSWORD', '')),
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


def _persist_cv_metrics_to_db(cv_json: dict) -> bool:
    """Inserts k-fold cross-validation results into ml_cross_validation_metrics."""
    try:
        import psycopg2
        import json as _json

        conn = psycopg2.connect(
            host=os.getenv('POI_DB_HOST', 'localhost'),
            port=int(os.getenv('POI_DB_PORT', 5432)),
            database=os.getenv('POI_DB_NAME', 'smartur'),
            user=os.getenv('POI_DB_USER', 'postgres'),
            password=os.getenv('POI_DB_PASSWORD', os.getenv('DB_PASSWORD', '')),
            options='-c client_encoding=UTF8',
        )
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO ml_cross_validation_metrics (cv_json) VALUES (%s)",
                    (_json.dumps(cv_json, ensure_ascii=False),),
                )
        conn.close()
        return True
    except Exception as exc:
        logger.error(f"[cv] No se pudo persistir cross-validation en DB: {exc}")
        return False


def _compute_enrich_from_engine(engine_obj, rf_model):
    """Computes enrichment metrics using a sample of test data."""
    import numpy as np
    from math import sqrt
    from sklearn.metrics import mean_absolute_error, mean_squared_error
    from cf import predict_cf_pearson
    from evaluate import _infer_user_context

    try:
        test_data = getattr(engine_obj, 'test_data', None)
        if test_data is None or len(test_data) == 0:
            return {}
        sample = test_data.sample(min(800, len(test_data)), random_state=42)
        contexts = {uid: _infer_user_context(uid, engine_obj) for uid in sample['user_id'].unique()}
        actuals, preds = [], []
        for _, row in sample.iterrows():
            try:
                p_cf = predict_cf_pearson(row['user_id'], row['business_id'], engine_obj)
                ctx = contexts.get(row['user_id'])
                p_rf = float(rf_model.predict_with_context([row['business_id']], user_context=ctx)[0])
                if np.isnan(p_rf):
                    continue
                if np.isnan(p_cf):
                    p_cf = p_rf
                hybrid = 0.2 * p_cf + 0.8 * p_rf
                actuals.append(row['stars'])
                preds.append(hybrid)
            except Exception:
                continue
        if len(actuals) < 30:
            return {}
        return _enrich_metrics(actuals, preds, engine_obj, rf_model)
    except Exception:
        return {}


def _run_full_training():
    """
    Background worker: retrains all models (RF + GBM + LightFM), refreshes
    Pearson/SVD matrix, computes full algorithm comparison metrics, appends
    ranking metrics, and persists to DB.
    """
    global engine, context_model, lightfm_model, content_model_cb, quality_scores
    try:
        import pandas as pd
        from model_metrics import save_metrics, compare_algorithms
        from poi_repository import fetch_real_interactions, fetch_evaluation_scores

        # Todo lo que muta engine/context_model/lightfm_model/content_model_cb
        # EN VIVO (in-place, no reasignación de referencia) va bajo _models_lock.
        # Antes el lock solo protegía la lectura (snapshot de referencias en
        # /recommend), pero como el retrain modifica los mismos objetos en
        # lugar de construir unos nuevos y reasignarlos, una request podía
        # quedarse con una referencia al motor mientras este se reescribía a
        # mitad de camino (matriz Pearson reconstruida, RF reentrenado, etc.).
        with _models_lock:
            # ── 1. Merge real DB interactions (if any accumulated) ───────────────
            # Threshold lowered 50->10 so early adopters immediately influence training.
            # Weight scaled adaptively (3× min -> 10× max) to compensate for the 266K
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

            # ── 1c. Rest-Mex ya incluido en seed_pois_mexico.py ──────────────────
            restmex_biz = None

            # ── 2. Rebuild Pearson + SVD matrix ──────────────────────────────────
            logger.info("[train] Actualizando matriz de Pearson + SVD...")
            engine.prepare_pearson_matrix()

            # ── 3. Retrain RF ────────────────────────────────────────────────────
            logger.info("[train] Reentrenando Random Forest...")
            context_model.train(engine.train_data, df_biz_extra=restmex_biz)

            # ── 4b. Retrain LightFM ──────────────────────────────────────────────
            # Si LightFM falló al cargar en el boot (pickle incompatible, archivo
            # faltante, etc.) queda en None — sin este fallback, el reentrenamiento
            # nocturno lo saltaba para siempre porque solo reentrenaba una instancia
            # que ya existiera. Se crea una instancia nueva aquí mismo si hace falta,
            # así el sistema se autorecupera en el siguiente ciclo de entrenamiento.
            if lightfm_model is None:
                try:
                    from lightfm_model import SmarturLightFMModel
                    lightfm_model = SmarturLightFMModel()
                    logger.info("[train] LightFM estaba caído — instancia nueva creada para reintentar.")
                except Exception as lfm_init_err:
                    logger.warning(f"[train] No se pudo instanciar LightFM: {lfm_init_err}")
                    lightfm_model = None

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

        # ── 5. Algorithm metrics (RF + CF) ───────────────────────────────────
        logger.info("[train] Calculando métricas de algoritmos...")
        metrics = _compute_simple_metrics(engine, context_model)

        # ── 5b. Enrich with error_dist, data_quality, prediction_distribution ──
        if 'error_distribution' not in metrics:
            try:
                enrich = _compute_enrich_from_engine(engine, context_model)
                metrics.update(enrich)
            except Exception as exc:
                logger.warning(f"[train] Enrichment no disponible: {exc}")

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
                    f"HR@10={ranking.get('hit_rate', 0):.4f}, "
                    f"PrefMatch={ranking.get('preference_match_rate', 0):.4f}"
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

        # ── 7b. Append to training history ──────────────────────────────────
        try:
            from datetime import datetime, timezone
            history_path = Path(_MODELS) / "training_history.json"
            history = []
            if history_path.exists():
                with open(history_path) as _fh:
                    history = json.load(_fh)
            entry = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'best_algorithm': _best_algo,
                'sample_size': metrics.get('sample_size', 0),
            }
            best_key = metrics.get('best_algorithm', '')
            best_rmse = metrics.get('algorithms', {}).get(best_key, {}).get('rmse')
            best_mae = metrics.get('algorithms', {}).get(best_key, {}).get('mae')
            if best_rmse is not None:
                entry['rmse'] = round(float(best_rmse), 4)
            if best_mae is not None:
                entry['mae'] = round(float(best_mae), 4)
            if 'error_distribution' in metrics:
                entry['error_within_1'] = metrics['error_distribution'].get('within_1_0', 0)
            if 'ranking' in metrics:
                entry['ndcg'] = metrics['ranking'].get('ndcg', 0)
                entry['hit_rate'] = metrics['ranking'].get('hit_rate', 0)
                if 'preference_match_rate' in metrics['ranking']:
                    entry['preference_match_rate'] = metrics['ranking']['preference_match_rate']
            history.append(entry)
            # Keep last 20 entries
            history = history[-20:]
            with open(history_path, 'w') as _fh:
                json.dump(history, _fh, indent=2, ensure_ascii=False)
            logger.info(f"[train] Training history actualizado ({len(history)} entradas)")
        except Exception as h_err:
            logger.warning(f"[train] No se pudo persistir training history: {h_err}")

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
            new_quality_scores = fetch_quality_scores()
            with _models_lock:
                quality_scores = new_quality_scores
            logger.info(f"[train] Quality scores refrescados: {len(quality_scores)} servicios")
        except Exception as exc:
            logger.warning(f"[train] Quality scores no actualizados: {exc}")

        # Recalcula el warmth: tras entrenar puede haber más interacciones reales.
        _refresh_data_warmth()

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


_cv_in_progress = False  # True mientras corre la validación cruzada en background


def _run_cross_validation(k: int = 5, sample_size: int = 3000) -> None:
    """
    Background worker: k-fold cross-validation de CF/RF/GBM (ver
    cross_validation.py). Complementa el train/test split que ya calcula
    _run_full_training/_compute_simple_metrics — responde al requisito de
    que cada algoritmo se evalúe tanto con validación cruzada como con
    división train/test.
    """
    global _cv_in_progress
    _cv_in_progress = True
    try:
        from cross_validation import run_kfold_cv
        logger.info(f"[cv] Iniciando k-fold cross-validation (k={k}, sample_size={sample_size})...")
        t0 = time.time()
        cv_result = run_kfold_cv(engine, k=k, sample_size=sample_size)
        cv_result['total_execution_time_ms'] = (time.time() - t0) * 1000
        cv_result['timestamp'] = datetime.now(timezone.utc).isoformat()

        cv_path = Path(_MODELS) / "cv_metrics.json"
        with open(cv_path, 'w', encoding='utf-8') as f:
            json.dump(cv_result, f, ensure_ascii=False, indent=2)

        _persist_cv_metrics_to_db(cv_result)

        for algo, m in cv_result['algorithms'].items():
            logger.info(
                f"[cv] {algo}: RMSE={m['rmse_mean']:.4f}±{m['rmse_std']:.4f}, "
                f"MAE={m['mae_mean']:.4f}±{m['mae_std']:.4f}, "
                f"tiempo={m['avg_execution_time_ms']:.0f}ms/fold"
            )
        logger.info(f"[cv] Cross-validation completada en {cv_result['total_execution_time_ms']:.0f}ms.")
    except Exception as exc:
        logger.error(f"[cv] Error en cross-validation: {exc}", exc_info=True)
    finally:
        _cv_in_progress = False


@app.post("/cross-validation")
def cross_validation_endpoint(background_tasks: BackgroundTasks, k: int = 5, sample_size: int = 3000):
    """
    Inicia k-fold cross-validation de CF/RF/GBM en background. Guarda el
    resultado en models/cv_metrics.json y en la tabla
    ml_cross_validation_metrics. Consultar el resultado con GET /cross-validation.
    """
    if engine is None:
        raise HTTPException(status_code=503, detail="Modelos no cargados.")
    if _cv_in_progress:
        return {"ok": False, "message": "Cross-validation ya en curso."}
    background_tasks.add_task(_run_cross_validation, k, sample_size)
    return {"ok": True, "message": f"Cross-validation iniciada en background (k={k}, sample_size={sample_size})"}


@app.get("/cross-validation")
def get_cross_validation():
    """Devuelve el último resultado de cross-validation guardado en disco."""
    cv_path = Path(_MODELS) / "cv_metrics.json"
    if not cv_path.exists():
        raise HTTPException(status_code=404, detail="Sin resultados de cross-validation aún. Ejecuta POST /cross-validation primero.")
    with open(cv_path, 'r', encoding='utf-8') as f:
        return json.load(f)


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
        _, restmex_biz = _get_restmex_data()
        context_model.train(engine.train_data, df_biz_extra=restmex_biz)
        return {"status": "ok", "message": "Modelo entrenado y guardado correctamente."}
    except Exception as e:
        logger.error(f"Error entrenando modelo: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Route Optimizer (ACO) ────────────────────────────────────────────────────

class OptimizeStop(BaseModel):
    lat: float
    lng: float
    name: str = ''
    duration_minutes: Optional[int] = None   # dwell time at this stop
    open_minutes: Optional[int] = None        # opening time in minutes from midnight
    close_minutes: Optional[int] = None       # closing time in minutes from midnight


class OptimizeRouteRequest(BaseModel):
    stops: List[OptimizeStop]
    start_minutes: int = 540  # departure time in minutes from midnight (default 09:00)


@app.post("/optimize-route")
def optimize_route_endpoint(req: OptimizeRouteRequest):
    """
    Ant Colony Optimization for itinerary stop ordering with time-window support.
    Keeps the first stop fixed as departure and finds the shortest open path
    through the remaining stops.

    Optional per-stop fields: duration_minutes, open_minutes, close_minutes.
    Optional request field: start_minutes (default 540 = 09:00).

    Returns:
        optimized_order (indices into input stops),
        original_distance_km, optimized_distance_km, savings_pct.
    """
    if len(req.stops) < 2:
        raise HTTPException(
            status_code=422,
            detail="Se necesitan al menos 2 paradas para optimizar",
        )
    stops = [
        {
            "lat": s.lat,
            "lng": s.lng,
            "name": s.name,
            "duration_minutes": s.duration_minutes,
            "open_minutes": s.open_minutes,
            "close_minutes": s.close_minutes,
        }
        for s in req.stops
    ]
    result = _aco_optimize(stops, start_minutes=req.start_minutes)
    return result


# ─── WellTur — Wellness Tourism Endpoints ────────────────────────────────────

class WellnessAssessmentRequest(BaseModel):
    q1: int = Field(..., ge=1, le=4, description="Energía cognitiva (1=muy alta, 4=muy baja)")
    q2: int = Field(..., ge=1, le=4, description="Tensión física")
    q3: int = Field(..., ge=1, le=4, description="Rumiación / pensamientos recurrentes")
    q4: int = Field(..., ge=1, le=4, description="Activación negativa / nerviosismo")
    top_n: int = Field(default=3, ge=1, le=10)
    user_preferences: Optional[Dict[str, Any]] = None
    region_filter: Optional[str] = None  # e.g. "Veracruz"


class WellnessDestinationItem(BaseModel):
    id_destino: str
    nombre_lugar: str
    estado: str
    categoria_wellness: str
    match_pct: float
    beneficio_optimo_pct: float
    alineacion_pct: float
    wellness_sentiment_score: float
    rank: int
    nivel_aislamiento: float
    restauracion_pasiva: float
    demanda_fisica: float
    lat: Optional[float] = None
    lon: Optional[float] = None
    descripcion_bienestar: str
    beneficio_descripcion: str


class WellnessAssessmentResponse(BaseModel):
    perfil_interno: str
    modo_viaje: str          # 'modo_calma' | 'modo_restauracion' | 'modo_equilibrio'
    modo_viaje_label: str    # 'Modo Calma' | 'Modo Restauración' | 'Modo Equilibrio'
    modo_viaje_description: str
    confianza: float
    metodo: str
    destinations: List[WellnessDestinationItem]


_wellness_destinations_cache: Optional[Any] = None


def _get_wellness_destinations():
    global _wellness_destinations_cache
    if _wellness_destinations_cache is None:
        try:
            from wellness_matchmaker import load_destinations
            _wellness_destinations_cache = load_destinations()
        except Exception as e:
            logger.warning(f"[wellness] No se pudo cargar destinos: {e}")
            import pandas as pd
            _wellness_destinations_cache = pd.DataFrame()
    return _wellness_destinations_cache


@app.post("/wellness/assess", response_model=WellnessAssessmentResponse)
def wellness_assess(payload: WellnessAssessmentRequest):
    """
    Clasifica el perfil de vitalidad del usuario (Q1-Q4) y retorna
    las top-N recomendaciones de destinos wellness.
    Nunca expone el nombre técnico interno en modo_viaje.
    """
    try:
        from wellness_classifier import (
            get_classifier,
            MODO_VIAJE_LABELS,
            MODO_VIAJE_DESCRIPTION,
        )
        from wellness_matchmaker import recommend_wellness

        clf = get_classifier()
        perfil, modo, proba_map, confianza, metodo = clf.predict(
            payload.q1, payload.q2, payload.q3, payload.q4
        )

        destinations_df = _get_wellness_destinations()
        recs = recommend_wellness(
            destinations=destinations_df,
            perfil=perfil,
            q1=payload.q1,
            q2=payload.q2,
            q3=payload.q3,
            q4=payload.q4,
            top_n=payload.top_n,
            stress_confidence=confianza,
            user_preferences=payload.user_preferences,
            region_filter=payload.region_filter,
        )

        return WellnessAssessmentResponse(
            perfil_interno=perfil,
            modo_viaje=modo,
            modo_viaje_label=MODO_VIAJE_LABELS.get(modo, modo),
            modo_viaje_description=MODO_VIAJE_DESCRIPTION.get(modo, ""),
            confianza=round(confianza, 3),
            metodo=metodo,
            destinations=[WellnessDestinationItem(**r) for r in recs],
        )
    except Exception as e:
        logger.error(f"[wellness] Error en assessment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/wellness/destinations")
def wellness_destinations(
    estado: Optional[str] = Query(None),
    categoria: Optional[str] = Query(None),
    approved_only: bool = Query(True),
):
    """
    Lista destinos wellness disponibles en el catálogo.
    Si approved_only=True, solo retorna los aprobados por el admin.
    """
    try:
        df = _get_wellness_destinations()
        if df.empty:
            return {"destinations": []}

        if estado:
            df = df[df.get("estado", "").str.lower() == estado.lower()]
        if categoria:
            cat_col = "categoria_wellness" if "categoria_wellness" in df.columns else "categoria_principal"
            df = df[df[cat_col].str.lower() == categoria.lower()]
        if approved_only and "wellness_status" in df.columns:
            df = df[df["wellness_status"] == "approved"]

        return {"destinations": df.to_dict(orient="records"), "total": len(df)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/wellness/pending-count")
def wellness_pending_count():
    """
    Conteo de servicios/POIs pendientes de validación wellness.
    Usada por AdminBadgesContext para el badge del sidebar.
    """
    try:
        import psycopg2
        conn = psycopg2.connect(
            host=os.getenv("POI_DB_HOST", "localhost"),
            port=int(os.getenv("POI_DB_PORT", 5432)),
            database=os.getenv("POI_DB_NAME", "smartur"),
            user=os.getenv("POI_DB_USER", "postgres"),
            password=os.getenv("POI_DB_PASSWORD", os.getenv("DB_PASSWORD", "")),
        )
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM tourist_service WHERE wellness_status = 'pending'"
            )
            ts_count = cur.fetchone()[0]
            cur.execute(
                "SELECT COUNT(*) FROM point_of_interest WHERE wellness_status = 'pending'"
            )
            poi_count = cur.fetchone()[0]
        conn.close()
        return {"total_pending": ts_count + poi_count, "services": ts_count, "pois": poi_count}
    except Exception as e:
        logger.warning(f"[wellness] pending-count DB error: {e}")
        return {"total_pending": 0, "services": 0, "pois": 0}


@app.post("/wellness/train")
def wellness_train(background_tasks: BackgroundTasks):
    """Re-entrena el clasificador de perfil wellness en background."""
    def _train():
        try:
            from wellness_classifier import WellnessProfileClassifier
            clf = WellnessProfileClassifier()
            metrics = clf.train()
            logger.info(f"[wellness-train] Completado: accuracy={metrics.get('accuracy', '?'):.3f}")
        except Exception as e:
            logger.error(f"[wellness-train] Error: {e}")

    background_tasks.add_task(_train)
    return {"ok": True, "message": "Entrenamiento wellness iniciado en background"}


@app.get("/wellness/metrics")
def wellness_metrics():
    """Devuelve métricas del clasificador wellness guardadas en meta.json."""
    meta_path = Path("../models/wellness/wellness_profile.meta.json")
    if not meta_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Modelo no entrenado aún. Ejecuta POST /wellness/train primero.",
        )
    with open(meta_path, encoding="utf-8") as f:
        meta = json.load(f)
    return {
        "classifier": {
            "accuracy": meta.get("accuracy"),
            "macro_f1": meta.get("macro_f1"),
            "classification_report": meta.get("classification_report", {}),
            "trained_at": meta.get("trained_at"),
            "n_samples": meta.get("n_samples"),
            "dataset": meta.get("dataset", "synthetic"),
        },
        "disclaimer": (
            "Métricas generadas sobre datos sintéticos (5,000 registros ATARAXIA). "
            "No reflejan desempeño con usuarios reales hasta acumular feedback de fit_rating."
        ),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
