// src/features/form/Step2Preferencias.jsx
import React, { useState } from 'react'
import { FaTree, FaArrowLeft, FaArrowRight } from 'react-icons/fa'

const tiposTurismoList = [
  { label: 'Naturaleza', value: 'naturaleza' },
  { label: 'Aventura', value: 'aventura' },
  { label: 'Gastronómico', value: 'gastronomico' },
  { label: 'Cultural', value: 'cultural' },
  { label: 'Rural', value: 'rural' },
]

const Step2Preferencias = ({ data = {}, onNext, onBack, onChange }) => {
  const [tiposTurismo, setTipos] = useState(data.tiposTurismo || [])
  const [actividad_level, setActividad] = useState(data.actividad_level ?? 3)
  const [preferencia_lugar, setPreferenciaLugar] = useState(data.preferencia_lugar || 'indiferente')

  const toggleTipo = (v) => {
    setTipos((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))
  }

  const handleNext = () => {
    // Validación: al menos un tipo seleccionado
    if (!tiposTurismo.length) return

    const payload = {
      tiposTurismo, // array[string]
      actividad_level: Number(actividad_level), // int 1..5
      preferencia_lugar, // string
      pref_outdoor: preferencia_lugar === 'aire' // boolean derivado
    }

    onChange(payload)
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green to-blue rounded-full mb-4">
          <FaTree className="text-2xl text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Preferencias</h3>
        <p className="text-gray-600">Selecciona tus intereses para personalizar las recomendaciones</p>
      </div>

      {/* Tipos de turismo */}
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-gray-700">
          Tipos de turismo (elige al menos 1)
        </label>
        <div className="flex flex-wrap gap-2">
          {tiposTurismoList.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => toggleTipo(t.value)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                tiposTurismo.includes(t.value)
                  ? 'bg-gradient-to-r from-green to-blue text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Nivel de actividad */}
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-gray-700">Nivel de actividad</label>
        <div className="bg-gradient-to-r from-orange/5 to-pink/5 p-4 rounded-xl border border-gray-100">
          <input
            type="range"
            min={1}
            max={5}
            value={actividad_level}
            onChange={(e) => setActividad(Number(e.target.value))}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="text-right mt-2">
            <span className="text-2xl font-bold text-purple">Nivel: {actividad_level}</span>
          </div>
        </div>
      </div>

      {/* Preferencia de lugar */}
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-gray-700">
          Preferencia: aire libre / cerrado / indiferente
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPreferenciaLugar('aire')}
            type="button"
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
              preferencia_lugar === 'aire'
                ? 'bg-gradient-to-r from-blue to-green text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
            }`}
          >
            Aire libre
          </button>
          <button
            onClick={() => setPreferenciaLugar('cerrado')}
            type="button"
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
              preferencia_lugar === 'cerrado'
                ? 'bg-gradient-to-r from-purple to-blue text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
            }`}
          >
            Cerrado
          </button>
          <button
            onClick={() => setPreferenciaLugar('indiferente')}
            type="button"
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
              preferencia_lugar === 'indiferente'
                ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
            }`}
          >
            Indiferente
          </button>
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
          disabled={!tiposTurismo.length}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
            tiposTurismo.length
              ? 'bg-gradient-to-r from-green to-blue text-white hover:shadow-lg hover:scale-105'
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

export default Step2Preferencias
