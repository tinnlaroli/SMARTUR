# AGENTS.md — SMARTUR

## Project overview

Multi-service Docker Compose project with 7 services:
- **API** (Node.js/Express 5) — Backend API on port 4000
- **PLATAFORMA** (React/Vite + Nginx) — Dashboard on port 5173
- **LANDING** (Astro + React + Nginx) — Marketing site on port 4321
- **MODELO** (Python/FastAPI) — ML recommendation engine on port 8000
- **postgres** (PostgreSQL 16) — Database on port 5432
- **redis** — Cache on port 6379
- **grafana** — Analytics on port 4001

## Key commands

```bash
# Start all services (from project root)
# Primera vez: descarga Yelp, preprocesa, entrena modelos y crea la BD automáticamente.
# Puede tardar 30-60+ min según red y hardware. Seguir progreso:
docker compose up -d
docker logs -f smartur-modelo

# Build and start specific service
docker compose build <service> && docker compose up -d <service>

# View logs
docker logs smartur-api
docker logs smartur-plataforma

# Restart a service
docker restart smartur-api
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

- **Frontend proxy**: PLATAFORMA nginx proxies `/api/*` to backend (`proxy_pass http://api:3000/api/`)
- **Database init**: `API/bd.sql` se importa automáticamente al crear el volumen `postgres_data` (primera vez)
- **MODELO bootstrap**: En el primer arranque, el contenedor `modelo` descarga Yelp, preprocesa CSVs y entrena RF/GBM. Datos y modelos persisten en volúmenes `modelo_data` / `modelo_models`
- **Express 5**: API uses Express 5 which does NOT support wildcard routes like `app.options('*', ...)`. Use `app.options(app.router, cors(corsOptions))` instead.
- **PLATAFORMA build**: Uses `npx vite build` instead of `npm run build` to skip TypeScript strict checking in Docker
- **LANDING**: Uses npm (not pnpm) in Docker to avoid pnpm script restrictions

## Database

- **Schema**: `API/bd.sql` contains full schema + seed data
- **Test users**:
  - `turista@smartur.demo` / `Password1a` (role: user)
  - `martinlaraolivares@gmail.com` / `Password1a` (role: admin)

## MODELO (ML Service)

See `MODELO/AGENTS.md` for detailed instructions on:
- Data download and preprocessing
- API endpoints (`/recommend/{user_id}`)
- Model training and evaluation

## Common issues

1. **API crashes on start**: If you see `PathError: Missing parameter name at index 1: *`, check `API/index.js` line 83 for `app.options('*', ...)` — remove it for Express 5 compatibility
2. **Database tables missing**: Borrar volumen y recrear (`docker compose down -v` luego `up`) o importar manualmente: `Get-Content "API/bd.sql" | docker exec -i smartur-postgres psql -U postgres -d smartur`
3. **MODELO tarda mucho en primer boot**: Normal. Ver `docker logs -f smartur-modelo`. Si falla Kaggle, aceptar términos del dataset y configurar `KAGGLE_USERNAME` / `KAGGLE_KEY` en `.env`
4. **405 on API calls**: Ensure nginx in PLATAFORMA has `/api/` proxy configured
5. **Container name conflicts**: Run `docker compose down` before `up` to clean up

## Project structure

```
DEVELOPMENT/
├── docker-compose.yml    # Main compose file
├── .env                  # Environment defaults
├── API/                  # Node.js Express API
│   ├── bd.sql           # Database schema
│   ├── Dockerfile
│   └── .env             # API-specific env
├── PLATAFORMA/          # React dashboard (Vite)
│   ├── Dockerfile
│   ├── nginx.conf       # Nginx proxy config
│   └── vite.config.ts
├── LANDING/             # Astro landing page
│   ├── Dockerfile
│   ├── nginx.conf
│   └── astro.config.mjs
├── MODELO/             # Python ML service (FastAPI)
│   ├── AGENTS.md       # Detailed MODELO docs
│   ├── Dockerfile
│   └── requirements.txt
├── BD/                 # Database documentation (PDF)
└── MOBILE/             # Mobile app (Expo)
```