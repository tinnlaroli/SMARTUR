import { useMemo } from 'react';
import { useActivities } from '../hooks/useActivities';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../../users/components/Pagination';
import { Activity, DollarSign } from 'lucide-react';
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
    TableOrderBadge,
} from '../../../components/ui/DataTable';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

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
    const { lang } = useLanguage();
    const m = useMemo(() => getDashboardText(lang).modules, [lang]);
    const { activities, isLoading, totalPages } = useActivities();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            <div className="flex items-center gap-3 shrink-0">
                <div className="flex size-10 items-center justify-center rounded-xl" style={{ background: 'var(--color-green)' }}>
                    <Activity className="size-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                        {m.activities.title}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        {m.activities.subtitle}
                    </p>
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
                                    <DataTableHeadCell>{m.activities.colOrder}</DataTableHeadCell>
                                    <DataTableHeadCell>{m.activities.colCompany}</DataTableHeadCell>
                                    <DataTableHeadCell>
                                        <span className="flex items-center gap-1.5">
                                            <DollarSign className="h-3.5 w-3.5" />
                                            {m.activities.colProduction}
                                        </span>
                                    </DataTableHeadCell>
                                    <DataTableHeadCell>{m.activities.colEnvImpact}</DataTableHeadCell>
                                    <DataTableHeadCell>{m.activities.colSocialImpact}</DataTableHeadCell>
                                </tr>
                            </DataTableHead>
                            <DataTableBody>
                                {isLoading ? (
                                    <TableBodyRows rows={9} colWidths={['w-7', 'flex-1', 'w-28', 'w-28', 'w-28']} />
                                ) : (
                                    activities.map((activity, i) => {
                                        const rowNumber = (page - 1) * limit + i + 1;

                                        return (
                                            <DataTableRow key={activity.id} index={i}>
                                                <DataTableCell>
                                                    <TableOrderBadge accent="var(--color-green)">{rowNumber}</TableOrderBadge>
                                                </DataTableCell>
                                                <DataTableCell>
                                                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                                                        {activity.company}
                                                    </span>
                                                </DataTableCell>
                                                <DataTableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                                                    ${Number(activity.production_value).toLocaleString(lang === 'es' ? 'es-MX' : lang === 'fr' ? 'fr-FR' : 'en-US')}
                                                </DataTableCell>
                                                <DataTableCell>
                                                    <ImpactBadge
                                                        value={activity.environmental_impact}
                                                        type="env"
                                                        lowEnv={m.activities.impactLowEnv}
                                                        lowSocial={m.activities.impactLowSocial}
                                                    />
                                                </DataTableCell>
                                                <DataTableCell>
                                                    <ImpactBadge
                                                        value={activity.social_impact}
                                                        type="social"
                                                        lowEnv={m.activities.impactLowEnv}
                                                        lowSocial={m.activities.impactLowSocial}
                                                    />
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

            {activities.length > 0 && (
                <Pagination page={page} limit={limit} totalPages={totalPages} setSearchParams={setSearchParams} />
            )}
        </div>
    );
};
