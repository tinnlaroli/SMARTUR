import { Trash2, Pencil, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SelectionBarProps {
    count: number;
    onDelete: () => void;
    onEdit?: () => void;
    onClear: () => void;
    deleteLabel?: string;
    editLabel?: string;
}

export function SelectionBar({
    count,
    onDelete,
    onEdit,
    onClear,
    deleteLabel = 'Eliminar',
    editLabel = 'Editar',
}: SelectionBarProps) {
    return (
        <AnimatePresence>
            {count > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="flex shrink-0 items-center gap-3"
                >
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        {count} seleccionado{count !== 1 ? 's' : ''}
                    </span>

                    <div className="ml-auto flex items-center gap-2">
                        {count === 1 && onEdit && (
                            <button
                                type="button"
                                onClick={onEdit}
                                className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80 active:scale-95"
                                style={{
                                    borderColor: 'var(--color-purple)',
                                    color: 'var(--color-purple)',
                                    background: 'rgba(var(--rgb-purple-accent), 0.08)',
                                }}
                            >
                                <Pencil className="size-3.5" />
                                {editLabel}
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onDelete}
                            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-500 active:scale-95"
                        >
                            <Trash2 className="size-3.5" />
                            {deleteLabel}
                        </button>

                        <button
                            type="button"
                            onClick={onClear}
                            className="rounded-lg p-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            style={{ color: 'var(--color-text-alt)' }}
                            title="Limpiar selección"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
