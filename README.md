<div align="center">

<img src="https://img.shields.io/badge/SMARTUR-Turismo%20Inteligente-4F46E5?style=for-the-badge&logoColor=white" alt="SMARTUR" height="40"/>

# SMARTUR — Plataforma de Turismo Inteligente

**Monorepo oficial** · Backend · Dashboard Admin · Landing · Motor ML · App Móvil

[![CI Mobile](https://img.shields.io/github/actions/workflow/status/tinnlaroli/SMARTUR/release.yml?label=CI%20Mobile&logo=github-actions&logoColor=white&style=flat-square)](https://github.com/tinnlaroli/SMARTUR/actions)
[![License](https://img.shields.io/badge/license-Propietario-red?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?style=flat-square&logo=flutter&logoColor=white)](https://flutter.dev)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)

</div>

---

## <img src="https://cdn.simpleicons.org/readme/018EF5" width="20" height="20" /> Tabla de contenidos

- [Visión general](#visión-general)
- [Arquitectura](#arquitectura)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Puesta en marcha local](#puesta-en-marcha-local)
- [Variables de entorno](#variables-de-entorno)
- [Endpoints principales](#endpoints-principales)
- [Base de datos](#base-de-datos)
- [Motor ML](#motor-ml)
- [GitFlow](#gitflow)
- [Despliegue en VPS](#despliegue-en-vps)
- [Usuarios de prueba](#usuarios-de-prueba)
- [Licencia](#licencia)

---

## <img src="https://cdn.simpleicons.org/googlemaps/4285F4" width="20" height="20" /> Visión general

**SMARTUR** es una plataforma de turismo inteligente que combina recomendaciones personalizadas con inteligencia artificial, gamificación y una experiencia omnicanal (web + móvil).

| Componente | Tecnología | Descripción |
|------------|-----------|-------------|
| <img src="https://cdn.simpleicons.org/flutter/02569B" width="16" height="16" /> **App Móvil** | Flutter 3 | Discovery, recomendaciones y rating gamificado |
| <img src="https://cdn.simpleicons.org/react/61DAFB" width="16" height="16" /> **Dashboard Admin** | React / Vite | Gestión de usuarios, POIs, reportes y ML observability |
| <img src="https://cdn.simpleicons.org/astro/FF5D01" width="16" height="16" /> **Landing** | Astro + React | Marketing, descarga APK y contacto |
| <img src="https://cdn.simpleicons.org/nodedotjs/339933" width="16" height="16" /> **API REST** | Node.js / Express 5 | Autenticación, lógica de negocio, proxy ML |
| <img src="https://cdn.simpleicons.org/python/3776AB" width="16" height="16" /> **Motor ML** | Python / FastAPI | Recomendaciones KNN+RF, métricas en tiempo real |

---

## <img src="https://cdn.simpleicons.org/docker/2496ED" width="20" height="20" /> Arquitectura

```
Internet
    │
    ▼
 Nginx (reverse proxy)
    ├── /                    → LANDING    :4321
    ├── /plataforma          → PLATAFORMA :5173
    └── /api/v2/             → API        :4000
                                  │
                                  ├── postgres  :5432
                                  ├── redis     :6379
                                  └── MODELO    :8000 (interno)

App Móvil (Flutter)
    └── → API :4000  (con JWT)
             └── /api/v2/ml/recommend  → MODELO :8000
```

**Principio clave:** el MODELO nunca es accesible directamente desde clientes externos — toda llamada ML pasa por el proxy autenticado de la API.

---

## <img src="https://cdn.simpleicons.org/stackshare/0690FA" width="20" height="20" /> Stack tecnológico

### <img src="https://cdn.simpleicons.org/nodedotjs/339933" width="16" height="16" /> Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express%205-000000?style=flat-square&logo=express&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)

### <img src="https://cdn.simpleicons.org/scikitlearn/F7931E" width="16" height="16" /> Motor ML
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-150458?style=flat-square&logo=pandas&logoColor=white)

### <img src="https://cdn.simpleicons.org/react/61DAFB" width="16" height="16" /> Frontend Web
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Astro](https://img.shields.io/badge/Astro-FF5D01?style=flat-square&logo=astro&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

### <img src="https://cdn.simpleicons.org/flutter/02569B" width="16" height="16" /> App Móvil
![Flutter](https://img.shields.io/badge/Flutter-02569B?style=flat-square&logo=flutter&logoColor=white)
![Dart](https://img.shields.io/badge/Dart-0175C2?style=flat-square&logo=dart&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)

### <img src="https://cdn.simpleicons.org/docker/2496ED" width="16" height="16" /> DevOps
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=flat-square&logo=github-actions&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=flat-square&logo=nginx&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-F46800?style=flat-square&logo=grafana&logoColor=white)

---

## <img src="https://cdn.simpleicons.org/git/F05032" width="20" height="20" /> Estructura del repositorio

```
DEVELOPMENT/
├── docker-compose.yml          # Orquestación de servicios
├── docker-compose.override.yml # Overrides locales
├── .env                        # Variables de entorno (no se versiona)
├── .gitignore
├── AGENTS.md                   # Instrucciones para agentes IA
│
├── API/                        # Backend Node.js/Express 5
│   ├── src/
│   │   ├── routes/             # Rutas REST
│   │   ├── middleware/         # Auth, CORS, rate-limit
│   │   └── services/          # Lógica de negocio
│   ├── bd.sql                  # [!] Esquema DB — fuente de verdad
│   └── Dockerfile
│
├── PLATAFORMA/                 # Dashboard admin React/Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── Dockerfile
│
├── LANDING/                    # Sitio marketing Astro + React
│   ├── src/
│   └── Dockerfile
│
├── MODELO/                     # Motor ML Python/FastAPI
│   ├── app/
│   │   ├── model.py            # KNN + Random Forest híbrido
│   │   ├── routes.py           # Endpoints FastAPI
│   │   └── data/              # Datasets y cache del modelo
│   └── Dockerfile
│
├── MOBILE/                     # App Flutter
│   ├── lib/
│   │   ├── core/               # Constants, config, theme
│   │   ├── data/               # Services, repositories
│   │   ├── presentation/       # Screens, widgets
│   │   └── l10n/               # Internacionalización (ES/EN/FR/PT)
│   ├── android/
│   └── .github/workflows/      # CI/CD — build y release APK/AAB
│
├── nginx/                      # Configuración Nginx
└── scripts/                    # Scripts de utilidad
```

---

## <img src="https://cdn.simpleicons.org/docker/2496ED" width="20" height="20" /> Puesta en marcha local

### Requisitos

| Herramienta | Versión mínima |
|-------------|----------------|
| <img src="https://cdn.simpleicons.org/docker/2496ED" width="14" height="14" /> Docker Desktop | 24.x |
| <img src="https://cdn.simpleicons.org/git/F05032" width="14" height="14" /> Git | 2.40+ |
| <img src="https://cdn.simpleicons.org/nodedotjs/339933" width="14" height="14" /> Node.js *(opcional, dev)* | 22.x |
| <img src="https://cdn.simpleicons.org/flutter/02569B" width="14" height="14" /> Flutter *(opcional, mobile)* | 3.x |

### Inicio rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/tinnlaroli/SMARTUR.git
cd SMARTUR

# 2. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Levantar todos los servicios
docker compose up -d

# 4. Ver logs en tiempo real
docker compose logs -f
```

### Servicios disponibles

| Servicio | URL local | Descripción |
|----------|-----------|-------------|
| <img src="https://cdn.simpleicons.org/astro/FF5D01" width="14" height="14" /> Landing | http://localhost:4321 | Sitio de marketing |
| <img src="https://cdn.simpleicons.org/react/61DAFB" width="14" height="14" /> Plataforma | http://localhost:5173 | Dashboard admin |
| <img src="https://cdn.simpleicons.org/nodedotjs/339933" width="14" height="14" /> API | http://localhost:4000 | Backend REST |
| <img src="https://cdn.simpleicons.org/python/3776AB" width="14" height="14" /> Modelo ML | http://localhost:8000 | Motor de recomendaciones |
| <img src="https://cdn.simpleicons.org/grafana/F46800" width="14" height="14" /> Grafana | http://localhost:4001 | Monitoreo y métricas |

> **Nota:** El MODELO puede tardar 5-10 minutos en el primer arranque (descarga y entrena el dataset inicial de Kaggle).

### Comandos útiles

```bash
# Ver logs de un servicio específico
docker logs smartur-api --follow
docker logs smartur-modelo --follow

# Reconstruir un servicio
docker compose build api && docker compose up -d api

# Reiniciar con reload de variables de entorno
docker compose up -d --force-recreate api

# Parar todo
docker compose down
```

---

## <img src="https://cdn.simpleicons.org/dotenv/ECD53F" width="20" height="20" /> Variables de entorno

Crea un archivo `.env` en la raíz con las siguientes variables:

```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password
POSTGRES_DB=smartur

# API
JWT_SECRET=tu_jwt_secret_largo
GOOGLE_CLIENT_ID=tu_google_web_client_id.apps.googleusercontent.com

# Kaggle (para descarga de dataset en MODELO)
KAGGLE_USERNAME=tu_usuario
KAGGLE_KEY=tu_api_key

# OpenWeather
OPENWEATHER_API_KEY=tu_api_key

# URLs internas Docker
AI_ENGINE_URL=http://modelo:8000
```

---

## <img src="https://cdn.simpleicons.org/swagger/85EA2D" width="20" height="20" /> Endpoints principales

### Autenticación
```
POST   /api/v2/auth/login             Iniciar sesión (email + password)
POST   /api/v2/auth/login/google      Iniciar sesión con Google
POST   /api/v2/auth/register          Registro de nuevo usuario
POST   /api/v2/auth/logout            Cerrar sesión
```

### POIs y Exploración
```
GET    /api/v2/pois                   Listado de lugares turísticos
GET    /api/v2/pois/:id               Detalle de un POI
GET    /api/v2/pois/nearby            POIs cercanos (lat/lng/radio)
```

### Recomendaciones ML
```
POST   /api/v2/ml/recommend/:userId   Recomendaciones personalizadas
GET    /api/v2/ml/health              Estado y métricas del modelo
POST   /api/v2/me/interactions        Registrar interacción implícita
POST   /api/v2/me/rating              Rating explícito (1-5 estrellas)
```

### Chat y FAQs
```
POST   /api/v2/conversations                    Crear conversación turista↔empresa
GET    /api/v2/conversations/me                 Mis conversaciones
GET    /api/v2/conversations/:id/messages       Mensajes de una conversación
POST   /api/v2/conversations/:id/messages       Enviar mensaje
POST   /api/v2/conversations/:id/bot-message    Consulta al bot de FAQs (full-text search)
GET    /api/v2/conversations/:id/faqs           Listado de FAQs de la empresa (hoja de sugerencias)
POST   /api/v2/empresa/faqs                     Crear FAQ (rol empresa)
GET    /api/v2/empresa/faqs                     Listar mis FAQs (rol empresa)
PATCH  /api/v2/empresa/faqs/:id                 Editar FAQ
DELETE /api/v2/empresa/faqs/:id                 Eliminar FAQ
```

### Administración
```
GET    /api/v2/users                  Listado de usuarios (admin)
PATCH  /api/v2/users/:id/role         Cambiar rol de usuario
GET    /api/v2/reports                Reportes comunitarios
PATCH  /api/v2/reports/:id/status     Actualizar estado de reporte
GET    /api/v2/contact-subscriptions  Suscripciones de contacto
```

---

## <img src="https://cdn.simpleicons.org/postgresql/4169E1" width="20" height="20" /> Base de datos

`API/bd.sql` es la **única fuente de verdad** del esquema. Cualquier cambio en la BD debe reflejarse aquí.

```bash
# Aplicar esquema localmente
Get-Content "API/bd.sql" | docker exec -i smartur-postgres psql -U postgres -d smartur

# Aplicar en VPS
ssh root@<VPS_IP> "docker exec -i smartur-postgres psql -U postgres -d smartur" < API/bd.sql
```

> **Regla:** No crear archivos `.sql` sueltos en el proyecto. Todo va en `API/bd.sql`.

---

## <img src="https://cdn.simpleicons.org/scikitlearn/F7931E" width="20" height="20" /> Motor ML

El MODELO implementa un sistema híbrido **KNN + Random Forest** para recomendaciones personalizadas:

- **Cold start:** usuarios nuevos reciben POIs populares de su ciudad
- **Warm start:** modelo entrenado con interacciones implícitas + ratings explícitos
- **Reentrenamiento:** automático tras N interacciones nuevas

```bash
# Ver métricas del modelo
curl http://localhost:8000/metrics

# Forzar reentrenamiento
curl -X POST http://localhost:8000/train
```

---

## <img src="https://cdn.simpleicons.org/git/F05032" width="20" height="20" /> GitFlow

Este repositorio sigue la convención **GitFlow**:

```
main                  ← producción estable (protegida)
develop               ← integración de features
  ├── feature/nombre-feature
  ├── feature/otro-feature
release/vX.Y.Z        ← preparación de release
hotfix/descripcion    ← correcciones urgentes en producción
```

### Flujo de trabajo

```bash
# 1. Crear feature desde develop
git checkout develop
git checkout -b feature/mi-feature

# 2. Trabajar y commitear (Conventional Commits)
git commit -m "feat(api): agregar endpoint de estadísticas"

# 3. Mergear de vuelta a develop via PR
git push origin feature/mi-feature
gh pr create --base develop --title "feat: mi feature"

# 4. Release
git checkout -b release/v2.1.0 develop
# ... ajustes finales, bump de versión ...
git checkout main && git merge release/v2.1.0
git tag v2.1.0

# 5. Hotfix (desde main)
git checkout -b hotfix/fix-critico main
git checkout main && git merge hotfix/fix-critico
git checkout develop && git merge hotfix/fix-critico
```

### Conventional Commits

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Cambios en documentación |
| `refactor` | Refactor sin cambio de comportamiento |
| `chore` | Mantenimiento, dependencias |
| `ci` | Cambios en CI/CD |

---

## <img src="https://cdn.simpleicons.org/linux/000000" width="20" height="20" /> Despliegue en VPS

```bash
# Conectar al VPS
ssh root@<VPS_IP>

# Ir al directorio del proyecto
cd /opt/SMARTUR

# Bajar últimos cambios
git pull origin main

# Aplicar cambios de BD (si los hay)
docker exec -i smartur-postgres psql -U postgres -d smartur < API/bd.sql

# Reconstruir y reiniciar servicios modificados
docker compose build api && docker compose up -d --force-recreate api

# Verificar que todo está corriendo
docker compose ps
```

---

## <img src="https://cdn.simpleicons.org/auth0/EB5424" width="20" height="20" /> Usuarios de prueba

| Email | Contraseña | Rol |
|-------|------------|-----|
| `turista@smartur.demo` | `Password1a` | Turista |
| `martinlaraolivares@gmail.com` | `Password1a` | Admin |

---

## <img src="https://cdn.simpleicons.org/android/3DDC84" width="20" height="20" /> App Móvil

[![Download APK](https://img.shields.io/badge/Download-APK%20Latest-4F46E5?style=for-the-badge&logo=android&logoColor=white)](https://github.com/tinnlaroli/smartur-movil/releases/latest/download/app-release.apk)

El APK de producción se construye automáticamente vía GitHub Actions en el repo [`smartur-movil`](https://github.com/tinnlaroli/smartur-movil) cuando se crea un tag `v*`.

---

## <img src="https://cdn.simpleicons.org/opensourceinitiative/3DA639" width="20" height="20" /> Licencia

**Propietario — Todos los derechos reservados.**  
© 2025 SMARTUR. Uso exclusivo del equipo de desarrollo.

---

<div align="center">

Si este proyecto te resulta útil o interesante, considera dejarle una estrella.  
Ayuda a que más personas lo descubran y motiva a seguir mejorándolo.

[![Star](https://img.shields.io/github/stars/tinnlaroli/SMARTUR?style=social)](https://github.com/tinnlaroli/SMARTUR/stargazers)

[![GitHub](https://img.shields.io/badge/GitHub-tinnlaroli-181717?style=flat-square&logo=github)](https://github.com/tinnlaroli)

Desarrollado por el equipo **SMARTUR**

</div>
