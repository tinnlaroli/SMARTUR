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

// --- Estilos con fondo gris muy oscuro ---
const notificationStyles = {
    success: {
        container: 'bg-zinc-950 border-l-4 border-l-green-500',
        title: 'text-white font-medium',
        description: 'text-zinc-300 text-sm',
        icon: CheckCircle,
        iconColor: 'text-green-500',
        closeButton: 'text-zinc-500 hover:text-zinc-300',
        shadow: 'shadow-xl',
    },
    error: {
        container: 'bg-neutral-950 border-l-4 border-l-red-500',
        title: 'text-white font-medium',
        description: 'text-zinc-300 text-sm',
        icon: XCircle,
        iconColor: 'text-red-500',
        closeButton: 'text-zinc-500 hover:text-zinc-300',
        shadow: 'shadow-xl',
    },
    info: {
        container: 'bg-zinc-950 border-l-4 border-l-blue-500',
        title: 'text-white font-medium',
        description: 'text-zinc-300 text-sm',
        icon: Info,
        iconColor: 'text-blue-500',
        closeButton: 'text-zinc-500 hover:text-zinc-300',
        shadow: 'shadow-xl',
    },
    warning: {
        container: 'bg-zinc-950 border-l-4 border-l-yellow-500',
        title: 'text-white font-medium',
        description: 'text-zinc-300 text-sm',
        icon: AlertCircle,
        iconColor: 'text-yellow-500',
        closeButton: 'text-zinc-500 hover:text-zinc-300',
        shadow: 'shadow-xl',
    },
};

// --- Componente Notification (Interno para el Contexto) ---
const NotificationItem: React.FC<{ toast: Toast; onClose: (id: string) => void }> = ({ toast, onClose }) => {
    const style = notificationStyles[toast.type];
    const Icon = style.icon;

    return (
        <div
            className={`flex w-full items-start gap-3 rounded-lg p-4 ${style.container} ${style.shadow} animate-in slide-in-from-top-2 fade-in pointer-events-auto transform transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-2xl`}
            role="alert"
        >
            {/* Icono */}
            <div className="flex-shrink-0 pt-0.5">
                <Icon className={`size-5 ${style.iconColor}`} aria-hidden="true" strokeWidth={1.75} />
            </div>

            {/* Contenido */}
            <div className="min-w-0 flex-1">
                <h3 className={`text-sm font-semibold ${style.title}`}>{toast.title}</h3>
                {toast.description && <p className={`mt-1 text-sm leading-relaxed ${style.description}`}>{toast.description}</p>}
            </div>

            {/* Botón cerrar */}
            <button
                onClick={() => onClose(toast.id)}
                className={`flex-shrink-0 rounded-lg p-1 transition-colors ${style.closeButton} focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:outline-none ${toast.type === 'success' ? 'focus:ring-green-500' : ''} ${toast.type === 'error' ? 'focus:ring-red-500' : ''} ${toast.type === 'info' ? 'focus:ring-blue-500' : ''} ${toast.type === 'warning' ? 'focus:ring-yellow-500' : ''} `}
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
