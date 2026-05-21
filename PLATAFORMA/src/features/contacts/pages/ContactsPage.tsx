import { useEffect, useState, useMemo } from 'react';
import { useContacts } from '../hooks/useContacts';
import { Mail, Trash2, Globe, MessageSquare } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../../../shared/context/ToastContext';
import {
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableHead,
    DataTableHeadCell,
    DataTableRow,
    DataTableScroll,
    DataTableShell,
    SortableHeadCell,
    nextSort,
    sortRows,
} from '../../../components/ui/DataTable';
import type { SortState } from '../../../components/ui/DataTable';
import { TableBodyRows } from '../../../components/ui/TableSkeleton';
import Pagination from '../../users/components/Pagination';
import type { ContactStatus } from '../types/types';

const LIMIT = 20;

function formatDate(iso: string) {
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
}

const SOURCE_LABEL: Record<string, string> = {
    landing_b2b: 'Landing B2B',
    landing_turista: 'Landing Turista',
    plataforma_contact: 'Plataforma',
    dashboard: 'Dashboard',
};

const REASON_COLOR: Record<string, string> = {
    download: 'rgba(239,68,68,0.12)',
    join: 'rgba(109,40,217,0.12)',
    tourist: 'rgba(16,185,129,0.12)',
    pricing: 'rgba(245,158,11,0.12)',
    evaluation: 'rgba(6,182,212,0.12)',
    suggestion: 'rgba(99,102,241,0.12)',
    other: 'rgba(107,114,128,0.12)',
};

const REASON_TEXT: Record<string, string> = {
    download: '#ef4444',
    join: '#7c3aed',
    tourist: '#10b981',
    pricing: '#d97706',
    evaluation: '#0891b2',
    suggestion: '#6366f1',
    other: '#6b7280',
};

const STATUS_LABEL: Record<ContactStatus, string> = {
    pending: 'Pendiente',
    in_progress: 'En atención',
    done: 'Resuelto',
    dismissed: 'Descartado',
};

const STATUS_STYLE: Record<ContactStatus, { bg: string; color: string }> = {
    pending:     { bg: 'rgba(245,158,11,0.12)',  color: '#d97706' },
    in_progress: { bg: 'rgba(6,182,212,0.12)',   color: '#0891b2' },
    done:        { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
    dismissed:   { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' },
};

export const ContactsPage = () => {
    const { subscriptions, isLoading, totalPages, totalRecords, fetchSubscriptions, updateStatus, deleteSubscription } = useContacts();
    const [searchParams, setSearchParams] = useSearchParams();
    const toast = useToast();
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [sort, setSort] = useState<SortState | null>(null);
    const handleSort = (key: string) => setSort(prev => nextSort(prev, key));
    const displayData = useMemo(() => sortRows(subscriptions, sort), [subscriptions, sort]);

    const page = Number(searchParams.get('page')) || 1;

    useEffect(() => { fetchSubscriptions(page, LIMIT); }, [page, fetchSubscriptions]);

    const handleStatusChange = async (id: number, status: ContactStatus) => {
        setUpdatingId(id);
        try {
            await updateStatus(id, status);
        } catch {
            toast.error('Error', 'No se pudo actualizar el estado.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async (id: number, email: string) => {
        if (!window.confirm(`¿Eliminar el contacto de "${email}"?`)) return;
        setDeletingId(id);
        try {
            await deleteSubscription(id);
            if (expandedId === id) setExpandedId(null);
            toast.success('Contacto eliminado', `${email} fue eliminado.`);
        } catch {
            toast.error('Error', 'No se pudo eliminar el contacto.');
        } finally {
            setDeletingId(null);
        }
    };

    const expandedSub = subscriptions.find((s) => s.id === expandedId);

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600">
                        <Mail className="size-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                            Contactos & Suscripciones
                        </h1>
                        <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                            Mensajes capturados desde los formularios de contacto
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="rounded-full px-3 py-1 text-sm font-semibold" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                        {totalRecords} registros
                    </span>
                </div>
            </div>

            {/* Info banner */}
            <div className="shrink-0 rounded-xl border px-5 py-4 flex items-start gap-3" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                <Mail className="size-5 mt-0.5 shrink-0 text-emerald-500" />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>¿Qué son los contactos?</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        Mensajes enviados por visitantes y empresas a través de los formularios de contacto de la plataforma y la landing page.
                        Desde aquí puedes revisar cada mensaje, cambiar su estado de atención y eliminar registros.
                    </p>
                </div>
            </div>

            {/* Message detail panel */}
            {expandedSub?.message && (
                <div className="shrink-0 rounded-2xl border p-4" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="size-4 text-emerald-500" />
                            <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{expandedSub.email}</span>
                            {expandedSub.reason && (
                                <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: REASON_COLOR[expandedSub.reason] ?? 'rgba(107,114,128,0.1)', color: REASON_TEXT[expandedSub.reason] ?? '#6b7280' }}>
                                    {expandedSub.reason}
                                </span>
                            )}
                        </div>
                        <button type="button" onClick={() => setExpandedId(null)} className="text-xs opacity-60 hover:opacity-100" style={{ color: 'var(--color-text-alt)' }}>
                            Cerrar
                        </button>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                        {expandedSub.message}
                    </p>
                </div>
            )}

            {/* Table */}
            <DataTableShell className="h-full">
                {subscriptions.length === 0 && !isLoading ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3">
                        <Globe className="size-10" style={{ color: 'var(--color-border)' }} />
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-alt)' }}>Sin contactos todavía</p>
                    </div>
                ) : (
                    <DataTableScroll>
                        <DataTable>
                            <DataTableHead>
                                <tr>
                                    <DataTableHeadCell>#</DataTableHeadCell>
                                    <SortableHeadCell sortKey="email" sort={sort} onSort={handleSort}>
                                        <span className="flex items-center gap-1.5"><Mail className="size-3.5" />Correo</span>
                                    </SortableHeadCell>
                                    <SortableHeadCell sortKey="reason" sort={sort} onSort={handleSort}>Motivo</SortableHeadCell>
                                    <DataTableHeadCell>Mensaje</DataTableHeadCell>
                                    <SortableHeadCell sortKey="source" sort={sort} onSort={handleSort}>
                                        <span className="flex items-center gap-1.5"><Globe className="size-3.5" />Fuente</span>
                                    </SortableHeadCell>
                                    <SortableHeadCell sortKey="status" sort={sort} onSort={handleSort}>Estado</SortableHeadCell>
                                    <SortableHeadCell sortKey="created_at" sort={sort} onSort={handleSort}>Fecha</SortableHeadCell>
                                    <DataTableHeadCell></DataTableHeadCell>
                                </tr>
                            </DataTableHead>
                            <DataTableBody>
                                {isLoading ? (
                                    <TableBodyRows rows={10} colWidths={['w-8', 'w-40', 'w-24', 'flex-1', 'w-24', 'w-28', 'w-28', 'w-10']} />
                                ) : (
                                    displayData.map((sub, i) => {
                                        const reasonKey = sub.reason ?? '';
                                        const isExpanded = expandedId === sub.id;
                                        const statusStyle = STATUS_STYLE[sub.status] ?? STATUS_STYLE.pending;

                                        return (
                                            <DataTableRow key={sub.id} index={i}>
                                                <DataTableCell>
                                                    <span className="font-mono text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                                        {(page - 1) * LIMIT + i + 1}
                                                    </span>
                                                </DataTableCell>
                                                <DataTableCell>
                                                    <span className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>{sub.email}</span>
                                                </DataTableCell>
                                                <DataTableCell>
                                                    {sub.reason ? (
                                                        <span
                                                            className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                                                            style={{
                                                                background: REASON_COLOR[reasonKey] ?? 'rgba(107,114,128,0.1)',
                                                                color: REASON_TEXT[reasonKey] ?? '#6b7280',
                                                            }}
                                                        >
                                                            {sub.reason}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs opacity-40" style={{ color: 'var(--color-text-alt)' }}>—</span>
                                                    )}
                                                </DataTableCell>
                                                <DataTableCell className="max-w-[220px]">
                                                    {sub.message ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                                                            className="text-left text-xs leading-relaxed transition-opacity hover:opacity-80"
                                                            style={{ color: 'var(--color-text-alt)' }}
                                                            title={isExpanded ? 'Colapsar' : 'Ver mensaje completo'}
                                                        >
                                                            {sub.message.length > 70
                                                                ? sub.message.slice(0, 70) + '…'
                                                                : sub.message}
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs opacity-40" style={{ color: 'var(--color-text-alt)' }}>—</span>
                                                    )}
                                                </DataTableCell>
                                                <DataTableCell>
                                                    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                                                        {SOURCE_LABEL[sub.source] ?? sub.source}
                                                    </span>
                                                </DataTableCell>
                                                <DataTableCell>
                                                    <select
                                                        value={sub.status}
                                                        disabled={updatingId === sub.id}
                                                        onChange={(e) => handleStatusChange(sub.id, e.target.value as ContactStatus)}
                                                        className="rounded-full border-0 py-0.5 pl-2.5 pr-6 text-xs font-medium outline-none transition-opacity disabled:opacity-50 cursor-pointer appearance-none"
                                                        style={{
                                                            background: statusStyle.bg,
                                                            color: statusStyle.color,
                                                        }}
                                                    >
                                                        {(Object.entries(STATUS_LABEL) as [ContactStatus, string][]).map(([val, label]) => (
                                                            <option key={val} value={val}>{label}</option>
                                                        ))}
                                                    </select>
                                                </DataTableCell>
                                                <DataTableCell>
                                                    <span className="text-xs whitespace-nowrap" style={{ color: 'var(--color-text-alt)' }}>
                                                        {formatDate(sub.created_at)}
                                                    </span>
                                                </DataTableCell>
                                                <DataTableCell>
                                                    <button
                                                        onClick={() => handleDelete(sub.id, sub.email)}
                                                        disabled={deletingId === sub.id}
                                                        className="rounded-lg p-1.5 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 disabled:opacity-40"
                                                        style={{ color: 'var(--color-text-alt)' }}
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </DataTableCell>
                                            </DataTableRow>
                                        );
                                    })
                                )}
                            </DataTableBody>
                        </DataTable>
                    </DataTableScroll>
                )}
            </DataTableShell>

            {totalPages > 1 && (
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    limit={LIMIT}
                    setSearchParams={setSearchParams}
                />
            )}
        </div>
    );
};
