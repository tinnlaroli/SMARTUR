import { useEffect, useState, useCallback } from 'react';
import { Leaf, CheckCircle, XCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { api } from '../../../shared/api/axiosClient';
import { useToast } from '../../../shared/context/ToastContext';
import { useAdminBadges } from '../../dashboard/context/AdminBadgesContext';
import { WELLNESS_CATEGORIES, WELLNESS_DIMENSIONS, WELLNESS_PHYSICAL_EFFORT_LEVELS } from '../../points-of-interest/components/WellnessPlaceFields';
import { isWellnessEvidenceComplete, parseWellnessEvidence, serializeWellnessEvidence } from '../../points-of-interest/components/wellnessEvidence';

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
    wellness_dimensions?: string[];
    wellness_evidence?: string;
    wellness_motives?: string[];
    wellness_modalities?: string[];
    wellness_mw_evidence?: Record<string, string>;
    wellness_status: string;
}

const WELLTUR_MOTIVES = [
    ['M1', 'Descansar o hacer una pausa'],
    ['M2', 'Mantenerme activo/a o buscar vitalidad física'],
    ['M3', 'Contacto con naturaleza o entorno'],
    ['M4', 'Aprender sobre una práctica o tema'],
    ['M5', 'Compartir o conectar con otras personas'],
    ['M6', 'Probar algo nuevo o diferente'],
    ['M7', 'Dedicar tiempo al autocuidado'],
    ['M8', 'Elegir alimentos o bebidas de interés'],
    ['M9', 'Atención plena o reflexión personal'],
] as const;

const WELLTUR_MODALITIES = [
    ['W1', 'Pausa y descanso'],
    ['W2', 'Naturaleza y aire libre'],
    ['W3', 'Movimiento'],
    ['W4', 'Práctica mente-cuerpo'],
    ['W5', 'Experiencia culinaria'],
    ['W6', 'Aprendizaje'],
    ['W7', 'Autocuidado'],
] as const;

function isMWEvidenceComplete(motives: string[], modalities: string[], evidence: Record<string, string>) {
    const selected = [...motives, ...modalities];
    return selected.length === Object.keys(evidence).length && selected.every((code) =>
        typeof evidence[code] === 'string' && evidence[code].trim().length >= 10 && evidence[code].trim().length <= 180,
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
    const [demanda, setDemanda] = useState(item.demanda_fisica ?? 0.5);
    const [dimensions, setDimensions] = useState<string[]>(item.wellness_dimensions ?? []);
    const [evidence, setEvidence] = useState(item.wellness_evidence ?? '');
    const [mwMotives, setMwMotives] = useState<string[]>(item.wellness_motives ?? []);
    const [mwModalities, setMwModalities] = useState<string[]>(item.wellness_modalities ?? []);
    const [mwEvidence, setMwEvidence] = useState<Record<string, string>>(item.wellness_mw_evidence ?? {});
    const evidenceRecord = parseWellnessEvidence(evidence);
    const selectedEffort = WELLNESS_PHYSICAL_EFFORT_LEVELS.reduce((nearest, level) =>
        Math.abs(level.value - demanda) < Math.abs(nearest.value - demanda) ? level : nearest,
    );
    const [formError, setFormError] = useState('');

    const updateEvidence = (patch: Partial<typeof evidenceRecord>) => {
        setEvidence(serializeWellnessEvidence({ ...evidenceRecord, ...patch }));
    };
    const toggleDimension = (key: string) => {
        const next = dimensions.includes(key) ? dimensions.filter((d) => d !== key) : [...dimensions, key];
        setDimensions(next);
        if (!next.includes(key)) {
            const nextEvidence = { ...evidenceRecord.dimensions };
            delete nextEvidence[key];
            setEvidence(serializeWellnessEvidence({ ...evidenceRecord, dimensions: nextEvidence }));
        }
    };

    const toggleMwCode = (code: string, axis: 'motive' | 'modality') => {
        const current = axis === 'motive' ? mwMotives : mwModalities;
        const setCurrent = axis === 'motive' ? setMwMotives : setMwModalities;
        const next = current.includes(code) ? current.filter((value) => value !== code) : [...current, code];
        setCurrent(next);
        if (!next.includes(code)) {
            const updated = { ...mwEvidence };
            delete updated[code];
            setMwEvidence(updated);
        }
    };

    const submit = async (action: 'approved' | 'rejected') => {
        if (action === 'approved' && (!categoria || !isWellnessEvidenceComplete(evidence, dimensions))) {
            setFormError('Indica dónde se verificó la actividad y describe cómo respalda cada dimensión seleccionada.');
            setExpanded(true);
            return;
        }
        if (action === 'approved' && (mwMotives.length > 0 || mwModalities.length > 0) &&
            !isMWEvidenceComplete(mwMotives, mwModalities, mwEvidence)) {
            setFormError('Agrega evidencia observable de al menos 10 caracteres para cada etiqueta M/W, o deja ambos ejes sin etiquetas.');
            setExpanded(true);
            return;
        }
        setFormError('');
        setSubmitting(true);
        try {
            await api.patch(`/ml/wellness/review/${item.type}/${item.id}`, {
                action,
                demanda_fisica:     demanda,
                categoria_wellness: categoria || undefined,
                wellness_dimensions: dimensions,
                wellness_evidence: evidence.trim(),
                wellness_motives: mwMotives,
                wellness_modalities: mwModalities,
                wellness_mw_evidence: mwEvidence,
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

            <div className="px-4 pb-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>Dimensiones propuestas</p>
                <p className="text-xs" style={{ color: 'var(--color-text)' }}>
                    {(item.wellness_dimensions ?? []).length
                        ? (item.wellness_dimensions ?? []).map((key) => WELLNESS_DIMENSIONS.find((d) => d.key === key)?.label ?? key).join(' · ')
                        : 'El prestador aún no propuso dimensiones.'}
                </p>
            </div>

            {item.wellness_evidence && (
                <div className="px-4 pb-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>Fuente de la propuesta</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>{parseWellnessEvidence(item.wellness_evidence).source || 'Sin fuente registrada.'}</p>
                    {Object.entries(parseWellnessEvidence(item.wellness_evidence).dimensions).map(([key, detail]) => (
                        <p key={key} className="mt-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                            <strong>{WELLNESS_DIMENSIONS.find((dimension) => dimension.key === key)?.label ?? key}:</strong> {detail}
                        </p>
                    ))}
                </div>
            )}

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
                        Revisión de la propuesta
                    </p>
                    <div className="rounded-xl border px-3 py-2.5 text-xs leading-relaxed" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}>
                        <p className="mb-1 font-semibold" style={{ color: 'var(--color-text)' }}>Antes de aprobar, confirma:</p>
                        <ul className="list-disc space-y-1 pl-4">
                            <li>La actividad o servicio está descrito de forma concreta y aparece en una fuente o en una observación fechada.</li>
                            <li>Cada dimensión seleccionada corresponde a algo que la persona realmente puede hacer o vivir.</li>
                            <li>La aprobación clasifica una experiencia de SMARTUR; no certifica calidad GWI ni un beneficio clínico.</li>
                        </ul>
                        <p className="mt-2">Que los campos estén completos solo indica que se capturó la información mínima; revisa la fuente y la relación de cada actividad antes de decidir.</p>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-alt)' }}>
                            Tipo de experiencia en SMARTUR
                        </label>
                        <select
                            value={categoria}
                            onChange={e => setCategoria(e.target.value)}
                            className="w-full rounded-xl border px-3 py-2 text-sm"
                            style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                        >
                            <option value="">Sin categoría</option>
                            {WELLNESS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <fieldset>
                        <legend className="mb-2 text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>
                            Dimensiones relacionadas con la actividad (marcar solo las sustentadas)
                        </legend>
                        <div className="space-y-2">
                            {WELLNESS_DIMENSIONS.map(({ key, label, description }) => (
                                <label key={key} className="flex cursor-pointer items-start gap-2 rounded-xl border p-3" style={{ borderColor: 'var(--color-border)' }}>
                                    <input type="checkbox" checked={dimensions.includes(key)} onChange={() => toggleDimension(key)} className="mt-0.5 size-4 accent-emerald-600" />
                                    <span>
                                        <span className="block text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{label}</span>
                                        <span className="block text-[11px] leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>{description}</span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <section className="space-y-3 rounded-xl border p-3" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="rounded-lg bg-violet-50 px-3 py-2 text-xs leading-relaxed text-violet-950 dark:bg-violet-950/30 dark:text-violet-100">
                            <strong>Etiquetas de búsqueda M/W (propuesta de investigación).</strong> Son distintas de GWI y no clasifican psicológicamente al viajero. Asigna solo una etiqueta si la ficha demuestra una actividad concreta; cada relación necesita evidencia. Estos criterios aún requieren revisión con viajeros y especialistas.
                        </div>
                        <fieldset>
                            <legend className="mb-2 text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>Qué podría buscar el viajero (M)</legend>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {WELLTUR_MOTIVES.map(([code, label]) => (
                                    <label key={code} className="flex items-start gap-2 rounded-lg border p-2 text-xs" style={{ borderColor: 'var(--color-border)' }}>
                                        <input type="checkbox" checked={mwMotives.includes(code)} onChange={() => toggleMwCode(code, 'motive')} className="mt-0.5 size-4 accent-violet-600" />
                                        <span><strong>{code}</strong> · {label}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        <fieldset>
                            <legend className="mb-2 text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>Cómo prefiere vivirlo (W)</legend>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {WELLTUR_MODALITIES.map(([code, label]) => (
                                    <label key={code} className="flex items-start gap-2 rounded-lg border p-2 text-xs" style={{ borderColor: 'var(--color-border)' }}>
                                        <input type="checkbox" checked={mwModalities.includes(code)} onChange={() => toggleMwCode(code, 'modality')} className="mt-0.5 size-4 accent-violet-600" />
                                        <span><strong>{code}</strong> · {label}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        {[...mwMotives, ...mwModalities].map((code) => (
                            <label key={code} className="block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>
                                Evidencia para {code} (mínimo 10 caracteres)
                                <textarea
                                    rows={2}
                                    maxLength={180}
                                    value={mwEvidence[code] ?? ''}
                                    onChange={(event) => setMwEvidence({ ...mwEvidence, [code]: event.target.value })}
                                    placeholder="Actividad concreta y dónde se comprobó (fuente o visita fechada)"
                                    className="mt-1 w-full resize-y rounded-xl border px-3 py-2 text-sm font-normal"
                                    style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                                />
                            </label>
                        ))}
                        <p className="text-[10px]" style={{ color: 'var(--color-text-alt)' }}>
                            {mwMotives.length + mwModalities.length === 0
                                ? 'Puedes aprobar el registro GWI sin asignarle etiquetas M/W.'
                                : isMWEvidenceComplete(mwMotives, mwModalities, mwEvidence)
                                    ? 'Etiquetas M/W con evidencia capturada; no implica validación psicométrica.'
                                    : 'Falta evidencia para una o más etiquetas seleccionadas.'}
                        </p>
                    </section>

                    <div className="space-y-3">
                        <div>
                            <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>¿Dónde se comprobó que ofrecen esta actividad? (10–180 caracteres)</label>
                            <p className="mb-1 text-[10px] leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                                Enlace o documento consultado; si fue una visita, indica lugar y fecha. Ej.: “Sitio oficial, consultado el dd/mm/aaaa” o “Visita al lugar, localidad, dd/mm/aaaa”. La evidencia debe describir la actividad, no prometer efectos médicos.
                            </p>
                            <input maxLength={180} value={evidenceRecord.source} onChange={e => updateEvidence({ source: e.target.value })}
                                placeholder="Enlace o documento consultado, o lugar y fecha de la visita"
                                className="w-full rounded-xl border px-3 py-2 text-sm"
                                style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }} />
                        </div>
                        {dimensions.map((key) => {
                            const dimension = WELLNESS_DIMENSIONS.find((entry) => entry.key === key);
                            return <div key={key}>
                                <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>
                                    Evidencia para {dimension?.label ?? key} (12–80 caracteres)
                                </label>
                                <textarea rows={2} maxLength={80} value={evidenceRecord.dimensions[key] ?? ''}
                                    onChange={e => updateEvidence({ dimensions: { ...evidenceRecord.dimensions, [key]: e.target.value } })}
                                    placeholder="Actividad concreta y relación observable con esta dimensión"
                                    className="w-full resize-y rounded-xl border px-3 py-2 text-sm"
                                    style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }} />
                            </div>;
                        })}
                        <p className="text-[10px]" style={{ color: 'var(--color-text-alt)' }}>
                            Registro {evidence.length}/1000 caracteres{isWellnessEvidenceComplete(evidence, dimensions) ? ' · campos listos para revisión interna' : ' · falta información'}
                        </p>
                    </div>

                    <div>
                        <label htmlFor={`wellness-effort-${item.id}`} className="mb-1 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>Esfuerzo físico aproximado</label>
                        <select id={`wellness-effort-${item.id}`} value={selectedEffort.value} onChange={e => setDemanda(Number(e.target.value))}
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                            style={{ background: 'var(--color-bg)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}>
                            {WELLNESS_PHYSICAL_EFFORT_LEVELS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        <p className="mt-1 text-[10px]" style={{ color: 'var(--color-text-alt)' }}>{selectedEffort.detail} Este dato solo desempata lugares con igual coincidencia.</p>
                    </div>

                    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100">
                        El marco de GWI orienta la clasificación, pero no es una rúbrica ni certificación de GWI. La aprobación es una revisión interna de SMARTUR.
                    </p>
                    {formError && <p role="alert" className="text-xs font-medium text-red-600">{formError}</p>}

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
                            disabled={submitting || !categoria || !isWellnessEvidenceComplete(evidence, dimensions) ||
                                ((mwMotives.length > 0 || mwModalities.length > 0) && !isMWEvidenceComplete(mwMotives, mwModalities, mwEvidence))}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                            style={{ background: '#22c55e' }}
                        >
                            {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                            Aprobar lugar wellness
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
