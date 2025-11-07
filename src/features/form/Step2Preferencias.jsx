import React, { useState } from 'react'
import { 
  FaTree, FaMountain, FaLeaf, FaHome, FaUtensils, FaLandmark, FaChurch, FaUsers, FaBriefcase, FaHeartbeat,
  FaArrowLeft, FaArrowRight, FaSun, FaBuilding, FaQuestion,
  FaRegSmile, FaWalking, FaBiking, FaRunning, FaDumbbell
} from 'react-icons/fa'

const tiposTurismo = [
  { label: 'Naturaleza', value: 'naturaleza', icon: FaTree, color: 'green' },
  { label: 'Aventura', value: 'aventura', icon: FaMountain, color: 'orange' },
  { label: 'Ecoturismo', value: 'ecoturismo', icon: FaLeaf, color: 'green' },
  { label: 'Rural', value: 'rural', icon: FaHome, color: 'brown' },
  { label: 'Gastronómico', value: 'gastronomico', icon: FaUtensils, color: 'orange' },
  { label: 'Cultural', value: 'cultural', icon: FaLandmark, color: 'purple' },
  { label: 'Religioso', value: 'religioso', icon: FaChurch, color: 'blue' },
  { label: 'Reuniones', value: 'reuniones', icon: FaUsers, color: 'pink' },
  { label: 'Negocios', value: 'negocios', icon: FaBriefcase, color: 'gray' },
  { label: 'Salud', value: 'salud', icon: FaHeartbeat, color: 'red' },
]

const actividadNiveles = [
  { label: 'Relajado', value: 1, icon: FaRegSmile, desc: 'Actividades tranquilas' },
  { label: 'Suave', value: 2, icon: FaWalking, desc: 'Paseos ligeros' },
  { label: 'Moderado', value: 3, icon: FaBiking, desc: 'Actividades balanceadas' },
  { label: 'Activo', value: 4, icon: FaRunning, desc: 'Ejercicio moderado' },
  { label: 'Intenso', value: 5, icon: FaDumbbell, desc: 'Aventuras extremas' },
]

const preferenciasLugar = [
  { label: 'Aire libre', value: 'aire', icon: FaSun, color: 'yellow' },
  { label: 'Espacios cerrados', value: 'cerrado', icon: FaBuilding, color: 'blue' },
  { label: 'Indiferente', value: 'indiferente', icon: FaQuestion, color: 'gray' },
]

const Step2Preferencias = ({ data, onNext, onBack, onChange }) => {
  const [tipos, setTipos] = useState(data.tiposTurismo || [])
  const [actividad, setActividad] = useState(data.actividad || 3)
  const [preferencia, setPreferencia] = useState(data.preferencia || '')

  const toggleTipo = (value) => {
    setTipos((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    )
  }

  const handleNext = () => {
    if (tipos.length && preferencia) {
      onChange({ tiposTurismo: tipos, actividad, preferencia })
      onNext()
    }
  }

  const getColorClasses = (color) => {
    const colorMap = {
      green: 'from-green-400 to-green-600',
      orange: 'from-orange-400 to-orange-600',
      brown: 'from-yellow-600 to-orange-800',
      purple: 'from-purple-400 to-purple-600',
      blue: 'from-blue-400 to-blue-600',
      pink: 'from-pink-400 to-pink-600',
      gray: 'from-gray-400 to-gray-600',
      red: 'from-red-400 to-red-600',
      yellow: 'from-yellow-400 to-yellow-600'
    }
    return colorMap[color] || 'from-gray-400 to-gray-600'
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green to-blue rounded-full mb-4">
          <FaTree className="text-2xl text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Preferencias Turísticas</h2>
        <p className="text-gray-600">Selecciona tus intereses para personalizar las recomendaciones</p>
      </div>

      {/* Tipos de turismo */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-green/10 rounded-full flex items-center justify-center">
            <FaTree className="text-green text-sm" />
          </div>
          <label className="text-lg font-semibold text-gray-700">¿Qué tipo de turismo te interesa más?</label>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {tiposTurismo.map((t) => {
            const IconComponent = t.icon
            const isSelected = tipos.includes(t.value)
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => toggleTipo(t.value)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 group ${
                  isSelected
                    ? `border-${t.color}-500 bg-${t.color}-50 shadow-lg scale-105`
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="text-center space-y-3">
                  <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                    isSelected 
                      ? `bg-gradient-to-br ${getColorClasses(t.color)}` 
                      : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <IconComponent className={`text-xl ${
                      isSelected ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className={`font-medium text-sm ${
                    isSelected ? `text-${t.color}-700` : 'text-gray-700'
                  }`}>
                    {t.label}
                  </div>
                </div>
                {isSelected && (
                  <div className={`absolute -top-2 -right-2 w-6 h-6 bg-${t.color}-500 rounded-full flex items-center justify-center`}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Nivel de actividad */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-orange/10 rounded-full flex items-center justify-center">
            <FaMountain className="text-orange text-sm" />
          </div>
          <label className="text-lg font-semibold text-gray-700">¿Qué tan activo quieres que sea tu viaje?</label>
        </div>
        
        <div className="bg-gradient-to-r from-orange/5 to-red/5 p-6 rounded-xl border border-gray-100">
          <div className="flex justify-between items-center space-x-2">
            {actividadNiveles.map((a) => {
              const IconComponent = a.icon
              return (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setActividad(a.value)}
                  className={`flex flex-col items-center space-y-2 p-3 rounded-lg transition-all duration-300 ${
                    actividad === a.value
                      ? 'bg-white shadow-lg scale-110 border-2 border-orange'
                      : 'hover:bg-white/50 hover:shadow-md'
                  }`}
                >
                  <div className="text-3xl"><IconComponent /></div>
                  <div className={`text-xs font-medium text-center ${
                    actividad === a.value ? 'text-orange' : 'text-gray-600'
                  }`}>
                    {a.label}
                  </div>
                  <div className="text-xs text-gray-500 text-center hidden sm:block">
                    {a.desc}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Preferencia de lugar */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue/10 rounded-full flex items-center justify-center">
            <FaSun className="text-blue text-sm" />
          </div>
          <label className="text-lg font-semibold text-gray-700">
            ¿Prefieres actividades al aire libre o en espacios cerrados?
          </label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {preferenciasLugar.map((p) => {
            const IconComponent = p.icon
            const isSelected = preferencia === p.value
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setPreferencia(p.value)}
                className={`relative p-6 rounded-xl border-2 transition-all duration-300 group ${
                  isSelected
                    ? `border-${p.color}-500 bg-${p.color}-50 shadow-lg scale-105`
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="text-center space-y-3">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                    isSelected 
                      ? `bg-gradient-to-br ${getColorClasses(p.color)}` 
                      : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <IconComponent className={`text-2xl ${
                      isSelected ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className={`font-medium ${
                    isSelected ? `text-${p.color}-700` : 'text-gray-700'
                  }`}>
                    {p.label}
                  </div>
                </div>
                {isSelected && (
                  <div className={`absolute -top-2 -right-2 w-6 h-6 bg-${p.color}-500 rounded-full flex items-center justify-center`}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Botones de navegación */}
      <div className="flex justify-between pt-6">
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
          disabled={!(tipos.length && preferencia)}
          className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform ${
            tipos.length && preferencia
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
