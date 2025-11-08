// src/routes/index.jsx  (o AppRoutes.jsx si así lo tienes)
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import Landing from '../pages/Landing'
import NotFound from '../pages/NotFound'

// importar vistas hijas
import UsersList from '../features/users/UsersList'
import UserCreate from '../features/users/UserCreate'

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />

            {/* Dashboard como layout */}
            <Route path="/dashboard" element={<Dashboard />}>
                <Route
                    index
                    element={
                        <div className="p-6">
                            Selecciona una opción del menú
                        </div>
                    }
                />
                <Route path="users" element={<UsersList />} />
                <Route path="users/new" element={<UserCreate />} />
            </Route>

            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}
