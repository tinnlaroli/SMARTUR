import * as Sentry from '@sentry/react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/router.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

import { UserPreferencesProvider } from './contexts/LanguageContext.tsx';
import { AuthModalProvider } from './features/auth/context/AuthModalContext.tsx';
import { ToastProvider } from './shared/context/ToastContext.tsx';

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

createRoot(document.getElementById('root')!).render(
    <ErrorBoundary title="Error crítico de la aplicación">
        <UserPreferencesProvider>
            <ToastProvider>
                <AuthModalProvider>
                    <RouterProvider router={router} />
                </AuthModalProvider>
            </ToastProvider>
        </UserPreferencesProvider>
    </ErrorBoundary>,
);
