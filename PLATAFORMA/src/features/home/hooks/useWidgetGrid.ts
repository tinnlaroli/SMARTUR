import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    DEFAULT_WIDGET_INSTANCES,
    WIDGET_REGISTRY_MAP,
    type WidgetInstance,
} from '../widgets/widgetRegistry';
import { useToast } from '../../../shared/context/ToastContext';

const GRID_STORAGE_KEY = 'welltur-widget-grid-v2';
const MAX_WIDGETS = 12;

function readGrid(): WidgetInstance[] {
    try {
        const raw = localStorage.getItem(GRID_STORAGE_KEY);
        if (!raw) return DEFAULT_WIDGET_INSTANCES;
        const parsed = JSON.parse(raw) as WidgetInstance[];
        if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_WIDGET_INSTANCES;
        // Filter out any instances whose widgetId no longer exists in the registry
        const valid = parsed.filter(
            (inst) =>
                inst &&
                typeof inst.id === 'string' &&
                typeof inst.widgetId === 'string' &&
                WIDGET_REGISTRY_MAP[inst.widgetId] !== undefined,
        );
        return valid.length > 0 ? valid : DEFAULT_WIDGET_INSTANCES;
    } catch {
        return DEFAULT_WIDGET_INSTANCES;
    }
}

export interface UseWidgetGridReturn {
    instances: WidgetInstance[];
    isEditing: boolean;
    catalogOpen: boolean;
    activeWidgetIds: Set<string>;
    addWidget: (widgetId: string) => void;
    removeWidget: (instanceId: string) => void;
    moveWidget: (fromIndex: number, toIndex: number) => void;
    resizeWidget: (instanceId: string, colDelta: number, rowDelta: number) => void;
    toggleEditing: () => void;
    openCatalog: () => void;
    closeCatalog: () => void;
    resetGrid: () => void;
}

export function useWidgetGrid(): UseWidgetGridReturn {
    const [instances, setInstances] = useState<WidgetInstance[]>(readGrid);
    const [isEditing, setIsEditing] = useState(false);
    const [catalogOpen, setCatalogOpen] = useState(false);
    const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

    // Keep toast refs stable to avoid dependency churn
    const toastRef = useRef({ toastSuccess, toastError, toastWarning });
    useEffect(() => {
        toastRef.current = { toastSuccess, toastError, toastWarning };
    });

    // Persist grid to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(GRID_STORAGE_KEY, JSON.stringify(instances));
        } catch {
            /* ignore quota errors */
        }
    }, [instances]);

    const activeWidgetIds = useMemo(
        () => new Set(instances.map((i) => i.widgetId)),
        [instances],
    );

    const addWidget = useCallback((widgetId: string) => {
        const def = WIDGET_REGISTRY_MAP[widgetId];
        if (!def) return;

        setInstances((prev) => {
            if (prev.some((i) => i.widgetId === widgetId)) {
                toastRef.current.toastWarning(
                    'Widget ya presente',
                    `"${def.label}" ya está en el dashboard.`,
                );
                return prev;
            }
            if (prev.length >= MAX_WIDGETS) {
                toastRef.current.toastError(
                    'Dashboard lleno',
                    `Se alcanzó el límite de ${MAX_WIDGETS} widgets.`,
                );
                return prev;
            }
            const newInstance: WidgetInstance = {
                id: `inst-${widgetId}-${Date.now()}`,
                widgetId,
                colSpan: def.defaultColSpan,
                rowSpan: def.defaultRowSpan,
            };
            toastRef.current.toastSuccess(
                'Widget añadido',
                `"${def.label}" se agregó al dashboard.`,
            );
            return [...prev, newInstance];
        });
    }, []);

    const removeWidget = useCallback((instanceId: string) => {
        setInstances((prev) => prev.filter((i) => i.id !== instanceId));
    }, []);

    const moveWidget = useCallback((fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;
        setInstances((prev) => {
            const next = [...prev];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next;
        });
    }, []);

    const resizeWidget = useCallback((instanceId: string, colDelta: number, rowDelta: number) => {
        setInstances((prev) =>
            prev.map((inst) => {
                if (inst.id !== instanceId) return inst;
                const def = WIDGET_REGISTRY_MAP[inst.widgetId];
                if (!def) return inst;
                const newColSpan = Math.min(
                    def.maxColSpan,
                    Math.max(def.minColSpan, inst.colSpan + colDelta),
                );
                const newRowSpan = Math.min(
                    def.maxRowSpan,
                    Math.max(def.minRowSpan, inst.rowSpan + rowDelta),
                );
                return { ...inst, colSpan: newColSpan, rowSpan: newRowSpan };
            }),
        );
    }, []);

    const toggleEditing = useCallback(() => {
        setIsEditing((prev) => {
            const next = !prev;
            if (!next) setCatalogOpen(false); // close catalog when exiting edit mode
            return next;
        });
    }, []);

    const openCatalog = useCallback(() => {
        setCatalogOpen(true);
    }, []);

    const closeCatalog = useCallback(() => {
        setCatalogOpen(false);
    }, []);

    const resetGrid = useCallback(() => {
        setInstances(DEFAULT_WIDGET_INSTANCES);
        setIsEditing(false);
        setCatalogOpen(false);
        toastRef.current.toastSuccess('Grid restaurado', 'El dashboard volvió a su disposición por defecto.');
    }, []);

    return {
        instances,
        isEditing,
        catalogOpen,
        activeWidgetIds,
        addWidget,
        removeWidget,
        moveWidget,
        resizeWidget,
        toggleEditing,
        openCatalog,
        closeCatalog,
        resetGrid,
    };
}
