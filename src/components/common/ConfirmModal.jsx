import React from 'react'

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirmar acción',
    message = '¿Estás seguro de que deseas realizar esta acción?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    confirmColor = 'bg-red-500 hover:bg-red-600',
}) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                <h3 className="text-xl sm:text-1xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple to-blue drop-shadow-xl">
                    {title}
                </h3>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all font-medium"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`bg-orange text-white px-4 py-2 rounded-lg hover:bg-orange/90 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
