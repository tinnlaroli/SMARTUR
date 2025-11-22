import React from "react";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar acción",
  message = "¿Estás seguro de que deseas realizar esta acción?",
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple to-blue">
          {title}
        </h3>

        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange/90"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
