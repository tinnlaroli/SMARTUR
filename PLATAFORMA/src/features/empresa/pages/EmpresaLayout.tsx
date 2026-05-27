import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
    Menu, ChevronRight, Sun, Moon,
} from 'lucide-react';
import { useUserPreferences } from '../../../contexts/LanguageContext';
import { useTheme } from '../../../contexts/ThemeContext';
import EmpresaSidebar from '../components/EmpresaSidebar';

export function EmpresaLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { pathname } = useLocation();
    const { user } = useUserPreferences();
    const { theme, toggleTheme } = useTheme();

    const currentLabel = pathname.startsWith('/empresa/servicios')
        ? 'Mis servicios'
        : pathname.startsWith('/empresa/analytics')
          ? 'Analytics'
          : pathname.startsWith('/empresa/perfil')
            ? 'Perfil'
            : 'Inicio';

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>
            <EmpresaSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <header
                    className="flex h-16 shrink-0 items-center gap-4 border-b px-4 sm:px-6 backdrop-blur-md"
                    style={{
                        borderColor: 'var(--color-border)',
                        background: 'rgba(var(--rgb-bg), 0.75)',
                    }}
                >
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden rounded-xl p-2"
                        style={{ color: 'var(--color-text-alt)' }}
                    >
                        <Menu size={20} />
                    </button>

                    <nav className="flex items-center gap-1 text-sm min-w-0">
                        <span style={{ color: 'var(--color-text-alt)' }}>Portal Empresa</span>
                        <ChevronRight className="size-3.5" style={{ color: 'var(--color-text-alt)' }} />
                        <span className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                            {currentLabel}
                        </span>
                    </nav>

                    <div className="ml-auto flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="rounded-xl p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                        >
                            {theme === 'dark'
                                ? <Sun className="size-[18px] text-amber-400" />
                                : <Moon className="size-[18px] text-violet-400" />}
                        </button>
                    </div>
                </header>

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
