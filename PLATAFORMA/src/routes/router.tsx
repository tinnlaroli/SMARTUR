import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import { RootLayout } from '../layouts/RootLayout';

import { UserPage } from '../features/users/pages/UserPage';
import { CompanyPage } from '../features/companies/pages/CompanyPage';
import { TouristServicePage } from '../features/tourist-services/pages/TouristServicePage';
import { LocationPage } from '../features/locations/pages/LocationPage';
import { Home } from '../features/home/Home';
import Landing from '../features/landing/pages/Landing';
import Form from '../features/form/pages/Form';
import { ProtectedRoute } from './ProtectedRoute';
import { NotFound } from '../features/notfound/NotFound';
import { ProfilesPage } from '../features/profiles/pages/ProfilesPage';
import { ActivitiesPage } from '../features/activities/pages/ActivitiesPage';
import { CertificationsPage } from '../features/certifications/pages/CertificationsPage';
import { POIPage } from '../features/points-of-interest/pages/POIPage';
import { StatisticsPage } from '../features/statistics/pages/StatisticsPage';
import { Navigate } from 'react-router-dom';
import { InstrumentBuilderPage } from '../features/instrument-builder/pages/InstrumentBuilderPage';
import { InstrumentEditorPage } from '../features/instrument-builder/pages/InstrumentEditorPage';
import { SettingsPage } from '../features/settings/pages/SettingsPage';
import { CommunityPage } from '../features/community/pages/CommunityPage';
import { ContactsPage } from '../features/contacts/pages/ContactsPage';

export const router = createBrowserRouter([
    {
        element: <RootLayout />,
        children: [
            {
                path: '/',
                element: <Landing />,
            },
            {
                children: [
                    {
                        element: <ProtectedRoute allowedRoles={[1]} />,
                        children: [
                            {
                                path: '/dashboard',
                                element: <AppLayout />,
                                children: [
                                    {
                                        index: true,
                                        element: <Home />,
                                    },
                                    {
                                        path: 'usuarios',
                                        element: <UserPage />,
                                    },
                                    {
                                        path: 'companias',
                                        element: <CompanyPage />,
                                    },
                                    {
                                        path: 'servicios',
                                        element: <TouristServicePage />,
                                    },
                                    {
                                        path: 'ubicaciones',
                                        element: <LocationPage />,
                                    },
                                    {
                                        path: 'perfiles',
                                        element: <ProfilesPage />,
                                    },
                                    {
                                        path: 'actividades',
                                        element: <ActivitiesPage />,
                                    },
                                    {
                                        path: 'certificaciones',
                                        element: <CertificationsPage />,
                                    },
                                    {
                                        path: 'poi',
                                        element: <POIPage />,
                                    },
                                    {
                                        path: 'estadisticas',
                                        element: <StatisticsPage />,
                                    },
                                    {
                                        path: 'plantillas',
                                        element: <Navigate to="/dashboard/instrumentos" replace />,
                                    },
                                    {
                                        path: 'instrumentos',
                                        element: <InstrumentBuilderPage />,
                                    },
                                    {
                                        path: 'instrumentos/:id',
                                        element: <InstrumentEditorPage />,
                                    },
                                    {
                                        path: 'comunidad',
                                        element: <CommunityPage />,
                                    },
                                    {
                                        path: 'contactos',
                                        element: <ContactsPage />,
                                    },
                                    {
                                        path: 'configuracion',
                                        element: <SettingsPage />,
                                    },
                                    {
                                        path: '*',
                                        element: <NotFound />,
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        element: <ProtectedRoute allowedRoles={[2]} />,
                        children: [
                            {
                                path: '/form',
                                element: <Form />,
                            },
                        ],
                    },
                ],
            },
            {
                path: '*',
                element: <NotFound />,
            },
        ],
    },
], {
    basename: import.meta.env.BASE_URL
});
