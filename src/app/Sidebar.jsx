import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    Users,
    ShieldCheck,
    Home,
    LogOut,
    MapPin,
    Landmark,
} from 'lucide-react'
import smarturLogo from '../assets/smartur_logo.png'
import { useAuth } from '../features/auth/AuthContext'

export default function Sidebar() {
    const location = useLocation()
    const navigate = useNavigate()
    const { user, logout } = useAuth()

    const handleLogout = () => {
        logout && logout()
    }

    const menuItems = [
        { id: 'home', label: 'Inicio', icon: Home, path: '/dashboard' },
        {
            id: 'users',
            label: 'Usuarios',
            icon: Users,
            path: '/dashboard/users',
        },
        {
            id: 'admins',
            label: 'Gestión de administradores',
            icon: ShieldCheck,
            path: '/dashboard/admins',
        },
        {
            id: 'locations',
            label: 'Ubicaciones',
            icon: MapPin,
            path: '/dashboard/locations',
        },
        {
            id: 'points-of-interest',
            label: 'Puntos de Interés',
            icon: Landmark,
            path: '/dashboard/points-of-interest',
        },
    ]

    return (
        <aside className="w-64 bg-gradient-to-br from-purple to-blue text-white h-screen border-r border-white/10 px-4 py-5 flex flex-col">
            <div className="flex items-center justify-center mb-8">
                <div className="flex items-center gap-3">
                    <img
                        src={smarturLogo}
                        className="h-10 w-10 rounded-full bg-white shadow"
                        alt="Logo SMARTUR"
                    />
                    <h1 className="text-xl font-bold">SMARTUR</h1>
                </div>
            </div>

            <nav className="flex-grow space-y-2">
                {menuItems.map(({ id, label, icon: Icon, path }) => {
                    const active = location.pathname === path

                    return (
                        <Link
                            key={id}
                            to={path}
                            className={`
                                flex items-center gap-3 h-12 px-3 rounded-lg transition
                                ${
                                    active
                                        ? 'bg-white/20 text-white shadow-sm'
                                        : 'text-white/80 hover:bg-white/10'
                                }
                            `}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="font-medium">{label}</span>
                        </Link>
                    )
                })}
            </nav>

            {user && (
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-white/10 rounded-lg">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-sm font-medium">{user.name}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-orange hover:bg-orange/90 text-white py-2 px-4 rounded-full shadow transition-all w-full justify-center"
                    >
                        <LogOut className="h-4 w-4" />
                        Cerrar sesión
                    </button>
                </div>
            )}
        </aside>
    )
}
