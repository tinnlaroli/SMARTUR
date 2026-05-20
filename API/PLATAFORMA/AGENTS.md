# AGENTS.md — PLATAFORMA (Dashboard)

## Overview

React 19 + Vite dashboard for SMARTUR admin/management. Uses TailwindCSS 4, React Router 7, and TypeScript.

## UI & design docs (required for agents)

1. **[design.md](design.md)** — SMARTUR tokens (type, color, spacing, motion, components, a11y)
2. **[.agents/AGENTS.md](.agents/AGENTS.md)** — Skill priority: **emil-design-eng** → **GSAP** → CSS/Tailwind (not Framer Motion by default)

Skills in `.agents/skills/` must not override `design.md`.

## Key commands

```bash
# Local development
npm run dev          # Starts Vite on port 5173

# Build for production (skips TypeScript check)
npx vite build        # Or npm run build (runs tsc -b first)

# Docker
docker compose build plataforma
docker compose up -d plataforma
```

## Environment

- **Dev port**: 5173
- **API URL**: Configured in `.env` via `VITE_API_URL`

Default: `VITE_API_URL=http://api:3000/api/v2` (Docker internal)

## API proxy

During local dev, Vite proxies `/api/v2/*` to configured target. In production (Docker), nginx handles proxying via `nginx.conf`.

## Important gotchas

- **Build**: Use `npx vite build` instead of `npm run build` in Docker to skip TypeScript strict checking (there are TS errors that don't block runtime).
- **SPA routing**: Nginx config uses `try_files $uri $uri/ /index.html` to handle client-side routing.
- **Tailwind**: Uses TailwindCSS 4 with `@tailwindcss/vite` plugin.

## File structure

```
PLATAFORMA/
├── src/
│   ├── main.tsx           # Entry point
│   ├── routes/router.tsx  # React Router config
│   ├── layouts/           # AppLayout, Sidebar, RootLayout
│   ├── features/          # Feature modules by domain
│   │   ├── auth/          # Login, 2FA views
│   │   ├── users/         # User management
│   │   ├── companies/    # Company CRUD
│   │   ├── points-of-interest/
│   │   ├── certifications/
│   │   ├── evaluations/
│   │   └── instrument-builder/
│   ├── components/        # Shared components
│   ├── contexts/         # React contexts (Theme, Language, Toast)
│   └── shared/            # API client, utils
├── nginx.conf            # Production nginx config
└── vite.config.ts         # Vite + plugins config
```