import { Leaf } from 'lucide-react';
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
}

export default function WellnessPlaceFields({ values, onChange }: Props) {
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

    return (
        <section className="rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
                <input
                    type="checkbox"
                    checked={values.isWellness}
                    onChange={(e) => onChange({ isWellness: e.target.checked })}
                    className="size-4 rounded accent-emerald-600"
                />
                <Leaf className="size-4 text-emerald-600" />
                <span>
                    <span className="block text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        Proponer como experiencia de bienestar
                    </span>
                    <span className="block text-xs" style={{ color: 'var(--color-text-alt)' }}>
                        Quedará pendiente de revisión antes de aparecer en Welltur.
                    </span>
                </span>
            </label>

            {values.isWellness && (
                <div className="space-y-4 border-t px-3 pb-4 pt-4" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100">
                        Marco orientador: dimensiones de bienestar descritas por GWI. Esta selección no es una certificación de GWI ni una afirmación de beneficio clínico.
                    </p>

                    <div>
                        <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>
                            Tipo de experiencia en SMARTUR
                        </label>
                        <p className="mb-1 text-[10px] leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                            Esta categoría organiza el catálogo de SMARTUR; GWI aporta las dimensiones orientadoras, no esta lista de categorías.
                        </p>
                        <select
                            required
                            value={values.categoriaWellness}
                            onChange={(e) => onChange({ categoriaWellness: e.target.value })}
                            className={inputClass}
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                        >
                            <option value="">Seleccionar…</option>
                            {WELLNESS_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                        </select>
                    </div>

                    <fieldset>
                        <legend className="mb-2 text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>
                            ¿Qué dimensiones apoya la experiencia?
                        </legend>
                        <p className="mb-2 text-[10px] leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                            Marca solo dimensiones respaldadas por una actividad o característica concreta del lugar. Son categorías orientativas de GWI, no una puntuación de calidad ni una promesa de resultados.
                        </p>
                        <div className="space-y-2">
                            {WELLNESS_DIMENSIONS.map(({ key, label, description }) => (
                                <label key={key} className="flex cursor-pointer items-start gap-2 rounded-lg border p-2.5" style={{ borderColor: 'var(--color-border)' }}>
                                    <input
                                        type="checkbox"
                                        checked={values.wellnessDimensions.includes(key)}
                                        onChange={() => toggleDimension(key)}
                                        className="mt-0.5 size-4 accent-emerald-600"
                                    />
                                    <span>
                                        <span className="block text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{label}</span>
                                        <span className="block text-[11px] leading-snug" style={{ color: 'var(--color-text-alt)' }}>{description}</span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <div className="space-y-3">
                        <div>
                            <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>
                                ¿Dónde comprobaste que ofrecen esta actividad? <span className="font-normal">(10–180 caracteres)</span>
                            </label>
                            <p className="mb-1 text-[10px] leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                                Anota el enlace o documento que consultaste. Si lo comprobaste en persona, escribe el lugar y la fecha. Ej.: “Sitio oficial del establecimiento, consultado el dd/mm/aaaa” o “Visita al lugar, localidad, dd/mm/aaaa”. Abajo describe la actividad concreta; no afirmes que trata o cura problemas de salud.
                            </p>
                            <input
                                required
                                minLength={10}
                                maxLength={180}
                                value={evidence.source}
                                onChange={(e) => updateEvidence({ source: e.target.value })}
                                placeholder="Enlace o documento consultado, o lugar y fecha de la visita"
                                className={inputClass}
                                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                            />
                        </div>
                        <fieldset className="space-y-2">
                            <legend className="mb-1 text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>
                                Evidencia de cada dimensión marcada <span className="font-normal">(12–80 caracteres por dimensión)</span>
                            </legend>
                            {WELLNESS_DIMENSIONS.filter(({ key }) => values.wellnessDimensions.includes(key)).map(({ key, label }) => (
                                <label key={key} className="block text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                                    {label}: ¿qué ofrece realmente el lugar?
                                    <textarea
                                        required
                                        minLength={12}
                                        maxLength={80}
                                        rows={2}
                                        value={evidence.dimensions[key] ?? ''}
                                        onChange={(e) => updateEvidence({ dimensions: { ...evidence.dimensions, [key]: e.target.value } })}
                                        placeholder="Actividad concreta y relación observable con esta dimensión"
                                        className={`${inputClass} mt-1 font-normal`}
                                        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                                    />
                                </label>
                            ))}
                        </fieldset>
                        <p className="text-[10px]" style={{ color: 'var(--color-text-alt)' }}>
                            Registro estructurado: {values.wellnessEvidence.length}/1000 caracteres
                            {isWellnessEvidenceComplete(values.wellnessEvidence, values.wellnessDimensions) ? ' · campos listos para revisión interna' : ' · falta información'}
                        </p>
                    </div>

                    <div>
                        <label htmlFor="wellness-physical-demand" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--color-text)' }}>Esfuerzo físico aproximado</label>
                        <p className="mb-2 text-[10px] leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                            Elige una categoría sencilla según la actividad ofrecida. Se usa solo para desempatar recomendaciones con igual coincidencia de preferencias.
                        </p>
                        <select
                            id="wellness-physical-demand"
                            value={selectedEffort.value}
                            onChange={(e) => onChange({ demandaFisica: Number(e.target.value) })}
                            className={inputClass}
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                        >
                            {WELLNESS_PHYSICAL_EFFORT_LEVELS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        <p className="mt-1 text-[10px] leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>{selectedEffort.detail}</p>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>
                            Descripción para visitantes <span className="font-normal">(opcional)</span>
                        </label>
                        <input
                            type="text"
                            maxLength={500}
                            value={values.descripcionBienestar}
                            onChange={(e) => onChange({ descripcionBienestar: e.target.value })}
                            placeholder="¿Qué puede vivir o hacer la persona en este lugar?"
                            className={inputClass}
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                        />
                    </div>
                </div>
            )}
        </section>
    );
}
