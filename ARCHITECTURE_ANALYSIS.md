# SMARTUR — Holistic Architecture & Technical Health Report

> Generated: 2026-05-11 | Analyst: Claude Sonnet 4.6 (Senior Fullstack Architect role)
> Working directory: `C:\Users\tinn\Documents\Dev\SMARTUR\DEVELOPMENT`

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Folder Structure Map](#folder-structure-map)
3. [System Architecture](#system-architecture)
4. [Service-by-Service Analysis](#service-by-service-analysis)
5. [AI Model Deep Dive](#ai-model-deep-dive)
6. [Recommendation Flow — End to End](#recommendation-flow--end-to-end)
7. [React-Doctor Report (PLATAFORMA)](#react-doctor-report--plataforma)
8. [Integration Blind Spots](#integration-blind-spots)
9. [UX Flow Consistency](#ux-flow-consistency)
10. [Recommendations & Priority Matrix](#recommendations--priority-matrix)

---

## Project Overview

**SMARTUR** is an AI-driven tourism ecosystem for the **Altas Montañas** region of Veracruz, Mexico. It connects:

- **Service Owners (B2B)** — Local tourism businesses that register and manage their offerings.
- **Tourists (B2C)** — Visitors who receive personalized AI-generated destination recommendations.
- **Administrators** — Platform managers who oversee inventory, evaluations, and analytics.

The system is a **multi-service Docker Compose monorepo** with a shared PostgreSQL database and Redis cache, orchestrated under a single bridge network (`smartur-net`).

---

## Folder Structure Map

```
DEVELOPMENT/
├── API/                    # Node.js/Express — Main REST backend
├── BD/                     # Database migrations & SQL schema
├── design/                 # Design assets & brand resources
├── LANDING/                # Astro — B2B Service Owner landing page
├── MOBILE/                 # Mobile app (React Native / Expo)
├── MODELO/                 # Python/FastAPI — AI Recommendation Engine
├── PLATAFORMA/             # React/Vite — Tourist B2C + Admin Dashboard
├── repositorios/           # External repo references
├── .env                    # Root-level env variables
├── docker-compose.yml      # Production orchestration
├── docker-compose.override.yml  # Development hot-reload overrides
└── AGENTS.md               # AI agent instructions
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          smartur-net (bridge)                        │
│                                                                      │
│  LANDING (Astro · :4321)           B2B — Service Owner Onboarding   │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Hero / Plans / Testimonials / Contact / i18n (ES, EN, FR)    │  │
│  │  UserSegmentation.astro — ActionBridge.astro                   │  │
│  │  → Links tourists to PLATAFORMA via PUBLIC_TOURIST_APP_URL     │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  PLATAFORMA (React+Vite · :5173)   B2C Tourist + Admin Dashboard    │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  /           → Tourist Landing (B2C)                           │  │
│  │  /form        → AI Recommendation Wizard (role=2 protected)    │  │
│  │  /dashboard   → Admin Panel (role=1 protected)                 │  │
│  │    ├── usuarios / companias / servicios / ubicaciones           │  │
│  │    ├── perfiles / actividades / certificaciones / poi           │  │
│  │    ├── estadisticas / plantillas / instrumentos                 │  │
│  └────────────────────────────────────────────────────────────────┘  │
│       │ REST /api/v2                    │ REST :8000/recommend        │
│       ↓                                ↓                             │
│  API (Node.js · :4000)          MODELO (FastAPI · :8000)            │
│  ┌────────────────────────┐     ┌──────────────────────────────┐    │
│  │ Auth (JWT + 2FA)       │     │ KNN Collaborative Filtering  │    │
│  │ CRUD for all entities  │     │ Random Forest (contextual)   │    │
│  │ Cloudinary (images)    │     │ Hybrid Fusion (alpha blend)  │    │
│  │ Google OAuth           │     │ Cold-start fallback (popular)│    │
│  │ Email (nodemailer)     │     └──────────────────────────────┘    │
│  │ Redis (cache/session)  │              │                           │
│  └────────────────────────┘              │ reads POIs                │
│           │ reads/writes                 │                           │
│           ↓                             ↓                            │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  PostgreSQL :5432                            │    │
│  │  Users / Companies / Services / Locations / POIs            │    │
│  │  Reviews / Evaluations / Instruments / Certifications        │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Redis :6379   Grafana :4001                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Port Reference

| Service | Internal Port | Host Port (default) |
|---|---|---|
| API | 3000 | 4000 |
| MODELO | 8000 | 8000 |
| PLATAFORMA | 5173 | 5173 |
| LANDING | 4321 | 4321 |
| PostgreSQL | 5432 | 5432 |
| Redis | 6379 | 6379 |
| Grafana | 3000 | 4001 |

---

## Service-by-Service Analysis

### LANDING — Astro (B2B)

**Tech stack:** Astro 5, React islands, Tailwind CSS v3, GSAP, Three.js, Framer Motion, Lenis scroll, Spline 3D, dotLottie, i18n (ES/EN/FR).

**Key files:**
- `src/pages/index.astro` — Main Spanish entry
- `src/pages/en/index.astro`, `src/pages/fr/index.astro` — i18n routes
- `src/components/UserSegmentation.astro` — Segments visitor into Owner vs Tourist
- `src/components/ActionBridge.astro` — CTA bridge linking to PLATAFORMA
- `src/components/Plans.astro` / `PlansNew.astro` — Pricing/subscription plans
- `src/components/AlgorithmDiagram.tsx` — Interactive React island explaining the AI
- `src/i18n/ui.ts`, `utils.ts` — Translation layer

**Observations:**
- LANDING is purely a marketing/onboarding page. Tourists are funneled out to PLATAFORMA.
- No recommendation form lives here — all AI interaction is in PLATAFORMA.
- There is a `_index-old-backup.astro` in pages — dead code that should be deleted.
- Two Tailwind versions in the monorepo: LANDING uses **v3**, PLATAFORMA uses **v4** — visual inconsistency risk.

---

### PLATAFORMA — React + Vite (B2C + Admin)

**Tech stack:** React 19, Vite 7, TypeScript 5.9, Tailwind CSS v4, React Router v7, Axios, GSAP, Framer Motion, MapLibre GL, Lucide React, Spline 3D.

**Feature structure (feature-sliced design):**

```
src/features/
├── auth/           # Login, Register, 2FA, ForgotPassword, ResetPassword
├── landing/        # Tourist-facing public landing (/, hero, plans, map, etc.)
├── form/           # 4-step AI recommendation wizard (/form)
│   ├── Step1PerfilBasico   — Age, budget, duration
│   ├── Step2Preferencias   — Tourism types, activity level, outdoor preference
│   ├── Step3Contexto       — Group type, needed services (hotel, transport, food)
│   ├── Step4Condiciones    — Accessibility, prior visits → triggers AI call
│   ├── RecommendationsResult — Displays AI recommendations
│   └── formApi.ts          — HTTP client to MODELO (FastAPI :8000)
├── home/           # Admin dashboard home with stats
├── users/          # CRUD for platform users
├── companies/      # CRUD for tourism companies
├── tourist-services/ # CRUD for individual tourist services
├── locations/      # CRUD for geographic locations
├── points-of-interest/ # POI management
├── profiles/       # Tourist profile archetypes
├── activities/     # Activity catalog
├── certifications/ # Service quality certifications
├── evaluations/    # Evaluation wizard + templates
├── instrument-builder/ # Custom evaluation instrument builder
└── statistics/     # Analytics dashboard
```

**Router structure (`routes/router.tsx`):**

```
/               → Landing (public)
/form           → ProtectedRoute [role=2] → AI Recommendation Form
/dashboard      → ProtectedRoute [role=1] → AppLayout
  /dashboard/usuarios
  /dashboard/companias
  /dashboard/servicios
  /dashboard/ubicaciones
  /dashboard/perfiles
  /dashboard/actividades
  /dashboard/certificaciones
  /dashboard/poi
  /dashboard/estadisticas
  /dashboard/plantillas
  /dashboard/instrumentos
  /dashboard/instrumentos/:id
```

**Shared infrastructure:**
- `shared/api/axiosClient.ts` — Centralized Axios instance reading `VITE_API_URL` + JWT interceptor + 401 auto-logout
- `contexts/ThemeContext.tsx` — Dark/light theme
- `contexts/LanguageContext.tsx` — Language switcher
- `shared/context/ToastContext.tsx` — Global toast notifications

---

### API — Node.js / Express

**Tech stack:** Node.js, Express, PostgreSQL (pg), Redis, JWT, bcrypt, nodemailer, Cloudinary, Google OAuth.

**Key directories:**
- `controllers/` — Route handlers for all entities
- `routes/` — Express route definitions
- `models/` — Database model/query layer
- `middleware/` — Auth, validation, rate limiting
- `services/` — Business logic (email, Cloudinary upload)
- `migrations/` — Database schema migrations
- `validators/` — Input validation (likely Zod or Joi)

**Auth flow:** JWT tokens + optional 2FA. Tokens stored client-side in `localStorage`. 401 interceptor in `axiosClient.ts` auto-clears localStorage and redirects to `/` on expired token.

---

### MODELO — Python / FastAPI

**Tech stack:** Python 3.14, FastAPI, uvicorn, scikit-learn, pandas, numpy, scipy, joblib, psycopg2 (PostgreSQL).

**Architecture:**

```
MODELO/src/
├── api.py              # FastAPI app, endpoints, lifespan boot
├── engine.py           # SmarturEngine — KNN collaborative filtering (Pearson)
├── rf_model.py         # SmarturContextModel — Random Forest contextual model
├── fusion.py           # recommend_hybrid() — blends CF + RF scores via alpha
├── cf.py               # Collaborative filtering utilities
├── context_encoder.py  # Encodes user context dict into feature vector for RF
├── poi_repository.py   # PostgreSQL queries for local POI data
├── pre_procesamiento.py # Data cleaning / preprocessing
├── optimize_alpha.py   # Alpha hyperparameter search
├── evaluate.py         # Offline evaluation metrics
└── main.py             # CLI entry point

MODELO/data/
├── data_reviews_limpio.csv   # Cleaned Yelp-like review interactions
└── data_negocios_limpio.csv  # Cleaned business/POI catalog
```

---

## AI Model Deep Dive

### Model Architecture

The SMARTUR recommender is a **hybrid system** combining two independent signals:

#### 1. Collaborative Filtering (CF) — `engine.py`

- **Algorithm:** K-Nearest Neighbors with cosine similarity on mean-centered user-item matrix.
- **Why centered?** Mean-centering converts cosine distance to Pearson correlation, which corrects for individual rating biases (a user who always gives 5s vs one who gives 3s as their top rating).
- **Matrix format:** `scipy.sparse.csr_matrix` — handles memory efficiently for large user×item spaces.
- **Cold-start strategy:** For users with no history, returns globally most-reviewed businesses (popularity fallback).

#### 2. Random Forest (RF) — `rf_model.py`

- **Algorithm:** Scikit-learn `RandomForestClassifier` or `Regressor`.
- **Input:** Context vector from `context_encoder.py` (budget bucket, age range, tourism types, group type, accessibility, outdoor preference, etc.)
- **Training:** Uses `engine.train_data` (80% split). Model persisted to `.joblib` on disk for fast subsequent boots.
- **Boot behavior:** On startup, loads from `.joblib` if it exists; otherwise trains from scratch (can take minutes).

#### 3. Hybrid Fusion — `fusion.py`

```
final_score = (1 - alpha) * pred_cf + alpha * pred_rf
```

- `alpha=0.1` default (GET endpoint), `alpha=0.2` used by the frontend POST.
- Lower alpha → CF-dominant (history-based).
- Higher alpha → RF-dominant (context/demographic-based).
- `optimize_alpha.py` exists for offline hyperparameter tuning.

### API Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Engine + RF readiness check, user count |
| `GET` | `/health/poi-db` | PostgreSQL connectivity check |
| `GET` | `/recommend/{user_id}` | Quick recommendation with query params |
| `POST` | `/recommend/{user_id}` | Full recommendation with context body |
| `POST` | `/train-rf` | On-demand RF retraining |

### Request/Response Contract

**POST `/recommend/{user_id}`**

Request body (`RecommendRequest`):
```json
{
  "alpha": 0.2,
  "top_n": 5,
  "context": {
    "presupuesto_bucket": "medio",
    "edad_range": "25-34",
    "tiposTurismo": ["cultural", "aventura"],
    "group_type": "pareja",
    "wants_tours": true,
    "needs_hotel": true,
    "pref_food": true,
    "requiere_accesibilidad": false,
    "pref_outdoor": true
  }
}
```

Response (`RecommendationResponse`):
```json
{
  "user_id": "42",
  "alpha": 0.2,
  "recommendations": [
    {
      "item_id": "abc123",
      "title": "Cascadas de Texolo",
      "score": 4.827,
      "pred_cf": 4.9,
      "pred_rf": 4.3
    }
  ]
}
```

**Note:** The Python `RecItem` model does NOT include `description` or `category` — these fields exist in `df_biz` but are not joined into the response.

---

## Recommendation Flow — End to End

```
Tourist on LANDING
  → clicks "Obtener recomendaciones" (ActionBridge / UserSegmentation)
  → redirected to PLATAFORMA (PUBLIC_TOURIST_APP_URL)

PLATAFORMA /
  → tourist sees Landing page
  → opens recommendation CTA → navigates to /form (requires role=2 auth)

/form — FormModal (4 steps)
  Step 1 — PerfilBasico:   age, budget/day, trip duration
  Step 2 — Preferencias:   tourism types, activity level, indoor/outdoor
  Step 3 — Contexto:       group type (solo/couple/family/friends), services needed
  Step 4 — Condiciones:    accessibility needs, prior region visit
    → buildAIContext() assembles AIRecommendationContext
    → getRecommendations() calls POST http://localhost:8000/recommend/{userId}
    → SmartURLoader shown during API call
    → on success: RecommendationsResult modal shown with top 5 POIs

RecommendationsResult
  → Renders item_id, title, score, pred_cf, pred_rf
  → description and category always show placeholder text (not returned by API)
  → "Descargar" and "Compartir" buttons are non-functional (no onClick)
```

---

## React-Doctor Report — PLATAFORMA

**Score: 62 / 100 — "Needs Work"**
**1140 issues across 117 of 139 files** | Run time: 9.8s

### Errors (7 total — must fix)

#### Accessibility: No `prefers-reduced-motion` handling
- **Impact:** WCAG 2.3.3 violation. GSAP and Framer Motion animate throughout the app with no motion-safety check.
- **Fix:** Add `@media (prefers-reduced-motion: reduce)` to global CSS and call `gsap.globalTimeline.timeScale(0)` or check `useReducedMotion()` from Framer Motion.

#### State/Effects: `useEffect` with `setTimeout` — missing cleanup (×4)
- **Locations:** `HeroSection.tsx:21` and 3 others in landing components.
- **Impact:** Timer leaks on every re-render and on unmount.
- **Fix:** `return () => clearTimeout(timerId)` inside each effect.

#### State/Effects: Mutable global `location.*` in dependency array (×2)
- **Location:** `Landing.tsx:78`
- **Impact:** Effect does not re-run when pathname changes; stale behavior on navigation.
- **Fix:** Read `location.pathname` inside the effect body, not in the deps array.

### Warnings (1133 total — prioritized subset)

#### Correctness
| Issue | Count | Fix |
|---|---|---|
| Array index as React `key` | 23 | Use `item.id` or stable slug |
| `new Date()` in JSX (hydration mismatch) | 20 | Wrap in `useEffect+useState` |
| `preventDefault()` on `<a>` onClick | 4 | Switch to `<button>` or router `<Link>` |

#### Performance
| Issue | Count | Fix |
|---|---|---|
| `useState` for loading flags → prefer `useTransition` | 17 | `const [isPending, startTransition] = useTransition()` |
| Stale closure: `setState({...state, ...})` | 13 | Use `setState(prev => ({...prev, ...}))` |
| Sequential `element.style` assignments (DOM thrash) | 9 | Batch with `cssText` or `classList` |

#### Accessibility
| Issue | Count | Fix |
|---|---|---|
| `<label>` not associated with control | 53 | Add `htmlFor` + `id` on all inputs |
| Click events without keyboard handlers | 11 | Add `onKeyDown` or use `<button>` |

#### Architecture
| Issue | Count | Fix |
|---|---|---|
| `indigo-*` default Tailwind palette (not brand tokens) | 436 | Replace with tokens from `styles/tokens.css` |
| `w-N h-N` instead of `size-N` (Tailwind v4 shorthand) | 326 | Global find/replace |
| `font-bold` on headings (crushes counter shapes) | 46 | Use `font-semibold` instead |
| Multiple `useState` → consider `useReducer` | 11 | Group related state with `useReducer` |

---

## Integration Blind Spots

### #1 — CRITICAL: Hardcoded `localhost:8000` in `formApi.ts`

```ts
// PLATAFORMA/src/features/form/api/formApi.ts:4
const REC_API_BASE = 'http://localhost:8000';
```

**Problem:** Inside Docker, the PLATAFORMA container cannot reach `localhost:8000`. The MODELO service is accessible as `http://modelo:8000` on the internal network. This means the AI recommendation feature is **completely broken** in Docker/production deployments.

**Root cause:** The `docker-compose.yml` only sets `VITE_API_URL` and `VITE_BUSINESS_URL` for the plataforma service — no `VITE_MODELO_URL` is defined.

**Fix:**

```yaml
# docker-compose.yml — plataforma service
environment:
  VITE_API_URL: http://api:3000/api/v2
  VITE_MODELO_URL: http://modelo:8000      # ADD THIS
  VITE_BUSINESS_URL: http://landing:4321/
```

```ts
// formApi.ts
const REC_API_BASE = import.meta.env.VITE_MODELO_URL ?? 'http://localhost:8000';
```

---

### #2 — CRITICAL: AbortController signal never forwarded to Axios

```ts
// useFormRecommendations.ts
const controller = new AbortController();
abortRef.current = controller;
// signal is created but never used:
const json = await formApi.getRecommendations(params); // no signal here
```

**Problem:** `formApi.getRecommendations` does not accept a `signal` parameter. When the user navigates away mid-request, the HTTP call to the MODELO service continues until it times out. For a model with a 300s startup period, this can cause significant resource waste.

**Fix:**
```ts
// types/types.ts — add signal to params
export interface GetRecommendationsParams {
    userId: string;
    alpha?: number;
    top_n?: number;
    context: AIRecommendationContext;
    token?: string | null;
    signal?: AbortSignal;  // ADD
}

// formApi.ts
const response = await axios.post(url, body, { headers, signal: params.signal });

// useFormRecommendations.ts
const json = await formApi.getRecommendations({ ...params, signal: controller.signal });
```

---

### #3 — CRITICAL: Hardcoded user fallback `{ id: 2 }` in `Step4Condiciones`

```ts
// Step4Condiciones.tsx:39
const user = storedUser ? JSON.parse(storedUser) : { id: 2 }; // ← dev artifact
```

**Problem:** If `localStorage.user` is missing (expired session, incognito, etc.), all AI recommendation requests are silently made as user ID 2 — leaking another user's collaborative filter history to an unauthenticated session.

**Fix:** Create an `AuthContext` and require a valid user before Step 4 is reachable. The `/form` route already has `ProtectedRoute [role=2]` — the auth gate should set a proper user object in context, removing the need to parse `localStorage` in leaf components.

---

### #4 — Type Mismatch: `item_id` is `str` in Python, `number` in TypeScript

```python
# MODELO/src/api.py
class RecItem(BaseModel):
    item_id: str   # Yelp business UUID string
```

```ts
// PLATAFORMA/src/features/form/types/types.ts
interface Recommendation {
    item_id: number;  // typed as number — WRONG
```

**Impact:** `key={rec.item_id || index}` in `RecommendationsResult.tsx` masks this — the fallback to index-as-key defeats stable reconciliation when the list updates.

**Fix:** Change TypeScript type to `string` to match the Python model.

---

### #5 — Missing fields: `description` and `category` never populated

The Python `RecItem` schema only returns: `item_id, title, score, pred_cf, pred_rf`.

The React UI always renders fallback text:
```ts
// RecommendationsResult.tsx:52-58
{rec.description || 'Una experiencia única te espera...'}  // always fallback
{rec.category || 'Turismo'}                                // always "Turismo"
```

The business metadata (`description`, `categories`) exists in `SmarturEngine.df_biz` (loaded from `data_negocios_limpio.csv`) but is never joined into the recommendation response.

**Fix (Python side):**
```python
# api.py
class RecItem(BaseModel):
    item_id: str
    title: str
    score: float
    pred_cf: float
    pred_rf: float
    description: Optional[str] = None   # ADD
    category: Optional[str] = None      # ADD

# In fusion.py or api.py, join df_biz after scoring:
# biz_row = engine.df_biz[engine.df_biz['business_id'] == item_id].iloc[0]
# rec['description'] = biz_row.get('description')
# rec['category'] = biz_row.get('categories')
```

---

### #6 — `visitado` field collected but never sent to the AI model

Step 4 collects whether the tourist has previously visited the Altas Montañas region:
```ts
const [visitado, setVisitado] = useState<string>(data.visitado || 'no');
```

But `buildAIContext()` never includes it in the context sent to the MODELO:
```ts
// Step4Condiciones.tsx:72-88 — visitado absent from returned object
const buildAIContext = (): AIRecommendationContext => {
    return {
        presupuesto_bucket, edad_range, tiposTurismo,
        group_type, wants_tours, needs_hotel,
        pref_food, requiere_accesibilidad, pref_outdoor
        // visitado is missing
    };
};
```

This is a meaningful signal for the RF model — a returning visitor should be recommended less-popular/hidden gems; a first-timer should see flagship destinations.

**Fix:** Add `visitado: boolean` to `AIRecommendationContext`, `buildAIContext()`, `RecommendRequest` (Python), and the `context_encoder.py` feature vector.

---

### #7 — CORS wildcard on MODELO in production

```python
# MODELO/src/api.py:57-64
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # ← open to all origins
    ...
)
```

The commented-out whitelist above it shows the intent was to restrict origins. In production this allows any website to query the recommendation engine.

**Fix:**
```python
allow_origins=[
    "http://localhost:5173",
    "http://plataforma:5173",
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
],
```

---

### #8 — Non-functional UI buttons in `RecommendationsResult`

```tsx
// RecommendationsResult.tsx:72-79
<button className="...">   // no onClick
    <Download />
    <span>Descargar</span>
</button>
<button className="...">   // no onClick
    <Share2 />
    <span>Compartir</span>
</button>
```

These buttons render but do nothing — dead UI that degrades user trust.

**Minimum fix:**
```tsx
// Share
onClick={() => navigator.share?.({ title: 'Mis recomendaciones SMARTUR', text: ... })

// Download — generate a simple text summary or trigger window.print()
```

---

## UX Flow Consistency

### What works well
- **Role-based routing** is clean: `allowedRoles={[1]}` for admin, `allowedRoles={[2]}` for tourists.
- **ThemeContext** provides dark/light toggle across the PLATAFORMA.
- **4-step form wizard** with `ProgressIndicator` is a solid UX pattern for collecting rich preference data.
- **SmartURLoader** during AI processing provides proper loading feedback.
- **Error state in Step4** shows a retry button with `RotateCw` icon — good recovery UX.

### What needs attention

| Issue | Impact |
|---|---|
| LANDING (Astro, Tailwind v3) vs PLATAFORMA (React, Tailwind v4) — different design systems | Visual inconsistency between B2B and B2C experiences |
| `RecommendationsResult` is always dark (hardcoded `bg-zinc-950`) regardless of ThemeContext | Dark-mode-only results panel in a theme-aware app |
| Recommendation cards show raw `pred_cf` and `pred_rf` scores to end users | Exposing internal model metrics confuses tourists; these should be hidden or translated to "AI match %" |
| No map integration in `RecommendationsResult` | Destinations are listed without geographic context; `MapLibre GL` is already a dependency |
| Collecting `visitado` (prior visits) but not using it | Wasted UX question that creates false expectations of personalization depth |
| B2C `/form` requires login (role=2) with no guest mode | High friction — tourist must register before seeing any recommendation |

---

## Recommendations & Priority Matrix

### P0 — Blocking Production (fix before any deployment)

| # | Fix | File(s) |
|---|---|---|
| 1 | Add `VITE_MODELO_URL` env var to docker-compose + read in `formApi.ts` | `docker-compose.yml`, `formApi.ts` |
| 2 | Remove hardcoded `{ id: 2 }` fallback user — redirect or throw | `Step4Condiciones.tsx:39` |
| 3 | Wire AbortController `signal` through to Axios | `useFormRecommendations.ts`, `formApi.ts`, `types.ts` |

### P1 — High Priority (fix in next sprint)

| # | Fix | File(s) |
|---|---|---|
| 4 | Join `description` + `category` from `df_biz` into MODELO response | `api.py`, `fusion.py` |
| 5 | Add `visitado` to AI context + RF feature vector | `Step4Condiciones.tsx`, `types.ts`, `api.py`, `context_encoder.py` |
| 6 | Fix `item_id` type: `number` → `string` | `types/types.ts` |
| 7 | Tighten CORS on MODELO to explicit origins | `MODELO/src/api.py` |
| 8 | Fix 4 `useEffect` timer leaks (`clearTimeout`) | `HeroSection.tsx` + 3 others |
| 9 | Fix stale `location.*` in dependency array | `Landing.tsx:78` |
| 10 | Fix all `setFormData({...formData})` stale closures | Multiple form components |

### P2 — Medium Priority (technical health)

| # | Fix | File(s) |
|---|---|---|
| 11 | Implement `AuthContext` to replace `localStorage` reads in leaf components | New `AuthContext.tsx` |
| 12 | Wire "Descargar" and "Compartir" buttons | `RecommendationsResult.tsx` |
| 13 | Add `prefers-reduced-motion` support | Global CSS + GSAP usage sites |
| 14 | Fix 53 `<label>` without `htmlFor` + 11 click events without keyboard handlers | Multiple modal components |
| 15 | Fix 23 array-index React keys | `Footer.tsx` and others |
| 16 | Fix hydration mismatch: `new Date()` in JSX | `Home.tsx:254` |
| 17 | Delete `src/pages/_index-old-backup.astro` | `LANDING/src/pages/` |

### P3 — Architecture (plan for next quarter)

| # | Fix | Notes |
|---|---|---|
| 18 | Align Tailwind versions across monorepo (both to v4) | LANDING currently on v3, PLATAFORMA on v4 |
| 19 | Add React Compiler (React 19 native) | Eliminates majority of memo/callback boilerplate |
| 20 | Route-based code splitting (lazy + Suspense) | Tourists should not download dashboard JS |
| 21 | Consider separating B2C tourist app from admin dashboard into two deployments | Cleaner security boundary + smaller bundles |
| 22 | Add map to `RecommendationsResult` (MapLibre GL already installed) | Show recommended POIs geographically |
| 23 | Hide/translate `pred_cf`/`pred_rf` scores in result cards | Replace with "Compatibilidad: 96%" style display |
| 24 | Explore guest recommendations (no login required) with anonymous session ID | Reduces friction for first-time tourists |

---

## Key Environment Variables Reference

### Root `.env` (shared)
```
DB_USER, DB_PASSWORD, DB_NAME, DB_HOST_PORT
REDIS_PASSWORD, REDIS_HOST_PORT
JWT_SECRET
EMAIL_USER, EMAIL_PASS
GOOGLE_CLIENT_ID
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
GRAFANA_USER, GRAFANA_PASSWORD
SKIP_MODEL_BOOT          # Set to "1" to skip ML boot during dev
```

### PLATAFORMA `.env`
```
VITE_API_URL             # http://api:3000/api/v2 (or localhost:4000 for local dev)
VITE_MODELO_URL          # MISSING — must be added (http://modelo:8000 in Docker)
VITE_BUSINESS_URL        # http://landing:4321/
```

### LANDING `.env`
```
PUBLIC_TOURIST_APP_URL   # http://plataforma:5173/
```

### MODELO (via docker-compose env)
```
POI_DB_HOST, POI_DB_PORT, POI_DB_NAME, POI_DB_USER, POI_DB_PASSWORD
SKIP_MODEL_BOOT          # "1" to skip model loading at startup
```

---

*End of report. Total services analyzed: 5. Total source files reviewed: ~60 key files. React-doctor scan: 139 files.*
