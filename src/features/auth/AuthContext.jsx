// src/context/AuthContext.jsx
import React, { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const navigate = useNavigate()

    const [user, setUser] = useState(null)
    const [showFormModal, setShowFormModal] = useState(false)
    const [showCodeModal, setShowCodeModal] = useState(false)
    const [loginEmail, setLoginEmail] = useState('')
    const [userTemp, setUserTemp] = useState(null)
    const [showForgotPasswordModal, setShowForgotPasswordModal] =
        useState(false)

    // Paso 1: login con email y contraseña
    const handleLoginStep1 = async (email, password) => {
        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            // Obtener el texto primero para ver qué devuelve el servidor
            const textResponse = await response.text()
            const contentType = response.headers.get('content-type') || ''
            console.log('[login] respuesta raw:', textResponse)
            console.log('[login] status:', response.status)
            console.log('[login] headers:', contentType)

            if (!contentType.includes('application/json')) {
                const snippet = (textResponse || '')
                    .toString()
                    .substring(0, 200)
                return {
                    success: false,
                    message: snippet
                        ? `Respuesta no JSON: ${snippet}`
                        : 'Respuesta vacía del servidor',
                }
            }

            let data
            try {
                data = JSON.parse(textResponse)
            } catch (parseError) {
                console.error('[login] Error parseando JSON:', parseError)
                return {
                    success: false,
                    message: `Error del servidor: ${(
                        textResponse || ''
                    ).substring(0, 200)}`,
                }
            }

            console.log('[login] payload parseado:', data)
            // Aceptar éxito si el HTTP es 200-299 o si el payload indica status 200
            const isSuccess = response.ok || data?.status === 200
            if (!isSuccess)
                return {
                    success: false,
                    message: data?.message || 'Credenciales incorrectas',
                }

            // Intentar extraer los campos desde data.data o desde la raíz
            const dataContainer = data?.data || data
            const userId = dataContainer?.userId
            const emailFromApi = dataContainer?.email
            const role = dataContainer?.role

            const confirmedEmail = emailFromApi || email
            setLoginEmail(confirmedEmail)
            if (userId || role || emailFromApi) {
                setUserTemp({
                    id: userId ?? null,
                    email: confirmedEmail,
                    role: role ?? null,
                })
            } else {
                setUserTemp(null)
            }
            setShowCodeModal(true)

            return {
                success: true,
                message: data?.message || 'Código de verificación generado',
            }
        } catch (error) {
            console.error('[login] Error completo:', error)
            return {
                success: false,
                message: error.message || 'Error desconocido',
            }
        }
    }
    const openForgotPasswordModal = () => {
        setShowForgotPasswordModal(true)
    }

    const closeForgotPasswordModal = () => {
        setShowForgotPasswordModal(false)
    }

    // Paso 2: verificar código
    const handleVerifyCode = async (verificationCode) => {
        try {
            const response = await fetch(
                'http://localhost:3000/api/verify-2fa',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // El backend espera la clave 'token' junto con el email
                    body: JSON.stringify({
                        email: loginEmail,
                        token: verificationCode,
                    }),
                }
            )

            // Obtener el texto primero para ver qué devuelve el servidor
            const textResponse = await response.text()
            const contentType = response.headers.get('content-type') || ''
            console.log('[verify-code] respuesta raw:', textResponse)
            console.log('[verify-code] status:', response.status)
            console.log('[verify-code] headers:', contentType)

            if (!contentType.includes('application/json')) {
                const snippet = (textResponse || '')
                    .toString()
                    .substring(0, 200)
                return {
                    success: false,
                    message: snippet
                        ? `Respuesta no JSON: ${snippet}`
                        : 'Respuesta vacía del servidor',
                }
            }

            let data
            try {
                data = JSON.parse(textResponse)
            } catch (parseError) {
                console.error('[verify-code] Error parseando JSON:', parseError)
                return {
                    success: false,
                    message: `Error del servidor: ${(
                        textResponse || ''
                    ).substring(0, 200)}`,
                }
            }

            console.log('[verify-code] payload parseado:', data)
            const isSuccess = response.ok || data?.status === 200
            if (!isSuccess)
                return {
                    success: false,
                    message: data?.message || 'Código inválido',
                }
            // Aceptar payload con o sin anidación en data
            const payload = data?.data || data
            if (!payload)
                return {
                    success: false,
                    message: 'Respuesta inesperada del servidor',
                }

            // Guardar token
            if (payload.token) localStorage.setItem('token', payload.token)

            // Establecer usuario
            const userObj = payload.user || null
            if (!userObj)
                return {
                    success: false,
                    message: 'Usuario no presente en la respuesta',
                }
            setUser(userObj)

            const roleId =
                userObj?.roleId ?? userObj?.role_id ?? userObj?.role?.id
            if (roleId === 2) {
                setShowFormModal(true)
            } else if (roleId === 1) {
                navigate('/dashboard')
            } else if (userObj?.role === 'user') {
                // Fallback si aún llega como string
                setShowFormModal(true)
            } else if (userObj?.role === 'admin') {
                navigate('/dashboard')
            } else {
                // Si el backend no envía rol, usar heurística por user.id (1 => admin), si no, tratar como usuario
                if (typeof userObj?.id === 'number' && userObj.id === 1) {
                    navigate('/dashboard')
                } else {
                    console.warn(
                        'Rol no presente; aplicando flujo de usuario por defecto'
                    )
                    setShowFormModal(true)
                }
            }

            setShowCodeModal(false)
            return { success: true }
        } catch (error) {
            console.error('[verify-code] Error completo:', error)
            return {
                success: false,
                message: error.message || 'Error desconocido',
            }
        }
    }

    // Logout
    const logout = () => {
        setUser(null)
        setUserTemp(null)
        setLoginEmail('')
        setShowFormModal(false)
        setShowCodeModal(false)
        localStorage.removeItem('token')
        navigate('/')
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                userTemp,
                loginEmail,
                showFormModal,
                showCodeModal,
                showForgotPasswordModal, // ✅ nuevo
                login: handleLoginStep1,
                verifyCode: handleVerifyCode,
                logout,
                showMultiStepForm: () => {
                    if (user?.role === 'user') setShowFormModal(true)
                },
                hideMultiStepForm: () => setShowFormModal(false),

                openForgotPasswordModal, // ✅ nuevo
                closeForgotPasswordModal, // ✅ nuevo
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
