// src/features/form/Step1PerfilBasico.jsx
import React, { useState } from 'react'
import { FaUser, FaMoneyBillWave, FaClock } from 'react-icons/fa'

const edadOptions = [
  { label: '18-25', value: '18-25' },
  { label: '26-35', value: '26-35' },
  { label: '36-45', value: '36-45' },
  { label: '46-60', value: '46-60' },
  { label: '60+', value: '60+' }
]

const duracionOptions = [
  { label: '1-2', value: '1-2' },
  { label: '3-5', value: '3-5' },
  { label: '6-10', value: '6-10' },
  { label: '10+', value: '10+' }
]

/**
 * Helper mapping functions
 */
const edadRangeToApprox = (range) => {
  if (!range) return null
  if (range === '60+') return 65
  const [a, b] = range.split('-').map(Number)
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  return Math.round((a + b) / 2)
}

const diasRangeToDays = (range) => {
  if (!range) return null
  if (range === '10+') return 14
  const [a, b] = range.split('-').map(Number)
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  return Math.round((a + b) / 2)
}

/**
 * Map numeric daily budget to bucket (low/med/high).
 */
const presupuestoToBucket = (mxnPerDay) => {
  if (mxnPerDay < 700) return 'low'
  if (mxnPerDay < 2000) return 'med'
  return 'high'
}

const Step1PerfilBasico = ({ data = {}, onNext, onChange }) => {
  const [edad_range, setEdadRange] = useState(data.edad_range || '')
  const [presupuesto_daily, setPresupuestoDaily] = useState(data.presupuesto_daily ?? 500)
  const [duracion_dias_range, setDuracionDiasRange] = useState(data.duracion_dias_range || '')

  const handleNext = () => {
    // Validaciones mínimas
    if (!edad_range || !presupuesto_daily || !duracion_dias_range) return

    // Calcular valores derivados
    const edad = edadRangeToApprox(edad_range)
    const duracion_dias = diasRangeToDays(duracion_dias_range)
    const presupuesto_bucket = presupuestoToBucket(presupuesto_daily)

    // Pasar campos clave
    onChange({
      edad,
      edad_range,
      presupuesto_daily: Number(presupuesto_daily),
      presupuesto_bucket,
      duracion_dias,
      duracion_dias_range
    })

    onNext()
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple to-blue rounded-full mb-4">
          <FaUser className="text-2xl text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Perfil Básico</h3>
        <p className="text-gray-600">Cuéntanos sobre ti para personalizar tu experiencia</p>
      </div>

      {/* Rango de edad */}
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-orange/10 rounded-full flex items-center justify-center">
            <FaUser className="text-orange text-sm" />
          </div>
          <label className="block text-lg font-semibold text-gray-700">Rango de edad</label>
        </div>
        <div className="flex flex-wrap gap-2">
          {edadOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setEdadRange(o.value)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                edad_range === o.value
                  ? 'bg-gradient-to-r from-purple to-blue text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Presupuesto diario */}
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-green/10 rounded-full flex items-center justify-center">
            <FaMoneyBillWave className="text-green text-sm" />
          </div>
          <label className="block text-lg font-semibold text-gray-700">Presupuesto diario (MXN)</label>
        </div>
        <div className="bg-gradient-to-r from-green/5 to-blue/5 p-4 rounded-xl border border-gray-100">
          <input
            type="range"
            min={100}
            max={5000}
            step={50}
            value={presupuesto_daily}
            onChange={(e) => setPresupuestoDaily(Number(e.target.value))}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="text-right mt-2">
            <div className="text-2xl font-bold text-purple">{formatCurrency(presupuesto_daily)}</div>
            <div className="text-sm text-gray-500">por día</div>
          </div>
        </div>
      </div>

      {/* Duración */}
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue/10 rounded-full flex items-center justify-center">
            <FaClock className="text-blue text-sm" />
          </div>
          <label className="block text-lg font-semibold text-gray-700">Duración (rango)</label>
        </div>
        <div className="flex flex-wrap gap-2">
          {duracionOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setDuracionDiasRange(o.value)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                duracion_dias_range === o.value
                  ? 'bg-gradient-to-r from-blue to-purple text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Botón siguiente */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleNext}
          disabled={!(edad_range && presupuesto_daily && duracion_dias_range)}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
            edad_range && presupuesto_daily && duracion_dias_range
              ? 'bg-gradient-to-r from-purple to-blue text-white hover:shadow-lg hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
export default Step1PerfilBasico





