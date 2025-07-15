import React, { useEffect } from 'react'

export default function ToastSuccess({ message, onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [message, duration, onClose])

  if (!message) return null

  return (
    <div
      className="fixed top-6 right-6 z-[9999] min-w-[260px] max-w-xs flex items-center px-4 py-3 rounded border border-green-700 bg-green-700 text-white shadow-lg animate-fadeInUp transition-all"
      style={{ backgroundColor: '#15803d', color: '#fff', opacity: 1 }}
      role="alert"
    >
      <span className="mr-2">
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </span>
      <span className="flex-1 text-sm font-medium">{message}</span>
    </div>
  )
}
