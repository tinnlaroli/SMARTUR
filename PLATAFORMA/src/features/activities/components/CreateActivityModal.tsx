import { useState, useEffect } from 'react';
import { X, Activity, Loader2 } from 'lucide-react';
import { companyServices } from '../../companies/api/companyApi';
import type { Company } from '../../companies/types/types';
import type { CreateActivityDTO } from '../types/types';

const IMPACT_OPTIONS = [
    { label: 'Bajo', value: 'bajo' },
    { label: 'Medio', value: 'medio' },
    { label: 'Alto', value: 'alto' },
];

const selectClass =
    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-violet-500 cursor-pointer disabled:opacity-50';

interface Props {
    onClose: () => void;
    onSubmit: (data: CreateActivityDTO) => Promise<boolean | undefined>;
}

export default function CreateActivityModal({ onClose, onSubmit }: Props) {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loadingCompanies, setLoadingCompanies] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [idCompany, setIdCompany] = useState<number>(0);
    const [productionValue, setProductionValue] = useState('');
    const [envImpact, setEnvImpact] = useState('bajo');
    const [socialImpact, setSocialImpact] = useState('bajo');
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        companyServices.findAll(1, 200).then((res) => {
            if (cancelled) return;
            setCompanies(res.companies);
            if (res.companies.length > 0) setIdCompany(res.companies[0].id);
        }).catch(() => {}).finally(() => { if (!cancelled) setLoadingCompanies(false); });
        return () => { cancelled = true; };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!idCompany) { setError('Selecciona una empresa.'); return; }
        const val = parseFloat(productionValue);
        if (isNaN(val) || val < 0) { setError('Ingresa un valor de producción válido.'); return; }
        setSubmitting(true);
        const ok = await onSubmit({ id_company: idCompany, production_value: val, environmental_impact: envImpact, social_impact: socialImpact });
        setSubmitting(false);
        if (ok) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border shadow-2xl" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--color-border)' }}>
                    <h2 className="flex items-center gap-2 text-base font-bold" style={{ color: 'var(--color-text)' }}>
                        <Activity className="size-4" style={{ color: 'var(--color-green)' }} />
                        Nueva actividad
                    </h2>
                    <button type="button" onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800" style={{ color: 'var(--color-text-alt)' }}>
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-5">
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>Empresa</label>
                        {loadingCompanies ? (
                            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                <Loader2 className="size-4 animate-spin" /> Cargando empresas…
                            </div>
                        ) : (
                            <select
                                value={idCompany}
                                onChange={(e) => setIdCompany(Number(e.target.value))}
                                className={selectClass}
                                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                            >
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>Valor de producción</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={productionValue}
                            onChange={(e) => setProductionValue(e.target.value)}
                            placeholder="Ej: 15000"
                            className={selectClass}
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>Impacto ambiental</label>
                            <select
                                value={envImpact}
                                onChange={(e) => setEnvImpact(e.target.value)}
                                className={selectClass}
                                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                            >
                                {IMPACT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>Impacto social</label>
                            <select
                                value={socialImpact}
                                onChange={(e) => setSocialImpact(e.target.value)}
                                className={selectClass}
                                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                            >
                                {IMPACT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {error && <p className="text-xs text-rose-500">{error}</p>}

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={submitting || loadingCompanies} className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ background: 'var(--color-green)' }}>
                            {submitting && <Loader2 className="size-4 animate-spin" />}
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
