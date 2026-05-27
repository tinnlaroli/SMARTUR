# PLATAFORMA — SMARTUR Admin Dashboard

React 19 + Vite admin dashboard for the SMARTUR tourism platform. Role-based access: **admin (role 1)** y **empresa (role 3)** con portales separados.

## Quick start

```bash
cd PLATAFORMA
npm install
npm run dev      # Vite dev server on port 5173
```

## Build

```bash
# Production build (runs tsc + vite build)
npm run build

# Skip TypeScript strict check (used in Docker)
npx vite build
```

## Docker

```bash
docker compose build plataforma
docker compose up -d plataforma
```

## Environment

```env
VITE_API_URL=http://localhost:4000/api/v2   # local dev
# Docker: nginx proxies /api/v2/* → http://api:4000/api/v2
```

## Dashboard modules

| Route | Module | Description |
|-------|--------|-------------|
| `/dashboard` | Home | KPI overview, charts |
| `/dashboard/usuarios` | Users | User list, role filter, sort |
| `/dashboard/companias` | Companies | Company CRUD, sector filter |
| `/dashboard/servicios` | Tourist Services | Services CRUD, type filter |
| `/dashboard/ubicaciones` | Locations | Municipality management |
| `/dashboard/poi` | Points of Interest | POI management, sustainable filter |
| `/dashboard/perfiles` | Profiles | Traveler profile analysis |
| `/dashboard/actividades` | Activities | Tourism activities |
| `/dashboard/certificaciones` | Certifications | Service certifications |
| `/dashboard/instrumentos` | Instrument Builder | Evaluation form builder |
| `/dashboard/comunidad` | Community | User post moderation |
| `/dashboard/contactos` | Contacts | Contact/subscription management |
| `/dashboard/ml` | ML / Observability | Recommendation engine monitoring |
| `/dashboard/estadisticas` | Statistics | Tourism statistics |
| `/dashboard/notificaciones` | Notifications | Send FCM push to all/segment |
| `/dashboard/configuracion` | Settings | Theme, language |
| `/empresa/dashboard` | Empresa Dashboard | B2B company overview (role 3) |
| `/empresa/perfil` | Empresa Perfil | Edit own company data (role 3) |
| `/empresa/servicios` | Empresa Servicios | View own services (role 3) |
| `/empresa/analytics` | Empresa Analytics | KPIs and engagement (role 3) |
| `/register-empresa` | Registro Empresa | Public self-registration form |

## Tech stack

- **React 19** + **TypeScript**
- **React Router 7** (browser router)
- **TailwindCSS 4** via `@tailwindcss/vite` plugin
- **Recharts** for charts
- **Lucide React** for icons
- **Axios** for API calls (shared client in `src/shared/api/axiosClient.ts`)

## DataTable system

All table modules use the shared `src/components/ui/DataTable.tsx` component system:

- `DataTableShell` — outer fixed-height container (`h-full`)
- `DataTableScroll` — horizontally scrollable wrapper
- `DataTable` / `DataTableHead` / `DataTableBody` / `DataTableRow` / `DataTableCell` — semantic table elements
- `SortableHeadCell` — column header with ASC/DESC/none sort cycle
- `DataTableHeaderSelect` — embedded `<select>` filter inside a column header
- `sortRows<T>()` — generic client-side sort (string localeCompare, number subtraction, null-safe)
- `nextSort()` — cycles sort state: null → asc → desc → null

### Dashboard scroll pattern

All page modules use this layout to keep header/sidebar fixed and scroll only the table:

```tsx
<div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
  {/* header, filters, banners — shrink-0 */}
  <DataTableShell className="h-full">
    <DataTableScroll>
      <DataTable>...</DataTable>
    </DataTableScroll>
  </DataTableShell>
  <Pagination ... />
</div>
```

## File structure

```
PLATAFORMA/
├── src/
│   ├── main.tsx
│   ├── routes/
│   │   └── router.tsx           # All dashboard routes
│   ├── layouts/
│   │   ├── AppLayout.tsx        # h-screen overflow-hidden shell
│   │   ├── Sidebar.tsx          # Collapsible nav, role-based items
│   │   └── RootLayout.tsx
│   ├── features/
│   │   ├── activities/
│   │   ├── auth/
│   │   ├── certifications/
│   │   ├── community/
│   │   ├── companies/
│   │   ├── contacts/            # Contact form submissions management
│   │   ├── home/
│   │   ├── instrument-builder/
│   │   ├── landing/             # In-app landing (public route /)
│   │   ├── locations/
│   │   ├── ml-observability/    # ML engine monitoring dashboard
│   │   ├── points-of-interest/
│   │   ├── profiles/
│   │   ├── statistics/
│   │   ├── tourist-services/
│   │   └── users/
│   ├── components/
│   │   └── ui/
│   │       ├── DataTable.tsx    # Shared table system
│   │       └── TableSkeleton.tsx
│   ├── contexts/
│   │   ├── ThemeContext.tsx
│   │   ├── languageCatalog.ts
│   │   └── ToastContext.tsx
│   └── shared/
│       ├── api/axiosClient.ts
│       └── hooks/
│           └── useDashboardTour.ts
├── nginx.conf
├── vite.config.ts
└── Dockerfile
```
