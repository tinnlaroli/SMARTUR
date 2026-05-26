# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Scope prefixes used in commit messages: `api` · `plataforma` · `mobile` · `modelo` · `ci` · `docs`

---

## [Unreleased]

### Added
- **API** — Sentry error tracking integrado (`@sentry/node`): captura errores Express, excepciones no manejadas y promesas rechazadas. Activable vía `SENTRY_DSN` en `.env` ([`08125a9`](../../commit/08125a9))
- **API** — Rate limiting en tres niveles: global (200 req/15 min), escrituras POST/PUT/PATCH/DELETE (30 req/min) y auth anti brute-force (5 req/min) ([`d8927d9`](../../commit/d8927d9))
- **API** — Validación de variables de entorno al arranque: crash con mensaje claro si faltan vars críticas (`JWT_SECRET`, DB); warnings para vars recomendadas ([`8c21ae7`](../../commit/8c21ae7))
- **API** — Swagger/OpenAPI completo: ML, sesiones, interacciones, comunidad, subcriteria, dashboard y explore ([`c32e44b`](../../commit/c32e44b))
- **PLATAFORMA** — Modal de detalle en módulo Perfiles con tres tabs: Perfil, Sesiones activas y Recomendaciones ([`309977b`](../../commit/309977b))
- **PLATAFORMA** — Links legales "Términos · Privacidad" en el footer del Sidebar; abre `TermsModal` con contenido es/en/fr ([`de4c7cd`](../../commit/de4c7cd))
- **MOBILE** — SHA-1 del release keystore registrado en `google-services.json`, APK firmado con keystore dedicado ([`6faf960`](../../commit/6faf960))
- **MOBILE** — Modo offline: `CacheService` (SharedPreferences + TTL 24h), `ExploreService.fetchCitiesWithFallback()` con fallback de hasta 7 días, `OfflineBanner` amber adaptativo ([`79e2c12`](../../commit/79e2c12))
- **MOBILE** — Política de privacidad: modal `PrivacyPolicyModal` accesible desde Configuración, contenido completo en es/en/fr/pt ([`de4c7cd`](../../commit/de4c7cd))

### Changed
- **PLATAFORMA** — Tabs de Sesiones y Recomendaciones movidas del modal de Usuarios al modal de Perfiles ([`f1c6eed`](../../commit/f1c6eed))
- **DOCS** — README profesional: badges, diagrama de arquitectura, iconos SVG en lugar de emojis, sección GitFlow e invitación a dar ⭐ ([`db7eaa3`](../../commit/db7eaa3))

### Fixed
- **CI/CD** — Pipeline de despliegue corregido: trigger en rama `main`, `git stash` antes del pull para preservar cambios locales del VPS ([`c4f1a62`](../../commit/c4f1a62))

### Security
- **API** — `beforeSend` en Sentry filtra campos sensibles (password, token, secret) antes de enviarlos al DSN ([`08125a9`](../../commit/08125a9))
- **MOBILE** — Keystore de release independiente del debug; SHA-1 registrado por separado en Firebase

---

## [2.1.0-mobile] — 2026-05-23

### Added
- **API** — Sistema de migraciones automáticas en el arranque: aplica cambios de esquema sin intervención manual ([`033405b`](../../commit/033405b))
- **MOBILE** — Pantalla de recomendaciones rediseñada: mejor layout, rating tab gamificado ([`4a0a8f7`](../../commit/4a0a8f7))
- **MOBILE** — Sesión de viaje: auth proxy para llamadas al API de recomendaciones ([`4a0a8f7`](../../commit/4a0a8f7))

### Fixed
- **API** — POI `placeExists` con `try/catch` para compatibilidad con DBs pre-migración ([`041f28c`](../../commit/041f28c))
- **API+MOBILE** — Corrección de mismatch de esquema: `id_point → id`, columnas de display en POI ([`c299aaa`](../../commit/c299aaa))
- **MOBILE** — `mounted` check antes de usar context en `deletePost` de comunidad ([`3c14d92`](../../commit/3c14d92))

---

## [2.0.0-mobile] — 2026-05-20 → 2026-05-23

### Added
- **MODELO** — Motor ML integral: LightFM WARP + distancia geográfica (`dist_km`) + ContentModel de respaldo ([`99de0e1`](../../commit/99de0e1))
- **MODELO** — Flywheel v1: widget de feedback, re-entrenamiento automático nocturno, etiquetas de explicabilidad ([`6e2de6d`](../../commit/6e2de6d))
- **MODELO** — Scheduler configurable desde el dashboard: toggle, hora UTC, próxima corrida ([`7460db0`](../../commit/7460db0))
- **PLATAFORMA** — Ecosistema de recolección de datos ML + observability dashboard ([`6fd00cf`](../../commit/6fd00cf))
- **PLATAFORMA** — ML Observability v2: badges de estado de modelos, polling en tiempo real, etiquetas LightFM ([`b1bca84`](../../commit/b1bca84))
- **PLATAFORMA** — Dashboard rediseñado: sidebar layout, `UserDistributionCard`, grid dinámico inferior ([`6157c91`](../../commit/6157c91))
- **PLATAFORMA** — Customización de dashboard: rango de tiempo, `ScoreDistributionCard`, `TopCompaniesCard` ([`fd2b53d`](../../commit/fd2b53d))
- **PLATAFORMA** — Sistema de widgets drag-and-drop con resize y catálogo de widgets ([`5bcb520`](../../commit/5bcb520))
- **PLATAFORMA** — UX overhaul: modales CRUD, `ConfirmModal`, `SelectionBar`, colores por módulo, tour i18n ([`f01c73b`](../../commit/f01c73b))
- **PLATAFORMA** — Módulo Contáctanos completo: reason/message, modal UX, notificación al admin ([`2543e7f`](../../commit/2543e7f))
- **PLATAFORMA** — Ordenamiento de columnas en todas las tablas + consolidación del esquema SQL ([`59989aa`](../../commit/59989aa))
- **PLATAFORMA** — Comunidad: posts, contactos, walkthrough, eliminación de logo de empresa ([`1b046c6`](../../commit/1b046c6))
- **MOBILE** — Like/dislike en recomendaciones, iconos de presupuesto, tab sparkle IA ([`a236e6e`](../../commit/a236e6e))
- **MOBILE** — Permisos de ubicación Android para cálculo de `dist_km` ([`2bee384`](../../commit/2bee384))
- **MOBILE** — Double-tap fix, sparkle 5 colores, CTA animado, gestión de sesiones ([`e9764d3`](../../commit/e9764d3))
- **CI** — Workflow de release Flutter movido a `.github/workflows` raíz del monorepo ([`4bc541f`](../../commit/4bc541f))

### Changed
- **MODELO** — `_build_training_user_features` vectorizado con `groupby().any()` ([`bb4b57f`](../../commit/bb4b57f))
- **PLATAFORMA** — `SelectionBar` y controles fusionados en una sola fila de acción por módulo ([`b02b8c6`](../../commit/b02b8c6))
- **PLATAFORMA** — Estadísticas: selector turista/destino, KPIs mejorados ([`c0ce693`](../../commit/c0ce693))
- **PLATAFORMA** — Formulario de preferencias sin valores pre-seleccionados, labels con `*` y `(opcional)` ([`222acd7`](../../commit/222acd7))

### Fixed
- **MODELO** — Pipeline de modelo: carga de GBM, fallback a SVD, fix de fallo silencioso en dashboard ([`38b5c1f`](../../commit/38b5c1f))
- **MODELO** — Endpoint `/ml/health` 500: queries resilientes + migración para `ml_recommendation_feedback` ([`4bbafb4`](../../commit/4bbafb4))
- **MODELO** — Endpoint de métricas lee de DB (`ml_model_metrics`) con fallback a archivo ([`ee9fdba`](../../commit/ee9fdba))
- **PLATAFORMA** — Dark mode en checkboxes: `color-scheme:dark` + `accent-violet` ([`871c1cf`](../../commit/871c1cf))
- **PLATAFORMA** — Toast notifications y botón de cierre de modal se adaptan a light/dark theme ([`0e8b842`](../../commit/0e8b842))
- **PLATAFORMA** — Bugs de dashboard: `SelectionBar`, row click, Evaluar en modal, community create post ([`a60d806`](../../commit/a60d806))
- **PLATAFORMA** — Scroll en dashboard, sidebar footer compacto, gestión de estado en contactos ([`cce0a87`](../../commit/cce0a87))
- **MOBILE** — Google Sign-In: `signOut()` antes de `authenticate()` para limpiar credenciales cacheadas (error [16]) ([`1e3f97b`](../../commit/1e3f97b))
- **MOBILE** — Google Sign-In: Firebase web client ID correcto en `env_config` y `google-services.json` ([`1b1274f`](../../commit/1b1274f))
- **MOBILE** — Like optimista: fix `kind='svc'`, session cache, double-tap en `DetailViewPage` ([`33c6e22`](../../commit/33c6e22))
- **MOBILE** — ARB l10n: source of truth correcto + Google client ID en config ([`f3d28d7`](../../commit/f3d28d7))
- **MOBILE** — Session expiry: `rememberMe=false` dura 24h en lugar de expirar inmediatamente ([`5b98b0a`](../../commit/5b98b0a))
- **MOBILE** — Workflow CI: sintaxis Kotlin 2.1.21 + Gradle cache ([`7b9a8d7`](../../commit/7b9a8d7))
- **NGINX** — Exentar rutas de módulos Vite/Astro del rate limiting de nginx ([`b5622b2`](../../commit/b5622b2))
- **DOCKER** — URLs hardcodeadas de GitHub Pages y localhost apuntadas al VPS (`2.24.112.25`) ([`539ea2b`](../../commit/539ea2b))

### Removed
- **DB** — Archivos `.sql` sueltos eliminados; contenido consolidado en `API/bd.sql` ([`3d10121`](../../commit/3d10121))

---

## [0.1.0] — 2026-05-19

### Added
- Commit inicial: monorepo SMARTUR con todos los servicios y configuración Docker
  - `API` — REST API Node.js/Express con PostgreSQL
  - `PLATAFORMA` — Dashboard React (Vite + Tailwind) para administradores B2B
  - `LANDING` — Sitio web Astro para turistas B2C
  - `MOBILE` — App Flutter con Google Sign-In y recomendaciones IA
  - `MODELO` — Microservicio Python con motor de recomendaciones KNN/RF
  - `NGINX` — Reverse proxy con TLS y rate limiting
  - `docker-compose.yml` — Orquestación completa de todos los servicios

---

*Para ver el diff completo de cualquier versión, visita las [releases](../../releases) o ejecuta `git log <tag>..<tag>`.*
