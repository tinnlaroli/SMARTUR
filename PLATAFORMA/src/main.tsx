import * as Sentry from '@sentry/react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/router.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

import { UserPreferencesProvider } from './contexts/LanguageContext.tsx';
import { AuthModalProvider } from './features/auth/context/AuthModalContext.tsx';
import { ToastProvider } from './shared/context/ToastContext.tsx';

const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (sentryDsn) {
    Sentry.init({
        dsn: sentryDsn,
        environment: import.meta.env.MODE,
        integrations: [Sentry.browserTracingIntegration()],
        tracesSampleRate: 0.05,
        beforeSend(event) {
            // Filtra datos sensibles del usuario antes de enviar
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
