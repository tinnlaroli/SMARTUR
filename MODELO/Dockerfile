# SMARTUR API (FastAPI + motor de recomendación)
FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    YELP_DATA_DIR=/app/data \
    AUTO_BOOTSTRAP=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir -p data models _bundled/models

COPY descargar_yelp.py entrypoint.sh ./
RUN chmod +x entrypoint.sh

COPY models/ ./_bundled/models/
COPY src/ ./src/

WORKDIR /app/src

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
