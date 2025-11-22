import React, { useState, useRef } from 'react'
import ToastSuccess from '../../components/common/ToastSuccess'
import ToastError from '../../components/common/ToastError'

function Loader() {
    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-40">
            <div className="w-12 h-12 border-4 border-purple border-t-transparent border-solid rounded-full animate-spin"></div>
        </div>
    )
}

export default function ForgotPasswordModal({ onClose }) {
    const [email, setEmail] = useState('')
    const [code, setCode] = useState(['', '', '', '', '', ''])
    const [newPassword, setNewPassword] = useState('')
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [showError, setShowError] = useState(false)
    const [toastMsg, setToastMsg] = useState('')

    const inputRefs = Array.from({ length: 6 }, () => useRef(null))

    // Paso 1: solicitar código
    const handleRequestCode = async (e) => {
        e.preventDefault()
        if (!email) {
            setToastMsg('Ingresa tu correo')
            setShowError(true)
            setTimeout(() => setShowError(false), 3000)
            return
        }

        setLoading(true)
        setShowError(false)
        setShowSuccess(false)

        try {
            const res = await fetch(
                'http://localhost:3000/api/users/forgot-password',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                }
            )
            const data = await res.json()
            setLoading(false)

            if (res.ok) {
                setToastMsg(data.message || 'Código enviado a tu correo')
                setShowSuccess(true)
                setStep(2)
                setTimeout(() => {
                    if (inputRefs[0].current) inputRefs[0].current.focus()
                }, 100)
            } else {
                setToastMsg(data.message || 'Error al enviar código')
                setShowError(true)
                setTimeout(() => setShowError(false), 3000)
            }
        } catch (error) {
            setLoading(false)
            setToastMsg('Error de red')
            setShowError(true)
            setTimeout(() => setShowError(false), 3000)
        }
    }

    // Paso 2: verificar código y actualizar contraseña
    const handleResetPassword = async (e) => {
        e.preventDefault()
        const token = code.join('')
        if (token.length !== 6) {
            setToastMsg('Ingresa el código completo')
            setShowError(true)
            setTimeout(() => setShowError(false), 3000)
            return
        }
        if (!newPassword) {
            setToastMsg('Ingresa la nueva contraseña')
            setShowError(true)
            setTimeout(() => setShowError(false), 3000)
            return
        }

        setLoading(true)
        setShowError(false)
        setShowSuccess(false)

        try {
            const res = await fetch(
                'http://localhost:3000/api/users/reset-password',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, token, newPassword }),
                }
            )
            const data = await res.json()
            setLoading(false)

            if (res.ok) {
                setToastMsg('Contraseña actualizada exitosamente')
                setShowSuccess(true)
                setTimeout(() => {
                    setShowSuccess(false)
                    onClose()
                }, 2000)
            } else {
                setToastMsg(data.message || 'Código inválido o error')
                setShowError(true)
                setTimeout(() => setShowError(false), 3000)
            }
        } catch (error) {
            setLoading(false)
            setToastMsg('Error de red')
            setShowError(true)
            setTimeout(() => setShowError(false), 3000)
        }
    }

    const handleCodeChange = (index, value) => {
        if (value && !/^\d+$/.test(value)) return
        const newCode = [...code]
        newCode[index] = value
        setCode(newCode)
        if (value && index < 5) inputRefs[index + 1].current.focus()
    }

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
                    {step === 1
                        ? 'Recuperar contraseña'
                        : 'Restablecer contraseña'}
                </h2>

                {step === 1 && (
                    <form onSubmit={handleRequestCode} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple text-sm sm:text-base"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-orange text-white py-2 rounded-md font-semibold hover:bg-orange/90 transition text-sm sm:text-base"
                        >
                            Enviar código
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <p className="text-sm text-gray-600 mb-4 text-center">
                            Ingresa el código de verificación y tu nueva
                            contraseña
                        </p>
                        <div className="flex justify-center space-x-3 mb-4">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={inputRefs[index]}
                                    type="text"
                                    maxLength="1"
                                    className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple"
                                    value={digit}
                                    onChange={(e) =>
                                        handleCodeChange(index, e.target.value)
                                    }
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                />
                            ))}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Nueva contraseña
                            </label>
                            <input
                                type="password"
                                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple text-sm sm:text-base"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
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
                                Restablecer contraseña
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
