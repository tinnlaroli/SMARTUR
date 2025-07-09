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

const Step4Condiciones = ({ data, onBack, onChange, onClose }) => {
  const [accesibilidad, setAccesibilidad] = useState(data.accesibilidad || 'no')
  const [detalleAcc, setDetalleAcc] = useState(data.detalleAcc || '')
  const [visitado, setVisitado] = useState(data.visitado || 'no')
  const [enviado, setEnviado] = useState(false)
  const navigate = useNavigate()

  const handleFinish = () => {
    onChange({
      accesibilidad,
      detalleAcc: accesibilidad === 'si' ? detalleAcc : '',
      visitado,
    })
    setEnviado(true)
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

  if (enviado) {
    // Simulación de lugar turístico de Orizaba basado en las preferencias
    const lugaresOrizaba = {
      naturaleza: {
        nombre: 'Parque Nacional Pico de Orizaba',
        descripcion: 'El volcán más alto de México con senderos naturales y vistas espectaculares',
        icon: FaMountain,
        precio: 'Gratis',
        duracion: '4-6 horas',
        color: 'green'
      },
      cultural: {
        nombre: 'Palacio de Hierro',
        descripcion: 'Arquitectura única de Gustave Eiffel, símbolo de la ciudad',
        icon: FaLandmark,
        precio: '$50 MXN',
        duracion: '2-3 horas',
        color: 'purple'
      },
      gastronomico: {
        nombre: 'Mercado Municipal de Orizaba',
        descripcion: 'Sabores tradicionales y platillos típicos de la región',
        icon: FaUtensils,
        precio: '$100-200 MXN',
        duracion: '3-4 horas',
        color: 'orange'
      },
      aventura: {
        nombre: 'Teleférico de Orizaba',
        descripcion: 'Vistas panorámicas de la ciudad desde las alturas',
        icon: FaTrain,
        precio: '$80 MXN',
        duracion: '1-2 horas',
        color: 'blue'
      },
      rural: {
        nombre: 'Finca Santa Gertrudis',
        descripcion: 'Experiencia rural con café y naturaleza',
        icon: FaHome,
        precio: '$150 MXN',
        duracion: '5-6 horas',
        color: 'brown'
      },
    }

    // Seleccionar lugar basado en preferencias
    const tiposPreferidos = data.tiposTurismo || []
    let lugarSeleccionado = lugaresOrizaba.cultural // default

    if (tiposPreferidos.includes('naturaleza')) {
      lugarSeleccionado = lugaresOrizaba.naturaleza
    } else if (tiposPreferidos.includes('gastronomico')) {
      lugarSeleccionado = lugaresOrizaba.gastronomico
    } else if (tiposPreferidos.includes('aventura')) {
      lugarSeleccionado = lugaresOrizaba.aventura
    } else if (tiposPreferidos.includes('rural')) {
      lugarSeleccionado = lugaresOrizaba.rural
    }

    const IconComponent = lugarSeleccionado.icon

    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green to-blue rounded-full mb-4">
            <FaCheckCircle className="text-2xl text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Tu destino perfecto en Orizaba!</h2>
          <p className="text-gray-600">Basándonos en tus preferencias, te recomendamos este increíble lugar</p>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-orange/20 p-8 shadow-lg">
          <div className="text-center space-y-6">
            <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-${lugarSeleccionado.color}-400 to-${lugarSeleccionado.color}-600 rounded-full`}>
              <IconComponent className="text-3xl text-white" />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {lugarSeleccionado.nombre}
              </h3>
              <p className="text-gray-600 leading-relaxed max-w-md mx-auto">
                {lugarSeleccionado.descripcion}
              </p>
            </div>

            <div className="flex justify-center space-x-6">
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold flex items-center space-x-2">
                <FaMoneyBillWave className="w-5 h-5" />
                <span>{lugarSeleccionado.precio}</span>
              </div>
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold flex items-center space-x-2">
                <FaClock className="w-5 h-5" />
                <span>{lugarSeleccionado.duracion}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <div className="flex justify-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <FaStar key={i} className="text-yellow-400 text-xl" />
            ))}
          </div>
          <p className="text-green-600 font-semibold text-lg">
            ¡Gracias por completar el formulario!
          </p>
          <p className="text-gray-500">
            Tu experiencia personalizada está lista. ¡Disfruta de Veracruz!
          </p>
          
          <button 
            onClick={handleFinalizar}
            className="px-8 py-3 bg-gradient-to-r from-purple to-blue text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            <span className="flex items-center space-x-2">
              <span>Finalizar</span>
              <FaCheckCircle className="w-5 h-5" />
            </span>
          </button>
        </div>
      </div>
    )
  }

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
  )
}

export default Step4Condiciones
