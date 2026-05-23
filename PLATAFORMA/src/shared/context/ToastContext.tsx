import React, { createContext, use, useState, useCallback, useRef, useMemo, type ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

// --- Tipos ---
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: NotificationType;
    title: string;
    description?: string;
}

export interface ToastNotification extends Toast {
    createdAt: number;
    read: boolean;
}

interface ToastContextValue {
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
    warning: (title: string, description?: string) => void;
    notifications: ToastNotification[];
    unreadCount: number;
    markAllAsRead: () => void;
    clearNotifications: () => void;
}

// Accent color per type (left border + icon)
const TOAST_ACCENTS: Record<NotificationType, { color: string; icon: typeof CheckCircle }> = {
    success: { color: '#22c55e', icon: CheckCircle },
    error:   { color: '#ef4444', icon: XCircle },
    info:    { color: '#3b82f6', icon: Info },
    warning: { color: '#f59e0b', icon: AlertCircle },
};

// --- Componente Notification (Interno para el Contexto) ---
const NotificationItem: React.FC<{ toast: Toast; onClose: (id: string) => void }> = ({ toast, onClose }) => {
    const { color, icon: Icon } = TOAST_ACCENTS[toast.type];

    return (
        <div
            className="flex w-full items-start gap-3 rounded-2xl p-4 pointer-events-auto transition-all duration-300 ease-in-out hover:-translate-y-0.5 animate-in slide-in-from-top-2 fade-in"
            role="alert"
            style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderLeft: `4px solid ${color}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
            }}
        >
            {/* Icono */}
            <div className="flex-shrink-0 pt-0.5">
                <Icon className="size-5" style={{ color }} aria-hidden="true" strokeWidth={1.75} />
            </div>

            {/* Contenido */}
            <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    {toast.title}
                </h3>
                {toast.description && (
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                        {toast.description}
                    </p>
                )}
            </div>

            {/* Botón cerrar */}
            <button
                onClick={() => onClose(toast.id)}
                className="flex-shrink-0 rounded-lg p-1 transition-colors hover:opacity-70 focus:outline-none"
                style={{ color: 'var(--color-text-alt)' }}
                aria-label="Cerrar notificación"
            >
                <X className="size-4" aria-hidden="true" />
            </button>
        </div>
    );
};

// --- Contexto ---
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [notifications, setNotifications] = useState<ToastNotification[]>([]);
    const timeoutRefs = useRef<Map<string, number>>(new Map());

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        const tid = timeoutRefs.current.get(id);
        if (tid) window.clearTimeout(tid);
        timeoutRefs.current.delete(id);
    }, []);

    const addToast = useCallback(
        (type: NotificationType, title: string, description?: string) => {
            setToasts((prev) => {
                // Skip if an identical toast is already showing
                if (prev.some((t) => t.type === type && t.title === title)) return prev;
                const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                const tid = window.setTimeout(() => removeToast(id), 5000);
                timeoutRefs.current.set(id, tid);
                setNotifications((notifs) =>
                    [{ id, type, title, description, createdAt: Date.now(), read: false }, ...notifs].slice(0, 25),
                );
                return [...prev, { id, type, title, description }];
            });
        },
        [removeToast],
    );

    const markAllAsRead = useCallback(() => {
        setNotifications((prev) => prev.map((item) => (
            item.read ? item : { ...item, read: true }
        )));
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const unreadCount = useMemo(
        () => notifications.reduce((total, item) => total + (item.read ? 0 : 1), 0),
        [notifications],
    );

    const value: ToastContextValue = {
        success: (title, description) => addToast('success', title, description),
        error: (title, description) => addToast('error', title, description),
        info: (title, description) => addToast('info', title, description),
        warning: (title, description) => addToast('warning', title, description),
        notifications,
        unreadCount,
        markAllAsRead,
        clearNotifications,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="pointer-events-none fixed top-6 right-6 z-[10000] flex w-[380px] max-w-[calc(100%-2rem)] flex-col gap-3" aria-live="polite">
                {toasts.map((toast) => (
                    <NotificationItem key={toast.id} toast={toast} onClose={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = use(ToastContext);
    if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
    return ctx;
}
