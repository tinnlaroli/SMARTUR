import * as Sentry from '@sentry/react';
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import './index.css';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/router.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

import { UserPreferencesProvider } from './contexts/LanguageContext.tsx';
import { AuthModalProvider } from './features/auth/context/AuthModalContext.tsx';
import { ToastProvider } from './shared/context/ToastContext.tsx';
import { initSession } from './shared/api/axiosClient.ts';

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
    // Si no hay refreshToken, no hay sesión que hidratar — arranca directo.
    const hasRefresh = !!sessionStorage.getItem('refreshToken');
    const [ready, setReady] = useState(!hasRefresh);

    useEffect(() => {
        if (ready) return;
        initSession().finally(() => setReady(true));
    }, []);

    if (!ready) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg, #0f172a)' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #984EFD33', borderTopColor: '#984EFD', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

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
