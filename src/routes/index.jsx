// src/routes/index.jsx  (o AppRoutes.jsx si así lo tienes)
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import Landing from '../pages/Landing'
import NotFound from '../pages/NotFound'

// importar vistas hijas
import Stats from '../features/dash/stats'
import UsersList from '../features/users/UsersList'
import UserCreate from '../features/users/UserCreate'
import AdminList from '../features/admin/AdminList'
import AdminCreateModal from '../features/admin/AdminCreate'

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />

            <Route path="/dashboard" element={<Dashboard />}>
                <Route
                    index
                    element={< Stats/>}
                />
                <Route path="users" element={<UsersList />} />
                <Route path="users/new" element={<UserCreate />} />
                <Route path="admin" element={<AdminList />} />
                <Route path="admin/new" element={<AdminCreateModal />} />

            </Route>

            
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}
