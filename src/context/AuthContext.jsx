import React from 'react'
import { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [showFormModal, setShowFormModal] = useState(false)



  const handleLogin = async (email, password) => {
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error('Login fallido')
      }
      const data = await response.json()
      localStorage.setItem('token', data.token)
      setUser(data.user)

     
      if (data.user.role === 'user') {
        setShowFormModal(true)
        
      } else if (data.user.role === 'admin') {
        navigate('/dashboard')
      } else {
        alert('Rol no reconocido')
      }
    } catch (error) {
      alert(error.message)
    }
  }

  const logout = () => {
    setUser(null)
    setShowFormModal(false)
    localStorage.removeItem('token')
    navigate('/')
  }

  const showMultiStepForm = () => {
    if (user?.role === 'usuario') {
      setShowFormModal(true)
    }
  }

  const hideMultiStepForm = () => {
    setShowFormModal(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login: handleLogin,
        logout,
        showFormModal,
        showMultiStepForm,
        hideMultiStepForm,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
