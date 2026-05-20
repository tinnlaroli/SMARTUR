import {
    Activity,
    BarChart3,
    Building2,
    Gauge,
    Layers3,
    LineChart,
    MapPin,
    RefreshCw,
    Settings2,
    Star,
    Users,
} from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';
import {
    Bar,
    BarChart as RechartsBarChart,
    CartesianGrid,
    Cell,
    ComposedChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Line,
} from 'recharts';
import {
    DASHBOARD_COLORS,
    type ActivityFeedItem,
    type ChartMode,
    type DashboardInsight,
    type DashboardMetric,
    type DashboardPreferences,
    type DensityMode,
    type DistributionPoint,
    type OperationalPoint,
    type ServiceRankingItem,
    type TrendPoint,
    type WidgetPreferenceKey,
    scoreTone,
} from '../utils/dashboard';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

interface DashboardHeaderProps {
    onRefresh: () => void;
    refreshing: boolean;
    preferencesOpen: boolean;
    onTogglePreferences: () => void;
}

interface DashboardPreferencesPanelProps {
    open: boolean;
    preferences: DashboardPreferences;
    onChartModeChange: (mode: ChartMode) => void;
    onDensityChange: (density: DensityMode) => void;
    onToggleWidget: (widget: WidgetPreferenceKey) => void;
    onReset: () => void;
}

interface KpiStripProps {
    metrics: DashboardMetric[];
    density: DensityMode;
}

interface TrendChartCardProps {
    chartMode: ChartMode;
    data: TrendPoint[];
    summary: string;
    insights: DashboardInsight[];
    density: DensityMode;
}

interface UserDistributionCardProps {
    data: DistributionPoint[];
    totalUsers: number;
    summary: string;
    density: DensityMode;
}

interface OperationalMixCardProps {
    data: OperationalPoint[];
    summary: string;
    density: DensityMode;
}

interface TopServicesCardProps {
    services: ServiceRankingItem[];
    summary: string;
    density: DensityMode;
}

interface RecentActivityCardProps {
    activity: ActivityFeedItem[];
    summary: string;
    density: DensityMode;
}

const cardSurface = {
    background: 'var(--color-bg)',
    borderColor: 'var(--color-border)',
} as const;

const TONE_STYLES: Record<DashboardMetric['tone'], { accent: string; glow: string }> = {
    primary: { accent: DASHBOARD_COLORS.purple, glow: `${DASHBOARD_COLORS.purple}20` },
    success: { accent: DASHBOARD_COLORS.success, glow: `${DASHBOARD_COLORS.success}1a` },
    warning: { accent: DASHBOARD_COLORS.warning, glow: `${DASHBOARD_COLORS.warning}1a` },
    neutral: { accent: DASHBOARD_COLORS.cyan, glow: `${DASHBOARD_COLORS.cyan}1a` },
};

const METRIC_META: Record<DashboardMetric['id'], { icon: ElementType; eyebrowKey: DashboardMetric['id'] }> = {
    averageScore: { icon: Gauge, eyebrowKey: 'averageScore' },
    evaluations: { icon: BarChart3, eyebrowKey: 'evaluations' },
    activeUsers: { icon: Users, eyebrowKey: 'activeUsers' },
    services: { icon: Building2, eyebrowKey: 'services' },
};

const WIDGET_OPTIONS: Array<{ key: WidgetPreferenceKey }> = [
    {
        key: 'showTopServices',
    },
    {
        key: 'showUserDistribution',
    },
    {
        key: 'showRecentActivity',
    },
];

const cardPadding = (density: DensityMode) => density === 'compact' ? 'p-4' : 'p-5';

const formatCardClassName = (density: DensityMode) =>
    `rounded-[28px] border ${cardPadding(density)} shadow-[0_10px_35px_rgba(15,23,42,0.06)] overflow-hidden`;

const pillClassName = 'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold';

const useCountUp = (target: number, decimals: number, duration = 1100) => {
    const [value, setValue] = useState(0);

    useEffect(() => {
        let frame = 0;
        const start = performance.now();

        const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(target * eased);

            if (progress < 1) {
                frame = requestAnimationFrame(tick);
            }
        };

        setValue(0);
        frame = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(frame);
    }, [decimals, duration, target]);

    return Number(value.toFixed(decimals));
};

const formatAnimatedMetric = (metric: DashboardMetric, value: number, locale: string) => {
    const formatted = value.toLocaleString(locale, {
        minimumFractionDigits: metric.decimals,
        maximumFractionDigits: metric.decimals,
    });

    return `${formatted}${metric.suffix ?? ''}`;
};

const AnimatedMetricValue = ({ metric, delayMs = 0 }: { metric: DashboardMetric; delayMs?: number }) => {
    const { lang } = useLanguage();
    const locale = getDashboardText(lang).locale;
    const animatedValue = useCountUp(metric.numericValue, metric.decimals, 1100 + delayMs);

    return <>{formatAnimatedMetric(metric, animatedValue, locale)}</>;
};

const SegmentedControl = <T extends string>({
    options,
    value,
    onChange,
}: {
    options: Array<{ label: string; value: T }>;
    value: T;
    onChange: (value: T) => void;
}) => (
    <div
        className="grid grid-cols-3 gap-1 rounded-2xl border p-1"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
    >
        {options.map((option) => {
            const active = option.value === value;

            return (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className="rounded-xl px-3 py-2 text-xs font-semibold transition"
                    style={active
                        ? { background: 'var(--color-bg)', color: 'var(--color-text)' }
                        : { color: 'var(--color-text-alt)' }}
                >
                    {option.label}
                </button>
            );
        })}
    </div>
);

const ToggleRow = ({
    checked,
    label,
    description,
    onClick,
}: {
    checked: boolean;
    label: string;
    description: string;
    onClick: () => void;
}) => (
    <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between rounded-2xl border p-3 text-left transition hover:opacity-90"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
    >
        <div className="pr-4">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                {label}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                {description}
            </p>
        </div>
        <div
            className="flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition"
            style={{ background: checked ? DASHBOARD_COLORS.purple : 'rgba(var(--rgb-text), 0.12)' }}
        >
            <span
                className="size-5 rounded-full bg-white shadow-sm transition"
                style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
            />
        </div>
    </button>
);

const PanelCard = ({
    density,
    title,
    subtitle,
    icon: Icon,
    children,
    footer,
}: {
    density: DensityMode;
    title: string;
    subtitle: string;
    icon: ElementType;
    children: ReactNode;
    footer?: ReactNode;
}) => (
    <section
        className={`${formatCardClassName(density)} flex min-h-0 flex-col sy-fade-up`}
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
    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed p-4 text-center" style={{ borderColor: 'var(--color-border)' }}>
        <p className="max-w-xs text-sm" style={{ color: 'var(--color-text-alt)' }}>
            {message}
        </p>
    </div>
);

const ShimmerBlock = ({
    className,
    style,
}: {
    className: string;
    style?: CSSProperties;
}) => (
    <div
        className={`rounded-2xl sy-shimmer-pulse ${className}`}
        style={style}
    />
);

const AnimatedBar = ({
    width,
    color,
    delayMs = 0,
}: {
    width: string;
    color: string;
    delayMs?: number;
}) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const id = setTimeout(() => { el.style.width = width; }, delayMs + 50);
        return () => clearTimeout(id);
    }, [width, delayMs]);
    return (
        <div
            ref={ref}
            className="h-full rounded-full"
            style={{
                width: 0,
                background: color,
                transition: `width 0.8s cubic-bezier(0.215, 0.61, 0.355, 1) ${delayMs}ms`,
            }}
        />
    );
};

export const DashboardLoadingShell = ({ density }: { density: DensityMode }) => (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
                <ShimmerBlock className="mb-3 h-7 w-64" style={{ background: 'var(--color-bg-alt)' }} />
                <ShimmerBlock className="h-10 w-80" style={{ background: 'var(--color-bg-alt)' }} />
                <ShimmerBlock className="mt-3 h-4 w-[30rem] max-w-full" style={{ background: 'var(--color-bg-alt)' }} />
            </div>
            <div className="flex gap-2">
                <ShimmerBlock className="h-11 w-36" style={{ background: 'var(--color-bg-alt)' }} />
                <ShimmerBlock className="h-11 w-32" style={{ background: 'var(--color-bg-alt)' }} />
            </div>
        </div>

        <div className="grid shrink-0 grid-cols-12 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <div
                    key={index}
                    className={`col-span-12 md:col-span-6 xl:col-span-3 ${formatCardClassName(density)} relative sy-fade-up sy-fade-up-${(index + 1) as 1 | 2 | 3 | 4}`}
                    style={cardSurface}
                >
                    <ShimmerBlock className="h-4 w-20" style={{ background: 'var(--color-bg-alt)' }} />
                    <ShimmerBlock className="mt-5 h-10 w-28" style={{ background: 'var(--color-bg-alt)' }} />
                    <ShimmerBlock className="mt-3 h-3 w-full" style={{ background: 'var(--color-bg-alt)' }} />
                    <ShimmerBlock className="mt-4 h-1.5 w-full rounded-full" style={{ background: 'rgba(var(--rgb-text), 0.08)' }} />
                </div>
            ))}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="min-h-0 xl:col-span-8">
                <div className={`${formatCardClassName(density)} relative flex h-full min-h-0 flex-col`} style={cardSurface}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <ShimmerBlock className="h-10 w-56" style={{ background: 'var(--color-bg-alt)' }} />
                        <ShimmerBlock className="h-7 w-36" style={{ background: 'var(--color-bg-alt)' }} />
                    </div>
                    <div className="grid gap-2 lg:grid-cols-2">
                        <ShimmerBlock className="h-14 w-full" style={{ background: 'var(--color-bg-alt)' }} />
                        <ShimmerBlock className="h-14 w-full" style={{ background: 'var(--color-bg-alt)' }} />
                    </div>
                    <div className="relative mt-4 min-h-0 flex-1 overflow-hidden rounded-[24px]" style={{ background: 'var(--color-bg-alt)' }}>
                        <div
                            aria-hidden
                            className="absolute inset-x-8 bottom-10 top-8 rounded-[20px] sy-shimmer-pulse"
                            style={{ background: 'rgba(152, 78, 253, 0.08)' }}
                        />
                        <div
                            aria-hidden
                            className="absolute inset-x-10 bottom-12 top-10 rounded-[20px] border-b-2 sy-shimmer-pulse"
                            style={{
                                borderBottomColor: DASHBOARD_COLORS.cyan,
                                borderBottomStyle: 'solid',
                                animationDelay: '0.3s',
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid min-h-0 gap-4 md:grid-cols-2 xl:col-span-4 xl:grid-cols-1">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className={`${formatCardClassName(density)} relative`} style={cardSurface}>
                        <ShimmerBlock className="h-10 w-44" style={{ background: 'var(--color-bg-alt)' }} />
                        <ShimmerBlock className="mt-4 h-20 w-full" style={{ background: 'var(--color-bg-alt)' }} />
                        <ShimmerBlock className="mt-3 h-12 w-full" style={{ background: 'var(--color-bg-alt)' }} />
                        <ShimmerBlock className="mt-3 h-12 w-full" style={{ background: 'var(--color-bg-alt)' }} />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

interface TooltipPayloadItem {
    color?: string;
    dataKey?: string;
    name?: string;
    value?: number | string;
}

interface TrendTooltipProps {
    active?: boolean;
    label?: string;
    payload?: TooltipPayloadItem[];
}

const TrendTooltip = ({ active, label, payload }: TrendTooltipProps) => {
    const { lang } = useLanguage();
    const locale = getDashboardText(lang).locale;
    if (!active || !payload || payload.length === 0) return null;

    return (
        <div
            className="rounded-2xl border px-3 py-2 shadow-xl"
            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
        >
            <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                {label}
            </p>
            <div className="mt-2 space-y-1.5">
                {payload.map((item) => (
                    <div key={item.dataKey ?? item.name} className="flex items-center gap-2 text-xs">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color ?? DASHBOARD_COLORS.purple }} />
                        <span style={{ color: 'var(--color-text-alt)' }}>{item.name}</span>
                        <span className="ml-auto font-semibold" style={{ color: 'var(--color-text)' }}>
                            {typeof item.value === 'number' ? item.value.toLocaleString(locale, { maximumFractionDigits: 1 }) : item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const DashboardHeader = ({
    onRefresh,
    refreshing,
    preferencesOpen,
    onTogglePreferences,
}: DashboardHeaderProps) => {
    const { lang } = useLanguage();
    const copy = getDashboardText(lang).widgets;

    return (
        <div className="relative z-20 flex shrink-0 items-start justify-between gap-4">
            <div className="min-w-0">
                <h1
                    className="text-[1.85rem] font-bold leading-none tracking-tight"
                    style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
                >
                    {copy.headerTitle}
                </h1>
                <p className="mt-3 max-w-2xl text-sm" style={{ color: 'var(--color-text-alt)' }}>
                    {copy.headerSubtitle}
                </p>
            </div>

            <div className="relative flex shrink-0 items-center gap-2">
                <button
                    type="button"
                    onClick={onTogglePreferences}
                    className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition hover:opacity-90"
                    style={{
                        borderColor: preferencesOpen ? DASHBOARD_COLORS.purple : 'var(--color-border)',
                        background: preferencesOpen ? `${DASHBOARD_COLORS.purple}12` : 'var(--color-bg)',
                        color: preferencesOpen ? DASHBOARD_COLORS.purple : 'var(--color-text)',
                    }}
                >
                    <Settings2 className="size-4" />
                    {copy.personalize}
                </button>
                <button
                    type="button"
                    onClick={onRefresh}
                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    style={{ background: DASHBOARD_COLORS.purple }}
                >
                    <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {copy.refresh}
                </button>
            </div>
        </div>
    );
};

export const DashboardPreferencesPanel = ({
    open,
    preferences,
    onChartModeChange,
    onDensityChange,
    onToggleWidget,
    onReset,
}: DashboardPreferencesPanelProps) => {
    const { lang } = useLanguage();
    const copy = getDashboardText(lang).widgets;

    return (
        <aside
            aria-hidden={!open}
            className="absolute right-0 top-16 z-[90] w-[22rem] rounded-[28px] border p-5 shadow-2xl"
            style={{
                background: 'var(--color-bg)',
                borderColor: 'var(--color-border)',
                opacity: open ? 1 : 0,
                transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.98)',
                pointerEvents: open ? 'auto' : 'none',
                transition: 'opacity 0.22s var(--ease-out-cubic), transform 0.22s var(--ease-out-cubic)',
            }}
        >
                    <div className="mb-5 flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                                {copy.preferencesTitle}
                            </p>
                            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                {copy.preferencesSubtitle}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onReset}
                            className="rounded-xl px-3 py-1 text-xs font-semibold transition hover:opacity-90"
                            style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)' }}
                        >
                            {copy.reset}
                        </button>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-alt)' }}>
                                {copy.mainView}
                            </p>
                            <SegmentedControl
                                options={[
                                    { label: copy.mixed, value: 'mixed' },
                                    { label: copy.volume, value: 'volume' },
                                    { label: copy.score, value: 'score' },
                                ]}
                                value={preferences.chartMode}
                                onChange={onChartModeChange}
                            />
                        </div>

                        <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-alt)' }}>
                                {copy.visualDensity}
                            </p>
                            <div
                                className="grid grid-cols-2 gap-1 rounded-2xl border p-1"
                                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
                            >
                                {[
                                    { label: copy.comfortable, value: 'comfortable' },
                                    { label: copy.compact, value: 'compact' },
                                ].map((option) => {
                                    const active = preferences.density === option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => onDensityChange(option.value as DensityMode)}
                                            className="rounded-xl px-3 py-2 text-xs font-semibold transition"
                                            style={active
                                                ? { background: 'var(--color-bg)', color: 'var(--color-text)' }
                                                : { color: 'var(--color-text-alt)' }}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-alt)' }}>
                                {copy.sideWidgets}
                            </p>
                            <div className="space-y-2">
                                {WIDGET_OPTIONS.map((widget) => (
                                    <ToggleRow
                                        key={widget.key}
                                        checked={preferences[widget.key]}
                                        label={copy.widgetOptions[widget.key].label}
                                        description={copy.widgetOptions[widget.key].description}
                                        onClick={() => onToggleWidget(widget.key)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
        </aside>
    );
};

export const KpiStrip = ({ metrics, density }: KpiStripProps) => {
    const { lang } = useLanguage();
    const copy = getDashboardText(lang).widgets;

    return (
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
                                <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--color-text-alt)' }}>
                                    {copy.metricEyebrows[meta.eyebrowKey]}
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
                                style={{ background: tone.accent }}
                            />
                        </div>
                    </article>
                );
            })}
        </div>
    );
};

export const OperationalMixCard = ({
    data,
    summary,
    density,
}: OperationalMixCardProps) => {
    const { lang } = useLanguage();
    const copy = getDashboardText(lang).widgets;
    const locale = getDashboardText(lang).locale;

    return (
        <PanelCard
            density={density}
            title={copy.operationalCoverageTitle}
            subtitle={summary}
            icon={BarChart3}
        >
            <div className="flex h-full min-h-[19rem] flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
                {data.map((item) => (
                    <div
                        key={item.name}
                        className="rounded-2xl border px-3 py-2"
                        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
                    >
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-alt)' }}>
                            {item.name}
                        </p>
                        <p className="mt-1 text-lg font-bold" style={{ color: item.fill }}>
                            {item.value.toLocaleString(locale)}
                        </p>
                    </div>
                ))}
            </div>

            <div
                className="relative h-[13rem] md:h-[14rem] overflow-hidden rounded-[24px] border p-2"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 4, right: 18, left: 12, bottom: 4 }}
                    >
                        <CartesianGrid horizontal={false} stroke="rgba(148, 163, 184, 0.14)" />
                        <XAxis
                            type="number"
                            domain={[0, (dataMax: number) => Math.max(dataMax, 1)]}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: 'var(--color-text-alt)', fontSize: density === 'compact' ? 10 : 11 }}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={68}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: 'var(--color-text-alt)', fontSize: density === 'compact' ? 10 : 11 }}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(var(--rgb-text), 0.03)' }}
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const point = payload[0];

                                return (
                                    <div
                                        className="rounded-2xl border px-3 py-2 shadow-xl"
                                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                                    >
                                        <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                                            {point.payload?.name}
                                        </p>
                                        <p className="mt-1 text-sm font-bold" style={{ color: point.color ?? DASHBOARD_COLORS.purple }}>
                                            {(Number(point.value) || 0).toLocaleString(locale)}
                                        </p>
                                    </div>
                                );
                            }}
                        />
                        <Bar
                            dataKey="value"
                            radius={[0, 10, 10, 0]}
                            maxBarSize={22}
                            isAnimationActive
                            animationDuration={1050}
                            animationEasing="ease-out"
                            minPointSize={6}
                        >
                            {data.map((entry) => (
                                <Cell key={entry.name} fill={entry.fill} />
                            ))}
                        </Bar>
                    </RechartsBarChart>
                </ResponsiveContainer>
            </div>
            </div>
        </PanelCard>
    );
};

export const TrendChartCard = ({
    chartMode,
    data,
    summary,
    insights,
    density,
}: TrendChartCardProps) => {
    const { lang } = useLanguage();
    const copy = getDashboardText(lang).widgets;

    return (
        <PanelCard
            density={density}
            title={copy.monthlyPerformanceTitle}
            subtitle={summary}
            icon={chartMode === 'score' ? LineChart : BarChart3}
            footer={
                <div className="flex flex-wrap justify-end gap-2">
                    {(chartMode === 'mixed' || chartMode === 'volume') && (
                        <span className={pillClassName} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}>
                            <span className="size-2 rounded-full" style={{ background: DASHBOARD_COLORS.purple }} />
                            {copy.evaluationsLegend}
                        </span>
                    )}
                    {(chartMode === 'mixed' || chartMode === 'score') && (
                        <span className={pillClassName} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}>
                            <span className="size-2 rounded-full" style={{ background: DASHBOARD_COLORS.cyan }} />
                            {copy.averageScoreLegend}
                        </span>
                    )}
                </div>
            }
        >
            {data.length === 0 ? (
                <EmptyState message={copy.mainChartEmpty} />
            ) : (
                <div className="flex h-full min-h-[24rem] flex-col gap-4">
                    <div className="grid gap-2 lg:grid-cols-2">
                        {insights.map((insight) => (
                            <div
                                key={insight.label}
                                className="rounded-2xl border px-3 py-2"
                                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
                            >
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-alt)' }}>
                                    {insight.label}
                                </p>
                                <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                    {insight.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="h-[18rem] md:h-[20rem]">
                        <div
                            className="h-full overflow-hidden rounded-[24px] border p-2"
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.16)" />
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: 'var(--color-text-alt)', fontSize: density === 'compact' ? 10 : 11 }}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        width={36}
                                        domain={[0, (dataMax: number) => Math.max(dataMax, 1)]}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: 'var(--color-text-alt)', fontSize: density === 'compact' ? 10 : 11 }}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        domain={[0, 5]}
                                        width={32}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: 'var(--color-text-alt)', fontSize: density === 'compact' ? 10 : 11 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(var(--rgb-text), 0.03)' }}
                                        content={<TrendTooltip />}
                                    />
                                    <Bar
                                        yAxisId="left"
                                        dataKey="evaluations"
                                        name={copy.evaluationsLegend}
                                        fill={DASHBOARD_COLORS.purple}
                                        radius={[10, 10, 3, 3]}
                                        maxBarSize={density === 'compact' ? 18 : 22}
                                        minPointSize={6}
                                        opacity={chartMode === 'score' ? 0.45 : 0.95}
                                        animationDuration={1100}
                                        animationEasing="ease-out"
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="averageScore"
                                        name={copy.averageScoreLegend}
                                        stroke={DASHBOARD_COLORS.cyan}
                                        strokeWidth={chartMode === 'score' ? 3 : 2.5}
                                        opacity={chartMode === 'volume' ? 0.5 : 1}
                                        dot={{ r: 3.5, fill: DASHBOARD_COLORS.cyan, stroke: 'var(--color-bg)', strokeWidth: 1.5 }}
                                        activeDot={{ r: 6, fill: DASHBOARD_COLORS.cyan, stroke: 'var(--color-bg)', strokeWidth: 2 }}
                                        isAnimationActive
                                        animationDuration={1250}
                                        animationEasing="ease-out"
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </PanelCard>
    );
};

export const UserDistributionCard = ({
    data,
    totalUsers,
    summary,
    density,
}: UserDistributionCardProps) => {
    const { lang } = useLanguage();
    const copy = getDashboardText(lang).widgets;
    const locale = getDashboardText(lang).locale;

    return (
        <PanelCard
            density={density}
            title={copy.userDistributionTitle}
            subtitle={summary}
            icon={Layers3}
        >
            {data.length === 0 ? (
                <EmptyState message={copy.userDistributionEmpty} />
            ) : (
            <div className="flex h-full min-h-0 items-center gap-4">
                <div className="relative h-full min-h-[160px] flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="value"
                                innerRadius={40}
                                outerRadius={68}
                                paddingAngle={3}
                                strokeWidth={0}
                                isAnimationActive
                                animationBegin={120}
                                animationDuration={1100}
                            >
                                {data.map((entry) => (
                                    <Cell key={entry.name} fill={entry.fill} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-alt)' }}>
                            {copy.totalLabel}
                        </span>
                        <span className="mt-1 text-2xl font-bold leading-none" style={{ color: 'var(--color-text)' }}>
                            {totalUsers.toLocaleString(locale)}
                        </span>
                    </div>
                </div>

                <div className="min-w-[12rem] flex-1 space-y-2">
                    {data.map((entry) => (
                        <div
                            key={entry.name}
                            className="rounded-2xl border px-3 py-2"
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
                        >
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.fill }} />
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                    {entry.name}
                                </p>
                            </div>
                            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                {copy.usersLabel(entry.value)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
            )}
        </PanelCard>
    );
};

export const TopServicesCard = ({
    services,
    summary,
    density,
}: TopServicesCardProps) => {
    const { lang } = useLanguage();
    const copy = getDashboardText(lang).widgets;
    const locale = getDashboardText(lang).locale;

    return (
        <PanelCard
            density={density}
            title={copy.topServicesTitle}
            subtitle={summary}
            icon={Star}
        >
            {services.length === 0 ? (
                <EmptyState message={copy.topServicesEmpty} />
            ) : (
                <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
                {services.slice(0, density === 'compact' ? 3 : 4).map((service, index) => {
                    const progress = `${(service.averageScore / 5) * 100}%`;
                    const accent = scoreTone(service.averageScore);

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
                                            <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                                {service.name}
                                            </p>
                                            <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                                <MapPin className="size-3" />
                                                {service.company}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold" style={{ color: accent }}>
                                                {service.averageScore.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                            </p>
                                            <p className="text-[11px]" style={{ color: 'var(--color-text-alt)' }}>
                                                {service.evaluations.toLocaleString(getDashboardText(lang).locale)} {copy.evaluationsShort}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: 'rgba(var(--rgb-text), 0.08)' }}>
                                        <AnimatedBar
                                            width={progress}
                                            color={accent}
                                            delayMs={150 + index * 50}
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

export const RecentActivityCard = ({
    activity,
    summary,
    density,
}: RecentActivityCardProps) => {
    const { lang } = useLanguage();
    const copy = getDashboardText(lang).widgets;
    const locale = getDashboardText(lang).locale;

    return (
        <PanelCard
            density={density}
            title={copy.recentActivityTitle}
            subtitle={summary}
            icon={Activity}
        >
            {activity.length === 0 ? (
                <EmptyState message={copy.recentActivityEmpty} />
            ) : (
                <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
                {activity.slice(0, density === 'compact' ? 3 : 4).map((item, index) => {
                    const accent = scoreTone(item.score);

                    return (
                        <div
                            key={item.id}
                            className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 sy-fade-up ${index < 4 ? `sy-fade-up-${(index + 1) as 1 | 2 | 3 | 4}` : ''}`}
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
                        >
                            <div
                                className="flex size-9 shrink-0 items-center justify-center rounded-2xl"
                                style={{ background: `${accent}1a` }}
                            >
                                <Activity className="size-4" style={{ color: accent }} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                    {item.serviceName}
                                </p>
                                <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                    {item.evaluatorName}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold" style={{ color: accent }}>
                                    {item.score.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}★
                                </p>
                                <p className="text-[11px]" style={{ color: 'var(--color-text-alt)' }}>
                                    {item.relativeTime}
                                </p>
                            </div>
                        </div>
                    );
                })}
                </div>
            )}
        </PanelCard>
    );
};
