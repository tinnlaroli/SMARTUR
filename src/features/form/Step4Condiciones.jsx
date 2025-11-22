// src/features/form/Step4Condiciones.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FaWheelchair, 
  FaMapMarkedAlt, 
  FaArrowLeft, 
  FaCheckCircle,
  FaMountain,
  FaLandmark,
  FaUtensils,
  FaTrain,
  FaHome,
  FaStar,
  FaMoneyBillWave,
  FaClock
} from 'react-icons/fa'

/**
 * IMPORTANTE: ajusta las rutas de los imports si tu AuthContext o hooks están en otra ubicación.
 * Asumo:
 *  - AuthContext en: src/features/auth/AuthContext.jsx
 *  - hook useRecommendations en: src/hooks/useRecommendations.js
 *  - componente RecommendationsResultModal en: src/components/common/RecommendationsResultModal.jsx
 */
import { useAuth } from '../auth/AuthContext.jsx'
import { useRecommendations } from '../../hooks/useRecommendations.js'
import RecommendationsResultModal from '../../components/common/RecommendationsResultModal.jsx'

// Ruta local del manual (archivo que subiste). El backend expone /manual; también la dejo como referencia local.
const MANUAL_LOCAL_PATH = "/mnt/data/AISE-29-AISE210101-1.pdf"

const Step4Condiciones = ({ data, onBack, onChange, onClose }) => {
  const { user } = useAuth() // useAuth proporciona user y otras funciones del contexto
  const token = localStorage.getItem('token') // Obtener token del localStorage
  const [accesibilidad, setAccesibilidad] = useState(data.accesibilidad || 'no')
  const [detalleAcc, setDetalleAcc] = useState(data.detalleAcc || '')
  const [visitado, setVisitado] = useState(data.visitado || 'no')
  const [enviado, setEnviado] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [apiError, setApiError] = useState(null)
  const navigate = useNavigate()

  // hook que realiza la petición autenticada
  const { loading, error, data: recData, getRecommendations } = useRecommendations()

  const handleFinish = () => {
    // guardamos los campos locales en el formData compartido (parent)
    onChange({
      accesibilidad,
      detalleAcc: accesibilidad === 'si' ? detalleAcc : '',
      visitado,
    })
    // marcamos enviado: mostramos spinner y lanzamos la petición
    setEnviado(true)
    setApiError(null)
    triggerRecommendations()
  }

  const triggerRecommendations = async () => {
    // Validación seguridad: debe existir usuario logueado
    if (!user || !user.id) {
      alert("Debes iniciar sesión para obtener recomendaciones.")
      setEnviado(false)
      return
    }

    try {
      // Puedes leer alpha/candidates/k_cf del objeto data si los tienes en el form
      const alpha = data.alpha ?? 0.6
      const candidates = data.candidates ?? 200
      const k_cf = data.k_cf ?? 20

      await getRecommendations({
        userId: user.id,
        alpha,
        candidates,
        k_cf,
        token // se pasa el token al hook para que agregue Authorization
      })

      // Al terminar con éxito, mostramos modal de resultados
      setShowResults(true)
    } catch (err) {
      console.error("Error al obtener recomendaciones:", err)
      setApiError(err?.message || String(err))
      // manejo específico para auth expirado
      if (err?.status === 401) {
        alert("Tu sesión expiró. Por favor inicia sesión de nuevo.")
        // redirigir al login (ajusta ruta de login si la tienes distinta)
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
      // If we're in a modal, close it
      onClose()
    } else {
      // If we're in a standalone page, navigate
      navigate('/')
    }
  }

  const openManual = () => {
    // opción 1: abrir endpoint de backend que devuelve la ruta/archivo (recomendado)
    // window.open(`${process.env.REACT_APP_API_URL}/manual`, '_blank')
    // opción 2: abrir la ruta local (solo en entorno dev donde exista)
    window.open(MANUAL_LOCAL_PATH, "_blank")
  }

  // --- MODO RESULTADOS: mostrar recomendaciones proveniente de la API ---
  if (showResults && recData && recData.recommendations) {
    return (
      <RecommendationsResultModal
        recommendations={recData.recommendations}
        userId={recData.user_id}
        onClose={() => {
          setShowResults(false)
          // opcional: cerrar modal principal si quieres
          handleFinalizar()
        }}
      />
    )
  }

  // --- Estado enviado: mostrar spinner / feedback mientras carga ---
  if (enviado || loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-6" />
        {/* <h3 className="text-xl font-semibold">Generando tu experiencia personalizada...</h3> */}
        <h3 className="text-xl font-semibold">Pensando en tu experiencia personalizada...</h3>
        <p className="text-sm text-gray-500 mt-2">Esto puede tardar unos segundos.</p>
        <div className="mt-6">
          <button
            onClick={() => {
              // permitir cancelar la petición (si implementas cancel en hook)
              // cancel() // si expones cancel desde useRecommendations
              setEnviado(false)
            }}
            className="px-4 py-2 rounded bg-gray-200"
          >
            Cancelar
          </button>
        </div>
        {apiError && <div className="mt-4 text-red-500">{apiError}</div>}
      </div>
    )
  }

  // --- FORMULARIO NORMAL (antes de enviar) ---
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
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              accesibilidad === 'si'
                ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className="text-center space-y-2">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                accesibilidad === 'si' ? 'bg-green-500' : 'bg-gray-100'
              }`}>
                <FaCheckCircle className={`text-xl ${
                  accesibilidad === 'si' ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <div className={`font-medium ${
                accesibilidad === 'si' ? 'text-green-700' : 'text-gray-700'
              }`}>
                Sí
              </div>
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => setAccesibilidad('no')}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              accesibilidad === 'no'
                ? 'border-red-500 bg-red-50 shadow-lg scale-105'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className="text-center space-y-2">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                accesibilidad === 'no' ? 'bg-red-500' : 'bg-gray-100'
              }`}>
                <span className={`text-xl font-bold ${
                  accesibilidad === 'no' ? 'text-white' : 'text-gray-600'
                }`}>×</span>
              </div>
              <div className={`font-medium ${
                accesibilidad === 'no' ? 'text-red-700' : 'text-gray-700'
              }`}>
                No
              </div>
            </div>
          </button>
        </div>

        {accesibilidad === 'si' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe tu requerimiento (opcional)
            </label>
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
          <label className="text-lg font-semibold text-gray-700">
            ¿Has visitado antes esta región?
          </label>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setVisitado('si')}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              visitado === 'si'
                ? 'border-orange-500 bg-orange-50 shadow-lg scale-105'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className="text-center space-y-2">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                visitado === 'si' ? 'bg-orange-500' : 'bg-gray-100'
              }`}>
                <FaCheckCircle className={`text-xl ${
                  visitado === 'si' ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <div className={`font-medium ${
                visitado === 'si' ? 'text-orange-700' : 'text-gray-700'
              }`}>
                Sí
              </div>
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => setVisitado('no')}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              visitado === 'no'
                ? 'border-gray-500 bg-gray-50 shadow-lg scale-105'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className="text-center space-y-2">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                visitado === 'no' ? 'bg-gray-500' : 'bg-gray-100'
              }`}>
                <span className={`text-xl font-bold ${
                  visitado === 'no' ? 'text-white' : 'text-gray-600'
                }`}>×</span>
              </div>
              <div className={`font-medium ${
                visitado === 'no' ? 'text-gray-700' : 'text-gray-700'
              }`}>
                No
              </div>
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

      {/* Error si la API devolvió algo */}
      {apiError && <div className="mt-4 text-red-500 font-medium">{apiError}</div>}
    </div>
  )
}

export default Step4Condiciones
