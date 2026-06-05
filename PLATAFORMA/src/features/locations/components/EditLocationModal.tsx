import { useState, useMemo } from 'react';
import type { Location, UpdateLocationDTO } from '../types/types';
import { X, Save, MapPin, Navigation, AlertCircle } from 'lucide-react';
import MapPicker from '../../../components/ui/MapPicker';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey';

interface Props {
    onClose: () => void;
    onSubmit: (id: number, data: UpdateLocationDTO) => Promise<boolean | undefined>;
    location: Location;
}

export default function EditLocationModal({ onClose, onSubmit, location }: Props) {
    useEscapeKey(onClose);
    const { lang, t } = useLanguage();
    const mod = useMemo(() => getDashboardText(lang).modules.modals, [lang]);
    const [formData, setFormData] = useState<UpdateLocationDTO>({
        name: location.name,
        state: location.state,
        municipality: location.municipality,
        latitude: location.latitude,
        longitude: location.longitude,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const e: Record<string, string> = {};
        if (!formData.name?.trim()) e.name = t('validation.nameRequired');
        if (!formData.state?.trim()) e.state = t('validation.stateRequired');
        return e;
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
    };

    const handleMapChange = (lat: number, lng: number) => {
        setFormData((prev) => ({
            ...prev,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
        const success = await onSubmit(location.id, formData);
        if (success) onClose();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-[60] backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#121214] rounded-xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 shrink-0">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <MapPin className="size-5 text-violet-500" />
                        {mod.locations.editTitle}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Scrollable body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 gap-y-4 flex flex-col">
                        {/* Name */}
                        <div>
                            <label htmlFor="edit-location-name" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                                {mod.locations.name}
                            </label>
                            <input
                                id="edit-location-name"
                                name="name"
                                value={formData.name}
                                onChange={handleFieldChange}
                                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 outline-none transition-all dark:bg-zinc-800/50 dark:text-white ${errors.name ? 'border-red-400 focus:ring-red-400 dark:border-red-500' : 'border-zinc-300 dark:border-zinc-700 focus:ring-violet-500'}`}
                            />
                            {errors.name && <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5"><AlertCircle className="size-3" />{errors.name}</p>}
                        </div>

                        {/* Estado / Municipio */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="edit-location-state" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                                    {mod.locations.state}
                                </label>
                                <input
                                    id="edit-location-state"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleFieldChange}
                                    className={`w-full rounded-lg border px-4 py-2 focus:ring-2 outline-none transition-all dark:bg-zinc-800/50 dark:text-white ${errors.state ? 'border-red-400 focus:ring-red-400 dark:border-red-500' : 'border-zinc-300 dark:border-zinc-700 focus:ring-violet-500'}`}
                                />
                                {errors.state && <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5"><AlertCircle className="size-3" />{errors.state}</p>}
                            </div>
                            <div>
                                <label htmlFor="edit-location-municipality" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                                    {mod.locations.municipality}
                                </label>
                                <input
                                    id="edit-location-municipality"
                                    name="municipality"
                                    value={formData.municipality}
                                    onChange={handleFieldChange}
                                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white px-4 py-2 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Map picker */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                                    {mod.locations.mapSection}
                                </label>
                                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                    {mod.locations.mapHint}
                                </span>
                            </div>
                            <div className="h-56 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm">
                                <MapPicker
                                    lat={parseFloat(formData.latitude ?? '0')}
                                    lng={parseFloat(formData.longitude ?? '0')}
                                    onChange={handleMapChange}
                                />
                            </div>
                        </div>

                        {/* Coordinate fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="edit-location-latitude" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                                    {mod.locations.latitude}
                                </label>
                                <div className="relative">
                                    <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
                                    <input
                                        id="edit-location-latitude"
                                        name="latitude"
                                        value={formData.latitude}
                                        onChange={handleFieldChange}
                                        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white pl-8 pr-3 py-2 focus:ring-2 focus:ring-violet-500 outline-none transition-all font-mono text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="edit-location-longitude" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
                                    {mod.locations.longitude}
                                </label>
                                <div className="relative">
                                    <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400 rotate-90" />
                                    <input
                                        id="edit-location-longitude"
                                        name="longitude"
                                        value={formData.longitude}
                                        onChange={handleFieldChange}
                                        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white pl-8 pr-3 py-2 focus:ring-2 focus:ring-violet-500 outline-none transition-all font-mono text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 px-6 pb-6 pt-2 border-t border-zinc-200 dark:border-zinc-800">
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
                            {mod.locations.saveChanges}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
