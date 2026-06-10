import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../shared/api/axiosClient';
import {
    AlertCircle, CheckCircle, Loader2, RefreshCw, ShieldCheck, ShieldX,
    ChevronLeft, ChevronRight, Building2, MessageSquareDiff, X,
} from 'lucide-react';
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey';

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
            <div className="bg-white dark:bg-[#121214] rounded-xl shadow-2xl w-full max-w-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="size-4 text-violet-500" />
                        Resolver disputa #{log.id}
                    </h3>
                    <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-y-5 max-h-[80vh] overflow-y-auto">
                    {/* Changes summary */}
                    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <div className="bg-zinc-50 dark:bg-zinc-900 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
                            Campos en disputa
                        </div>
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {Object.entries(log.changes).map(([field, change]) => (
                                <div key={field} className="px-4 py-3">
                                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{change.label}</p>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div>
                                            <span className="text-zinc-400 block mb-0.5">Admin editó:</span>
                                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatValue(change.new)}</span>
                                        </div>
                                        <div>
                                            <span className="text-zinc-400 block mb-0.5">Original:</span>
                                            <span className="text-red-500 line-through">{formatValue(change.old)}</span>
                                        </div>
                                        <div>
                                            <span className="text-zinc-400 block mb-0.5">Empresa propone:</span>
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
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Resolución</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setResolution('keep_admin')}
                                className={`flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center transition-all ${
                                    resolution === 'keep_admin'
                                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 ring-2 ring-violet-500/30'
                                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                                }`}
                            >
                                <ShieldCheck className={`size-5 ${resolution === 'keep_admin' ? 'text-violet-600' : 'text-zinc-400'}`} />
                                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Mantener edición admin</span>
                                <span className="text-[10px] text-zinc-400">Los cambios del admin quedan aplicados</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setResolution('accept_empresa')}
                                className={`flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center transition-all ${
                                    resolution === 'accept_empresa'
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500/30'
                                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                                }`}
                            >
                                <ShieldX className={`size-5 ${resolution === 'accept_empresa' ? 'text-emerald-600' : 'text-zinc-400'}`} />
                                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Aceptar versión empresa</span>
                                <span className="text-[10px] text-zinc-400">Aplica la contra-propuesta de la empresa</span>
                            </button>
                        </div>
                    </div>

                    {/* Optional admin note */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                            Nota para la empresa (opcional)
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={2}
                            placeholder="Explica la decisión tomada..."
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                        />
                    </div>

                    {error && (
                        <p className="flex items-center gap-1 text-xs text-red-500">
                            <AlertCircle className="size-3" />{error}
                        </p>
                    )}

                    <div className="flex justify-end gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
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
        <div className="rounded-xl border border-violet-200 dark:border-violet-900 bg-white dark:bg-[#18181b] overflow-hidden">
            <div className="flex items-start justify-between px-5 py-4 border-b border-violet-100 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-900/10">
                <div className="flex flex-col gap-y-0.5">
                    <div className="flex items-center gap-2">
                        <Building2 className="size-3.5 text-violet-500" />
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                            {log.company_name ?? `Empresa #${log.target_id}`}
                        </p>
                    </div>
                    <p className="text-xs text-zinc-400">
                        {TARGET_LABELS[log.target_type] ?? log.target_type} #{log.target_id} · {formatDate(log.created_at)}
                    </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 px-2.5 py-1 text-xs font-semibold">
                    <MessageSquareDiff className="size-3" />
                    En disputa
                </span>
            </div>

            {/* Changes */}
            <div className="px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Cambios disputados</p>
                <div className="space-y-3">
                    {Object.entries(log.changes).map(([field, change]) => (
                        <div key={field} className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3">
                            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">{change.label}</p>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                    <span className="text-zinc-400 block">Antes:</span>
                                    <span className="text-red-500">{formatValue(change.old)}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-400 block">Admin editó:</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">{formatValue(change.new)}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-400 block">Empresa propone:</span>
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
                        <p className="text-xs text-zinc-700 dark:text-zinc-300">{log.empresa_note}</p>
                    </div>
                </div>
            )}

            {/* Resolve action */}
            <div className="flex items-center gap-3 px-5 py-3 border-t border-violet-100 dark:border-violet-900/40 bg-violet-50/30 dark:bg-violet-900/5">
                <button
                    onClick={() => onResolve(log)}
                    className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-violet-700 transition-colors"
                >
                    <CheckCircle className="size-3.5" />
                    Resolver disputa
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
        <div className="flex flex-col gap-y-6 p-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Disputas de cambios</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        {total} disputa{total !== 1 ? 's' : ''} pendiente{total !== 1 ? 's' : ''} de resolución
                    </p>
                </div>
                <button
                    onClick={() => load(page)}
                    disabled={loading}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                    <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="size-6 animate-spin text-zinc-400" />
                </div>
            ) : error ? (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="size-4 shrink-0" />{error}
                </div>
            ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <CheckCircle className="size-10 text-zinc-200 dark:text-zinc-700 mb-3" />
                    <p className="text-sm font-medium text-zinc-500">Sin disputas activas</p>
                    <p className="text-xs text-zinc-400 mt-1">Cuando una empresa dispute un cambio aparecerá aquí.</p>
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
                <div className="flex items-center justify-between pt-2 max-w-3xl">
                    <p className="text-xs text-zinc-400">Página {page} de {totalPages}</p>
                    <div className="flex gap-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => load(page - 1)}
                            className="rounded-lg border border-zinc-300 dark:border-zinc-700 p-1.5 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => load(page + 1)}
                            className="rounded-lg border border-zinc-300 dark:border-zinc-700 p-1.5 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
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
