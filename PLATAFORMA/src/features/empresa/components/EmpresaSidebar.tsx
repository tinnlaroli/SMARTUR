import { NavLink, useNavigate } from 'react-router-dom';
import {
    X, Wrench, ChevronLeft, ChevronRight, Home, LogOut, UserCircle, BarChart3, Settings,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage, useUserPreferences } from '../../../contexts/LanguageContext';
import { useAuthModal } from '../../auth/context/AuthModalContext';
import { TermsModal } from '../../auth/components/TermsModal';

interface SidebarProps { isOpen: boolean; onClose: () => void; }

interface MenuItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    path: string;
    end?: boolean;
}

const MENU_GROUPS: { groupKey: string; items: string[] }[] = [
    { groupKey: 'sidebar.group.principal', items: ['home'] },
    { groupKey: 'sidebar.group.gestion', items: ['services', 'analytics', 'profile', 'settings'] },
];

const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export default function EmpresaSidebar({ isOpen, onClose }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);
    const navigate = useNavigate();
    const { openModal } = useAuthModal();
    const { t } = useLanguage();
    const { user, clearUser } = useUserPreferences();

    const allItems: MenuItem[] = [
        { id: 'home', label: 'Inicio', icon: Home, path: '/empresa/dashboard', end: true },
        { id: 'services', label: 'Mis servicios', icon: Wrench, path: '/empresa/servicios' },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/empresa/analytics' },
        { id: 'profile', label: 'Perfil', icon: UserCircle, path: '/empresa/perfil' },
        { id: 'settings', label: 'Configuración', icon: Settings, path: '/empresa/configuracion' },
    ];

    const filteredGroups = MENU_GROUPS.map((g) => ({
        groupKey: g.groupKey,
        items: g.items.map((id) => allItems.find((i) => i.id === id)).filter(Boolean) as MenuItem[],
    })).filter((g) => g.items.length > 0);

    const handleLogout = () => {
        localStorage.removeItem('token');
        clearUser();
        openModal('login');
        navigate('/');
        onClose();
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r transition-all duration-300 ease-in-out md:static md:translate-x-0 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                } ${isCollapsed ? 'w-[72px]' : 'w-64'}`}
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
            >
                <div
                    className={`relative flex h-16 shrink-0 items-center border-b transition-all duration-300 ${
                        isCollapsed ? 'justify-center px-4' : 'justify-between px-5'
                    }`}
                    style={{ borderColor: 'var(--color-border)' }}
                >
                    <AnimatePresence mode="wait">
                        {isCollapsed ? (
                            <motion.img
                                key="icon"
                                src="/image.png"
                                alt="Smartur"
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.7 }}
                                transition={{ duration: 0.2 }}
                                className="size-9 object-contain"
                            />
                        ) : (
                            <motion.div
                                key="logo"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center gap-2"
                            >
                                <img src="/smartur.png" alt="Smartur" className="h-20 w-auto object-contain" />
                                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>
                                    {t('empresa.sidebar.badge')}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="button"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
                        className="absolute -right-3.5 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border p-1 shadow-md transition-colors hover:scale-110 md:flex"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                    >
                        {isCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 transition-colors nav-item-idle md:hidden"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
                    {filteredGroups.map((group, gi) => (
                        <div key={group.groupKey} className={gi > 0 ? 'mt-4' : ''}>
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="mb-1 px-4 text-[10px] font-bold uppercase tracking-widest"
                                        style={{ color: 'var(--color-text-alt)' }}
                                    >
                                        {t(group.groupKey)}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            <div className="space-y-0.5 px-2">
                                {group.items.map((item, idx) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: gi * 0.04 + idx * 0.03, duration: 0.3 }}
                                    >
                                        <NavLink
                                            to={item.path}
                                            onClick={onClose}
                                            end={item.end}
                                            id={`sidebar-item-${item.id}`}
                                            title={isCollapsed ? t('empresa.sidebar.' + item.id) : ''}
                                            className={({ isActive }) =>
                                                `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                                                    isCollapsed ? 'justify-center' : ''
                                                } ${isActive ? 'nav-item-active' : 'nav-item-idle'}`
                                            }
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    <item.icon
                                                        className={`size-[18px] shrink-0 transition-all duration-200 ${
                                                            isActive ? 'scale-110' : 'group-hover:scale-110'
                                                        }`}
                                                    />
                                                    <span
                                                        className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                                                            isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                                                        }`}
                                                    >
                                                        {t('empresa.sidebar.' + item.id)}
                                                    </span>
                                                    {isActive && !isCollapsed && (
                                                        <motion.span
                                                            layoutId="active-dot-empresa"
                                                            className="ml-auto h-1.5 w-1.5 rounded-full"
                                                            style={{ background: 'var(--color-purple)' }}
                                                        />
                                                    )}
                                                    {isActive && isCollapsed && (
                                                        <span
                                                            className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-full"
                                                            style={{ background: 'var(--color-purple)' }}
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </NavLink>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {!isCollapsed && (
                    <div
                        className="flex justify-center gap-3 px-4 py-2"
                        style={{ borderTop: '1px solid var(--color-border)' }}
                    >
                        <button
                            onClick={() => setLegalModal('terms')}
                            className="text-[10px] transition-colors hover:underline"
                            style={{ color: 'var(--color-text-alt)' }}
                        >
                            {t('sidebar.terms')}
                        </button>
                        <span style={{ color: 'var(--color-border)' }}>·</span>
                        <button
                            onClick={() => setLegalModal('privacy')}
                            className="text-[10px] transition-colors hover:underline"
                            style={{ color: 'var(--color-text-alt)' }}
                        >
                            {t('sidebar.privacy')}
                        </button>
                    </div>
                )}

                <div className="shrink-0 border-t p-2" style={{ borderColor: 'var(--color-border)' }}>
                    {isCollapsed ? (
                        <div className="flex flex-col items-center gap-1">
                            <div
                                className="flex size-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                                style={{ background: 'var(--color-purple)' }}
                                title={user?.name ?? ''}
                            >
                                {user ? getInitials(user.name) : 'U'}
                            </div>
                            <button
                                onClick={handleLogout}
                                title={t('sidebar.logout')}
                                className="rounded-lg p-1.5 transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                style={{ color: 'var(--color-pink)' }}
                            >
                                <LogOut className="size-3.5" />
                            </button>
                        </div>
                    ) : (
                        <div
                            className="flex items-center gap-2 rounded-xl border px-2 py-1.5"
                            style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
                        >
                            <div className="relative shrink-0">
                                <div
                                    className="flex size-7 items-center justify-center rounded-lg text-xs font-bold text-white"
                                    style={{ background: 'var(--color-purple)' }}
                                >
                                    {user ? getInitials(user.name) : 'U'}
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-emerald-400 dark:border-zinc-900" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                                    {user?.name || t('sidebar.user')}
                                </p>
                                <p className="truncate text-[10px]" style={{ color: 'var(--color-text-alt)' }}>
                                    {t('empresa.sidebar.badge')}
                                </p>
                            </div>
                            <button
                                onClick={handleLogout}
                                title={t('sidebar.logout')}
                                className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                style={{ color: 'var(--color-pink)' }}
                            >
                                <LogOut className="size-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {legalModal && <TermsModal type={legalModal} onClose={() => setLegalModal(null)} />}
        </>
    );
}
