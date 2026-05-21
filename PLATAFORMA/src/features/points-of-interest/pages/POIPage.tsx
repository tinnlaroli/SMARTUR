import { useState, useMemo } from 'react';
import { usePOI } from '../hooks/usePOI';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../../users/components/Pagination';
import { Star, Leaf, Tag } from 'lucide-react';
import { TableBodyRows } from '../../../components/ui/TableSkeleton';
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
    TableBadge,
    nextSort,
    sortRows,
} from '../../../components/ui/DataTable';
import type { SortState } from '../../../components/ui/DataTable';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

export const POIPage = () => {
    const { lang } = useLanguage();
    const m = useMemo(() => getDashboardText(lang).modules, [lang]);
    const { points, isLoading, totalPages } = usePOI();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const [sort, setSort] = useState<SortState | null>(null);
    const [sustainableFilter, setSustainableFilter] = useState('');
    const handleSort = (key: string) => setSort(prev => nextSort(prev, key));
    const displayData = useMemo(() => sortRows(points.filter(p => !sustainableFilter || String(p.sustainability) === sustainableFilter), sort), [points, sort, sustainableFilter]);

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            <div className="flex items-center gap-3 shrink-0">
                <div className="flex size-10 items-center justify-center rounded-xl" style={{ background: 'var(--color-pink)' }}>
                    <Star className="size-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                        {m.poi.title}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        {m.poi.subtitle}
                    </p>
                </div>
            </div>

            {/* Info banner */}
            <div className="rounded-xl border px-5 py-4 flex items-start gap-3 shrink-0" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                <Star className="size-5 mt-0.5 shrink-0" style={{ color: 'var(--color-purple)' }} />
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
                                    <TableBodyRows rows={9} colWidths={['w-36', 'flex-1', 'w-24', 'w-24']} />
                                ) : (
                                    displayData.map((poi, i) => (
                                        <DataTableRow key={poi.id} index={i}>
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
        </div>
    );
};
