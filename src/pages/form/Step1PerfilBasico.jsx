import React, { useState } from 'react'
import { 
  FaUser, FaCalendarAlt, FaMoneyBillWave, FaClock, 
  FaUserGraduate, FaUserTie, FaUsers, FaUserAlt, FaUserClock,
  FaSun, FaCloudSun, FaUmbrellaBeach, FaMapMarkedAlt
} from 'react-icons/fa'

const edades = [
  { label: '18-25 años', value: '18-25', icon: FaUserGraduate },
  { label: '26-35 años', value: '26-35', icon: FaUserTie },
  { label: '36-45 años', value: '36-45', icon: FaUsers },
  { label: '46-60 años', value: '46-60', icon: FaUserAlt },
  { label: '60+ años', value: '60+', icon: FaUserClock },
]

const dias = [
  { label: '1-2 días', value: '1-2', icon: FaSun },
  { label: '3-5 días', value: '3-5', icon: FaCloudSun },
  { label: '6-10 días', value: '6-10', icon: FaUmbrellaBeach },
  { label: 'Más de 10', value: '10+', icon: FaMapMarkedAlt },
]

const Step1PerfilBasico = ({ data, onNext, onChange }) => {
  const [edad, setEdad] = useState(data.edad || '')
  const [presupuesto, setPresupuesto] = useState(data.presupuesto || 200)
  const [diasEstancia, setDiasEstancia] = useState(data.diasEstancia || '')

  const handleNext = () => {
    if (edad && presupuesto && diasEstancia) {
      onChange({ edad, presupuesto, diasEstancia })
      onNext()
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple to-blue rounded-full mb-4">
          <FaUser className="text-2xl text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Perfil Básico</h2>
        <p className="text-gray-600">Cuéntanos sobre ti para personalizar tu experiencia</p>
      </div>

      {/* Edad */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-orange/10 rounded-full flex items-center justify-center">
            <FaUser className="text-orange text-sm" />
          </div>
          <label className="text-lg font-semibold text-gray-700">¿Cuál es tu rango de edad?</label>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {edades.map((e) => {
            const IconComponent = e.icon
            return (
              <button
                key={e.value}
                type="button"
                onClick={() => setEdad(e.value)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 group ${
                  edad === e.value
                    ? 'border-purple bg-purple/5 shadow-lg scale-105'
                    : 'border-gray-200 bg-white hover:border-orange hover:bg-orange/5 hover:shadow-md'
                }`}
              >
                <div className="text-center space-y-2">
                  <div className="text-2xl"><IconComponent /></div>
                  <div className={`font-medium ${
                    edad === e.value ? 'text-purple' : 'text-gray-700'
                  }`}>
                    {e.label}
                  </div>
                </div>
                {edad === e.value && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple rounded-full flex items-center justify-center">
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

      {/* Presupuesto */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-green/10 rounded-full flex items-center justify-center">
            <FaMoneyBillWave className="text-green text-sm" />
          </div>
          <label className="text-lg font-semibold text-gray-700">¿Cuál es tu presupuesto diario?</label>
        </div>
        
        <div className="bg-gradient-to-r from-green/5 to-blue/5 p-6 rounded-xl border border-gray-100">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Presupuesto mínimo</span>
              <span className="text-sm text-gray-600">Presupuesto máximo</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={200}
                max={3000}
                step={50}
                value={presupuesto}
                onChange={(e) => setPresupuesto(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="absolute inset-0 h-3 bg-gradient-to-r from-green to-blue rounded-lg pointer-events-none opacity-20"></div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple">{formatCurrency(presupuesto)}</div>
              <div className="text-sm text-gray-500">por día</div>
            </div>
          </div>
        </div>
      </div>

      {/* Días de estancia */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue/10 rounded-full flex items-center justify-center">
            <FaClock className="text-blue text-sm" />
          </div>
          <label className="text-lg font-semibold text-gray-700">¿Cuántos días planeas quedarte?</label>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {dias.map((d) => {
            const IconComponent = d.icon
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => setDiasEstancia(d.value)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 group ${
                  diasEstancia === d.value
                    ? 'border-blue bg-blue/5 shadow-lg scale-105'
                    : 'border-gray-200 bg-white hover:border-blue hover:bg-blue/5 hover:shadow-md'
                }`}
              >
                <div className="text-center space-y-2">
                  <div className="text-2xl"><IconComponent /></div>
                  <div className={`font-medium ${
                    diasEstancia === d.value ? 'text-blue' : 'text-gray-700'
                  }`}>
                    {d.label}
                  </div>
                </div>
                {diasEstancia === d.value && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue rounded-full flex items-center justify-center">
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

      {/* Botón siguiente */}
      <div className="flex justify-end pt-6">
        <button
          onClick={handleNext}
          disabled={!(edad && presupuesto && diasEstancia)}
          className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform ${
            edad && presupuesto && diasEstancia
              ? 'bg-gradient-to-r from-purple to-blue text-white hover:shadow-lg hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span className="flex items-center space-x-2">
            <span>Siguiente</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  )
}
export default Step1PerfilBasico

