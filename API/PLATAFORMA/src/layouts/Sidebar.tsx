import { NavLink, useNavigate } from 'react-router-dom';
import {
    X, Users, Building2, Wrench, Settings, MapPin,
    ChevronLeft, ChevronRight, Home, LogOut, UserCircle,
    Activity, Award, Star, BarChart3, FileText,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage, useUserPreferences } from '../contexts/LanguageContext';
import { useAuthModal } from '../features/auth/context/AuthModalContext';

interface SidebarProps { isOpen: boolean; onClose: () => void; }

interface MenuItem {
    id: string; label: string;
    icon: React.ComponentType<{ className?: string }>;
    path: string; end?: boolean; roles: number[];
}

const MENU_GROUPS = [
    {
        label: 'Principal',
        items: ['home'],
    },
    {
        label: 'Gestión',
        items: ['users', 'companies', 'services', 'locations', 'profiles', 'activities', 'certifications', 'poi'],
    },
    {
        label: 'Reportes',
        items: ['stats', 'instruments'],
    },
    {
        label: 'Sistema',
        items: ['settings'],
    },
];

const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();
    const { openModal } = useAuthModal();
    const { t } = useLanguage();
    const { user, clearUser } = useUserPreferences();
    const userRole = user?.role_id || 2;

    const allItems: MenuItem[] = [
        { id: 'home',           label: t('sidebar.home'),           icon: Home,       path: '/dashboard',                 end: true, roles: [1] },
        { id: 'users',          label: t('sidebar.users'),          icon: Users,      path: '/dashboard/usuarios',                   roles: [1] },
        { id: 'companies',      label: t('sidebar.companies'),      icon: Building2,  path: '/dashboard/companias',                  roles: [1] },
        { id: 'services',       label: t('sidebar.services'),       icon: Wrench,     path: '/dashboard/servicios',                  roles: [1] },
        { id: 'locations',      label: t('sidebar.locations'),      icon: MapPin,     path: '/dashboard/ubicaciones',                roles: [1] },
        { id: 'profiles',       label: t('sidebar.profiles'),       icon: UserCircle, path: '/dashboard/perfiles',                   roles: [1] },
        { id: 'activities',     label: t('sidebar.activities'),     icon: Activity,   path: '/dashboard/actividades',                roles: [1] },
        { id: 'certifications', label: t('sidebar.certifications'), icon: Award,      path: '/dashboard/certificaciones',            roles: [1] },
        { id: 'poi',            label: t('sidebar.poi'),            icon: Star,       path: '/dashboard/poi',                        roles: [1] },
        { id: 'stats',          label: t('sidebar.stats'),          icon: BarChart3,  path: '/dashboard/estadisticas',               roles: [1] },
        { id: 'instruments',    label: t('sidebar.instruments'),    icon: FileText,   path: '/dashboard/instrumentos',               roles: [1] },
        { id: 'settings',       label: t('sidebar.settings'),       icon: Settings,   path: '/dashboard/configuracion',              roles: [1] },
    ];

    const itemMap = Object.fromEntries(allItems.map((i) => [i.id, i]));
    const filteredGroups = MENU_GROUPS.map((g) => ({
        ...g,
        items: g.items.map((id) => itemMap[id]).filter((i) => i && i.roles.includes(userRole)),
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
            {/* Mobile overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
                {/* ── Logo area ── */}
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
                            <motion.img
                                key="logo"
                                src="/smartur.png"
                                alt="Smartur"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="h-20 w-auto object-contain"
                            />
                        )}
                    </AnimatePresence>

                    {/* collapse button — desktop */}
                    <button
                        type="button"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
                        className={`absolute -right-3.5 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border p-1 shadow-md transition-colors hover:scale-110 md:flex`}
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                    >
                        {isCollapsed
                            ? <ChevronRight className="size-3.5" />
                            : <ChevronLeft className="size-3.5" />}
                    </button>

                    {/* close button — mobile */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 transition-colors nav-item-idle md:hidden"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* ── Nav ── */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
                    {filteredGroups.map((group, gi) => (
                        <div key={group.label} className={gi > 0 ? 'mt-4' : ''}>
                            {/* Group label */}
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
                                        {group.label}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            <div className={`space-y-0.5 ${isCollapsed ? 'px-2' : 'px-2'}`}>
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
                                            title={isCollapsed ? item.label : ''}
                                            className={({ isActive }) =>
                                                `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                                                    isCollapsed ? 'justify-center' : ''
                                                } ${isActive ? 'nav-item-active' : 'nav-item-idle'}`
                                            }
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    {/* icon */}
                                                    <item.icon
                                                        className={`size-[18px] shrink-0 transition-all duration-200 ${
                                                            isActive
                                                                ? 'scale-110'
                                                                : 'group-hover:scale-110'
                                                        }`}
                                                    />

                                                    {/* label */}
                                                    <span
                                                        className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                                                            isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                                                        }`}
                                                    >
                                                        {item.label}
                                                    </span>

                                                    {/* active indicator */}
                                                    {isActive && !isCollapsed && (
                                                        <motion.span
                                                            layoutId="active-dot"
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

                {/* ── Footer ── */}
                <div
                    className="shrink-0 space-y-1 border-t p-2"
                    style={{ borderColor: 'var(--color-border)' }}
                >
                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        title={isCollapsed ? t('sidebar.logout') : ''}
                        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all active:scale-[0.97] ${
                            isCollapsed ? 'justify-center' : ''
                        }`}
                        style={{ color: 'var(--color-pink)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(var(--rgb-pink-primary),0.10)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                        <LogOut className="size-[18px] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                        <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                            {t('sidebar.logout')}
                        </span>
                    </button>

                    {/* User card */}
                    <div className="pt-1">
                        {isCollapsed ? (
                            <div className="flex justify-center">
                                <div
                                    className="flex size-10 cursor-default items-center justify-center rounded-xl text-sm font-bold text-white shadow-md transition-transform hover:scale-105"
                                    style={{ background: 'var(--color-purple)' }}
                                    title={user?.name ?? ''}
                                >
                                    {user ? getInitials(user.name) : 'U'}
                                </div>
                            </div>
                        ) : (
                            <div
                                className="rounded-xl border p-3"
                                style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative shrink-0">
                                        <div
                                            className="flex size-9 items-center justify-center rounded-lg text-sm font-bold text-white shadow"
                                            style={{ background: 'var(--color-purple)' }}
                                        >
                                            {user ? getInitials(user.name) : 'U'}
                                        </div>
                                        {/* online dot */}
                                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400 dark:border-zinc-900" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                            {user?.name || t('sidebar.user')}
                                        </p>
                                        <p className="truncate text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                            {user?.email || ''}
                                        </p>
                                    </div>
                                    <span
                                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                                        style={{ background: 'var(--color-purple)' }}
                                    >
                                        {userRole === 1 ? t('sidebar.admin') : t('sidebar.user')}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
        
    );
}
