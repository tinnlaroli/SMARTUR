import { useState, useEffect, useMemo } from 'react';
import type { CreateCompanyDTO } from '../types/types';
import { X, Building2, Plus, Loader2, AlertCircle } from 'lucide-react';
import { locationApi } from '../../locations/api/locationApi';
import type { Location } from '../../locations/types/types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import type { SectorId } from '../../../shared/i18n/dashboardModalsLocale';

const SECTOR_IDS: SectorId[] = [1, 2, 3, 4, 5];

interface Props {
    onClose: () => void;
    onSubmit: (data: CreateCompanyDTO) => Promise<boolean | undefined>;
}

const selectClass =
    'w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white px-4 py-2 focus:ring-2 focus:ring-violet-500 outline-none transition-all cursor-pointer disabled:opacity-50';

export default function CreateCompanyModal({ onClose, onSubmit }: Props) {
    const { lang, t } = useLanguage();
    const mod = useMemo(() => getDashboardText(lang).modules.modals, [lang]);
    const [formData, setFormData] = useState<CreateCompanyDTO>({
        name: '',
        address: '',
        phone: '',
        id_sector: SECTOR_IDS[0],
        id_location: 0,
    });

    const [locations, setLocations] = useState<Location[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const e: Record<string, string> = {};
        if (!formData.name.trim()) e.name = t('validation.nameRequired');
        if (formData.phone && !/^[+\d\s\-()]{7,}$/.test(formData.phone)) e.phone = 'Ingresa un teléfono válido.';
        return e;
    };

    useEffect(() => {
        let cancelled = false;
        setLoadingOptions(true);
        locationApi.findAll(1, 200).then((res) => {
            if (cancelled) return;
            setLocations(res.locations);
            if (res.locations.length > 0)
                setFormData((p) => ({ ...p, id_location: res.locations[0].id }));
        }).catch(() => {}).finally(() => {
            if (!cancelled) setLoadingOptions(false);
        });
        return () => { cancelled = true; };
    }, []);

    const handleFieldChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'id_sector' || name === 'id_location' ? Number(value) : value,
        }));
        if (errors[name]) setErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
        const success = await onSubmit(formData);
        if (success) onClose();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#121214] rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Building2 className="size-5 text-violet-500" />
                        {mod.companies.createTitle}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 gap-y-4 flex flex-col">
                    {/* Name */}
                    <div>
                        <label htmlFor="create-company-name" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                            {mod.companies.companyName}
                        </label>
                        <input
                            id="create-company-name"
                            name="name"
                            value={formData.name}
                            onChange={handleFieldChange}
                            className={`w-full rounded-lg border px-4 py-2 focus:ring-2 outline-none transition-all dark:bg-zinc-800/50 dark:text-white ${errors.name ? 'border-red-400 focus:ring-red-400 dark:border-red-500' : 'border-zinc-300 dark:border-zinc-700 focus:ring-violet-500'}`}
                            placeholder={mod.companies.companyNamePh}
                        />
                        {errors.name && <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5"><AlertCircle className="size-3" />{errors.name}</p>}
                    </div>

                    {/* Address */}
                    <div>
                        <label htmlFor="create-company-address" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                            {mod.companies.address}
                        </label>
                        <input
                            id="create-company-address"
                            name="address"
                            value={formData.address}
                            onChange={handleFieldChange}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white px-4 py-2 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                            placeholder={mod.companies.addressPh}
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label htmlFor="create-company-phone" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                            {mod.companies.phone}
                        </label>
                        <input
                            id="create-company-phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleFieldChange}
                            className={`w-full rounded-lg border px-4 py-2 focus:ring-2 outline-none transition-all dark:bg-zinc-800/50 dark:text-white ${errors.phone ? 'border-red-400 focus:ring-red-400 dark:border-red-500' : 'border-zinc-300 dark:border-zinc-700 focus:ring-violet-500'}`}
                            placeholder={mod.companies.phonePh}
                        />
                        {errors.phone && <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5"><AlertCircle className="size-3" />{errors.phone}</p>}
                    </div>

                    {/* Sector */}
                    <div>
                        <label htmlFor="create-company-sector" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                            {mod.companies.sector}
                        </label>
                        <select
                            id="create-company-sector"
                            name="id_sector"
                            value={formData.id_sector}
                            onChange={handleFieldChange}
                            required
                            className={selectClass}
                        >
                            {SECTOR_IDS.map((id) => (
                                <option key={id} value={id}>{mod.companies.sectorNames[id]}</option>
                            ))}
                        </select>
                    </div>

                    {/* Location */}
                    <div>
                        <label htmlFor="create-company-location" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                            {mod.companies.location}
                        </label>
                        {loadingOptions ? (
                            <div className="flex items-center gap-2 text-sm text-zinc-400 py-2">
                                <Loader2 className="size-4 animate-spin" /> {mod.companies.loadingLocations}
                            </div>
                        ) : locations.length === 0 ? (
                            <p className="text-sm text-amber-500 py-1">{mod.companies.noLocations}</p>
                        ) : (
                            <select
                                id="create-company-location"
                                name="id_location"
                                value={formData.id_location}
                                onChange={handleFieldChange}
                                required
                                className={selectClass}
                            >
                                {locations.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.name}{l.municipality ? ` — ${l.municipality}` : ''}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            {mod.common.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={loadingOptions || formData.id_location === 0}
                            className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white shadow-lg hover:bg-violet-700 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="size-4" />
                            {mod.companies.createSubmit}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
