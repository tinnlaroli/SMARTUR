import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, MapPin, Building2, Plus, Trash2,
    ChevronUp, ChevronDown, Route, Loader2, Save, Globe,
} from 'lucide-react';
import { itineraryBuilderApi } from '../api/itineraryBuilderApi';
import { useToast } from '../../../shared/context/ToastContext';
import { useUserPreferences } from '../../../contexts/UserPreferencesContext';
import { MODULE_COLORS } from '../../../shared/config/moduleColors';
import type { POI } from '../../points-of-interest/types/types';
import type { TouristService } from '../../tourist-services/types/types';

const COLOR = MODULE_COLORS.itineraries;

let _uidSeq = 0;
const nextUid = () => `stop-${++_uidSeq}-${Math.random().toString(36).slice(2, 5)}`;

interface StopDraft {
    uid: string;
    place_kind: 'poi' | 'svc';
    place_id: number;
    place_name: string;
    visit_date: string;
    visit_time_start: string;
    notes: string;
}

type SearchKind = 'poi' | 'svc';
interface SearchResult { id: number; name: string; kind: SearchKind }

export function AdminItineraryBuilderPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useUserPreferences();
    const isAdmin = user?.role_id === 1;

    // Form state
    const [title, setTitle]           = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic]     = useState(true);
    const [isCertified, setIsCertified] = useState(false);
    const [stops, setStops]           = useState<StopDraft[]>([]);
    const [saving, setSaving]         = useState(false);

    // Search state
    const [searchKind, setSearchKind]       = useState<SearchKind>('poi');
    const [searchQuery, setSearchQuery]     = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    // Debounced search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setSearchLoading(true);
            try {
                if (searchKind === 'poi') {
                    const items = await itineraryBuilderApi.searchPOIs(searchQuery);
                    setSearchResults(items.map((p: POI) => ({ id: p.id, name: p.name, kind: 'poi' as const })));
                } else {
                    const items = await itineraryBuilderApi.searchServices(searchQuery);
                    setSearchResults(items.map((s: TouristService) => ({ id: s.id, name: s.name, kind: 'svc' as const })));
                }
            } catch {
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery, searchKind]);

    const addStop = (result: SearchResult) => {
        if (stops.some(s => s.place_kind === result.kind && s.place_id === result.id)) return;
        setStops(prev => [...prev, {
            uid: nextUid(),
            place_kind: result.kind,
            place_id: result.id,
            place_name: result.name,
            visit_date: '',
            visit_time_start: '',
            notes: '',
        }]);
    };

    const removeStop = (uid: string) => setStops(prev => prev.filter(s => s.uid !== uid));

    const moveStop = (index: number, dir: 'up' | 'down') => {
        const next = dir === 'up' ? index - 1 : index + 1;
        if (next < 0 || next >= stops.length) return;
        setStops(prev => {
            const arr = [...prev];
            [arr[index], arr[next]] = [arr[next], arr[index]];
            return arr;
        });
    };

    const updateStop = (uid: string, field: 'visit_date' | 'visit_time_start' | 'notes', value: string) =>
        setStops(prev => prev.map(s => s.uid === uid ? { ...s, [field]: value } : s));

    const handleSave = async (publish: boolean) => {
        if (!title.trim()) {
            toast.error('El título es requerido', '');
            return;
        }
        setSaving(true);
        try {
            const id = await itineraryBuilderApi.createItinerary({
                title: title.trim(),
                description: description.trim() || undefined,
                is_public: publish ? true : isPublic,
                is_certified: isAdmin && isCertified ? true : undefined,
            });

            for (let i = 0; i < stops.length; i++) {
                const s = stops[i];
                await itineraryBuilderApi.addStop(id, {
                    place_kind: s.place_kind,
                    place_id: s.place_id,
                    stop_order: i + 1,
                    visit_date: s.visit_date || undefined,
                    visit_time_start: s.visit_time_start || undefined,
                    notes: s.notes || undefined,
                });
            }

            toast.success(
                publish ? 'Ruta publicada' : 'Borrador guardado',
                `"${title.trim()}" · ${stops.length} parada${stops.length !== 1 ? 's' : ''}`,
            );
            navigate('/dashboard/itinerarios');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error('Error al guardar la ruta', msg ?? '');
        } finally {
            setSaving(false);
        }
    };

    const inputCls = 'w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 transition';
    const inputStyle: React.CSSProperties = {
        background: 'var(--color-bg-alt)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text)',
        outlineColor: COLOR,
    };

    return (
        <div className="flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">

            {/* ── Header ── */}
            <div className="flex shrink-0 items-center gap-3">
                <button
                    onClick={() => navigate('/dashboard/itinerarios')}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition hover:opacity-80"
                    style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-alt)' }}
                >
                    <ArrowLeft className="size-4" />
                    Itinerarios
                </button>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Route className="size-5 shrink-0" style={{ color: COLOR }} />
                    <h1 className="text-lg font-bold tracking-tight truncate" style={{ color: 'var(--color-text)' }}>
                        Nuevo itinerario
                    </h1>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => void handleSave(false)}
                        disabled={saving || !title.trim()}
                        className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                    >
                        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        Guardar borrador
                    </button>
                    <button
                        onClick={() => void handleSave(true)}
                        disabled={saving || !title.trim()}
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 active:scale-95"
                        style={{ background: COLOR }}
                    >
                        {saving ? <Loader2 className="size-4 animate-spin" /> : <Globe className="size-4" />}
                        Publicar ruta
                    </button>
                </div>
            </div>

            {/* ── Two-panel layout ── */}
            <div className="flex min-h-0 flex-1 gap-4">

                {/* ── Left panel: metadata + search ── */}
                <div
                    className="w-[40%] shrink-0 flex flex-col gap-4 overflow-y-auto rounded-2xl border p-5"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                >
                    {/* Metadata fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-alt)' }}>
                                Título <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Ej: Ruta histórica del centro de Córdoba"
                                maxLength={200}
                                className={inputCls}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-alt)' }}>
                                Descripción
                            </label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Descripción breve del itinerario..."
                                rows={3}
                                maxLength={500}
                                className={`${inputCls} resize-none`}
                                style={inputStyle}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={isPublic}
                                    onChange={e => setIsPublic(e.target.checked)}
                                    className="size-4 rounded"
                                    style={{ accentColor: COLOR }}
                                />
                                <span className="text-sm" style={{ color: 'var(--color-text)' }}>Ruta pública</span>
                            </label>
                            {isAdmin && (
                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={isCertified}
                                        onChange={e => setIsCertified(e.target.checked)}
                                        className="size-4 rounded"
                                        style={{ accentColor: COLOR }}
                                    />
                                    <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                                        Certificada WELLTUR
                                        <span
                                            className="ml-1.5 text-[10px] font-bold uppercase tracking-wide rounded-full px-1.5 py-0.5"
                                            style={{ background: `${COLOR}20`, color: COLOR }}
                                        >
                                            Admin
                                        </span>
                                    </span>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px shrink-0" style={{ background: 'var(--color-border)' }} />

                    {/* Search */}
                    <div className="flex flex-col gap-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-alt)' }}>
                            Agregar parada
                        </p>

                        {/* Kind toggle */}
                        <div
                            className="flex rounded-xl overflow-hidden border"
                            style={{ borderColor: 'var(--color-border)' }}
                        >
                            {(['poi', 'svc'] as const).map(k => (
                                <button
                                    key={k}
                                    onClick={() => { setSearchKind(k); setSearchQuery(''); setSearchResults([]); }}
                                    className="flex-1 py-1.5 text-xs font-semibold transition-colors"
                                    style={searchKind === k
                                        ? { background: COLOR, color: '#fff' }
                                        : { background: 'var(--color-bg-alt)', color: 'var(--color-text-alt)' }
                                    }
                                >
                                    {k === 'poi' ? 'POI' : 'Servicio'}
                                </button>
                            ))}
                        </div>

                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={searchKind === 'poi' ? 'Buscar punto de interés...' : 'Buscar servicio turístico...'}
                            className={inputCls}
                            style={inputStyle}
                        />

                        {/* Results */}
                        {searchLoading && (
                            <div className="flex justify-center py-4">
                                <Loader2 className="size-5 animate-spin" style={{ color: COLOR }} />
                            </div>
                        )}
                        {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
                            <p className="text-xs text-center py-2" style={{ color: 'var(--color-text-alt)' }}>
                                Sin resultados para "{searchQuery}"
                            </p>
                        )}
                        {!searchLoading && searchResults.length > 0 && (
                            <div className="space-y-1.5">
                                {searchResults.map(r => {
                                    const added = stops.some(s => s.place_kind === r.kind && s.place_id === r.id);
                                    return (
                                        <div
                                            key={`${r.kind}-${r.id}`}
                                            className="flex items-center justify-between rounded-lg px-3 py-2 gap-2"
                                            style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                {r.kind === 'poi'
                                                    ? <MapPin className="size-3.5 shrink-0" style={{ color: COLOR }} />
                                                    : <Building2 className="size-3.5 shrink-0" style={{ color: COLOR }} />
                                                }
                                                <span className="text-sm truncate" style={{ color: 'var(--color-text)' }}>
                                                    {r.name}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => addStop(r)}
                                                disabled={added}
                                                className="shrink-0 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors disabled:opacity-40"
                                                style={added
                                                    ? { background: 'var(--color-bg)', color: 'var(--color-text-alt)' }
                                                    : { background: `${COLOR}22`, color: COLOR }
                                                }
                                            >
                                                <Plus className="size-3" />
                                                {added ? 'Agregado' : 'Agregar'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right panel: stops ── */}
                <div
                    className="flex-1 flex flex-col gap-3 overflow-y-auto rounded-2xl border p-5"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                >
                    <div className="flex items-center gap-2 shrink-0">
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                            Paradas
                        </p>
                        <span
                            className="rounded-full px-2 py-0.5 text-xs font-bold"
                            style={{ background: `${COLOR}20`, color: COLOR }}
                        >
                            {stops.length}
                        </span>
                    </div>

                    {stops.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12">
                            <Route className="size-12" style={{ color: 'var(--color-border)' }} />
                            <p className="text-sm font-medium" style={{ color: 'var(--color-text-alt)' }}>
                                Sin paradas todavía
                            </p>
                            <p className="text-xs text-center max-w-xs" style={{ color: 'var(--color-text-alt)' }}>
                                Busca POIs o servicios en el panel izquierdo y agrégalos a tu ruta
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stops.map((stop, index) => (
                                <div
                                    key={stop.uid}
                                    className="rounded-xl border p-4 space-y-3"
                                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
                                >
                                    {/* Stop header row */}
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                                            style={{ background: COLOR }}
                                        >
                                            {index + 1}
                                        </span>
                                        {stop.place_kind === 'poi'
                                            ? <MapPin className="size-4 shrink-0" style={{ color: COLOR }} />
                                            : <Building2 className="size-4 shrink-0" style={{ color: COLOR }} />
                                        }
                                        <span className="flex-1 text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                                            {stop.place_name}
                                        </span>
                                        <span
                                            className="text-[10px] font-semibold rounded-full px-2 py-0.5 shrink-0"
                                            style={{ background: `${COLOR}18`, color: COLOR }}
                                        >
                                            {stop.place_kind === 'poi' ? 'POI' : 'Servicio'}
                                        </span>
                                        <div className="flex items-center gap-0.5 shrink-0">
                                            <button
                                                onClick={() => moveStop(index, 'up')}
                                                disabled={index === 0}
                                                title="Mover arriba"
                                                className="rounded-md p-0.5 transition-colors hover:opacity-80 disabled:opacity-20"
                                                style={{ color: 'var(--color-text-alt)' }}
                                            >
                                                <ChevronUp className="size-4" />
                                            </button>
                                            <button
                                                onClick={() => moveStop(index, 'down')}
                                                disabled={index === stops.length - 1}
                                                title="Mover abajo"
                                                className="rounded-md p-0.5 transition-colors hover:opacity-80 disabled:opacity-20"
                                                style={{ color: 'var(--color-text-alt)' }}
                                            >
                                                <ChevronDown className="size-4" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeStop(stop.uid)}
                                            title="Eliminar parada"
                                            className="rounded-lg p-1 transition-colors hover:text-rose-500"
                                            style={{ color: 'var(--color-text-alt)' }}
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>

                                    {/* Date / time / notes */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] font-semibold mb-1" style={{ color: 'var(--color-text-alt)' }}>
                                                Fecha de visita
                                            </label>
                                            <input
                                                type="date"
                                                value={stop.visit_date}
                                                onChange={e => updateStop(stop.uid, 'visit_date', e.target.value)}
                                                className={`${inputCls} text-xs`}
                                                style={inputStyle}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold mb-1" style={{ color: 'var(--color-text-alt)' }}>
                                                Hora de inicio
                                            </label>
                                            <input
                                                type="time"
                                                value={stop.visit_time_start}
                                                onChange={e => updateStop(stop.uid, 'visit_time_start', e.target.value)}
                                                className={`${inputCls} text-xs`}
                                                style={inputStyle}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold mb-1" style={{ color: 'var(--color-text-alt)' }}>
                                            Notas
                                        </label>
                                        <input
                                            type="text"
                                            value={stop.notes}
                                            onChange={e => updateStop(stop.uid, 'notes', e.target.value)}
                                            placeholder="Recomendaciones, horarios, duración..."
                                            maxLength={300}
                                            className={`${inputCls} text-xs`}
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminItineraryBuilderPage;
