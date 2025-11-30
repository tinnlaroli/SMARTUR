import React from 'react'
import Sidebar from './Sidebar'
import { Outlet } from 'react-router-dom'

export default function AppLayout() {
    return (
        <div className="flex bg-white min-h-screen">
            <Sidebar />
            <main className="flex-1 p-6 bg-white">
                <Outlet />
            </main>
        </div>
    )
}

