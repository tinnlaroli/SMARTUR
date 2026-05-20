import { useState } from 'react';
import type { UpdateUserDTO } from '../types/types';
import { Save, X } from 'lucide-react';

interface Props {
    user: {
        id: number;
        name: string;
        role_id: number;
        is_active: boolean;
    };
    onClose: () => void;
    onSubmit: (id: number, data: UpdateUserDTO) => Promise<boolean | undefined>;
}

export default function EditUserModal({ user, onClose, onSubmit }: Props) {
    const [formData, setFormData] = useState({
        name: user.name,
        password: '',
        role_id: user.role_id,
        is_active: user.is_active,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]:
                name === 'role_id'
                    ? Number(value)
                    : name === 'is_active'
                      ? value === 'true'
                      : value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const dataToSend: UpdateUserDTO = {};

        if (formData.name !== user.name) {
            dataToSend.name = formData.name;
        }

        if (formData.password.trim() !== '') {
            dataToSend.password = formData.password;
        }

        if (formData.role_id !== user.role_id) {
            dataToSend.role_id = formData.role_id;
        }

        if (formData.is_active !== user.is_active) {
            dataToSend.is_active = formData.is_active;
        }

        if (Object.keys(dataToSend).length === 0) {
            onClose();
            return;
        }

        const success = await onSubmit(user.id, dataToSend);
        if (success) onClose();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md transform transition-all">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        Editar usuario
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Nombre
                            </label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm  bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500  dark:focus:ring-indigo-400/20 dark:focus:border-indigo-400 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-colors"
                                placeholder="Nombre completo"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Nueva contraseña
                                <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500 ml-2">
                                    (opcional)
                                </span>
                            </label>
                            <input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm 
                                     bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
                                     focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 
                                     dark:focus:ring-indigo-400/20 dark:focus:border-indigo-400
                                     placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                                     transition-colors"
                                placeholder="Dejar vacío para no cambiar"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Rol
                            </label>
                            <select
                                name="role_id"
                                value={formData.role_id}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm 
                                     bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
                                     focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 
                                     dark:focus:ring-indigo-400/20 dark:focus:border-indigo-400
                                     cursor-pointer transition-colors"
                            >
                                <option value={1} className="py-2">
                                    Administrador
                                </option>
                                <option value={2} className="py-2">
                                    Usuario
                                </option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Estado
                            </label>
                            <select
                                name="is_active"
                                value={String(formData.is_active)}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm 
                                     bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
                                     focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 
                                     dark:focus:ring-indigo-400/20 dark:focus:border-indigo-400
                                     cursor-pointer transition-colors"
                            >
                                <option value="true" className="py-2">
                                    Activo
                                </option>
                                <option value="false" className="py-2">
                                    Inactivo
                                </option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center gap-1.5 
                   px-3 py-2 text-sm font-medium 
                   rounded-md text-zinc-600 dark:text-zinc-400
                   hover:text-zinc-900 dark:hover:text-zinc-100 
                   hover:bg-zinc-100 dark:hover:bg-zinc-800
                   transition-colors"
                        >
                            <X className="h-4 w-4" />
                            <span>Cancelar</span>
                        </button>

                        <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 
                   px-3 py-2 text-sm font-medium 
                   rounded-md bg-indigo-600 dark:bg-indigo-500
                   text-white
                   hover:bg-indigo-700 dark:hover:bg-indigo-600
                   focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                   transition-colors"
                        >
                            <Save className="h-4 w-4" />
                            <span>Guardar</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
