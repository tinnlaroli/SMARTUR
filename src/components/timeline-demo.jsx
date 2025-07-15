import React from 'react'
import { Timeline } from '../components/ui/timeline'
import { FaAward, FaRobot, FaUsers, FaMapMarkedAlt } from 'react-icons/fa'

export default function TimelineDemo() {
  // Datos de hitos SMARTUR
  const data = [
    {
      title: '2024',
      content: (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple to-orange rounded-full flex items-center justify-center mb-4 shadow-lg">
            <FaAward className="text-white text-3xl" />
          </div>
          <p className="mb-4 text-sm font-semibold text-purple">
            Galardón Turístico Veracruz
          </p>
          <p className="mb-6 text-xs font-normal text-gray-700">
            SMARTUR es reconocido como proyecto ganador del Galardón Turístico
            "Mi Veracruz 2024" por su innovación en el sector turístico.
          </p>
          <img
            src="/src/assets/galardon.png"
            alt="Galardón Turístico Veracruz"
            className="h-24 w-auto rounded-lg object-contain shadow-md bg-white"
          />
        </div>
      ),
    },
    {
      title: '2024',
      content: (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue to-purple rounded-full flex items-center justify-center mb-4 shadow-lg">
            <FaRobot className="text-white text-3xl" />
          </div>
          <p className="mb-4 text-sm font-semibold text-blue">
            Innovación con IA
          </p>
          <p className="mb-6 text-xs font-normal text-gray-700">
            Implementación de chatbot inteligente para mejorar la experiencia de
            los turistas y la gestión hotelera en Veracruz.
          </p>
          <img
            src="/src/assets/smartur_logo.png"
            alt="Logo SMARTUR"
            className="h-20 w-auto rounded-lg object-contain shadow-md bg-white"
          />
        </div>
      ),
    },
    {
      title: '2025',
      content: (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange to-yellow-400 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <FaUsers className="text-white text-3xl" />
          </div>
          <p className="mb-4 text-sm font-semibold text-orange">
            ExpoCiencias Nacional
          </p>
          <p className="mb-6 text-xs font-normal text-gray-700">
            SMARTUR obtiene pase a ExpoCiencias Nacional 2025 en Tamaulipas,
            representando a Veracruz a nivel nacional.
          </p>
          <img
            src="/src/assets/exp_nacional.png"
            alt="ExpoCiencias Nacional"
            className="h-20 w-auto rounded-lg object-contain shadow-md bg-white"
          />
        </div>
      ),
    },
    {
      title: 'Futuro',
      content: (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green to-blue rounded-full flex items-center justify-center mb-4 shadow-lg">
            <FaMapMarkedAlt className="text-white text-3xl" />
          </div>
          <p className="mb-4 text-sm font-semibold text-green">
            Expansión y crecimiento
          </p>
          <p className="mb-6 text-xs font-normal text-gray-700">
            Buscamos expandir SMARTUR a más regiones y seguir innovando en el
            turismo digital.
          </p>
        </div>
      ),
    },
  ]

  return (
    <div className="relative w-full overflow-clip py-8 px-2 sm:px-8 bg-gray-50 rounded-3xl shadow-xl">
      {/* Encabezado */}
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-purple drop-shadow-lg animate-fadeInUp">
          Nuestra historia SMARTUR
        </h2>
        <p className="text-gray-700 text-base sm:text-lg font-medium animate-fadeInUp">
          Conoce los hitos y logros más importantes de nuestro equipo y
          plataforma.
        </p>
      </div>
      {/* Línea del tiempo */}
      <Timeline data={data} />
    </div>
  )
}
