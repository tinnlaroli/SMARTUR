import React, { type DragEvent, type ReactNode } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { type WidgetDef, type WidgetInstance } from '../widgets/widgetRegistry';

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

/** Wraps a single widget in the grid. In edit mode it shows:
 *  - iOS-style wobble animation
 *  - Floating "×" remove button (top-right)
 *  - Compact resize toolbar (bottom-right)
 *  - Semi-transparent drag overlay with label
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
    // Stagger wobble so adjacent widgets don't move in perfect sync
    const wobbleDelay = `${(index % 7) * 0.07}s`;

    const canShrinkCol = instance.colSpan > def.minColSpan;
    const canGrowCol   = instance.colSpan < def.maxColSpan;
    const canShrinkRow = instance.rowSpan > def.minRowSpan;
    const canGrowRow   = instance.rowSpan < def.maxRowSpan;
    const canResize = canShrinkCol || canGrowCol || canShrinkRow || canGrowRow;

    return (
        <div
            className={`relative h-full select-none${isEditing ? ' widget-wobble' : ''}`}
            style={isEditing ? { animationDelay: wobbleDelay } : undefined}
            draggable={isEditing}
            onDragStart={(e) => {
                e.stopPropagation();
                onDragStart();
            }}
            onDragOver={(e) => {
                e.preventDefault();
                onDragOver(e);
            }}
            onDragLeave={onDragLeave}
            onDrop={(e) => {
                e.preventDefault();
                onDrop(e);
            }}
        >
            {/* Widget content — always rendered */}
            <div className="h-full">
                {children}
            </div>

            {/* ── Edit-mode overlay ─────────────────────────────────── */}
            {isEditing && (
                <>
                    {/* Drag capture + drop highlight overlay */}
                    <div
                        aria-hidden
                        className={`absolute inset-0 z-[5] cursor-grab rounded-[28px] transition-all duration-150${
                            isDragOver
                                ? ' ring-2 ring-violet-500 ring-offset-0 bg-violet-500/10'
                                : ''
                        }`}
                        style={{ pointerEvents: 'auto' }}
                    />

                    {/* × Remove button — top-right */}
                    <button
                        type="button"
                        aria-label={`Eliminar widget ${def.label}`}
                        onDragStart={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="absolute right-2.5 top-2.5 z-[15] flex size-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg transition hover:bg-rose-600 active:scale-90"
                    >
                        <X className="size-3.5" strokeWidth={2.5} />
                    </button>

                    {/* Widget name label — top-left */}
                    <div
                        aria-hidden
                        onDragStart={(e) => e.stopPropagation()}
                        className="absolute left-2.5 top-2.5 z-[15] flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-md"
                        style={{ background: 'rgba(10,10,10,0.65)' }}
                    >
                        <span className="mr-0.5 opacity-60">⠿</span>
                        {def.label}
                    </div>

                    {/* Resize toolbar — bottom-right */}
                    {canResize && (
                        <div
                            onDragStart={(e) => e.stopPropagation()}
                            className="absolute bottom-2.5 right-2.5 z-[15] flex items-center gap-0.5 rounded-xl px-1.5 py-1 backdrop-blur-md"
                            style={{ background: 'rgba(10,10,10,0.65)' }}
                        >
                            {/* Column resize */}
                            {(canShrinkCol || canGrowCol) && (
                                <>
                                    <button
                                        type="button"
                                        disabled={!canShrinkCol}
                                        title="Reducir ancho"
                                        onClick={(e) => { e.stopPropagation(); onResize(-1, 0); }}
                                        onDragStart={(e) => e.stopPropagation()}
                                        className="flex size-5 items-center justify-center rounded-md text-white/80 transition hover:bg-white/15 disabled:opacity-25"
                                    >
                                        <Minus className="size-3" strokeWidth={2.5} />
                                    </button>
                                    <span className="px-0.5 text-[9px] font-bold text-white/50">W</span>
                                    <button
                                        type="button"
                                        disabled={!canGrowCol}
                                        title="Ampliar ancho"
                                        onClick={(e) => { e.stopPropagation(); onResize(1, 0); }}
                                        onDragStart={(e) => e.stopPropagation()}
                                        className="flex size-5 items-center justify-center rounded-md text-white/80 transition hover:bg-white/15 disabled:opacity-25"
                                    >
                                        <Plus className="size-3" strokeWidth={2.5} />
                                    </button>
                                </>
                            )}

                            {/* Separator between col/row controls */}
                            {(canShrinkCol || canGrowCol) && (canShrinkRow || canGrowRow) && (
                                <span className="mx-0.5 h-3 w-px bg-white/20" />
                            )}

                            {/* Row resize */}
                            {(canShrinkRow || canGrowRow) && (
                                <>
                                    <button
                                        type="button"
                                        disabled={!canShrinkRow}
                                        title="Reducir alto"
                                        onClick={(e) => { e.stopPropagation(); onResize(0, -1); }}
                                        onDragStart={(e) => e.stopPropagation()}
                                        className="flex size-5 items-center justify-center rounded-md text-white/80 transition hover:bg-white/15 disabled:opacity-25"
                                    >
                                        <Minus className="size-3" strokeWidth={2.5} />
                                    </button>
                                    <span className="px-0.5 text-[9px] font-bold text-white/50">H</span>
                                    <button
                                        type="button"
                                        disabled={!canGrowRow}
                                        title="Ampliar alto"
                                        onClick={(e) => { e.stopPropagation(); onResize(0, 1); }}
                                        onDragStart={(e) => e.stopPropagation()}
                                        className="flex size-5 items-center justify-center rounded-md text-white/80 transition hover:bg-white/15 disabled:opacity-25"
                                    >
                                        <Plus className="size-3" strokeWidth={2.5} />
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
