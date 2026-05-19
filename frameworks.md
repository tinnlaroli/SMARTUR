# Reporte técnico de frameworks — Proyecto SMARTUR

> Documento generado a partir del monorepo `DEVELOPMENT/` (mayo 2026).  
> SMARTUR es un ecosistema turístico para la región de Altas Montañas (Veracruz) con backend REST, motor de recomendación ML, dashboard web, landing comercial, app móvil y observabilidad.

---

## Tabla de contenidos

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura y stack por capa](#2-arquitectura-y-stack-por-capa)
3. [Reporte técnico por framework](#3-reporte-técnico-por-framework)
4. [Beneficios directos en SMARTUR](#4-beneficios-directos-en-smartur)
5. [Problemas y desventajas](#5-problemas-y-desventajas)
6. [Matriz comparativa rápida](#6-matriz-comparativa-rápida)

---

## 1. Resumen ejecutivo

SMARTUR adopta una **arquitectura políglota en microservicios** orquestada con **Docker Compose**. Cada capa usa el framework más adecuado para su responsabilidad:

| Capa | Servicio | Framework principal | Puerto |
|------|----------|---------------------|--------|
| Orquestación | `docker-compose.yml` | Docker Compose | — |
| API REST | `API/` | **Node.js + Express 5** | 4000 → 3000 |
| Dashboard B2C/B2B admin | `PLATAFORMA/` | **React 19 + Vite 7** | 5173 |
| Landing marketing | `LANDING/` | **Astro 5 + React** | 4321 |
| Recomendaciones ML | `MODELO/` | **Python + FastAPI** | 8000 |
| Persistencia | `postgres` | **PostgreSQL 16** | 5432 |
| Caché (previsto) | `redis` | **Redis 7** | 6379 |
| Analytics | `grafana` | **Grafana** | 4001 |
| App móvil | `MOBILE/` | **Flutter** | nativo |

Los frontends se compilan a estáticos y se sirven con **Nginx**. La API y el modelo ML comparten la base de datos PostgreSQL; la plataforma consume la API vía proxy Nginx (`/api/` → `api:3000`).

---

## 2. Arquitectura y stack por capa

```
┌─────────────────────────────────────────────────────────────────┐
│                     Docker Compose (smartur-net)                 │
├─────────────────────────────────────────────────────────────────┤
│  LANDING (Astro)          PLATAFORMA (React/Vite)                │
│       │                          │                               │
│       └──────────┬───────────────┘                               │
│                  │ REST /api/v2          POST /recommend         │
│                  ▼                         ▼                     │
│            API (Express 5)            MODELO (FastAPI)           │
│                  │                         │                     │
│                  └──────────┬──────────────┘                     │
│                             ▼                                    │
│                    PostgreSQL 16    Redis 7    Grafana           │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                         MOBILE (Flutter)
```

**Infraestructura transversal:** Node.js 22 Alpine (build API y frontends), Python 3.11-slim (MODELO), imágenes oficiales Postgres/Redis/Grafana/Nginx.

---

## 3. Reporte técnico por framework

### 3.1 Docker y Docker Compose

**Qué es:** Plataforma de contenedores y herramienta declarativa para definir, construir y levantar varios servicios con redes, volúmenes y healthchecks compartidos.

**Uso en SMARTUR:** El archivo `docker-compose.yml` define los 7 servicios (`postgres`, `redis`, `api`, `modelo`, `plataforma`, `landing`, `grafana`), dependencias (`depends_on` con `service_healthy`), variables de entorno y la red `smartur-net`.

**Detalles técnicos relevantes:**
- Healthchecks en Postgres, Redis, API y MODELO (el del modelo tiene `start_period: 300s` por el entrenamiento inicial del Random Forest).
- Volúmenes persistentes: `postgres_data`, `redis_data`, `grafana_data`.
- Builds multi-etapa en API, PLATAFORMA, LANDING y MODELO.

---

### 3.2 Node.js 22 + Express 5 (API)

**Qué es:** Runtime JavaScript en servidor y framework HTTP minimalista para APIs REST.

**Versiones en proyecto:** `express@^5.1.0`, Node 22 Alpine en Dockerfile, módulos ES (`"type": "module"`).

**Uso en SMARTUR:** Punto central de negocio: usuarios, empresas, POI, evaluaciones, certificaciones, dashboard, seguridad (JWT, bcrypt, Google OAuth), subida de medios (Cloudinary + multer), documentación OpenAPI (Swagger), rate limiting y CORS configurado para web y red local.

**Stack complementario en API:**

| Librería | Función en SMARTUR |
|----------|-------------------|
| `pg` | Acceso a PostgreSQL (pool de conexiones) |
| `jsonwebtoken` + `bcrypt` | Autenticación y sesiones |
| `helmet` + `express-rate-limit` | Cabeceras de seguridad y anti-abuso |
| `cors` | Orígenes: plataforma, landing, localhost, redes LAN |
| `swagger-jsdoc` / `swagger-ui-express` | Documentación interactiva `/api-docs` |
| `cloudinary` + `multer` | Imágenes de servicios y contenido |
| `nodemailer` | Correos (recuperación, notificaciones) |
| `google-auth-library` | Login con Google |

**Nota Express 5:** No admite rutas comodín `app.options('*', ...)`; el proyecto usa `app.options` sobre el router con `corsOptions` (documentado en `AGENTS.md`).

---

### 3.3 PostgreSQL 16

**Qué es:** Sistema gestor de bases de datos relacional ACID, extensible con JSON, índices y PostGIS (si se añade).

**Uso en SMARTUR:** Esquema completo en `API/bd.sql` (tablas de turismo, usuarios, evaluaciones, POI, gasto turístico, empleo, etc.). La API usa `pg`; el servicio MODELO usa `psycopg2-binary` para leer POI y perfiles desde la misma BD.

**Detalles:** Imagen `postgres:16-alpine`, healthcheck `pg_isready`, inicialización manual del SQL tras el primer arranque del contenedor.

---

### 3.4 Redis 7

**Qué es:** Almacén en memoria clave-valor para caché, sesiones y colas.

**Uso en SMARTUR:** Contenedor definido en Compose con contraseña y volumen persistente. Variable `REDIS_URL` expuesta a la API en entorno Docker.

**Estado actual:** La dependencia está preparada en infraestructura (`.env`, Compose), pero **no hay cliente Redis implementado aún en el código JavaScript de la API** — es capacidad reservada para sesiones, caché de consultas pesadas o rate limiting distribuido.

---

### 3.5 React 19 + Vite 7 + TypeScript (PLATAFORMA)

**Qué es:** Biblioteca UI declarativa (React), bundler/dev server ultrarrápido (Vite) y tipado estático (TypeScript).

**Uso en SMARTUR:** Dashboard turista (B2C), panel administrador (usuarios, empresas, servicios, POI, estadísticas), formulario de recomendación, mapas y gráficos.

**Stack UI y datos:**

| Tecnología | Rol en PLATAFORMA |
|------------|-------------------|
| `react-router-dom@7` | Rutas SPA y rutas protegidas por rol |
| `tailwindcss@4` + `@tailwindcss/vite` | Diseño utility-first |
| `axios` | Cliente HTTP hacia `/api/v2` |
| `maplibre-gl` | Mapas de exploración y POI (open source) |
| `recharts` | Gráficos del panel admin |
| `framer-motion`, `gsap` | Animaciones de landing y transiciones |
| `lucide-react` | Iconografía consistente |

**Despliegue:** `npx vite build` en Docker (sin `tsc` estricto en imagen), estáticos servidos por Nginx con `try_files` para SPA y proxy `/api/` al backend.

---

### 3.6 Nginx (PLATAFORMA y LANDING)

**Qué es:** Servidor web y reverse proxy de alto rendimiento.

**Uso en SMARTUR:** Sirve los bundles estáticos de React/Astro, comprime con gzip, aplica cabeceras de seguridad y en PLATAFORMA reenvía `/api/` a `http://api:3000/api/`, evitando problemas CORS en producción y unificando el origen para el navegador.

---

### 3.7 Astro 5 + React (LANDING)

**Qué es:** Framework de contenido con **arquitectura de islas**: HTML estático por defecto e hidratación selectiva de componentes React.

**Uso en SMARTUR:** Sitio comercial B2B (planes, testimonios, contacto, segmentación de usuarios), i18n nativo (`es`, `en`, `fr`), enlaces hacia la plataforma turista (`PUBLIC_TOURIST_APP_URL`).

**Integraciones destacadas:**
- `@astrojs/react`, `@astrojs/tailwind`
- **Three.js** + `@react-three/fiber` + `@react-three/drei` — escenas 3D y experiencias visuales
- **GSAP**, **Framer Motion**, **Lenis** — animación y scroll suave
- **Spline** (`@splinetool/runtime`) — assets 3D interactivos
- Fuentes experimentales de Astro (Google Fonts: Roboto Slab, Inter)

**Despliegue:** Build estático (`astro build`) + Nginx en puerto 4321.

---

### 3.8 Python 3.11 + FastAPI + Uvicorn (MODELO)

**Qué es:** API asíncrona moderna en Python con validación Pydantic, documentación OpenAPI automática y servidor ASGI Uvicorn.

**Uso en SMARTUR:** Motor híbrido de recomendación turística:
1. **Filtrado colaborativo (CF):** matriz usuario-ítem dispersa, similitud de Pearson, vecinos KNN (`scikit-learn`).
2. **Modelo contextual:** Random Forest sobre features del perfil del viajero (`rf_model.py`, `context_encoder.py`).
3. **Fusión:** pipeline en `fusion.py` (retrieval → filtros duros/suaves → ranking RF → mezcla α).

**Dependencias ML y datos:**

| Paquete | Uso |
|---------|-----|
| `pandas`, `numpy`, `scipy` | Preprocesamiento y matrices |
| `scikit-learn` | KNN, Random Forest, métricas |
| `joblib` | Persistencia de modelos `.joblib` |
| `faiss-cpu` | Búsqueda vectorial (capacidad en stack) |
| `matplotlib` | Visualización en evaluación |
| `pytest` | Tests en `tests/` |
| `kagglehub` | Descarga dataset Yelp |
| `psycopg2-binary` | POI y perfiles desde PostgreSQL |

**Endpoints clave:** `POST /recommend/{user_id}` con contexto (presupuesto, edad, tipos de turismo, accesibilidad, etc.). Swagger en `/docs`.

**Arranque:** `lifespan` carga engine Pearson y RF; si no existe el modelo, entrena en el primer boot (varios minutos).

---

### 3.9 Flutter (MOBILE)

**Qué es:** Framework multiplataforma de Google (Dart) para apps iOS, Android y desktop con un solo código base.

**Uso en SMARTUR:** App turista con mapas (`flutter_map`, `latlong2`), autenticación segura (`flutter_secure_storage`, `local_auth`, `google_sign_in`), consumo de la API REST (`http`), internacionalización (`flutter_localizations`, `intl`), UI Material y assets Lottie/SVG.

**Relación con backend:** La API permite peticiones sin cabecera `Origin` (comentado para Flutter en `index.js`).

**Nota:** MOBILE no está en el `docker-compose.yml` principal; se desarrolla y despliega de forma independiente.

---

### 3.10 Grafana

**Qué es:** Plataforma de visualización y dashboards para métricas y logs (ecosistema observability).

**Uso en SMARTUR:** Contenedor `grafana/grafana:latest` en puerto 4001 para analítica operativa. Configuración básica: admin por variables de entorno, registro de usuarios deshabilitado.

**Estado:** Servicio levantado en Compose; la integración con fuentes de datos (Postgres, Prometheus, etc.) depende de la configuración posterior en la UI de Grafana.

---

### 3.11 Librerías transversales de producto (no son “frameworks” pero forman el stack)

- **Cloudinary:** CDN y transformación de imágenes para servicios turísticos.
- **JWT / OAuth Google:** Identidad unificada web y móvil.
- **Swagger (API) vs OpenAPI auto (FastAPI):** Documentación dual de contratos REST.
- **Tailwind CSS:** Presente en PLATAFORMA (v4) y LANDING (v3) — conviene alinear versiones a largo plazo.

---

## 4. Beneficios directos en SMARTUR

Cada beneficio está ligado a una decisión concreta del repositorio y al dominio turístico del proyecto.

### 4.1 Docker Compose — un solo comando para todo el ecosistema

**Beneficio:** Un desarrollador puede levantar API, frontends, BD, Redis, modelo ML y Grafana con `docker compose up -d`, con la misma topología que producción.

**En SMARTUR:** Reduce fricción en TFG/demos, pruebas de integración end-to-end (formulario → API → MODELO → mapa) y despliegues reproducibles sin instalar Node, Python y Postgres en la máquina host.

---

### 4.2 Express 5 + Node — API única de negocio turístico

**Beneficio:** Curva de aprendizaje baja, ecosistema npm enorme, I/O no bloqueante adecuado para muchas peticiones REST concurrentes.

**En SMARTUR:** Un solo servicio concentra decenas de dominios (evaluaciones, certificaciones, POI, gasto turístico, usuarios, dashboard). Módulos ES y rutas por archivo (`routes/*`) mantienen el código alineado con el modelo de datos en `bd.sql`. Swagger facilita que PLATAFORMA, LANDING y MOBILE consuman los mismos contratos.

---

### 4.3 PostgreSQL — modelo relacional rico para turismo regulado

**Beneficio:** Integridad referencial, transacciones, consultas complejas e índices para reporting administrativo.

**En SMARTUR:** Encaja con entidades reales del sector: empresas, servicios, criterios/subcriterios de evaluación, certificaciones, empleo y gasto turístico. El MODELO lee POI y perfiles de la misma BD, evitando duplicar catálogos.

---

### 4.4 Redis (infraestructura) — escalado futuro sin rediseño

**Beneficio:** Latencia sub-milisegundo para caché y sesiones cuando el tráfico crezca.

**En SMARTUR:** Ya está en la red Docker y en variables de la API; permitirá cachear listados de POI, resultados de dashboard o tokens de sesión sin cambiar la arquitectura macro.

---

### 4.5 React + Vite + TypeScript — dashboard complejo con buena DX

**Beneficio:** Hot reload rápido, componentes reutilizables, tipos que detectan errores en integración con la API.

**En SMARTUR:** Un solo frontend cubre turista y administrador con `react-router-dom` y roles. Vite acelera iteración en UI de mapas (MapLibre) y gráficos (Recharts). TypeScript ayuda en formularios largos del wizard de recomendación y paneles con muchas tablas.

---

### 4.6 MapLibre GL — mapas sin licencia propietaria de Mapbox

**Beneficio:** Mapas vectoriales open source, personalizables y sin coste por carga en etapas académicas o MVP.

**En SMARTUR:** Exploración geográfica de POI y servicios en la región de Altas Montañas, coherente con un producto territorial.

---

### 4.7 Nginx delante del frontend — proxy API y SPA en un origen

**Beneficio:** El navegador llama a `/api/` en el mismo host que la UI; menos problemas CORS y cookies.

**En SMARTUR:** PLATAFORMA en `:5173` habla con la API en `:4000` de forma transparente vía `nginx.conf`, simplificando despliegues en aulas y laboratorios.

---

### 4.8 Astro en LANDING — marketing rápido y SEO-friendly

**Beneficio:** Páginas mayormente estáticas con poco JavaScript en el cliente; hidrata solo islas React (3D, animaciones).

**En SMARTUR:** La landing B2B carga rápido para captar prestadores de servicios; i18n ES/EN/FR amplía alcance. Three.js/GSAP dan identidad visual diferenciada sin cargar todo el bundle en cada página.

---

### 4.9 FastAPI + scikit-learn — recomendaciones híbridas documentadas

**Beneficio:** Contratos tipados (Pydantic), `/docs` automático, separación clara entre API HTTP y lógica ML.

**En SMARTUR:** Combina historial colaborativo (Yelp/KNN) con contexto del viajero veracruzano (presupuesto, accesibilidad, tipo de grupo). Filtros duros en `fusion.py` respetan restricciones reales (hotel, comida, accesibilidad). El admin y el formulario envían contexto JSON que el encoder transforma en features.

---

### 4.10 Flutter — experiencia móvil nativa para el turista en ruta

**Beneficio:** Un código para Android/iOS, rendimiento cercano a nativo, ecosistema maduro para mapas y auth.

**En SMARTUR:** El turista usa la app en campo (mapas offline-friendly con tiles configurables, biometría, Google Sign-In) mientras la plataforma web cubre flujos más densos de escritorio.

---

### 4.11 Grafana — visibilidad operativa

**Beneficio:** Dashboards configurables sin desarrollar un módulo de analytics desde cero.

**En SMARTUR:** Base para monitorear adopción, errores de API o métricas de negocio cuando se conecten datasources (Postgres, logs, Prometheus).

---

### 4.12 Seguridad integrada en la API (Helmet, rate limit, JWT, bcrypt)

**Beneficio:** Capas defensivas por defecto en un sistema con datos de empresas y turistas.

**En SMARTUR:** Protege endpoints de administración y autenticación; CORS explícito para orígenes de plataforma, landing y redes locales de demo.

---

## 5. Problemas y desventajas

### 5.1 Complejidad operativa (poliglotía + 7 contenedores)

**Problema:** Más superficie de fallo: versiones de Node, Python, imágenes Docker, healthchecks y tiempos de arranque distintos (MODELO hasta 5 min en primer boot).

**Impacto en SMARTUR:** Depurar un error de recomendación puede requerir revisar PLATAFORMA → API → MODELO → Postgres. Los nuevos integrantes necesitan documentación clara (`AGENTS.md`, este reporte).

---

### 5.2 Express 5 — cambios respecto a Express 4

**Problema:** Rutas wildcard y algunos patrones middleware cambiaron; la comunidad aún migra ejemplos antiguos.

**Impacto en SMARTUR:** Ya se tuvo que corregir `app.options('*', ...)` (incompatible). Cualquier tutorial antiguo puede inducir errores (`PathError: Missing parameter name`).

---

### 5.3 Redis configurado pero no consumido en código API

**Problema:** Recurso de infraestructura sin uso actual = complejidad sin beneficio inmediato.

**Impacto en SMARTUR:** El contenedor consume RAM; si no se implementa caché o sesiones, es deuda técnica o sobredimensionamiento en entornos pequeños.

---

### 5.4 Build de PLATAFORMA sin TypeScript estricto en Docker

**Problema:** `npx vite build` omite `tsc -b`; errores de tipos pueden llegar a producción.

**Impacto en SMARTUR:** Riesgo de regresiones silenciosas en integración API; conviene ejecutar `npm run build` completo en CI local.

---

### 5.5 Duplicación de stacks frontend (PLATAFORMA vs LANDING)

**Problema:** Dos aplicaciones React con Tailwind en versiones distintas (v4 vs v3), animaciones duplicadas (GSAP, Framer), y posible divergencia de diseño.

**Impacto en SMARTUR:** Mantenimiento doble de componentes y estilos; mayor peso cognitivo para el equipo.

---

### 5.6 MODELO — coste de arranque y dependencia de datos Yelp

**Problema:** Entrenamiento del Random Forest (~80k interacciones) tarda minutos; archivos grandes gitignored; sin datos no hay recomendaciones útiles.

**Impacto en SMARTUR:** Primer `docker compose up` puede fallar healthchecks si `start_period` es insuficiente; entornos CI necesitan modelos pre-entrenados o `SKIP_MODEL_BOOT=1`.

---

### 5.7 CORS permisivo en MODELO vs restrictivo en API

**Problema:** FastAPI con `allow_origins=["*"]` en desarrollo vs API con lista blanca de orígenes.

**Impacto en SMARTUR:** Inconsistencia de seguridad; en producción el modelo debería alinearse con la misma política que la API.

---

### 5.8 Secretos y variables en Compose

**Problema:** Valores por defecto en `docker-compose.yml` (correo, Cloudinary, JWT) son convenientes pero inseguros si se despliegan tal cual.

**Impacto en SMARTUR:** Riesgo en despliegues públicos; obligatorio usar `.env` real y secretos externos en producción.

---

### 5.9 MOBILE fuera de Compose

**Problema:** La app Flutter no se orquesta con el resto; URLs de API deben configurarse manualmente por entorno.

**Impacto en SMARTUR:** Más pasos para demo full-stack; posible desalineación de versiones API entre web y móvil.

---

### 5.10 Grafana sin datasources pre-provisionados

**Problema:** Contenedor vacío de dashboards hasta configuración manual.

**Impacto en SMARTUR:** El puerto 4001 no aporta valor hasta invertir tiempo en conectar Postgres o exportar métricas desde la API.

---

### 5.11 Licencias y costes de terceros

**Problema:** Cloudinary, Google OAuth, email SMTP y tiles de mapas pueden generar coste o cuotas.

**Impacto en SMARTUR:** Dependencia de servicios externos para imágenes y login; planificar alternativas self-hosted si el proyecto escala.

---

### 5.12 Dataset Yelp vs realidad local

**Problema:** El CF se entrena con negocios/reseñas de Yelp (EE.UU.), no solo con datos de Altas Montañas.

**Impacto en SMARTUR:** La capa colaborativa puede sesgar recomendaciones; la fusión con RF contextual y POI de Postgres mitiga pero no elimina el sesgo si hay pocos datos locales.

---

### 5.13 Express sin capa ORM

**Problema:** SQL manual con `pg` aumenta riesgo de errores y duplicación de consultas.

**Impacto en SMARTUR:** Más verboso que Prisma/Drizzle; migraciones dependen de `bd.sql` y disciplina del equipo.

---

### 5.14 React 19 — ecosistema en maduración

**Problema:** Algunas librerías de terceros pueden advertir peer dependency conflicts con React 19.

**Impacto en SMARTUR:** Posibles warnings en `npm install`; hay que validar MapLibre, Recharts y Three en cada actualización.

---

## 6. Matriz comparativa rápida

| Framework | Fortaleza principal en SMARTUR | Principal riesgo / desventaja |
|-----------|-------------------------------|------------------------------|
| Docker Compose | Entorno reproducible multi-servicio | Operación y tiempos de arranque |
| Express 5 | API REST unificada de negocio | Curva Express 5 vs documentación v4 |
| PostgreSQL | Modelo turístico relacional completo | Migraciones manuales (`bd.sql`) |
| Redis | Caché futuro | Sin uso en código API aún |
| React + Vite | Dashboard y mapas | Build Docker sin `tsc` estricto |
| Astro | Landing SEO + i18n | Stack duplicado con PLATAFORMA |
| FastAPI + sklearn | Recomendación híbrida documentada | Arranque lento y datos pesados |
| Flutter | App turista en campo | Fuera de Compose, otra toolchain |
| Nginx | Proxy API + SPA | Configuración por servicio |
| Grafana | Analytics | Requiere configuración adicional |
| MapLibre | Mapas open source | Configuración de tiles/fonts |

---

## Conclusión

La selección de frameworks en SMARTUR responde a un **criterio de mejor herramienta por capa**: Node/Express para el dominio transaccional, React/Vite para interactividad densa, Astro para marketing performante, FastAPI/Python para ML, PostgreSQL como fuente de verdad, Flutter para móvil y Docker para unificar el desarrollo.

Los **beneficios directos** son velocidad de desarrollo, separación clara de responsabilidades, documentación automática de APIs y capacidad de recomendación contextual avanzada. Las **desventajas** se concentran en la **complejidad operativa**, **deuda pendiente** (Redis, Grafana, alineación Tailwind), **tiempos de arranque del MODELO** y **consistencia de seguridad y datos** entre servicios.

---

*Referencias en repositorio: `AGENTS.md`, `ARCHITECTURE_ANALYSIS.md`, `API/package.json`, `PLATAFORMA/package.json`, `LANDING/package.json`, `MODELO/requirements.txt`, `MOBILE/pubspec.yaml`, `docker-compose.yml`.*
