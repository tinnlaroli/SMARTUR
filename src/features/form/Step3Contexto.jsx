// src/features/form/Step3Contexto.jsx
import React, { useState } from 'react'
import { FaUsers, FaArrowLeft, FaArrowRight } from 'react-icons/fa'

const companyOptions = [
  { label: 'Solo', value: 'solo' },
  { label: 'Pareja', value: 'pareja' },
  { label: 'Familia', value: 'familia' },
  { label: 'Amigos', value: 'amigos' },
]

const servicesList = [
  { label: 'Hospedaje', value: 'hospedaje' },
  { label: 'Transporte', value: 'transporte' },
  { label: 'Alimentos', value: 'alimentos' },
  { label: 'Tours', value: 'tours' },
]

const Step3Contexto = ({ data = {}, onNext, onBack, onChange }) => {
  const [group_type, setGroupType] = useState(data.group_type || '')
  const [services, setServices] = useState(data.services || [])

  const toggleService = (v) => {
    setServices((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))
  }

  const handleNext = () => {
    // Validación mínima: require group_type
    if (!group_type) return

    // Derived flags
    const needs_hotel = services.includes('hospedaje')
    const needs_transport = services.includes('transporte')
    const pref_food = services.includes('alimentos')
    const wants_tours = services.includes('tours')

    const payload = {
      group_type,
      services,
      needs_hotel,
      needs_transport,
      pref_food,
      wants_tours,
    }

    onChange(payload)
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple to-pink rounded-full mb-4">
          <FaUsers className="text-2xl text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Contexto del Viaje</h3>
        <p className="text-gray-600">Cuéntanos sobre tu compañía y servicios preferidos</p>
      </div>

      {/* Viajas con */}
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-gray-700">Viajas con</label>
        <div className="flex flex-wrap gap-2">
          {companyOptions.map((c) => (
            <button
              key={c.value}
              onClick={() => setGroupType(c.value)}
              type="button"
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                group_type === c.value
                  ? 'bg-gradient-to-r from-purple to-pink text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Servicios */}
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-gray-700">
          Servicios que quieres incluir
        </label>
        <div className="flex flex-wrap gap-2">
          {servicesList.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => toggleService(s.value)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                services.includes(s.value)
                  ? 'bg-gradient-to-r from-green to-blue text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Botones de navegación */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
        >
          <span className="flex items-center space-x-2">
            <FaArrowLeft className="w-4 h-4" />
            <span>Atrás</span>
          </span>
        </button>
        <button
          onClick={handleNext}
          disabled={!group_type}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
            group_type
              ? 'bg-gradient-to-r from-purple to-pink text-white hover:shadow-lg hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span className="flex items-center space-x-2">
            <span>Siguiente</span>
            <FaArrowRight className="w-4 h-4" />
          </span>
        </button>
      </div>
    </div>
  )
}

export default Step3Contexto
