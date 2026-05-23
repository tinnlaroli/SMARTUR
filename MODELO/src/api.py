import logging
import os
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

"""
SMARTUR API Base File
Define los Endpoints de recomendación mediante FastAPI.
Conecta los flujos entre el Engine de Pearson y el Modelo Contextual de RF.
"""

from engine import SmarturEngine
from rf_model import SmarturContextModel
from fusion import recommend_hybrid
import json
from pathlib import Path
from poi_repository import fetch_pois, get_poi_connection, fetch_traveler_profile

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smartur-api")

engine = None
context_model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Carga los modelos pesados una sola vez al iniciar la API."""
    global engine, context_model
    if os.getenv("SKIP_MODEL_BOOT") == "1":
        logger.warning("SKIP_MODEL_BOOT=1: saltando carga de modelos en arranque")
        yield
        return
    try:
        logger.info("Cargando Motor de Pearson (Engine)...")
        engine = SmarturEngine()
        engine.prepare_pearson_matrix()

        logger.info("Cargando Modelo de Contexto (Random Forest)...")
        context_model = SmarturContextModel()
        if not context_model.load():
            logger.info("Modelo de Random Forest no encontrado, entrenando ahora por única vez...")
            context_model.train(engine.train_data)

        logger.info("SMARTUR v2 listo para recibir peticiones.")
    except Exception as e:
        logger.error(f"Error crítico en el arranque: {e}")
        # Falla rápido y ruidosamente; previene iniciar en un estado degradado "zombie"
        raise RuntimeError(f"Boot abortado: Los modelos no pudieron cargar ({e})")
    yield


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
    score: float
    pred_cf: float
    pred_rf: float
    kind: str = 'poi'


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
        "engine_ready": engine is not None and engine.user_item_matrix is not None,
        "rf_ready": context_model is not None and getattr(context_model, 'is_fitted', False),
        "users_count": engine.user_item_matrix.shape[0] if engine and engine.user_item_matrix is not None else 0,
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
            user_id, engine, context_model, alpha=alpha, top_n=top_n
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

        # Merge traveler profile from DB with request context.
        # Request context overrides DB profile (user's in-session adjustments take precedence).
        merged_context = dict(payload.context) if payload.context else {}
        try:
            profile_ctx = fetch_traveler_profile(user_id)
            if profile_ctx:
                merged_context = {**profile_ctx, **merged_context}
                logger.info(f"Perfil de viajero cargado para usuario {user_id}")
        except Exception as e:
            logger.warning(f"No se pudo cargar perfil de viajero para {user_id}: {e}")

        recs = recommend_hybrid(
            user_id=user_id,
            engine=engine,
            context_model=context_model,
            alpha=payload.alpha,
            context=merged_context,
            top_n=payload.top_n,
        )
        return RecommendationResponse(
            user_id=user_id,
            recommendations=[RecItem(**r) for r in recs],
            alpha=payload.alpha,
        )
    except Exception as e:
        logger.error(f"Error en POST recommend: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/metrics")
def get_metrics():
    """
    Returns the latest stored algorithm metrics for the admin dashboard.
    Reads models/algorithm_metrics.json written by evaluate.py / optimize_alpha.py.
    """
    metrics_path = Path("models/algorithm_metrics.json")
    if not metrics_path.exists():
        raise HTTPException(status_code=404, detail="No hay métricas almacenadas todavía.")
    try:
        with open(metrics_path, encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error leyendo métricas: {e}")
        raise HTTPException(status_code=500, detail="Error al leer métricas.")


def _compute_simple_metrics(engine_obj, rf_model, sample_size: int = 800) -> dict:
    """
    Computes CF-Pearson + Random-Forest metrics on held-out test data.
    Does NOT require a GBM model (simplified vs. compare_algorithms).
    Returns a dict compatible with the ml_model_metrics schema.
    """
    import numpy as np
    from math import sqrt
    from sklearn.metrics import mean_absolute_error, mean_squared_error
    from cf import predict_cf_pearson
    from model_metrics import DEFAULT_METRICS

    try:
        test_data = getattr(engine_obj, 'test_data', None)
        if test_data is None or len(test_data) == 0:
            logger.warning("[metrics] No hay datos de prueba — usando métricas por defecto.")
            return dict(DEFAULT_METRICS)

        n_eval = min(sample_size, len(test_data))
        test_sample = test_data.sample(n_eval, random_state=42)

        actuals, preds_cf, preds_rf = [], [], []
        for _, row in test_sample.iterrows():
            try:
                p_cf = predict_cf_pearson(row['user_id'], row['business_id'], engine_obj)
                p_rf = float(rf_model.predict_with_context([row['business_id']], user_context=None)[0])
                if np.isnan(p_cf) or np.isnan(p_rf):
                    continue
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
    """Background worker: refreshes Pearson matrix + retrains RF + writes metrics."""
    global engine, context_model
    try:
        logger.info("[train] Actualizando matriz de Pearson...")
        engine.prepare_pearson_matrix()

        logger.info("[train] Reentrenando Random Forest...")
        context_model.train(engine.train_data)

        logger.info("[train] Calculando métricas post-entrenamiento...")
        metrics = _compute_simple_metrics(engine, context_model)

        from model_metrics import save_metrics
        save_metrics(metrics)
        logger.info(
            f"[train] Métricas guardadas localmente — mejor algoritmo: {metrics.get('best_algorithm')} "
            f"(RMSE={metrics.get('algorithms', {}).get(metrics.get('best_algorithm', ''), {}).get('rmse', '?'):.4f})"
        )

        if _persist_metrics_to_db(metrics):
            logger.info("[train] Métricas persistidas en DB correctamente.")
        else:
            logger.warning("[train] Métricas solo disponibles en archivo local (DB no actualizada).")

        logger.info("[train] Entrenamiento completado.")
    except Exception as e:
        logger.error(f"[train] Error en background training: {e}")


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
