import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    Menu, Bell, LogOut, ChevronRight, Sun, Moon, CheckCircle, XCircle, AlertCircle, Info, Trash2,
} from 'lucide-react';
import { useUserPreferences } from '../../../contexts/LanguageContext';
import { useTheme } from '../../../contexts/ThemeContext';
import EmpresaSidebar from '../components/EmpresaSidebar';
import { useAuthModal } from '../../auth/context/AuthModalContext';
import { motion, AnimatePresence } from 'framer-motion';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useToast, type NotificationType, type ToastNotification } from '../../../shared/context/ToastContext';

const NOTIFICATION_ICON_MAP: Record<NotificationType, typeof CheckCircle> = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
};

const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const formatNotificationTime = (notification: ToastNotification, locale: string, justNowLabel: string) => {
    const elapsedMs = Date.now() - notification.createdAt;
    if (elapsedMs < 60_000) return justNowLabel;

    return new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
    }).format(notification.createdAt);
};

const NotificationPanel = ({
    clearLabel,
    emptyHint,
    emptyTitle,
    justNowLabel,
    locale,
    notifications,
    recentLabel,
    title,
    onClear,
}: {
    clearLabel: string;
    emptyHint: string;
    emptyTitle: string;
    justNowLabel: string;
    locale: string;
    notifications: ToastNotification[];
    recentLabel: string;
    title: string;
    onClear: () => void;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        className="fixed right-6 top-16 z-[200] w-80 rounded-2xl border p-4 shadow-2xl"
        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
    >
        <div className="mb-3 flex items-center justify-between gap-3">
            <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-alt)' }}>
                    {title}
                </p>
                {notifications.length > 0 && (
                    <p className="mt-1 text-[11px]" style={{ color: 'var(--color-text-alt)' }}>
                        {recentLabel}
                    </p>
                )}
            </div>
            {notifications.length > 0 && (
                <button
                    type="button"
                    onClick={onClear}
                    className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    style={{ color: 'var(--color-text-alt)' }}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                    {clearLabel}
                </button>
            )}
        </div>

        {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
                <Bell className="size-8 opacity-30" style={{ color: 'var(--color-text)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-alt)' }}>{emptyTitle}</p>
                <p className="max-w-[16rem] text-xs" style={{ color: 'var(--color-text-alt)' }}>{emptyHint}</p>
            </div>
        ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                {notifications.map((notification) => {
                    const Icon = NOTIFICATION_ICON_MAP[notification.type];

                    return (
                        <div
                            key={notification.id}
                            className={`rounded-2xl border p-3 ${notification.read ? 'opacity-75' : ''}`}
                            style={{
                                background: notification.read ? 'var(--color-bg-alt)' : 'rgba(var(--rgb-purple-accent), 0.08)',
                                borderColor: 'var(--color-border)',
                            }}
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl"
                                    style={{ background: 'rgba(var(--rgb-text), 0.06)' }}>
                                    <Icon className="size-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                            {notification.title}
                                        </p>
                                        {!notification.read && (
                                            <span className="mt-1 size-2 shrink-0 rounded-full bg-rose-500" />
                                        )}
                                    </div>
                                    {notification.description && (
                                        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                                            {notification.description}
                                        </p>
                                    )}
                                    <p className="mt-2 text-[11px]" style={{ color: 'var(--color-text-alt)' }}>
                                        {formatNotificationTime(notification, locale, justNowLabel)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </motion.div>
);

export function EmpresaLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const notifWrapperRef = useRef<HTMLDivElement>(null);
    const { pathname } = useLocation();
    const { user, clearUser } = useUserPreferences();
    const navigate = useNavigate();
    const { openModal } = useAuthModal();
    const { theme, toggleTheme } = useTheme();
    const { lang, t } = useLanguage();
    const copy = getDashboardText(lang);
    const { notifications, unreadCount, markAllAsRead, clearNotifications } = useToast();

    useEffect(() => {
        if (!notifOpen) return;
        const handleOutside = (e: MouseEvent) => {
            if (notifWrapperRef.current && !notifWrapperRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, [notifOpen]);

    const handleToggleNotifications = () => {
        setNotifOpen((current) => {
            const next = !current;
            if (next) markAllAsRead();
            return next;
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        clearUser();
        openModal('login');
        navigate('/');
    };

    const currentLabel = pathname.startsWith('/empresa/servicios')
        ? t('empresa.layout.misServicios')
        : pathname.startsWith('/empresa/analytics')
          ? t('empresa.layout.analytics')
          : pathname.startsWith('/empresa/configuracion')
            ? t('empresa.layout.configuracion')
          : pathname.startsWith('/empresa/perfil')
            ? t('empresa.layout.perfil')
            : t('empresa.layout.inicio');

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>
            <EmpresaSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <header
                    className="sticky top-0 z-[100] hidden h-16 items-center justify-between border-b px-6 backdrop-blur-md md:flex"
                    style={{
                        borderColor: 'var(--color-border)',
                        background: 'rgba(var(--rgb-bg), 0.75)',
                    }}
                >
                    <nav className="flex items-center gap-1 text-sm min-w-0">
                        <span style={{ color: 'var(--color-text-alt)' }}>{t('empresa.layout.portalEmpresa')}</span>
                        <ChevronRight className="size-3.5" style={{ color: 'var(--color-text-alt)' }} />
                        <span className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                            {currentLabel}
                        </span>
                    </nav>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="rounded-xl p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            title={theme === 'dark' ? copy.layout.clearToLight : copy.layout.clearToDark}
                        >
                            {theme === 'dark'
                                ? <Sun className="size-[18px] text-amber-400" />
                                : <Moon className="size-[18px] text-violet-400" />}
                        </button>

                        <div className="relative" ref={notifWrapperRef}>
                            <button
                                onClick={handleToggleNotifications}
                                className="relative rounded-xl p-2 transition-colors nav-item-idle hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                title={copy.layout.notificationTitle}
                            >
                                <Bell className="size-[18px]" style={{ color: 'var(--color-purple)' }} />
                                {unreadCount > 0 && (
                                    <motion.span
                                        animate={{ scale: [1, 1.3, 1] }}
                                        transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.4 }}
                                        className="absolute right-1.5 top-1.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white"
                                    >
                                        {Math.min(unreadCount, 9)}
                                    </motion.span>
                                )}
                            </button>

                            <AnimatePresence>
                                {notifOpen && (
                                    <NotificationPanel
                                        clearLabel={copy.layout.clearAll}
                                        emptyHint={copy.layout.notificationEmptyHint}
                                        emptyTitle={copy.layout.notificationEmpty}
                                        justNowLabel={copy.layout.justNow}
                                        locale={copy.locale}
                                        notifications={notifications}
                                        recentLabel={copy.layout.recentLabel}
                                        title={copy.layout.notificationTitle}
                                        onClear={clearNotifications}
                                    />
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="mx-1 h-6 w-px" style={{ background: 'var(--color-border)' }} />

                        <div
                            className="flex items-center gap-2.5 rounded-xl border px-3 py-1.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                            style={{ borderColor: 'var(--color-border)' }}
                        >
                            <div
                                className="flex size-7 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm"
                                style={{ background: 'var(--color-purple)' }}
                            >
                                {user ? getInitials(user.name) : 'U'}
                            </div>
                            <div className="leading-tight">
                                <p className="text-sm font-semibold leading-none" style={{ color: 'var(--color-text)' }}>
                                    {user?.name || t('empresa.layout.fallbackEmpresa')}
                                </p>
                                <p className="mt-0.5 text-[10px]" style={{ color: 'var(--color-text-alt)' }}>
                                    {t('empresa.layout.roleEmpresa')}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            title={t('empresa.layout.logout')}
                            className="rounded-xl p-2 text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20"
                        >
                            <LogOut className="size-4" style={{ color: 'var(--color-pink)' }} />
                        </button>
                    </div>
                </header>

                <div
                    className="sticky top-0 z-30 flex h-14 items-center border-b px-4 backdrop-blur-sm md:hidden"
                    style={{
                        borderColor: 'var(--color-border)',
                        background: 'rgba(var(--rgb-bg), 0.85)',
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="-ml-1 rounded-xl p-2 nav-item-idle"
                        aria-label={t('empresa.layout.openMenu')}
                    >
                        <Menu className="size-5" />
                    </button>

                    <span className="ml-3 text-base font-bold" style={{ color: 'var(--color-purple)' }}>
                        {t('empresa.layout.mobileTitle')}
                    </span>

                    <div className="ml-auto flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleToggleNotifications}
                            className="relative rounded-xl p-2 transition-colors nav-item-idle"
                            aria-label={copy.layout.notificationTitle}
                        >
                            <Bell className="size-[18px]" />
                            {unreadCount > 0 && (
                                <span className="absolute right-1.5 top-1.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                                    {Math.min(unreadCount, 9)}
                                </span>
                            )}
                        </button>
                        <div
                            className="flex size-8 items-center justify-center rounded-lg text-xs font-bold text-white shadow"
                            style={{ background: 'var(--color-purple)' }}
                        >
                            {user ? getInitials(user.name) : 'U'}
                        </div>
                    </div>
                </div>

                <main
                    className="flex min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
                    style={{ background: 'var(--color-bg-alt)' }}
                >
                    <div className="mx-auto h-full w-full max-w-400">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
