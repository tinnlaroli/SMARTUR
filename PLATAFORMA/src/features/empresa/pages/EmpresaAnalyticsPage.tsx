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
    Clock,
    Lock,
    TrendingDown,
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { empresaApi, type AnalyticsResponse, type EvaluationsResponse } from '../api/empresaApi';
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

function StatusBlocker({ status }: { status: 'pending' | 'suspended' }) {
    const isPending = status === 'pending';
    return (
        <div className="flex flex-1 items-center justify-center">
            <div
                className="flex max-w-sm flex-col items-center gap-4 rounded-[28px] border p-8 text-center shadow-sm"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
            >
                <div
                    className="flex size-14 items-center justify-center rounded-full"
                    style={{ background: isPending ? '#F59E0B18' : '#EF444418' }}
                >
                    <Lock className="size-6" style={{ color: isPending ? '#F59E0B' : '#EF4444' }} />
                </div>
                <div>
                    <p className="font-bold" style={{ color: 'var(--color-text)' }}>
                        {isPending ? 'Empresa en revisión' : 'Empresa suspendida'}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                        {isPending
                            ? 'Analytics se activa una vez que el equipo SMARTUR apruebe tu empresa. Normalmente tarda 24–48 horas.'
                            : 'Tu cuenta ha sido suspendida. Contacta a soporte en soporte@smartur.online para más información.'}
                    </p>
                </div>
            </div>
        </div>
    );
}

export function EmpresaAnalyticsPage() {
    const { t } = useLanguage();
    const [data, setData] = useState<AnalyticsResponse | null>(null);
    const [evals, setEvals] = useState<EvaluationsResponse | null>(null);
    const [companyStatus, setCompanyStatus] = useState<'active' | 'pending' | 'suspended' | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            empresaApi.getAnalytics(),
            empresaApi.getEvaluations(),
            empresaApi.getProfile(),
        ])
            .then(([analyticsRes, evalsRes, profileRes]) => {
                setData(analyticsRes);
                setEvals(evalsRes);
                const s = profileRes.company.status;
                setCompanyStatus(s === 'active' ? 'active' : s === 'suspended' ? 'suspended' : 'pending');
            })
            .catch(() => setError(t('empresa.analytics.errorLoading')))
            .finally(() => setLoading(false));
    }, []);

    const summary = data?.summary;
    const topServicios = data?.top_servicios ?? [];
    const timeline30d = data?.timeline_30d ?? [];
    const evalScore = summary?.evaluacion_score != null ? Number(summary.evaluacion_score) : null;
    const avgRating = summary?.avg_rating != null ? Number(summary.avg_rating).toFixed(1) : '—';
    const hasData = timeline30d.length > 0 || topServicios.length > 0;

    const hasServices = (summary?.total_servicios_activos ?? 0) > 0;
    const hasProfile = true;
    const interactionTotal = useMemo(
        () => timeline30d.reduce((acc, row) => acc + row.interacciones, 0),
        [timeline30d],
    );

    const lastEvalDate = evals?.last_evaluation_at
        ? new Date(evals.last_evaluation_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
        : null;

    if (!loading && companyStatus && companyStatus !== 'active') {
        return (
            <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4">
                <div className="shrink-0">
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                        {t('empresa.analytics.title')}
                    </h1>
                </div>
                <StatusBlocker status={companyStatus} />
            </div>
        );
    }

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
                <div className="grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-5">
                    <KpiCard label={t('empresa.analytics.recomendaciones')} value={summary.total_recomendaciones} icon={TrendingUp} color="#9CCC44" />
                    <KpiCard label={t('empresa.analytics.favoritos')} value={summary.total_favoritos} icon={Star} color="#FF7D1F" />
                    <KpiCard label={t('empresa.analytics.visitas')} value={summary.total_visitas} icon={BarChart3} color="#4DB9CA" />
                    <KpiCard label={t('empresa.analytics.ratingPromedio')} value={avgRating} icon={Award} color="var(--color-purple)" />
                    <KpiCard
                        label="Última evaluación"
                        value={lastEvalDate ?? '—'}
                        icon={Clock}
                        color="#984EFD"
                    />
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
                                                                text={Number(svc.rating).toFixed(1)}
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
                                        {evalScore}/10
                                    </span>
                                </div>
                                <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--color-bg-alt)' }}>
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(evalScore * 10, 100)}%`,
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

                        {/* -- Criterios a mejorar -- */}
                        {evals && evals.weak_criteria.length > 0 && (
                            <div
                                className="rounded-2xl border p-5"
                                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                            >
                                <p className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                    <TrendingDown size={15} style={{ color: '#EF4444' }} />
                                    Criterios a mejorar
                                </p>
                                <div className="space-y-3">
                                    {evals.weak_criteria.map((c) => {
                                        const max = Number(c.max_score) || 4;
                                        const pct = Math.min((Number(c.avg_score) / max) * 100, 100);
                                        const color = pct >= 75 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
                                        return (
                                            <div key={c.criterion_name}>
                                                <div className="mb-1 flex items-center justify-between text-xs">
                                                    <span className="truncate font-medium" style={{ color: 'var(--color-text)' }}>{c.criterion_name}</span>
                                                    <span className="ml-2 shrink-0 font-bold" style={{ color }}>
                                                        {Number(c.avg_score).toFixed(1)}/{max}
                                                    </span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--color-bg-alt)' }}>
                                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* -- Últimas evaluaciones -- */}
                        {evals && evals.recent_evaluations.length > 0 && (
                            <div
                                className="min-h-0 flex-1 overflow-y-auto rounded-2xl border p-5"
                                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                            >
                                <p className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                    Últimas evaluaciones
                                </p>
                                <div className="space-y-2">
                                    {evals.recent_evaluations.slice(0, 5).map((ev) => {
                                        const score = Number(ev.total_score);
                                        const color = score >= 4 ? '#10B981' : score >= 3 ? '#F59E0B' : '#EF4444';
                                        return (
                                            <div
                                                key={ev.id_evaluation}
                                                className="flex items-center gap-3 rounded-xl border px-3 py-2"
                                                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{ev.service_name}</p>
                                                    <p className="text-[11px]" style={{ color: 'var(--color-text-alt)' }}>
                                                        {new Date(ev.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 text-sm font-bold" style={{ color }}>
                                                    {score.toFixed(1)}?
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
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
