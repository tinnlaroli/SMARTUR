# LANDING — SMARTUR

Astro 5 + React 19 marketing landing page for the SMARTUR tourism platform. Supports three languages (ES, EN, FR), 3D elements via Three.js/React-Three-Fiber, and a two-step contact form.

## Quick start

```bash
cd LANDING
npm install
npm run dev      # Astro dev server on port 4321
```

## Build

```bash
npm run build    # Outputs to dist/
npm run preview  # Preview production build locally
```

## Docker

```bash
docker compose build landing
docker compose up -d landing
```

## Environment variables

```env
PUBLIC_TOURIST_APP_URL=http://localhost:5173   # Link to PLATAFORMA dashboard
```

## Contact form

The `/contactanos` section uses a two-step modal flow:
1. User selects reason (B2B: download guide, join platform, request pricing; B2C: info, suggestion)
2. Fills name, email, message
3. Submits to `POST /api/v2/contact` — stored in DB only, no email notifications

The form component (`src/components/ContactForm.astro` + `PLATAFORMA/src/features/landing/components/ContactForm.tsx`) posts to the API; the contact is then visible in the PLATAFORMA dashboard under **Contactos**.

## i18n

Astro i18n routing with `defaultLocale: "es"`:
- `/` → Spanish (default)
- `/en/` → English
- `/fr/` → French

Translation strings are inline in each page component.

## Tech stack

- **Astro 5** static site generator
- **React 19** for interactive islands
- **TailwindCSS 3** (note: PLATAFORMA uses v4 — these are separate configs)
- **Three.js** + **React Three Fiber** for 3D hero element
- **Lottie** animations (`.lottie` files in `src/assets/`)

## File structure

```
LANDING/
├── src/
│   ├── pages/
│   │   ├── index.astro         # Spanish home
│   │   ├── en/index.astro      # English
│   │   └── fr/index.astro      # French
│   ├── components/             # Astro + React components
│   │   └── ContactForm.astro   # Contact form section
│   ├── layouts/Layout.astro    # Base layout
│   ├── styles/                 # Global CSS
│   └── assets/
│       ├── imgs/               # Images
│       ├── video/              # Videos
│       ├── 3d/                 # 3D models (.glb)
│       └── *.lottie            # Animations
├── tailwind.config.mjs
├── astro.config.mjs
├── nginx.conf                  # Production nginx (proxies /api/v2/* → API)
└── Dockerfile
```

## Nginx proxy

The LANDING nginx proxies `/api/v2/*` to the API container so contact form submissions work from the same domain:

```nginx
location /api/v2/ {
    proxy_pass http://api:4000/api/v2/;
}
```
