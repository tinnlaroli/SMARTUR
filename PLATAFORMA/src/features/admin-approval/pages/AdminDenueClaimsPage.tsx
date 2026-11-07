import { useCallback, useEffect, useState } from 'react';
import {
    AlertCircle, Building2, CheckCircle, Loader2, MapPin, RefreshCw, ShieldCheck, ShieldX, Store, X,
} from 'lucide-react';
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey';
import { wellturApi, type ReclamoDenue } from '../../ml-observability/api/wellturApi';

// ── Helpers ────────────────────────────────────────────────────────────────────

type Estado = 'pending' | 'approved' | 'rejected';

const ESTADOS: Record<Estado, { lista: string; insignia: string }> = {
    pending:  { lista: 'Pendientes', insignia: 'En revisión' },
    approved: { lista: 'Aprobados',  insignia: 'Aprobado' },
    rejected: { lista: 'Rechazados', insignia: 'Rechazado' },
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

// ── Resolve Modal ──────────────────────────────────────────────────────────────

interface ResolveModalProps {
    reclamo: ReclamoDenue;
    onClose: () => void;
    onResolve: (id: number, decision: 'approved' | 'rejected', nota: string) => Promise<void>;
}

function ResolveModal({ reclamo, onClose, onResolve }: ResolveModalProps) {
    useEscapeKey(onClose);
    const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
    const [nota, setNota] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!decision) { setError('Selecciona una resolución.'); return; }
        if (decision === 'rejected' && !nota.trim()) { setError('Explica a la empresa por qué se rechaza.'); return; }
        setLoading(true);
        setError('');
        try {
            await onResolve(reclamo.claim_id, decision, nota.trim());
            onClose();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(msg ?? 'Error al resolver el reclamo. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="rounded-xl shadow-2xl w-full max-w-lg border" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                        <ShieldCheck className="size-4 text-violet-500" />
                        Resolver reclamo #{reclamo.claim_id}
                    </h3>
                    <button onClick={onClose} className="rounded-lg p-1.5 transition-colors nav-item-idle">
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-y-5 max-h-[80vh] overflow-y-auto">
                    {/* Ficha reclamada */}
                    <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="px-4 py-2 text-xs font-bold uppercase tracking-widest" style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-alt)' }}>
                            Ficha del DENUE
                        </div>
                        <div className="px-4 py-3 text-xs space-y-1">
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{reclamo.poi_nombre}</p>
                            <p style={{ color: 'var(--color-text-alt)' }}>
                                {[reclamo.municipio, reclamo.estado].filter(Boolean).join(', ')} · CLEE {reclamo.denue_clee}
                            </p>
                            {reclamo.poi_descripcion && <p style={{ color: 'var(--color-text-alt)' }}>{reclamo.poi_descripcion}</p>}
                        </div>
                    </div>

                    {/* Evidencia */}
                    <div className="rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500 mb-1">Evidencia de {reclamo.empresa}</p>
                        <p className="text-xs text-zinc-700 dark:text-zinc-300">{reclamo.evidencia}</p>
                    </div>

                    {/* Resolution choice */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-alt)' }}>Resolución</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setDecision('approved')}
                                className={`flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center transition-all ${
                                    decision === 'approved'
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500/30'
                                        : 'hover:border-zinc-300 dark:hover:border-zinc-600'
                                }`}
                                style={{ borderColor: decision === 'approved' ? '' : 'var(--color-border)' }}
                            >
                                <ShieldCheck className={`size-5 ${decision === 'approved' ? 'text-emerald-600' : ''}`} style={{ color: decision === 'approved' ? '' : 'var(--color-text-alt)' }} />
                                <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>Aprobar reclamo</span>
                                <span className="text-[10px]" style={{ color: 'var(--color-text-alt)' }}>La ficha se liga a la empresa y la app la muestra verificada</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setDecision('rejected')}
                                className={`flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center transition-all ${
                                    decision === 'rejected'
                                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 ring-2 ring-violet-500/30'
                                        : 'hover:border-zinc-300 dark:hover:border-zinc-600'
                                }`}
                                style={{ borderColor: decision === 'rejected' ? '' : 'var(--color-border)' }}
                            >
                                <ShieldX className={`size-5 ${decision === 'rejected' ? 'text-violet-600' : ''}`} style={{ color: decision === 'rejected' ? '' : 'var(--color-text-alt)' }} />
                                <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>Rechazar reclamo</span>
                                <span className="text-[10px]" style={{ color: 'var(--color-text-alt)' }}>La evidencia no basta; la ficha sigue sin verificar</span>
                            </button>
                        </div>
                    </div>

                    {/* Admin note */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-alt)' }}>
                            Nota para la empresa {decision === 'rejected' ? '(obligatoria)' : '(opcional)'}
                        </label>
                        <textarea
                            value={nota}
                            onChange={(e) => setNota(e.target.value)}
                            rows={2}
                            placeholder="Explica la decisión tomada..."
                            className="w-full rounded-lg border px-4 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)', color: 'var(--color-text)' }}
                        />
                    </div>

                    {error && (
                        <p className="flex items-center gap-1 text-xs text-red-500">
                            <AlertCircle className="size-3" />{error}
                        </p>
                    )}

                    <div className="flex justify-end gap-3 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors nav-item-idle"
                            style={{ borderColor: 'var(--color-border)' }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !decision}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-60"
                        >
                            {loading && <Loader2 className="size-3.5 animate-spin" />}
                            Confirmar resolución
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Claim Card ─────────────────────────────────────────────────────────────────

interface ClaimCardProps {
    reclamo: ReclamoDenue;
    onResolve: (reclamo: ReclamoDenue) => void;
}

function ClaimCard({ reclamo, onResolve }: ClaimCardProps) {
    const pendiente = reclamo.status === 'pending';
    return (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-start justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}>
                <div className="flex flex-col gap-y-0.5">
                    <div className="flex items-center gap-2">
                        <Building2 className="size-3.5 text-violet-500" />
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{reclamo.empresa}</p>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                        {reclamo.solicitante} · empresa {reclamo.empresa_status ?? 'sin estatus'}
                        {reclamo.empresa_certificada ? ' · certificada' : ''} · {formatDate(reclamo.created_at)}
                    </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    reclamo.status === 'approved'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : reclamo.status === 'rejected'
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                }`}>
                    <Store className="size-3" />
                    {ESTADOS[reclamo.status].insignia}
                </span>
            </div>

            {/* Ficha reclamada */}
            <div className="px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-alt)' }}>Ficha del DENUE reclamada</p>
                <div className="rounded-lg p-3" style={{ background: 'var(--color-bg-alt)' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>{reclamo.poi_nombre}</p>
                    <p className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                        <MapPin className="size-3" />
                        {[reclamo.municipio, reclamo.estado].filter(Boolean).join(', ')} · CLEE {reclamo.denue_clee}
                    </p>
                </div>
            </div>

            {/* Evidencia */}
            <div className="px-5 pb-4">
                <div className="rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500 mb-1">Evidencia de la empresa</p>
                    <p className="text-xs" style={{ color: 'var(--color-text)' }}>{reclamo.evidencia}</p>
                </div>
                {!pendiente && reclamo.admin_notes && (
                    <p className="text-xs mt-3" style={{ color: 'var(--color-text-alt)' }}>
                        <strong>Nota del admin:</strong> {reclamo.admin_notes}
                    </p>
                )}
            </div>

            {/* Resolve action */}
            {pendiente && (
                <div className="flex items-center gap-3 px-5 py-3 border-t" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}>
                    <button
                        onClick={() => onResolve(reclamo)}
                        className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-violet-700 transition-colors"
                    >
                        <CheckCircle className="size-3.5" />
                        Resolver reclamo
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

/**
 * Reclamos de fichas del DENUE: una empresa registrada pide que un negocio del DENUE (INEGI)
 * se ligue a su cuenta. Al aprobarlo, la app lo muestra como "Verificado por SMARTUR".
 */
export function AdminDenueClaimsPage() {
    const [estado, setEstado] = useState<Estado>('pending');
    const [reclamos, setReclamos] = useState<ReclamoDenue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [resolveTarget, setResolveTarget] = useState<ReclamoDenue | null>(null);

    // El estado de carga se activa al pedir otra lista (no dentro del efecto).
    const load = useCallback(async (e: Estado) => {
        try {
            setReclamos(await wellturApi.reclamos(e));
            setError('');
        } catch {
            setError('No se pudieron cargar los reclamos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(estado); }, [load, estado]);

    const recargar = (e: Estado) => { setLoading(true); setEstado(e); if (e === estado) void load(e); };

    const handleResolve = async (id: number, decision: 'approved' | 'rejected', nota: string) => {
        await wellturApi.revisarReclamo(id, decision, nota);
        setReclamos((prev) => prev.filter((r) => r.claim_id !== id));
    };

    const total = reclamos.length;

    return (
        <div className="flex flex-col gap-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Reclamos DENUE</h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        {total} reclamo{total !== 1 ? 's' : ''} {ESTADOS[estado].lista.toLowerCase()}
                    </p>
                </div>
                <button
                    onClick={() => recargar(estado)}
                    disabled={loading}
                    className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors nav-item-idle"
                    style={{ borderColor: 'var(--color-border)' }}
                >
                    <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
            </div>

            {/* Info banner */}
            <div className="rounded-xl border px-5 py-4 flex items-start gap-3 shrink-0" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                <Store className="size-5 mt-0.5 shrink-0" style={{ color: '#7c3aed' }} />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>Fichas del DENUE reclamadas por empresas</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        Los negocios del DENUE (INEGI) se muestran en la app como "por verificar". Cuando una empresa registrada reclama
                        uno como suyo, revisa su evidencia: si lo apruebas, la ficha se liga a la empresa y aparece como "Verificado por SMARTUR".
                    </p>
                </div>
            </div>

            {/* Filtro por estatus */}
            <div className="flex items-center gap-2">
                {(Object.keys(ESTADOS) as Estado[]).map((e) => (
                    <button
                        key={e}
                        onClick={() => { if (e !== estado) recargar(e); }}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                            e === estado ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400' : 'nav-item-idle'
                        }`}
                        style={{ borderColor: e === estado ? '' : 'var(--color-border)' }}
                    >
                        {ESTADOS[e].lista}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="size-6 animate-spin" style={{ color: 'var(--color-text-alt)' }} />
                </div>
            ) : error ? (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="size-4 shrink-0" />{error}
                </div>
            ) : reclamos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <CheckCircle className="size-10 mb-3" style={{ color: 'var(--color-border)' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-alt)' }}>
                        Sin reclamos {ESTADOS[estado].lista.toLowerCase()}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-alt)' }}>
                        Cuando una empresa reclame una ficha del DENUE aparecerá aquí.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-y-4 max-w-3xl">
                    {reclamos.map((r) => (
                        <ClaimCard key={r.claim_id} reclamo={r} onResolve={setResolveTarget} />
                    ))}
                </div>
            )}

            {/* Resolve modal */}
            {resolveTarget && (
                <ResolveModal
                    reclamo={resolveTarget}
                    onClose={() => setResolveTarget(null)}
                    onResolve={handleResolve}
                />
            )}
        </div>
    );
}

export default AdminDenueClaimsPage;
