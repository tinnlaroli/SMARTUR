import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Activity,
    BarChart3,
    BrainCircuit,
    Building2,
    Gauge,
    Globe2,
    LayoutGrid,
    LineChart,
    Map,
    PieChart,
    Plus,
    Star,
    TrendingDown,
    Users,
    X,
} from 'lucide-react';
import { DASHBOARD_COLORS } from '../utils/dashboard';
import {
    WIDGET_REGISTRY,
    type WidgetCategory,
    type WidgetDef,
} from '../widgets/widgetRegistry';

/* ── Icon lookup ─────────────────────────────────────────────────────── */
const ICON_MAP: Record<string, React.ElementType> = {
    Activity,
    BarChart3,
    BrainCircuit,
    Building2,
    Gauge,
    Globe2,
    LineChart,
    Map,
    PieChart,
    Star,
    TrendingDown,
    Users,
};

const CATEGORY_LABELS: Record<WidgetCategory, string> = {
    analytics:  'Analítica',
    operations: 'Operaciones',
    tools:      'Herramientas',
};

const CATEGORY_ORDER: WidgetCategory[] = ['analytics', 'operations', 'tools'];

/* ── Catalog item ────────────────────────────────────────────────────── */
const CatalogItem: React.FC<{
    def: WidgetDef;
    onAdd: () => void;
}> = ({ def, onAdd }) => {
    const Icon = ICON_MAP[def.iconName] ?? BarChart3;

    return (
        <div
            className="group flex items-start gap-3 rounded-2xl border p-3.5 transition-all duration-150 hover:shadow-md"
            style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-bg-alt)',
            }}
        >
            {/* Icon */}
            <div
                className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${DASHBOARD_COLORS.purple}18` }}
            >
                <Icon className="size-4" style={{ color: DASHBOARD_COLORS.purple }} />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--color-text)' }}>
                        {def.label}
                    </p>
                    {def.isNew && (
                        <span
                            className="rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-widest text-white"
                            style={{ background: DASHBOARD_COLORS.purple }}
                        >
                            Nuevo
                        </span>
                    )}
                </div>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                    {def.description}
                </p>
                <p className="mt-1.5 text-[10px] tabular-nums" style={{ color: 'var(--color-text-alt)' }}>
                    {def.defaultColSpan} col × {def.defaultRowSpan} fila
                </p>
            </div>

            {/* Add button */}
            <button
                type="button"
                onClick={onAdd}
                className="flex size-8 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition hover:opacity-90 active:scale-90"
                style={{ background: DASHBOARD_COLORS.purple }}
                aria-label={`Agregar widget ${def.label}`}
            >
                <Plus className="size-4" />
            </button>
        </div>
    );
};

/* ── Catalog drawer ──────────────────────────────────────────────────── */
interface WidgetCatalogProps {
    open: boolean;
    onClose: () => void;
    activeWidgetIds: Set<string>;
    onAdd: (widgetId: string) => void;
}

export const WidgetCatalog: React.FC<WidgetCatalogProps> = ({
    open,
    onClose,
    activeWidgetIds,
    onAdd,
}) => {
    const availableWidgets = WIDGET_REGISTRY.filter((w) => !activeWidgetIds.has(w.id));

    // Group by category (only show categories that have at least 1 available widget)
    const grouped = CATEGORY_ORDER.reduce<Record<WidgetCategory, WidgetDef[]>>(
        (acc, cat) => {
            acc[cat] = availableWidgets.filter((w) => w.category === cat);
            return acc;
        },
        { analytics: [], operations: [], tools: [] },
    );

    const handleAdd = (widgetId: string) => {
        onAdd(widgetId);
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="catalog-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                        aria-hidden
                    />

                    {/* Drawer panel */}
                    <motion.aside
                        key="catalog-panel"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                        className="fixed right-0 top-0 z-[85] flex h-full w-[22rem] flex-col border-l shadow-2xl"
                        style={{
                            background: 'var(--color-bg)',
                            borderColor: 'var(--color-border)',
                        }}
                        aria-label="Catálogo de widgets"
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between border-b px-5 py-4"
                            style={{ borderColor: 'var(--color-border)' }}
                        >
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="flex size-8 items-center justify-center rounded-xl"
                                    style={{ background: `${DASHBOARD_COLORS.purple}18` }}
                                >
                                    <LayoutGrid className="size-4" style={{ color: DASHBOARD_COLORS.purple }} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                                        Agregar Widget
                                    </p>
                                    <p className="text-[11px]" style={{ color: 'var(--color-text-alt)' }}>
                                        {availableWidgets.length} disponible{availableWidgets.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl p-2 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                aria-label="Cerrar catálogo"
                            >
                                <X className="size-4" style={{ color: 'var(--color-text-alt)' }} />
                            </button>
                        </div>

                        {/* Widget list */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
                            {availableWidgets.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 py-16 text-center">
                                    <LayoutGrid
                                        className="size-10 opacity-20"
                                        style={{ color: 'var(--color-text)' }}
                                    />
                                    <p
                                        className="text-sm font-medium"
                                        style={{ color: 'var(--color-text-alt)' }}
                                    >
                                        Todos los widgets están en el dashboard
                                    </p>
                                    <p
                                        className="max-w-[15rem] text-xs"
                                        style={{ color: 'var(--color-text-alt)' }}
                                    >
                                        Elimina alguno desde el modo de edición para poder volver a agregarlo.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {CATEGORY_ORDER.map((cat) => {
                                        const items = grouped[cat];
                                        if (items.length === 0) return null;
                                        return (
                                            <section key={cat}>
                                                <p
                                                    className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em]"
                                                    style={{ color: 'var(--color-text-alt)' }}
                                                >
                                                    {CATEGORY_LABELS[cat]}
                                                </p>
                                                <div className="space-y-2">
                                                    {items.map((def) => (
                                                        <CatalogItem
                                                            key={def.id}
                                                            def={def}
                                                            onAdd={() => handleAdd(def.id)}
                                                        />
                                                    ))}
                                                </div>
                                            </section>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
};
