import { useEffect, useState, useMemo } from 'react';
import { useContacts } from '../hooks/useContacts';
import { Mail, Globe } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../../../shared/context/ToastContext';
import { useConfirm } from '../../../components/ui/ConfirmModal';
import { SelectionBar } from '../../../components/ui/SelectionBar';
import { MODULE_COLORS } from '../../../shared/config/moduleColors';
import ContactDetailModal from '../components/ContactDetailModal';
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
    TABLE_CHECKBOX_CLASS,
    nextSort,
    sortRows,
} from '../../../components/ui/DataTable';
import type { SortState } from '../../../components/ui/DataTable';
import { TableBodyRows } from '../../../components/ui/TableSkeleton';
import Pagination from '../../users/components/Pagination';
import type { ContactStatus, ContactSubscription } from '../types/types';

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

const STATUS_STYLE: Record<ContactStatus, { bg: string; color: string }> = {
    pending:     { bg: 'rgba(245,158,11,0.12)',  color: '#d97706' },
    in_progress: { bg: 'rgba(6,182,212,0.12)',   color: '#0891b2' },
    done:        { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
    dismissed:   { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' },
};

const STATUS_LABEL: Record<ContactStatus, string> = {
    pending: 'Pendiente',
    in_progress: 'En atención',
    done: 'Resuelto',
    dismissed: 'Descartado',
};

export const ContactsPage = () => {
    const { subscriptions, isLoading, totalPages, totalRecords, fetchSubscriptions, updateStatus, deleteSubscription } = useContacts();
    const [searchParams, setSearchParams] = useSearchParams();
    const toast = useToast();
    const { confirm, modal: confirmModal } = useConfirm();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [detailContact, setDetailContact] = useState<ContactSubscription | null>(null);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [sort, setSort] = useState<SortState | null>(null);
    const handleSort = (key: string) => setSort(prev => nextSort(prev, key));
    const displayData = useMemo(() => sortRows(subscriptions, sort), [subscriptions, sort]);

    const page = Number(searchParams.get('page')) || 1;

    useEffect(() => { fetchSubscriptions(page, LIMIT); }, [page, fetchSubscriptions]);

    const toggleId = (id: number) =>
        setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

    const allSelected = selectedIds.length === subscriptions.length && subscriptions.length > 0;
    const toggleAll = () => {
        if (allSelected) setSelectedIds([]);
        else setSelectedIds(subscriptions.map((s) => s.id));
    };

    const handleStatusChange = async (id: number, status: ContactStatus) => {
        setUpdatingId(id);
        try {
            await updateStatus(id, status);
            if (detailContact?.id === id) {
                setDetailContact((prev) => prev ? { ...prev, status } : prev);
            }
        } catch {
            toast.error('Error', 'No se pudo actualizar el estado.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDeleteSelected = async () => {
        const ok = await confirm({
            title: `Eliminar ${selectedIds.length} contacto(s)`,
            message: 'Esta acción es permanente y no se puede deshacer.',
            confirmLabel: 'Eliminar',
            variant: 'danger',
        });
        if (!ok) return;
        await Promise.all(selectedIds.map((id) => deleteSubscription(id)));
        setSelectedIds([]);
        toast.success('Contactos eliminados', `${selectedIds.length} contacto(s) eliminados.`);
    };

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            {confirmModal}
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                        Contactos & Suscripciones
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        Mensajes capturados desde los formularios de contacto
                    </p>
                </div>
                <span className="rounded-full px-3 py-1 text-sm font-semibold" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                    {totalRecords} registros
                </span>
            </div>

            {/* Info banner */}
            <div className="shrink-0 rounded-xl border px-5 py-4 flex items-start gap-3" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                <Mail className="size-5 mt-0.5 shrink-0" style={{ color: MODULE_COLORS.contacts }} />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>¿Qué son los contactos?</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        Mensajes enviados por visitantes y empresas a través de los formularios de contacto de la plataforma y la landing page.
                        Haz clic en el correo o el mensaje para ver los detalles y cambiar el estado de atención.
                    </p>
                </div>
            </div>

            <SelectionBar
                count={selectedIds.length}
                onDelete={handleDeleteSelected}
                onClear={() => setSelectedIds([])}
            />

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
                                    <DataTableHeadCell className="w-14">
                                        <input type="checkbox" checked={allSelected} onChange={toggleAll} className={TABLE_CHECKBOX_CLASS} />
                                    </DataTableHeadCell>
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
                                </tr>
                            </DataTableHead>
                            <DataTableBody>
                                {isLoading ? (
                                    <TableBodyRows rows={10} colWidths={['w-14', 'w-40', 'w-24', 'flex-1', 'w-24', 'w-28', 'w-28']} />
                                ) : (
                                    displayData.map((sub, i) => {
                                        const reasonKey = sub.reason ?? '';
                                        const statusStyle = STATUS_STYLE[sub.status] ?? STATUS_STYLE.pending;

                                        return (
                                            <DataTableRow
                                                key={sub.id}
                                                index={i}
                                                className="cursor-pointer"
                                                onClick={() => setDetailContact(sub)}
                                            >
                                                <DataTableCell onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(sub.id)}
                                                        onChange={() => toggleId(sub.id)}
                                                        className={TABLE_CHECKBOX_CLASS}
                                                    />
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
                                                        <span className="text-xs leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                                                            {sub.message.length > 70 ? sub.message.slice(0, 70) + '…' : sub.message}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs opacity-40" style={{ color: 'var(--color-text-alt)' }}>—</span>
                                                    )}
                                                </DataTableCell>
                                                <DataTableCell>
                                                    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                                                        {SOURCE_LABEL[sub.source] ?? sub.source}
                                                    </span>
                                                </DataTableCell>
                                                <DataTableCell onClick={(e) => e.stopPropagation()}>
                                                    <select
                                                        value={sub.status}
                                                        disabled={updatingId === sub.id}
                                                        onChange={(e) => handleStatusChange(sub.id, e.target.value as ContactStatus)}
                                                        className="rounded-full border-0 py-0.5 pl-2.5 pr-6 text-xs font-medium outline-none transition-opacity disabled:opacity-50 cursor-pointer appearance-none"
                                                        style={{ background: statusStyle.bg, color: statusStyle.color }}
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
                <Pagination page={page} totalPages={totalPages} limit={LIMIT} setSearchParams={setSearchParams} />
            )}

            {detailContact && (
                <ContactDetailModal
                    contact={detailContact}
                    onClose={() => setDetailContact(null)}
                    onStatusChange={handleStatusChange}
                />
            )}
        </div>
    );
};
