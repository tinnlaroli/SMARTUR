import React, { createContext, useContext, useState, useCallback } from 'react'
import Toast from './Toast'

const ToastContext = createContext(null)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast debe usarse dentro de ToastProvider')
    }
    return context
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const showToast = useCallback((type, message) => {
        const id = Date.now() + Math.random()
        setToasts((prev) => [...prev, { id, type, message }])

        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id))
        }, 3000)
    }, [])

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="animate-fadeIn"
                        onClick={() => removeToast(toast.id)}
                    >
                        <Toast type={toast.type} message={toast.message} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

