import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

function LoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent border-solid rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Verificando sesión...</p>
            </div>
        </div>
    )
}

export default function ProtectedRoute({ children, adminOnly = false }) {
    const { user, isCheckingAuth } = useAuth()

    // Mostrar spinner mientras se verifica la autenticación
    if (isCheckingAuth) {
        return <LoadingSpinner />
    }

    // Si no hay usuario autenticado, redirigir al home
    if (!user) {
        return <Navigate to="/" replace />
    }

    // Si la ruta requiere admin, verificar el rol
    if (adminOnly) {
        const roleId = user?.roleId ?? user?.role_id ?? user?.role?.id
        const isAdmin = roleId === 1 || user?.role === 'admin' || user?.id === 1

        if (!isAdmin) {
            return <Navigate to="/" replace />
        }
    }

    return <>{children}</>
}

