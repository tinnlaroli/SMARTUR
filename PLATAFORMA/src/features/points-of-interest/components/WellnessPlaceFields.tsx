import { Check, CircleDashed, Leaf, MapPin } from 'lucide-react';
import { isWellnessEvidenceComplete, parseWellnessEvidence, serializeWellnessEvidence } from './wellnessEvidence';

export const WELLNESS_CATEGORIES = [
    'Termal', 'Spa', 'Naturaleza', 'Movimiento', 'Cultural',
    'Gastronomía saludable', 'Comunidad', 'Retiro', 'Otro',
] as const;

export const WELLNESS_DIMENSIONS = [
    { key: 'physical', label: 'Física', description: 'Movimiento, alimentación, sueño o cuidado del cuerpo.' },
    { key: 'mental', label: 'Mental', description: 'Aprendizaje, resolución de problemas o creatividad.' },
    { key: 'emotional', label: 'Emocional', description: 'Reconocimiento, aceptación o expresión de emociones.' },
    { key: 'spiritual', label: 'Espiritual', description: 'Búsqueda de sentido, valores o propósito personal.' },
    { key: 'social', label: 'Social', description: 'Conexión significativa con otras personas o comunidad.' },
    { key: 'environmental', label: 'Ambiental', description: 'Relación entre las acciones de las personas y su entorno.' },
] as const;

export const WELLNESS_PHYSICAL_EFFORT_LEVELS = [
    { value: 0, label: 'Suave', detail: 'Sin esfuerzo físico relevante o con pausas frecuentes.' },
    { value: 0.5, label: 'Intermedio', detail: 'Actividad moderada; requiere movilidad o esfuerzo sostenido.' },
    { value: 1, label: 'Exigente', detail: 'Actividad vigorosa, larga o con terreno físicamente demandante.' },
] as const;

const inputClass =
    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500 disabled:opacity-50';
const inputStyle = { borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' };

export interface WellnessPlaceValues {
    isWellness: boolean;
    categoriaWellness: string;
    wellnessDimensions: string[];
    wellnessEvidence: string;
    demandaFisica: number;
    descripcionBienestar: string;
    // Legacy fields remain in the API/DB for old mobile builds.
    nivelAislamiento: number;
    restauracionPasiva: number;
}

interface Props {
    values: WellnessPlaceValues;
    onChange: (patch: Partial<WellnessPlaceValues>) => void;
    /** Estado de revisión actual del lugar (solo al editar). */
    estado?: string | null;
}

const ESTADO_TEXTO: Record<string, { texto: string; clase: string }> = {
    approved: { texto: 'Aprobado: aparece en Welltur', clase: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    pending: { texto: 'En revisión: aún no aparece en Welltur', clase: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    rejected: { texto: 'Rechazado: corrige y vuelve a enviar', clase: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

/** Encabezado numerado de cada paso, con palomita cuando ya está completo. */
function Paso({ n, titulo, listo, children }: { n: number; titulo: string; listo: boolean; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
            <div className="mb-3 flex items-center gap-2">
                <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    listo ? 'bg-emerald-600 text-white' : 'border'
                }`} style={listo ? undefined : { borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}>
                    {listo ? <Check className="size-3.5" /> : n}
                </span>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{titulo}</p>
            </div>
            {children}
        </div>
    );
}

export default function WellnessPlaceFields({ values, onChange, estado }: Props) {
    const evidence = parseWellnessEvidence(values.wellnessEvidence);
    const selectedEffort = WELLNESS_PHYSICAL_EFFORT_LEVELS.reduce((nearest, level) =>
        Math.abs(level.value - values.demandaFisica) < Math.abs(nearest.value - values.demandaFisica) ? level : nearest,
    );
    const updateEvidence = (patch: Partial<typeof evidence>) => {
        onChange({ wellnessEvidence: serializeWellnessEvidence({ ...evidence, ...patch }) });
    };
    const toggleDimension = (dimension: string) => {
        const selected = new Set(values.wellnessDimensions);
        if (selected.has(dimension)) {
            selected.delete(dimension);
            const nextEvidence = { ...evidence.dimensions };
            delete nextEvidence[dimension];
            updateEvidence({ dimensions: nextEvidence });
        } else {
            selected.add(dimension);
        }
        onChange({ wellnessDimensions: [...selected] });
    };

    const tipoListo = values.categoriaWellness !== '';
    const dimensionesListas = values.wellnessDimensions.length > 0;
    const evidenciaLista = isWellnessEvidenceComplete(values.wellnessEvidence, values.wellnessDimensions);
    const listos = [tipoListo, dimensionesListas, evidenciaLista].filter(Boolean).length;
    const estadoInfo = estado ? ESTADO_TEXTO[estado] : undefined;

    return (
        <section className="flex flex-col gap-3">
            {/* ── ¿Es una experiencia de bienestar? ── */}
            <div>
                <p className="mb-2 text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>¿Cómo se usa este lugar en la app?</p>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de lugar">
                    {[
                        { valor: false, titulo: 'Lugar estándar', detalle: 'Aparece en explorar y en rutas.', Icono: MapPin },
                        { valor: true, titulo: 'Experiencia de bienestar', detalle: 'También puede recomendarse en Welltur.', Icono: Leaf },
                    ].map(({ valor, titulo, detalle, Icono }) => {
                        const activo = values.isWellness === valor;
                        return (
                            <button
                                key={titulo}
                                type="button"
                                role="radio"
                                aria-checked={activo}
                                onClick={() => onChange({ isWellness: valor })}
                                className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                                    activo
                                        ? (valor ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/30 dark:bg-emerald-900/20' : 'border-violet-500 bg-violet-50 ring-2 ring-violet-500/30 dark:bg-violet-900/20')
                                        : 'hover:border-zinc-300 dark:hover:border-zinc-600'
                                }`}
                                style={{ borderColor: activo ? '' : 'var(--color-border)' }}
                            >
                                <Icono className={`size-4 ${activo ? (valor ? 'text-emerald-600' : 'text-violet-600') : ''}`} style={activo ? undefined : { color: 'var(--color-text-alt)' }} />
                                <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{titulo}</span>
                                <span className="text-[11px] leading-snug" style={{ color: 'var(--color-text-alt)' }}>{detalle}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {values.isWellness && (
                <>
                    {/* Estado y avance */}
                    <div className="flex flex-wrap items-center gap-2">
                        {estadoInfo && (
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoInfo.clase}`}>{estadoInfo.texto}</span>
                        )}
                        <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-alt)' }}>
                            {listos === 3 ? 'Listo para revisión' : `${listos} de 3 requisitos completos`}
                        </span>
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                        Al guardar queda <strong>en revisión</strong>: solo aparece en las recomendaciones de bienestar cuando un admin lo aprueba.
                        Las dimensiones siguen el marco de GWI como guía; no son una certificación ni una promesa de beneficio para la salud.
                    </p>

                    {/* 1. Tipo */}
                    <Paso n={1} titulo="Tipo de experiencia" listo={tipoListo}>
                        <select
                            required
                            value={values.categoriaWellness}
                            onChange={(e) => onChange({ categoriaWellness: e.target.value })}
                            className={inputClass}
                            style={inputStyle}
                        >
                            <option value="">Seleccionar…</option>
                            {WELLNESS_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                        </select>
                    </Paso>

                    {/* 2. Dimensiones */}
                    <Paso n={2} titulo="¿Qué dimensiones de bienestar apoya?" listo={dimensionesListas}>
                        <p className="mb-2 text-[11px]" style={{ color: 'var(--color-text-alt)' }}>
                            Marca solo las que respalde una actividad concreta del lugar.
                        </p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {WELLNESS_DIMENSIONS.map(({ key, label, description }) => {
                                const marcada = values.wellnessDimensions.includes(key);
                                return (
                                    <label
                                        key={key}
                                        className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 transition-colors ${marcada ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
                                        style={marcada ? undefined : { borderColor: 'var(--color-border)' }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={marcada}
                                            onChange={() => toggleDimension(key)}
                                            className="mt-0.5 size-4 accent-emerald-600"
                                        />
                                        <span>
                                            <span className="block text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{label}</span>
                                            <span className="block text-[11px] leading-snug" style={{ color: 'var(--color-text-alt)' }}>{description}</span>
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </Paso>

                    {/* 3. Evidencia */}
                    <Paso n={3} titulo="Evidencia" listo={evidenciaLista}>
                        <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>
                            ¿Dónde comprobaste la actividad? <span className="font-normal">(10–180 caracteres)</span>
                        </label>
                        <input
                            required
                            minLength={10}
                            maxLength={180}
                            value={evidence.source}
                            onChange={(e) => updateEvidence({ source: e.target.value })}
                            placeholder="Ej.: Sitio oficial, consultado el 07/11/2026 · o · Visita a Fortín, 05/11/2026"
                            className={inputClass}
                            style={inputStyle}
                        />
                        {values.wellnessDimensions.length === 0 ? (
                            <p className="mt-3 flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-text-alt)' }}>
                                <CircleDashed className="size-3.5" /> Marca al menos una dimensión en el paso 2 para describir su evidencia.
                            </p>
                        ) : (
                            <div className="mt-3 space-y-2">
                                {WELLNESS_DIMENSIONS.filter(({ key }) => values.wellnessDimensions.includes(key)).map(({ key, label }) => (
                                    <label key={key} className="block text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                                        {label}: ¿qué ofrece el lugar? <span className="font-normal" style={{ color: 'var(--color-text-alt)' }}>(12–80 caracteres)</span>
                                        <textarea
                                            required
                                            minLength={12}
                                            maxLength={80}
                                            rows={2}
                                            value={evidence.dimensions[key] ?? ''}
                                            onChange={(e) => updateEvidence({ dimensions: { ...evidence.dimensions, [key]: e.target.value } })}
                                            placeholder="Actividad concreta, sin afirmar que cura o trata la salud"
                                            className={`${inputClass} mt-1 font-normal`}
                                            style={{ ...inputStyle, resize: 'none' }}
                                        />
                                    </label>
                                ))}
                            </div>
                        )}
                    </Paso>

                    {/* 4. Detalles opcionales */}
                    <Paso n={4} titulo="Detalles para la recomendación" listo={values.descripcionBienestar.trim() !== ''}>
                        <label htmlFor="wellness-physical-demand" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>
                            Esfuerzo físico
                        </label>
                        <div className="grid grid-cols-3 gap-2" id="wellness-physical-demand" role="radiogroup" aria-label="Esfuerzo físico">
                            {WELLNESS_PHYSICAL_EFFORT_LEVELS.map(({ value, label }) => {
                                const activo = selectedEffort.value === value;
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        role="radio"
                                        aria-checked={activo}
                                        onClick={() => onChange({ demandaFisica: value })}
                                        className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors ${activo ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : ''}`}
                                        style={activo ? undefined : { borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="mt-1 mb-3 text-[11px]" style={{ color: 'var(--color-text-alt)' }}>{selectedEffort.detail}</p>

                        <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>
                            Descripción para visitantes <span className="font-normal">(opcional)</span>
                        </label>
                        <textarea
                            maxLength={500}
                            rows={2}
                            value={values.descripcionBienestar}
                            onChange={(e) => onChange({ descripcionBienestar: e.target.value })}
                            placeholder="¿Qué puede vivir o hacer la persona en este lugar?"
                            className={inputClass}
                            style={{ ...inputStyle, resize: 'none' }}
                        />
                    </Paso>
                </>
            )}
        </section>
    );
}
