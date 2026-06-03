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

# Seed dirs — fuera de los paths montados por los volúmenes.
# El entrypoint (root) copia a /app/data y /app/models si no existen.
COPY data/ ./data_seed/
COPY models/ ./models_seed/
COPY src/ ./src/

RUN mkdir -p /app/data /app/models

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Crear usuario no-root y ceder propiedad de los directorios de trabajo
RUN addgroup --gid 1001 --system modeluser \
 && adduser --uid 1001 --system --ingroup modeluser --no-create-home modeluser \
 && chown -R modeluser:modeluser /app

USER modeluser

WORKDIR /app/src

EXPOSE 8000

ENTRYPOINT ["sh", "/app/entrypoint.sh"]
