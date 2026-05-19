import { useState } from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';
import { ToastProvider } from '../shared/context/ToastContext';
import { Menu, Bell, Search, User, LogOut } from 'lucide-react';

const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? 'http://localhost:5173';

/** Lee el usuario guardado en localStorage por ProtectedRoute */
function getStoredUser(): { name?: string; email?: string } | null {
    try {
        const raw = localStorage.getItem('smartur_user');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export default function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user] = useState(getStoredUser);

    const handleLogout = () => {
        // Limpiar sesión del dashboard
        localStorage.removeItem('smartur_token');
        localStorage.removeItem('smartur_user');
        // Limpiar también las claves de la Landing para que no quede sesión activa
        localStorage.removeItem('session');
        localStorage.removeItem('token');
        // Redirigir a la Landing (cierre de sesión total)
        window.location.href = LANDING_URL;
    };

    const displayName = user?.name || user?.email || 'Administrador';
    const initials = displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <ToastProvider>
            <div className="flex bg-zinc-50 dark:bg-[#0a0a0c] min-h-screen selection:bg-indigo-100 selection:text-indigo-700 dark:selection:bg-indigo-900/30 dark:selection:text-indigo-300">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                    {/* HEADER DESKTOP */}
                    <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white/50 dark:bg-[#0d0d0f]/50 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/50 sticky top-0 z-20">
                        <div className="flex items-center gap-4 text-zinc-400">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors group-focus-within:text-indigo-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar en Smartur..."
                                    className="bg-zinc-100 dark:bg-zinc-900/50 border-none rounded-full py-1.5 pl-10 pr-4 text-sm w-64 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button className="relative p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors group">
                                <Bell className="h-5 w-5 group-hover:shake" />
                                <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-white dark:border-[#0d0d0f]"></span>
                            </button>
                            <div className="h-8 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1"></div>

                            {/* Usuario logueado */}
                            <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full">
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 max-w-[140px] truncate">
                                    {displayName}
                                </span>
                                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-white dark:ring-zinc-900">
                                    {initials || <User className="h-4 w-4" />}
                                </div>
                            </div>

                            {/* Logout → Landing */}
                            <button
                                onClick={handleLogout}
                                title="Cerrar sesión — regresa a SMARTUR"
                                className="p-2 rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-all duration-200 hover:scale-110 active:scale-95"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </header>

                    {/* HEADER MÓVIL */}
                    <div className="md:hidden sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center h-16 px-4">
                            <button
                                type="button"
                                className="p-2 -ml-2 rounded-lg text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                onClick={() => setSidebarOpen(true)}
                                aria-label="Abrir menú"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            <span className="ml-3 text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Smartur
                            </span>
                            <div className="ml-auto flex items-center gap-2">
                                <button
                                    onClick={handleLogout}
                                    title="Cerrar sesión"
                                    className="p-2 text-zinc-400 hover:text-rose-500 transition-colors"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-zinc-50 dark:bg-[#0a0a0c]">
                        <div className="max-w-[1600px] mx-auto min-h-full w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shake {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(10deg); }
                    75% { transform: rotate(-10deg); }
                }
                .shake { animation: shake 0.5s ease-in-out; }
                .group:hover .group-hover\\:shake { animation: shake 0.5s ease-in-out; }
            ` }} />
        </ToastProvider>
    );
}
