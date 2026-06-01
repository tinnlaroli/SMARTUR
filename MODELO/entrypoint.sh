#!/bin/sh
# Siembra archivos del imagen al volumen si no existen.

SEED_DATA=/app/data_seed
SEED_MODELS=/app/models_seed
DATA=/app/data
MODELS=/app/models

echo "[entrypoint] Verificando archivos de datos y modelos..."

for f in data_reviews_mexico.csv data_negocios_mexico.csv; do
    if [ ! -f "$DATA/$f" ] && [ -f "$SEED_DATA/$f" ]; then
        echo "[entrypoint] Copiando $f al volumen..."
        cp "$SEED_DATA/$f" "$DATA/$f"
    fi
done

for f in rf_model.joblib rf_context_yelp.joblib gbm_context_yelp.joblib \
          scalers_and_encoders.pkl user_cog_df.csv user_cog_sim.npy users_list.npy \
          algorithm_metrics.json; do
    if [ ! -f "$MODELS/$f" ] && [ -f "$SEED_MODELS/$f" ]; then
        echo "[entrypoint] Copiando $f al volumen..."
        cp "$SEED_MODELS/$f" "$MODELS/$f"
    fi
done

echo "[entrypoint] Listo — iniciando API..."
exec uvicorn api:app --host 0.0.0.0 --port 8000
