import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { emitUserStorageSync } from '../shared/userStorageSync';

interface ProtectedRouteProps {
    allowedRoles?: number[];
}

const isTokenExpired = (token: string): boolean => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (!payload.exp) return false;
        return Date.now() >= payload.exp * 1000;
    } catch {
        return true;
    }
};

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const location = useLocation();
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || isTokenExpired(token)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        emitUserStorageSync();
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (allowedRoles) {
        if (!userStr) {
            localStorage.removeItem('token');
            return <Navigate to="/" replace />;
        }

        let user;
        try {
            user = JSON.parse(userStr);
        } catch {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            emitUserStorageSync();
            return <Navigate to="/" replace />;
        }

        const userRole = user.role_id || (Number(user.id) === 1 ? 1 : 2);

        if (!allowedRoles.includes(userRole)) {
            // Redirect to their default page instead of showing unauthorized content
            if (userRole === 1) return <Navigate to="/dashboard" replace />;
            if (userRole === 3) return <Navigate to="/empresa/dashboard" replace />;
            return <Navigate to="/form" replace />;
        }
    }

    return <Outlet />;
};
