import React, { useState } from 'react'
import { useSignUp } from '../context/SignUpContext'
import ToastSuccess from './ToastSuccess'
import ToastError from './ToastError'

export default function SignUpModal({ onClose, onShowLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
  })
  const { register, error, success, clearMessages } = useSignUp()

  const handleRegister = async (e) => {
    e.preventDefault()
    setTouched({ name: true, email: true, password: true })
    if (!name || !email || !password) return
    setShowSuccess(false)
    setShowError(false)
    setToastMsg('')
    const result = await register(name, email, password)
    if (result.success) {
      setToastMsg('registro exitoso')
      setShowSuccess(true)
      setName('')
      setEmail('')
      setPassword('')
      setTouched({ name: false, email: false, password: false })
      setTimeout(() => {
        setShowSuccess(false)
        clearMessages()
      }, 2000)
      setTimeout(() => {
        onClose()
      }, 800)
    } else {
      setToastMsg(error)
      setShowError(true)
    }
  }

  return (
    <>
      {showSuccess && (
        <ToastSuccess
          message={toastMsg}
          onClose={() => {
            setShowSuccess(false)
            clearMessages()
          }}
        />
      )}
      {showError && (
        <ToastError
          message={toastMsg}
          onClose={() => {
            setShowError(false)
            clearMessages()
          }}
        />
      )}
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 sm:p-8 relative animate-fadeInUp">
          {/* Botón cerrar */}
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
            onClick={onClose}
          >
            &times;
          </button>

          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-purple">
            Registrarse
          </h2>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nombre</label>
              <input
                type="text"
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple text-sm sm:text-base"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                required
              />
              {touched.name && !name && (
                <span className="text-xs text-red-500">Campo requerido</span>
              )}
            </div>

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

            <button
              type="submit"
              className="w-full bg-orange text-white py-2 rounded-md font-semibold hover:bg-orange/90 transition text-sm sm:text-base"
            >
              Registrarse
            </button>
          </form>

          <div className="text-center mt-4">
            <span className="text-sm">¿Ya tienes cuenta? </span>
            <button
              className="text-purple font-semibold text-sm hover:underline"
              onClick={() => {
                onClose()
                onShowLogin()
              }}
            >
              Inicia sesión
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
