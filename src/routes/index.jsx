import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import Landing from '../pages/Landing'
import NotFound from '../pages/NotFound'

import Stats from '../features/dash/stats'
import UsersPage from '../pages/UsersPage'
import AdminPage from '../pages/AdminsPage'
//            <Route path="*" element={<NotFound />} />
export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />

            <Route path="/dashboard" element={<Dashboard />}>
                <Route index element={<Stats />} />
                <Route path="admins" element={<AdminPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="*" element={<NotFound />} />
            </Route>

            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}
