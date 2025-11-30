import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { ToastProvider } from '../components/ui/ToastContainer'
import { AuthProvider } from '../features/auth/AuthContext'
import { SignUpProvider } from '../features/auth/SignUpContext'
import AppLayout from '../app/AppLayout'
import ProtectedRoute from '../components/ProtectedRoute'
import Landing from '../pages/Landing'
import NotFound from '../pages/NotFound'
import StatsPage from '../features/dashboard/StatsPage'
import UsersPage from '../features/users/UsersPage'
import AdminPage from '../features/admin/AdminPage'
import LocationsPage from '../features/locations/LocationsPage'
import PointsOfInterestPage from '../features/pointsOfInterest/PointsOfInterestPage'

// Componente wrapper que envuelve las rutas con los providers
function AppWithProviders({ children }) {
    return (
        <AuthProvider>
            <SignUpProvider>
                {children}
            </SignUpProvider>
        </AuthProvider>
    )
}

export const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <AppWithProviders>
                <Landing />
            </AppWithProviders>
        ),
    },
    {
        path: '/dashboard',
        element: (
            <AppWithProviders>
                <ProtectedRoute adminOnly={true}>
                    <ToastProvider>
                        <AppLayout />
                    </ToastProvider>
                </ProtectedRoute>
            </AppWithProviders>
        ),
        children: [
            { index: true, element: <StatsPage /> },
            { path: 'users', element: <UsersPage /> },
            { path: 'admins', element: <AdminPage /> },
            { path: 'locations', element: <LocationsPage /> },
            { path: 'points-of-interest', element: <PointsOfInterestPage /> },
        ],
    },
    {
        path: '*',
        element: (
            <AppWithProviders>
                <NotFound />
            </AppWithProviders>
        ),
    },
])
