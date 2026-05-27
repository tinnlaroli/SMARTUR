import React, { type DragEvent, type ReactNode, useRef, useState } from 'react';
import { WIDGET_REGISTRY_MAP, type WidgetDef, type WidgetInstance } from '../widgets/widgetRegistry';
import { WidgetShell } from './WidgetShell';

interface WidgetGridProps {
    instances: WidgetInstance[];
    registryMap?: Record<string, WidgetDef>;
    isEditing: boolean;
    /** Called by the grid to render a widget by its widgetId */
    renderWidget: (widgetId: string) => ReactNode;
    onRemove: (instanceId: string) => void;
    onMove: (fromIndex: number, toIndex: number) => void;
    onResize: (instanceId: string, colDelta: number, rowDelta: number) => void;
}

/**
 * CSS-Grid–based responsive widget grid with HTML5 drag-and-drop reordering.
 *
 * Layout:
 *   - Mobile  (<sm)  : 1-col auto-height
 *   - Tablet  (sm)   : 2-col 200px rows, all widgets capped at colSpan 2
 *   - Desktop (lg)   : 4-col 200px rows, uses each widget's colSpan / rowSpan
 *
 * Drag-and-drop swaps widgets in the `instances` array (index-based),
 * which causes CSS Grid to re-order them without absolute positioning.
 */
export const WidgetGrid: React.FC<WidgetGridProps> = ({
    instances,
    registryMap = WIDGET_REGISTRY_MAP,
    isEditing,
    renderWidget,
    onRemove,
    onMove,
    onResize,
}) => {
    const dragFromIndex = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = (index: number) => () => {
        dragFromIndex.current = index;
    };

    const handleDragOver = (index: number) => (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverIndex !== index) setDragOverIndex(index);
    };

    const handleDragLeave = (index: number) => (_e: DragEvent<HTMLDivElement>) => {
        if (dragOverIndex === index) setDragOverIndex(null);
    };

    const handleDrop = (toIndex: number) => (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOverIndex(null);
        if (dragFromIndex.current === null || dragFromIndex.current === toIndex) {
            dragFromIndex.current = null;
            return;
        }
        onMove(dragFromIndex.current, toIndex);
        dragFromIndex.current = null;
    };

    const handleDragEnd = () => {
        dragFromIndex.current = null;
        setDragOverIndex(null);
    };

    return (
        <div className="widget-grid" onDragEnd={handleDragEnd}>
            {instances.map((instance, index) => {
                const def = registryMap[instance.widgetId];
                if (!def) return null;

                return (
                    <div
                        key={instance.id}
                        className="widget-cell"
                        style={{
                            gridColumn: `span ${instance.colSpan}`,
                            gridRow: `span ${instance.rowSpan}`,
                        }}
                        data-widget-col={instance.colSpan}
                        data-widget-row={instance.rowSpan}
                    >
                        <WidgetShell
                            instance={instance}
                            def={def}
                            index={index}
                            isEditing={isEditing}
                            isDragOver={dragOverIndex === index}
                            onRemove={() => onRemove(instance.id)}
                            onResize={(colDelta, rowDelta) =>
                                onResize(instance.id, colDelta, rowDelta)
                            }
                            onDragStart={handleDragStart(index)}
                            onDragOver={handleDragOver(index)}
                            onDragLeave={handleDragLeave(index)}
                            onDrop={handleDrop(index)}
                        >
                            {renderWidget(instance.widgetId)}
                        </WidgetShell>
                    </div>
                );
            })}
        </div>
    );
};
