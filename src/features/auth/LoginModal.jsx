import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from './AuthContext'
import ToastSuccess from '../../components/common/ToastSuccess'
import ToastError from '../../components/common/ToastError'

function Loader() {
    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-40">
            <div className="w-12 h-12 border-4 border-purple border-t-transparent border-solid rounded-full animate-spin"></div>
        </div>
    )
}

export default function LoginModal({ onClose, onShowRegister }) {
    const { openForgotPasswordModal } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [code, setCode] = useState(['', '', '', '', '', '']) // Array para cada dígito
    const [step, setStep] = useState(1) // 1: email+pass, 2: código
    const { login, verifyCode } = useAuth()
    const [showSuccess, setShowSuccess] = useState(false)
    const [showError, setShowError] = useState(false)
    const [toastMsg, setToastMsg] = useState('')
    const [touched, setTouched] = useState({ email: false, password: false })
    const [loading, setLoading] = useState(false)

    // Referencias para los inputs de código
    const inputRefs = [
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null),
    ]

    const handleLogin = async (e) => {
        e.preventDefault()
        setTouched({ email: true, password: true })
        if (!email || !password) return

        setShowSuccess(false)
        setShowError(false)
        setToastMsg('')
        setLoading(true)

        const result = await login(email, password)

        setLoading(false)
        if (result.success) {
            setToastMsg(result.message || 'Código enviado al correo')
            setShowSuccess(true)
            setStep(2)
            setEmail('')
            setPassword('')
            // Enfocar el primer input de código cuando cambiamos al paso 2
            setTimeout(() => {
                if (inputRefs[0].current) {
                    inputRefs[0].current.focus()
                }
            }, 100)
        } else {
            setToastMsg(
                result.message || 'Credenciales incorrectas o error de red'
            )
            setShowError(true)
            setTimeout(() => setShowError(false), 3000)
        }
    }

    const handleVerifyCode = async (e) => {
        e.preventDefault()
        const codeString = code.join('')
        if (codeString.length !== 6) {
            setToastMsg('Por favor, ingresa el código completo')
            setShowError(true)
            setTimeout(() => setShowError(false), 3000)
            return
        }

        setLoading(true)
        setShowError(false)
        setShowSuccess(false)
        setToastMsg('')

        const result = await verifyCode(codeString)

        setLoading(false)
        if (result.success) {
            setToastMsg('Login exitoso')
            setShowSuccess(true)
            setTimeout(() => {
                setShowSuccess(false)
                onClose()
            }, 2000)
        } else {
            setToastMsg(result.message || 'Código inválido')
            setShowError(true)
            setTimeout(() => setShowError(false), 3000)
        }
    }

    // Manejar cambios en los inputs de código
    const handleCodeChange = (index, value) => {
        // Solo permitir números
        if (value && !/^\d+$/.test(value)) return

        const newCode = [...code]
        newCode[index] = value
        setCode(newCode)

        // Auto-enfocar siguiente input si se ingresó un dígito
        if (value && index < 6) {
            inputRefs[index + 1].current.focus()
        }
    }

    // Manejar tecla retroceso
    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs[index - 1].current.focus()
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            {loading && <Loader />}
            {showSuccess && (
                <ToastSuccess
                    message={toastMsg}
                    onClose={() => setShowSuccess(false)}
                />
            )}
            {showError && (
                <ToastError
                    message={toastMsg}
                    onClose={() => setShowError(false)}
                />
            )}
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 sm:p-8 relative animate-fadeInUp">
                <button
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
                    onClick={onClose}
                >
                    &times;
                </button>

                <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-purple">
                    {step === 1 ? 'Iniciar sesión' : 'Verificación'}
                </h2>

                {step === 1 ? (
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
                                onBlur={() =>
                                    setTouched((t) => ({ ...t, email: true }))
                                }
                                required
                            />
                            {touched.email && !email && (
                                <span className="text-xs text-red-500">
                                    Campo requerido
                                </span>
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
                                onBlur={() =>
                                    setTouched((t) => ({
                                        ...t,
                                        password: true,
                                    }))
                                }
                                required
                            />
                            {touched.password && !password && (
                                <span className="text-xs text-red-500">
                                    Campo requerido
                                </span>
                            )}

                            <button
                                type="button"
                                className="text-purple font-semibold hover:underline text-xs sm:text-sm"
                                onClick={() => {
                                    onClose()
                                    openForgotPasswordModal() // ✅ ahora esto existe
                                }}
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-orange text-white py-2 rounded-md font-semibold hover:bg-orange/90 transition text-sm sm:text-base"
                        >
                            Iniciar sesión
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyCode} className="space-y-6">
                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-4">
                                Ingresa el código de verificación enviado a tu
                                correo
                            </p>

                            <div className="flex justify-center space-x-3 mb-6">
                                {code.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={inputRefs[index]}
                                        type="text"
                                        maxLength="1"
                                        className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple"
                                        value={digit}
                                        onChange={(e) =>
                                            handleCodeChange(
                                                index,
                                                e.target.value
                                            )
                                        }
                                        onKeyDown={(e) =>
                                            handleKeyDown(index, e)
                                        }
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                type="button"
                                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md font-semibold hover:bg-gray-300 transition text-sm sm:text-base"
                                onClick={() => setStep(1)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 bg-orange text-white py-2 rounded-md font-semibold hover:bg-orange/90 transition text-sm sm:text-base"
                            >
                                Verificar código
                            </button>
                        </div>
                    </form>
                )}

                {step === 1 && (
                    <div className="mt-6 text-center">
                        <p className="text-xs sm:text-sm text-gray-600">
                            ¿No tienes cuenta?
                        </p>
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
                )}
            </div>
        </div>
    )
}
