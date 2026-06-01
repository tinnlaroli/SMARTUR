# SMARTUR API (FastAPI + motor de recomendación)
FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN addgroup --system --gid 1001 modelgroup \
    && adduser --system --uid 1001 --ingroup modelgroup modeluser

# Seed dirs — fuera de los paths que montan los volúmenes.
# El entrypoint copia a /app/data y /app/models si aún no existen.
COPY --chown=modeluser:modelgroup data/ ./data_seed/
COPY --chown=modeluser:modelgroup models/ ./models_seed/
COPY --chown=modeluser:modelgroup src/ ./src/

# Directorios destino (pueden ser sobreescritos por volúmenes)
RUN mkdir -p /app/data /app/models && \
    chown modeluser:modelgroup /app/data /app/models

COPY --chown=modeluser:modelgroup entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

WORKDIR /app/src

USER modeluser

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
