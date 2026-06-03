import { useEffect, useMemo, useState, type CSSProperties, type ComponentType } from 'react';
import {
    TrendingUp,
    Star,
    BarChart3,
    Award,
    AlertCircle,
    Activity,
    CheckCircle2,
    Circle,
    ArrowRight,
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { empresaApi, type AnalyticsResponse } from '../api/empresaApi';
import { MODULE_COLORS } from '../../../shared/config/moduleColors';
import { DATA_TABLE_SHELL_CLASS, TableBadge, TABLE_BADGE_COLORS } from '../../../components/ui/DataTable';
import {
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableHead,
    DataTableHeadCell,
    DataTableRow,
    DataTableScroll,
    DataTableShell,
} from '../../../components/ui/DataTable';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { useLanguage } from '../../../contexts/LanguageContext';

function KpiCard({
    label, value, icon: Icon, color,
}: {
    label: string;
    value: string | number;
    icon: ComponentType<{ size?: number; style?: CSSProperties }>;
    color: string;
}) {
    return (
        <div
            className="rounded-2xl border p-5"
            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
        >
            <div className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}1a` }}>
                <Icon size={20} style={{ color }} />
            </div>
            <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {value === null || value === undefined ? '—' : String(value)}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>{label}</p>
                </div>
            </div>
        </div>
    );
}

export function EmpresaAnalyticsPage() {
    const { t } = useLanguage();
    const [data, setData] = useState<AnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        empresaApi.getAnalytics()
            .then(setData)
            .catch(() => setError(t('empresa.analytics.errorLoading')))
            .finally(() => setLoading(false));
    }, []);

    const summary = data?.summary;
    const topServicios = data?.top_servicios ?? [];
    const timeline30d = data?.timeline_30d ?? [];
    const evalScore = summary?.evaluacion_score != null ? Number(summary.evaluacion_score) : null;
    const avgRating = summary?.avg_rating != null ? Number(summary.avg_rating).toFixed(1) : '—';
    const hasData = timeline30d.length > 0 || topServicios.length > 0;

    const hasServices = (summary?.total_services ?? 0) > 0;
    const hasProfile = true; // profile exists if they reached this page
    const interactionTotal = useMemo(
        () => timeline30d.reduce((acc, row) => acc + row.interacciones, 0),
        [timeline30d],
    );

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            <div className="shrink-0">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                    {t('empresa.analytics.title')}
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                    {t('empresa.analytics.description')}
                </p>
            </div>

            <div
                className="flex shrink-0 items-start gap-3 rounded-xl border px-5 py-4"
                style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
            >
                <Activity className="mt-0.5 size-5 shrink-0" style={{ color: MODULE_COLORS.services }} />
                <div>
                    <p className="mb-0.5 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        {t('empresa.analytics.badgeTitle')}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        {t('empresa.analytics.badgeDescription')}
                    </p>
                </div>
            </div>

            {loading && (
                <div className="grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-24 animate-pulse rounded-2xl border"
                            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                        />
                    ))}
                </div>
            )}

            {!loading && !error && summary && (
                <div className="grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-4">
                    <KpiCard label={t('empresa.analytics.recomendaciones')} value={summary.total_recomendaciones} icon={TrendingUp} color="#9CCC44" />
                    <KpiCard label={t('empresa.analytics.favoritos')} value={summary.total_favoritos} icon={Star} color="#FF7D1F" />
                    <KpiCard label={t('empresa.analytics.visitas')} value={summary.total_visitas} icon={BarChart3} color="#4DB9CA" />
                    <KpiCard label={t('empresa.analytics.ratingPromedio')} value={avgRating} icon={Award} color="var(--color-purple)" />
                </div>
            )}

            {error && !loading && (
                <div className={`${DATA_TABLE_SHELL_CLASS} flex flex-1 flex-col items-center justify-center gap-3`}>
                    <AlertCircle className="size-8 text-rose-400" />
                    <p className="text-sm font-medium text-rose-500">{error}</p>
                </div>
            )}

            {!loading && !error && !hasData && (
                <div
                    className="flex flex-col gap-4 rounded-2xl border p-6"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                >
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl" style={{ background: `${MODULE_COLORS.services}18` }}>
                            <BarChart3 size={20} style={{ color: MODULE_COLORS.services }} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                {t('empresa.analytics.noDataTitle')}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                {t('empresa.analytics.noDataDescription')}
                            </p>
                        </div>
                    </div>

                    {/* Onboarding checklist */}
                    <div className="flex flex-col gap-2 rounded-xl p-4" style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-alt)' }}>
                            Próximos pasos
                        </p>
                        {[
                            { done: hasProfile, label: 'Completa tu perfil de empresa', href: '/empresa/perfil' },
                            { done: hasServices, label: 'Agrega al menos un servicio', href: '/empresa/servicios' },
                            { done: false, label: 'Los turistas descubrirán tu empresa en la app SMARTUR (puede tomar unos días)', href: null },
                        ].map((step, i) => (
                            <div key={i} className="flex items-start gap-3">
                                {step.done
                                    ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: '#10B981' }} />
                                    : <Circle size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--color-border)' }} />
                                }
                                <div className="flex-1">
                                    <span className="text-xs" style={{ color: step.done ? 'var(--color-text-alt)' : 'var(--color-text)', textDecoration: step.done ? 'line-through' : 'none' }}>
                                        {step.label}
                                    </span>
                                </div>
                                {step.href && !step.done && (
                                    <a href={step.href} className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--color-purple)' }}>
                                        Ir <ArrowRight size={10} />
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!loading && !error && hasData && (
                <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-5">
                    <div className="flex min-h-0 flex-col gap-4 xl:col-span-3">
                        <div
                            className="rounded-2xl border p-5"
                            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                        >
                            <p className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                {t('empresa.analytics.interactions30d')}
                            </p>
                            {timeline30d.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={timeline30d} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                                        <defs>
                                            <linearGradient id="grad_emp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={MODULE_COLORS.services} stopOpacity={0.25} />
                                                <stop offset="95%" stopColor={MODULE_COLORS.services} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--rgb-text), 0.08)" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fill: 'var(--color-text-alt)', fontSize: 10 }}
                                            tickFormatter={(v: string) => v.slice(5)}
                                        />
                                        <YAxis tick={{ fill: 'var(--color-text-alt)', fontSize: 10 }} />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'var(--color-bg-alt)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 12,
                                            }}
                                            labelStyle={{ color: 'var(--color-text-alt)', fontSize: 11 }}
                                            itemStyle={{ color: MODULE_COLORS.services }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="interacciones"
                                            stroke={MODULE_COLORS.services}
                                            strokeWidth={2}
                                            fill="url(#grad_emp)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                    {t('empresa.analytics.noActivityChart')}
                                </p>
                            )}
                        </div>

                        <DataTableShell className="h-full">
                            {topServicios.length === 0 ? (
                                <div className="flex h-full items-center justify-center p-6 text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                    {t('empresa.analytics.noEngagementServices')}
                                </div>
                            ) : (
                                <DataTableScroll>
                                    <DataTable>
                                        <DataTableHead>
                                            <tr>
                                                <DataTableHeadCell className="w-14">{t('empresa.analytics.tableNum')}</DataTableHeadCell>
                                                <DataTableHeadCell>{t('empresa.analytics.tableServicio')}</DataTableHeadCell>
                                                <DataTableHeadCell className="w-28">{t('empresa.analytics.tableFavoritos')}</DataTableHeadCell>
                                                <DataTableHeadCell className="w-24">{t('empresa.analytics.tableVisitas')}</DataTableHeadCell>
                                                <DataTableHeadCell className="w-24">{t('empresa.analytics.tableRating')}</DataTableHeadCell>
                                                <DataTableHeadCell className="w-36">{t('empresa.analytics.tableRecomendaciones')}</DataTableHeadCell>
                                            </tr>
                                        </DataTableHead>
                                        <DataTableBody>
                                            {topServicios.map((svc, index) => (
                                                <DataTableRow key={svc.id_service} index={index}>
                                                    <DataTableCell className="w-14">
                                                        <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                                                            {index + 1}
                                                        </span>
                                                    </DataTableCell>
                                                    <DataTableCell>
                                                        <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                                            {svc.name}
                                                        </span>
                                                    </DataTableCell>
                                                    <DataTableCell className="w-28">{svc.favorites}</DataTableCell>
                                                    <DataTableCell className="w-24">{svc.visits}</DataTableCell>
                                                    <DataTableCell className="w-24">
                                                        {svc.rating != null ? (
                                                            <TableBadge
                                                                text={svc.rating.toFixed(1)}
                                                                color={TABLE_BADGE_COLORS.amber}
                                                            />
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </DataTableCell>
                                                    <DataTableCell className="w-36">{svc.recomendaciones}</DataTableCell>
                                                </DataTableRow>
                                            ))}
                                        </DataTableBody>
                                    </DataTable>
                                </DataTableScroll>
                            )}
                        </DataTableShell>
                    </div>

                    <div className="flex min-h-0 flex-col gap-4 xl:col-span-2">
                        <div
                            className="rounded-2xl border p-5"
                            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                        >
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                {t('empresa.analytics.executiveSummary')}
                            </p>
                            <div className="mt-4 space-y-3 text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                <p>
                                    {t('empresa.analytics.interactions30d')}{' '}
                                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                                        {interactionTotal}
                                    </span>
                                </p>
                                <p>
                                    {t('empresa.analytics.activeServices')}{' '}
                                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                                        {summary?.total_servicios_activos ?? 0}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {evalScore !== null ? (
                            <div
                                className="rounded-2xl border p-5"
                                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                        <Award size={15} style={{ color: MODULE_COLORS.services }} />
                                        {t('empresa.analytics.qualityTitle')}
                                    </p>
                                    <span className="font-bold" style={{ color: MODULE_COLORS.services }}>
                                        {evalScore}/100
                                    </span>
                                </div>
                                <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--color-bg-alt)' }}>
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(evalScore, 100)}%`,
                                            background: `linear-gradient(90deg, ${MODULE_COLORS.services}, var(--color-orange))`,
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div
                                className="rounded-2xl border p-5 text-sm"
                                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                            >
                                {t('empresa.analytics.noQualityScore')}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {loading && (
                <div className="min-h-0 flex-1">
                    <div className={`${DATA_TABLE_SHELL_CLASS} h-full`}>
                        <TableSkeleton rows={8} colWidths={['w-14', 'flex-1', 'w-28', 'w-24', 'w-24', 'w-36']} />
                    </div>
                </div>
            )}
        </div>
    );
}
