import type { DashboardStats } from '../api/dashboardApi';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import type { LanguageCode } from '../../../contexts/LanguageContext';

export const DASHBOARD_COLORS = {
    pink: '#FC478E',
    purple: '#984EFD',
    cyan: '#4DB9CA',
    green: '#9CCC44',
    orange: '#FF7D1F',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
} as const;

export const DASHBOARD_STORAGE_KEY = 'smartur-dashboard-preferences';

export type ChartMode = 'mixed' | 'volume' | 'score';
export type DensityMode = 'comfortable' | 'compact';

export interface DashboardPreferences {
    chartMode: ChartMode;
    density: DensityMode;
    showTopServices: boolean;
    showUserDistribution: boolean;
    showRecentActivity: boolean;
    showOperationalMix: boolean;
}

export const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
    chartMode: 'mixed',
    density: 'comfortable',
    showTopServices: true,
    showUserDistribution: true,
    showRecentActivity: true,
    showOperationalMix: true,
};

export type WidgetPreferenceKey = 'showTopServices' | 'showUserDistribution' | 'showRecentActivity' | 'showOperationalMix';

export interface DashboardMetric {
    id: 'averageScore' | 'evaluations' | 'activeUsers' | 'services';
    label: string;
    value: string;
    numericValue: number;
    decimals: number;
    suffix?: string;
    helper: string;
    tone: 'primary' | 'success' | 'warning' | 'neutral';
}

export interface TrendPoint {
    month: string;
    fullMonth: string;
    evaluations: number;
    averageScore: number;
}

export interface DashboardInsight {
    label: string;
    value: string;
}

export interface DistributionPoint {
    name: string;
    value: number;
    fill: string;
}

export interface OperationalPoint {
    name: string;
    value: number;
    fill: string;
}

export interface ServiceRankingItem {
    id: number;
    name: string;
    company: string;
    averageScore: number;
    evaluations: number;
}

export interface ActivityFeedItem {
    id: number;
    score: number;
    serviceName: string;
    evaluatorName: string;
    relativeTime: string;
}

export interface DashboardViewModel {
    metrics: DashboardMetric[];
    trendData: TrendPoint[];
    trendSummary: string;
    trendInsights: DashboardInsight[];
    operationalData: OperationalPoint[];
    operationalSummary: string;
    distributionData: DistributionPoint[];
    distributionSummary: string;
    topServices: ServiceRankingItem[];
    topServicesSummary: string;
    recentActivity: ActivityFeedItem[];
    activitySummary: string;
}

const DISTRIBUTION_COLORS = [
    DASHBOARD_COLORS.purple,
    DASHBOARD_COLORS.cyan,
    DASHBOARD_COLORS.orange,
    DASHBOARD_COLORS.pink,
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatCount = (value: number, locale: string) => value.toLocaleString(locale);
const formatDecimal = (value: number, locale: string, digits = 1) =>
    Number.isFinite(value) ? value.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '0.0';
const formatPercent = (value: number, locale: string) =>
    `${value.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}%`;

const shortDate = (dateString: string, locale: string) => new Date(dateString).toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
});

const relativeDate = (dateString: string, lang: LanguageCode) => {
    const copy = getDashboardText(lang).viewModel;
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 60) return copy.relativeMinutes(Math.max(minutes, 1));
    if (hours < 24) return copy.relativeHours(hours);
    return shortDate(dateString, getDashboardText(lang).locale);
};

export const scoreTone = (score: number) => {
    if (score >= 4) return DASHBOARD_COLORS.success;
    if (score >= 3) return DASHBOARD_COLORS.warning;
    return DASHBOARD_COLORS.danger;
};

export const scoreLabel = (score: number) => {
    const copy = getDashboardText('es').viewModel;
    if (score >= 4.3) return copy.scoreOutstanding;
    if (score >= 3.5) return copy.scoreGood;
    if (score >= 3) return copy.scoreAttention;
    return copy.scoreImprove;
};

const buildTrendSummary = (trendData: TrendPoint[], lang: LanguageCode) => {
    const copy = getDashboardText(lang).viewModel;
    if (trendData.length === 0) {
        return copy.noHistoryTrend;
    }

    if (trendData.every((item) => item.evaluations === 0 && item.averageScore === 0)) {
        return copy.zeroTrend;
    }

    const peakMonth = trendData.reduce((best, current) =>
        current.evaluations > best.evaluations ? current : best,
    );
    const bestScoreMonth = trendData.reduce((best, current) =>
        current.averageScore > best.averageScore ? current : best,
    );

    return copy.peakAndBestTrend(peakMonth.fullMonth, bestScoreMonth.fullMonth);
};

const buildTrendInsights = (trendData: TrendPoint[], lang: LanguageCode, locale: string): DashboardInsight[] => {
    const copy = getDashboardText(lang).viewModel;
    if (trendData.length === 0) {
        return [
            { label: copy.insightCoverageLabel, value: copy.insightNoMonthlyHistory },
            { label: copy.insightQualityLabel, value: copy.insightWaitingEvaluations },
        ];
    }

    if (trendData.every((item) => item.evaluations === 0 && item.averageScore === 0)) {
        return [
            { label: copy.insightCoverageLabel, value: copy.insightZeroBase },
            { label: copy.insightQualityLabel, value: copy.insightNoEvaluationsYet },
        ];
    }

    const latest = trendData[trendData.length - 1];
    const previous = trendData[trendData.length - 2];
    const peakMonth = trendData.reduce((best, current) =>
        current.evaluations > best.evaluations ? current : best,
    );

    const latestLabel = previous
        ? copy.latestCutWithDelta(
            latest.fullMonth,
            formatCount(latest.evaluations, locale),
            formatSignedDelta(latest.evaluations, previous.evaluations, lang, locale),
        )
        : copy.latestCutWithoutDelta(latest.fullMonth, formatCount(latest.evaluations, locale));

    return [
        { label: copy.insightLatestCutLabel, value: latestLabel },
        { label: copy.insightMonthlyPeakLabel, value: `${peakMonth.fullMonth}: ${formatCount(peakMonth.evaluations, locale)}` },
    ];
};

const formatSignedDelta = (current: number, previous: number, lang: LanguageCode, locale: string) => {
    if (previous <= 0) return getDashboardText(lang).viewModel.newDelta;
    const delta = ((current - previous) / previous) * 100;
    const prefix = delta > 0 ? '+' : '';
    return `${prefix}${delta.toLocaleString(locale, { maximumFractionDigits: 0 })}%`;
};

const buildFallbackTrendData = (locale: string): TrendPoint[] => (
    Array.from({ length: 6 }, (_, index) => {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - (5 - index), 1);

        return {
            month: monthDate.toLocaleDateString(locale, { month: 'short' }),
            fullMonth: monthDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
            evaluations: 0,
            averageScore: 0,
        };
    })
);

export const deriveDashboardViewModel = (stats: DashboardStats, lang: LanguageCode): DashboardViewModel => {
    const messages = getDashboardText(lang);
    const copy = messages.viewModel;
    const locale = messages.locale;
    const averageScore = clamp(Number(stats.average_score), 0, 5);
    const activeRate = stats.total_users > 0 ? (stats.active_users / stats.total_users) * 100 : 0;
    const evaluationsPerService = stats.total_services > 0 ? stats.total_evaluations / stats.total_services : 0;
    const servicesPerCompany = stats.total_companies > 0 ? stats.total_services / stats.total_companies : 0;

    const metrics: DashboardMetric[] = [
        {
            id: 'averageScore',
            label: copy.averageScoreLabel,
            value: `${formatDecimal(averageScore, locale)}/5`,
            numericValue: averageScore,
            decimals: 1,
            suffix: '/5',
            helper: copy.averageScoreHelper(scoreLabelByLang(averageScore, lang), formatCount(stats.total_evaluations, locale)),
            tone: averageScore >= 4 ? 'success' : averageScore >= 3 ? 'warning' : 'primary',
        },
        {
            id: 'evaluations',
            label: copy.evaluationsLabel,
            value: formatCount(stats.total_evaluations, locale),
            numericValue: stats.total_evaluations,
            decimals: 0,
            helper: copy.evaluationsHelper(formatDecimal(evaluationsPerService, locale)),
            tone: 'primary',
        },
        {
            id: 'activeUsers',
            label: copy.activeUsersLabel,
            value: formatCount(stats.active_users, locale),
            numericValue: stats.active_users,
            decimals: 0,
            helper: copy.activeUsersHelper(formatPercent(activeRate, locale), formatCount(stats.total_users, locale)),
            tone: 'success',
        },
        {
            id: 'services',
            label: copy.servicesLabel,
            value: formatCount(stats.total_services, locale),
            numericValue: stats.total_services,
            decimals: 0,
            helper: copy.servicesHelper(formatDecimal(servicesPerCompany, locale)),
            tone: 'neutral',
        },
    ];

    const trendData = stats.evaluations_by_month.length > 0 ? stats.evaluations_by_month.map((item) => {
        const monthDate = new Date(`${item.month}-01T00:00:00`);

        return {
            month: monthDate.toLocaleDateString(locale, { month: 'short' }),
            fullMonth: monthDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
            evaluations: item.count,
            averageScore: clamp(Number(item.avg_score), 0, 5),
        };
    }) : buildFallbackTrendData(locale);

    const operationalData: OperationalPoint[] = [
        { name: copy.operationalNames.locations, value: stats.total_locations, fill: DASHBOARD_COLORS.cyan },
        { name: copy.operationalNames.services, value: stats.total_services, fill: DASHBOARD_COLORS.purple },
        { name: copy.operationalNames.companies, value: stats.total_companies, fill: DASHBOARD_COLORS.green },
        { name: copy.operationalNames.poi, value: stats.total_poi, fill: DASHBOARD_COLORS.orange },
    ];

    const distributionData = stats.users_by_role
        .filter((role) => role.count > 0)
        .map((role, index) => ({
            name: copy.roleLabels[role.role_id] ?? copy.roleFallback(role.role_id),
            value: role.count,
            fill: DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length],
        }));

    const topServices = stats.top_services.slice(0, 4).map((service) => ({
        id: service.id_service,
        name: service.service_name,
        company: service.company_name,
        averageScore: clamp(Number(service.avg_score), 0, 5),
        evaluations: service.evaluation_count,
    }));

    const recentActivity = stats.recent_evaluations.slice(0, 5).map((item) => ({
        id: item.id_evaluation,
        score: clamp(Number(item.total_score), 0, 5),
        serviceName: item.service_name,
        evaluatorName: item.evaluator_name,
        relativeTime: relativeDate(item.created_at, lang),
    }));

    const distributionSummary = distributionData.length > 0
        ? copy.distributionSummary(distributionData.length)
        : copy.distributionSummaryEmpty;

    const operationalSummary = operationalData.some((item) => item.value > 0)
        ? copy.operationalSummary
        : copy.operationalSummaryEmpty;

    const topServicesSummary = topServices.length > 0
        ? copy.topServicesSummary(topServices[0].name)
        : copy.topServicesSummaryEmpty;

    const activitySummary = recentActivity.length > 0
        ? copy.activitySummary(formatCount(recentActivity.length, locale))
        : copy.activitySummaryEmpty;

    return {
        metrics,
        trendData,
        trendSummary: buildTrendSummary(trendData, lang),
        trendInsights: buildTrendInsights(trendData, lang, locale),
        operationalData,
        operationalSummary,
        distributionData,
        distributionSummary,
        topServices,
        topServicesSummary,
        recentActivity,
        activitySummary,
    };
};

const scoreLabelByLang = (score: number, lang: LanguageCode) => {
    const copy = getDashboardText(lang).viewModel;
    if (score >= 4.3) return copy.scoreOutstanding;
    if (score >= 3.5) return copy.scoreGood;
    if (score >= 3) return copy.scoreAttention;
    return copy.scoreImprove;
};
