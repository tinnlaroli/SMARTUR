# AGENTS.md — PLATAFORMA (Dashboard)

## Overview

React 19 + Vite admin dashboard for SMARTUR. TailwindCSS 4, React Router 7, TypeScript. Admin-only (role 1). Served via nginx on port 5173.

## UI & design docs (required for agents)

1. **[design.md](design.md)** — SMARTUR tokens (type, color, spacing, motion, components, a11y)
2. **[.agents/AGENTS.md](.agents/AGENTS.md)** — Skill priority: **emil-design-eng** → **GSAP** → CSS/Tailwind (not Framer Motion)

Skills in `.agents/skills/` must not override `design.md`.

## Key commands

```bash
npm run dev          # Vite dev server on port 5173
npx vite build       # Production build (skips TS strict check — used in Docker)
npm run build        # Full build (runs tsc -b first)

docker compose build plataforma && docker compose up -d plataforma
```

## Environment

- **Dev port**: 5173
- **API**: `VITE_API_URL=http://localhost:4000/api/v2` (local) — nginx handles proxy in Docker

## Important gotchas

- **Tailwind v4**: Uses `@tailwindcss/vite` plugin (not `tailwind.config.js`). CSS variables via `@theme` in `src/index.css`.
- **Build in Docker**: `npx vite build` skips TypeScript strict checking — there are TS errors that don't block runtime.
- **SPA routing**: Nginx uses `try_files $uri $uri/ /index.html`.
- **AppLayout scroll**: Root div is `flex h-screen overflow-hidden`; `<main>` is `overflow-y-auto`. Content MUST NOT scroll the page — use the contained-scroll pattern.
- **Color tokens**: Use CSS vars (`var(--color-text)`, `var(--color-bg-alt)`, `var(--color-border)`, `var(--color-purple)`, `var(--color-pink)`) not hardcoded hex, so dark/light mode works.

## DataTable system

All table modules share `src/components/ui/DataTable.tsx`. Never build ad-hoc tables.

### Components

| Export | Role |
|--------|------|
| `DataTableShell` | Outer rounded container, `flex flex-col overflow-hidden` |
| `DataTableScroll` | `overflow-x-auto flex-1` horizontal scroll |
| `DataTable` | `<table>` with `w-full text-sm` |
| `DataTableHead` / `DataTableHeadCell` | `<thead>` / `<th>` |
| `DataTableBody` / `DataTableRow` / `DataTableCell` | `<tbody>` / `<tr>` / `<td>` |
| `SortableHeadCell` | `<th>` with chevron icon, cycles null→asc→desc→null on click |
| `DataTableHeaderSelect` | `<th>` with embedded `<select>` for inline column filter |
| `sortRows<T>()` | Generic client-side sort — strings use `localeCompare`, numbers subtract, nulls sort last |
| `nextSort()` | State transition: `null → asc → desc → null` |
| `SortState` | `{ key: string; dir: 'asc' | 'desc' }` |
| `TableBadge` | Pill badge with `bg`/`color` props |

### Contained-scroll page pattern

```tsx
<div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
  {/* Header, banners, filters — all shrink-0 */}
  <div className="shrink-0 ...">Header</div>

  <DataTableShell className="h-full">
    {isEmpty ? (
      <EmptyState />
    ) : (
      <DataTableScroll>
        <DataTable>
          <DataTableHead>
            <tr>
              <SortableHeadCell sortKey="name" sort={sort} onSort={handleSort}>Nombre</SortableHeadCell>
              {/* embedded filter */}
              <DataTableHeaderSelect value={filter} onChange={setFilter} label="Tipo">
                <option value="">Todos</option>
                <option value="hotel">Hotel</option>
              </DataTableHeaderSelect>
            </tr>
          </DataTableHead>
          <DataTableBody>
            {isLoading
              ? <TableBodyRows rows={10} colWidths={['w-8','flex-1','w-28']} />
              : displayData.map((row, i) => <DataTableRow key={row.id} index={i}>...</DataTableRow>)
            }
          </DataTableBody>
        </DataTable>
      </DataTableScroll>
    )}
  </DataTableShell>

  {totalPages > 1 && <Pagination page={page} totalPages={totalPages} limit={LIMIT} setSearchParams={setSearchParams} />}
</div>
```

### Sort wiring per component

```tsx
const [sort, setSort] = useState<SortState | null>(null);
const handleSort = (key: string) => setSort(prev => nextSort(prev, key));
const displayData = useMemo(() => sortRows(rawData, sort), [rawData, sort]);
```

## Feature modules

Each feature in `src/features/<name>/` follows this structure:
```
<name>/
  pages/      # Page components (route targets)
  components/ # Feature-specific components
  hooks/      # Data-fetching hooks (useState + useCallback + API call)
  api/        # API wrapper (axiosClient calls)
  types/      # TypeScript interfaces
```

### Contacts module (`src/features/contacts/`)

Manages contact form submissions from the landing page and PLATAFORMA. **No email notifications** — contacts are stored only in DB and managed from dashboard.

- `ContactStatus`: `'pending' | 'in_progress' | 'done' | 'dismissed'`
- Status updated inline via `<select>` per row with color-coded backgrounds
- Message viewer: click truncated message to expand a detail panel above the table
- Sources: `landing_b2b`, `landing_turista`, `plataforma_contact`, `dashboard`

### ML Observability module (`src/features/ml-observability/`)

Monitoring dashboard for the recommendation engine:
- KPI strip: latest RMSE/MAE, total sessions (30d), CTR (30d), avg inference latency
- Latency & sessions chart (Recharts AreaChart)
- Algorithm comparison table (RF vs CF vs Hybrid vs Baseline)
- Fetches from `GET /api/v2/ml/health`

## Sidebar (`src/layouts/Sidebar.tsx`)

Nav groups:
- **Plataforma**: Home, Usuarios, Compañías, Servicios Turísticos, Ubicaciones, POI
- **Turismo**: Perfiles, Actividades, Certificaciones, Instrumentos
- **Sistema**: Estadísticas, Comunidad, Contactos, ML / Observabilidad IA

Footer: compact single-row user card with avatar, name/role, and logout button.

## Pagination

Use `src/features/users/components/Pagination.tsx` with props:
```tsx
<Pagination page={page} totalPages={totalPages} limit={LIMIT} setSearchParams={setSearchParams} />
```
Page state comes from `useSearchParams()`, not local state.

## File structure

```
PLATAFORMA/
├── src/
│   ├── main.tsx
│   ├── routes/router.tsx
│   ├── layouts/
│   │   ├── AppLayout.tsx        # flex h-screen overflow-hidden
│   │   ├── Sidebar.tsx
│   │   └── RootLayout.tsx
│   ├── features/                # Feature modules
│   ├── components/
│   │   └── ui/DataTable.tsx     # Shared table system
│   ├── contexts/
│   └── shared/
│       ├── api/axiosClient.ts
│       └── hooks/useDashboardTour.ts
├── nginx.conf
├── vite.config.ts
└── Dockerfile
```
