import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import ToastSuccess from './ToastSuccess'
import ToastError from './ToastError'

function Loader() {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-12 h-12 border-4 border-purple border-t-transparent border-solid rounded-full animate-spin"></div>
    </div>
  )
}

export default function LoginModal({ onClose, onShowRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [touched, setTouched] = useState({ email: false, password: false })
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setTouched({ email: true, password: true })
    if (!email || !password) return
    setShowSuccess(false)
    setShowError(false)
    setToastMsg('')
    setLoading(true)

    const result = await login(email, password)

    setTimeout(() => {
      setLoading(false)
      if (result.success) {
        setToastMsg(
          result.message || '¡Inicio de sesión exitoso! Redirigiendo...',
        )
        setShowSuccess(true)
        setEmail('')
        setPassword('')
        setTimeout(() => {
          setShowSuccess(false)
          onClose() // Aquí cierras el modal o puedes redirigir
          // Si quieres redirigir, puedes usar navigate('/ruta')
        }, 2000)
      } else {
        setToastMsg(result.message || 'Credenciales incorrectas o error de red')
        setShowError(true)
        setTimeout(() => {
          setShowError(false)
        }, 3000)
      }
    }, 1500) // Loader visible al menos 1.5s
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {loading && <Loader />}
      {showSuccess && (
        <ToastSuccess
          message={toastMsg}
          onClose={() => {
            setShowSuccess(false)
            onClose() // Aquí cierras el modal después de que el usuario vea el toast
          }}
          style={{ backgroundColor: '#15803d', color: '#fff', opacity: 1 }}
        />
      )}
      {showError && (
        <ToastError message={toastMsg} onClose={() => setShowError(false)} />
      )}
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 sm:p-8 relative animate-fadeInUp">
        {/* Botón cerrar */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
          onClick={onClose}
        >
          &times;
        </button>

        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-purple">
          Iniciar sesión
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple text-sm sm:text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              required
            />
            {touched.email && !email && (
              <span className="text-xs text-red-500">Campo requerido</span>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple text-sm sm:text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              required
            />
            {touched.password && !password && (
              <span className="text-xs text-red-500">Campo requerido</span>
            )}
          </div>

          <div className="text-center text-xs sm:text-sm">
            <a href="#" className="text-blue hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button
            type="submit"
            className="w-full bg-orange text-white py-2 rounded-md font-semibold hover:bg-orange/90 transition text-sm sm:text-base"
          >
            Iniciar sesión
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs sm:text-sm text-gray-600">¿No tienes cuenta?</p>
          <button
            className="text-purple font-semibold hover:underline text-xs sm:text-sm"
            onClick={() => {
              onClose()
              onShowRegister()
            }}
          >
            Regístrate
          </button>
        </div>
      </div>
    </div>
  )
}
