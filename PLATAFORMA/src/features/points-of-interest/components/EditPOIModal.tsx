import { useState, useEffect } from 'react';
import { X, Star, Loader2, Leaf, ImagePlus } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { locationApi } from '../../locations/api/locationApi';
import type { Location } from '../../locations/types/types';
import type { POI, UpdatePOIDTO } from '../types/types';
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey';

const inputClass =
    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-violet-500 disabled:opacity-50';

interface Props {
    poi: POI;
    onClose: () => void;
    onSubmit: (id: number, data: UpdatePOIDTO) => Promise<boolean | undefined>;
}

export default function EditPOIModal({ poi, onClose, onSubmit }: Props) {
    useEscapeKey(onClose);
    const { t } = useLanguage();
    const [locations, setLocations] = useState<Location[]>([]);
    const [loadingLocations, setLoadingLocations] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [name, setName] = useState(poi.name);
    const [description, setDescription] = useState(poi.description ?? '');
    const [idLocation, setIdLocation] = useState<number>(poi.id_location ?? 0);
    const [error, setError] = useState('');

    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(poi.image_url ?? null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setImage(file);
        setImagePreview(file ? URL.createObjectURL(file) : (poi.image_url ?? null));
    };

    const [isWellness, setIsWellness] = useState(poi.is_wellness ?? false);
    const [categoriaWellness, setCategoriaWellness] = useState(poi.categoria_wellness ?? '');
    const [nivelAislamiento, setNivelAislamiento] = useState(poi.nivel_aislamiento ?? 0.5);
    const [restauracionPasiva, setRestauracionPasiva] = useState(poi.restauracion_pasiva ?? 0.5);
    const [demandaFisica, setDemandaFisica] = useState(poi.demanda_fisica ?? 0.3);
    const [descripcionBienestar, setDescripcionBienestar] = useState(poi.descripcion_bienestar ?? '');

    const WELLNESS_CATEGORIES = [
        'Termal', 'Spa', 'Bosque', 'Montaña', 'Lago',
        'Retiro_Silencio', 'Ecoturismo_Activo', 'Parque',
    ];

    useEffect(() => {
        let cancelled = false;
        locationApi.findAll(1, 200).then((res) => {
            if (cancelled) return;
            setLocations(res.locations);
        }).catch(() => {}).finally(() => { if (!cancelled) setLoadingLocations(false); });
        return () => { cancelled = true; };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { setError(t('validation.nameRequired')); return; }
        setSubmitting(true);
        const ok = await onSubmit(poi.id, {
            name: name.trim(),
            description: description.trim() || undefined,
            id_location: idLocation || undefined,
            image: image ?? undefined,
            is_wellness: isWellness,
            ...(isWellness && {
                categoria_wellness: categoriaWellness || undefined,
                nivel_aislamiento: nivelAislamiento,
                restauracion_pasiva: restauracionPasiva,
                demanda_fisica: demandaFisica,
                descripcion_bienestar: descripcionBienestar.trim() || undefined,
            }),
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
                        Editar punto de interés
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
                                <option value={0}>Seleccionar ubicación…</option>
                                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        )}
                    </div>

                    {/* Imagen */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>Imagen</label>
                        <div className="flex items-center gap-3">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-zinc-500 transition-colors hover:border-violet-500/60 hover:text-violet-500 dark:border-zinc-700 dark:text-zinc-400">
                                <ImagePlus className="size-4" />
                                {image ? 'Cambiar imagen' : imagePreview ? 'Reemplazar' : 'Subir imagen'}
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

                    {/* Wellness section */}
                    <div className="rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
                        <label className="flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
                            <input
                                type="checkbox"
                                checked={isWellness}
                                onChange={(e) => setIsWellness(e.target.checked)}
                                className="size-4 rounded accent-emerald-500"
                            />
                            <Leaf className="size-4 text-emerald-500" />
                            <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Lugar de Bienestar (WellTur)</p>
                                <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>Incluir en el pool de recomendaciones wellness</p>
                            </div>
                        </label>
                        {isWellness && (
                            <div className="space-y-3 border-t px-3 pb-3 pt-3" style={{ borderColor: 'var(--color-border)' }}>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>Categoría wellness</label>
                                    <select
                                        value={categoriaWellness}
                                        onChange={(e) => setCategoriaWellness(e.target.value)}
                                        className={inputClass}
                                        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                                    >
                                        <option value="">Seleccionar…</option>
                                        {WELLNESS_CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>Descripción de bienestar</label>
                                    <input
                                        type="text"
                                        value={descripcionBienestar}
                                        onChange={(e) => setDescripcionBienestar(e.target.value)}
                                        placeholder="¿Qué experiencia de bienestar ofrece?"
                                        className={inputClass}
                                        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                                    />
                                </div>
                                {[
                                    { label: 'Aislamiento', hint: 'Qué tan alejado del ruido urbano', value: nivelAislamiento, set: setNivelAislamiento },
                                    { label: 'Relajación pasiva', hint: 'Qué tan relajante es la experiencia', value: restauracionPasiva, set: setRestauracionPasiva },
                                    { label: 'Demanda física', hint: 'Cuánto esfuerzo físico requiere', value: demandaFisica, set: setDemandaFisica },
                                ].map(({ label, hint, value, set }) => (
                                    <div key={label}>
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{label}</span>
                                            <span className="text-xs font-mono" style={{ color: 'var(--color-text-alt)' }}>{value.toFixed(2)}</span>
                                        </div>
                                        <input type="range" min={0} max={1} step={0.05} value={value} onChange={e => set(parseFloat(e.target.value))} className="w-full h-1.5 cursor-pointer accent-emerald-500" />
                                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-alt)' }}>{hint}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {error && <p className="text-xs text-rose-500">{error}</p>}

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ background: 'var(--color-pink)' }}>
                            {submitting && <Loader2 className="size-4 animate-spin" />}
                            Guardar cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
