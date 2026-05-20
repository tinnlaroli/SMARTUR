import { createRoot } from 'react-dom/client';
import './index.css';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/router.tsx';


import { UserPreferencesProvider } from './contexts/LanguageContext.tsx';
import { AuthModalProvider } from './features/auth/context/AuthModalContext.tsx';
import { ToastProvider } from './shared/context/ToastContext.tsx';

createRoot(document.getElementById('root')!).render(
    <UserPreferencesProvider>
        <ToastProvider>
            <AuthModalProvider>
                <RouterProvider router={router} />
            </AuthModalProvider>
        </ToastProvider>
    </UserPreferencesProvider>,
);
