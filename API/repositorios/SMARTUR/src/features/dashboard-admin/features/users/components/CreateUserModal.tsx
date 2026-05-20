import { useState } from 'react';
import type { CreateUserDTO } from '../types/types';
interface Props {
    onClose: () => void;
    onSubmit: (data: CreateUserDTO) => Promise<boolean | undefined>;
}

export default function CreateUserModal({ onClose, onSubmit }: Props) {
    const [formData, setFormData] = useState<CreateUserDTO>({
        name: '',
        email: '',
        password: '',
        role_id: 2,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: name === 'role_id' ? Number(value) : value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await onSubmit(formData);
        if (success) onClose();
    };

    return (

        <><div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md transform transition-all">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                        Crear usuario
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                    >
                        <span className="sr-only">Cerrar</span>
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label
                                htmlFor="name"
                                className="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                            >
                                Nombre completo
                            </label>
                            <input
                                name="name"
                                value={formData.name}
                                required
                                onChange={handleChange}
                                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                                placeholder="Ej. Juan Pérez" />
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="email"
                                className="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                            >
                                Correo electrónico
                            </label>
                            <input
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                                placeholder="user@ejemplo.com" />
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="password"
                                className="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                            >
                                Contraseña
                            </label>
                            <input
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                                placeholder="••••••••" />
                        </div>
                        <div className="space-y-1">
                            <label
                                htmlFor="role_id"
                                className="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                            >
                                Rol
                            </label>
                            <select
                                name="role_id"
                                value={formData.role_id}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                            >
                                <option value={1}>Administrador</option>
                                <option value={2}>Usuario</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="transform rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-600"
                        >
                            Crear usuario
                        </button>
                    </div>
                </form>
            </div>
        </div></>
    );
}
