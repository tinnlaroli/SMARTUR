import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import { RootLayout } from '../layouts/RootLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { PageSpinner } from '../shared/components/PageSpinner';

// ── Eager (tiny, needed on every route) ──────────────────────────────────────
import { NotFound } from '../features/notfound/NotFound';

// ── Public pages ──────────────────────────────────────────────────────────────
const Landing       = lazy(() => import('../features/landing/pages/Landing'));
const Form          = lazy(() => import('../features/form/pages/Form'));

// ── Admin dashboard pages ─────────────────────────────────────────────────────
const Home                = lazy(() => import('../features/home/Home').then(m => ({ default: m.Home })));
const UserPage            = lazy(() => import('../features/users/pages/UserPage').then(m => ({ default: m.UserPage })));
const CompanyPage         = lazy(() => import('../features/companies/pages/CompanyPage').then(m => ({ default: m.CompanyPage })));
const TouristServicePage  = lazy(() => import('../features/tourist-services/pages/TouristServicePage').then(m => ({ default: m.TouristServicePage })));
const LocationPage        = lazy(() => import('../features/locations/pages/LocationPage').then(m => ({ default: m.LocationPage })));
const ProfilesPage        = lazy(() => import('../features/profiles/pages/ProfilesPage').then(m => ({ default: m.ProfilesPage })));
const CertificationsPage  = lazy(() => import('../features/certifications/pages/CertificationsPage').then(m => ({ default: m.CertificationsPage })));
const POIPage             = lazy(() => import('../features/points-of-interest/pages/POIPage').then(m => ({ default: m.POIPage })));
const StatisticsPage      = lazy(() => import('../features/statistics/pages/StatisticsPage').then(m => ({ default: m.StatisticsPage })));
const InstrumentBuilderPage = lazy(() => import('../features/instrument-builder/pages/InstrumentBuilderPage').then(m => ({ default: m.InstrumentBuilderPage })));
const InstrumentEditorPage  = lazy(() => import('../features/instrument-builder/pages/InstrumentEditorPage').then(m => ({ default: m.InstrumentEditorPage })));
const CommunityPage       = lazy(() => import('../features/community/pages/CommunityPage').then(m => ({ default: m.CommunityPage })));
const ContactsPage        = lazy(() => import('../features/contacts/pages/ContactsPage').then(m => ({ default: m.ContactsPage })));
const MLObservabilityPage = lazy(() => import('../features/ml-observability/pages/MLObservabilityPage').then(m => ({ default: m.MLObservabilityPage })));
const NotificacionesPage  = lazy(() => import('../features/dashboard/pages/NotificacionesPage').then(m => ({ default: m.NotificacionesPage })));
const SettingsPage        = lazy(() => import('../features/settings/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

// ── Empresa portal pages ──────────────────────────────────────────────────────
const EmpresaLayout          = lazy(() => import('../features/empresa/pages/EmpresaLayout').then(m => ({ default: m.EmpresaLayout })));
const EmpresaDashboardPage   = lazy(() => import('../features/empresa/pages/EmpresaDashboardPage').then(m => ({ default: m.EmpresaDashboardPage })));
const EmpresaPerfilPage      = lazy(() => import('../features/empresa/pages/EmpresaPerfilPage').then(m => ({ default: m.EmpresaPerfilPage })));
const EmpresaServiciosPage   = lazy(() => import('../features/empresa/pages/EmpresaServiciosPage').then(m => ({ default: m.EmpresaServiciosPage })));
const EmpresaAnalyticsPage   = lazy(() => import('../features/empresa/pages/EmpresaAnalyticsPage').then(m => ({ default: m.EmpresaAnalyticsPage })));
const EmpresaConfiguracionPage = lazy(() => import('../features/empresa/pages/EmpresaConfiguracionPage').then(m => ({ default: m.EmpresaConfiguracionPage })));

// Suspense wrapper used inline for route elements
function S({ children }: { children: React.ReactNode }) {
    return <Suspense fallback={<PageSpinner />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
    {
        element: <RootLayout />,
        children: [
            {
                path: '/',
                element: <S><Landing /></S>,
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
                                    { index: true,                  element: <S><Home /></S> },
                                    { path: 'usuarios',             element: <S><UserPage /></S> },
                                    { path: 'companias',            element: <S><CompanyPage /></S> },
                                    { path: 'servicios',            element: <S><TouristServicePage /></S> },
                                    { path: 'ubicaciones',          element: <S><LocationPage /></S> },
                                    { path: 'perfiles',             element: <S><ProfilesPage /></S> },
                                    { path: 'actividades',          element: <Navigate to="/dashboard/companias" replace /> },
                                    { path: 'certificaciones',      element: <S><CertificationsPage /></S> },
                                    { path: 'poi',                  element: <S><POIPage /></S> },
                                    { path: 'estadisticas',         element: <S><StatisticsPage /></S> },
                                    { path: 'plantillas',           element: <Navigate to="/dashboard/instrumentos" replace /> },
                                    { path: 'instrumentos',         element: <S><InstrumentBuilderPage /></S> },
                                    { path: 'instrumentos/:id',     element: <S><InstrumentEditorPage /></S> },
                                    { path: 'comunidad',            element: <S><CommunityPage /></S> },
                                    { path: 'contactos',            element: <S><ContactsPage /></S> },
                                    { path: 'ml',                   element: <S><MLObservabilityPage /></S> },
                                    { path: 'notificaciones',       element: <S><NotificacionesPage /></S> },
                                    { path: 'configuracion',        element: <S><SettingsPage /></S> },
                                    { path: '*',                    element: <NotFound /> },
                                ],
                            },
                        ],
                    },
                    {
                        element: <ProtectedRoute allowedRoles={[2]} />,
                        children: [
                            {
                                path: '/form',
                                element: <S><Form /></S>,
                            },
                        ],
                    },
                ],
            },
            // ── Portal empresa (role_id = 3) ─────────────────────────────────
            {
                element: <ProtectedRoute allowedRoles={[3]} />,
                children: [
                    {
                        path: '/empresa',
                        element: <S><EmpresaLayout /></S>,
                        children: [
                            { path: 'dashboard',     element: <S><EmpresaDashboardPage /></S> },
                            { path: 'perfil',        element: <S><EmpresaPerfilPage /></S> },
                            { path: 'servicios',     element: <S><EmpresaServiciosPage /></S> },
                            { path: 'analytics',     element: <S><EmpresaAnalyticsPage /></S> },
                            { path: 'configuracion', element: <S><EmpresaConfiguracionPage /></S> },
                            { index: true,           element: <Navigate to="dashboard" replace /> },
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
    basename: import.meta.env.BASE_URL,
});
