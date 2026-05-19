# SMARTUR — Plataforma de Recomendaciones Turísticas

> Sistema de recomendaciones turísticas inteligente para Orizaba, Veracruz.

---

## Arquitectura del Proyecto

El proyecto está compuesto por **dos aplicaciones React independientes** que comparten `package.json`, `tailwind.config.js` y `vite`:

| App | Entry Point | Puerto | Descripción |
|---|---|---|---|
| **Landing Page** | `index.html` + `src/main.jsx` | `:5173` | Pública — recomendaciones, formulario, auth por modal |
| **Dashboard Admin** | `src/features/dashboard-admin/index.html` + `main.tsx` | `:5174` | Privada — gestión de usuarios, empresas, ubicaciones, servicios |

### Estructura de `src/`

```
src/
├── features/                    ← Lógica de negocio por dominio
│   ├── auth/                    ← AuthContext, LoginModal, SignUpModal, 2FA (Landing)
│   ├── form/                    ← Formulario multi-paso de recomendaciones
│   ├── landing/                 ← Secciones de la Landing (Hero, Servicios, etc.)
│   └── dashboard-admin/         ← Dashboard de administración (TypeScript)
│       ├── features/            ← users, companies, locations, tourist-services, evaluations
│       ├── layouts/             ← AppLayout.tsx, Sidebar.tsx
│       ├── routes/              ← router.tsx (React Router)
│       ├── shared/              ← api, context (ToastContext), components (ProtectedRoute)
│       ├── loader/              ← SmartURLoader
│       ├── index.html           ← Entry HTML del Dashboard
│       ├── index.css            ← Tailwind v3 para el Dashboard
│       └── main.tsx             ← Entry point del Dashboard
│
├── shared/                      ← Recursos compartidos de la Landing
│   ├── api/
│   │   ├── axiosClient.js       ← Cliente HTTP con interceptor de auth
│   │   └── smartur.js           ← API de recomendaciones (SMARTUR microservice)
│   └── hooks/
│       └── useRecommendations.js← Hook para el motor de recomendaciones
│
├── components/
│   ├── common/                  ← MultiStepFormModal, RecommendationsResultModal
│   ├── layout/                  ← FloatingNavbar, Header, Footer, ThemeToggle
│   └── ui/                      ← SmartURLoader
│
├── contexts/                    ← LanguageContext (i18n), ThemeContext (dark/light)
├── pages/                       ← Landing.jsx, NotFound.jsx
├── routes/                      ← index.jsx (AppRouter de la Landing)
├── assets/                      ← Imágenes, logos, fuentes
├── index.css                    ← Variables CSS globales SMARTUR + Tailwind
└── main.jsx                     ← Entry point de la Landing
```

---

## 🚀 Comandos

```bash
# Instalar dependencias
pnpm install

# Desarrollo — ambas apps a la vez
pnpm run dev:all

# Desarrollo — por separado
pnpm run dev           # Landing  → http://localhost:5173
pnpm run dev:dashboard # Dashboard → http://localhost:5174

# Build de producción
pnpm run build           # Landing
pnpm run build:dashboard # Dashboard
```

---

## 🔐 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# URL de la API principal (NestJS / Express)
VITE_API_URL=http://localhost:3000/api/v2

# URL del microservicio de recomendaciones
VITE_SMARTUR_API_URL=http://localhost:8000

# URL del Dashboard (para redirección tras login de admin)
VITE_DASHBOARD_URL=http://localhost:5174
```

> En producción, reemplaza `localhost` por los dominios reales.

---

## 🔑 Flujo de Autenticación

```
Landing (:5173)                  Dashboard (:5174)
    │                                  │
    ├─ Login (modal)                   │
    │     │                            │
    │     ├─ Role: user  ──────────────X  (permanece en Landing)
    │     │                            │
    │     └─ Role: admin ──────────────► /dashboard#access_token=<jwt>
    │                                  │
    │                                  ├─ ProtectedRoute lee hash
    │                                  ├─ Guarda token en localStorage
    │                                  └─ Renderiza Dashboard
```

> **Nota:** La autenticación de Landing (modales JSX) y Dashboard (páginas TSX) son deliberadamente independientes. En producción, con el mismo dominio, se puede usar un cookie compartido en lugar del hash.

---

## 🎨 Sistema de Diseño

Las variables CSS globales están definidas en `src/index.css`:

| Variable | Color | Uso |
|---|---|---|
| `--color-orange` | `#ff7d1f` | CTAs principales |
| `--color-purple` | `#984efd` | Acentos, focus rings |
| `--color-cyan` | `#4db9ca` | Links, texto acento |
| `--color-green` | `#9ccc44` | Éxito, naturaleza |
| `--color-pink` | `#fc478e` | Héroe, highlights |

Tipografía: **Cal Sans** (títulos) + **Outfit** (cuerpo).

---

## 📐 Estándares de Código

- **Landing:** JavaScript/JSX, PascalCase para componentes
- **Dashboard:** TypeScript/TSX, PascalCase para componentes
- **Hooks:** camelCase con prefijo `use`
- **API services:** camelCase, sufijo `Api` o `Services`
- **Contextos:** PascalCase, sufijo `Context`

---

## 🛠 Tech Stack

| Capa | Tecnología |
|---|---|
| UI | React 18, Tailwind CSS 3, Framer Motion, GSAP |
| 3D Hero | Three.js |
| Routing | React Router v6 |
| HTTP | Axios |
| Build | Vite 5 |
| Package Manager | pnpm |
| TypeScript | Dashboard únicamente |
