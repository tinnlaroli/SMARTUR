import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../../shared/api/axiosClient';
import { useBadges } from '../context/EmpresaBadgesContext';
import { AlertCircle, CheckCircle, Clock, MessageSquareDiff, X, Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
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
    changes: Record<string, FieldChange>;
    status: 'pending_review' | 'accepted' | 'disputed' | 'resolved_admin' | 'resolved_empresa';
    empresa_note: string | null;
    empresa_counter: Record<string, unknown> | null;
    admin_resolution_note: string | null;
    created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ChangeLog['status'], { label: string; color: string; icon: React.ReactNode }> = {
    pending_review:    { label: 'Pendiente',          color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',   icon: <Clock className="size-3" /> },
    accepted:          { label: 'Aceptado',           color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: <CheckCircle className="size-3" /> },
    disputed:          { label: 'Disputado',          color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', icon: <MessageSquareDiff className="size-3" /> },
    resolved_admin:    { label: 'Resuelto (admin)',   color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',           icon: <CheckCircle className="size-3" /> },
    resolved_empresa:  { label: 'Resuelto (tu vers.)',color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: <CheckCircle className="size-3" /> },
};

const TARGET_LABELS: Record<ChangeLog['target_type'], string> = {
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

// ── Dispute Modal ──────────────────────────────────────────────────────────────

interface DisputeModalProps {
    log: ChangeLog;
    onClose: () => void;
    onSubmit: (note: string, counter: Record<string, unknown>) => Promise<void>;
}

function DisputeModal({ log, onClose, onSubmit }: DisputeModalProps) {
    useEscapeKey(onClose);
    const [note, setNote] = useState('');
    const [counter, setCounter] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCounter = (field: string, val: string) => {
        setCounter((prev) => ({ ...prev, [field]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!note.trim()) { setError('Debes incluir una justificación.'); return; }
        setLoading(true);
        setError('');
        try {
            const counterObj: Record<string, unknown> = {};
            for (const [field, val] of Object.entries(counter)) {
                if (val.trim()) counterObj[field] = val.trim();
            }
            await onSubmit(note.trim(), counterObj);
            onClose();
        } catch {
            setError('No se pudo enviar la disputa. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#121214] rounded-xl shadow-2xl w-full max-w-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <MessageSquareDiff className="size-4 text-violet-500" />
                        Disputar cambio
                    </h3>
                    <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-y-5">
                    {/* Summary of changes */}
                    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <div className="bg-zinc-50 dark:bg-zinc-900 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
                            Campos modificados
                        </div>
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {Object.entries(log.changes).map(([field, change]) => (
                                <div key={field} className="px-4 py-3 flex flex-col gap-y-2">
                                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{change.label}</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-zinc-400">Antes: </span>
                                            <span className="text-red-500 line-through">{formatValue(change.old)}</span>
                                        </div>
                                        <div>
                                            <span className="text-zinc-400">Ahora: </span>
                                            <span className="text-emerald-600 dark:text-emerald-400">{formatValue(change.new)}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-400 uppercase tracking-widest">Tu propuesta (opcional)</label>
                                        <input
                                            type="text"
                                            value={counter[field] ?? ''}
                                            onChange={(e) => handleCounter(field, e.target.value)}
                                            placeholder={formatValue(change.old)}
                                            className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white px-3 py-1.5 text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                            Justificación *
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            placeholder="Explica por qué no estás de acuerdo con los cambios..."
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
                            disabled={loading}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-60"
                        >
                            {loading && <Loader2 className="size-3.5 animate-spin" />}
                            Enviar disputa
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Change Log Card ────────────────────────────────────────────────────────────

interface ChangeLogCardProps {
    log: ChangeLog;
    onAccept: (id: number) => Promise<void>;
    onDispute: (log: ChangeLog) => void;
}

function ChangeLogCard({ log, onAccept, onDispute }: ChangeLogCardProps) {
    const [accepting, setAccepting] = useState(false);
    const cfg = STATUS_CONFIG[log.status];

    const handleAccept = async () => {
        setAccepting(true);
        await onAccept(log.id);
        setAccepting(false);
    };

    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-col gap-y-0.5">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {TARGET_LABELS[log.target_type]} #{log.target_id}
                    </p>
                    <p className="text-xs text-zinc-400">
                        Modificado por <span className="font-medium text-zinc-600 dark:text-zinc-300">{log.admin_name ?? 'Admin'}</span> · {formatDate(log.created_at)}
                    </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.color}`}>
                    {cfg.icon}{cfg.label}
                </span>
            </div>

            {/* Changed fields */}
            <div className="px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Cambios aplicados</p>
                <div className="space-y-2">
                    {Object.entries(log.changes).map(([field, change]) => (
                        <div key={field} className="flex items-start gap-3 text-sm">
                            <span className="shrink-0 text-xs font-semibold text-zinc-500 w-28">{change.label}</span>
                            <span className="text-red-500 line-through text-xs">{formatValue(change.old)}</span>
                            <span className="text-zinc-400 text-xs">→</span>
                            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">{formatValue(change.new)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Empresa response (if any) */}
            {log.empresa_note && (
                <div className="px-5 pb-4">
                    <div className="rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500 mb-1">Tu justificación</p>
                        <p className="text-xs text-zinc-700 dark:text-zinc-300">{log.empresa_note}</p>
                    </div>
                </div>
            )}

            {/* Admin resolution note */}
            {log.admin_resolution_note && (
                <div className="px-5 pb-4">
                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Respuesta del administrador</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300">{log.admin_resolution_note}</p>
                    </div>
                </div>
            )}

            {/* Actions */}
            {log.status === 'pending_review' && (
                <div className="flex items-center gap-3 px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                    <button
                        onClick={handleAccept}
                        disabled={accepting}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
                    >
                        {accepting ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle className="size-3" />}
                        Aceptar cambio
                    </button>
                    <button
                        onClick={() => onDispute(log)}
                        className="flex items-center gap-1.5 rounded-lg border border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 px-3.5 py-2 text-xs font-semibold hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                    >
                        <MessageSquareDiff className="size-3" />
                        Disputar
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function EmpresaCambiosPage() {
    const [logs, setLogs] = useState<ChangeLog[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [disputeTarget, setDisputeTarget] = useState<ChangeLog | null>(null);
    const { refresh: refreshBadges } = useBadges();

    const load = useCallback(async (p = 1) => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get('/empresa/change-log', { params: { page: p, limit: 10 } });
            setLogs(data.logs ?? []);
            setTotal(data.total ?? 0);
            setTotalPages(data.totalPages ?? 1);
            setPage(p);
            void refreshBadges();
        } catch {
            setError('No se pudieron cargar los cambios. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    }, [refreshBadges]);

    useEffect(() => { load(1); }, [load]);

    const handleAccept = async (id: number) => {
        await api.patch(`/empresa/change-log/${id}/accept`);
        setLogs((prev) => prev.map((l) => l.id === id ? { ...l, status: 'accepted' } : l));
    };

    const handleDispute = async (note: string, counter: Record<string, unknown>) => {
        if (!disputeTarget) return;
        await api.patch(`/empresa/change-log/${disputeTarget.id}/dispute`, {
            empresa_note: note,
            empresa_counter: Object.keys(counter).length ? counter : undefined,
        });
        setLogs((prev) => prev.map((l) =>
            l.id === disputeTarget.id
                ? { ...l, status: 'disputed', empresa_note: note, empresa_counter: counter }
                : l
        ));
    };

    const pendingCount = useMemo(() => logs.filter((l) => l.status === 'pending_review').length, [logs]);

    return (
        <div className="flex flex-col gap-y-6 p-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Aclaraciones</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        {total} registro{total !== 1 ? 's' : ''} · {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
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
                    <p className="text-sm font-medium text-zinc-500">Sin cambios registrados</p>
                    <p className="text-xs text-zinc-400 mt-1">Cuando un administrador edite tu información aparecerá aquí.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-y-4">
                    {logs.map((log) => (
                        <ChangeLogCard
                            key={log.id}
                            log={log}
                            onAccept={handleAccept}
                            onDispute={setDisputeTarget}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
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

            {/* Dispute modal */}
            {disputeTarget && (
                <DisputeModal
                    log={disputeTarget}
                    onClose={() => setDisputeTarget(null)}
                    onSubmit={handleDispute}
                />
            )}
        </div>
    );
}

export default EmpresaCambiosPage;
