import React from 'react'
import { X } from 'lucide-react'

export default function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title = 'Confirmar acción',
    message = '¿Estás seguro de realizar esta acción?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'danger',
}) {
    if (!open) return null

    const buttonStyles = {
        danger: 'bg-red-600 hover:bg-red-700 text-white',
        warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
        info: 'bg-blue-600 hover:bg-blue-700 text-white',
    }

    const handleConfirm = () => {
        onConfirm()
        onClose()
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md border border-gray-100 animate-fadeIn">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 transition"
                    >
                        <X className="size-5 text-gray-500" />
                    </button>
                </div>

                <p className="text-gray-700 mb-6">{message}</p>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 transition"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className={`px-4 py-2 rounded-lg transition shadow-sm ${buttonStyles[type]}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}

