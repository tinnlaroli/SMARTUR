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

COPY --chown=modeluser:modelgroup data/ ./data/
COPY --chown=modeluser:modelgroup models/ ./models/
COPY --chown=modeluser:modelgroup src/ ./src/

WORKDIR /app/src

USER modeluser

EXPOSE 8000

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
