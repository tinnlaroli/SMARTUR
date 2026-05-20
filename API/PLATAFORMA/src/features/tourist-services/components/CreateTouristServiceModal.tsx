import { useState, useEffect, useMemo } from 'react';
import type { CreateTouristServiceDTO } from '../types/types';
import { X, Wrench, Plus, Loader2, ImagePlus } from 'lucide-react';
import { companyServices } from '../../companies/api/companyApi';
import { locationApi } from '../../locations/api/locationApi';
import type { Company } from '../../companies/types/types';
import type { Location } from '../../locations/types/types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

const SERVICE_TYPE_KEYS = ['tour', 'hotel', 'restaurant', 'transporte'] as const;

interface Props {
    onClose: () => void;
    onSubmit: (data: CreateTouristServiceDTO) => Promise<boolean | undefined>;
}

const selectClass =
    'w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white px-4 py-2 focus:ring-2 focus:ring-violet-500 outline-none transition-all cursor-pointer disabled:opacity-50';

export default function CreateTouristServiceModal({ onClose, onSubmit }: Props) {
    const { lang } = useLanguage();
    const mod = useMemo(() => getDashboardText(lang).modules.modals, [lang]);
    const [formData, setFormData] = useState<CreateTouristServiceDTO>({
        name: '',
        description: '',
        id_company: 0,
        id_location: 0,
        service_type: 'tour',
        active: true,
        image: null,
    });

    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [companies, setCompanies] = useState<Company[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoadingOptions(true);
        Promise.all([
            companyServices.findAll(1, 200),
            locationApi.findAll(1, 200),
        ]).then(([cRes, lRes]) => {
            if (cancelled) return;
            setCompanies(cRes.companies);
            setLocations(lRes.locations);
            if (cRes.companies.length > 0)
                setFormData((p) => ({ ...p, id_company: cRes.companies[0].id }));
            if (lRes.locations.length > 0)
                setFormData((p) => ({ ...p, id_location: lRes.locations[0].id }));
        }).catch(() => {}).finally(() => {
            if (!cancelled) setLoadingOptions(false);
        });
        return () => { cancelled = true; };
    }, []);

    const handleFieldChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]:
                name === 'id_company' || name === 'id_location'
                    ? Number(value)
                    : name === 'active'
                      ? value === 'true'
                      : value,
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFormData((prev) => ({ ...prev, image: file }));
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
            return;
        }
        setImagePreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await onSubmit(formData);
        if (success) onClose();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#121214] rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Wrench className="size-5 text-violet-500" />
                        {mod.touristServices.createTitle}
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
                        <label htmlFor="create-service-name" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                            {mod.touristServices.serviceName}
                        </label>
                        <input
                            id="create-service-name"
                            name="name"
                            value={formData.name}
                            required
                            onChange={handleFieldChange}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white px-4 py-2 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                            placeholder={mod.touristServices.serviceNamePh}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="create-service-description" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                            {mod.touristServices.description}
                        </label>
                        <textarea
                            id="create-service-description"
                            name="description"
                            value={formData.description}
                            onChange={handleFieldChange}
                            rows={3}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white px-4 py-2 focus:ring-2 focus:ring-violet-500 outline-none transition-all resize-none"
                            placeholder={mod.touristServices.descriptionPh}
                        />
                    </div>

                    {/* Image */}
                    <div>
                        <label htmlFor="create-service-image" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                            {mod.touristServices.serviceImage}
                        </label>
                        <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 cursor-pointer hover:border-violet-500/60 hover:text-violet-500 transition-colors">
                                <ImagePlus className="size-4" />
                                {mod.touristServices.uploadImage}
                                <input
                                    id="create-service-image"
                                    name="image"
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={handleImageChange}
                                />
                            </label>
                            <span className="text-xs text-zinc-400">
                                {formData.image ? formData.image.name : mod.touristServices.imageFormats}
                            </span>
                        </div>
                        {imagePreview && (
                            <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <img src={imagePreview} alt="Previsualizacion" className="h-32 w-full object-cover" />
                            </div>
                        )}
                    </div>

                    {/* Service type */}
                    <div>
                        <label htmlFor="create-service-type" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                            {mod.touristServices.serviceType}
                        </label>
                        <select
                            id="create-service-type"
                            name="service_type"
                            value={formData.service_type}
                            onChange={handleFieldChange}
                            className={selectClass}
                        >
                            {SERVICE_TYPE_KEYS.map((k) => (
                                <option key={k} value={k}>{mod.touristServices.serviceTypeLabels[k]}</option>
                            ))}
                        </select>
                    </div>

                    {/* Company dropdown */}
                    <div>
                        <label htmlFor="create-service-company" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                            {mod.touristServices.company}
                        </label>
                        {loadingOptions ? (
                            <div className="flex items-center gap-2 text-sm text-zinc-400 py-2">
                                <Loader2 className="size-4 animate-spin" /> {mod.touristServices.loadingCompanies}
                            </div>
                        ) : companies.length === 0 ? (
                            <p className="text-sm text-amber-500 py-1">{mod.touristServices.noCompanies}</p>
                        ) : (
                            <select
                                id="create-service-company"
                                name="id_company"
                                value={formData.id_company}
                                onChange={handleFieldChange}
                                required
                                className={selectClass}
                            >
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Location dropdown */}
                    <div>
                        <label htmlFor="create-service-location" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                            {mod.touristServices.location}
                        </label>
                        {loadingOptions ? (
                            <div className="flex items-center gap-2 text-sm text-zinc-400 py-2">
                                <Loader2 className="size-4 animate-spin" /> {mod.touristServices.loadingLocations}
                            </div>
                        ) : locations.length === 0 ? (
                            <p className="text-sm text-amber-500 py-1">{mod.touristServices.noLocations}</p>
                        ) : (
                            <select
                                id="create-service-location"
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
                            disabled={loadingOptions || formData.id_company === 0 || formData.id_location === 0}
                            className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white shadow-lg hover:bg-violet-700 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="size-4" />
                            {mod.touristServices.createSubmit}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
