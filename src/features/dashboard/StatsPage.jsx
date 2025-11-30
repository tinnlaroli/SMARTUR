import React from 'react'
import { motion } from 'framer-motion'
import { FaUserCog, FaMapMarkedAlt, FaChartBar } from 'react-icons/fa'

export default function StatsPage() {
    const stats = [
        {
            label: 'Usuarios registrados',
            value: 156,
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
                            {i === 0 && (
                                <span className="text-sm ml-1 opacity-80">
                                    usuarios
                                </span>
                            )}
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}

