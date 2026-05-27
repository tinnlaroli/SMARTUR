import { useEffect, useRef, useState } from 'react';
import { X, ImagePlus, MapPin, Wrench } from 'lucide-react';
import { touristServiceApi } from '../../tourist-services/api/touristServiceApi';
import { poiApi } from '../../points-of-interest/api/poiApi';
import type { TouristService } from '../../tourist-services/types/types';
import type { POI } from '../../points-of-interest/types/types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface Props {
    onClose: () => void;
    onSubmit: (formData: FormData) => Promise<boolean>;
}

export default function CreatePostModal({ onClose, onSubmit }: Props) {
    const { t } = useLanguage();
    const [caption, setCaption] = useState('');
    const [placeKind, setPlaceKind] = useState<'svc' | 'poi'>('svc');
    const [placeId, setPlaceId] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [services, setServices] = useState<TouristService[]>([]);
    const [pois, setPois] = useState<POI[]>([]);
    const [loadingPlaces, setLoadingPlaces] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setPlaceId('');
        setLoadingPlaces(true);
        if (placeKind === 'svc') {
            touristServiceApi.findAll(1, 200).then((res) => setServices(res.services)).catch(() => {}).finally(() => setLoadingPlaces(false));
        } else {
            poiApi.findAll(1, 200).then((res) => setPois(res.points ?? res.data ?? [])).catch(() => {}).finally(() => setLoadingPlaces(false));
        }
    }, [placeKind]);

    const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setImage(file);
        setPreview(file ? URL.createObjectURL(file) : null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!placeId) return;
        const fd = new FormData();
        if (caption.trim()) fd.append('caption', caption.trim());
        fd.append('place_kind', placeKind);
        fd.append('place_id', placeId);
        if (image) fd.append('photo', image);
        setSubmitting(true);
        const ok = await onSubmit(fd);
        setSubmitting(false);
        if (ok) onClose();
    };

    const canSubmit = placeId && (caption.trim() || image) && !submitting;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--color-border)' }}>
                    <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                        Nueva publicación
                    </h2>
                    <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800" style={{ color: 'var(--color-text-alt)' }}>
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Caption */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-alt)' }}>
                            Descripción
                        </label>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            maxLength={2000}
                            rows={3}
                            placeholder={t('community.createPost.placeholder')}
                            className="w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                            style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                        />
                        <p className="text-right text-xs mt-1" style={{ color: 'var(--color-text-alt)' }}>{caption.length}/2000</p>
                    </div>

                    {/* Image upload */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-alt)' }}>
                            Imagen (opcional)
                        </label>
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
                        {preview ? (
                            <div className="relative rounded-xl overflow-hidden h-36">
                                <img src={preview} alt="preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => { setImage(null); setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                                >
                                    <X className="size-3.5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 transition-colors hover:border-violet-400 hover:bg-violet-50/30 dark:hover:bg-violet-900/10"
                                style={{ borderColor: 'var(--color-border)' }}
                            >
                                <ImagePlus className="size-6" style={{ color: 'var(--color-text-alt)' }} />
                                <span className="text-xs font-medium" style={{ color: 'var(--color-text-alt)' }}>{t('community.createPost.selectImage')}</span>
                            </button>
                        )}
                    </div>

                    {/* Place kind toggle */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-alt)' }}>
                            Asociar a
                        </label>
                        <div className="flex gap-2 mb-3">
                            {(['svc', 'poi'] as const).map((k) => (
                                <button
                                    key={k}
                                    type="button"
                                    onClick={() => setPlaceKind(k)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors ${
                                        placeKind === k
                                            ? 'bg-violet-600 text-white'
                                            : 'border text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                    }`}
                                    style={placeKind !== k ? { borderColor: 'var(--color-border)' } : {}}
                                >
                                    {k === 'svc' ? <Wrench className="size-3.5" /> : <MapPin className="size-3.5" />}
                                    {k === 'svc' ? 'Servicio' : 'Punto de interés'}
                                </button>
                            ))}
                        </div>

                        <select
                            value={placeId}
                            onChange={(e) => setPlaceId(e.target.value)}
                            disabled={loadingPlaces}
                            className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50"
                            style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                        >
                            <option value="">{loadingPlaces ? 'Cargando...' : `Seleccionar ${placeKind === 'svc' ? 'servicio' : 'POI'}`}</option>
                            {placeKind === 'svc'
                                ? services.map((s) => <option key={s.id_service} value={s.id_service}>{s.name}</option>)
                                : pois.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)
                            }
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                            {submitting ? 'Publicando...' : 'Publicar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
