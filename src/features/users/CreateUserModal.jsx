import React, { useState } from "react";

export default function CreateUserModal({ open, onClose, onSubmit }) {
    const [form, setForm] = useState({ name: "", email: "", password: "" });

    if (!open) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSubmit(form);
        onClose();
        setForm({ name: "", email: "", password: "" });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow w-96">
                <h2 className="text-xl font-semibold mb-4">Crear Usuario</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        className="w-full border px-3 py-2 rounded"
                        placeholder="Nombre"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />

                    <input
                        className="w-full border px-3 py-2 rounded"
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />

                    <input
                        type="password"
                        className="w-full border px-3 py-2 rounded"
                        placeholder="Contraseña"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
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
    );
}
