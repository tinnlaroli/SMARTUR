import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../shared/api/axiosClient';
import {
    AlertCircle, CheckCircle, Loader2, RefreshCw, ShieldCheck, ShieldX,
    Building2, MessageSquareDiff, X,
} from 'lucide-react';
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey';
import { SharedPagination } from '../../../components/ui/SharedPagination';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FieldChange {
    old: unknown;
    new: unknown;
    label: string;
}

interface ChangeLog {
    id: number;
    target_type: 'service' | 'company' | 'user';
    target_id: number;
    admin_name: string | null;
    company_name: string | null;
    changes: Record<string, FieldChange>;
    status: string;
    empresa_note: string | null;
    empresa_counter: Record<string, unknown> | null;
    created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const TARGET_LABELS: Record<string, string> = {
    service: 'Servicio',
    company: 'Empresa',
    user: 'Usuario',
};

function formatValue(val: unknown): string {
    if (val === null || val === undefined || val === '') return '—';
    if (typeof val === 'boolean') return val ? 'Activo' : 'Inactivo';
    return String(val);
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

// ── Resolve Modal ──────────────────────────────────────────────────────────────

interface ResolveModalProps {
    log: ChangeLog;
    onClose: () => void;
    onResolve: (id: number, resolution: 'keep_admin' | 'accept_empresa', note: string) => Promise<void>;
}

function ResolveModal({ log, onClose, onResolve }: ResolveModalProps) {
    useEscapeKey(onClose);
    const [resolution, setResolution] = useState<'keep_admin' | 'accept_empresa' | null>(null);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resolution) { setError('Selecciona una resolución.'); return; }
        setLoading(true);
        setError('');
        try {
            await onResolve(log.id, resolution, note.trim());
            onClose();
        } catch {
            setError('Error al resolver la disputa. Intenta de nuevo.');
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
                        Resolver aclaración #{log.id}
                    </h3>
                    <button onClick={onClose} className="rounded-lg p-1.5 transition-colors nav-item-idle">
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-y-5 max-h-[80vh] overflow-y-auto">
                    {/* Changes summary */}
                    <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="px-4 py-2 text-xs font-bold uppercase tracking-widest" style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-alt)' }}>
                            Campos en aclaración
                        </div>
                        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                            {Object.entries(log.changes).map(([field, change]) => (
                                <div key={field} className="px-4 py-3">
                                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text)' }}>{change.label}</p>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div>
                                            <span className="block mb-0.5" style={{ color: 'var(--color-text-alt)' }}>Admin editó:</span>
                                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatValue(change.new)}</span>
                                        </div>
                                        <div>
                                            <span className="block mb-0.5" style={{ color: 'var(--color-text-alt)' }}>Original:</span>
                                            <span className="text-red-500 line-through">{formatValue(change.old)}</span>
                                        </div>
                                        <div>
                                            <span className="block mb-0.5" style={{ color: 'var(--color-text-alt)' }}>Empresa propone:</span>
                                            <span className="text-violet-600 dark:text-violet-400 font-medium">
                                                {log.empresa_counter?.[field] != null
                                                    ? formatValue(log.empresa_counter[field])
                                                    : formatValue(change.old)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Empresa note */}
                    {log.empresa_note && (
                        <div className="rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500 mb-1">Justificación de la empresa</p>
                            <p className="text-xs text-zinc-700 dark:text-zinc-300">{log.empresa_note}</p>
                        </div>
                    )}

                    {/* Resolution choice */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-alt)' }}>Resolución</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setResolution('keep_admin')}
                                className={`flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center transition-all ${
                                    resolution === 'keep_admin'
                                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 ring-2 ring-violet-500/30'
                                        : 'hover:border-zinc-300 dark:hover:border-zinc-600'
                                }`}
                                style={{ borderColor: resolution === 'keep_admin' ? '' : 'var(--color-border)' }}
                            >
                                <ShieldCheck className={`size-5 ${resolution === 'keep_admin' ? 'text-violet-600' : ''}`} style={{ color: resolution === 'keep_admin' ? '' : 'var(--color-text-alt)' }} />
                                <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>Mantener edición admin</span>
                                <span className="text-[10px]" style={{ color: 'var(--color-text-alt)' }}>Los cambios del admin quedan aplicados</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setResolution('accept_empresa')}
                                className={`flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center transition-all ${
                                    resolution === 'accept_empresa'
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500/30'
                                        : 'hover:border-zinc-300 dark:hover:border-zinc-600'
                                }`}
                                style={{ borderColor: resolution === 'accept_empresa' ? '' : 'var(--color-border)' }}
                            >
                                <ShieldX className={`size-5 ${resolution === 'accept_empresa' ? 'text-emerald-600' : ''}`} style={{ color: resolution === 'accept_empresa' ? '' : 'var(--color-text-alt)' }} />
                                <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>Aceptar versión empresa</span>
                                <span className="text-[10px]" style={{ color: 'var(--color-text-alt)' }}>Aplica la contra-propuesta de la empresa</span>
                            </button>
                        </div>
                    </div>

                    {/* Optional admin note */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-alt)' }}>
                            Nota para la empresa (opcional)
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
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
                            disabled={loading || !resolution}
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

// ── Dispute Card ───────────────────────────────────────────────────────────────

interface DisputeCardProps {
    log: ChangeLog;
    onResolve: (log: ChangeLog) => void;
}

function DisputeCard({ log, onResolve }: DisputeCardProps) {
    return (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-start justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}>
                <div className="flex flex-col gap-y-0.5">
                    <div className="flex items-center gap-2">
                        <Building2 className="size-3.5 text-violet-500" />
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                            {log.company_name ?? `Empresa #${log.target_id}`}
                        </p>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                        {TARGET_LABELS[log.target_type] ?? log.target_type} #{log.target_id} · {formatDate(log.created_at)}
                    </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 px-2.5 py-1 text-xs font-semibold">
                    <MessageSquareDiff className="size-3" />
                    En aclaración
                </span>
            </div>

            {/* Changes */}
            <div className="px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-alt)' }}>Cambios en aclaración</p>
                <div className="space-y-3">
                    {Object.entries(log.changes).map(([field, change]) => (
                        <div key={field} className="rounded-lg p-3" style={{ background: 'var(--color-bg-alt)' }}>
                            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-alt)' }}>{change.label}</p>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                    <span className="block" style={{ color: 'var(--color-text-alt)' }}>Antes:</span>
                                    <span className="text-red-500">{formatValue(change.old)}</span>
                                </div>
                                <div>
                                    <span className="block" style={{ color: 'var(--color-text-alt)' }}>Admin editó:</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">{formatValue(change.new)}</span>
                                </div>
                                <div>
                                    <span className="block" style={{ color: 'var(--color-text-alt)' }}>Empresa propone:</span>
                                    <span className="text-violet-600 dark:text-violet-400 font-medium">
                                        {log.empresa_counter?.[field] != null
                                            ? formatValue(log.empresa_counter[field])
                                            : '—'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Empresa note */}
            {log.empresa_note && (
                <div className="px-5 pb-4">
                    <div className="rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500 mb-1">Justificación de la empresa</p>
                        <p className="text-xs" style={{ color: 'var(--color-text)' }}>{log.empresa_note}</p>
                    </div>
                </div>
            )}

            {/* Resolve action */}
            <div className="flex items-center gap-3 px-5 py-3 border-t" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}>
                <button
                    onClick={() => onResolve(log)}
                    className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-violet-700 transition-colors"
                >
                    <CheckCircle className="size-3.5" />
                    Resolver aclaración
                </button>
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function AdminDisputasPage() {
    const [logs, setLogs] = useState<ChangeLog[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [resolveTarget, setResolveTarget] = useState<ChangeLog | null>(null);

    const load = useCallback(async (p = 1) => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get('/admin-change-log', { params: { status: 'disputed', page: p, limit: 15 } });
            setLogs(data.logs ?? []);
            setTotal(data.total ?? 0);
            setTotalPages(data.totalPages ?? 1);
            setPage(p);
        } catch {
            setError('No se pudieron cargar las disputas.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(1); }, [load]);

    const handleResolve = async (id: number, resolution: 'keep_admin' | 'accept_empresa', note: string) => {
        await api.patch(`/admin-change-log/${id}/resolve`, {
            resolution,
            admin_resolution_note: note || undefined,
        });
        setLogs((prev) => prev.filter((l) => l.id !== id));
        setTotal((t) => t - 1);
    };

    return (
        <div className="flex flex-col gap-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Aclaraciones</h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        {total} aclaración{total !== 1 ? 'es' : ''} pendiente{total !== 1 ? 's' : ''} de resolución
                    </p>
                </div>
                <button
                    onClick={() => load(page)}
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
                <MessageSquareDiff className="size-5 mt-0.5 shrink-0" style={{ color: '#7c3aed' }} />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>Aclaraciones de ediciones</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        Cuando una empresa solicita revertir un cambio hecho por un admin sobre su servicio, aparece aquí para que decidas si mantener el cambio o aceptar la propuesta de la empresa.
                    </p>
                </div>
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
            ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <CheckCircle className="size-10 mb-3" style={{ color: 'var(--color-border)' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-alt)' }}>Sin aclaraciones activas</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-alt)' }}>Cuando una empresa solicite una aclaración aparecerá aquí.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-y-4 max-w-3xl">
                    {logs.map((log) => (
                        <DisputeCard key={log.id} log={log} onResolve={setResolveTarget} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="max-w-3xl">
                    <SharedPagination
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        pageSize={15}
                        onPageChange={load}
                    />
                </div>
            )}

            {/* Resolve modal */}
            {resolveTarget && (
                <ResolveModal
                    log={resolveTarget}
                    onClose={() => setResolveTarget(null)}
                    onResolve={handleResolve}
                />
            )}
        </div>
    );
}

export default AdminDisputasPage;
