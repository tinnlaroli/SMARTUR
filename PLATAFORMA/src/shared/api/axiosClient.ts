import axios from 'axios';
import { emitUserStorageSync } from '../userStorageSync';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? '/api/v2',
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
