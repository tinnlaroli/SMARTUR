import axios from 'axios';
import { emitUserStorageSync } from '../userStorageSync';

/** En dev, VITE_API_URL=http://localhost:4000 evita el proxy de Vite y provoca CORS. */
function resolveApiBaseUrl(): string {
    const envUrl = import.meta.env.VITE_API_URL as string | undefined;
    if (!envUrl) return '/api/v2';

    if (typeof window !== 'undefined') {
        try {
            const parsed = new URL(envUrl, window.location.origin);
            const isLocalApi =
                (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
                (parsed.port === '4000' || parsed.pathname.startsWith('/api'));
            if (isLocalApi && window.location.port !== '4000') {
                return '/api/v2';
            }
        } catch {
            return envUrl;
        }
    }

    return envUrl;
}

export const api = axios.create({
    baseURL: resolveApiBaseUrl(),
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const isAuthRoute =
                error.config.url?.includes('/login') ||
                error.config.url?.includes('/register') ||
                error.config.url?.includes('/forgot') ||
                error.config.url?.includes('/reset') ||
                error.config.url?.includes('/two-factor');

            if (!isAuthRoute) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                emitUserStorageSync();
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    },
);
