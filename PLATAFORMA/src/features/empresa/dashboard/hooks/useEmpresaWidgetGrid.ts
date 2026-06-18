import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '../../../../shared/context/ToastContext';
import {
    DEFAULT_EMPRESA_WIDGET_INSTANCES,
    EMPRESA_WIDGET_REGISTRY_MAP,
    type WidgetInstance,
} from '../widgets/empresaWidgetRegistry';

const GRID_STORAGE_KEY = 'welltur-empresa-widget-grid-v1';
const MAX_WIDGETS = 12;

function readGrid(): WidgetInstance[] {
    try {
        const raw = localStorage.getItem(GRID_STORAGE_KEY);
        if (!raw) return DEFAULT_EMPRESA_WIDGET_INSTANCES;
        const parsed = JSON.parse(raw) as WidgetInstance[];
        if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_EMPRESA_WIDGET_INSTANCES;
        const valid = parsed.filter(
            (inst) =>
                inst &&
                typeof inst.id === 'string' &&
                typeof inst.widgetId === 'string' &&
                EMPRESA_WIDGET_REGISTRY_MAP[inst.widgetId] !== undefined,
        );
        return valid.length > 0 ? valid : DEFAULT_EMPRESA_WIDGET_INSTANCES;
    } catch {
        return DEFAULT_EMPRESA_WIDGET_INSTANCES;
    }
}

export function useEmpresaWidgetGrid() {
    const [instances, setInstances] = useState<WidgetInstance[]>(readGrid);
    const [isEditing, setIsEditing] = useState(false);
    const [catalogOpen, setCatalogOpen] = useState(false);
    const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

    const toastRef = useRef({ toastSuccess, toastError, toastWarning });
    useEffect(() => {
        toastRef.current = { toastSuccess, toastError, toastWarning };
    });

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
        const def = EMPRESA_WIDGET_REGISTRY_MAP[widgetId];
        if (!def) return;

        setInstances((prev) => {
            if (prev.some((i) => i.widgetId === widgetId)) {
                toastRef.current.toastWarning(
                    'Widget ya presente',
                    `"${def.label}" ya esta en el dashboard.`,
                );
                return prev;
            }
            if (prev.length >= MAX_WIDGETS) {
                toastRef.current.toastError(
                    'Dashboard lleno',
                    `Se alcanzo el limite de ${MAX_WIDGETS} widgets.`,
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
                'Widget anadido',
                `"${def.label}" se agrego al dashboard.`,
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
                const def = EMPRESA_WIDGET_REGISTRY_MAP[inst.widgetId];
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
            if (!next) setCatalogOpen(false);
            return next;
        });
    }, []);

    const openCatalog = useCallback(() => setCatalogOpen(true), []);
    const closeCatalog = useCallback(() => setCatalogOpen(false), []);

    const resetGrid = useCallback(() => {
        setInstances(DEFAULT_EMPRESA_WIDGET_INSTANCES);
        setIsEditing(false);
        setCatalogOpen(false);
        toastRef.current.toastSuccess('Grid restaurado', 'El dashboard volvio a su disposicion por defecto.');
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
