import React, { useState } from 'react'
import { 
  FaUser, 
  FaHeart, 
  FaUsers, 
  FaUserFriends, 
  FaBriefcase,
  FaBed,
  FaBus,
  FaUtensils,
  FaMapMarkedAlt,
  FaArrowLeft,
  FaArrowRight
} from 'react-icons/fa'

const compania = [
  { label: 'Solo/a', value: 'solo', icon: FaUser, color: 'blue', desc: 'Viaje individual' },
  { label: 'En pareja', value: 'pareja', icon: FaHeart, color: 'pink', desc: 'Viaje romántico' },
  { label: 'En familia', value: 'familia', icon: FaUsers, color: 'green', desc: 'Viaje familiar' },
  { label: 'Con amigos', value: 'amigos', icon: FaUserFriends, color: 'orange', desc: 'Viaje grupal' },
  { label: 'Grupo laboral', value: 'laboral', icon: FaBriefcase, color: 'purple', desc: 'Viaje de trabajo' },
]

const servicios = [
  { label: 'Hospedaje', value: 'hospedaje', icon: FaBed, color: 'blue', desc: 'Hoteles y alojamiento' },
  { label: 'Transporte', value: 'transporte', icon: FaBus, color: 'green', desc: 'Movilidad local' },
  { label: 'Alimentos', value: 'alimentos', icon: FaUtensils, color: 'orange', desc: 'Restaurantes y gastronomía' },
  { label: 'Tours guiados', value: 'tours', icon: FaMapMarkedAlt, color: 'purple', desc: 'Excursiones organizadas' },
]

const Step3Contexto = ({ data, onNext, onBack, onChange }) => {
  const [viajaCon, setViajaCon] = useState(data.viajaCon || '')
  const [servs, setServs] = useState(data.servicios || [])

  const toggleServicio = (value) => {
    setServs((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    )
  }

  const handleNext = () => {
    if (viajaCon) {
      onChange({ viajaCon, servicios: servs })
      onNext()
    }
  }

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'from-blue-400 to-blue-600',
      pink: 'from-pink-400 to-pink-600',
      green: 'from-green-400 to-green-600',
      orange: 'from-orange-400 to-orange-600',
      purple: 'from-purple-400 to-purple-600'
    }
    return colorMap[color] || 'from-gray-400 to-gray-600'
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple to-pink rounded-full mb-4">
          <FaUsers className="text-2xl text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Contexto del Viaje</h2>
        <p className="text-gray-600">Cuéntanos sobre tu compañía y servicios preferidos</p>
      </div>

      {/* Compañía de viaje */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-purple/10 rounded-full flex items-center justify-center">
            <FaUsers className="text-purple text-sm" />
          </div>
          <label className="text-lg font-semibold text-gray-700">¿Viajas solo o acompañado?</label>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {compania.map((c) => {
            const IconComponent = c.icon
            const isSelected = viajaCon === c.value
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setViajaCon(c.value)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 group ${
                  isSelected
                    ? `border-${c.color}-500 bg-${c.color}-50 shadow-lg scale-105`
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="text-center space-y-3">
                  <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                    isSelected 
                      ? `bg-gradient-to-br ${getColorClasses(c.color)}` 
                      : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <IconComponent className={`text-xl ${
                      isSelected ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className={`font-medium text-sm ${
                    isSelected ? `text-${c.color}-700` : 'text-gray-700'
                  }`}>
                    {c.label}
                  </div>
                  <div className="text-xs text-gray-500 hidden sm:block">
                    {c.desc}
                  </div>
                </div>
                {isSelected && (
                  <div className={`absolute -top-2 -right-2 w-6 h-6 bg-${c.color}-500 rounded-full flex items-center justify-center`}>
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

      {/* Servicios adicionales */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-green/10 rounded-full flex items-center justify-center">
            <FaBed className="text-green text-sm" />
          </div>
          <label className="text-lg font-semibold text-gray-700">¿Te gustaría incluir en tu experiencia…?</label>
        </div>
        
        <div className="bg-gradient-to-r from-green/5 to-blue/5 p-6 rounded-xl border border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {servicios.map((s) => {
              const IconComponent = s.icon
              const isSelected = servs.includes(s.value)
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => toggleServicio(s.value)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-300 group ${
                    isSelected
                      ? `border-${s.color}-500 bg-${s.color}-50 shadow-lg scale-105`
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="text-center space-y-3">
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                      isSelected 
                        ? `bg-gradient-to-br ${getColorClasses(s.color)}` 
                        : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}>
                      <IconComponent className={`text-xl ${
                        isSelected ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className={`font-medium text-sm ${
                      isSelected ? `text-${s.color}-700` : 'text-gray-700'
                    }`}>
                      {s.label}
                    </div>
                    <div className="text-xs text-gray-500 hidden sm:block">
                      {s.desc}
                    </div>
                  </div>
                  {isSelected && (
                    <div className={`absolute -top-2 -right-2 w-6 h-6 bg-${s.color}-500 rounded-full flex items-center justify-center`}>
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          
          {servs.length > 0 && (
            <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">Servicios seleccionados:</div>
              <div className="flex flex-wrap gap-2">
                {servs.map((servicio) => {
                  const servicioInfo = servicios.find(s => s.value === servicio)
                  return (
                    <span
                      key={servicio}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {servicioInfo?.label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
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
          disabled={!viajaCon}
          className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform ${
            viajaCon
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
