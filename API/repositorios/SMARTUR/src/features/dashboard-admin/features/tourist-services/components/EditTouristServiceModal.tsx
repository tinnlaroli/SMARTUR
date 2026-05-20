import { useState } from 'react';
import type { TouristService, UpdateTouristServiceDTO } from '../types/types';
import { X, Save } from 'lucide-react';

interface Props {
    onClose: () => void;
    onSubmit: (id: number, data: UpdateTouristServiceDTO) => Promise<boolean | undefined>;
    service: TouristService;
}

export default function EditTouristServiceModal({ onClose, onSubmit, service }: Props) {
    const [formData, setFormData] = useState<UpdateTouristServiceDTO>({
        name: service.name,
        description: service.description,
        service_type: service.service_type,
        active: service.active,
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'active' ? value === 'true' : value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await onSubmit(service.id, formData);
        if (success) onClose();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-[60] backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#121214] rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                        Editar Servicio
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                            Nombre del Servicio
                        </label>
                        <input
                            name="name"
                            value={formData.name}
                            required
                            onChange={handleChange}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                            Descripción
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                                Tipo
                            </label>
                            <select
                                name="service_type"
                                value={formData.service_type}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                            >
                                <option value="tour">Tour</option>
                                <option value="hotel">Hotel</option>
                                <option value="restaurant">Restaurante</option>
                                <option value="transporte">Transporte</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                                Estado
                            </label>
                            <select
                                name="active"
                                value={String(formData.active)}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                            >
                                <option value="true">Activo</option>
                                <option value="false">Inactivo</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-lg hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Guardar cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
