import * as Sentry from '@sentry/react';
import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
import './index.css';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/router.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

import { UserPreferencesProvider } from './contexts/LanguageContext.tsx';
import { AuthModalProvider } from './features/auth/context/AuthModalContext.tsx';
import { ToastProvider } from './shared/context/ToastContext.tsx';
import { initSession, setAccessToken } from './shared/api/axiosClient.ts';

// Consume registration token from LANDING redirect (/empresa/dashboard#token=...&user=...)
// Must run synchronously before React renders so ProtectedRoute sees the token.
(function consumeHashToken() {
    const hash = window.location.hash;
    if (!hash.startsWith('#token=') && !hash.includes('token=')) return;
    try {
        const params = new URLSearchParams(hash.replace(/^#/, ''));
        const token = params.get('token');
        const userEncoded = params.get('user');
        if (token) {
            setAccessToken(token);
            if (userEncoded) {
                const user = JSON.parse(atob(decodeURIComponent(userEncoded)));
                localStorage.setItem('user', JSON.stringify(user));
            }
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    } catch { /* invalid hash — ignore */ }
}());

// Register service worker (PWA — empresa portal)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}

// Developer easter egg
if (import.meta.env.PROD) {
  const c = (color: string) => `color:${color};font-weight:700;font-size:13px`;
  console.log(
    '%cSMARTUR%c  Turismo Inteligente · Altas Montañas de Veracruz\n%c¿Te gusta lo que ves? Hablemos: martinlaraolivares@gmail.com',
    `${c('#FC478E')};font-size:20px`, c('#984EFD'),
    'color:#aaa;font-weight:400;font-size:11px'
  );
}

const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (sentryDsn) {
    Sentry.init({
        dsn: sentryDsn,
        environment: import.meta.env.MODE,
        integrations: [Sentry.browserTracingIntegration()],
        tracesSampleRate: 0.05,
        beforeSend(event) {
            if (event.user) delete event.user.email;
            return event;
        },
    });
}

function SessionGate({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        void initSession();
        const path = window.location.pathname;
        if (path === '/' || path === '') {
            void import('./features/landing/pages/Landing');
        }
    }, []);

    return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
    <ErrorBoundary title="Error crítico de la aplicación">
        <UserPreferencesProvider>
            <ToastProvider>
                <AuthModalProvider>
                    <SessionGate>
                        <RouterProvider router={router} />
                    </SessionGate>
                </AuthModalProvider>
            </ToastProvider>
        </UserPreferencesProvider>
    </ErrorBoundary>,
);
