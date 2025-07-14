import React, { useEffect, useState } from 'react'
import {
  FaUserCog, FaTools, FaBrain, FaSignOutAlt,
  FaChartBar, FaUsers, FaMapMarkedAlt, FaClipboardCheck
} from 'react-icons/fa'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { motion } from 'framer-motion'
import smarturLogo from '../assets/smartur_logo.png'
import LineamientosModal from '../components/LineamientosModal'

export default function Dashboard() {
  const [showLineamientosModal, setShowLineamientosModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
  }, [])

  const panels = [
    { title: 'Gestión de usuarios', icon: <FaUsers className="text-3xl text-green" />, color: 'from-purple/10 to-purple/5' },
    { title: 'Gestión de servicios', icon: <FaTools className="text-3xl text-orange" />, color: 'from-orange/10 to-orange/5' },
    { title: 'Evaluación IA', icon: <FaBrain className="text-3xl text-pink" />, color: 'from-blue/10 to-blue/5' },
  ]

  const stats = [
    { label: 'Usuarios registrados', value: 154, icon: <FaUserCog className="text-white text-2xl" />, color: 'from-purple to-blue' },
    { label: 'Servicios turísticos', value: 38, icon: <FaMapMarkedAlt className="text-white text-2xl" />, color: 'from-orange to-yellow-400' },
    { label: 'Recomendaciones generadas', value: 482, icon: <FaChartBar className="text-white text-2xl" />, color: 'from-green to-blue' },
  ]

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[auto,1fr] font-sans text-gray-700">

      {/* Menú lateral */}
      <aside className={`
  fixed lg:static z-50 top-0 left-0 h-full w-64 bg-gradient-to-br from-purple to-blue text-white shadow-xl rounded-r-3xl
  transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
  lg:translate-x-0 transition-transform duration-300 ease-in-out
  flex flex-col
`}>
  {/* Encabezado del logo */}
  <div className="p-6 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <img src={smarturLogo} className="h-10 w-10 rounded-full bg-white shadow" alt="Logo" />
      <span className="text-xl font-bold">SMARTUR</span>
    </div>
    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white text-2xl">
      ✕
    </button>
  </div>

  {/* Navegación (se expande automáticamente) */}
  <div className="flex-grow overflow-y-auto px-6 pb-6">
    <nav className="flex flex-col gap-2">
      {panels.map((panel, i) => (
        <button key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/10 transition-all">
          {panel.icon}
          <span>{panel.title}</span>
        </button>
      ))}
      <button
        onClick={() => setShowLineamientosModal(true)}
        className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/10 transition-all"
      >
        <FaClipboardCheck className="text-2xl text-yellow-300" />
        <span>Lineamientos Restauranteros</span>
      </button>
    </nav>
  </div>

  {/* Botón fijo abajo */}
  <div className="p-6 border-t border-white/10">
    <button className="flex items-center gap-2 bg-orange hover:bg-orange/90 text-white py-2 px-4 rounded-full shadow transition-all w-full justify-center">
      <FaSignOutAlt /> Cerrar sesión
    </button>
  </div>
</aside>


      {/* Panel principal */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto relative">

        {/* Botón hamburguesa */}
        <button
          className="lg:hidden absolute top-4 left-4 bg-purple text-white p-2 rounded-md z-40 shadow"
          onClick={() => setSidebarOpen(true)}
        >
          ☰
        </button>

        {/* Encabezado */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple to-blue drop-shadow-xl mb-10"
        >
          Panel de administración
        </motion.h1>

        {/* Estadísticas */}
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
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Paneles */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {panels.map((panel, i) => (
            <motion.div
              key={i}
              data-aos="fade-up"
              data-aos-delay={i * 100}
              className={`bg-gradient-to-br ${panel.color} p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer`}
            >
              <div className="text-center">
                <div className="flex justify-center mb-4">{panel.icon}</div>
                <h3 className="text-xl font-bold">{panel.title}</h3>
                <p className="text-gray-600 mt-2">Ir al módulo de {panel.title.toLowerCase()}.</p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Modal de Lineamientos */}
      {showLineamientosModal && (
        <LineamientosModal onClose={() => setShowLineamientosModal(false)} />
      )}
    </div>
  )
}
