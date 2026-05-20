import { createBrowserRouter, redirect } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';

import { UserPage } from '../features/users/pages/UserPage';
import { CompanyPage } from '../features/companies/pages/CompanyPage';
import { TouristServicePage } from '../features/tourist-services/pages/TouristServicePage';
import { LocationPage } from '../features/locations/pages/LocationPage';
import { Home } from '../features/home/Home';
import { EvaluationsPage } from '../features/evaluations/pages/EvaluationsPage';

const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? 'http://localhost:5173';

export const router = createBrowserRouter([
    {
        // Ruta raíz → redirigir al dashboard protegido
        path: '/',
        loader: () => redirect('/dashboard'),
    },
    {
        path: '/dashboard',
        element: <ProtectedRoute />,
        children: [
            {
                element: <AppLayout />,
                children: [
                    { index: true, element: <Home /> },
                    { path: 'usuarios', element: <UserPage /> },
                    { path: 'companias', element: <CompanyPage /> },
                    { path: 'servicios', element: <TouristServicePage /> },
                    { path: 'ubicaciones', element: <LocationPage /> },
                    { path: 'evaluaciones', element: <EvaluationsPage /> },
                    {
                        path: 'configuracion',
                        element: <div className="p-8 text-zinc-500">Configuración — próximamente</div>,
                    },
                ],
            },
        ],
    },
    {
        // Cualquier ruta desconocida → Landing (no hay páginas auth propias)
        path: '*',
        loader: () => {
            window.location.href = LANDING_URL;
            return null;
        },
    },
]);
