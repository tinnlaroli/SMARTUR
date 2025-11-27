import React, { useEffect } from 'react'
import { FaTimes } from 'react-icons/fa'

export default function ToastSuccess({ message, onClose, duration = 3000 }) {
    useEffect(() => {
        if (!message) return
        const timer = setTimeout(onClose, duration)
        return () => clearTimeout(timer)
    }, [message])

    if (!message) return null

    return (
        <div className="fixed top-6 right-6 z-[9999] px-4 py-3 border border-green-700 bg-green-600 text-white rounded-lg shadow-lg flex items-center gap-3 animate-slideIn">
            <span>✅ {message}</span>
            <button 
                onClick={onClose} 
                className="ml-2 hover:text-green-100 transition-colors"
            >
                <FaTimes />
            </button>
        </div>
    )
}
