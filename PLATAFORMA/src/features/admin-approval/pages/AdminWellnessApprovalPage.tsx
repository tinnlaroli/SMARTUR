import { useEffect, useState, useCallback } from 'react';
import { Leaf, CheckCircle, XCircle, ChevronDown, ChevronUp, Loader2, BarChart2, AlertCircle } from 'lucide-react';
import { api } from '../../../shared/api/axiosClient';
import { useToast } from '../../../shared/context/ToastContext';
import { useAdminBadges } from '../../dashboard/context/AdminBadgesContext';

interface WellnessPendingItem {
    id: number;
    name: string;
    type: 'service' | 'poi';
    empresa?: string;
    categoria_wellness?: string;
    nivel_aislamiento?: number;
    restauracion_pasiva?: number;
    demanda_fisica?: number;
    descripcion_bienestar?: string;
    wellness_status: string;
}

const WELLNESS_CATEGORIES = [
    'Termal', 'Spa', 'Bosque', 'Montaña', 'Lago',
    'Retiro_Silencio', 'Ecoturismo_Activo', 'Parque',
];

function DimensionSlider({
    label,
    hint,
    value,
    onChange,
}: {
    label: string;
    hint: string;
    value: number;
    onChange: (v: number) => void;
}) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                    {label}
                </span>
                <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--color-text-alt)' }}>
                    {value.toFixed(2)}
                </span>
            </div>
            <input
                type="range" min={0} max={1} step={0.05}
                value={value}
                onChange={e => onChange(parseFloat(e.target.value))}
                className="w-full accent-green-500 h-1.5 cursor-pointer"
            />
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-alt)' }}>{hint}</p>
        </div>
    );
}

function WellnessReviewCard({
    item,
    onRefresh,
}: {
    item: WellnessPendingItem;
    onRefresh: () => void;
}) {
    const toast = useToast();
    const { refresh: refreshBadges } = useAdminBadges();
    const [expanded, setExpanded] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [notes, setNotes] = useState('');
    const [categoria, setCategoria] = useState(item.categoria_wellness ?? '');
    const [aislamiento, setAislamiento] = useState(item.nivel_aislamiento ?? 0.5);
    const [restauracion, setRestauracion] = useState(item.restauracion_pasiva ?? 0.5);
    const [demanda, setDemanda] = useState(item.demanda_fisica ?? 0.5);

    const submit = async (action: 'approved' | 'rejected') => {
        setSubmitting(true);
        try {
            await api.patch(`/ml/wellness/review/${item.type}/${item.id}`, {
                action,
                nivel_aislamiento:  aislamiento,
                restauracion_pasiva: restauracion,
                demanda_fisica:     demanda,
                categoria_wellness: categoria || undefined,
                admin_notes:        notes || undefined,
            });
            toast.success(
                action === 'approved'
                    ? `✓ "${item.name}" aprobado como lugar de bienestar.`
                    : `"${item.name}" rechazado — queda como servicio regular.`,
            );
            refreshBadges();
            onRefresh();
        } catch {
            toast.error('Error al actualizar el estado wellness.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="rounded-2xl border overflow-hidden transition-shadow hover:shadow-md"
            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
        >
            {/* Card header */}
            <div className="flex items-start justify-between px-4 py-3">
                <div className="flex items-start gap-3">
                    <div
                        className="flex size-9 items-center justify-center rounded-xl shrink-0"
                        style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}
                    >
                        <Leaf className="size-4" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                            {item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span
                                className="text-[10px] font-medium rounded-full px-2 py-0.5"
                                style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}
                            >
                                {item.type === 'service' ? 'Servicio' : 'POI'}
                            </span>
                            {item.empresa && (
                                <span className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                    {item.empresa}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setExpanded(p => !p)}
                    className="rounded-lg p-1.5 hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--color-text-alt)' }}
                >
                    {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
            </div>

            {/* Proposed values (always visible) */}
            <div className="px-4 pb-3 grid grid-cols-3 gap-2">
                {[
                    { label: 'Aislamiento', v: item.nivel_aislamiento },
                    { label: 'Restauración', v: item.restauracion_pasiva },
                    { label: 'Demanda física', v: item.demanda_fisica },
                ].map(({ label, v }) => (
                    <div key={label} className="rounded-xl px-3 py-2 text-center"
                        style={{ background: 'var(--color-bg-alt)' }}>
                        <p className="text-[10px] mb-0.5" style={{ color: 'var(--color-text-alt)' }}>{label}</p>
                        <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                            {v != null ? (v * 10).toFixed(0) : '—'}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--color-text-alt)' }}>/ 10</p>
                    </div>
                ))}
            </div>

            {item.descripcion_bienestar && (
                <div className="px-4 pb-3">
                    <p className="text-xs italic" style={{ color: 'var(--color-text-alt)' }}>
                        "{item.descripcion_bienestar}"
                    </p>
                </div>
            )}

            {/* Expanded: admin edits */}
            {expanded && (
                <div className="px-4 pb-4 border-t pt-4 space-y-4"
                    style={{ borderColor: 'var(--color-border)' }}>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-alt)' }}>
                        Ajustar dimensiones
                    </p>

                    {/* Category */}
                    <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-alt)' }}>
                            Categoría wellness
                        </label>
                        <select
                            value={categoria}
                            onChange={e => setCategoria(e.target.value)}
                            className="w-full rounded-xl border px-3 py-2 text-sm"
                            style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                        >
                            <option value="">Sin categoría</option>
                            {WELLNESS_CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                        </select>
                    </div>

                    {/* Sliders */}
                    <div className="space-y-3">
                        <DimensionSlider
                            label="Nivel de aislamiento"
                            hint="0 = centro urbano · 1 = muy alejado"
                            value={aislamiento}
                            onChange={setAislamiento}
                        />
                        <DimensionSlider
                            label="Restauración pasiva"
                            hint="0 = activo/estimulante · 1 = muy relajante"
                            value={restauracion}
                            onChange={setRestauracion}
                        />
                        <DimensionSlider
                            label="Demanda física"
                            hint="0 = sin esfuerzo · 1 = alta exigencia"
                            value={demanda}
                            onChange={setDemanda}
                        />
                    </div>

                    {/* Admin notes */}
                    <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-alt)' }}>
                            Observaciones al prestador (opcional)
                        </label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Ej. Se ajustó demanda física por ser ruta de senderismo moderado…"
                            className="w-full rounded-xl border px-3 py-2 text-sm resize-none"
                            style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={() => submit('approved')}
                            disabled={submitting}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                            style={{ background: '#22c55e' }}
                        >
                            {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                            Aprobar como Bienestar
                        </button>
                        <button
                            onClick={() => submit('rejected')}
                            disabled={submitting}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                        >
                            <XCircle className="size-4" />
                            Rechazar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Tipos de métricas del clasificador ─────────────────────────────────────
interface WellnessClassifierMetrics {
    accuracy: number | null;
    macro_f1: number | null;
    trained_at: string | null;
    n_samples: number | null;
    dataset: string;
    classification_report: Record<string, unknown>;
}

interface WellnessMetricsResponse {
    classifier: WellnessClassifierMetrics;
    disclaimer: string;
}

function WellnessMetricsCard() {
    const [data, setData] = useState<WellnessMetricsResponse | null>(null);
    const [err, setErr] = useState(false);

    useEffect(() => {
        api.get<WellnessMetricsResponse>('/ml/wellness/metrics')
            .then(r => setData(r.data))
            .catch(() => setErr(true));
    }, []);

    const fmt = (v: number | null) => v != null ? (v * 100).toFixed(1) + '%' : '—';
    const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString('es-MX', { dateStyle: 'medium' }) : '—';

    return (
        <div
            className="rounded-2xl border p-4 mb-4"
            style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
        >
            <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="size-4" style={{ color: 'var(--color-green)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    Métricas del Clasificador Wellness
                </p>
            </div>

            {err ? (
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                    <AlertCircle className="size-3.5 shrink-0" />
                    Modelo no entrenado aún — ejecuta el entrenamiento desde la terminal.
                </div>
            ) : !data ? (
                <div className="h-8 flex items-center">
                    <Loader2 className="size-4 animate-spin" style={{ color: 'var(--color-text-alt)' }} />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="rounded-xl border px-3 py-2 text-center" style={{ borderColor: 'var(--color-border)' }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-alt)' }}>Accuracy</p>
                            <p className="text-lg font-extrabold tabular-nums" style={{ color: 'var(--color-green)' }}>
                                {fmt(data.classifier.accuracy)}
                            </p>
                        </div>
                        <div className="rounded-xl border px-3 py-2 text-center" style={{ borderColor: 'var(--color-border)' }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-alt)' }}>Macro F1</p>
                            <p className="text-lg font-extrabold tabular-nums" style={{ color: 'var(--color-cyan)' }}>
                                {fmt(data.classifier.macro_f1)}
                            </p>
                        </div>
                        <div className="rounded-xl border px-3 py-2 text-center" style={{ borderColor: 'var(--color-border)' }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-alt)' }}>Muestras</p>
                            <p className="text-lg font-extrabold tabular-nums" style={{ color: 'var(--color-text)' }}>
                                {data.classifier.n_samples?.toLocaleString('es-MX') ?? '—'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-1.5 text-[10px] leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                        <AlertCircle className="size-3 mt-0.5 shrink-0" />
                        <span>
                            Entrenado {fmtDate(data.classifier.trained_at)} sobre datos {data.classifier.dataset}.{' '}
                            {data.disclaimer}
                        </span>
                    </div>
                </>
            )}
        </div>
    );
}

export default function AdminWellnessApprovalPage() {
    const [items, setItems] = useState<WellnessPendingItem[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get<{ items: WellnessPendingItem[] }>('/ml/wellness/pending');
            setItems(data.items ?? []);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    return (
        <div className="space-y-3">
            <WellnessMetricsCard />

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin" style={{ color: 'var(--color-text-alt)' }} />
                </div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div
                        className="flex size-12 items-center justify-center rounded-2xl"
                        style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}
                    >
                        <Leaf className="size-6" />
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        Sin pendientes de bienestar
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                        Cuando una empresa marque un servicio como wellness, aparecerá aquí para revisión.
                    </p>
                </div>
            ) : (
                <>
                    <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                        {items.length} {items.length === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'} — revisa y ajusta las dimensiones antes de aprobar.
                    </p>
                    {items.map(item => (
                        <WellnessReviewCard
                            key={`${item.type}-${item.id}`}
                            item={item}
                            onRefresh={load}
                        />
                    ))}
                </>
            )}
        </div>
    );
}
