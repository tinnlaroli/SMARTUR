// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AOS from 'aos'
import 'aos/dist/aos.css'
import {
    FaUserCog,
    FaTools,
    FaBrain,
    FaSignOutAlt,
    FaUsers,
    FaMapMarkedAlt,
    FaChartBar,
    FaTimes,
} from 'react-icons/fa'
import smarturLogo from '../assets/smartur_logo.png'
import { useAuth } from '../features/auth/AuthContext.jsx'

export default function Dashboard() {
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        AOS.init({ duration: 800, once: true })
    }, [])

    const handleLogout = () => {
        logout && logout()
        // Ya no es necesario eliminar el token manualmente, el logout() lo hace
    }

    const menu = [
        { title: 'Inicio', path: '/dashboard' },

        {
            title: 'Usuarios',
            icon: <FaUsers className="text-2xl" />,
            path: '/dashboard/users',
        },

        {
            title: 'Gestion de administradores',
            icon: <FaUserCog className="text-2xl" />,
            path: '/dashboard/admins',
        },
    ]

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[auto,1fr] font-sans text-gray-700">
            <aside
                className={`fixed lg:static z-50 top-0 left-0 h-full w-64 bg-gradient-to-br from-purple to-blue text-white shadow-xl transform ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}
            >
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src={smarturLogo}
                            className="h-10 w-10 rounded-full bg-white shadow"
                            alt="Logo"
                        />
                        <span className="text-xl font-bold">SMARTUR</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden bg-white/20 text-white hover:text-red-200 transition-all duration-300 hover:bg-white/30 rounded-full w-8 h-8 flex items-center justify-center border-0 hover:scale-105"
                    >
                        <FaTimes className="text-lg" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto px-6 pb-6">
                    <nav className="flex flex-col gap-2">
                        {menu.map((item, i) => (
                            <button
                                key={i}
                                onClick={() => navigate(item.path)}
                                className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/10 transition-all text-left"
                            >
                                {item.icon}
                                <span>{item.title}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6 border-t border-white/10">
                    <button
                        className="flex items-center gap-2 bg-orange hover:bg-orange/90 text-white py-2 px-4 rounded-full shadow transition-all w-full justify-center"
                        onClick={handleLogout}
                    >
                        <FaSignOutAlt /> Cerrar sesión
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto relative bg-gray-50">
                <button
                    className="lg:hidden absolute top-4 left-4 bg-purple text-white p-2 rounded-md z-40 shadow"
                    onClick={() => setSidebarOpen(true)}
                >
                    ☰
                </button>

                <div className="flex justify-between items-center mb-10 pt-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple to-blue drop-shadow-xl"
                    >
                        Panel de administración
                    </motion.h1>

                    {user && (
                        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-200">
                            <FaUserCog className="text-purple text-lg" />
                            <span className="text-gray-700 font-medium">
                                {user.name}
                            </span>
                        </div>
                    )}
                </div>

                <Outlet />
            </main>
        </div>
    )
}
