import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * ProtectedRoute — Única puerta de entrada al Dashboard.
 *
 * El Dashboard NO tiene login propio. Solo es accesible desde la Landing:
 *   http://localhost:5173 → login como admin → redirige a:
 *   http://localhost:5174/dashboard#access_token=<jwt>&user=<base64>
 *
 * Este componente lee el hash de forma SÍNCRONA (inicializador de useState)
 * para guardar el token y el usuario en localStorage antes del primer render.
 *
 * Si no hay token → redirige a la Landing (cierra sesión).
 */

const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? 'http://localhost:5173';

export function ProtectedRoute() {
    const [auth] = useState<{ hasToken: boolean; isAdmin: boolean }>(() => {
        const hash = window.location.hash;

        if (hash.includes('access_token=')) {
            try {
                // Parsear todos los parámetros del hash
                const params = new URLSearchParams(hash.replace(/^#/, ''));
                const token = decodeURIComponent(params.get('access_token') ?? '');
                const userB64 = params.get('user');

                if (token) {
                    localStorage.setItem('smartur_token', token);
                }

                if (userB64) {
                    const user = JSON.parse(atob(decodeURIComponent(userB64)));
                    localStorage.setItem('smartur_user', JSON.stringify(user));
                }

                // Limpiar hash de la URL sin causar reload
                window.history.replaceState(null, '', window.location.pathname);

                // Verificar rol de admin en el usuario recién recibido
                if (userB64) {
                    try {
                        const user = JSON.parse(atob(decodeURIComponent(userB64)));
                        const roleId = user?.roleId ?? user?.role_id ?? user?.role?.id;
                        const isAdmin = roleId === 1 || user?.role === 'admin';
                        return { hasToken: !!token, isAdmin };
                    } catch {
                        // Si no se puede parsear el usuario, denegar acceso
                    }
                }

                return { hasToken: !!token, isAdmin: false };
            } catch {
                // Si falla el parse, continuar con verificación normal
            }
        }

        // Verificar token y rol desde localStorage (sesión existente)
        const token = localStorage.getItem('smartur_token');
        if (!token) return { hasToken: false, isAdmin: false };

        try {
            const raw = localStorage.getItem('smartur_user');
            const user = raw ? JSON.parse(raw) : null;
            const roleId = user?.roleId ?? user?.role_id ?? user?.role?.id;
            const isAdmin = roleId === 1 || user?.role === 'admin';
            return { hasToken: true, isAdmin };
        } catch {
            return { hasToken: true, isAdmin: false };
        }
    });

    if (!auth.hasToken || !auth.isAdmin) {
        // Sin token o sin rol de admin → limpiar y redirigir a la Landing
        localStorage.removeItem('smartur_token');
        localStorage.removeItem('smartur_user');
        window.location.href = LANDING_URL;
        return null;
    }

    return <Outlet />;
}
