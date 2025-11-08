import React, { useState } from 'react'
import { createAdmin } from './adminService'
import ToastSuccess from '../../components/common/ToastSuccess'
import ToastError from '../../components/common/ToastError'

export default function AdminCreateModal({ isOpen, onClose, onSuccess }) {
    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [showError, setShowError] = useState(false)
    const [toastMessage, setToastMessage] = useState('')

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setShowError(false)
        setShowSuccess(false)

        try {
            await createAdmin(form)
            setToastMessage('Administrador creado correctamente')
            setShowSuccess(true)
            setForm({ name: '', email: '', password: '' })
            setTimeout(() => {
                if (onSuccess) {
                    onSuccess()
                } else {
                    onClose()
                }
            }, 1500)
        } catch (err) {
            console.error('Error al crear Administrador:', err)
            setToastMessage(
                err.message || 'Error al crear Administrador. Intenta nuevamente.'
            )
            setShowError(true)
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setForm({ name: '', email: '', password: '' })
        setShowError(false)
        setShowSuccess(false)
        onClose()
    }

    if (!isOpen) return null

    return (
        <>
            {showSuccess && (
                <ToastSuccess
                    message={toastMessage}
                    onClose={() => setShowSuccess(false)}
                />
            )}
            {showError && (
                <ToastError
                    message={toastMessage}
                    onClose={() => setShowError(false)}
                />
            )}

            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
                <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 relative">
                    <button
                        onClick={handleClose}
                        className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 text-2xl font-bold"
                    >
                        ×
                    </button>
                    <h2 className="text-xl pb-4 sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple to-blue drop-shadow-xl">
                        Registrar nuevo administrador
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre
                            </label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Nombre completo"
                                value={form.name}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                name="email"
                                placeholder="correo@ejemplo.com"
                                value={form.email}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Contraseña"
                                value={form.password}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple"
                                required
                                disabled={loading}
                                minLength={6}
                            />
                        </div>
                        <div className="flex justify-end space-x-2 pt-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-all font-medium"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="bg-purple text-white px-4 py-2 rounded-lg hover:bg-purple/90 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}
