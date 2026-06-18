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
    timeout: 30000,
});

// Access token en memoria — no persiste en storage, no es accesible por XSS
let _accessToken: string | null = null;
export const setAccessToken = (t: string) => { _accessToken = t; };
export const clearAccessToken = () => { _accessToken = null; };
export const getAccessToken = () => _accessToken;

// ── Refresh token storage helpers ────────────────────────────────────────────
// "Recordarme" → localStorage con expiración de 7 días
// Sin "recordarme" → sessionStorage (destruido al cerrar el navegador)

const LS_REFRESH  = 'refreshToken';
const LS_REMEMBER = 'welltur:remember';
const LS_EXPIRY   = 'welltur:session_expiry';
const SEVEN_DAYS  = 7 * 24 * 60 * 60 * 1000;

export function setStoredRefreshToken(token: string, remember: boolean) {
    if (remember) {
        localStorage.setItem(LS_REFRESH,  token);
        localStorage.setItem(LS_REMEMBER, 'true');
        localStorage.setItem(LS_EXPIRY,   String(Date.now() + SEVEN_DAYS));
        sessionStorage.removeItem(LS_REFRESH);
    } else {
        sessionStorage.setItem(LS_REFRESH, token);
        localStorage.removeItem(LS_REFRESH);
        localStorage.removeItem(LS_REMEMBER);
        localStorage.removeItem(LS_EXPIRY);
    }
}

export function getStoredRefreshToken(): string | null {
    const lsToken = localStorage.getItem(LS_REFRESH);
    if (lsToken) {
        const expiry = parseInt(localStorage.getItem(LS_EXPIRY) ?? '0', 10);
        if (Date.now() > expiry) {
            clearStoredRefreshToken();
            return null;
        }
        return lsToken;
    }
    return sessionStorage.getItem(LS_REFRESH);
}

export function clearStoredRefreshToken() {
    sessionStorage.removeItem(LS_REFRESH);
    localStorage.removeItem(LS_REFRESH);
    localStorage.removeItem(LS_REMEMBER);
    localStorage.removeItem(LS_EXPIRY);
}
// ─────────────────────────────────────────────────────────────────────────────

export const isAuthenticated = () =>
    _accessToken !== null || getStoredRefreshToken() !== null;

/**
 * Rehidrata la sesión desde el refreshToken al arrancar la app (ej: tras F5).
 * Llama a /auth/refresh si hay refreshToken pero no hay accessToken en memoria.
 * Retorna true si la sesión quedó activa, false si no hay sesión o expiró.
 */
export async function initSession(): Promise<boolean> {
    if (_accessToken) return true;
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) return false;
    try {
        const { data } = await axios.post(`${resolveApiBaseUrl()}/auth/refresh`, { refreshToken });
        setAccessToken(data.token);
        const remember = localStorage.getItem(LS_REMEMBER) === 'true';
        setStoredRefreshToken(data.refreshToken, remember);
        return true;
    } catch {
        clearStoredRefreshToken();
        localStorage.removeItem('user');
        return false;
    }
}

api.interceptors.request.use(
    (config) => {
        if (_accessToken) {
            config.headers.Authorization = `Bearer ${_accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// Flag para evitar bucle infinito si el refresh también falla
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function clearSessionAndRedirect() {
    console.error('[auth] clearSessionAndRedirect — session wiped, redirecting to /');
    _accessToken = null;
    clearStoredRefreshToken();
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
            console.error(`[auth] 401 on ${originalRequest?.url} — attempting refresh`);
            const refreshToken = getStoredRefreshToken();

            if (!refreshToken) {
                console.error('[auth] No refresh token — clearing session');
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

                setAccessToken(newToken);
                const remember = localStorage.getItem(LS_REMEMBER) === 'true';
                setStoredRefreshToken(newRefresh, remember);

                // Descola peticiones en espera
                refreshQueue.forEach((cb) => cb(newToken));
                refreshQueue = [];

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                refreshQueue = [];
                // Only wipe the session when the refresh endpoint explicitly rejects the
                // token (HTTP 401 = invalid/expired). For transient failures (network
                // error, 5xx, timeout) keep the session alive — the user should not be
                // logged out because the API restarted during a deploy.
                const refreshStatus = (refreshError as { response?: { status?: number } })?.response?.status;
                console.error('[auth] Refresh failed — status:', refreshStatus ?? 'network/timeout');
                if (refreshStatus === 401) {
                    clearSessionAndRedirect();
                }
                return Promise.reject(error);
            } finally {
                isRefreshing = false;
            }
        }

        if (import.meta.env.DEV && error.response?.status >= 500) {
            console.error(
                `[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${error.response.status}`,
                error.response.data,
            );
        }

        return Promise.reject(error);
    },
);
