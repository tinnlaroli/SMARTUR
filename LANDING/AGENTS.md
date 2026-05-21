# AGENTS.md — LANDING (Marketing Site)

## Overview

Astro 5 + React 19 marketing landing page for SMARTUR. Multi-language (ES, EN, FR), 3D elements via Three.js/React-Three-Fiber, two-step contact modal. Served via nginx on port 4321.

## Key commands

```bash
npm run dev          # Astro dev server on port 4321
npm run build        # Production build → dist/
npm run preview      # Preview built output

docker compose build landing && docker compose up -d landing
```

## Environment

- **Dev port**: 4321
- **Base path**: `/` (configured in `astro.config.mjs`)
- **Public vars**: `PUBLIC_TOURIST_APP_URL` — links to PLATAFORMA dashboard

## Important gotchas

- **Package manager**: Uses pnpm locally, npm in Docker (pnpm script restrictions in Docker).
- **Tailwind**: Uses TailwindCSS **v3** (`tailwind.config.mjs`) — PLATAFORMA uses v4. Do not confuse the configs.
- **i18n**: `defaultLocale: "es"`, locales `["es", "en", "fr"]`. English/French pages are in `src/pages/en/` and `src/pages/fr/`.
- **SPA routing**: Nginx uses `try_files $uri $uri/ /index.html` for Astro static output.
- **Build deps**: esbuild, sharp require native builds — handled in Docker via `npm install`.
- **API proxy**: nginx proxies `/api/v2/*` → `http://api:4000/api/v2/` so contact form works cross-origin.

## Contact form

Two-step modal flow (`src/components/ContactForm.astro`):
1. Reason selector (B2B: guide download, join platform, pricing; B2C: info, suggestion)
2. Name + email + message fields
3. `POST /api/v2/contact` — stored in DB only, **no email sent**. Managed from PLATAFORMA `/dashboard/contactos`.

`source` field values sent:
- `landing_b2b` — B2B contact from landing
- `landing_turista` — tourist contact from landing

## File structure

```
LANDING/
├── src/
│   ├── pages/
│   │   ├── index.astro         # Spanish (default)
│   │   ├── en/index.astro      # English
│   │   └── fr/index.astro      # French
│   ├── components/             # Astro + React components
│   │   └── ContactForm.astro   # Contact form with 2-step modal
│   ├── layouts/Layout.astro    # Base HTML layout
│   ├── styles/                 # Global CSS
│   └── assets/
│       ├── imgs/               # Images
│       ├── video/              # Videos
│       ├── 3d/                 # 3D models (.glb)
│       └── *.lottie            # Lottie animations
├── tailwind.config.mjs         # Tailwind v3 config
├── astro.config.mjs
├── nginx.conf
└── Dockerfile
```
