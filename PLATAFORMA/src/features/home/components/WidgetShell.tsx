import React, { type DragEvent, type ReactNode, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { DASHBOARD_COLORS } from '../utils/dashboard';
import { type WidgetDef, type WidgetInstance } from '../widgets/widgetRegistry';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

/* ── Resize drag state ───────────────────────────────────────────────── */
interface ResizeDragData {
    /** Which axis(es) are being resized */
    axis: 'col' | 'row' | 'both';
    startX: number;
    startY: number;
    startColSpan: number;
    startRowSpan: number;
    /** Approximate pixel width of one grid column at drag start */
    cellW: number;
    /** Approximate pixel height of one grid row at drag start */
    cellH: number;
}

/* ── Resize handle component ─────────────────────────────────────────── */
interface ResizeHandleProps {
    axis: 'col' | 'row' | 'both';
    isActive: boolean;
    hintCol: string;
    hintRow: string;
    hintBoth: string;
    onPointerDown: (axis: 'col' | 'row' | 'both', e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({
    axis,
    isActive,
    hintCol,
    hintRow,
    hintBoth,
    onPointerDown,
    onPointerMove,
    onPointerUp,
}) => {
    const purple = DASHBOARD_COLORS.purple;

    const commonProps = {
        onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => onPointerDown(axis, e),
        onPointerMove,
        onPointerUp,
        onPointerCancel: onPointerUp,
        // Prevent the HTML5 drag from firing when the user grabs a resize handle
        draggable: false,
        onDragStart: (e: React.DragEvent) => e.preventDefault(),
    };

    if (axis === 'col') {
        return (
            <div
                {...commonProps}
                title={hintCol}
                className="absolute right-0 top-8 bottom-8 z-[10] w-2.5 cursor-ew-resize rounded-r-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{
                    background: isActive ? purple : `${purple}55`,
                    boxShadow: isActive ? `0 0 0 2px ${purple}40` : 'none',
                }}
            />
        );
    }

    if (axis === 'row') {
        return (
            <div
                {...commonProps}
                title={hintRow}
                className="absolute bottom-0 left-8 right-8 z-[10] h-2.5 cursor-ns-resize rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{
                    background: isActive ? purple : `${purple}55`,
                    boxShadow: isActive ? `0 0 0 2px ${purple}40` : 'none',
                }}
            />
        );
    }

    // Corner — 'both'
    return (
        <div
            {...commonProps}
            title={hintBoth}
            className="absolute bottom-0 right-0 z-[15] size-9 cursor-nwse-resize rounded-br-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-end justify-end p-2"
            style={{
                background: isActive ? `${purple}70` : `${purple}35`,
            }}
        >
            {/* 2 × 2 dot grid — corner indicator */}
            <div className="grid grid-cols-2 gap-[3px]">
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="size-[3px] rounded-full"
                        style={{ background: isActive ? '#fff' : `${purple}dd` }}
                    />
                ))}
            </div>
        </div>
    );
};

/* ── Main shell ──────────────────────────────────────────────────────── */
interface WidgetShellProps {
    instance: WidgetInstance;
    def: WidgetDef;
    index: number;
    isEditing: boolean;
    onRemove: () => void;
    onResize: (colDelta: number, rowDelta: number) => void;
    onDragStart: () => void;
    onDragOver: (e: DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
    onDrop: (e: DragEvent<HTMLDivElement>) => void;
    isDragOver: boolean;
    children: ReactNode;
}

/**
 * Wraps a single widget in the grid.
 *
 * Edit mode provides:
 *  - Very subtle wobble animation (±0.3°)
 *  - "×" remove button (top-right)
 *  - Edge / corner drag handles for resizing:
 *      · Right edge  → column span (cursor: ew-resize)
 *      · Bottom edge → row span    (cursor: ns-resize)
 *      · Bottom-right corner → both (cursor: nwse-resize)
 *  - Handles appear on hover; turn solid while actively dragging
 *  - Semi-transparent overlay that captures drag-to-reorder events
 */
export const WidgetShell: React.FC<WidgetShellProps> = ({
    instance,
    def,
    index,
    isEditing,
    onRemove,
    onResize,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    isDragOver,
    children,
}) => {
    const { lang } = useLanguage();
    const copy = getDashboardText(lang).widgets;
    const shellRef = useRef<HTMLDivElement>(null);
    const dragDataRef = useRef<ResizeDragData | null>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [activeAxis, setActiveAxis] = useState<'col' | 'row' | 'both' | null>(null);

    /* Stagger wobble between widgets */
    const wobbleDelay = `${(index % 7) * 0.09}s`;

    /* Which resize handles to show */
    const canResizeCol  = def.minColSpan !== def.maxColSpan;
    const canResizeRow  = def.minRowSpan !== def.maxRowSpan;

    /* ── Pointer resize handlers ──────────────────────────────────── */
    const handleResizePointerDown = (
        axis: 'col' | 'row' | 'both',
        e: React.PointerEvent<HTMLDivElement>,
    ) => {
        e.stopPropagation();
        e.preventDefault();
        if (!shellRef.current) return;

        const rect = shellRef.current.getBoundingClientRect();
        // Approx per-cell dimensions at drag start
        const cellW = rect.width  / instance.colSpan;
        const cellH = rect.height / instance.rowSpan;

        dragDataRef.current = {
            axis,
            startX: e.clientX,
            startY: e.clientY,
            startColSpan: instance.colSpan,
            startRowSpan: instance.rowSpan,
            cellW,
            cellH,
        };

        e.currentTarget.setPointerCapture(e.pointerId);
        setIsResizing(true);
        setActiveAxis(axis);
    };

    const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const d = dragDataRef.current;
        if (!d) return;
        e.stopPropagation();

        let targetCol = instance.colSpan;
        let targetRow = instance.rowSpan;

        if (d.axis === 'col' || d.axis === 'both') {
            const dx    = e.clientX - d.startX;
            const steps = Math.round(dx / d.cellW);
            targetCol   = Math.max(def.minColSpan, Math.min(def.maxColSpan, d.startColSpan + steps));
        }

        if (d.axis === 'row' || d.axis === 'both') {
            const dy    = e.clientY - d.startY;
            const steps = Math.round(dy / d.cellH);
            targetRow   = Math.max(def.minRowSpan, Math.min(def.maxRowSpan, d.startRowSpan + steps));
        }

        const dc = targetCol - instance.colSpan;
        const dr = targetRow - instance.rowSpan;
        if (dc !== 0 || dr !== 0) onResize(dc, dr);
    };

    const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        e.stopPropagation();
        dragDataRef.current = null;
        setIsResizing(false);
        setActiveAxis(null);
    };

    const resizeHandleProps = {
        onPointerDown: handleResizePointerDown,
        onPointerMove: handleResizePointerMove,
        onPointerUp:   handleResizePointerUp,
    };

    return (
        <div
            ref={shellRef}
            className={[
                'group relative h-full select-none',
                // Wobble only when editing and NOT actively resizing (stops jitter during resize)
                isEditing && !isResizing ? 'widget-wobble' : '',
                // Drop-target highlight when dragging another widget over this one
                isDragOver ? 'ring-2 ring-violet-500 ring-offset-0 rounded-[28px]' : '',
                // Active resize ring
                isResizing ? 'ring-2 ring-violet-400 ring-offset-0 rounded-[28px]' : '',
            ].filter(Boolean).join(' ')}
            style={isEditing && !isResizing ? { animationDelay: wobbleDelay } : undefined}
            /* HTML5 drag-to-reorder — disabled while a resize drag is in progress */
            draggable={isEditing && !isResizing}
            onDragStart={(e) => {
                if (isResizing) { e.preventDefault(); return; }
                e.stopPropagation();
                onDragStart();
            }}
            onDragOver={(e) => { e.preventDefault(); onDragOver(e); }}
            onDragLeave={onDragLeave}
            onDrop={(e) => { e.preventDefault(); onDrop(e); }}
        >
            {/* Widget content */}
            <div className="h-full">{children}</div>

            {/* ── Edit-mode overlay ──────────────────────────────── */}
            {isEditing && (
                <>
                    {/* Semi-transparent drag-grab area (covers the content) */}
                    <div
                        aria-hidden
                        className="absolute inset-0 z-[5] cursor-grab rounded-[28px]"
                        style={{
                            pointerEvents: isResizing ? 'none' : 'auto',
                            background: isDragOver ? 'rgba(139,92,246,0.08)' : 'transparent',
                        }}
                    />

                    {/* × Remove button — always on top */}
                    <button
                        type="button"
                        aria-label={copy.shellRemoveLabel(def.label)}
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        className="absolute right-2.5 top-2.5 z-[25] flex size-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg transition hover:bg-rose-600 active:scale-90"
                    >
                        <X className="size-3.5" strokeWidth={2.5} />
                    </button>

                    {/* Widget name / drag hint label — top-left */}
                    <div
                        aria-hidden
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        className="absolute left-2.5 top-2.5 z-[25] flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-md"
                        style={{ background: 'rgba(10,10,10,0.60)' }}
                    >
                        <span className="mr-0.5 opacity-55">⠿</span>
                        {copy.widgetLabels[def.id] ?? def.label}
                    </div>

                    {/* ── Resize handles ─────────────────────────── */}
                    {canResizeCol && (
                        <ResizeHandle
                            axis="col"
                            isActive={activeAxis === 'col' || activeAxis === 'both'}
                            hintCol={copy.shellDragHintCol}
                            hintRow={copy.shellDragHintRow}
                            hintBoth={copy.shellDragHintBoth}
                            {...resizeHandleProps}
                        />
                    )}
                    {canResizeRow && (
                        <ResizeHandle
                            axis="row"
                            isActive={activeAxis === 'row' || activeAxis === 'both'}
                            hintCol={copy.shellDragHintCol}
                            hintRow={copy.shellDragHintRow}
                            hintBoth={copy.shellDragHintBoth}
                            {...resizeHandleProps}
                        />
                    )}
                    {canResizeCol && canResizeRow && (
                        <ResizeHandle
                            axis="both"
                            isActive={activeAxis === 'both'}
                            hintCol={copy.shellDragHintCol}
                            hintRow={copy.shellDragHintRow}
                            hintBoth={copy.shellDragHintBoth}
                            {...resizeHandleProps}
                        />
                    )}
                </>
            )}
        </div>
    );
};
