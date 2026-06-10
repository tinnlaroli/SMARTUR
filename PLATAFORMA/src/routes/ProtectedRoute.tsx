import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { emitUserStorageSync } from '../shared/userStorageSync';
import { isAuthenticated, clearAccessToken } from '../shared/api/axiosClient';

interface ProtectedRouteProps {
    allowedRoles?: number[];
}

function clearSession() {
    clearAccessToken();
    sessionStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    emitUserStorageSync();
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const location = useLocation();
    const userStr = localStorage.getItem('user');

    if (!isAuthenticated()) {
        clearSession();
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (allowedRoles) {
        if (!userStr) {
            clearSession();
            return <Navigate to="/" replace />;
        }

        let user;
        try {
            user = JSON.parse(userStr);
        } catch {
            clearSession();
            return <Navigate to="/" replace />;
        }

        const userRole = user.role_id;
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
