import { useState, useMemo } from 'react';
import { usePOI } from '../hooks/usePOI';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../../users/components/Pagination';
import { Star, Leaf, Tag, Plus } from 'lucide-react';
import { TableBodyRows } from '../../../components/ui/TableSkeleton';
import { SelectionBar } from '../../../components/ui/SelectionBar';
import { useConfirm } from '../../../components/ui/ConfirmModal';
import { MODULE_COLORS } from '../../../shared/config/moduleColors';
import {
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableHead,
    DataTableHeadCell,
    DataTableHeaderSelect,
    DataTableRow,
    DataTableScroll,
    DataTableShell,
    SortableHeadCell,
    TABLE_BADGE_COLORS,
    TABLE_CHECKBOX_CLASS,
    TableBadge,
    nextSort,
    sortRows,
} from '../../../components/ui/DataTable';
import type { SortState } from '../../../components/ui/DataTable';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import CreatePOIModal from '../components/CreatePOIModal';
import EditPOIModal from '../components/EditPOIModal';
import type { POI } from '../types/types';

export const POIPage = () => {
    const { lang } = useLanguage();
    const m = useMemo(() => getDashboardText(lang).modules, [lang]);
    const { points, isLoading, totalPages, createPoint, updatePoint, deletePoint } = usePOI();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const [sort, setSort] = useState<SortState | null>(null);
    const [sustainableFilter, setSustainableFilter] = useState('');
    const handleSort = (key: string) => setSort(prev => nextSort(prev, key));
    const displayData = useMemo(() => sortRows(points.filter(p => !sustainableFilter || String(p.sustainability) === sustainableFilter), sort), [points, sort, sustainableFilter]);

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editPOI, setEditPOI] = useState<POI | null>(null);
    const { confirm, modal: confirmModal } = useConfirm();

    const toggleId = (id: number) =>
        setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

    const allSelected = selectedIds.length === displayData.length && displayData.length > 0;
    const toggleAll = () => {
        if (allSelected) setSelectedIds([]);
        else setSelectedIds(displayData.map((p) => p.id));
    };

    const handleDeleteSelected = async () => {
        const ok = await confirm({
            title: `Eliminar ${selectedIds.length} punto(s) de interés`,
            message: 'Esta acción es permanente y no se puede deshacer.',
            confirmLabel: 'Eliminar',
            variant: 'danger',
        });
        if (!ok) return;
        await Promise.all(selectedIds.map((id) => deletePoint(id)));
        setSelectedIds([]);
    };

    const handleEditSelected = () => {
        const poi = points.find((p) => p.id === selectedIds[0]);
        if (poi) setEditPOI(poi);
    };

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            {confirmModal}
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                        {m.poi.title}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        {m.poi.subtitle}
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95"
                    style={{ background: MODULE_COLORS.poi }}
                >
                    <Plus className="size-4" />
                    Nuevo POI
                </button>
            </div>

            <SelectionBar
                count={selectedIds.length}
                onDelete={handleDeleteSelected}
                onEdit={handleEditSelected}
                onClear={() => setSelectedIds([])}
            />

            {/* Info banner */}
            <div className="rounded-xl border px-5 py-4 flex items-start gap-3 shrink-0" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                <Star className="size-5 mt-0.5 shrink-0" style={{ color: MODULE_COLORS.poi }} />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>Puntos de Interés</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>Los POIs son atracciones naturales, culturales o históricas que no pertenecen a una empresa. Los turistas los descubren, guardan como favoritos y generan interacciones que alimentan el motor de recomendaciones.</p>
                </div>
            </div>

            <DataTableShell className="h-full">
                {points.length === 0 && !isLoading ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3">
                        <Star className="size-12" style={{ color: 'var(--color-border)' }} />
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-alt)' }}>
                            {m.poi.empty}
                        </p>
                    </div>
                ) : (
                    <DataTableScroll>
                        <DataTable>
                            <DataTableHead>
                                <tr>
                                    <DataTableHeadCell className="w-14">
                                        <input type="checkbox" checked={allSelected} onChange={toggleAll} className={TABLE_CHECKBOX_CLASS} />
                                    </DataTableHeadCell>
                                    <SortableHeadCell sortKey="name" sort={sort} onSort={handleSort}>{m.poi.colName}</SortableHeadCell>
                                    <DataTableHeadCell>{m.poi.colDescription}</DataTableHeadCell>
                                    <SortableHeadCell sortKey="price_level" sort={sort} onSort={handleSort}>
                                        <span className="flex items-center gap-1.5">
                                            <Tag className="h-3.5 w-3.5" />
                                            {m.poi.colType}
                                        </span>
                                    </SortableHeadCell>
                                    <DataTableHeadCell>
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center gap-1.5">
                                                <Leaf className="h-3.5 w-3.5" />
                                                {m.poi.colSustainable}
                                            </span>
                                            <DataTableHeaderSelect value={sustainableFilter} onChange={setSustainableFilter}>
                                                <option value="">Todos</option>
                                                <option value="true">Sostenibles</option>
                                                <option value="false">Estándar</option>
                                            </DataTableHeaderSelect>
                                        </div>
                                    </DataTableHeadCell>
                                </tr>
                            </DataTableHead>
                            <DataTableBody>
                                {isLoading ? (
                                    <TableBodyRows rows={9} colWidths={['w-14', 'w-36', 'flex-1', 'w-24', 'w-24']} />
                                ) : (
                                    displayData.map((poi, i) => (
                                        <DataTableRow
                                            key={poi.id}
                                            index={i}
                                            className="cursor-pointer"
                                            onClick={() => setEditPOI(poi)}
                                        >
                                            <DataTableCell onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(poi.id)}
                                                    onChange={() => toggleId(poi.id)}
                                                    className={TABLE_CHECKBOX_CLASS}
                                                />
                                            </DataTableCell>
                                            <DataTableCell>
                                                <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                                                    {poi.name}
                                                </p>
                                            </DataTableCell>
                                            <DataTableCell className="max-w-sm">
                                                <p className="truncate" title={poi.description}>
                                                    {poi.description || m.poi.noDescription}
                                                </p>
                                            </DataTableCell>
                                            <DataTableCell>
                                                <span
                                                    className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                                                    style={{
                                                        background: 'rgba(var(--rgb-purple-accent),0.12)',
                                                        color: 'var(--color-purple)',
                                                    }}
                                                >
                                                    {poi.typeId}
                                                </span>
                                            </DataTableCell>
                                            <DataTableCell>
                                                {poi.sustainability ? (
                                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TABLE_BADGE_COLORS.emerald}`}>
                                                        <Leaf className="size-3" />
                                                        {m.poi.badgeSustainable}
                                                    </span>
                                                ) : (
                                                    <TableBadge text={m.poi.badgeStandard} color={TABLE_BADGE_COLORS.neutral} />
                                                )}
                                            </DataTableCell>
                                        </DataTableRow>
                                    ))
                                )}
                            </DataTableBody>
                        </DataTable>
                    </DataTableScroll>
                )}
            </DataTableShell>

            {points.length > 0 && (
                <Pagination page={page} limit={limit} totalPages={totalPages} setSearchParams={setSearchParams} />
            )}

            {isCreateOpen && (
                <CreatePOIModal onClose={() => setIsCreateOpen(false)} onSubmit={createPoint} />
            )}
            {editPOI && (
                <EditPOIModal
                    poi={editPOI}
                    onClose={() => setEditPOI(null)}
                    onSubmit={updatePoint}
                />
            )}
        </div>
    );
};
