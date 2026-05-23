/* ── Widget Registry ───────────────────────────────────────────────────
   Single source of truth for every widget available in the dashboard grid.
   Each entry defines display metadata and size constraints.
──────────────────────────────────────────────────────────────────────── */

export type WidgetCategory = 'analytics' | 'operations' | 'tools';

export interface WidgetDef {
    /** Stable identifier used in localStorage and renderWidget mapping */
    id: string;
    /** Human-readable name shown in the catalog drawer */
    label: string;
    /** One-sentence description shown in the catalog drawer */
    description: string;
    /** Lucide icon component name (for catalog rendering) */
    iconName: string;
    /** Default colSpan placed when widget is added from catalog */
    defaultColSpan: number;
    /** Default rowSpan placed when widget is added from catalog */
    defaultRowSpan: number;
    /** Minimum colSpan (resize lower bound) */
    minColSpan: number;
    /** Maximum colSpan (resize upper bound) */
    maxColSpan: number;
    /** Minimum rowSpan (resize lower bound) */
    minRowSpan: number;
    /** Maximum rowSpan (resize upper bound) */
    maxRowSpan: number;
    /** Catalog grouping */
    category: WidgetCategory;
    /** Shows a "Nuevo" badge in the catalog */
    isNew?: boolean;
}

export interface WidgetInstance {
    /** Unique runtime ID for this placed widget (generated on add) */
    id: string;
    /** References a WidgetDef.id */
    widgetId: string;
    /** Current column span */
    colSpan: number;
    /** Current row span */
    rowSpan: number;
}

export const WIDGET_REGISTRY: WidgetDef[] = [
    // ── Analytics ───────────────────────────────────────────────────────
    {
        id: 'kpi-strip',
        label: 'KPI Strip',
        description: 'Métricas clave del sistema: score promedio, evaluaciones, usuarios activos y servicios.',
        iconName: 'Gauge',
        defaultColSpan: 4,
        defaultRowSpan: 1,
        minColSpan: 4,
        maxColSpan: 4,
        minRowSpan: 1,
        maxRowSpan: 1,
        category: 'analytics',
    },
    {
        id: 'trend-chart',
        label: 'Tendencia de Actividad',
        description: 'Gráfica mensual de evaluaciones y puntuaciones promedio con múltiples modos de vista.',
        iconName: 'LineChart',
        defaultColSpan: 2,
        defaultRowSpan: 2,
        minColSpan: 2,
        maxColSpan: 4,
        minRowSpan: 2,
        maxRowSpan: 3,
        category: 'analytics',
    },
    {
        id: 'top-services',
        label: 'Top Servicios',
        description: 'Los servicios mejor evaluados, con barra de progreso de puntuación.',
        iconName: 'Star',
        defaultColSpan: 1,
        defaultRowSpan: 2,
        minColSpan: 1,
        maxColSpan: 2,
        minRowSpan: 2,
        maxRowSpan: 3,
        category: 'analytics',
    },
    {
        id: 'user-distribution',
        label: 'Distribución de Usuarios',
        description: 'Proporción de turistas, guías y administradores registrados en el sistema.',
        iconName: 'Users',
        defaultColSpan: 2,
        defaultRowSpan: 2,
        minColSpan: 1,
        maxColSpan: 4,
        minRowSpan: 1,
        maxRowSpan: 3,
        category: 'analytics',
    },
    {
        id: 'recent-activity',
        label: 'Actividad Reciente',
        description: 'Últimas evaluaciones realizadas en el sistema con detalle de servicios y evaluadores.',
        iconName: 'Activity',
        defaultColSpan: 2,
        defaultRowSpan: 2,
        minColSpan: 1,
        maxColSpan: 4,
        minRowSpan: 1,
        maxRowSpan: 3,
        category: 'analytics',
    },
    {
        id: 'score-distribution',
        label: 'Distribución de Puntajes',
        description: 'Histograma de rangos de calificación para todas las evaluaciones registradas.',
        iconName: 'BarChart3',
        defaultColSpan: 1,
        defaultRowSpan: 2,
        minColSpan: 1,
        maxColSpan: 2,
        minRowSpan: 2,
        maxRowSpan: 3,
        category: 'analytics',
    },
    {
        id: 'top-companies',
        label: 'Top Compañías',
        description: 'Ranking de empresas turísticas con mejor desempeño en evaluaciones.',
        iconName: 'Building2',
        defaultColSpan: 1,
        defaultRowSpan: 2,
        minColSpan: 1,
        maxColSpan: 2,
        minRowSpan: 2,
        maxRowSpan: 3,
        category: 'analytics',
    },
    {
        id: 'b2b-funnel',
        label: 'Embudo B2B',
        description: 'Conversión del pipeline empresarial: compañías → servicios → evaluaciones.',
        iconName: 'TrendingDown',
        defaultColSpan: 2,
        defaultRowSpan: 1,
        minColSpan: 2,
        maxColSpan: 4,
        minRowSpan: 1,
        maxRowSpan: 2,
        category: 'analytics',
        isNew: true,
    },
    // ── Operations ──────────────────────────────────────────────────────
    {
        id: 'operational-mix',
        label: 'Mix Operacional',
        description: 'Distribución de tipos de servicios: hoteles, restaurantes, tours y transporte.',
        iconName: 'PieChart',
        defaultColSpan: 1,
        defaultRowSpan: 2,
        minColSpan: 1,
        maxColSpan: 2,
        minRowSpan: 2,
        maxRowSpan: 3,
        category: 'operations',
    },
    {
        id: 'ml-telemetry',
        label: 'Telemetría IA',
        description: 'Estado del motor de recomendaciones: algoritmo activo, RMSE, CTR 30d y latencia.',
        iconName: 'BrainCircuit',
        defaultColSpan: 2,
        defaultRowSpan: 1,
        minColSpan: 2,
        maxColSpan: 4,
        minRowSpan: 1,
        maxRowSpan: 2,
        category: 'operations',
        isNew: true,
    },
    {
        id: 'coverage',
        label: 'Cobertura del Sistema',
        description: 'Totales de ubicaciones, servicios, empresas y puntos de interés registrados.',
        iconName: 'Map',
        defaultColSpan: 2,
        defaultRowSpan: 1,
        minColSpan: 1,
        maxColSpan: 4,
        minRowSpan: 1,
        maxRowSpan: 2,
        category: 'operations',
        isNew: true,
    },
    // ── Tools ───────────────────────────────────────────────────────────
    {
        id: 'lang-switch',
        label: 'Idioma & Tema',
        description: 'Cambia rápidamente el idioma de la interfaz y el tema visual (claro/oscuro).',
        iconName: 'Globe2',
        defaultColSpan: 1,
        defaultRowSpan: 1,
        minColSpan: 1,
        maxColSpan: 2,
        minRowSpan: 1,
        maxRowSpan: 1,
        category: 'tools',
        isNew: true,
    },
];

/** Fast lookup map: widgetId → WidgetDef */
export const WIDGET_REGISTRY_MAP: Record<string, WidgetDef> = Object.fromEntries(
    WIDGET_REGISTRY.map((w) => [w.id, w]),
);

/** Default instances placed when localStorage has no saved layout */
export const DEFAULT_WIDGET_INSTANCES: WidgetInstance[] = [
    { id: 'inst-kpi-strip',           widgetId: 'kpi-strip',          colSpan: 4, rowSpan: 1 },
    { id: 'inst-trend-chart',         widgetId: 'trend-chart',        colSpan: 2, rowSpan: 2 },
    { id: 'inst-operational-mix',     widgetId: 'operational-mix',    colSpan: 1, rowSpan: 2 },
    { id: 'inst-top-services',        widgetId: 'top-services',       colSpan: 1, rowSpan: 2 },
    { id: 'inst-user-distribution',   widgetId: 'user-distribution',  colSpan: 2, rowSpan: 2 },
    { id: 'inst-recent-activity',     widgetId: 'recent-activity',    colSpan: 2, rowSpan: 2 },
];
