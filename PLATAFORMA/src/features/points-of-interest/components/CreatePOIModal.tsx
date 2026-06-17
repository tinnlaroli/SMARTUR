import { useState, useEffect } from 'react';
import { X, Star, Loader2, ImagePlus } from 'lucide-react';
import MapPicker from '../../../components/ui/MapPicker';
import { useLanguage } from '../../../contexts/LanguageContext';
import { locationApi } from '../../locations/api/locationApi';
import type { Location } from '../../locations/types/types';
import type { CreatePOIDTO } from '../types/types';
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey';

const inputClass =
    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-violet-500 disabled:opacity-50';

interface Props {
    onClose: () => void;
    onSubmit: (data: CreatePOIDTO) => Promise<boolean | undefined>;
}

export default function CreatePOIModal({ onClose, onSubmit }: Props) {
    useEscapeKey(onClose);
    const { t } = useLanguage();
    const [locations, setLocations] = useState<Location[]>([]);
    const [loadingLocations, setLoadingLocations] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [idLocation, setIdLocation] = useState(0);
    const [error, setError] = useState('');
    const [lat, setLat] = useState(0);
    const [lng, setLng] = useState(0);
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setImage(file);
        setImagePreview(file ? URL.createObjectURL(file) : null);
    };

    useEffect(() => {
        let cancelled = false;
        locationApi.findAll(1, 200).then((res) => {
            if (cancelled) return;
            setLocations(res.locations);
            if (res.locations.length > 0) setIdLocation(res.locations[0].id);
        }).catch(() => {}).finally(() => { if (!cancelled) setLoadingLocations(false); });
        return () => { cancelled = true; };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { setError(t('validation.nameRequired')); return; }
        if (!idLocation) { setError(t('validation.locationRequired')); return; }
        setSubmitting(true);
        const ok = await onSubmit({
            name: name.trim(),
            description: description.trim() || undefined,
            id_location: idLocation,
            image: image ?? undefined,
            ...(lat !== 0 || lng !== 0 ? { latitude: lat, longitude: lng } : {}),
        });
        setSubmitting(false);
        if (ok) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border shadow-2xl" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--color-border)' }}>
                    <h2 className="flex items-center gap-2 text-base font-bold" style={{ color: 'var(--color-text)' }}>
                        <Star className="size-4" style={{ color: 'var(--color-pink)' }} />
                        Nuevo punto de interés
                    </h2>
                    <button type="button" onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800" style={{ color: 'var(--color-text-alt)' }}>
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-5">
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>Nombre *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('poi.namePh')}
                            className={inputClass}
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>{t('poi.description')}</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder={t('poi.descriptionPh')}
                            className={inputClass}
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', resize: 'none' }}
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>{t('poi.location')}</label>
                        {loadingLocations ? (
                            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                <Loader2 className="size-3.5 animate-spin" /> Cargando…
                            </div>
                        ) : (
                            <select
                                value={idLocation}
                                onChange={(e) => setIdLocation(Number(e.target.value))}
                                className={inputClass}
                                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                            >
                                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        )}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>
                            Ubicación en mapa
                        </label>
                        <MapPicker lat={lat} lng={lng} onChange={(la, lo) => { setLat(la); setLng(lo); }} />
                        {(lat !== 0 || lng !== 0) && (
                            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                {lat.toFixed(6)}, {lng.toFixed(6)}
                            </p>
                        )}
                    </div>

                    {/* Imagen */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>Imagen</label>
                        <div className="flex items-center gap-3">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-zinc-500 transition-colors hover:border-violet-500/60 hover:text-violet-500 dark:border-zinc-700 dark:text-zinc-400">
                                <ImagePlus className="size-4" />
                                {image ? 'Cambiar imagen' : 'Subir imagen'}
                                <input type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
                            </label>
                            <span className="text-xs text-zinc-400">{image ? image.name : 'JPG, PNG, WebP'}</span>
                        </div>
                        {imagePreview && (
                            <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <img src={imagePreview} alt="Previsualización" className="h-32 w-full object-cover" />
                            </div>
                        )}
                    </div>

                    {error && <p className="text-xs text-rose-500">{error}</p>}

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={submitting || loadingLocations} className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ background: 'var(--color-pink)' }}>
                            {submitting && <Loader2 className="size-4 animate-spin" />}
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
