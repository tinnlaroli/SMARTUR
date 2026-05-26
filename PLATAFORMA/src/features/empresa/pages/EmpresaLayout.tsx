import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    Building2, BarChart3, Wrench, User, LogOut,
    Menu, X, ChevronRight,
} from 'lucide-react';
import { useUserPreferences } from '../../../contexts/LanguageContext';
import { useAuthModal } from '../../auth/context/AuthModalContext';

interface NavItem {
    path: string;
    label: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
    { path: '/empresa/dashboard', label: 'Inicio', icon: Building2, end: true },
    { path: '/empresa/servicios',  label: 'Mis Servicios', icon: Wrench },
    { path: '/empresa/analytics',  label: 'Analytics', icon: BarChart3 },
    { path: '/empresa/perfil',     label: 'Perfil', icon: User },
];

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; cls: string }> = {
        pending:   { label: 'En revisión', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
        active:    { label: 'Activo',      cls: 'bg-green-500/20  text-green-400  border-green-500/30'  },
        suspended: { label: 'Suspendido',  cls: 'bg-red-500/20    text-red-400    border-red-500/30'    },
    };
    const c = config[status] ?? config.pending;
    return (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.cls}`}>
            {c.label}
        </span>
    );
}

export function EmpresaLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const { user, clearUser } = useUserPreferences();
    const { openModal } = useAuthModal();

    const handleLogout = () => {
        localStorage.removeItem('token');
        clearUser();
        openModal('login');
        navigate('/');
    };

    const companyStatus = (user as { id_company?: number; company_status?: string } | null)?.company_status ?? 'pending';

    return (
        <div className="flex h-screen overflow-hidden bg-[#0f1117]">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#13171f] border-r border-white/[0.07]
                    transition-transform duration-300 lg:relative lg:translate-x-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Logo */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                            <Building2 className="text-white" size={16} />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm leading-none">SMARTUR</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">Portal Empresa</p>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-zinc-400 hover:text-white">
                        <X size={18} />
                    </button>
                </div>

                {/* User info */}
                {user && (
                    <div className="px-5 py-3 border-b border-white/[0.07]">
                        <p className="text-white font-semibold text-sm truncate">{user.name}</p>
                        <p className="text-zinc-500 text-[11px] truncate">{user.email}</p>
                        <div className="mt-1.5">
                            <StatusBadge status={companyStatus} />
                        </div>
                    </div>
                )}

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                                ${isActive
                                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                                }`
                            }
                        >
                            <item.icon size={17} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Logout */}
                <div className="px-4 pb-4">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all"
                    >
                        <LogOut size={17} />
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Topbar */}
                <header className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.07] bg-[#13171f]">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden text-zinc-400 hover:text-white"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-1 text-sm text-zinc-400">
                        <span>Portal Empresa</span>
                        <ChevronRight size={14} />
                        <span className="text-white font-medium">
                            {NAV_ITEMS.find((n) =>
                                window.location.pathname.startsWith(n.path)
                            )?.label ?? 'Dashboard'}
                        </span>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
