import { Leaf } from 'lucide-react';

export const WELLNESS_CATEGORIES = [
    'Termal', 'Spa', 'Bosque', 'Montaña', 'Lago',
    'Retiro_Silencio', 'Ecoturismo_Activo', 'Parque',
] as const;

const inputClass =
    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-violet-500 disabled:opacity-50';

export interface WellnessPlaceValues {
    isWellness: boolean;
    categoriaWellness: string;
    nivelAislamiento: number;
    restauracionPasiva: number;
    demandaFisica: number;
    descripcionBienestar: string;
}

interface Props {
    values: WellnessPlaceValues;
    onChange: (patch: Partial<WellnessPlaceValues>) => void;
}

export default function WellnessPlaceFields({ values, onChange }: Props) {
    const {
        isWellness,
        categoriaWellness,
        nivelAislamiento,
        restauracionPasiva,
        demandaFisica,
        descripcionBienestar,
    } = values;

    return (
        <div className="rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
                <input
                    type="checkbox"
                    checked={isWellness}
                    onChange={(e) => onChange({ isWellness: e.target.checked })}
                    className="size-4 rounded accent-emerald-500"
                />
                <Leaf className="size-4 text-emerald-500" />
                <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        Lugar de Bienestar (WellTur)
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                        Incluir en las recomendaciones del test de vitalidad
                    </p>
                </div>
            </label>
            {isWellness && (
                <div className="space-y-3 border-t px-3 pb-3 pt-3" style={{ borderColor: 'var(--color-border)' }}>
                    <div>
                        <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>
                            Categoría wellness
                        </label>
                        <select
                            value={categoriaWellness}
                            onChange={(e) => onChange({ categoriaWellness: e.target.value })}
                            className={inputClass}
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                        >
                            <option value="">Seleccionar…</option>
                            {WELLNESS_CATEGORIES.map((c) => (
                                <option key={c} value={c}>{c.replace('_', ' ')}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>
                            Descripción de bienestar
                        </label>
                        <input
                            type="text"
                            value={descripcionBienestar}
                            onChange={(e) => onChange({ descripcionBienestar: e.target.value })}
                            placeholder="¿Qué experiencia de bienestar ofrece?"
                            className={inputClass}
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                        />
                    </div>
                    {([
                        { key: 'nivelAislamiento' as const, label: 'Aislamiento', hint: 'Qué tan alejado del ruido urbano', value: nivelAislamiento },
                        { key: 'restauracionPasiva' as const, label: 'Relajación pasiva', hint: 'Qué tan relajante es la experiencia', value: restauracionPasiva },
                        { key: 'demandaFisica' as const, label: 'Demanda física', hint: 'Cuánto esfuerzo físico requiere', value: demandaFisica },
                    ]).map(({ key, label, hint, value }) => (
                        <div key={key}>
                            <div className="mb-0.5 flex items-center justify-between">
                                <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{label}</span>
                                <span className="font-mono text-xs" style={{ color: 'var(--color-text-alt)' }}>{value.toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.05}
                                value={value}
                                onChange={(e) => onChange({ [key]: parseFloat(e.target.value) })}
                                className="h-1.5 w-full cursor-pointer accent-emerald-500"
                            />
                            <p className="mt-0.5 text-[10px]" style={{ color: 'var(--color-text-alt)' }}>{hint}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
