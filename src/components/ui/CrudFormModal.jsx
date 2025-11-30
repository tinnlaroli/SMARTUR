import React, { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'

export default function CrudFormModal({
    formSchema,
    onSubmit,
    editingItem = null,
    open: externalOpen = false,
    onClose: externalOnClose = null,
    addButtonText = 'Add User',
}) {
    const [open, setOpen] = useState(externalOpen)
    const [formData, setFormData] = useState({})

    useEffect(() => {
        if (editingItem) {
            setFormData(editingItem)
            setOpen(true)
        }
    }, [editingItem])

    useEffect(() => {
        setOpen(externalOpen)
    }, [externalOpen])

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await onSubmit(formData)
            setOpen(false)
            setFormData({})
            if (externalOnClose) externalOnClose()
        } catch (error) {}
    }

    const handleClose = () => {
        setOpen(false)
        setFormData({})
        if (externalOnClose) externalOnClose()
    }

    const isEditing = !!editingItem

    return (
        <>
            {!isEditing && (
                <button
                    onClick={() => setOpen(true)}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition shadow-sm flex items-center gap-2"
                >
                    <Plus className="size-4" />
                    {addButtonText}
                </button>
            )}

            {open && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md border border-gray-100 animate-fadeIn">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">
                                {isEditing
                                    ? 'Editar Registro'
                                    : 'Nuevo Registro'}
                            </h3>
                            <button
                                onClick={handleClose}
                                className="p-1 rounded-lg hover:bg-gray-100 transition"
                            >
                                <X className="size-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {formSchema.map((field) => (
                                <div key={field.name} className="flex flex-col">
                                    <label className="font-medium text-gray-700 mb-1">
                                        {field.label}
                                    </label>

                                    {field.type === 'textarea' ? (
                                        <textarea
                                            name={field.name}
                                            value={formData[field.name] || ''}
                                            required={
                                                isEditing
                                                    ? field.required &&
                                                      !field.skipOnEdit
                                                    : field.required
                                            }
                                            onChange={handleChange}
                                            placeholder={
                                                isEditing && field.skipOnEdit
                                                    ? 'Dejar vacío para no cambiar'
                                                    : ''
                                            }
                                            rows={4}
                                            className="border border-gray-200 rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500/50 focus:outline-none resize-vertical"
                                        />
                                    ) : field.type === 'checkbox' ? (
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name={field.name}
                                                checked={
                                                    formData[field.name] ||
                                                    false
                                                }
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        [field.name]:
                                                            e.target.checked,
                                                    })
                                                }
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-600">
                                                Marcar si aplica
                                            </span>
                                        </div>
                                    ) : (
                                        <input
                                            type={field.type}
                                            name={field.name}
                                            value={formData[field.name] || ''}
                                            required={
                                                isEditing
                                                    ? field.required &&
                                                      !field.skipOnEdit
                                                    : field.required
                                            }
                                            onChange={handleChange}
                                            step={field.step}
                                            placeholder={
                                                isEditing && field.skipOnEdit
                                                    ? 'Dejar vacío para no cambiar'
                                                    : ''
                                            }
                                            className="border border-gray-200 rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                                        />
                                    )}
                                </div>
                            ))}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 transition"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
                                >
                                    {isEditing ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

