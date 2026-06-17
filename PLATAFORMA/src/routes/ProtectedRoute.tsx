import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { emitUserStorageSync } from '../shared/userStorageSync';
import { isAuthenticated, clearAccessToken, clearStoredRefreshToken, getAccessToken } from '../shared/api/axiosClient';

interface ProtectedRouteProps {
    allowedRoles?: number[];
}

function clearSession() {
    clearAccessToken();
    clearStoredRefreshToken();
    localStorage.removeItem('user');
    emitUserStorageSync();
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const [, payload] = token.split('.');
        if (!payload) return null;
        const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(b64 + '='.repeat((4 - b64.length % 4) % 4)));
    } catch {
        return null;
    }
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const location = useLocation();

    if (!isAuthenticated()) {
        clearSession();
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (allowedRoles) {
        const userStr = localStorage.getItem('user');
        let user: Record<string, unknown> | null = null;

        if (userStr) {
            try { user = JSON.parse(userStr); } catch { /* fall through */ }
        }

        // If user object is missing but we have a live access token, recover from JWT payload
        // rather than clearing the session — avoids a false logout on the registration redirect.
        if (!user) {
            const token = getAccessToken();
            if (token) user = decodeJwtPayload(token);
        }

        if (!user) {
            clearSession();
            return <Navigate to="/" replace />;
        }

        const userRole = user.role_id as number | undefined;
        if (!userRole) {
            clearSession();
            return <Navigate to="/" replace />;
        }

        if (!allowedRoles.includes(userRole)) {
            if (userRole === 1 || userRole === 4) return <Navigate to="/dashboard" replace />;
            if (userRole === 3) return <Navigate to="/empresa/dashboard" replace />;
            return <Navigate to="/form" replace />;
        }
    }

    return <Outlet />;
};
