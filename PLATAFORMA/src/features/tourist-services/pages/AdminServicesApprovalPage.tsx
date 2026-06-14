import { useEffect, useState } from 'react';
import {
    CheckCircle, XCircle, ClipboardCheck, X, Loader2, RefreshCw,
    Building2, MapPin, Clock, Phone, ImageOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../shared/api/axiosClient';
import { MODULE_COLORS } from '../../../shared/config/moduleColors';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey';
import {
    DataTableShell,
    DataTableScroll,
    DataTable,
    DataTableHead,
    DataTableHeadCell,
    DataTableBody,
    DataTableRow,
    DataTableCell,
    TABLE_CHECKBOX_CLASS,
    TABLE_BADGE_COLORS,
    TableBadge,
} from '../../../components/ui/DataTable';

const COLOR = MODULE_COLORS.servicesApproval;

interface PendingService {
    id_service: number;
    name: string;
    description: string | null;
    service_type: string | null;
    status: string;
    image_url: string | null;
    price_from: number | null;
    price_to: number | null;
    currency: string;
    duration_minutes: number | null;
    contact_phone: string | null;
    created_at: string;
    company_name: string;
    id_company: number;
    location_name: string | null;
}

function PriceRange({ from, to, currency }: { from: number | null; to: number | null; currency: string }) {
    if (!from && !to) return <span style={{ opacity: 0.4 }}>—</span>;
    if (from && to) return <span>{currency} {from.toLocaleString()} – {to.toLocaleString()}</span>;
    if (from) return <span>Desde {currency} {from.toLocaleString()}</span>;
    return <span>Hasta {currency} {to!.toLocaleString()}</span>;
}

// ── Service Preview Modal ─────────────────────────────────────────────────────

interface ServicePreviewModalProps {
    service: PendingService;
    onClose: () => void;
    onReviewed: (id: number) => void;
}

function ServicePreviewModal({ service, onClose, onReviewed }: ServicePreviewModalProps) {
    const [action, setAction]         = useState<'approve' | 'reject' | null>(null);
    const [reason, setReason]         = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]           = useState<string | null>(null);

    useEscapeKey(onClose);

    const handleSubmit = async () => {
        if (!action) return;
        if (action === 'reject' && !reason.trim()) { setError('Ingresa el motivo.'); return; }
        setSubmitting(true);
        setError(null);
        try {
            await api.patch(`/admin/services/${service.id_service}/${action}`);
            onReviewed(service.id_service);
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
                className="w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
            >
                {/* Hero image */}
                {service.image_url ? (
                    <div className="h-48 w-full overflow-hidden">
                        <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="h-28 w-full flex items-center justify-center" style={{ background: 'var(--color-bg-alt)' }}>
                        <ImageOff className="size-8 opacity-20" style={{ color: 'var(--color-text-alt)' }} />
                    </div>
                )}

                <div className="p-6">
                    {/* Title + close */}
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h2 className="text-lg font-bold leading-tight" style={{ color: 'var(--color-text)' }}>
                                {service.name}
                            </h2>
                            {service.service_type && (
                                <div className="mt-1">
                                    <TableBadge text={service.service_type} color={TABLE_BADGE_COLORS.sky} />
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-1.5 hover:opacity-70 shrink-0"
                            style={{ color: 'var(--color-text-alt)' }}
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    {/* Meta info grid */}
                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                        <div className="flex items-center gap-2" style={{ color: 'var(--color-text-alt)' }}>
                            <Building2 className="size-3.5 shrink-0" style={{ color: COLOR }} />
                            <span className="truncate">{service.company_name}</span>
                        </div>
                        {service.location_name && (
                            <div className="flex items-center gap-2" style={{ color: 'var(--color-text-alt)' }}>
                                <MapPin className="size-3.5 shrink-0" style={{ color: COLOR }} />
                                <span className="truncate">{service.location_name}</span>
                            </div>
                        )}
                        {(service.price_from || service.price_to) && (
                            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                <span className="font-bold text-sm" style={{ color: COLOR }}>$</span>
                                <PriceRange
                                    from={service.price_from}
                                    to={service.price_to}
                                    currency={service.currency ?? 'MXN'}
                                />
                            </div>
                        )}
                        {service.duration_minutes && (
                            <div className="flex items-center gap-2" style={{ color: 'var(--color-text-alt)' }}>
                                <Clock className="size-3.5 shrink-0" style={{ color: COLOR }} />
                                <span>{service.duration_minutes} min</span>
                            </div>
                        )}
                        {service.contact_phone && (
                            <div className="flex items-center gap-2" style={{ color: 'var(--color-text-alt)' }}>
                                <Phone className="size-3.5 shrink-0" style={{ color: COLOR }} />
                                <span>{service.contact_phone}</span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {service.description && (
                        <div
                            className="rounded-xl px-4 py-3 mb-4 text-sm"
                            style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}
                        >
                            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text)', opacity: 0.5 }}>
                                Descripción
                            </p>
                            <p className="leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                                {service.description}
                            </p>
                        </div>
                    )}

                    {/* Action selector */}
                    <div className="flex gap-3 mb-4">
                        {(['approve', 'reject'] as const).map(a => {
                            const lit = action === a;
                            return (
                                <button
                                    key={a}
                                    type="button"
                                    onClick={() => setAction(a)}
                                    className="flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition-all"
                                    style={lit
                                        ? a === 'approve'
                                            ? { borderColor: COLOR, background: `${COLOR}1a`, color: COLOR }
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

                    {action === 'reject' && (
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Motivo de rechazo (visible para la empresa)..."
                            rows={3}
                            className="w-full rounded-xl px-4 py-2.5 text-sm placeholder:opacity-40 focus:outline-none focus:ring-2 mb-4 resize-none"
                            style={{
                                background: 'var(--color-bg-alt)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text)',
                                outlineColor: COLOR,
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
                </div>
            </motion.div>
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const SERVICE_FILTERS: { key: string | null; label: string }[] = [
    { key: null,             label: 'Todos'       },
    { key: 'pending_review', label: 'En revisión' },
    { key: 'active',         label: 'Activos'     },
    { key: 'rejected',       label: 'Rechazados'  },
];

const SERVICE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending_review: { label: 'En revisión', color: TABLE_BADGE_COLORS.amber   },
    active:         { label: 'Activo',      color: TABLE_BADGE_COLORS.emerald },
    rejected:       { label: 'Rechazado',   color: TABLE_BADGE_COLORS.rose    },
};

export function AdminServicesApprovalPage() {
    const [services, setServices]         = useState<PendingService[]>([]);
    const [total, setTotal]               = useState(0);
    const [loading, setLoading]           = useState(true);
    const [search, setSearch]             = useState('');
    const [activeFilter, setActiveFilter] = useState<string | null>('pending_review');
    const [bulkWorking, setBulkWorking]   = useState(false);
    const [selected, setSelected]         = useState<number[]>([]);
    const [previewing, setPreviewing]     = useState<PendingService | null>(null);
    const [actionError, setActionError]   = useState<string | null>(null);

    const fetchServices = async (filter: string | null) => {
        setLoading(true);
        try {
            const params: Record<string, string> = { limit: '100' };
            if (filter) params.status = filter;
            const { data } = await api.get('/admin/services', { params });
            setServices(data.services);
            setTotal(data.total);
        } catch {
            //
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void fetchServices(activeFilter); }, [activeFilter]);

    const handleReviewed = (id: number) => {
        setServices(prev => prev.filter(s => s.id_service !== id));
        setTotal(prev => prev - 1);
        setSelected(prev => prev.filter(x => x !== id));
    };

    const handleBulkAction = async (action: 'approve' | 'reject') => {
        if (!selected.length) return;
        setBulkWorking(true);
        try {
            await Promise.all(selected.map(id => api.patch(`/admin/services/${id}/${action}`)));
            setServices(prev => prev.filter(s => !selected.includes(s.id_service)));
            setTotal(prev => prev - selected.length);
            setSelected([]);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setActionError(msg ?? 'Error en la operación masiva.');
        } finally {
            setBulkWorking(false);
        }
    };

    const filtered = services.filter(s =>
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.company_name.toLowerCase().includes(search.toLowerCase()),
    );

    const allIds      = filtered.map(s => s.id_service);
    const allSelected = allIds.length > 0 && allIds.every(id => selected.includes(id));
    const toggleAll   = () => setSelected(allSelected ? [] : allIds);
    const toggle      = (id: number) =>
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            {/* Header */}
            <div className="shrink-0">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                    Servicios turísticos
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                    {total} servicio{total !== 1 ? 's' : ''} {activeFilter === 'pending_review' ? 'esperando revisión' : activeFilter ? `con estado "${SERVICE_FILTERS.find(f => f.key === activeFilter)?.label ?? activeFilter}"` : 'en total'}
                </p>
            </div>

            {/* Info banner */}
            <div
                className="rounded-xl border px-5 py-4 flex items-start gap-3 shrink-0"
                style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
            >
                <ClipboardCheck className="size-5 mt-0.5 shrink-0" style={{ color: COLOR }} />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>
                        Validación de servicios turísticos
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        Haz clic en cualquier fila para revisar el detalle completo antes de aprobar o rechazar. Solo los servicios aprobados son visibles en la app y participan en el motor de recomendaciones.
                    </p>
                </div>
            </div>

            {actionError && (
                <p className="shrink-0 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-400">
                    {actionError}
                </p>
            )}

            {/* Filters + bulk + search — misma fila, mismo patrón que verificar empresas */}
            <div className="shrink-0 flex items-center gap-3 flex-wrap">
                <div className="flex gap-2 flex-wrap">
                    {SERVICE_FILTERS.map(f => (
                        <button
                            key={String(f.key)}
                            onClick={() => { setActiveFilter(f.key); setSelected([]); }}
                            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                            style={activeFilter === f.key
                                ? { backgroundColor: COLOR, color: '#fff' }
                                : { background: 'var(--color-bg-alt)', color: 'var(--color-text-alt)', border: '1px solid var(--color-border)' }
                            }
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <AnimatePresence>
                        {selected.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.18 }}
                                className="flex items-center gap-2"
                            >
                                <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                    {selected.length} seleccionado{selected.length !== 1 ? 's' : ''}
                                </span>
                                <button
                                    disabled={bulkWorking}
                                    onClick={() => handleBulkAction('approve')}
                                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
                                    style={{ backgroundColor: COLOR }}
                                >
                                    {bulkWorking ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle size={12} />}
                                    Aprobar
                                </button>
                                <button
                                    disabled={bulkWorking}
                                    onClick={() => handleBulkAction('reject')}
                                    className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80 disabled:opacity-50"
                                    style={{ borderColor: '#f43f5e', color: '#f43f5e', background: 'transparent' }}
                                >
                                    {bulkWorking ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle size={12} />}
                                    Rechazar
                                </button>
                                <button
                                    onClick={() => setSelected([])}
                                    className="rounded-lg p-1.5 transition-colors hover:opacity-70"
                                    style={{ color: 'var(--color-text-alt)' }}
                                    title="Limpiar selección"
                                >
                                    <X size={14} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar servicio o empresa..."
                        className="w-64 rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                    <button
                        onClick={() => void fetchServices(activeFilter)}
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
                            <TableSkeleton rows={10} colWidths={['w-10', 'flex-1', 'w-40', 'w-28', 'w-24', 'w-36']} />
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--color-text-alt)' }}>
                                <CheckCircle size={40} className="text-emerald-400" style={{ opacity: 0.5 }} />
                                <p className="text-sm">No hay servicios pendientes de revisión</p>
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
                                        <DataTableHeadCell>Servicio</DataTableHeadCell>
                                        <DataTableHeadCell>Empresa</DataTableHeadCell>
                                        <DataTableHeadCell>Estado</DataTableHeadCell>
                                        <DataTableHeadCell>Precio</DataTableHeadCell>
                                        <DataTableHeadCell>Enviado</DataTableHeadCell>
                                    </tr>
                                </DataTableHead>
                                <DataTableBody>
                                    {filtered.map((service, i) => (
                                        <DataTableRow
                                            key={service.id_service}
                                            index={i}
                                            onClick={() => setPreviewing(service)}
                                            className="cursor-pointer"
                                        >
                                            <DataTableCell
                                                className="w-10"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className={TABLE_CHECKBOX_CLASS}
                                                    checked={selected.includes(service.id_service)}
                                                    onChange={() => toggle(service.id_service)}
                                                />
                                            </DataTableCell>
                                            <DataTableCell>
                                                <div className="flex items-center gap-3">
                                                    {service.image_url && (
                                                        <img
                                                            src={service.image_url}
                                                            alt={service.name}
                                                            className="size-9 shrink-0 rounded-lg object-cover"
                                                        />
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="font-medium truncate" style={{ color: 'var(--color-text)' }}>
                                                            {service.name}
                                                        </p>
                                                        {service.service_type && (
                                                            <TableBadge
                                                                text={service.service_type}
                                                                color={TABLE_BADGE_COLORS.sky}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </DataTableCell>
                                            <DataTableCell>
                                                <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                                                    {service.company_name}
                                                </p>
                                                {service.location_name && (
                                                    <p className="text-xs" style={{ color: 'var(--color-text-alt)', opacity: 0.7 }}>
                                                        {service.location_name}
                                                    </p>
                                                )}
                                            </DataTableCell>
                                            <DataTableCell>
                                                <TableBadge
                                                    text={SERVICE_STATUS_CONFIG[service.status]?.label ?? service.status}
                                                    color={SERVICE_STATUS_CONFIG[service.status]?.color ?? TABLE_BADGE_COLORS.neutral}
                                                />
                                            </DataTableCell>
                                            <DataTableCell className="text-xs">
                                                <PriceRange
                                                    from={service.price_from}
                                                    to={service.price_to}
                                                    currency={service.currency ?? 'MXN'}
                                                />
                                            </DataTableCell>
                                            <DataTableCell className="text-xs">
                                                {new Date(service.created_at).toLocaleDateString('es-MX')}
                                            </DataTableCell>
                                        </DataTableRow>
                                    ))}
                                </DataTableBody>
                            </DataTable>
                        )}
                    </DataTableScroll>
                </DataTableShell>
            </div>

            {/* Service preview modal */}
            <AnimatePresence>
                {previewing && (
                    <ServicePreviewModal
                        service={previewing}
                        onClose={() => setPreviewing(null)}
                        onReviewed={handleReviewed}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
