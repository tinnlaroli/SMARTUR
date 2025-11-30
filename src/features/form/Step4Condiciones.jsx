// src/features/form/Step4Condiciones.jsx
import React, { useState, useEffect, useRef } from 'react'
import { FaWheelchair, FaArrowLeft, FaCheckCircle } from 'react-icons/fa'

import { useAuth } from '../auth/AuthContext.jsx'
import { useRecommendations } from '../../hooks/useRecommendations.js'
import RecommendationsResultModal from '../../components/common/RecommendationsResultModal.jsx'


const Step4Condiciones = ({ data = {}, onBack, onChange, onClose }) => {
  const { user, token: authToken } = useAuth() || {}
  const token = authToken || localStorage.getItem('token')

  const [accesibilidad, setAccesibilidad] = useState(data.accesibilidad || 'no')
  const [detalleAcc, setDetalleAcc] = useState(data.detalleAcc || '')
  const [visitado, setVisitado] = useState(data.visitado || 'no')

  const { loading, error, data: recData, getRecommendations, cancel } = useRecommendations()
  const [showResults, setShowResults] = useState(false)
  const [recResponse, setRecResponse] = useState(null)
  const [enviado, setEnviado] = useState(false)
  const [apiError, setApiError] = useState(null)
  const isSubmittingRef = useRef(false)

  useEffect(() => {
    return () => {
      if (cancel) cancel()
    }
  }, [cancel])

  const persistLocalFields = () => {
    onChange({
      accesibilidad,
      detalleAcc: accesibilidad === 'si' ? detalleAcc : '',
      visitado,
    })
  }

  const buildContext = () => {
    const d = data || {}

    // Step 2 - Calcular pref_outdoor
    const preferencia_lugar = d.preferencia_lugar || 'indiferente'
    const pref_outdoor = preferencia_lugar === 'aire'

    // Step 3 - Calcular campos derivados
    const services = d.services || []
    const needs_hotel = services.includes('hospedaje')
    const needs_transport = services.includes('transporte')
    const pref_food = services.includes('alimentos')
    const wants_tours = services.includes('tours')

    return {
      edad: d.edad ?? undefined,
      edad_range: d.edad_range,
      presupuesto_daily: d.presupuesto_daily,
      presupuesto_bucket: d.presupuesto_bucket,
      duracion_dias: d.duracion_dias,
      duracion_dias_range: d.duracion_dias_range,
      tiposTurismo: d.tiposTurismo || [],
      actividad_level: d.actividad_level ?? 3,
      preferencia_lugar,
      pref_outdoor,
      group_type: d.group_type,
      services,
      needs_hotel,
      needs_transport,
      pref_food,
      wants_tours,
      accesibilidad: accesibilidad === 'si' ? 'si' : 'no',
      detalleAcc: accesibilidad === 'si' ? detalleAcc : '',
      visitado: visitado === 'si' ? 'si' : 'no',
    }
  }
  const handleFinalizar = () => {
    if (onClose) {
      onClose()
    }
  }

  const handleFinish = async () => {
    // evita multiples clicks
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true

    // persistir local fields al padre
    persistLocalFields()

    // validaciones
    if (!user || !user.id) {
      alert("Debes iniciar sesión.")
      isSubmittingRef.current = false
      return
    }
    const token = localStorage.getItem("token")
    if (!token) {
      alert("Token no encontrado. Reingresa.")
      isSubmittingRef.current = false
      return
    }

    const context = buildContext()
    console.log("[Step4] Enviando context al recommender:", context)

    setEnviado(true)
    setApiError(null)

    try {
      const result = await getRecommendations({
        userId: user.id,
        alpha: data.alpha ?? 0.6,
        candidates: data.candidates ?? 200,
        k_cf: data.k_cf ?? 20,
        context,
        token
      })

      console.log("[Step4] Resultado recibido:", result)
      if (!result) {
        // null => petición abortada
        setApiError("Petición abortada o sin respuesta.")
        setEnviado(false)
        isSubmittingRef.current = false
        return
      }

      if (result && result.recommendations && result.recommendations.length > 0) {
        setRecResponse(result)
        setShowResults(true)
      } else {
        setApiError("No se encontraron recomendaciones con el contexto proporcionado.")
      }
    } catch (err) {
      console.error("[Step4] Error al obtener recomendaciones:", err)
      setApiError(err?.message || String(err))
    } finally {
      setEnviado(false)
      isSubmittingRef.current = false
    }
  }


  // Mostrar modal de resultados si hay recomendaciones
  if (showResults && recResponse && recResponse.recommendations) {
    return (
      <RecommendationsResultModal
        recommendations={recResponse.recommendations}
        userId={recResponse.user_id || user?.id}
        onClose={() => {
          setShowResults(false)
          setRecResponse(null)
          handleFinalizar()
        }}
      />
    )
  }

  // Mostrar spinner mientras se está generando
  if (enviado || loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-6"></div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Pensando en tu experiencia personalizada...</h3>
        <p className="text-sm text-gray-500">Esto puede tardar unos segundos.</p>
        {apiError && (
          <div className="mt-4 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {apiError}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple to-pink rounded-full mb-4">
          <FaWheelchair className="text-2xl text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Condiciones Especiales</h3>
        <p className="text-gray-600">Ayúdanos a personalizar aún más tu experiencia</p>
      </div>

      {/* Accesibilidad */}
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-gray-700">
          ¿Necesitas accesibilidad?
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAccesibilidad('si')}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
              accesibilidad === 'si'
                ? 'bg-gradient-to-r from-green to-green-dark text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
            }`}
          >
            Sí
          </button>
          <button
            onClick={() => setAccesibilidad('no')}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
              accesibilidad === 'no'
                ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
            }`}
          >
            No
          </button>
        </div>
        {accesibilidad === 'si' && (
          <textarea
            value={detalleAcc}
            onChange={(e) => setDetalleAcc(e.target.value)}
            className="w-full mt-2 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent resize-none"
            placeholder="Describe tu requerimiento..."
            rows="3"
          />
        )}
      </div>

      {/* Visitado */}
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-gray-700">
          ¿Has visitado la región antes?
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setVisitado('si')}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
              visitado === 'si'
                ? 'bg-gradient-to-r from-orange to-orange-dark text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
            }`}
          >
            Sí
          </button>
          <button
            onClick={() => setVisitado('no')}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
              visitado === 'no'
                ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
            }`}
          >
            No
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
          onClick={handleFinish}
          disabled={enviado || loading}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
            enviado || loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple to-pink text-white hover:shadow-lg hover:scale-105'
          }`}
        >
          {enviado || loading ? 'Generando...' : 'Finalizar'}
        </button>
      </div>
    </div>
  )
}

export default Step4Condiciones
