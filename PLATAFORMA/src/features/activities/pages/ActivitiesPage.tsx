import { useState, useMemo, useEffect } from 'react';
import { useActivities } from '../hooks/useActivities';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../../users/components/Pagination';
import SearchInput from '../../users/components/SearchInput';
import { Activity, DollarSign, Plus } from 'lucide-react';
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
    DataTableRow,
    DataTableScroll,
    DataTableShell,
    SortableHeadCell,
    TABLE_CHECKBOX_CLASS,
    nextSort,
    sortRows,
} from '../../../components/ui/DataTable';
import type { SortState } from '../../../components/ui/DataTable';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import CreateActivityModal from '../components/CreateActivityModal';
import EditActivityModal from '../components/EditActivityModal';
import type { Activity as ActivityType } from '../types/types';
import { companyServices } from '../../companies/api/companyApi';
import type { Company } from '../../companies/types/types';

const ImpactBadge = ({
    value,
    type,
    lowEnv,
    lowSocial,
}: {
    value: string;
    type: 'env' | 'social';
    lowEnv: string;
    lowSocial: string;
}) => {
    const low =
        type === 'env'
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    const high = 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
    const isHigh = ['alto', 'high', 'negativo', 'negative'].includes(value?.toLowerCase() ?? '');
    return (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${isHigh ? high : low}`}>
            {value || (type === 'env' ? lowEnv : lowSocial)}
        </span>
    );
};

export const ActivitiesPage = () => {
    const { lang, t } = useLanguage();
    const m = useMemo(() => getDashboardText(lang).modules, [lang]);
    const { activities, isLoading, totalPages, search: urlSearch, setSearch, createActivity, updateActivity, deleteActivity } = useActivities();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const [searchTerm, setSearchTerm] = useState(urlSearch);
    const [sort, setSort] = useState<SortState | null>(null);
    const handleSort = (key: string) => setSort(prev => nextSort(prev, key));
    const displayData = useMemo(() => sortRows(activities, sort), [activities, sort]);

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editActivity, setEditActivity] = useState<ActivityType | null>(null);
    const { confirm, modal: confirmModal } = useConfirm();

    useEffect(() => { if (urlSearch !== searchTerm) setSearchTerm(urlSearch); }, [urlSearch]);
    useEffect(() => {
        const t = setTimeout(() => { if (searchTerm !== urlSearch) setSearch(searchTerm); }, 500);
        return () => clearTimeout(t);
    }, [searchTerm, urlSearch, setSearch]);

    const [companies, setCompanies] = useState<Company[]>([]);
    useEffect(() => {
        companyServices.findAll(1, 200).then((res) => setCompanies(res.companies)).catch(() => {});
    }, []);

    const getCompanyName = (id: number) => companies.find((c) => c.id === id)?.name ?? `#${id}`;

    const toggleId = (id: number) =>
        setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

    const allSelected = selectedIds.length === activities.length && activities.length > 0;
    const toggleAll = () => {
        if (allSelected) setSelectedIds([]);
        else setSelectedIds(activities.map((a) => a.id));
    };

    const handleDeleteSelected = async () => {
        const ok = await confirm({
            title: m.common.confirmDeleteActivities(selectedIds.length),
            message: m.common.confirmDeleteActivitiesMsg(selectedIds.length),
            confirmLabel: m.common.delete,
            variant: 'danger',
        });
        if (!ok) return;
        await Promise.all(selectedIds.map((id) => deleteActivity(id)));
        setSelectedIds([]);
    };

    const handleEditSelected = () => {
        const act = activities.find((a) => a.id === selectedIds[0]);
        if (act) setEditActivity(act);
    };

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            {confirmModal}
            {/* Header */}
            <div className="shrink-0">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                    {m.activities.title}
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                    {m.activities.subtitle}
                </p>
            </div>

            {/* Info banner */}
            <div className="rounded-xl border px-5 py-4 flex items-start gap-3 shrink-0" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                <Activity className="size-5 mt-0.5 shrink-0" style={{ color: MODULE_COLORS.activities }} />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>{m.activities.bannerTitle}</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>{m.activities.bannerDescription}</p>
                </div>
            </div>

            {/* Action row */}
            <div className="flex items-center gap-3 shrink-0">
                <SelectionBar
                    count={selectedIds.length}
                    onDelete={handleDeleteSelected}
                    onEdit={handleEditSelected}
                    onClear={() => setSelectedIds([])}
                />
                <div className="ml-auto flex items-center gap-2">
                    <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder={m.activities.searchPlaceholder} />
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95"
                        style={{ background: MODULE_COLORS.activities }}
                    >
                        <Plus className="size-4" />
                        {t('activity.newButton')}
                    </button>
                </div>
            </div>

            <DataTableShell className="h-full">
                {activities.length === 0 && !isLoading ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3">
                        <Activity className="size-12" style={{ color: 'var(--color-border)' }} />
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-alt)' }}>
                            {m.activities.empty}
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
                                    <DataTableHeadCell>{m.activities.colCompany}</DataTableHeadCell>
                                    <SortableHeadCell sortKey="production_value" sort={sort} onSort={handleSort}>
                                        <span className="flex items-center gap-1.5">
                                            <DollarSign className="h-3.5 w-3.5" />
                                            {m.activities.colProduction}
                                        </span>
                                    </SortableHeadCell>
                                    <SortableHeadCell sortKey="environmental_impact" sort={sort} onSort={handleSort}>{m.activities.colEnvImpact}</SortableHeadCell>
                                    <SortableHeadCell sortKey="social_impact" sort={sort} onSort={handleSort}>{m.activities.colSocialImpact}</SortableHeadCell>
                                </tr>
                            </DataTableHead>
                            <DataTableBody>
                                {isLoading ? (
                                    <TableBodyRows rows={9} colWidths={['w-14', 'flex-1', 'w-28', 'w-28', 'w-28']} />
                                ) : (
                                    displayData.map((activity, i) => (
                                        <DataTableRow
                                            key={activity.id}
                                            index={i}
                                            className="cursor-pointer"
                                            onClick={() => setEditActivity(activity)}
                                        >
                                            <DataTableCell onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(activity.id)}
                                                    onChange={() => toggleId(activity.id)}
                                                    className={TABLE_CHECKBOX_CLASS}
                                                />
                                            </DataTableCell>
                                            <DataTableCell>
                                                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                                                    {getCompanyName(activity.company)}
                                                </span>
                                            </DataTableCell>
                                            <DataTableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                                                ${Number(activity.production_value).toLocaleString(lang === 'es' ? 'es-MX' : lang === 'fr' ? 'fr-FR' : 'en-US')}
                                            </DataTableCell>
                                            <DataTableCell>
                                                <ImpactBadge value={activity.environmental_impact ?? ''} type="env" lowEnv={m.activities.impactLowEnv} lowSocial={m.activities.impactLowSocial} />
                                            </DataTableCell>
                                            <DataTableCell>
                                                <ImpactBadge value={activity.social_impact ?? ''} type="social" lowEnv={m.activities.impactLowEnv} lowSocial={m.activities.impactLowSocial} />
                                            </DataTableCell>
                                        </DataTableRow>
                                    ))
                                )}
                            </DataTableBody>
                        </DataTable>
                    </DataTableScroll>
                )}
            </DataTableShell>

            {activities.length > 0 && (
                <Pagination page={page} limit={limit} totalPages={totalPages} setSearchParams={setSearchParams} />
            )}

            {isCreateOpen && (
                <CreateActivityModal onClose={() => setIsCreateOpen(false)} onSubmit={createActivity} />
            )}
            {editActivity && (
                <EditActivityModal
                    activity={editActivity}
                    onClose={() => setEditActivity(null)}
                    onSubmit={updateActivity}
                />
            )}
        </div>
    );
};
