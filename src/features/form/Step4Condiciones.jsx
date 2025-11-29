// src/features/form/Step4Condiciones.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaWheelchair,
  FaMapMarkedAlt,
  FaArrowLeft,
  FaCheckCircle,
} from 'react-icons/fa'

import { useAuth } from '../auth/AuthContext.jsx'
import { useRecommendations } from '../../hooks/useRecommendations.js'
import RecommendationsResultModal from '../../components/common/RecommendationsResultModal.jsx'

const Step4Condiciones = ({ data = {}, onBack, onChange, onClose }) => {
  const { user } = useAuth() || {}
  // Obtener token del localStorage (AuthContext lo guarda ahí)
  const token = localStorage.getItem('token')

  // Campos locales del step (UI)
  const [accesibilidad, setAccesibilidad] = useState(data.accesibilidad || 'no')
  const [detalleAcc, setDetalleAcc] = useState(data.detalleAcc || '')
  const [visitado, setVisitado] = useState(data.visitado || 'no')

  const [enviado, setEnviado] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [recResponse, setRecResponse] = useState(null)
  const isSubmittingRef = useRef(false)

  const navigate = useNavigate()

  // hook que realiza la petición (acepta context)
  const { loading, error, data: recData, getRecommendations, cancel } = useRecommendations()

  // cleanup: cancelar petición si el component se desmonta
    useEffect(() => {
      // No cancelar automáticamente en el unmount para evitar abortar la petición
      // Nota: el usuario puede cancelar explícitamente con el botón "Cancelar".
      return () => { /* noop */ }
    }, [])
  

  // guarda en el padre los campos simples de este step
  const persistLocalFields = () => {
    onChange({
      accesibilidad,
      detalleAcc: accesibilidad === 'si' ? detalleAcc : '',
      visitado,
    })
  }

  // Construye el context final a partir de `data` (formData acumulado) + step4
  // Usa SOLO las claves especificadas en los requisitos
  const buildContext = () => {
    const d = data || {}

    // Step 1 - Perfil básico
    const edad = Number(d.edad) || null
    const edad_range = d.edad_range || null
    const presupuesto_daily = Number(d.presupuesto_daily) || null
    const presupuesto_bucket = d.presupuesto_bucket || null
    const duracion_dias = Number(d.duracion_dias) || null
    const duracion_dias_range = d.duracion_dias_range || null

    // Step 2 - Preferencias turísticas
    const tiposTurismo = (d.tiposTurismo && Array.isArray(d.tiposTurismo)) ? d.tiposTurismo : []
    const actividad_level = Number(d.actividad_level) || 3
    const preferencia_lugar = d.preferencia_lugar || 'indiferente'
    const pref_outdoor = preferencia_lugar === 'aire'

    // Step 3 - Contexto del viaje
    const group_type = d.group_type || null
    const services = (d.services && Array.isArray(d.services)) ? d.services : []
    const needs_hotel = services.includes('hospedaje')
    const needs_transport = services.includes('transporte')
    const pref_food = services.includes('alimentos')
    const wants_tours = services.includes('tours')

    // Step 4 - Condiciones especiales (opcional)
    const accesibilidad_value = accesibilidad === 'si' ? 'si' : 'no'
    const detalleAcc_value = accesibilidad === 'si' ? detalleAcc : ''
    const visitado_value = visitado === 'si' ? 'si' : 'no'

    // Context final - SOLO las claves especificadas
    const context = {
      // Step 1
      edad,
      edad_range,
      presupuesto_daily,
      presupuesto_bucket,
      duracion_dias,
      duracion_dias_range,
      
      // Step 2
      tiposTurismo,
      actividad_level,
      preferencia_lugar,
      pref_outdoor,
      
      // Step 3
      group_type,
      services,
      needs_hotel,
      needs_transport,
      pref_food,
      wants_tours,
      
      // Step 4
      accesibilidad: accesibilidad_value,
      detalleAcc: detalleAcc_value,
      visitado: visitado_value,
    }

    // Quitar claves null/undefined para mantener el payload limpio
    Object.keys(context).forEach(k => {
      if (context[k] === null || context[k] === undefined) delete context[k]
    })

    return context
  }

  const handleFinish = async () => {
    // Prevenir múltiples clicks
    if (isSubmittingRef.current) {
      console.log('[Step4] Already submitting, ignoring click')
      return
    }

    // Persistir campos locales del step4
    persistLocalFields()

    // Validar usuario y token
    if (!user || !user.id) {
      alert("Debes iniciar sesión para obtener recomendaciones.")
      return
    }

    if (!token) {
      alert("No se encontró el token de autenticación. Por favor inicia sesión de nuevo.")
      return
    }

    // Construir context final
    const context = buildContext()

    // Validación del context
    if (!context.tiposTurismo || context.tiposTurismo.length === 0) {
      alert("Por favor selecciona al menos un tipo de turismo en el paso 2.")
      return
    }

    if (!context.group_type) {
      alert("Por favor selecciona con quién viajas en el paso 3.")
      return
    }

    if (!context.edad || !context.edad_range || !context.presupuesto_daily || !context.duracion_dias_range) {
      alert("Por favor completa todos los campos obligatorios del paso 1.")
      return
    }

    // Depuración
    console.log("[Step4] Enviando context al recommender:", context)

    // Marcar como enviando
    isSubmittingRef.current = true
    setEnviado(true)
    setApiError(null)

    try {
      // Leer parámetros opcionales dentro del formData
      const alpha = data.alpha ?? 0.6
      const candidates = data.candidates ?? 200
      const k_cf = data.k_cf ?? 20

      // Llamada: getRecommendations acepta context (POST)
      const result = await getRecommendations({
        userId: user.id,
        alpha,
        candidates,
        k_cf,
        token,
        context
      })

      // Guardar resultado en estado local
      if (result && result.recommendations && result.recommendations.length > 0) {
        setRecResponse(result)
        setShowResults(true)
      } else {
        setApiError("No se encontraron recomendaciones. Intenta ajustar tus preferencias.")
      }
    } catch (err) {
      console.error("[Step4] Error al obtener recomendaciones:", err)
      
      // Si fue abortado, no mostrar error
      if (err?.name === "AbortError" || err?.message === "The operation was aborted.") {
        console.log("[Step4] Petición cancelada por el usuario")
        return
      }

      const errorMessage = err?.message || String(err) || "Error al generar recomendaciones. Intenta nuevamente."
      setApiError(errorMessage)

      if (err?.status === 401) {
        alert("Tu sesión expiró. Por favor inicia sesión de nuevo.")
        navigate("/")
      } else {
        alert(errorMessage)
      }
    } finally {
      setEnviado(false)
      isSubmittingRef.current = false
    }
  }

  const handleFinalizar = () => {
    if (onClose) {
      onClose()
    } else {
      navigate('/')
    }
  }

  // Si ya mostramos resultados: renderizar modal con las recomendaciones de la API
  // Usar recResponse (estado local) en lugar de recData del hook
  if (showResults && recResponse && recResponse.recommendations && recResponse.recommendations.length > 0) {
    return (
      <RecommendationsResultModal
        recommendations={recResponse.recommendations}
        userId={recResponse.user_id || user?.id}
        onClose={() => {
          setShowResults(false)
          setRecResponse(null)
          // cerrar todo el modal/form
          handleFinalizar()
        }}
      />
    )
  }

  // Spinner / cancel mientras se ejecuta la petición
  if (enviado || loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-6" />
        <h3 className="text-xl font-semibold text-gray-800">Pensando en tu experiencia personalizada...</h3>
        <p className="text-sm text-gray-500 mt-2">Esto puede tardar unos segundos.</p>
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => {
              console.log('[Step4] Cancel button clicked')
              if (typeof cancel === 'function') {
                cancel()
              }
              setEnviado(false)
              isSubmittingRef.current = false
            }}
            className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
        {apiError && (
          <div className="mt-4 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {apiError}
          </div>
        )}
      </div>
    )
  }

  // UI normal del step (antes de enviar)
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple to-pink rounded-full mb-4">
          <FaWheelchair className="text-2xl text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Condiciones Especiales</h2>
        <p className="text-gray-600">Ayúdanos a personalizar aún más tu experiencia</p>
      </div>

      {/* Accesibilidad */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue/10 rounded-full flex items-center justify-center">
            <FaWheelchair className="text-blue text-sm" />
          </div>
          <label className="text-lg font-semibold text-gray-700">
            ¿Tienes alguna necesidad de accesibilidad o requerimiento especial?
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setAccesibilidad('si')}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${accesibilidad === 'si' ? 'border-green bg-green/10 shadow-lg scale-105' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'}`}
          >
            <div className="text-center space-y-2">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${accesibilidad === 'si' ? 'bg-gradient-to-br from-green to-green-dark' : 'bg-gray-100'}`}>
                <FaCheckCircle className={`text-xl ${accesibilidad === 'si' ? 'text-white' : 'text-gray-600'}`} />
              </div>
              <div className={`font-medium ${accesibilidad === 'si' ? 'text-green-dark' : 'text-gray-700'}`}>Sí</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setAccesibilidad('no')}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${accesibilidad === 'no' ? 'border-gray-500 bg-gray-50 shadow-lg scale-105' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'}`}
          >
            <div className="text-center space-y-2">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${accesibilidad === 'no' ? 'bg-gray-500' : 'bg-gray-100'}`}>
                <span className={`text-xl font-bold ${accesibilidad === 'no' ? 'text-white' : 'text-gray-600'}`}>×</span>
              </div>
              <div className={`font-medium ${accesibilidad === 'no' ? 'text-gray-700' : 'text-gray-700'}`}>No</div>
            </div>
          </button>
        </div>

        {accesibilidad === 'si' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Describe tu requerimiento (opcional)</label>
            <textarea
              value={detalleAcc}
              onChange={(e) => setDetalleAcc(e.target.value)}
              placeholder="Cuéntanos sobre tus necesidades específicas..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent resize-none"
              rows="3"
            />
          </div>
        )}
      </div>

      {/* Experiencia previa */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-orange/10 rounded-full flex items-center justify-center">
            <FaMapMarkedAlt className="text-orange text-sm" />
          </div>
          <label className="text-lg font-semibold text-gray-700">¿Has visitado antes esta región?</label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setVisitado('si')}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${visitado === 'si' ? 'border-orange bg-orange/10 shadow-lg scale-105' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'}`}
          >
            <div className="text-center space-y-2">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${visitado === 'si' ? 'bg-gradient-to-br from-orange to-orange-dark' : 'bg-gray-100'}`}>
                <FaCheckCircle className={`text-xl ${visitado === 'si' ? 'text-white' : 'text-gray-600'}`} />
              </div>
              <div className={`font-medium ${visitado === 'si' ? 'text-orange-dark' : 'text-gray-700'}`}>Sí</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setVisitado('no')}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${visitado === 'no' ? 'border-gray-500 bg-gray-50 shadow-lg scale-105' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'}`}
          >
            <div className="text-center space-y-2">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${visitado === 'no' ? 'bg-gray-500' : 'bg-gray-100'}`}>
                <span className={`text-xl font-bold ${visitado === 'no' ? 'text-white' : 'text-gray-600'}`}>×</span>
              </div>
              <div className={`font-medium ${visitado === 'no' ? 'text-gray-700' : 'text-gray-700'}`}>No</div>
            </div>
          </button>
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
          onClick={handleFinish}
          disabled={enviado || loading}
          className={`px-8 py-3 bg-gradient-to-r from-purple to-pink text-white font-semibold rounded-xl transition-all duration-300 ${
            enviado || loading
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:shadow-lg hover:scale-105'
          }`}
        >
          <span className="flex items-center space-x-2">
            <span>Finalizar</span>
            <FaCheckCircle className="w-5 h-5" />
          </span>
        </button>
      </div>

      {apiError && (
        <div className="mt-4 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
          {apiError}
        </div>
      )}
    </div>
  )
}

export default Step4Condiciones
