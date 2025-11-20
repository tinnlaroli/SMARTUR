// src/components/Stats.jsx
import React, { useState, useEffect } from 'react'
import { getAllUsers } from '../users/usersService'
import { motion } from 'framer-motion'
import { FaUserCog, FaMapMarkedAlt, FaChartBar } from 'react-icons/fa'

const Stats = () => {
    const [usersCount, setUsersCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const loadUsersCount = async () => {
        try {
            setLoading(true)
            const data = await getAllUsers()
            
            console.log('Respuesta completa de getAllUsers:', data) // Para debug
            
            // Diferentes formas de obtener el count según la estructura de la respuesta
            let count = 0
            
            if (data && typeof data === 'object') {
                // Si la respuesta tiene propiedad count
                if (data.count !== undefined) {
                    count = data.count
                } 
                // Si la respuesta tiene propiedad data (array)
                else if (Array.isArray(data.data)) {
                    count = data.data.length
                }
                // Si la respuesta es directamente un array
                else if (Array.isArray(data)) {
                    count = data.length
                }
                // Si tiene propiedad users (array)
                else if (Array.isArray(data.users)) {
                    count = data.users.length
                }
            }
            
            console.log('Count calculado:', count) // Para debug
            setUsersCount(count)
            
        } catch (error) {
            console.error('Error al cargar estadísticas de usuarios:', error)
            setError('Error al cargar las estadísticas')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadUsersCount()
    }, [])

    const stats = [
        {
            label: 'Usuarios registrados',
            value: loading ? 'Cargando...' : error ? 'Error' : usersCount,
            icon: <FaUserCog className="text-white text-2xl" />,
            color: 'from-purple to-blue',
        },
        {
            label: 'Servicios turísticos',
            value: 38,
            icon: <FaMapMarkedAlt className="text-white text-2xl" />,
            color: 'from-orange to-yellow-400',
        },
        {
            label: 'Recomendaciones generadas',
            value: 482,
            icon: <FaChartBar className="text-white text-2xl" />,
            color: 'from-green to-blue',
        },
    ]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
            {stats.map((stat, i) => (
                <motion.div
                    key={i}
                    data-aos="fade-up"
                    className={`rounded-xl shadow-lg bg-gradient-to-br ${stat.color} text-white p-6 flex items-center gap-4`}
                >
                    <div className="p-4 bg-white/10 rounded-full">
                        {stat.icon}
                    </div>
                    <div>
                        <p className="text-sm opacity-80">{stat.label}</p>
                        <p className="text-2xl font-bold">
                            {stat.value}
                            {i === 0 && !loading && !error && typeof stat.value === 'number' && (
                                <span className="text-sm ml-1 opacity-80">usuarios</span>
                            )}
                        </p>
                        {i === 0 && error && (
                            <p className="text-xs text-red-200 mt-1">{error}</p>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    )
}

export default Stats