# AGENTS.md — SMARTUR v4

## Project summary
Hybrid recommendation system (Collaborative Filtering via Pearson + KNN, and contextual Random Forest) trained on **Mexican tourism data** (REST-MEX 2025/2022 + curated Puebla/Veracruz POIs). Exposes a FastAPI on port 8000.

## Key commands

```bash
# Install deps
pip install -r requirements.txt

# Generate Mexican seed data (REST-MEX 2025/2022 + 54 curated POIs)
cd src && python seed_pois_mexico.py

# Pre-process: unify sources, fix dtypes, merge GMaps (optional)
cd src && python pre_procesamiento_mexico.py

# Start API (auto-trains RF if no model in /models) — uses Mexican data by default
cd src && python api.py
# Swagger: http://localhost:8000/docs

# Run CLI recommendation demo
cd src && python main.py

# Run evaluation (RMSE, MAE, NDCG, Precision, Hit Rate)
cd src && python evaluate.py

# Optimize alpha via grid search
cd src && python optimize_alpha.py

# Run tests
pytest          # configured: pythonpath=.,src  testpaths=tests
```

## Architecture

```
src/
  api.py                    — FastAPI entrypoint (uvicorn). Imports from sibling modules directly.
  engine.py                 — CF engine: loads CSVs, builds sparse user-item matrix, KNN model. data_source='mexico' (default)
  cf.py                     — Pearson prediction from KNN neighbors
  rf_model.py               — Random Forest contextual model with synthetic user simulation
  context_encoder.py        — Transforms React form JSON → numeric features (budget, age, tourism types, group type, match features)
  fusion.py                 — Two-stage pipeline: retrieval (KNN pool) → hard/soft filters → RF ranking → α-blended final score
  seed_pois_mexico.py       — Generates Mexican seed data: REST-MEX 2025/2022 + 54 curated Puebla/Veracruz POIs → data_*_mexico.csv
  pre_procesamiento_mexico.py — Unifies seed data + optional GMaps scrapes → final data_*_mexico.csv (columns match Yelp format)
  descargar_gmaps.py        — HTTP scraper for Google Maps (no API key). Searches Puebla+Veracruz by category. Saves to data/gmaps/
  descargar_opendata.py     — CKAN datamx.io + Veracruz HTTP open data downloader
  pre_procesamiento.py      — (legacy) NLP + extraction: Yelp JSON → data_negocios_limpio.csv, data_reviews_limpio.csv
  evaluate.py               — RMSE/MAE + ranking metrics (NDCG@K, Precision@K, Hit Rate@K)
  optimize_alpha.py         — Grid search for optimal α weight
```

## Data flow

1. **First time setup**: `seed_pois_mexico.py` → REST-MEX 2025 (208K reviews) + REST-MEX 2022 (29K) + simulated reviews for 54 curated POIs → `data/data_reviews_mexico.csv`, `data/data_negocios_mexico.csv`
2. **Optional enrichments**: `descargar_gmaps.py` scrapes Google Maps → `data/gmaps/`; `pre_procesamiento_mexico.py` merges and fixes dtypes
3. `api.py` startup → loads CSVs via `engine.py` (with `data_source='mexico'`), trains/loads RF from `models/rf_context_yelp.joblib`
4. **Training data ≠ recommendation catalog**: `fusion.py` always filters candidates to `fetch_all_items()` (local DB POIs). REST-MEX + GMaps + seed data only train model weights — never inject items into recommendations.
5. `POST /recommend/{user_id}` → `fusion.py` hybrid pipeline → JSON response

## Data sources

| Source | Reviews | Businesses | Format | Access |
|--------|---------|-----------|--------|--------|
| REST-MEX 2025 | 208K | ~120 (grouped by Town+Type) | CSV: Title, Review, Polarity, Town, Region, Type | Local file `data/Rest-Mex_2025_Train_DataSet/` |
| REST-MEX 2022 | 29K | 3 (Attractive/Hotel/Restaurant) | CSV: Title, Opinion, Polarity, Attraction | Local file `data/data_restmex_2022_clean.csv` |
| Curated POIs | 10.8K | 54 | Hardcoded dict in seed_pois_mexico.py | Built-in |
| Google Maps | ~variable | ~variable | JSON via httpx scraper | Optional, `descargar_gmaps.py` |
| Open Data (CKAN) | — | — | Blocked (datos.puebla.gob.mx unreachable) | `descargar_opendata.py` |

Yelp dataset remains available as fallback via `data_source='yelp'` in engine.py.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/recommend/{user_id}` | Hybrid CF+RF recommendation with context |
| GET | `/metrics` | Returns `models/algorithm_metrics.json` — latest RMSE/MAE/NDCG per algorithm. Used by PLATAFORMA ML dashboard. Returns 404 if no metrics file exists yet. |
| GET | `/health` | Liveness check |

## Important gotchas

- **Working directory**: All src scripts must be run from `src/` directory (relative imports like `from engine import SmarturEngine`). The Dockerfile sets `WORKDIR /app/src` for this reason.
- **pytest.ini**: `pythonpath = . src` so tests can import from `src/` without `cd src`.
- **Seed data CSVs** (`data/data_*_mexico.csv`) are NOT gitignored — they ship with the repo/Docker image so the API works immediately.
- **Legacy Yelp files**: `data/*.json` and `data/*_limpio.csv` are gitignored. Yelp available via `data_source='yelp'` if needed.
- **RF training is slow**: Trains on ~248K interactions with 35+ features. Takes several minutes on first start. API auto-trains if `models/rf_context_yelp.joblib` is missing.
- **Default data_source = 'mexico'**: `SmarturEngine(data_source='mexico')` loads `data_reviews_mexico.csv` and `data_negocios_mexico.csv`. Pass `data_source='yelp'` for legacy Yelp.
- **Default alpha = 0.2**: README recommends α=0.2 (80% RF weight, 20% CF). Code default in POST payload is 0.1.
- **CORS**: API has `allow_origins=["*"]` — permissive for local dev.
- **Context fields**: The POST `/recommend/{user_id}` endpoint accepts `context` dict with fields: `presupuesto_bucket`, `edad_range`, `tiposTurismo`, `group_type`, `wants_tours`, `needs_hotel`, `pref_food`, `requiere_accesibilidad`, `pref_outdoor`.
- **Hard filters** (`fusion.py:filtro_duro`): `needs_hotel` eliminates non-hotels; `pref_food=false` eliminates food places; `requiere_accesibilidad` eliminates non-accessible venues; `pref_outdoor` prioritizes outdoor seating.

## Docker

```bash
docker compose up --build   # image: smartur-api:local, port 8000
# First start may take several minutes if RF model is missing (healthcheck start_period: 300s)
```

## Tests

Single test file `tests/test_module.py` with basic instantiation tests. Tests gracefully handle missing data files (catch `FileNotFoundError`). For full tests, ensure cleaned CSVs exist in `data/`.
