import { useState, useMemo } from 'react';
import type { Company, UpdateCompanyDTO } from '../types/types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

interface Props {
    onClose: () => void;
    onSubmit: (id: number, data: UpdateCompanyDTO) => Promise<boolean | undefined>;
    company: Company;
}

export default function EditCompanyModal({ onClose, onSubmit, company }: Props) {
    const { lang } = useLanguage();
    const mod = useMemo(() => getDashboardText(lang).modules.modals, [lang]);
    const [formData, setFormData] = useState<UpdateCompanyDTO>({
        name: company.name,
        address: company.address,
        phone: company.phone,
        id_sector: company.id_sector,
        id_location: company.id_location,
    });

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'id_sector' || name === 'id_location' ? Number(value) : value,
        }));
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
                        {mod.companies.editTitle}
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-500">
                        <svg
                            className="size-5"
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
                <form onSubmit={handleSubmit} className="p-6 gap-y-4 flex flex-col">
                    <div>
                        <label htmlFor="edit-company-name" className="block text-xs font-medium uppercase text-zinc-500">
                            {mod.companies.name}
                        </label>
                        <input
                            id="edit-company-name"
                            name="name"
                            value={formData.name}
                            onChange={handleFieldChange}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white px-4 py-2"
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-company-address" className="block text-xs font-medium uppercase text-zinc-500">
                            {mod.companies.address}
                        </label>
                        <input
                            id="edit-company-address"
                            name="address"
                            value={formData.address}
                            onChange={handleFieldChange}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white px-4 py-2"
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-company-phone" className="block text-xs font-medium uppercase text-zinc-500">
                            {mod.companies.phone}
                        </label>
                        <input
                            id="edit-company-phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleFieldChange}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white px-4 py-2"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-zinc-700 px-5 py-2 text-sm font-medium dark:text-zinc-300"
                        >
                            {mod.common.cancel}
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white shadow-lg"
                        >
                            {mod.common.saveChanges}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
