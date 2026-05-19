# SMARTUR — Enterprise Architecture Whitepaper
**Version:** 2.1 | **Date:** 2026-05-13 | **Classification:** Internal Technical Reference

---

## 1. Executive Summary

SMARTUR is a **Polyglot Microservices** platform for smart tourism in the Altas Montañas region of Veracruz, México. Its core value proposition is a **Hybrid Recommender System** that fuses Collaborative Filtering (Pearson similarity) with a Contextual Random Forest, enabling personalized Point-of-Interest (POI) discovery for tourists while simultaneously providing a B2B certification and analytics suite for service owners.

The system operates as a Docker Compose monorepo, orchestrating seven containerized services across a shared internal bridge network (`smartur-net`). The architecture separates concerns along functional boundaries: presentation, business logic, inference, and persistence are handled by distinct, independently deployable containers.

---

## 2. Architecture Pattern

**Pattern:** Polyglot Microservices with a Layered Backend

| Layer | Services | Responsibility |
|---|---|---|
| Presentation | `LANDING` (Astro 5), `PLATAFORMA` (React 19) | Client-side rendering, routing, UI state |
| API Gateway / Business Logic | `API` (Node.js/Express) | Authentication, authorization, CRUD orchestration |
| Inference | `MODELO` (Python/FastAPI) | Stateless ML inference, training trigger |
| Persistence | `postgres` (PostgreSQL 16), `redis` (Redis 7) | Relational durability, session/cache |
| Observability | `grafana` | Operational dashboards |

**Key Architectural Properties:**
- **Decoupling via network DNS:** Inter-service communication uses Docker's internal DNS (e.g., `http://postgres:5432`, `http://modelo:8000`) rather than IP addresses, enabling service relocation without reconfiguration.
- **Persistence Ignorance:** The MODELO inference layer accesses data through `poi_repository.py` and a CSV-backed data layer, isolating the ML pipeline from the primary PostgreSQL schema used by the Node.js API.
- **Stateless Services:** Both the `API` and `MODELO` services are stateless. `API` externalizes session state to Redis; `MODELO` externalizes model weights to a `.joblib` file on disk, making both horizontally scalable.
- **Separation of Concerns (B2B / B2C):** The `LANDING` service (Astro, SSR-capable) targets B2B service-owner onboarding with i18n (ES/EN/FR). The `PLATAFORMA` service (React SPA) serves both B2C tourists and the B2B admin dashboard via role-based routing.

---

## 3. Service Topology

### 3.1 LANDING — B2B Onboarding Portal
- **Runtime:** Astro 5.16, React 19 (islands architecture), Tailwind CSS v3.4
- **Port:** `4321` (host) → `4321` (container)
- **Role:** Entry point for service owners. Funnels tourists downstream via `PUBLIC_TOURIST_APP_URL → http://plataforma:5173/`.
- **Notable libraries:** Three.js 0.180, GSAP 3.13, Lenis (smooth scroll), Framer Motion 12, Spline runtime. Heavy 3D/animation budget reflects a marketing-first context.
- **Dependency:** Depends on `plataforma` container being healthy before starting.

### 3.2 PLATAFORMA — Tourist App & Admin Dashboard
- **Runtime:** React 19.2, Vite 7.2, TypeScript 5.9, Tailwind CSS v4.1, React Router v7
- **Port:** `5173` (host) → `5173` (container)
- **Role:** Dual-mode SPA. Routes bifurcate by JWT role claim:
  - `/` → Public tourist landing (unauthenticated)
  - `/form` → AI Recommendation Wizard (`ProtectedRoute`, role=2, tourists only)
  - `/dashboard/*` → Admin panel (`ProtectedRoute`, role=1, operators only)
- **Key client libraries:** MapLibre GL 5.21 (POI map), Axios 1.13, GSAP 3.14, Framer Motion 12.35, clsx + tailwind-merge.
- **Critical integration note:** The `/form` feature calls MODELO directly via `VITE_MODELO_URL`, bypassing the Node.js API. This is an intentional decoupling to reduce inference latency by eliminating an extra network hop, but introduces a known CORS surface — see Section 7.

### 3.3 API — Business Logic & Auth Gateway
- **Runtime:** Node.js + Express, CommonJS
- **Port:** `4000` (host) → `3000` (container)
- **Authentication:** JWT (Bearer token) + Google OAuth 2.0 + bcrypt password hashing. 2FA endpoint rate-limited to 5 req/min.
- **Authorization:** RBAC middleware (`rbacMiddleware.js`) + ownership guards (`ownershipMiddleware.js`).
- **Security hardening:** Helmet.js with custom CSP, CORS whitelist derived from `FRONTEND_URL` env var, `trust proxy` enabled for reverse-proxy deployments.
- **Data access pattern:** Active Record / Model layer (e.g., `userModel.js`, `pointOfInterestModel.js`) using `pg` (node-postgres) with direct SQL. No ORM.
- **Persistence dependencies:** Requires both `postgres` and `redis` to pass healthchecks before starting (`depends_on: condition: service_healthy`).
- **API surface:** 21 route modules, all mounted under `/api/v2`. Self-documenting via Swagger UI (`/api-docs`) and a dedicated security audit spec (`/security-docs`).
- **Media:** Cloudinary SDK for image asset management (avatar uploads, POI photos).
- **Notifications:** Nodemailer (SMTP via Gmail app password).

### 3.4 MODELO — Hybrid Inference Service
- **Runtime:** Python 3.14, FastAPI, Uvicorn (ASGI)
- **Port:** `8000` (host) → `8000` (container)
- **Role:** Stateless inference microservice. Exposes a pure recommendation API; has no knowledge of user identity management or business CRUD.
- **Boot sequence:** On startup, loads `SmarturEngine` (Pearson/KNN) and `SmarturContextModel` (Random Forest). If no `.joblib` exists, trains RF from CSV data (up to ~5 minutes). `SKIP_MODEL_BOOT=1` bypasses this for hot-reload development.
- **Healthcheck:** `start_period: 300s` accounts for cold-start training time.
- **Data sources:** `MODELO/data/data_reviews_limpio.csv` (user-item interactions, Yelp-derived), `data_negocios_limpio.csv` (business catalog). Production recommendations use live POIs from PostgreSQL via `poi_repository.py`.

### 3.5 PostgreSQL 16-alpine
- **Port:** `5432`
- **Role:** Primary relational store. Serves both the `API` (business entities, users, certifications) and `MODELO` (live POI data via `poi_repository.py`).
- **Persistence:** Docker named volume `postgres_data`.
- **Schema management:** Sequential migration files in `API/migrations/` (e.g., `001_add_image_rating.sql`).

### 3.6 Redis 7-alpine
- **Port:** `6379`
- **Role:** Ephemeral key-value store. Used by the `API` service for session caching and rate-limit state. Password-protected via `--requirepass`.

### 3.7 Grafana
- **Port:** `4001`
- **Role:** Operational observability. Dashboards for monitoring service health and tourism analytics metrics.

---

## 4. Data Flow: Request Lifecycle

### 4.1 Standard API Request (Authenticated CRUD)

```
Browser (PLATAFORMA)
  │  HTTP + JWT Bearer
  ▼
API :4000 (Node.js/Express)
  │  authMiddleware → JWT verify → rbacMiddleware → controller
  ├─► PostgreSQL :5432  (read/write business data)
  └─► Redis :6379       (session cache lookup / write)
  │
  ◄── JSON response (UTF-8 enforced)
  │
Browser (PLATAFORMA) renders result
```

### 4.2 AI Recommendation Request (Direct-to-Inference)

```
Browser (PLATAFORMA /form)
  │  POST /recommend/{user_id}  +  { alpha, context, top_n }
  ▼
MODELO :8000 (FastAPI/Uvicorn)
  │
  ├─► poi_repository.py → PostgreSQL :5432
  │     fetch_all_items() — live local POIs (Altas Montañas)
  │     fetch_traveler_profile(user_id) — persisted preference profile
  │
  ├─► fusion.recommend_hybrid()
  │     [See Section 5 — ML Pipeline]
  │
  ◄── RecommendationResponse { user_id, recommendations[], alpha }
  │
Browser renders RecItem cards (item_id, title, score, pred_cf, pred_rf, kind)
```

Note: The MODELO service is called directly from the browser. The Node.js API is **not** in the inference path.

---

## 5. Hybrid ML Pipeline — Core Value Proposition

The SMARTUR recommender implements a two-phase **Retrieval → Ranking** pipeline.

### 5.1 Phase A — Candidate Retrieval

**Production mode** (PostgreSQL POIs available):
- `poi_repository.fetch_all_items()` returns all live POIs from the local database.
- These become the exclusive candidate pool. `effective_alpha = 0.0` (CF is not applied, as no user-item interaction data exists for local POIs).

**Development/Fallback mode** (no DB connection):
- `SmarturEngine.get_candidate_pool(user_id, top_n=200)` — KNN retrieval over a sparse user-item interaction matrix (Yelp reviews CSV).
- Returns up to 200 candidate business IDs.

### 5.2 Phase A — Filtering

**Hard filter** (`filtro_duro`): Eliminates candidates that violate non-negotiable user constraints (binary deal-breakers):
- `requiere_accesibilidad` → removes non-accessible venues
- `pref_outdoor` → removes indoor-only venues
- `needs_hotel` → restricts to hotel/travel category
- `pref_food=False` → excludes restaurants

**Soft filter** (`filtrar_candidatos_por_contexto`): Applies a category affinity bias using `MAPEO_CATEGORIAS` — a curated mapping from SMARTUR tourism types (e.g., "Aventura", "Cultural") to Yelp category strings. If no candidates survive, all are restored (graceful degradation).

### 5.3 Phase B — Contextual Re-Ranking

**Collaborative Filtering score** (`pred_cf`):
- Algorithm: Pearson similarity over a mean-centered sparse user-item matrix (`scipy.sparse`), equivalent to KNN with Pearson distance.
- Cold-start strategy: users absent from the matrix receive the global average rating.
- `predict_cf_pearson()` in `cf.py`.

**Random Forest score** (`pred_rf`):
- Algorithm: Scikit-learn `RandomForestRegressor` trained on a feature vector combining:
  - **Item features:** encoded category, accessibility flag, outdoor flag.
  - **User context features:** budget, age bracket, tourism types, group composition, accessibility requirement, outdoor preference.
  - **Interaction features:** mean rating, review count.
- Model persisted to `.joblib` on disk; reloaded on boot. Triggerable via `POST /train-rf`.

**Score fusion:**
```
final_score = (effective_alpha × pred_cf) + ((1 − effective_alpha) × pred_rf)
```
- Default `alpha = 0.4` (blends CF and RF).
- Production override: `effective_alpha = 0.0` (pure RF, since CF has no signal for local POIs).

### 5.4 Phase B — Diversity Re-Ranking

`_diversify()` applies a category-capped re-ranking: at most `max_per_main_cat=2` items from the same primary category appear in the final top-N. Items above the cap are demoted to an overflow list. This ensures result diversity without sacrificing relevance order within each category.

### 5.5 Context Merging

On `POST /recommend/{user_id}`, the service merges two context sources:
1. **Persisted traveler profile** from PostgreSQL (`fetch_traveler_profile`).
2. **In-session context** from the request body.

Request context takes precedence (right-wins merge), so real-time wizard adjustments always override stored defaults. This enables both cold-start context (first-time users with no DB profile) and warm-start enrichment (returning users).

---

## 6. Infrastructure & Container Orchestration

### 6.1 Docker Compose Network

All services share `smartur-net` (bridge driver). Inter-service communication uses Docker's embedded DNS:
- `postgres:5432`, `redis:6379`, `modelo:8000`, `plataforma:5173`, `landing:4321`.

### 6.2 Startup Dependency Graph

```
postgres (healthcheck: pg_isready)
    ├── api (depends_on: postgres healthy, redis healthy)
    └── modelo (depends_on: postgres healthy)
         └── plataforma (depends_on: api)
              └── landing (depends_on: plataforma)

redis (healthcheck: redis-cli ping)
    └── api (depends_on: redis healthy)

grafana (independent — no service dependencies)
```

### 6.3 Health Checks

| Service | Mechanism | Interval | Start Period |
|---|---|---|---|
| postgres | `pg_isready` | 10s | — |
| redis | `redis-cli incr ping` | 10s | — |
| api | `curl /health` | 30s | 20s |
| modelo | Python urllib GET `/docs` | 30s | 300s |

The 300-second start period on `modelo` accommodates cold-start RF training.

### 6.4 Persistence Volumes

| Volume | Service | Purpose |
|---|---|---|
| `postgres_data` | postgres | WAL + relation files |
| `redis_data` | redis | RDB snapshot |
| `grafana_data` | grafana | Dashboard definitions |

### 6.5 Override Strategy

`docker-compose.override.yml` provides development-specific overrides (volume mounts for hot-reload, `SKIP_MODEL_BOOT=1`, etc.) without modifying the production compose file.

---

## 7. Known Architectural Risks

The following issues are confirmed by code review and represent technical debt with production impact.

| Severity | Issue | Location | Architectural Impact |
|---|---|---|---|
| P0 | `localhost:8000` hardcoded as MODELO base URL | `PLATAFORMA/src/features/form/api/formApi.ts:4` | Breaks inference in Docker — should read `VITE_MODELO_URL` |
| P0 | Fallback user `{ id: 2 }` when auth context is missing | `Step4Condiciones.tsx:39` | Privacy leak; pollutes recommendation telemetry |
| P0 | `AbortController.signal` never forwarded to Axios | `useFormRecommendations.ts` | Requests cannot be cancelled; memory/connection leak on unmount |
| P1 | `description` and `category` absent from `RecItem` | `MODELO/src/api.py` (RecItem schema) | UI always shows placeholder text for POI cards |
| P1 | `visitado` field collected in wizard but excluded from context | `Step4Condiciones.tsx buildAIContext()` | Feature data silently dropped; model operates on incomplete context |
| P1 | `item_id` type mismatch (`str` in Python, `number` in TypeScript) | Schema boundary | Silent coercion failures in React rendering |
| P1 | CORS wildcard `allow_origins=["*"]` on MODELO | `MODELO/src/api.py` | Exposes inference endpoint to any origin in production |
| P1 | 4× `setTimeout` without `clearTimeout` in LANDING | LANDING animation components | Memory leaks on SPA route transitions |

---

## 8. Technology Matrix

| Service | Language | Framework | Key Dependencies | Tailwind |
|---|---|---|---|---|
| LANDING | TypeScript/Astro | Astro 5.16 | Three.js, GSAP, Lenis, Framer Motion | v3.4 |
| PLATAFORMA | TypeScript/React | React 19.2 + Vite 7.2 | MapLibre GL, Axios, React Router v7 | v4.1 |
| API | JavaScript/Node | Express (CJS) | pg, Redis, JWT, Helmet, Cloudinary, Multer | — |
| MODELO | Python 3.14 | FastAPI + Uvicorn | scikit-learn, pandas, scipy.sparse, joblib, psycopg2 | — |
| DB | SQL | PostgreSQL 16-alpine | — | — |
| Cache | — | Redis 7-alpine | — | — |
| Observability | — | Grafana (latest) | — | — |

**Note:** LANDING (Tailwind v3) and PLATAFORMA (Tailwind v4) use incompatible design token systems. CSS custom properties from one cannot be consumed by the other without explicit alignment.

---

## 9. Architectural Recommendations

1. **Introduce an API Gateway for MODELO:** Route all inference calls through the Node.js API (`/api/v2/recommend`) to centralize auth enforcement, rate limiting, and observability. Eliminates the direct browser→MODELO path that currently bypasses all security middleware.

2. **Implement code-splitting in PLATAFORMA:** The tourist landing, recommendation wizard, and admin dashboard are co-bundled. Lazy-load `/dashboard` routes to reduce initial bundle size for tourists.

3. **Align Tailwind versions:** Standardize on Tailwind v4 across LANDING and PLATAFORMA, or extract a shared design token layer (CSS custom properties in a shared package) to enable consistent theming.

4. **Externalise RF model artifacts:** Move `.joblib` storage to a named Docker volume or object storage (e.g., S3-compatible) to decouple model versioning from container lifecycle.

5. **Add CI health gates:** The `start_period: 300s` on MODELO is a correctness smell — if boot consistently requires training, consider pre-baking the trained artifact into the Docker image during CI.

---

*Document generated by automated architectural audit. Verified against live codebase at `C:\Users\tinn\Documents\Dev\SMARTUR\DEVELOPMENT` on 2026-05-13.*
