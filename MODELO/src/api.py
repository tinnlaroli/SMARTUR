import logging
import os
import time
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

"""
SMARTUR API — 3 algoritmos ML (CF+KNN/Pearson, Random Forest, Gradient Boosting),
comparativa de métricas, persistencia de resultados en PostgreSQL.
"""

from engine import SmarturEngine
from rf_model import SmarturContextModel
from gbm_model import SmarturGbmModel
from fusion import recommend_hybrid
from model_metrics import compare_algorithms, load_metrics, save_metrics
from poi_repository import (
    fetch_all_items,
    fetch_latest_model_metrics,
    fetch_latest_recommendations,
    fetch_traveler_profile,
    get_poi_connection,
    save_model_metrics,
    save_recommendation_session,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smartur-api")

engine = None
context_model = None
gbm_model = None
algorithm_metrics: Dict[str, Any] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine, context_model, gbm_model, algorithm_metrics
    if os.getenv("SKIP_MODEL_BOOT") == "1":
        logger.warning("SKIP_MODEL_BOOT=1: saltando carga de modelos en arranque")
        yield
        return
    try:
        logger.info("Cargando Motor CF (Pearson + KNN)...")
        engine = SmarturEngine()
        engine.prepare_pearson_matrix()

        logger.info("Cargando Random Forest contextual...")
        context_model = SmarturContextModel()
        if not context_model.load():
            logger.info("RF no encontrado; entrenando...")
            context_model.train(engine.train_data)

        logger.info("Cargando Gradient Boosting contextual...")
        gbm_model = SmarturGbmModel()
        if not gbm_model.load():
            logger.info("GBM no encontrado; entrenando...")
            gbm_model.train(engine.train_data)

        algorithm_metrics = load_metrics()
        if not os.path.exists(
            os.path.join(os.path.dirname(__file__), '..', 'models', 'algorithm_metrics.json')
        ):
            logger.info("Comparando 3 algoritmos ML (primera ejecución)...")
            algorithm_metrics = compare_algorithms(
                engine, context_model, gbm_model, sample_size=500
            )
            save_metrics(algorithm_metrics)
            try:
                save_model_metrics(algorithm_metrics)
            except Exception as e:
                logger.warning(f"No se pudieron guardar métricas en BD: {e}")

        logger.info(
            "SMARTUR listo. Mejor algoritmo: %s",
            algorithm_metrics.get('best_algorithm', 'hybrid_triple'),
        )
    except Exception as e:
        logger.error(f"Error crítico en el arranque: {e}")
        raise RuntimeError(f"Boot abortado: Los modelos no pudieron cargar ({e})")
    yield


app = FastAPI(
    title="SMARTUR Recommender API",
    version="3.0",
    description=(
        "API de recomendación híbrida con 3 algoritmos ML: "
        "CF Pearson+KNN, Random Forest y Gradient Boosting."
    ),
    lifespan=lifespan,
)

_CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:5173",
).split(",")

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
    pred_gbm: Optional[float] = None
    kind: str = 'poi'
    image_url: Optional[str] = None


class RecommendationResponse(BaseModel):
    user_id: str
    recommendations: List[RecItem]
    alpha: float
    best_algorithm: str = 'hybrid_triple'
    execution_time_ms: float = 0.0
    session_id: Optional[int] = None


class StoredRecommendationResponse(BaseModel):
    user_id: str
    session_id: int
    recommendations: List[RecItem]
    alpha: Optional[float] = None
    best_algorithm: Optional[str] = None
    execution_time_ms: Optional[float] = None
    created_at: Optional[str] = None


class RecommendRequest(BaseModel):
    alpha: float = Field(0.4, ge=0.0, le=1.0)
    context: Optional[Dict[str, Any]] = None
    top_n: int = Field(5, ge=1, le=50)


def _run_recommendation(user_id: str, alpha: float, context: Optional[dict], top_n: int):
    if engine is None or context_model is None:
        raise HTTPException(status_code=503, detail="Modelos no cargados.")

    local_items = fetch_all_items()
    if local_items is None or local_items.empty:
        raise HTTPException(
            status_code=503,
            detail="No hay lugares locales disponibles para recomendar.",
        )

    t0 = time.perf_counter()
    recs = recommend_hybrid(
        user_id=user_id,
        engine=engine,
        context_model=context_model,
        gbm_model=gbm_model,
        alpha=alpha,
        context=context,
        top_n=top_n,
        metrics_config=algorithm_metrics,
    )
    elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)

    best_algo = algorithm_metrics.get('best_algorithm', 'hybrid_triple')
    session_id = None
    try:
        session_id = save_recommendation_session(
            user_id=user_id,
            recommendations=recs,
            alpha=alpha,
            best_algorithm=best_algo,
            execution_time_ms=elapsed_ms,
            context=context,
        )
    except Exception as e:
        logger.warning(f"No se pudo persistir recomendación: {e}")

    return recs, elapsed_ms, best_algo, session_id


@app.get("/health")
def health():
    return {
        "status": "ok",
        "engine_ready": engine is not None and engine.user_item_matrix is not None,
        "rf_ready": context_model is not None and getattr(context_model, 'is_fitted', False),
        "gbm_ready": gbm_model is not None and getattr(gbm_model, 'is_fitted', False),
        "users_count": (
            engine.user_item_matrix.shape[0]
            if engine and engine.user_item_matrix is not None
            else 0
        ),
        "best_algorithm": algorithm_metrics.get('best_algorithm'),
        "skip_model_boot": os.getenv("SKIP_MODEL_BOOT") == "1",
    }


@app.get("/health/poi-db")
def health_poi_db():
    try:
        with get_poi_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"POI DB unavailable: {e}")


@app.get("/metrics/models")
def get_model_metrics():
    """
    Métricas de comparativa de los 3 algoritmos (RMSE, MAE).
    Prioriza BD; si no hay, devuelve archivo local algorithm_metrics.json.
    """
    try:
        db_metrics = fetch_latest_model_metrics()
        if db_metrics:
            return db_metrics
    except Exception as e:
        logger.warning(f"Métricas BD no disponibles: {e}")
    return {
        "metrics": algorithm_metrics or load_metrics(),
        "created_at": None,
        "source": "file",
    }


@app.post("/metrics/evaluate")
def run_model_evaluation(sample_size: int = Query(500, ge=100, le=5000)):
    """Re-ejecuta comparativa de los 3 algoritmos y persiste resultados."""
    global algorithm_metrics
    if engine is None or context_model is None or gbm_model is None:
        raise HTTPException(status_code=503, detail="Modelos no cargados.")
    t0 = time.perf_counter()
    algorithm_metrics = compare_algorithms(
        engine, context_model, gbm_model, sample_size=sample_size
    )
    save_metrics(algorithm_metrics)
    try:
        save_model_metrics(algorithm_metrics)
    except Exception as e:
        logger.warning(f"No se guardaron métricas en BD: {e}")
    elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
    return {
        "status": "ok",
        "execution_time_ms": elapsed_ms,
        "metrics": algorithm_metrics,
    }


@app.get("/recommendations/{user_id}", response_model=StoredRecommendationResponse)
def get_stored_recommendations(user_id: str):
    """
    Consulta recomendaciones persistidas (solo lectura).
    Requiere haber llamado antes a POST /recommend/{user_id}.
    """
    try:
        stored = fetch_latest_recommendations(user_id)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"BD no disponible: {e}")
    if not stored:
        raise HTTPException(
            status_code=404,
            detail="No hay recomendaciones guardadas para este usuario. "
            "Genere primero con POST /recommend/{user_id}.",
        )
    return StoredRecommendationResponse(
        user_id=stored['user_id'],
        session_id=stored['session_id'],
        recommendations=[RecItem(**r) for r in stored['recommendations']],
        alpha=stored.get('alpha'),
        best_algorithm=stored.get('best_algorithm'),
        execution_time_ms=stored.get('execution_time_ms'),
        created_at=stored.get('created_at'),
    )


@app.get("/recommend/{user_id}", response_model=RecommendationResponse)
def get_recommendation(
    user_id: str,
    alpha: float = Query(0.4, ge=0.0, le=1.0),
    top_n: int = Query(5, ge=1, le=50),
):
    try:
        recs, elapsed_ms, best_algo, session_id = _run_recommendation(
            user_id, alpha, None, top_n
        )
        return RecommendationResponse(
            user_id=user_id,
            recommendations=[RecItem(**r) for r in recs],
            alpha=alpha,
            best_algorithm=best_algo,
            execution_time_ms=elapsed_ms,
            session_id=session_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en GET recommend: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recommend/{user_id}", response_model=RecommendationResponse)
def post_recommendation(user_id: str, payload: RecommendRequest):
    try:
        merged_context = dict(payload.context) if payload.context else {}
        try:
            profile_ctx = fetch_traveler_profile(user_id)
            if profile_ctx:
                merged_context = {**profile_ctx, **merged_context}
        except Exception as e:
            logger.warning(f"Perfil no cargado para {user_id}: {e}")

        recs, elapsed_ms, best_algo, session_id = _run_recommendation(
            user_id, payload.alpha, merged_context or None, payload.top_n
        )
        return RecommendationResponse(
            user_id=user_id,
            recommendations=[RecItem(**r) for r in recs],
            alpha=payload.alpha,
            best_algorithm=best_algo,
            execution_time_ms=elapsed_ms,
            session_id=session_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en POST recommend: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/train-rf")
def train_rf():
    if engine is None or context_model is None:
        raise HTTPException(status_code=503, detail="Modelos no cargados.")
    try:
        context_model.train(engine.train_data)
        return {"status": "ok", "message": "Random Forest entrenado y guardado."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/train-gbm")
def train_gbm():
    if engine is None or gbm_model is None:
        raise HTTPException(status_code=503, detail="Modelos no cargados.")
    try:
        gbm_model.train(engine.train_data)
        return {"status": "ok", "message": "Gradient Boosting entrenado y guardado."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
