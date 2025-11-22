import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import Landing from '../pages/Landing'
import NotFound from '../pages/NotFound'

import Stats from '../features/dash/stats'
import AdminList from '../features/admin/AdminList'
import AdminCreateModal from '../features/admin/AdminCreate'
import UsersPage from '../pages/UsersPage'

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />

            <Route path="/dashboard" element={<Dashboard />}>
                <Route index element={<Stats />} />
                <Route path="admin" element={<AdminList />} />
                <Route path="admin/new" element={<AdminCreateModal />} />
                <Route path="users" element={<UsersPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}
