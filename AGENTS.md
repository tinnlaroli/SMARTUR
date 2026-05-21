# AGENTS.md — SMARTUR

## Project overview

Multi-service Docker Compose project with 7 services:
- **API** (Node.js/Express 5) — Backend API on port 4000
- **PLATAFORMA** (React/Vite + Nginx) — Admin dashboard on port 5173
- **LANDING** (Astro + React + Nginx) — Marketing site on port 4321
- **MODELO** (Python/FastAPI) — ML recommendation engine on port 8000
- **postgres** (PostgreSQL 16) — Database on port 5432
- **redis** — Cache on port 6379
- **grafana** — Analytics on port 4001

## Key commands

```bash
# Start all services (from project root)
docker compose up -d

# Follow MODELO startup (first run trains RF model — 5-10 min)
docker logs -f smartur-modelo

# Build and restart a specific service
docker compose build <service> && docker compose up -d <service>

# View logs
docker logs smartur-api
docker logs smartur-plataforma

# Apply DB schema from scratch (wipes data)
Get-Content "API/bd.sql" | docker exec -i smartur-postgres psql -U postgres -d smartur
```

## Services and ports

| Service | Container | External Port |
|---------|-----------|---------------|
| API | smartur-api | 4000 |
| PLATAFORMA | smartur-plataforma | 5173 |
| LANDING | smartur-landing | 4321 |
| MODELO | smartur-modelo | 8000 |
| postgres | smartur-postgres | 5432 |
| redis | smartur-redis | 6379 |
| grafana | smartur-grafana | 4001 |

## Architecture notes

- **API prefix**: All routes served under `/api/v2/`
- **Frontend proxy**: PLATAFORMA nginx proxies `/api/v2/*` → `http://api:4000/api/v2/`; LANDING nginx proxies `/api/v2/*` → same target
- **Database source of truth**: `API/bd.sql` is the single schema file — no migration files. Any DB change must be applied to local Docker, production VPS (`ssh root@2.24.112.25`), and `bd.sql` simultaneously.
- **DB init**: `bd.sql` is auto-imported when `postgres_data` volume is first created
- **MODELO bootstrap**: First start downloads Yelp data, preprocesses CSVs, trains RF. Persists in `modelo_data`/`modelo_models` volumes
- **Express 5**: Does NOT support wildcard routes `app.options('*', ...)` — use `app.options(app.router, cors(corsOptions))`
- **PLATAFORMA build**: Uses `npx vite build` (not `npm run build`) in Docker to skip TypeScript strict checking
- **LANDING build**: Uses npm in Docker (not pnpm) to avoid pnpm script restrictions

## Database

- **Schema file**: `API/bd.sql` — full schema + seed data, no separate migration files
- **Apply schema changes** (must run on all 3 targets):
  1. Local: `Get-Content "API/bd.sql" | docker exec -i smartur-postgres psql -U postgres -d smartur`
  2. VPS: `ssh root@2.24.112.25 "docker exec -i smartur-postgres psql -U postgres -d smartur" < API/bd.sql`
  3. Edit `API/bd.sql` to include the change
- **Test users**:
  - `turista@smartur.demo` / `Password1a` (role 2: tourist user)
  - `martinlaraolivares@gmail.com` / `Password1a` (role 1: admin)

## API route groups

| Router file | Mount prefix | Auth |
|-------------|-------------|------|
| `userRoutes.js` | `/api/v2/` | mixed |
| `companyRoutes.js` | `/api/v2/` | verifyToken |
| `touristServicesRoutes.js` | `/api/v2/` | verifyToken |
| `locationRoutes.js` | `/api/v2/` | verifyToken |
| `pointOfInterestRoutes.js` | `/api/v2/` | verifyToken |
| `travelerProfileRoutes.js` | `/api/v2/` | verifyToken |
| `touristActivitiesRoutes.js` | `/api/v2/` | verifyToken |
| `serviceCertificationRoutes.js` | `/api/v2/` | verifyToken |
| `contactRoutes.js` | `/api/v2/` | public POST, verifyToken GET/PATCH/DELETE |
| `interactionRoutes.js` | `/api/v2/` | verifyToken |
| `mlRoutes.js` | `/api/v2/` | verifyToken |
| `dashboardRoutes.js` | `/api/v2/` | verifyToken |
| `userContentRoutes.js` | `/api/v2/` | verifyToken |
| `securityRoutes.js` | `/api/v2/` | verifyToken |

**Contact routes** (no email notifications — contacts managed from dashboard only):
- `POST /api/v2/contact` — public, saves contact form submission
- `GET /api/v2/contact-subscriptions` — admin, paginated list
- `PATCH /api/v2/contact-subscriptions/:id/status` — update status (pending/in_progress/done/dismissed)
- `DELETE /api/v2/contact-subscriptions/:id` — delete record

**ML data collection routes**:
- `POST /api/v2/me/interactions` — batch implicit event ingestion (dwell, detail_open, skip, filter_click)
- `POST /api/v2/me/rating` — upsert explicit star rating (1–5)
- `GET /api/v2/recommendations/:userId` — proxied MODELO call with session logging
- `GET /api/v2/ml/health` — model metrics + daily sessions + CTR for dashboard

## MODELO (ML Service)

See `MODELO/AGENTS.md` for full details. Key endpoints:
- `POST /recommend/{user_id}` — hybrid CF+RF recommendation
- `GET /metrics` — returns latest `algorithm_metrics.json` for admin dashboard

## Common issues

1. **API crashes on start**: `PathError: Missing parameter name at index 1: *` → check `API/index.js` for `app.options('*', ...)` — remove for Express 5 compatibility
2. **DB tables missing**: Delete volume and recreate (`docker compose down -v && docker compose up`) or import manually: `Get-Content "API/bd.sql" | docker exec -i smartur-postgres psql -U postgres -d smartur`
3. **MODELO slow first boot**: Normal — RF trains on ~80k interactions. Watch `docker logs -f smartur-modelo`. If Kaggle download fails, configure `KAGGLE_USERNAME`/`KAGGLE_KEY` in `.env`
4. **405 on API calls from PLATAFORMA**: Verify nginx `/api/v2/` proxy block in `PLATAFORMA/nginx.conf`
5. **Container name conflicts**: Run `docker compose down` before `up`
6. **VPS path**: Repository lives at `/opt/SMARTUR` (uppercase) on the VPS

## Project structure

```
DEVELOPMENT/
├── docker-compose.yml    # Main compose file
├── .env                  # Shared env defaults
├── AGENTS.md             # This file
├── API/                  # Node.js Express API
│   ├── bd.sql            # Complete DB schema (single source of truth)
│   ├── index.js          # Express app + route mounts
│   ├── routes/           # Route handlers (24 files)
│   ├── middleware/       # Auth, rate limiting
│   ├── utils/            # mailer, helpers
│   └── Dockerfile
├── PLATAFORMA/           # React 19 + Vite dashboard
│   ├── src/features/     # Feature modules by domain
│   ├── nginx.conf
│   └── Dockerfile
├── LANDING/              # Astro 5 + React marketing site
│   ├── src/
│   ├── nginx.conf
│   └── Dockerfile
├── MODELO/               # Python FastAPI ML service
│   ├── AGENTS.md         # Detailed MODELO docs
│   ├── src/
│   └── Dockerfile
├── MOBILE/               # Flutter mobile app
│   ├── lib/
│   └── pubspec.yaml
└── BD/                   # Database documentation (PDF)
```
