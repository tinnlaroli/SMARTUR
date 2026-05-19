# SMARTUR — Sistema de recomendación híbrido (v4)

SMARTUR es un motor de recomendación turística que combina **tres algoritmos de machine learning**:

| # | Algoritmo | Tecnología | Rol |
|---|-----------|------------|-----|
| 1 | Filtrado colaborativo | Pearson + KNN (`NearestNeighbors`) | Predice rating por similitud entre usuarios (Yelp) |
| 2 | Random Forest contextual | `RandomForestRegressor` | Predice con features Item × Usuario × Match |
| 3 | Gradient Boosting contextual | `GradientBoostingRegressor` | Mismo vector de features; comparado y fusionado con RF |

En **producción** rankea POIs y servicios turísticos de PostgreSQL (Altas Montañas, Veracruz) con un ensemble RF+GBM y filtros por contexto del viajero. Expone una **API FastAPI** en el puerto **8000**, integrada con el monorepo SMARTUR vía Docker Compose.

Documentación técnica ampliada: [`modelo_explicado.md`](modelo_explicado.md)

---

## Tabla de contenidos

- [Requisitos](#requisitos)
- [Instalación local](#instalación-local)
- [Instalación con Docker (recomendado)](#instalación-con-docker-recomendado)
- [Base de datos y persistencia](#base-de-datos-y-persistencia)
- [Métricas de evaluación](#métricas-de-evaluación)
- [Entrenamiento y evaluación](#entrenamiento-y-evaluación)
- [API REST](#api-rest)
- [Integración con la aplicación](#integración-con-la-aplicación)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Variables de entorno](#variables-de-entorno)
- [Solución de problemas](#solución-de-problemas)

---

## Requisitos

| Componente | Versión mínima |
|------------|----------------|
| Python | 3.11+ |
| PostgreSQL | 16 (compartido con API Node) |
| Docker + Compose | Opcional; stack completo en `DEVELOPMENT/` |
| RAM | ≥ 8 GB recomendado (entrenamiento RF/GBM) |
| Disco | ~2 GB para dataset Yelp procesado + modelos |

**Dependencias Python:** ver [`requirements.txt`](requirements.txt) (`scikit-learn`, `pandas`, `fastapi`, `psycopg2-binary`, `joblib`, etc.).

---

## Instalación local

### 1. Clonar e instalar dependencias

```bash
cd MODELO
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Descargar y preprocesar datos Yelp

Los CSV y JSON en `data/` están en `.gitignore`. Primera vez:

```bash
python descargar_yelp.py
cd src
python pre_procesamiento.py
```

Genera:

- `data/data_reviews_limpio.csv`
- `data/data_negocios_limpio.csv`

### 3. Configurar PostgreSQL (POIs locales)

El servicio lee POIs y perfiles desde la misma BD que la API Node (`smartur`):

```bash
# Variables (ejemplo local)
set POI_DB_HOST=localhost
set POI_DB_PORT=5432
set POI_DB_NAME=smartur
set POI_DB_USER=postgres
set POI_DB_PASSWORD=12345678
```

Importar esquema completo (incluye tablas ML) desde el monorepo:

```bash
# Desde DEVELOPMENT/
Get-Content API\bd.sql | docker exec -i smartur-postgres psql -U postgres -d smartur
```

O solo las tablas ML en una BD ya existente:

```bash
Get-Content API\migrations\008_ml_recommendations.sql | docker exec -i smartur-postgres psql -U postgres -d smartur
```

### 4. Arrancar la API

```bash
cd src
python api.py
```

- **Swagger:** http://localhost:8000/docs  
- Si no existen `models/rf_context_yelp.joblib` ni `models/gbm_context_yelp.joblib`, entrena en el primer arranque (varios minutos).

---

## Instalación con Docker (recomendado)

El stack completo vive en `DEVELOPMENT/docker-compose.yml` (7 servicios). El servicio `modelo` es este proyecto.

```bash
cd DEVELOPMENT

# Levantar todo (postgres, api, modelo, plataforma, landing, redis, grafana)
docker compose up -d

# Solo reconstruir el MODELO tras cambios en código
docker compose build modelo
docker compose up -d modelo
```

| Servicio | Contenedor | Puerto host |
|----------|------------|-------------|
| MODELO (este repo) | `smartur-modelo` | **8000** |
| API Node | `smartur-api` | 4000 |
| PLATAFORMA | `smartur-plataforma` | 5173 |
| PostgreSQL | `smartur-postgres` | 5432 |

El contenedor `modelo` recibe automáticamente:

```yaml
POI_DB_HOST: postgres
POI_DB_PORT: 5432
POI_DB_NAME: smartur
POI_DB_USER: postgres
POI_DB_PASSWORD: ${DB_PASSWORD}
```

**Healthcheck:** hasta 300 s de `start_period` en el primer boot si faltan modelos `.joblib`.

```bash
# Estado del MODELO
docker exec smartur-modelo python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8000/health').read().decode())"

# Migración tablas ML en Postgres ya en ejecución
Get-Content API\migrations\008_ml_recommendations.sql | docker exec -i smartur-postgres psql -U postgres -d smartur
```

---

## Base de datos y persistencia

Las recomendaciones **se generan** con `POST /recommend/{user_id}` y **se consultan** con `GET /recommendations/{user_id}` (solo lectura desde BD, sin recalcular).

### Tablas (definidas en `API/bd.sql` y `API/migrations/008_ml_recommendations.sql`)

| Tabla | Uso |
|-------|-----|
| `ml_recommendation_session` | Sesión por usuario: α, algoritmo, tiempo de ejecución, contexto JSON |
| `ml_recommendation_item` | Ítems rankeados (`pred_cf`, `pred_rf`, `pred_gbm`, score, imagen) |
| `ml_model_metrics` | Historial de comparativas RMSE/MAE entre algoritmos |

Las tablas se crean también al primer `POST /recommend` vía `poi_repository.ensure_ml_tables()`.

---

## Métricas de evaluación

SMARTUR evalúa **dos tareas distintas**. Usa la métrica adecuada según el objetivo:

### Métricas de ranking (calidad del top-N para el turista)

| Métrica | Cuándo usarla | Interpretación |
|---------|---------------|----------------|
| **NDCG@K** | **Métrica principal de producto** | Calidad del orden: premia ítems relevantes arriba en la lista |
| **Hit Rate@K** | UX / negocio | ¿Aparece al menos un lugar que le gustaría? (rating test ≥ 4) |
| **Precision@K** | Comunicación simple | % del top-K que son realmente relevantes |

**Recomendación:** reportar **NDCG@5** como métrica principal de calidad de recomendación en memoria o entrega académica.

### Métricas de regresión (comparar CF, RF, GBM)

| Métrica | Cuándo usarla | Interpretación |
|---------|---------------|----------------|
| **RMSE** | **Selección del mejor algoritmo** | Error cuadrático; penaliza errores grandes (criterio en `model_metrics.py`) |
| **MAE** | Complemento a RMSE | Error medio en estrellas; más fácil de explicar (“±0.9 estrellas”) |
| Baseline (media global) | Referencia | Línea base sin ML |

### Qué métrica NO usar como principal aquí

- **AUC-ROC / F1 / log loss:** solo si conviertes el problema en clasificación binaria (gusta / no gusta). No sustituyen a NDCG para listas ordenadas.
- **RMSE sola** para validar el producto: puede elegir un modelo que predice bien estrellas pero ordena mal el top-5.

### Resumen práctico

| Pregunta | Métrica |
|----------|---------|
| ¿Los 3 algoritmos cuál es mejor? | **RMSE** (+ MAE) en test set Yelp |
| ¿Las recomendaciones mostradas son buenas? | **NDCG@K** |
| ¿Encontramos algo útil para el usuario? | **Hit Rate@K** |

### Ejemplo de resultados (referencia, n≈500)

| Componente | RMSE | MAE |
|------------|------|-----|
| Baseline | ~1.35 | ~1.11 |
| CF (Pearson + KNN) | ~1.39 | ~1.13 |
| RF contextual | ~1.43 | ~1.16 |
| GBM contextual | ~1.44 | ~1.17 |
| Híbrido triple | ~1.42 | ~1.14 |

Los valores exactos dependen de la muestra; regenerar con `python evaluate.py`.

---

## Entrenamiento y evaluación

### Comparar los 3 algoritmos y guardar configuración óptima

```bash
cd src
python evaluate.py
```

- Imprime tabla RMSE/MAE (baseline, CF, RF, GBM, híbrido).
- Calcula NDCG@5, Precision@5, Hit Rate@10.
- Guarda `models/algorithm_metrics.json` (`best_algorithm`, `best_alpha`, `local_blend`).

### Grid search del peso α (CF vs RF)

```bash
cd src
python optimize_alpha.py
```

### Desde la API (Docker o local)

```bash
# Re-evaluar y persistir en ml_model_metrics
curl -X POST "http://localhost:8000/metrics/evaluate?sample_size=500"

# Consultar última comparativa
curl http://localhost:8000/metrics/models
```

### Re-entrenar modelos bajo demanda

```bash
curl -X POST http://localhost:8000/train-rf
curl -X POST http://localhost:8000/train-gbm
```

En Docker:

```powershell
docker exec smartur-modelo python -c "import urllib.request; urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:8000/train-gbm', method='POST'))"
```

### Demo por consola

```bash
cd src
python main.py
```

### Tests

```bash
# Desde raíz MODELO (pytest.ini: pythonpath = . src)
pytest
```

---

## API REST

**Base URL:** `http://localhost:8000`  
**Documentación interactiva:** http://localhost:8000/docs

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Estado CF, RF, GBM y algoritmo seleccionado |
| `GET` | `/health/poi-db` | Conectividad PostgreSQL |
| `GET` | `/metrics/models` | Última comparativa RMSE/MAE (BD o archivo) |
| `POST` | `/metrics/evaluate` | Re-ejecuta comparativa (`?sample_size=500`) |
| `POST` | `/recommend/{user_id}` | **Genera** recomendaciones y **persiste** en BD |
| `GET` | `/recommend/{user_id}` | Genera recomendaciones (sin contexto POST) |
| `GET` | `/recommendations/{user_id}` | **Solo lectura** — última sesión guardada |
| `POST` | `/train-rf` | Re-entrena Random Forest |
| `POST` | `/train-gbm` | Re-entrena Gradient Boosting |

### Generar recomendaciones (POST)

```http
POST /recommend/1
Content-Type: application/json

{
  "alpha": 0.2,
  "top_n": 5,
  "context": {
    "presupuesto_bucket": "medio",
    "edad_range": "25-34",
    "tiposTurismo": ["naturaleza", "cultural"],
    "group_type": "pareja",
    "wants_tours": false,
    "needs_hotel": false,
    "pref_food": true,
    "requiere_accesibilidad": false,
    "pref_outdoor": true
  }
}
```

El contexto del body se fusiona con `traveler_profile` de PostgreSQL (el body tiene prioridad).

### Respuesta 200

```json
{
  "user_id": "1",
  "recommendations": [
    {
      "item_id": "9",
      "title": "Los Portales de Córdoba",
      "score": 4.451,
      "pred_cf": 4.287,
      "pred_rf": 4.287,
      "pred_gbm": 4.422,
      "kind": "poi",
      "image_url": null
    }
  ],
  "alpha": 0.2,
  "best_algorithm": "cf_knn_pearson",
  "execution_time_ms": 246.84,
  "session_id": 1
}
```

### Consultar resultados persistidos

```http
GET /recommendations/1
```

Devuelve la última sesión de `ml_recommendation_*`. Si no existe, `404` — primero hay que llamar a `POST /recommend`.

### Campos de contexto

| Campo | Valores / tipo | Efecto |
|-------|----------------|--------|
| `presupuesto_bucket` | `bajo`, `medio`, `alto`, `premium` | Match con `price_level` del POI |
| `edad_range` | `18-24` … `55+` | Feature de usuario en RF/GBM |
| `tiposTurismo` | `naturaleza`, `cultural`, `gastronomico`, `aventura`, `rural` | Filtro suave + match de categorías |
| `group_type` | `solo`, `pareja`, `familia`, `amigos` | Match romántico / niños |
| `needs_hotel` | bool | **Filtro duro:** solo hoteles |
| `pref_food` | bool | **Filtro duro:** si `false`, elimina restaurantes |
| `requiere_accesibilidad` | bool | **Filtro duro:** solo accesibles |
| `pref_outdoor` | bool | **Filtro duro:** prioriza outdoor |
| `wants_tours` | bool | Bonifica categoría tours en ML |

---

## Integración con la aplicación

```
PLATAFORMA (React)  ──POST──►  MODELO :8000/recommend/{user_id}
       │                              │
       │                              ▼
       │                        PostgreSQL (ml_recommendation_*)
       │
       └──GET──►  MODELO :8000/recommendations/{user_id}   (solo lectura)
```

- **PLATAFORMA:** `VITE_MODELO_URL=http://localhost:8000` (ver `DEVELOPMENT/docker-compose.yml`).
- **Cliente:** `PLATAFORMA/src/features/form/api/formApi.ts`.
- **API Node:** misma BD; esquema en `DEVELOPMENT/API/bd.sql`.

Flujo recomendado para cumplir persistencia “solo desde la app”:

1. Usuario completa formulario → `POST /recommend/{user_id}`.
2. Pantalla de resultados → `GET /recommendations/{user_id}`.

---

## Estructura del proyecto

```text
MODELO/
├── data/                         # CSVs Yelp + JSON (gitignored)
├── models/                       # *.joblib + algorithm_metrics.json (gitignored)
├── migrations/
│   └── 001_ml_recommendations.sql
├── src/
│   ├── api.py                    # FastAPI
│   ├── engine.py                 # Matriz CF + KNN
│   ├── cf.py                     # Predicción Pearson
│   ├── rf_model.py               # Random Forest
│   ├── gbm_model.py              # Gradient Boosting (3.er algoritmo)
│   ├── model_metrics.py          # Comparativa y mejor modelo
│   ├── context_encoder.py        # JSON React → features
│   ├── fusion.py                 # Filtros + ranking híbrido
│   ├── poi_repository.py         # Postgres POI + persistencia ML
│   ├── evaluate.py               # RMSE/MAE + NDCG/Precision/Hit Rate
│   ├── optimize_alpha.py         # Grid search α
│   ├── pre_procesamiento.py      # Yelp JSON → CSV
│   └── main.py                   # Demo CLI
├── tests/
├── descargar_yelp.py
├── Dockerfile
├── requirements.txt
├── modelo_explicado.md           # Documentación para entrega académica
├── AGENTS.md                     # Guía para agentes / desarrolladores
└── README.md                     # Este archivo
```

---

## Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `POI_DB_HOST` | `localhost` | Host PostgreSQL |
| `POI_DB_PORT` | `5432` | Puerto |
| `POI_DB_NAME` | `smartur` | Base de datos |
| `POI_DB_USER` | `postgres` | Usuario |
| `POI_DB_PASSWORD` | `12345678` | Contraseña |
| `SKIP_MODEL_BOOT` | `0` | `1` = arranque sin cargar modelos (tests) |
| `CORS_ORIGINS` | `localhost:5173,3000` | Orígenes CORS permitidos |

---

## Solución de problemas

| Problema | Solución |
|----------|----------|
| `FileNotFoundError` en CSV | Ejecutar `descargar_yelp.py` y `pre_procesamiento.py` |
| API arranca pero `503` en recommend | Verificar POIs en BD: `GET /health/poi-db`; importar `API/bd.sql` |
| Primer arranque muy lento | Normal: entrena RF+GBM; esperar healthcheck (hasta ~5 min) |
| `404` en `/recommendations/{id}` | Primero `POST /recommend/{id}` |
| Sin métricas en BD | `POST /metrics/evaluate` o `python evaluate.py` |
| Puerto 8000 ocupado | Cambiar `MODELO_HOST_PORT` en `DEVELOPMENT/.env` |

---

## Cumplimiento académico (resumen)

| Requisito | Implementación |
|-----------|----------------|
| ≥ 3 algoritmos ML | CF+KNN/Pearson, Random Forest, Gradient Boosting |
| Evaluar y elegir el mejor | `model_metrics.py`, RMSE; ranking con NDCG@K |
| API integrada | FastAPI `:8000`, Docker Compose |
| Persistencia de resultados | `ml_recommendation_*` en PostgreSQL |
| Consulta solo desde app | `GET /recommendations/{user_id}` |
| Tiempo de ejecución | `execution_time_ms` en respuesta y BD |

---

## Licencia y datos

Dataset base: [Yelp Academic Dataset](https://www.yelp.com/dataset). Uso académico según términos de Yelp.
