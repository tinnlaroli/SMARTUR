import { useState, useEffect } from 'react';
import { X, Star, Loader2, Leaf } from 'lucide-react';
import { locationApi } from '../../locations/api/locationApi';
import type { Location } from '../../locations/types/types';
import type { CreatePOIDTO } from '../types/types';

const POI_TYPES = [
    { label: 'Natural', value: 1 },
    { label: 'Cultural', value: 2 },
    { label: 'Histórico', value: 3 },
    { label: 'Recreativo', value: 4 },
];

const inputClass =
    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-violet-500 disabled:opacity-50';

interface Props {
    onClose: () => void;
    onSubmit: (data: CreatePOIDTO) => Promise<boolean | undefined>;
}

export default function CreatePOIModal({ onClose, onSubmit }: Props) {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loadingLocations, setLoadingLocations] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [idType, setIdType] = useState(1);
    const [idLocation, setIdLocation] = useState(0);
    const [sustainability, setSustainability] = useState(false);
    const [error, setError] = useState('');

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
        if (!name.trim()) { setError('El nombre es obligatorio.'); return; }
        if (!idLocation) { setError('Selecciona una ubicación.'); return; }
        setSubmitting(true);
        const ok = await onSubmit({ name: name.trim(), description: description.trim() || undefined, id_type: idType, id_location: idLocation, sustainability });
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
                            placeholder="Ej: Cascada Las Ánimas"
                            className={inputClass}
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>Descripción</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Describe el punto de interés…"
                            className={inputClass}
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', resize: 'none' }}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>Tipo</label>
                            <select
                                value={idType}
                                onChange={(e) => setIdType(Number(e.target.value))}
                                className={inputClass}
                                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                            >
                                {POI_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>Ubicación</label>
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
                    </div>

                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60" style={{ borderColor: 'var(--color-border)' }}>
                        <input
                            type="checkbox"
                            checked={sustainability}
                            onChange={(e) => setSustainability(e.target.checked)}
                            className="size-4 rounded text-violet-600"
                        />
                        <Leaf className="size-4 text-emerald-500" />
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Sostenible</p>
                            <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>Marca si el POI cumple criterios de sostenibilidad</p>
                        </div>
                    </label>

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
