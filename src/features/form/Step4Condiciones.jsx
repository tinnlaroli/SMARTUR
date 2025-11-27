// src/features/form/Step4Condiciones.jsx
import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaWheelchair,
  FaMapMarkedAlt,
  FaArrowLeft,
  FaCheckCircle,
  FaStar,
  FaMoneyBillWave,
  FaClock
} from 'react-icons/fa'

/**
 * Ajusta las rutas si tus archivos están en otra carpeta.
 * Se asume:
 *  - useAuth exporta { user, token } o similar
 *  - useRecommendations está en src/hooks/useRecommendations.js
 *  - RecommendationsResultModal en src/components/common/RecommendationsResultModal.jsx
 */
import { useAuth } from '../auth/AuthContext.jsx'
import { useRecommendations } from '../../hooks/useRecommendations.js'
import RecommendationsResultModal from '../../components/common/RecommendationsResultModal.jsx'

// Ruta local del manual (dev). En prod usa el endpoint backend.
const MANUAL_LOCAL_PATH = "/mnt/data/AISE-29-AISE210101-1.pdf"

const Step4Condiciones = ({ data = {}, onBack, onChange, onClose }) => {
  const { user, token: authToken } = useAuth() || {} // adapta a tu AuthContext
  // fallback al token en localStorage si tu AuthContext no lo expone
  const token = authToken || localStorage.getItem('token')

  // Campos locales del step (UI)
  const [accesibilidad, setAccesibilidad] = useState(data.accesibilidad || 'no')
  const [detalleAcc, setDetalleAcc] = useState(data.detalleAcc || '')
  const [visitado, setVisitado] = useState(data.visitado || 'no')

  const [enviado, setEnviado] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [apiError, setApiError] = useState(null)

  const navigate = useNavigate()

  // hook que realiza la petición (acepta context)
  const { loading, error, data: recData, getRecommendations, cancel } = useRecommendations()

  // cleanup: cancelar petición si el component se desmonta
  useEffect(() => {
    return () => {
      if (typeof cancel === 'function') cancel()
    }
  }, [cancel])

  // guarda en el padre los campos simples de este step
  const persistLocalFields = () => {
    onChange({
      accesibilidad,
      detalleAcc: accesibilidad === 'si' ? detalleAcc : '',
      visitado,
    })
  }

  // Construye el context final a partir de `data` (formData acumulado) + step4
  const buildContext = () => {
    // data proviene del padre MultiStepFormModal y contiene lo que llenaron los otros steps
    const d = data || {}

    // normalizaciones y fallbacks
    const tiposTurismo = (d.tiposTurismo && Array.isArray(d.tiposTurismo)) ? d.tiposTurismo : (d.preferredTypes || [])
    const actividad_level = Number(d.actividad_level || d.actividad || 3)
    const preferencia_lugar = d.preferencia_lugar || d.preferencia || 'indiferente'
    const pref_outdoor = preferencia_lugar === 'aire'
    const group_type = d.group_type || d.viajaCon || null
    const services = d.services || d.servicios || []
    const needs_hotel = services.includes('hospedaje')
    const needs_transport = services.includes('transporte')
    const pref_food = services.includes('alimentos')
    const wants_tours = services.includes('tours')

    // Step1 fields
    const edad = Number(d.edad) || null
    const edad_range = d.edad_range || null
    const presupuesto_daily = Number(d.presupuesto_daily || d.presupuesto || 0) || null
    const presupuesto_bucket = d.presupuesto_bucket || null
    const duracion_dias = Number(d.duracion_dias || d.diasEstancia || null) || null
    const duracion_dias_range = d.duracion_dias_range || d.diasEstancia || null

    // Other optional fields
    const localidad = d.localidad || d.ciudad || null
    const transporte_pref = d.transporte_pref || d.transporte || null
    const grupo_tipo = group_type
    const fecha_inicio = d.fecha_inicio || null

    // step4 specific
    const user_accesibilidad = accesibilidad === 'si' ? true : false
    const detalle_accesibilidad = accesibilidad === 'si' ? detalleAcc : ''

    // final context object — claves alineadas con lo que el backend espera
    const context = {
      // perfil
      edad,
      edad_range,
      presupuesto_daily,
      presupuesto_bucket,
      duracion_dias,
      duracion_dias_range,

      // preferencias
      tiposTurismo,
      actividad_level,
      preferencia_lugar,
      pref_outdoor,

      // contexto / logística
      localidad,
      transporte_pref,
      grupo_tipo,
      fecha_inicio,

      // compañía / servicios
      group_type,
      services,
      needs_hotel,
      needs_transport,
      pref_food,
      wants_tours,

      // accesibilidad / condiciones
      accesibilidad: accesibilidad === 'si' ? 'si' : 'no',
      detalleAcc: detalle_accesibilidad,
      user_accesibilidad,

      // historial
      visitado: visitado === 'si' ? 'si' : 'no'
    }

    // Quitar claves null/undefined para mantener el payload limpio
    Object.keys(context).forEach(k => {
      if (context[k] === null || context[k] === undefined) delete context[k]
    })

    return context
  }

  const handleFinish = () => {
    persistLocalFields()
    setEnviado(true)
    setApiError(null)
    triggerRecommendations()
  }

  const triggerRecommendations = async () => {
    // seguridad: usuario debe existir
    if (!user || !user.id) {
      alert("Debes iniciar sesión para obtener recomendaciones.")
      setEnviado(false)
      return
    }

    try {
      // leer parámetros opcionales dentro del formData
      const alpha = data.alpha ?? 0.6
      const candidates = data.candidates ?? 200
      const k_cf = data.k_cf ?? 20

      // construir context final
      const context = buildContext()
      // Depuración (puedes quitar en producción)
      console.log("[Step4] Enviando context al recommender:", context)

      // Llamada: getRecommendations acepta context (POST)
      await getRecommendations({
        userId: user.id,
        alpha,
        candidates,
        k_cf,
        token,
        context
      })

      // Si llegó data, mostrar modal
      setShowResults(true)
    } catch (err) {
      console.error("Error al obtener recomendaciones:", err)
      setApiError(err?.message || String(err))
      if (err?.status === 401) {
        alert("Tu sesión expiró. Por favor inicia sesión de nuevo.")
        navigate("/login")
      } else {
        alert(err?.message || "Error al generar recomendaciones. Intenta nuevamente.")
      }
    } finally {
      setEnviado(false)
    }
  }

  const handleFinalizar = () => {
    if (onClose) {
      onClose()
    } else {
      navigate('/')
    }
  }

  const openManual = () => {
    // recomendado: backend expone /manual; en dev puedes abrir ruta local
    // window.open(`${process.env.REACT_APP_API_URL}/manual`, '_blank')
    window.open(MANUAL_LOCAL_PATH, "_blank")
  }

  // Si ya mostramos resultados: renderizar modal con las recomendaciones de la API
  if (showResults && recData && recData.recommendations) {
    return (
      <RecommendationsResultModal
        recommendations={recData.recommendations}
        userId={recData.user_id}
        onClose={() => {
          setShowResults(false)
          // cerrar todo el modal/form
          handleFinalizar()
        }}
      />
    )
  }

  // Spinner / cancel mientras se ejecuta la petición
  if (enviado || loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-6" />
        <h3 className="text-xl font-semibold">Pensando en tu experiencia personalizada...</h3>
        <p className="text-sm text-gray-500 mt-2">Esto puede tardar unos segundos.</p>
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => {
              if (typeof cancel === 'function') cancel()
              setEnviado(false)
            }}
            className="px-4 py-2 rounded bg-gray-200"
          >
            Cancelar
          </button>
          <button
            onClick={openManual}
            className="px-4 py-2 rounded bg-white border border-gray-200"
          >
            Ver manual
          </button>
        </div>
        {apiError && <div className="mt-4 text-red-500">{apiError}</div>}
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
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${accesibilidad === 'si' ? 'border-green-500 bg-green-50 shadow-lg scale-105' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'}`}
          >
            <div className="text-center space-y-2">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${accesibilidad === 'si' ? 'bg-green-500' : 'bg-gray-100'}`}>
                <FaCheckCircle className={`text-xl ${accesibilidad === 'si' ? 'text-white' : 'text-gray-600'}`} />
              </div>
              <div className={`font-medium ${accesibilidad === 'si' ? 'text-green-700' : 'text-gray-700'}`}>Sí</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setAccesibilidad('no')}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${accesibilidad === 'no' ? 'border-red-500 bg-red-50 shadow-lg scale-105' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'}`}
          >
            <div className="text-center space-y-2">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${accesibilidad === 'no' ? 'bg-red-500' : 'bg-gray-100'}`}>
                <span className={`text-xl font-bold ${accesibilidad === 'no' ? 'text-white' : 'text-gray-600'}`}>×</span>
              </div>
              <div className={`font-medium ${accesibilidad === 'no' ? 'text-red-700' : 'text-gray-700'}`}>No</div>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${visitado === 'si' ? 'border-orange-500 bg-orange-50 shadow-lg scale-105' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'}`}
          >
            <div className="text-center space-y-2">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${visitado === 'si' ? 'bg-orange-500' : 'bg-gray-100'}`}>
                <FaCheckCircle className={`text-xl ${visitado === 'si' ? 'text-white' : 'text-gray-600'}`} />
              </div>
              <div className={`font-medium ${visitado === 'si' ? 'text-orange-700' : 'text-gray-700'}`}>Sí</div>
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

        <div className="flex items-center gap-4">
          <button
            onClick={openManual}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
            title="Ver manual"
          >
            Ver manual
          </button>

          <button
            onClick={handleFinish}
            className="px-8 py-3 bg-gradient-to-r from-purple to-pink text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            <span className="flex items-center space-x-2">
              <span>Finalizar</span>
              <FaCheckCircle className="w-5 h-5" />
            </span>
          </button>
        </div>
      </div>

      {apiError && <div className="mt-4 text-red-500 font-medium">{apiError}</div>}
    </div>
  )
}

export default Step4Condiciones
