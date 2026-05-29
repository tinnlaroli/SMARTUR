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

// Flag para evitar bucle infinito si el refresh también falla
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function clearSessionAndRedirect() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    emitUserStorageSync();
    window.location.href = '/';
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        const isAuthRoute =
            originalRequest?.url?.includes('/login') ||
            originalRequest?.url?.includes('/register') ||
            originalRequest?.url?.includes('/forgot') ||
            originalRequest?.url?.includes('/reset') ||
            originalRequest?.url?.includes('/two-factor') ||
            originalRequest?.url?.includes('/auth/refresh');

        if (error.response?.status === 401 && !isAuthRoute && !originalRequest._retried) {
            const refreshToken = localStorage.getItem('refreshToken');

            if (!refreshToken) {
                clearSessionAndRedirect();
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // Encola la petición hasta que el refresh termine
                return new Promise((resolve) => {
                    refreshQueue.push((newToken) => {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        resolve(api(originalRequest));
                    });
                });
            }

            originalRequest._retried = true;
            isRefreshing = true;

            try {
                const { data } = await axios.post(
                    `${resolveApiBaseUrl()}/auth/refresh`,
                    { refreshToken },
                );
                const newToken: string = data.token;
                const newRefresh: string = data.refreshToken;

                localStorage.setItem('token', newToken);
                localStorage.setItem('refreshToken', newRefresh);

                // Descola peticiones en espera
                refreshQueue.forEach((cb) => cb(newToken));
                refreshQueue = [];

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch {
                refreshQueue = [];
                clearSessionAndRedirect();
                return Promise.reject(error);
            } finally {
                isRefreshing = false;
            }
        }

        if (error.response?.status >= 500) {
            console.error(
                `[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${error.response.status}`,
                error.response.data,
            );
        }

        return Promise.reject(error);
    },
);
