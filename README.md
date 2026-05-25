# SMARTUR

Plataforma multi-servicio para turismo inteligente con API, dashboard administrativo, sitio de marketing, motor de recomendaciones y app móvil. Este repositorio orquesta el desarrollo, despliegue y operación de todos los componentes.

## Objetivo del repositorio

- Unificar el backend, frontends y servicios de ML bajo una sola fuente de verdad.
- Proveer un flujo reproducible de desarrollo local con Docker Compose.
- Centralizar el esquema de base de datos, rutas y convenciones técnicas.
- Documentar procesos, etapas y responsabilidades de cada servicio.

## Arquitectura general

Servicios (Docker Compose):

- API (Node.js/Express 5) — Backend REST en `:4000`
- PLATAFORMA (React/Vite + Nginx) — Dashboard admin en `:5173`
- LANDING (Astro + React + Nginx) — Sitio marketing en `:4321`
- MODELO (Python/FastAPI) — Motor ML en `:8000`
- postgres (PostgreSQL 16) — Base de datos en `:5432`
- redis — Cache en `:6379`
- grafana — Analitica en `:4001`

## Etapas del ciclo de vida

1. Descubrimiento y diseno
   - Definicion de experiencia de usuario, flujos y KPIs.
   - Modelado de datos y endpoints necesarios.

2. Implementacion
   - Desarrollo por servicio (API, frontends, ML, mobile).
   - Integracion via `/api/v2/` y proxies Nginx.

3. Entrenamiento y calibracion ML
   - Ingestion de interacciones y ratings.
   - Entrenamiento inicial del modelo y metricas.

4. Validacion
   - Pruebas funcionales, integraciones, rendimiento.
   - Verificacion de rutas y esquema DB.

5. Despliegue
   - Docker Compose local y VPS.
   - Actualizacion sincronizada de `API/bd.sql`.

## Estructura del repositorio

```
DEVELOPMENT/
├── docker-compose.yml
├── .env
├── AGENTS.md
├── API/
├── PLATAFORMA/
├── LANDING/
├── MODELO/
├── MOBILE/
└── BD/
```

## Convenciones clave

- Prefijo API: todas las rutas van bajo `/api/v2/`.
- Esquema DB: `API/bd.sql` es la unica fuente de verdad.
- Express 5: no usar `app.options('*', ...)` (rompe en Express 5).
- Build PLATAFORMA: `npx vite build` en Docker.
- Build LANDING: `npm` en Docker (no pnpm).

## Ramas

- `master`: rama estable e integracion principal.
- `feat-*`: ramas de feature (ej: `feat-mobile`).

Flujo recomendado:

1. Crear rama desde `master`.
2. Desarrollar y validar localmente.
3. Abrir PR hacia `master`.
4. Rebase/merge segun politica del equipo.

## Puertos y servicios

| Servicio    | Contenedor         | Puerto |
|------------|--------------------|--------|
| API        | smartur-api         | 4000   |
| PLATAFORMA | smartur-plataforma  | 5173   |
| LANDING    | smartur-landing     | 4321   |
| MODELO     | smartur-modelo      | 8000   |
| postgres   | smartur-postgres    | 5432   |
| redis      | smartur-redis       | 6379   |
| grafana    | smartur-grafana     | 4001   |

## Puesta en marcha local

Requisitos:

- Docker Desktop
- Git

Comandos:

```bash
docker compose up -d
```

Ver logs:

```bash
docker logs smartur-api
docker logs smartur-plataforma
docker logs -f smartur-modelo
```

## Base de datos

`API/bd.sql` contiene el esquema completo y datos semilla. Cualquier cambio debe aplicarse en:

1. Local
2. VPS
3. `API/bd.sql`

Aplicar local:

```bash
Get-Content "API/bd.sql" | docker exec -i smartur-postgres psql -U postgres -d smartur
```

Aplicar en VPS:

```bash
ssh root@2.24.112.25 "docker exec -i smartur-postgres psql -U postgres -d smartur" < API/bd.sql
```

## Endpoints principales

- `POST /api/v2/contact` — contacto publico
- `GET /api/v2/contact-subscriptions` — listado admin
- `PATCH /api/v2/contact-subscriptions/:id/status` — actualizar estado
- `DELETE /api/v2/contact-subscriptions/:id` — eliminar

ML:

- `POST /api/v2/me/interactions` — eventos implicitos
- `POST /api/v2/me/rating` — rating explicito
- `GET /api/v2/recommendations/:userId` — recomendaciones
- `GET /api/v2/ml/health` — metricas y salud

## MODELO (ML)

El servicio de ML descarga y entrena en el primer arranque. Puede tardar 5-10 minutos. Si falla la descarga Kaggle, configurar `KAGGLE_USERNAME` y `KAGGLE_KEY` en `.env`.

## Usuarios de prueba

- `turista@smartur.demo` / `Password1a` (rol turista)
- `martinlaraolivares@gmail.com` / `Password1a` (rol admin)

## Despliegue

Repositorio en VPS: `/opt/SMARTUR`.

Flujo sugerido:

1. Actualizar codigo en VPS.
2. Aplicar `API/bd.sql` si hay cambios de esquema.
3. Reconstruir servicios necesarios:

```bash
docker compose build <service> && docker compose up -d <service>
```

## Soporte y mantenimiento

- Verificacion de proxies Nginx en PLATAFORMA/LANDING.
- Monitoreo con Grafana.
- Validacion diaria de metricas ML.

## Licencia

Propietario. Uso interno del equipo SMARTUR.
