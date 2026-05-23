import React, { type DragEvent, type ReactNode, useEffect, useRef, useState } from 'react';
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

type FlashState = 'min' | 'max' | null;

const FLASH_DURATION = 420; // ms — how long the red indicator stays visible

/** Resize button that flashes red when it can't go further (Figma-style) */
const ResizeBtn: React.FC<{
    label: string;
    icon: React.ElementType;
    flashActive: boolean;
    onClick: (e: React.MouseEvent) => void;
}> = ({ label, icon: Icon, flashActive, onClick }) => (
    <button
        type="button"
        title={label}
        onClick={onClick}
        onDragStart={(e) => e.stopPropagation()}
        className="flex size-5 items-center justify-center rounded-md transition-all"
        style={{
            color: flashActive ? '#fff' : 'rgba(255,255,255,0.75)',
            background: flashActive ? 'rgba(239,68,68,0.85)' : 'transparent',
            transform: flashActive ? 'scale(1.15)' : 'scale(1)',
        }}
    >
        <Icon className="size-3" strokeWidth={2.5} />
    </button>
);

/**
 * Wraps a single widget in the grid. In edit mode it shows:
 *  - Subtle iOS-style wobble animation (±0.55°)
 *  - Floating "×" remove button (top-right)
 *  - Compact resize toolbar (bottom-right) with Figma-style boundary feedback:
 *    buttons flash red when a limit is reached instead of going disabled
 *  - Semi-transparent drag overlay
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
    /* ── Wobble stagger ──────────────────────────────────────────── */
    const wobbleDelay = `${(index % 7) * 0.09}s`;

    /* ── Resize boundary flash state ────────────────────────────── */
    const [colFlash, setColFlash] = useState<FlashState>(null);
    const [rowFlash, setRowFlash] = useState<FlashState>(null);
    const colTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Cleanup timers on unmount
    useEffect(() => () => {
        if (colTimer.current) clearTimeout(colTimer.current);
        if (rowTimer.current) clearTimeout(rowTimer.current);
    }, []);

    const triggerColFlash = (side: 'min' | 'max') => {
        if (colTimer.current) clearTimeout(colTimer.current);
        setColFlash(side);
        colTimer.current = setTimeout(() => setColFlash(null), FLASH_DURATION);
    };

    const triggerRowFlash = (side: 'min' | 'max') => {
        if (rowTimer.current) clearTimeout(rowTimer.current);
        setRowFlash(side);
        rowTimer.current = setTimeout(() => setRowFlash(null), FLASH_DURATION);
    };

    /* ── Resize handlers with boundary detection ─────────────────── */
    const handleColMinus = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (instance.colSpan <= def.minColSpan) {
            triggerColFlash('min');
        } else {
            onResize(-1, 0);
        }
    };

    const handleColPlus = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (instance.colSpan >= def.maxColSpan) {
            triggerColFlash('max');
        } else {
            onResize(1, 0);
        }
    };

    const handleRowMinus = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (instance.rowSpan <= def.minRowSpan) {
            triggerRowFlash('min');
        } else {
            onResize(0, -1);
        }
    };

    const handleRowPlus = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (instance.rowSpan >= def.maxRowSpan) {
            triggerRowFlash('max');
        } else {
            onResize(0, 1);
        }
    };

    const isResizable = def.minColSpan !== def.maxColSpan || def.minRowSpan !== def.maxRowSpan;

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

            {/* ── Edit-mode overlay ──────────────────────────────── */}
            {isEditing && (
                <>
                    {/* Drag capture + drop highlight */}
                    <div
                        aria-hidden
                        className={`absolute inset-0 z-[5] cursor-grab rounded-[28px] transition-all duration-150${
                            isDragOver
                                ? ' ring-2 ring-violet-500 ring-offset-0 bg-violet-500/10'
                                : ''
                        }`}
                        style={{ pointerEvents: 'auto' }}
                    />

                    {/* × Remove button */}
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

                    {/* Widget name label */}
                    <div
                        aria-hidden
                        onDragStart={(e) => e.stopPropagation()}
                        className="absolute left-2.5 top-2.5 z-[15] flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-md"
                        style={{ background: 'rgba(10,10,10,0.65)' }}
                    >
                        <span className="mr-0.5 opacity-60">⠿</span>
                        {def.label}
                    </div>

                    {/* Resize toolbar */}
                    {isResizable && (
                        <div
                            onDragStart={(e) => e.stopPropagation()}
                            className="absolute bottom-2.5 right-2.5 z-[15] flex items-center gap-0.5 rounded-xl px-1.5 py-1 backdrop-blur-md"
                            style={{ background: 'rgba(10,10,10,0.70)' }}
                        >
                            {/* Column resize */}
                            {(def.minColSpan !== def.maxColSpan) && (
                                <>
                                    <ResizeBtn
                                        label="Reducir ancho"
                                        icon={Minus}
                                        flashActive={colFlash === 'min'}
                                        onClick={handleColMinus}
                                    />
                                    <span className="px-0.5 text-[9px] font-bold text-white/40">W</span>
                                    <ResizeBtn
                                        label="Ampliar ancho"
                                        icon={Plus}
                                        flashActive={colFlash === 'max'}
                                        onClick={handleColPlus}
                                    />
                                </>
                            )}

                            {/* Separator */}
                            {(def.minColSpan !== def.maxColSpan) && (def.minRowSpan !== def.maxRowSpan) && (
                                <span className="mx-0.5 h-3 w-px bg-white/20" />
                            )}

                            {/* Row resize */}
                            {(def.minRowSpan !== def.maxRowSpan) && (
                                <>
                                    <ResizeBtn
                                        label="Reducir alto"
                                        icon={Minus}
                                        flashActive={rowFlash === 'min'}
                                        onClick={handleRowMinus}
                                    />
                                    <span className="px-0.5 text-[9px] font-bold text-white/40">H</span>
                                    <ResizeBtn
                                        label="Ampliar alto"
                                        icon={Plus}
                                        flashActive={rowFlash === 'max'}
                                        onClick={handleRowPlus}
                                    />
                                </>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
