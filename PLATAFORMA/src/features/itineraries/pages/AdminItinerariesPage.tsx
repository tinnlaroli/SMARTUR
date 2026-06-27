import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Route, CheckCircle, XCircle, RefreshCw, Award, Users, Copy, X, Plus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { itineraryAdminApi, type AdminItinerary } from '../api/itineraryApi';
import { useToast } from '../../../shared/context/ToastContext';
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
    SortableHeadCell,
    DataTableHeaderSelect,
    TABLE_CHECKBOX_CLASS,
    nextSort,
    sortRows,
    type SortState,
} from '../../../components/ui/DataTable';

const PAGE_SIZE = 50;
const COLOR = MODULE_COLORS.itineraries;

type Filter = 'all' | 'certified' | 'uncertified';

function formatDate(iso: string) {
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(iso));
}

export function AdminItinerariesPage() {
    const { success, error } = useToast();
    const navigate = useNavigate();
    const [itineraries, setItineraries] = useState<AdminItinerary[]>([]);
    const [total, setTotal]         = useState(0);
    const [page, setPage]           = useState(0);
    const [filter, setFilter]       = useState<Filter>('all');
    const [sort, setSort]           = useState<SortState | null>(null);
    const [loading, setLoading]     = useState(true);
    const [actionId, setActionId]   = useState<number | null>(null);
    const [selected, setSelected]   = useState<number[]>([]);
    const [bulkWorking, setBulkWorking] = useState(false);

    const certifiedParam = filter === 'all' ? null : filter === 'certified';

    const handleSort = (key: string) => setSort(prev => nextSort(prev, key));

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await itineraryAdminApi.listPublic({
                limit: PAGE_SIZE,
                offset: page * PAGE_SIZE,
                certified: certifiedParam,
            });
            setItineraries(data.itineraries);
            setTotal(data.total);
        } catch {
            error('Error al cargar itinerarios');
        } finally {
            setLoading(false);
        }
    }, [page, certifiedParam]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setSelected([]); }, [page, filter]);

    const displayData = useMemo(() => sortRows(itineraries, sort), [itineraries, sort]);

    const handleCertify = async (it: AdminItinerary) => {
        setActionId(it.id_itinerary);
        try {
            if (it.is_certified) {
                await itineraryAdminApi.uncertify(it.id_itinerary);
                success('Certificación eliminada');
            } else {
                await itineraryAdminApi.certify(it.id_itinerary);
                success('Ruta certificada ✓');
            }
            await load();
        } catch {
            error('Error al actualizar certificación');
        } finally {
            setActionId(null);
        }
    };

    const handleBulkAction = async (certify: boolean) => {
        if (!selected.length) return;
        setBulkWorking(true);
        try {
            await Promise.all(selected.map(id =>
                certify ? itineraryAdminApi.certify(id) : itineraryAdminApi.uncertify(id),
            ));
            success(certify
                ? `${selected.length} ruta(s) certificada(s) ✓`
                : `Certificación eliminada de ${selected.length} ruta(s)`);
            setSelected([]);
            await load();
        } catch {
            error('Error en la operación masiva');
        } finally {
            setBulkWorking(false);
        }
    };

    const allIds      = itineraries.map(it => it.id_itinerary);
    const allSelected = allIds.length > 0 && allIds.every(id => selected.includes(id));
    const toggleAll   = () => setSelected(allSelected ? [] : allIds);
    const toggle      = (id: number) =>
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            {/* Header */}
            <div className="shrink-0">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                    Rutas
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                    {total} rutas públicas
                </p>
            </div>

            {/* Info banner */}
            <div
                className="shrink-0 flex items-start gap-3 rounded-xl border px-5 py-4"
                style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
            >
                <Route className="mt-0.5 size-5 shrink-0" style={{ color: COLOR }} />
                <div>
                    <p className="mb-0.5 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        Rutas y certificación
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        Crea rutas oficiales o certifica itinerarios de la comunidad. Las rutas certificadas aparecen primero en el explorador de la app.
                    </p>
                </div>
            </div>

            {/* Action row — solo bulk + refresh + crear */}
            <div className="shrink-0 flex items-center gap-3">
                <AnimatePresence>
                    {selected.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-2"
                        >
                            <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                {selected.length} seleccionada{selected.length !== 1 ? 's' : ''}
                            </span>
                            <button
                                disabled={bulkWorking}
                                onClick={() => handleBulkAction(true)}
                                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
                                style={{ backgroundColor: COLOR }}
                            >
                                <Award size={12} />
                                Certificar
                            </button>
                            <button
                                disabled={bulkWorking}
                                onClick={() => handleBulkAction(false)}
                                className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80 disabled:opacity-50"
                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                            >
                                <XCircle size={12} />
                                Quitar cert.
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

                <div className="ml-auto flex items-center gap-2">
                    <button
                        onClick={load}
                        className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all hover:opacity-80"
                        style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-alt)', borderColor: 'var(--color-border)' }}
                        title="Actualizar"
                    >
                        <RefreshCw size={14} />
                    </button>

                    <button
                        onClick={() => navigate('/dashboard/itinerarios/nueva')}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95"
                        style={{ background: COLOR }}
                    >
                        <Plus size={16} />
                        Crear ruta
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="flex min-h-0 flex-1 flex-col">
                <DataTableShell className="flex-1">
                    <DataTableScroll>
                        {loading ? (
                            <TableSkeleton rows={10} colWidths={['w-10', 'flex-1', 'w-36', 'w-16', 'w-28', 'w-36']} />
                        ) : itineraries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-20" style={{ color: 'var(--color-text-alt)' }}>
                                <Route size={40} style={{ opacity: 0.25 }} />
                                <p className="text-sm">No hay itinerarios en esta vista</p>
                            </div>
                        ) : (
                            <DataTable>
                                <DataTableHead>
                                    <tr>
                                        {/* Checkbox */}
                                        <DataTableHeadCell className="w-10">
                                            <input
                                                type="checkbox"
                                                className={TABLE_CHECKBOX_CLASS}
                                                checked={allSelected}
                                                onChange={toggleAll}
                                            />
                                        </DataTableHeadCell>

                                        {/* Título — sortable */}
                                        <SortableHeadCell sortKey="title" sort={sort} onSort={handleSort}>
                                            Título
                                        </SortableHeadCell>

                                        {/* Autor — no sortable */}
                                        <DataTableHeadCell>
                                            <span className="flex items-center gap-1">
                                                <Users size={11} /> Autor
                                            </span>
                                        </DataTableHeadCell>

                                        {/* Copias — sortable */}
                                        <SortableHeadCell sortKey="copy_count" sort={sort} onSort={handleSort} className="text-center">
                                            <span className="flex items-center gap-1">
                                                <Copy size={11} /> Copias
                                            </span>
                                        </SortableHeadCell>

                                        {/* Fecha — sortable */}
                                        <SortableHeadCell sortKey="created_at" sort={sort} onSort={handleSort}>
                                            Creada
                                        </SortableHeadCell>

                                        {/* Estado — filtrable con select en cabecera */}
                                        <DataTableHeadCell className="text-center">
                                            <span className="flex items-center justify-center gap-1.5">
                                                Estado
                                                <DataTableHeaderSelect
                                                    value={filter}
                                                    onChange={(v) => { setFilter(v as Filter); setPage(0); }}
                                                >
                                                    <option value="all">Todos</option>
                                                    <option value="certified">Certificadas</option>
                                                    <option value="uncertified">Sin certificar</option>
                                                </DataTableHeaderSelect>
                                            </span>
                                        </DataTableHeadCell>
                                    </tr>
                                </DataTableHead>

                                <DataTableBody>
                                    {displayData.map((it, i) => (
                                        <DataTableRow key={it.id_itinerary} index={i}>
                                            <DataTableCell className="w-10">
                                                <input
                                                    type="checkbox"
                                                    className={TABLE_CHECKBOX_CLASS}
                                                    checked={selected.includes(it.id_itinerary)}
                                                    onChange={() => toggle(it.id_itinerary)}
                                                />
                                            </DataTableCell>

                                            <DataTableCell>
                                                <div className="flex items-center gap-2">
                                                    {it.is_certified && (
                                                        <Award size={13} className="shrink-0" style={{ color: COLOR }} />
                                                    )}
                                                    <span
                                                        className="max-w-[240px] truncate font-medium"
                                                        style={{ color: 'var(--color-text)' }}
                                                    >
                                                        {it.title}
                                                    </span>
                                                </div>
                                            </DataTableCell>

                                            <DataTableCell>{it.owner_name}</DataTableCell>

                                            <DataTableCell className="text-center">
                                                {it.copy_count}
                                            </DataTableCell>

                                            <DataTableCell className="text-xs">
                                                {formatDate(it.created_at)}
                                            </DataTableCell>

                                            {/* Estado — botón centrado */}
                                            <DataTableCell className="text-center">
                                                <button
                                                    onClick={() => handleCertify(it)}
                                                    disabled={actionId === it.id_itinerary}
                                                    className="inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
                                                    style={it.is_certified
                                                        ? { backgroundColor: COLOR, color: '#fff' }
                                                        : { border: '1px solid var(--color-border)', color: 'var(--color-text-alt)' }
                                                    }
                                                    title={it.is_certified ? 'Quitar certificación' : 'Certificar ruta'}
                                                >
                                                    {actionId === it.id_itinerary
                                                        ? <Loader2 size={11} className="animate-spin" />
                                                        : it.is_certified
                                                            ? <><CheckCircle size={11} /> Certificada</>
                                                            : <><Award size={11} /> Certificar</>
                                                    }
                                                </button>
                                            </DataTableCell>
                                        </DataTableRow>
                                    ))}
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
                        className="rounded-lg px-3 py-1.5 text-sm transition-colors hover:opacity-80 disabled:opacity-40"
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
                        className="rounded-lg px-3 py-1.5 text-sm transition-colors hover:opacity-80 disabled:opacity-40"
                        style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-alt)' }}
                    >
                        Siguiente →
                    </button>
                </div>
            )}
        </div>
    );
}

export default AdminItinerariesPage;
