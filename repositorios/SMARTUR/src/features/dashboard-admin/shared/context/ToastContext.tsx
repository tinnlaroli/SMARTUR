import {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { CheckCircle2, X, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    success: (message: string) => void;
    error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timeoutRefs = useRef<Map<string, number>>(new Map());

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        const tid = timeoutRefs.current.get(id);
        if (tid) window.clearTimeout(tid);
        timeoutRefs.current.delete(id);
    }, []);

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setToasts((prev) => [...prev, { id, message, type }]);
        const tid = window.setTimeout(() => removeToast(id), 4000);
        timeoutRefs.current.set(id, tid);
    }, [removeToast]);

    const value: ToastContextValue = {
        success: (message) => addToast(message, 'success'),
        error: (message) => addToast(message, 'error'),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div
                className="fixed right-4 top-4 z-100 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
                aria-live="polite"
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg ${
                            toast.type === 'success'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-neutral-950/90 dark:text-emerald-200'
                                : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-neutral-950/90 dark:text-red-200'
                        }`}
                    >
                        {toast.type === 'success' ? (
                            <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                            <XCircle className="size-5 shrink-0 text-red-600 dark:text-red-400" />
                        )}
                        <p className="flex-1 text-sm font-medium">{toast.message}</p>
                        <button
                            type="button"
                            onClick={() => removeToast(toast.id)}
                            className="shrink-0 rounded p-1 hover:opacity-70 transition-opacity"
                            aria-label="Cerrar"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
    return ctx;
}
