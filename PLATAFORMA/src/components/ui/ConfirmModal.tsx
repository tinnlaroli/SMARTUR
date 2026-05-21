import { useEffect, useCallback, useRef, useState } from 'react';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning';
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({
    open,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'danger',
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    const cancelRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', handleKey);
        cancelRef.current?.focus();
        return () => window.removeEventListener('keydown', handleKey);
    }, [open, onCancel]);

    const accentColor = variant === 'danger' ? '#e11d48' : '#d97706';
    const IconComp = variant === 'danger' ? AlertCircle : AlertTriangle;

    return (
        <AnimatePresence>
            {open && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="confirm-title"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={onCancel}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        transition={{ duration: 0.18 }}
                        className="relative z-10 w-full max-w-md rounded-2xl border p-6 shadow-2xl"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                    >
                        <button
                            type="button"
                            onClick={onCancel}
                            className="absolute right-4 top-4 rounded-lg p-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            style={{ color: 'var(--color-text-alt)' }}
                        >
                            <X className="size-4" />
                        </button>

                        <div className="flex items-start gap-4">
                            <div
                                className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                                style={{ background: `${accentColor}1a` }}
                            >
                                <IconComp className="size-5" style={{ color: accentColor }} />
                            </div>
                            <div className="min-w-0 flex-1 pr-4">
                                <h2
                                    id="confirm-title"
                                    className="text-base font-bold"
                                    style={{ color: 'var(--color-text)' }}
                                >
                                    {title}
                                </h2>
                                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                                    {message}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                ref={cancelRef}
                                type="button"
                                onClick={onCancel}
                                className="rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                            >
                                {cancelLabel}
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                className="rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:opacity-90 active:scale-95"
                                style={{ background: accentColor }}
                            >
                                {confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

interface ConfirmState {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning';
    resolve?: (value: boolean) => void;
}

export function useConfirm() {
    const [state, setState] = useState<ConfirmState>({ open: false, title: '', message: '' });

    const confirm = useCallback((opts: Omit<ConfirmState, 'open' | 'resolve'>): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({ ...opts, open: true, resolve });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        state.resolve?.(true);
        setState((s) => ({ ...s, open: false }));
    }, [state]);

    const handleCancel = useCallback(() => {
        state.resolve?.(false);
        setState((s) => ({ ...s, open: false }));
    }, [state]);

    const modal = (
        <ConfirmModal
            open={state.open}
            title={state.title}
            message={state.message}
            confirmLabel={state.confirmLabel}
            cancelLabel={state.cancelLabel}
            variant={state.variant}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
        />
    );

    return { confirm, modal };
}
