import { useState, useMemo } from 'react';
import type { TouristService, UpdateTouristServiceDTO } from '../types/types';
import { X, Save, ImagePlus } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

const SERVICE_TYPE_KEYS = ['tour', 'hotel', 'restaurant', 'transporte'] as const;

interface Props {
    onClose: () => void;
    onSubmit: (id: number, data: UpdateTouristServiceDTO) => Promise<boolean | undefined>;
    service: TouristService;
}

export default function EditTouristServiceModal({ onClose, onSubmit, service }: Props) {
    const { lang } = useLanguage();
    const mod = useMemo(() => getDashboardText(lang).modules.modals, [lang]);
    const [formData, setFormData] = useState<UpdateTouristServiceDTO>({
        name: service.name,
        description: service.description,
        service_type: service.service_type,
        active: service.active,
        image: null,
    });

    const [imagePreview, setImagePreview] = useState<string | null>(service.image_url ?? null);

    const handleFieldChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'active' ? value === 'true' : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await onSubmit(service.id, formData);
        if (success) onClose();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFormData((prev) => ({ ...prev, image: file }));
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
            return;
        }
        setImagePreview(service.image_url ?? null);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-[60] backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#121214] rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
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

                <form onSubmit={handleSubmit} className="p-6 gap-y-4 flex flex-col">
                    <div>
                        <label htmlFor="edit-service-name" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                            {mod.touristServices.serviceName}
                        </label>
                        <input
                            id="edit-service-name"
                            name="name"
                            value={formData.name}
                            required
                            onChange={handleFieldChange}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white px-4 py-2 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-service-description" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                            {mod.touristServices.description}
                        </label>
                        <textarea
                            id="edit-service-description"
                            name="description"
                            value={formData.description}
                            onChange={handleFieldChange}
                            rows={3}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white px-4 py-2 focus:ring-2 focus:ring-violet-500 outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="edit-service-type" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                                {mod.touristServices.type}
                            </label>
                            <select
                                id="edit-service-type"
                                name="service_type"
                                value={formData.service_type}
                                onChange={handleFieldChange}
                                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white px-4 py-2 focus:ring-2 focus:ring-violet-500 outline-none transition-all cursor-pointer"
                            >
                                {SERVICE_TYPE_KEYS.map((k) => (
                                    <option key={k} value={k}>{mod.touristServices.serviceTypeLabels[k]}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="edit-service-active" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                                {mod.users.status}
                            </label>
                            <select
                                id="edit-service-active"
                                name="active"
                                value={String(formData.active)}
                                onChange={handleFieldChange}
                                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white px-4 py-2 focus:ring-2 focus:ring-violet-500 outline-none transition-all cursor-pointer"
                            >
                                <option value="true">{mod.users.statusActive}</option>
                                <option value="false">{mod.users.statusInactive}</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="edit-service-image" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
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
                                <img src={imagePreview} alt="Previsualizacion" className="h-32 w-full object-cover" />
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
