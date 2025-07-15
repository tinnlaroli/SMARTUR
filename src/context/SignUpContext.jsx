import React, { createContext, useContext, useState } from 'react'

const SignUpContext = createContext()

export function SignUpProvider({ children }) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const register = async (name, email, password) => {
    setError('')
    setSuccess('')
    try {
      const response = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      if (!response.ok) {
        const data = await response.json()
        setError(data.message || 'Error al registrar usuario')
        return { success: false }
      }
      setSuccess('¡Registro exitoso! Ahora puedes iniciar sesión.')
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false }
    }
  }

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  return (
    <SignUpContext.Provider value={{ register, error, success, clearMessages }}>
      {children}
    </SignUpContext.Provider>
  )
}

export const useSignUp = () => useContext(SignUpContext)
