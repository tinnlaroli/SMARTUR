import { useEffect, useState, useCallback } from 'react';
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
    TABLE_CHECKBOX_CLASS,
} from '../../../components/ui/DataTable';

const PAGE_SIZE = 50;
const COLOR = MODULE_COLORS.itineraries;

type Filter = 'all' | 'certified' | 'uncertified';

function formatDate(iso: string) {
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(iso));
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function AdminItinerariesPage() {
    const { success, error } = useToast();
    const navigate = useNavigate();
    const [itineraries, setItineraries] = useState<AdminItinerary[]>([]);
    const [total, setTotal]         = useState(0);
    const [page, setPage]           = useState(0);
    const [filter, setFilter]       = useState<Filter>('all');
    const [loading, setLoading]     = useState(true);
    const [actionId, setActionId]   = useState<number | null>(null);
    const [selected, setSelected]   = useState<number[]>([]);
    const [bulkWorking, setBulkWorking] = useState(false);

    const certifiedParam = filter === 'all' ? null : filter === 'certified';

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

    const handleCertify = async (it: AdminItinerary) => {
        setActionId(it.id_itinerary);
        try {
            if (it.is_certified) {
                await itineraryAdminApi.uncertify(it.id_itinerary);
                success('Certificación eliminada');
            } else {
                await itineraryAdminApi.certify(it.id_itinerary);
                success('Ruta certificada SMARTUR ✓');
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

    const filterBtn = (f: Filter, label: string) => (
        <button
            key={f}
            onClick={() => { setFilter(f); setPage(0); }}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={filter === f
                ? { backgroundColor: COLOR, color: '#fff' }
                : { background: 'var(--color-bg-alt)', color: 'var(--color-text-alt)', border: '1px solid var(--color-border)' }
            }
        >
            {label}
        </button>
    );

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
                className="rounded-xl border px-5 py-4 flex items-start gap-3 shrink-0"
                style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
            >
                <Route className="size-5 mt-0.5 shrink-0" style={{ color: COLOR }} />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>
                        Rutas y certificación SMARTUR
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        Crea rutas oficiales o certifica itinerarios de la comunidad con el sello SMARTUR. Las rutas certificadas aparecen primero en el explorador de la app.
                    </p>
                </div>
            </div>

            {/* Action row */}
            <div className="shrink-0 flex items-center gap-3 flex-wrap">
                <div className="flex gap-2 flex-wrap">
                    {filterBtn('all', 'Todos')}
                    {filterBtn('certified', 'Certificadas')}
                    {filterBtn('uncertified', 'Sin certificar')}
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <AnimatePresence>
                        {selected.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
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

                    <button
                        onClick={load}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                        style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-alt)', border: '1px solid var(--color-border)' }}
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
                            <TableSkeleton rows={10} colWidths={['w-10', 'flex-1', 'w-36', 'w-16', 'w-28', 'w-28']} />
                        ) : itineraries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--color-text-alt)' }}>
                                <Route size={40} style={{ opacity: 0.25 }} />
                                <p className="text-sm">No hay itinerarios en esta vista</p>
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
                                        <DataTableHeadCell>Título</DataTableHeadCell>
                                        <DataTableHeadCell>
                                            <span className="flex items-center gap-1"><Users size={11} /> Autor</span>
                                        </DataTableHeadCell>
                                        <DataTableHeadCell>
                                            <span className="flex items-center gap-1"><Copy size={11} /> Copias</span>
                                        </DataTableHeadCell>
                                        <DataTableHeadCell>Creada</DataTableHeadCell>
                                        <DataTableHeadCell className="text-center">Estado</DataTableHeadCell>
                                    </tr>
                                </DataTableHead>
                                <DataTableBody>
                                    {itineraries.map((it, i) => (
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
                                                        className="font-medium truncate max-w-[240px]"
                                                        style={{ color: 'var(--color-text)' }}
                                                    >
                                                        {it.title}
                                                    </span>
                                                </div>
                                            </DataTableCell>
                                            <DataTableCell>{it.owner_name}</DataTableCell>
                                            <DataTableCell className="text-center">{it.copy_count}</DataTableCell>
                                            <DataTableCell className="text-xs">{formatDate(it.created_at)}</DataTableCell>
                                            <DataTableCell className="text-center">
                                                <div className="flex justify-center">
                                                <button
                                                    onClick={() => handleCertify(it)}
                                                    disabled={actionId === it.id_itinerary}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                            : <><XCircle size={11} /> Certificar</>
                                                    }
                                                </button>
                                                </div>
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

        </div>
    );
}

export default AdminItinerariesPage;
