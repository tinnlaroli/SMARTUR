import { useCallback, useEffect, useState } from 'react';
import {
    CheckCircle, XCircle, Eye, Clock, ShieldCheck, Loader2,
    RefreshCw, X, ShieldX, MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../shared/api/axiosClient';
import { MODULE_COLORS } from '../../../shared/config/moduleColors';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import {
    DataTableShell,
    DataTableScroll,
    DataTable,
    DataTableHead,
    DataTableHeadCell,
    DataTableBody,
    DataTableRow,
    DataTableCell,
    TABLE_BADGE_COLORS,
    TableBadge,
    TABLE_CHECKBOX_CLASS,
} from '../../../components/ui/DataTable';
import { useToast } from '../../../shared/context/ToastContext';
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey';

const COLOR  = MODULE_COLORS.companyVerification;
const PAGE_SIZE = 20;

type StatusFilter = 'all' | 'pending_docs' | 'documents_submitted' | 'active' | 'rejected' | 'suspended';

interface PendingCompany {
    id_company: number;
    name: string;
    address: string | null;
    phone: string | null;
    status: string;
    registration_date: string;
    owner_full_name: string | null;
    owner_curp: string | null;
    owner_rfc: string | null;
    submitted_at: string | null;
    ine_front_url: string | null;
    ine_back_url: string | null;
    address_proof_url: string | null;
    resubmission_count: number;
    rejection_reason: string | null;
    sector_name: string | null;
    location_name: string | null;
    id_location: number | null;
}

const MUNICIPIOS = [
    { id_location:  9, name: 'Amatlán de los Reyes' },
    { id_location: 11, name: 'Atoyac' },
    { id_location:  2, name: 'Coatepec' },
    { id_location:  3, name: 'Córdoba' },
    { id_location:  8, name: 'Cuitláhuac' },
    { id_location:  5, name: 'Fortín de las Flores' },
    { id_location:  7, name: 'Ixtaczoquitlán' },
    { id_location:  4, name: 'Orizaba' },
    { id_location:  1, name: 'Xalapa' },
    { id_location:  6, name: 'Xico' },
    { id_location: 10, name: 'Yanga' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending_docs:        { label: 'Sin documentos', color: TABLE_BADGE_COLORS.neutral },
    documents_submitted: { label: 'En revisión',    color: TABLE_BADGE_COLORS.amber   },
    rejected:            { label: 'Rechazada',      color: TABLE_BADGE_COLORS.rose    },
    active:              { label: 'Activa',         color: TABLE_BADGE_COLORS.emerald },
    suspended:           { label: 'Suspendida',     color: TABLE_BADGE_COLORS.neutral },
};

const FILTER_OPTIONS: { key: StatusFilter; label: string }[] = [
    { key: 'all',                 label: 'Todas'          },
    { key: 'pending_docs',        label: 'Sin documentos' },
    { key: 'documents_submitted', label: 'En revisión'    },
    { key: 'active',              label: 'Activas'        },
    { key: 'rejected',            label: 'Rechazadas'     },
    { key: 'suspended',           label: 'Suspendidas'    },
];

function DocButton({ label, url, onPreview }: { label: string; url: string | null; onPreview: (url: string) => void }) {
    if (!url) return <span className="text-xs" style={{ color: 'var(--color-text-alt)', opacity: 0.4 }}>No subido</span>;
    return (
        <button
            type="button"
            onClick={() => onPreview(url)}
            className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
            style={{ color: COLOR }}
        >
            <Eye className="size-3" />{label}
        </button>
    );
}

// ── Review Modal ─────────────────────────────────────────────────────────────

interface ReviewModalProps {
    company: PendingCompany;
    onClose: () => void;
    onReviewed: () => void;
}

function ReviewModal({ company, onClose, onReviewed }: ReviewModalProps) {
    const [action, setAction]         = useState<'approve' | 'reject' | 'suspend' | null>(null);
    const [reason, setReason]         = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]           = useState<string | null>(null);
    const [detail, setDetail]         = useState<PendingCompany | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [hoveredAction, setHoveredAction] = useState<string | null>(null);
    const [locationId, setLocationId] = useState<string>('');
    const [savingLocation, setSavingLocation] = useState(false);
    const toast = useToast();

    useEscapeKey(onClose);

    useEffect(() => {
        api.get(`/admin/companies/${company.id_company}/verification`)
            .then(r => {
                const d = r.data as PendingCompany;
                setDetail(d);
                setLocationId(d.id_location ? String(d.id_location) : '');
            })
            .catch(() => {});
    }, [company.id_company]);

    const handleSaveLocation = async () => {
        if (!locationId) return;
        setSavingLocation(true);
        try {
            const res = await api.patch(`/admin/companies/${c.id_company}/location`, { id_location: Number(locationId) });
            const updated = res.data as { id_location: number; location_name: string };
            setDetail(prev => prev ? { ...prev, id_location: updated.id_location, location_name: updated.location_name } : prev);
            toast.success('Municipio actualizado', updated.location_name ?? '');
        } catch {
            toast.error('Error al guardar municipio', '');
        } finally {
            setSavingLocation(false);
        }
    };

    const c   = detail ?? company;
    const cfg = STATUS_CONFIG[c.status] ?? { label: c.status, color: TABLE_BADGE_COLORS.neutral };

    const needsReason = action === 'reject' || action === 'suspend';

    const handleSubmit = async () => {
        if (!action) return;
        if (needsReason && !reason.trim()) { setError('Ingresa el motivo.'); return; }
        setSubmitting(true);
        setError(null);
        try {
            await api.patch(`/admin/companies/${c.id_company}/verify`, { action, reason });
            const labels = { approve: 'Empresa aprobada', reject: 'Empresa rechazada', suspend: 'Empresa suspendida' };
            toast.success(labels[action], c.name);
            onReviewed();
            onClose();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(msg ?? 'Error al procesar. Intenta de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.18 }}
                className="w-full max-w-lg rounded-2xl shadow-2xl p-6"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                            {c.name}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <TableBadge text={cfg.label} color={cfg.color} />
                            {c.sector_name && (
                                <span className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                    · {c.sector_name}
                                </span>
                            )}
                            {c.location_name && (
                                <span className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                    · {c.location_name}
                                </span>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 hover:opacity-70" style={{ color: 'var(--color-text-alt)' }}>
                        <X className="size-4" />
                    </button>
                </div>

                {/* Propietario */}
                {(c.owner_full_name || c.owner_curp || c.owner_rfc) && (
                    <div
                        className="rounded-xl px-4 py-3 mb-4 text-sm space-y-0.5"
                        style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}
                    >
                        {c.owner_full_name && (
                            <p style={{ color: 'var(--color-text)' }}>
                                <span className="font-medium">Propietario:</span> {c.owner_full_name}
                            </p>
                        )}
                        {c.owner_curp && (
                            <p style={{ color: 'var(--color-text-alt)' }}>CURP: {c.owner_curp}</p>
                        )}
                        {c.owner_rfc && (
                            <p style={{ color: 'var(--color-text-alt)' }}>RFC: {c.owner_rfc}</p>
                        )}
                    </div>
                )}

                {/* Municipio */}
                <div
                    className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3"
                    style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}
                >
                    <MapPin className="size-4 shrink-0" style={{ color: c.id_location ? COLOR : '#f59e0b' }} />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-alt)' }}>Municipio</p>
                        <div className="flex items-center gap-2">
                            <select
                                value={locationId}
                                onChange={e => setLocationId(e.target.value)}
                                className="flex-1 rounded-lg border px-2 py-1 text-sm focus:outline-none"
                                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                            >
                                <option value="">Sin municipio…</option>
                                {MUNICIPIOS.map(m => (
                                    <option key={m.id_location} value={String(m.id_location)}>{m.name}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={handleSaveLocation}
                                disabled={savingLocation || !locationId || locationId === String(c.id_location)}
                                className="rounded-lg px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 flex items-center gap-1.5"
                                style={{ backgroundColor: COLOR }}
                            >
                                {savingLocation && <Loader2 className="size-3 animate-spin" />}
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Documentos */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    <DocButton label="INE frente"  url={c.ine_front_url ?? null}     onPreview={setPreviewUrl} />
                    <DocButton label="INE reverso" url={c.ine_back_url ?? null}      onPreview={setPreviewUrl} />
                    <DocButton label="Comprobante" url={c.address_proof_url ?? null} onPreview={setPreviewUrl} />
                </div>

                {/* Motivo rechazo previo */}
                {c.rejection_reason && (
                    <div
                        className="rounded-xl px-4 py-3 mb-4 text-xs"
                        style={{ background: '#f43f5e10', border: '1px solid #f43f5e30', color: '#f43f5e' }}
                    >
                        <p className="font-semibold mb-0.5">Motivo de rechazo anterior:</p>
                        <p>{c.rejection_reason}</p>
                    </div>
                )}

                {/* Acciones según estado */}
                {c.status !== 'active' && c.status !== 'suspended' && (
                    <div className="flex gap-3 mb-4">
                        {(['approve', 'reject'] as const).map(a => {
                            const lit = action === a || hoveredAction === a;
                            return (
                                <button
                                    key={a}
                                    type="button"
                                    onClick={() => setAction(a)}
                                    onMouseEnter={() => setHoveredAction(a)}
                                    onMouseLeave={() => setHoveredAction(null)}
                                    className="flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition-all"
                                    style={lit
                                        ? a === 'approve'
                                            ? { borderColor: '#10b981', background: 'rgba(16,185,129,0.1)', color: '#10b981' }
                                            : { borderColor: '#f43f5e', background: 'rgba(244,63,94,0.1)', color: '#f43f5e' }
                                        : { borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }
                                    }
                                >
                                    {a === 'approve'
                                        ? <><CheckCircle className="mx-auto size-5 mb-1" />Aprobar</>
                                        : <><XCircle className="mx-auto size-5 mb-1" />Rechazar</>
                                    }
                                </button>
                            );
                        })}
                    </div>
                )}

                {c.status === 'active' && (
                    <div className="mb-4">
                        <button
                            type="button"
                            onClick={() => setAction('suspend')}
                            onMouseEnter={() => setHoveredAction('suspend')}
                            onMouseLeave={() => setHoveredAction(null)}
                            className="w-full rounded-xl border-2 py-2.5 text-sm font-semibold transition-all"
                            style={action === 'suspend' || hoveredAction === 'suspend'
                                ? { borderColor: '#f43f5e', background: 'rgba(244,63,94,0.1)', color: '#f43f5e' }
                                : { borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }
                            }
                        >
                            <ShieldX className="mx-auto size-5 mb-1" />
                            Suspender empresa
                        </button>
                    </div>
                )}

                {c.status === 'suspended' && (
                    <div className="mb-4">
                        <button
                            type="button"
                            onClick={() => setAction('approve')}
                            onMouseEnter={() => setHoveredAction('approve')}
                            onMouseLeave={() => setHoveredAction(null)}
                            className="w-full rounded-xl border-2 py-2.5 text-sm font-semibold transition-all"
                            style={action === 'approve' || hoveredAction === 'approve'
                                ? { borderColor: '#10b981', background: 'rgba(16,185,129,0.1)', color: '#10b981' }
                                : { borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }
                            }
                        >
                            <CheckCircle className="mx-auto size-5 mb-1" />
                            Reactivar empresa
                        </button>
                    </div>
                )}

                {needsReason && (
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder={action === 'suspend' ? 'Motivo de suspensión (visible para la empresa)...' : 'Motivo de rechazo (visible para la empresa)...'}
                        rows={3}
                        className="w-full rounded-xl px-4 py-2.5 text-sm placeholder:opacity-40 focus:outline-none focus:ring-2 mb-4 resize-none"
                        style={{
                            background: 'var(--color-bg-alt)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text)',
                        }}
                    />
                )}

                {error && <p className="text-sm text-rose-500 mb-3">{error}</p>}

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-80"
                        style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-alt)' }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!action || submitting}
                        className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ backgroundColor: COLOR }}
                    >
                        {submitting && <Loader2 className="size-4 animate-spin" />}
                        Confirmar
                    </button>
                </div>
            </motion.div>

            {/* Document preview lightbox */}
            <AnimatePresence>
                {previewUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
                        onClick={() => setPreviewUrl(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.93 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.93 }}
                            transition={{ duration: 0.15 }}
                            className="relative max-h-[90vh] max-w-3xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setPreviewUrl(null)}
                                className="absolute -right-3 -top-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                            >
                                <X className="size-4" />
                            </button>
                            {previewUrl.toLowerCase().match(/\.pdf(\?|$)/) ? (
                                <iframe
                                    src={previewUrl}
                                    title="Documento"
                                    className="h-[80vh] w-[700px] rounded-xl"
                                />
                            ) : (
                                <img
                                    src={previewUrl}
                                    alt="Documento"
                                    className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
                                />
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Bulk action bar ───────────────────────────────────────────────────────────

interface BulkBarProps {
    count: number;
    working: boolean;
    onApprove: () => void;
    onReject: () => void;
    onClear: () => void;
}

function BulkBar({ count, working, onApprove, onReject, onClear }: BulkBarProps) {
    return (
        <AnimatePresence>
            {count > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="flex shrink-0 items-center gap-3"
                >
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        {count} seleccionada{count !== 1 ? 's' : ''}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                        <button
                            disabled={working}
                            onClick={onApprove}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
                            style={{ backgroundColor: COLOR }}
                        >
                            <CheckCircle className="size-3.5" />
                            Aprobar
                        </button>
                        <button
                            disabled={working}
                            onClick={onReject}
                            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80 disabled:opacity-50"
                            style={{ borderColor: '#f43f5e', color: '#f43f5e', background: 'transparent' }}
                        >
                            <XCircle className="size-3.5" />
                            Rechazar
                        </button>
                        <button
                            onClick={onClear}
                            className="rounded-lg p-1.5 transition-colors hover:opacity-70"
                            style={{ color: 'var(--color-text-alt)' }}
                            title="Limpiar selección"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function AdminCompaniesVerificationPage() {
    const toast = useToast();
    const [companies, setCompanies]     = useState<PendingCompany[]>([]);
    const [total, setTotal]             = useState(0);
    const [page, setPage]               = useState(0);
    const [filter, setFilter]           = useState<StatusFilter>('all');
    const [loading, setLoading]         = useState(true);
    const [reviewing, setReviewing]     = useState<PendingCompany | null>(null);
    const [selected, setSelected]       = useState<number[]>([]);
    const [bulkWorking, setBulkWorking] = useState(false);

    const fetchCompanies = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = {
                limit: PAGE_SIZE,
                page: page + 1,
            };
            if (filter !== 'all') params.status = filter;
            const { data } = await api.get('/admin/companies', { params });
            setCompanies(data.companies);
            setTotal(data.total);
        } catch {
            toast.error('Error al cargar empresas', '');
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => { void fetchCompanies(); }, [fetchCompanies]);
    useEffect(() => { setSelected([]); }, [page, filter]);

    const allIds      = companies.map(c => c.id_company);
    const allSelected = allIds.length > 0 && allIds.every(id => selected.includes(id));
    const toggleAll   = () => setSelected(allSelected ? [] : allIds);
    const toggle      = (id: number) =>
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const handleBulkAction = async (action: 'approve' | 'reject') => {
        if (!selected.length) return;
        setBulkWorking(true);
        try {
            await Promise.all(selected.map(id =>
                api.patch(`/admin/companies/${id}/verify`, { action }),
            ));
            toast.success(
                action === 'approve'
                    ? `${selected.length} empresa(s) aprobada(s)`
                    : `${selected.length} empresa(s) rechazada(s)`,
                '',
            );
            setSelected([]);
            void fetchCompanies();
        } catch {
            toast.error('Error en la operación masiva', '');
        } finally {
            setBulkWorking(false);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">

            {/* Header */}
            <div className="shrink-0">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                    Verificación de empresas
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                    {total} empresa{total !== 1 ? 's' : ''} registrada{total !== 1 ? 's' : ''} en el sistema
                </p>
            </div>

            {/* Info banner */}
            <div
                className="rounded-xl border px-5 py-4 flex items-start gap-3 shrink-0"
                style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
            >
                <ShieldCheck className="size-5 mt-0.5 shrink-0" style={{ color: COLOR }} />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>
                        Verificación y activación de empresas
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        Haz clic en cualquier fila para revisar, aprobar, rechazar o suspender. Solo las empresas aprobadas pueden publicar servicios.
                    </p>
                </div>
            </div>

            {/* Filters + actions */}
            <div className="shrink-0 flex items-center gap-3 flex-wrap">
                <div className="flex gap-2 flex-wrap">
                    {FILTER_OPTIONS.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => { setFilter(key); setPage(0); }}
                            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                            style={filter === key
                                ? { backgroundColor: COLOR, color: '#fff' }
                                : { background: 'var(--color-bg-alt)', color: 'var(--color-text-alt)', border: '1px solid var(--color-border)' }
                            }
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <BulkBar
                        count={selected.length}
                        working={bulkWorking}
                        onApprove={() => handleBulkAction('approve')}
                        onReject={() => handleBulkAction('reject')}
                        onClear={() => setSelected([])}
                    />
                    <button
                        onClick={() => void fetchCompanies()}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                        style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-alt)', border: '1px solid var(--color-border)' }}
                        title="Actualizar"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="flex min-h-0 flex-1 flex-col">
                <DataTableShell className="flex-1">
                    <DataTableScroll>
                        {loading ? (
                            <TableSkeleton rows={10} colWidths={['w-10', 'flex-1', 'w-40', 'w-32', 'w-28', 'w-32']} />
                        ) : companies.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--color-text-alt)' }}>
                                <ShieldCheck size={40} style={{ opacity: 0.25 }} />
                                <p className="text-sm">No hay empresas en esta vista</p>
                            </div>
                        ) : (
                            <DataTable>
                                <DataTableHead>
                                    <tr>
                                        <DataTableHeadCell className="w-10">
                                            <input
                                                type="checkbox"
                                                className={TABLE_CHECKBOX_CLASS}
                                                checked={allSelected}
                                                onChange={toggleAll}
                                            />
                                        </DataTableHeadCell>
                                        <DataTableHeadCell>Empresa</DataTableHeadCell>
                                        <DataTableHeadCell>Propietario</DataTableHeadCell>
                                        <DataTableHeadCell>Sector / Ciudad</DataTableHeadCell>
                                        <DataTableHeadCell>Estado</DataTableHeadCell>
                                        <DataTableHeadCell>Registro</DataTableHeadCell>
                                    </tr>
                                </DataTableHead>
                                <DataTableBody>
                                    {companies.map((company, i) => {
                                        const cfg = STATUS_CONFIG[company.status] ?? { label: company.status, color: TABLE_BADGE_COLORS.neutral };
                                        return (
                                            <DataTableRow
                                                key={company.id_company}
                                                index={i}
                                                onClick={() => setReviewing(company)}
                                                className="cursor-pointer"
                                            >
                                                <DataTableCell
                                                    className="w-10"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className={TABLE_CHECKBOX_CLASS}
                                                        checked={selected.includes(company.id_company)}
                                                        onChange={() => toggle(company.id_company)}
                                                    />
                                                </DataTableCell>
                                                <DataTableCell>
                                                    <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                                                        {company.name}
                                                    </p>
                                                    {company.phone && (
                                                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-alt)', opacity: 0.7 }}>
                                                            {company.phone}
                                                        </p>
                                                    )}
                                                </DataTableCell>
                                                <DataTableCell>
                                                    {company.owner_full_name
                                                        ? <span style={{ color: 'var(--color-text)' }}>{company.owner_full_name}</span>
                                                        : <span style={{ opacity: 0.35 }}>—</span>
                                                    }
                                                </DataTableCell>
                                                <DataTableCell>
                                                    <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                                                        {company.sector_name ?? '—'}
                                                    </p>
                                                    {company.location_name && (
                                                        <p className="text-xs" style={{ color: 'var(--color-text-alt)', opacity: 0.7 }}>
                                                            {company.location_name}
                                                        </p>
                                                    )}
                                                </DataTableCell>
                                                <DataTableCell>
                                                    <TableBadge text={cfg.label} color={cfg.color} />
                                                </DataTableCell>
                                                <DataTableCell className="text-xs">
                                                    {company.submitted_at
                                                        ? new Date(company.submitted_at).toLocaleDateString('es-MX')
                                                        : company.registration_date
                                                            ? <span className="flex items-center gap-1">
                                                                <Clock className="size-3" />
                                                                {new Date(company.registration_date).toLocaleDateString('es-MX')}
                                                              </span>
                                                            : '—'
                                                    }
                                                </DataTableCell>
                                            </DataTableRow>
                                        );
                                    })}
                                </DataTableBody>
                            </DataTable>
                        )}
                    </DataTableScroll>
                </DataTableShell>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="shrink-0 flex justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40 transition-colors hover:opacity-80"
                        style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-alt)' }}
                    >
                        ← Anterior
                    </button>
                    <span className="px-3 py-1.5 text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        {page + 1} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40 transition-colors hover:opacity-80"
                        style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-alt)' }}
                    >
                        Siguiente →
                    </button>
                </div>
            )}

            {/* Review modal */}
            <AnimatePresence>
                {reviewing && (
                    <ReviewModal
                        company={reviewing}
                        onClose={() => setReviewing(null)}
                        onReviewed={() => void fetchCompanies()}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
