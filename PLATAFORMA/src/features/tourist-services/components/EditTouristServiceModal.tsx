import { useState, useMemo, useEffect } from 'react';
import type { TouristService, UpdateTouristServiceDTO } from '../types/types';
import { X, Save, ImagePlus, AlertCircle, MapPin, DollarSign } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey';
import { api } from '../../../shared/api/axiosClient';

const SERVICE_TYPE_KEYS = ['tour', 'hotel', 'restaurant', 'transporte'] as const;

interface Location { id_location: number; name: string; }

interface Props {
    onClose: () => void;
    onSubmit: (id: number, data: UpdateTouristServiceDTO) => Promise<boolean | undefined>;
    service: TouristService;
}

export default function EditTouristServiceModal({ onClose, onSubmit, service }: Props) {
    useEscapeKey(onClose);
    const { lang, t } = useLanguage();
    const mod = useMemo(() => getDashboardText(lang).modules.modals, [lang]);

    const [formData, setFormData] = useState<UpdateTouristServiceDTO>({
        name: service.name,
        description: service.description,
        service_type: service.service_type,
        active: service.active,
        id_location: service.id_location,
        price_from: service.price_from ?? null,
        price_to: service.price_to ?? null,
        currency: service.currency ?? 'MXN',
        image: null,
    });

    const [imagePreview, setImagePreview] = useState<string | null>(service.image_url ?? null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [locations, setLocations] = useState<Location[]>([]);

    useEffect(() => {
        api.get('/locations', { params: { limit: 100 } })
            .then((r) => setLocations(r.data?.locations ?? r.data ?? []))
            .catch(() => {});
    }, []);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!formData.name?.trim()) e.name = t('validation.nameRequired');
        return e;
    };

    const handleFieldChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]:
                name === 'active'      ? value === 'true'  :
                name === 'id_location' ? (value ? Number(value) : null) :
                name === 'price_from' || name === 'price_to'
                    ? (value === '' ? null : Number(value)) :
                value,
        }));
        if (errors[name]) setErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
        const success = await onSubmit(service.id, formData);
        if (success) onClose();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFormData((prev) => ({ ...prev, image: file }));
        if (file) {
            setImagePreview(URL.createObjectURL(file));
            return;
        }
        setImagePreview(service.image_url ?? null);
    };

    const inputCls = 'w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white px-4 py-2 focus:ring-2 focus:ring-violet-500 outline-none transition-all';
    const labelCls = 'block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5';

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-[60] backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#121214] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                        {mod.touristServices.editTitle}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 gap-y-4 flex flex-col max-h-[80vh] overflow-y-auto">
                    {/* Nombre */}
                    <div>
                        <label htmlFor="edit-service-name" className={labelCls}>
                            {mod.touristServices.serviceName}
                        </label>
                        <input
                            id="edit-service-name"
                            name="name"
                            value={formData.name}
                            onChange={handleFieldChange}
                            className={`${inputCls} ${errors.name ? 'border-red-400 focus:ring-red-400 dark:border-red-500' : ''}`}
                        />
                        {errors.name && <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5"><AlertCircle className="size-3" />{errors.name}</p>}
                    </div>

                    {/* Descripción */}
                    <div>
                        <label htmlFor="edit-service-description" className={labelCls}>
                            {mod.touristServices.description}
                        </label>
                        <textarea
                            id="edit-service-description"
                            name="description"
                            value={formData.description}
                            onChange={handleFieldChange}
                            rows={3}
                            className={`${inputCls} resize-none`}
                        />
                    </div>

                    {/* Tipo y Estado */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="edit-service-type" className={labelCls}>
                                {mod.touristServices.type}
                            </label>
                            <select
                                id="edit-service-type"
                                name="service_type"
                                value={formData.service_type}
                                onChange={handleFieldChange}
                                className={`${inputCls} cursor-pointer`}
                            >
                                {SERVICE_TYPE_KEYS.map((k) => (
                                    <option key={k} value={k}>{mod.touristServices.serviceTypeLabels[k]}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="edit-service-active" className={labelCls}>
                                {mod.users.status}
                            </label>
                            <select
                                id="edit-service-active"
                                name="active"
                                value={String(formData.active)}
                                onChange={handleFieldChange}
                                className={`${inputCls} cursor-pointer`}
                            >
                                <option value="true">{mod.users.statusActive}</option>
                                <option value="false">{mod.users.statusInactive}</option>
                            </select>
                        </div>
                    </div>

                    {/* Ubicación */}
                    <div>
                        <label htmlFor="edit-service-location" className={labelCls}>
                            <span className="inline-flex items-center gap-1"><MapPin className="size-3" />Ubicación</span>
                        </label>
                        <select
                            id="edit-service-location"
                            name="id_location"
                            value={formData.id_location ?? ''}
                            onChange={handleFieldChange}
                            className={`${inputCls} cursor-pointer`}
                        >
                            <option value="">— Sin ubicación —</option>
                            {locations.map((loc) => (
                                <option key={loc.id_location} value={loc.id_location}>{loc.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Precios */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label htmlFor="edit-service-price-from" className={labelCls}>
                                <span className="inline-flex items-center gap-1"><DollarSign className="size-3" />Precio desde</span>
                            </label>
                            <input
                                id="edit-service-price-from"
                                name="price_from"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.price_from ?? ''}
                                onChange={handleFieldChange}
                                className={inputCls}
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label htmlFor="edit-service-price-to" className={labelCls}>
                                Precio hasta
                            </label>
                            <input
                                id="edit-service-price-to"
                                name="price_to"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.price_to ?? ''}
                                onChange={handleFieldChange}
                                className={inputCls}
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label htmlFor="edit-service-currency" className={labelCls}>
                                Moneda
                            </label>
                            <select
                                id="edit-service-currency"
                                name="currency"
                                value={formData.currency ?? 'MXN'}
                                onChange={handleFieldChange}
                                className={`${inputCls} cursor-pointer`}
                            >
                                <option value="MXN">MXN</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>
                    </div>

                    {/* Imagen */}
                    <div>
                        <label htmlFor="edit-service-image" className={labelCls}>
                            {mod.touristServices.serviceImage}
                        </label>
                        <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 cursor-pointer hover:border-violet-500/60 hover:text-violet-500 transition-colors">
                                <ImagePlus className="size-4" />
                                {mod.touristServices.changeImage}
                                <input
                                    id="edit-service-image"
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
                                <img src={imagePreview} alt="Previsualización" className="h-32 w-full object-cover" />
                            </div>
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
                            className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white shadow-lg hover:bg-violet-700 active:scale-[0.98] transition-all flex items-center gap-2"
                        >
                            <Save className="size-4" />
                            {mod.common.saveChanges}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
