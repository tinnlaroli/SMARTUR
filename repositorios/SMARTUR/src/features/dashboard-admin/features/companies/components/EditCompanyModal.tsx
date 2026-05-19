import { useState } from 'react';
import type { Company, UpdateCompanyDTO } from '../types/types';

interface Props {
    onClose: () => void;
    onSubmit: (id: number, data: UpdateCompanyDTO) => Promise<boolean | undefined>;
    company: Company;
}

export default function EditCompanyModal({ onClose, onSubmit, company }: Props) {
    const [formData, setFormData] = useState<UpdateCompanyDTO>({
        name: company.name,
        address: company.address,
        phone: company.phone,
        id_sector: company.id_sector,
        id_location: company.id_location,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'id_sector' || name === 'id_location' ? Number(value) : value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await onSubmit(company.id, formData);
        if (success) onClose();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[60]">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                        Editar empresa
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-500">
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
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-medium uppercase text-zinc-500">
                            Nombre
                        </label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white px-4 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium uppercase text-zinc-500">
                            Dirección
                        </label>
                        <input
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white px-4 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium uppercase text-zinc-500">
                            Teléfono
                        </label>
                        <input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white px-4 py-2"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-zinc-700 px-5 py-2 text-sm font-medium dark:text-zinc-300"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-lg"
                        >
                            Guardar cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
