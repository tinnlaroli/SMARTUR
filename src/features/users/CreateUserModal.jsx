import React, { useState, useEffect } from 'react'
import ToastError from '../../components/common/ToastError'
import ToastSuccess from '../../components/common/ToastSuccess'

export default function CreateUserModal({ open, onClose, onSubmit }) {
    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    if (!open) return null

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!form.name || !form.email || !form.password) {
            setErrorMessage('Todos los campos son obligatorios')
            return
        }

        try {
            await onSubmit(form)
            setSuccessMessage('Usuario creado correctamente')
            setForm({ name: '', email: '', password: '' })
            setTimeout(onClose, 1000)
        } catch (err) {
            setErrorMessage('Error al crear usuario')
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <ToastError
                message={errorMessage}
                onClose={() => setErrorMessage('')}
            />
            <ToastSuccess
                message={successMessage}
                onClose={() => setSuccessMessage('')}
            />

            <div className="bg-white p-6 rounded-lg shadow w-96">
                <h2 className="text-xl font-semibold mb-4">Crear Usuario</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        className="w-full border px-3 py-2 rounded"
                        placeholder="Nombre"
                        value={form.name}
                        onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                        }
                    />

                    <input
                        className="w-full border px-3 py-2 rounded"
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                        }
                    />

                    <input
                        type="password"
                        className="w-full border px-3 py-2 rounded"
                        placeholder="Contraseña"
                        value={form.password}
                        onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                        }
                    />

                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Crear
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
