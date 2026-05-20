import { useMemo } from 'react';
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
    DataTableRow,
    DataTableScroll,
    DataTableShell,
    TABLE_BADGE_COLORS,
    TableBadge,
} from '../../../components/ui/DataTable';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

export const POIPage = () => {
    const { lang } = useLanguage();
    const m = useMemo(() => getDashboardText(lang).modules, [lang]);
    const { points, isLoading, totalPages } = usePOI();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;

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
                                    <DataTableHeadCell>{m.poi.colName}</DataTableHeadCell>
                                    <DataTableHeadCell>{m.poi.colDescription}</DataTableHeadCell>
                                    <DataTableHeadCell>
                                        <span className="flex items-center gap-1.5">
                                            <Tag className="h-3.5 w-3.5" />
                                            {m.poi.colType}
                                        </span>
                                    </DataTableHeadCell>
                                    <DataTableHeadCell>
                                        <span className="flex items-center gap-1.5">
                                            <Leaf className="h-3.5 w-3.5" />
                                            {m.poi.colSustainable}
                                        </span>
                                    </DataTableHeadCell>
                                </tr>
                            </DataTableHead>
                            <DataTableBody>
                                {isLoading ? (
                                    <TableBodyRows rows={9} colWidths={['w-36', 'flex-1', 'w-24', 'w-24']} />
                                ) : (
                                    points.map((poi, i) => (
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
