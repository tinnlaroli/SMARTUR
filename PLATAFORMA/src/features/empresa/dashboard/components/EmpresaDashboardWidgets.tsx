import {
    AlertCircle,
    ArrowRight,
    Award,
    BarChart3,
    Building2,
    Gauge,
    Star,
    TrendingUp,
    Wrench,
} from 'lucide-react';
import { useEffect, useState, type ElementType, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { EmpresaProfile } from '../../api/empresaApi';
import { DASHBOARD_COLORS } from '../../../home/utils/dashboard';
import {
    EMPRESA_METRIC_COLORS,
    type EmpresaDashboardMetric,
    type EmpresaDashboardViewModel,
    type EmpresaDensityMode,
    type EmpresaTopServiceItem,
    type EmpresaTrendPoint,
} from '../utils/empresaDashboard';
import { useLanguage } from '../../../../contexts/LanguageContext';

const cardSurface = {
    background: 'var(--color-bg)',
    borderColor: 'var(--color-border)',
} as const;

const cardPadding = (density: EmpresaDensityMode) => (density === 'compact' ? 'p-4' : 'p-5');

const formatCardClassName = (density: EmpresaDensityMode) =>
    `rounded-[28px] border ${cardPadding(density)} shadow-[0_10px_35px_rgba(15,23,42,0.06)] overflow-hidden`;

const TONE_STYLES: Record<EmpresaDashboardMetric['tone'], { accent: string; glow: string }> = {
    primary: { accent: DASHBOARD_COLORS.purple, glow: `${DASHBOARD_COLORS.purple}20` },
    success: { accent: DASHBOARD_COLORS.success, glow: `${DASHBOARD_COLORS.success}1a` },
    warning: { accent: DASHBOARD_COLORS.warning, glow: `${DASHBOARD_COLORS.warning}1a` },
    neutral: { accent: DASHBOARD_COLORS.cyan, glow: `${DASHBOARD_COLORS.cyan}1a` },
};

const METRIC_META: Record<EmpresaDashboardMetric['id'], { icon: ElementType }> = {
    recomendaciones: { icon: TrendingUp },
    favoritos: { icon: Star },
    visitas: { icon: BarChart3 },
    serviciosActivos: { icon: Wrench },
};

const useCountUp = (target: number, decimals: number, duration = 1100) => {
    const [value, setValue] = useState(0);

    useEffect(() => {
        let frame = 0;
        const start = performance.now();

        const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(target * eased);
            if (progress < 1) frame = requestAnimationFrame(tick);
        };

        setValue(0);
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [decimals, duration, target]);

    return Number(value.toFixed(decimals));
};

const AnimatedMetricValue = ({
    metric,
    delayMs = 0,
}: {
    metric: EmpresaDashboardMetric;
    delayMs?: number;
}) => {
    const animatedValue = useCountUp(metric.numericValue, metric.decimals, 1100 + delayMs);
    return <>{animatedValue.toLocaleString('es-MX', { maximumFractionDigits: metric.decimals })}</>;
};

const PanelCard = ({
    density,
    title,
    subtitle,
    icon: Icon,
    children,
    footer,
}: {
    density: EmpresaDensityMode;
    title: string;
    subtitle: string;
    icon: ElementType;
    children: ReactNode;
    footer?: ReactNode;
}) => (
    <section
        className={`${formatCardClassName(density)} flex h-full min-h-0 flex-col sy-fade-up`}
        style={cardSurface}
    >
        <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-2xl"
                        style={{ background: `${DASHBOARD_COLORS.purple}16` }}
                    >
                        <Icon className="size-4" style={{ color: DASHBOARD_COLORS.purple }} />
                    </div>
                    <div className="min-w-0">
                        <h2 className="truncate text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                            {title}
                        </h2>
                        <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                            {subtitle}
                        </p>
                    </div>
                </div>
            </div>
            {footer}
        </div>
        <div className="min-h-0 flex-1">{children}</div>
    </section>
);

const EmptyState = ({ message }: { message: string }) => (
    <div
        className="flex h-full items-center justify-center rounded-2xl border border-dashed p-4 text-center"
        style={{ borderColor: 'var(--color-border)' }}
    >
        <p className="max-w-xs text-sm" style={{ color: 'var(--color-text-alt)' }}>
            {message}
        </p>
    </div>
);

export const EmpresaKpiStrip = ({
    metrics,
    density,
}: {
    metrics: EmpresaDashboardMetric[];
    density: EmpresaDensityMode;
}) => (
    <div className="grid shrink-0 grid-cols-12 gap-4">
        {metrics.map((metric, index) => {
            const meta = METRIC_META[metric.id];
            const tone = TONE_STYLES[metric.tone];
            const Icon = meta.icon;
            const delayClass = index < 4 ? `sy-fade-up-${(index + 1) as 1 | 2 | 3 | 4}` : '';

            return (
                <article
                    key={metric.id}
                    className={`col-span-12 md:col-span-6 xl:col-span-3 ${formatCardClassName(density)} sy-fade-up ${delayClass}`}
                    style={cardSurface}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p
                                className="text-[11px] font-bold uppercase tracking-[0.22em]"
                                style={{ color: 'var(--color-text-alt)' }}
                            >
                                KPI
                            </p>
                            <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                {metric.label}
                            </p>
                        </div>
                        <div
                            className="flex size-10 shrink-0 items-center justify-center rounded-2xl"
                            style={{ background: tone.glow }}
                        >
                            <Icon className="h-4.5 w-4.5" style={{ color: tone.accent }} />
                        </div>
                    </div>

                    <p
                        className={`${density === 'compact' ? 'mt-4' : 'mt-5'} text-[2rem] font-bold leading-none tracking-tight`}
                        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
                    >
                        <AnimatedMetricValue metric={metric} delayMs={index * 90} />
                    </p>

                    <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                        {metric.helper}
                    </p>

                    <div className="mt-4 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--color-bg-alt)' }}>
                        <div
                            className={`h-full rounded-full sy-bar-fill sy-bar-fill-${(index + 1) as 1 | 2 | 3 | 4}`}
                            style={{ background: EMPRESA_METRIC_COLORS[metric.id] }}
                        />
                    </div>
                </article>
            );
        })}
    </div>
);

export const EmpresaEngagementTrendCard = ({
    data,
    summary,
    insights,
    density,
}: {
    data: EmpresaTrendPoint[];
    summary: string;
    insights: Array<{ label: string; value: string }>;
    density: EmpresaDensityMode;
}) => {
    const { t } = useLanguage();
    return (
    <PanelCard density={density} title={t('empresa.dashboard.engagementTrendTitle')} subtitle={summary} icon={BarChart3}>
        {data.length === 0 ? (
            <EmptyState message={t('empresa.dashboard.engagementTrendEmpty')} />
        ) : (
            <div className="flex h-full min-h-0 flex-col gap-4">
                <div className="grid shrink-0 gap-2 lg:grid-cols-2">
                    {insights.map((insight) => (
                        <div
                            key={insight.label}
                            className="rounded-2xl border px-3 py-2"
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
                        >
                            <p
                                className="text-[11px] font-bold uppercase tracking-[0.18em]"
                                style={{ color: 'var(--color-text-alt)' }}
                            >
                                {insight.label}
                            </p>
                            <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                {insight.value}
                            </p>
                        </div>
                    ))}
                </div>

                <div
                    className="min-h-0 flex-1 overflow-hidden rounded-[24px] border p-2"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="empresaTrendGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={DASHBOARD_COLORS.orange} stopOpacity={0.28} />
                                    <stop offset="95%" stopColor={DASHBOARD_COLORS.orange} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.16)" />
                            <XAxis
                                dataKey="label"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'var(--color-text-alt)', fontSize: density === 'compact' ? 10 : 11 }}
                            />
                            <YAxis
                                width={36}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'var(--color-text-alt)', fontSize: density === 'compact' ? 10 : 11 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(var(--rgb-text), 0.03)' }}
                                contentStyle={{
                                    background: 'var(--color-bg)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 16,
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="interacciones"
                                stroke={DASHBOARD_COLORS.orange}
                                strokeWidth={2}
                                fill="url(#empresaTrendGrad)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}
    </PanelCard>
    );
};

export const EmpresaTopServicesCard = ({
    services,
    summary,
    density,
}: {
    services: EmpresaTopServiceItem[];
    summary: string;
    density: EmpresaDensityMode;
}) => {
    const { t } = useLanguage();
    return (
    <PanelCard density={density} title={t('empresa.dashboard.topServicesTitle')} subtitle={summary} icon={Star}>
        {services.length === 0 ? (
            <EmptyState message={t('empresa.dashboard.topServicesEmpty')} />
        ) : (
            <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
                {services.slice(0, density === 'compact' ? 3 : 4).map((service, index) => {
                    const progress = service.rating != null ? `${(service.rating / 5) * 100}%` : '0%';
                    const accent =
                        service.rating != null && service.rating >= 4
                            ? DASHBOARD_COLORS.success
                            : service.rating != null && service.rating >= 3
                              ? DASHBOARD_COLORS.warning
                              : DASHBOARD_COLORS.purple;

                    return (
                        <div
                            key={service.id}
                            className="rounded-2xl border p-3"
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className="flex size-8 shrink-0 items-center justify-center rounded-2xl text-xs font-bold text-white"
                                    style={{ background: DASHBOARD_COLORS.purple }}
                                >
                                    {index + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p
                                                className="truncate text-sm font-semibold"
                                                style={{ color: 'var(--color-text)' }}
                                            >
                                                {service.name}
                                            </p>
                                            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                                {t('empresa.dashboard.topServiceVisits', { visits: service.visits, favorites: service.favorites })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold" style={{ color: accent }}>
                                                {service.rating?.toFixed(1) ?? '—'}
                                            </p>
                                            <p className="text-[11px]" style={{ color: 'var(--color-text-alt)' }}>
                                                {t('empresa.dashboard.topServiceRecs', { recs: service.recomendaciones })}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        className="mt-3 h-2 overflow-hidden rounded-full"
                                        style={{ background: 'rgba(var(--rgb-text), 0.08)' }}
                                    >
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{ width: progress, background: accent }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </PanelCard>
    );
};

export const EmpresaProfileCard = ({
    profile,
    density,
}: {
    profile: EmpresaProfile;
    density: EmpresaDensityMode;
}) => {
    const { t } = useLanguage();
    return (
    <PanelCard
        density={density}
        title={t('empresa.dashboard.profileTitle')}
        subtitle={`${profile.sector_name}${profile.location_name ? ` · ${profile.location_name}` : ''}`}
        icon={Building2}
    >
        <dl className="grid grid-cols-1 gap-3 text-sm">
            {[
                [t('empresa.dashboard.profileName'), profile.name],
                [t('empresa.dashboard.profileSector'), profile.sector_name],
                [t('empresa.dashboard.profileMunicipality'), profile.location_name ?? '—'],
                [t('empresa.dashboard.profilePhone'), profile.phone ?? '—'],
                [t('empresa.dashboard.profileAddress'), profile.address ?? '—'],
                [t('empresa.dashboard.profileRegistration'), new Date(profile.registration_date).toLocaleDateString('es-MX')],
            ].map(([label, value]) => (
                <div
                    key={label}
                    className="rounded-2xl border px-3 py-2"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
                >
                    <dt className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-alt)' }}>
                        {label}
                    </dt>
                    <dd className="mt-1 font-semibold" style={{ color: 'var(--color-text)' }}>
                        {value}
                    </dd>
                </div>
            ))}
        </dl>
    </PanelCard>
    );
};

export const EmpresaQuickActionsCard = ({ density }: { density: EmpresaDensityMode }) => {
    const { t } = useLanguage();
    return (
    <PanelCard
        density={density}
        title={t('empresa.dashboard.quickActionsTitle')}
        subtitle={t('empresa.dashboard.quickActionsSubtitle')}
        icon={Gauge}
    >
        <div className="grid gap-3 sm:grid-cols-3">
            {[
                { label: t('empresa.dashboard.quickActionServices'), to: '/empresa/servicios', color: DASHBOARD_COLORS.orange },
                { label: t('empresa.dashboard.quickActionAnalytics'), to: '/empresa/analytics', color: DASHBOARD_COLORS.cyan },
                { label: t('empresa.dashboard.quickActionProfile'), to: '/empresa/perfil', color: DASHBOARD_COLORS.purple },
            ].map((action) => (
                <Link
                    key={action.to}
                    to={action.to}
                    className="group flex items-center justify-between rounded-2xl border px-4 py-3 transition hover:opacity-90"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
                >
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        {action.label}
                    </span>
                    <ArrowRight
                        className="size-4 transition group-hover:translate-x-0.5"
                        style={{ color: action.color }}
                    />
                </Link>
            ))}
        </div>
    </PanelCard>
    );
};

export const EmpresaQualityScoreCard = ({
    score,
    summary,
    density,
}: {
    score: number | null;
    summary: string;
    density: EmpresaDensityMode;
}) => {
    const { t } = useLanguage();
    return (
    <PanelCard density={density} title={t('empresa.dashboard.qualityTitle')} subtitle={summary} icon={Award}>
        {score == null ? (
            <EmptyState message={t('empresa.dashboard.qualityEmpty')} />
        ) : (
            <div className="flex h-full flex-col justify-center gap-4">
                <div className="flex items-end justify-between">
                    <p className="text-[2rem] font-bold leading-none" style={{ color: 'var(--color-text)' }}>
                        {score}
                        <span className="text-base font-semibold" style={{ color: 'var(--color-text-alt)' }}>
                            /100
                        </span>
                    </p>
                    <span
                        className="rounded-full px-3 py-1 text-xs font-bold"
                        style={{
                            background: `${DASHBOARD_COLORS.orange}18`,
                            color: DASHBOARD_COLORS.orange,
                        }}
                    >
                        {t('empresa.dashboard.qualityBadge')}
                    </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--color-bg-alt)' }}>
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${Math.min(score, 100)}%`,
                            background: DASHBOARD_COLORS.orange,
                        }}
                    />
                </div>
            </div>
        )}
    </PanelCard>
    );
};

export const EmpresaStatusBanner = ({ message }: { message: string }) => {
    const { t } = useLanguage();
    return (
    <div
        className="flex h-full items-start gap-3 rounded-[28px] border p-5 sy-fade-up"
        style={{
            background: `${DASHBOARD_COLORS.warning}10`,
            borderColor: `${DASHBOARD_COLORS.warning}40`,
        }}
    >
        <AlertCircle className="mt-0.5 size-5 shrink-0" style={{ color: DASHBOARD_COLORS.warning }} />
        <div>
            <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                {t('empresa.dashboard.statusTitle')}
            </p>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                {message}
            </p>
        </div>
    </div>
    );
};

export type { EmpresaDashboardViewModel };
