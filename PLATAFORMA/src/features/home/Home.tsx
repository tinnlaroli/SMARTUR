import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { dashboardApi, type DashboardStats } from './api/dashboardApi';
import {
    DashboardHeader,
    DashboardLoadingShell,
    DashboardPreferencesPanel,
    KpiStrip,
    OperationalMixCard,
    RecentActivityCard,
    TopServicesCard,
    TrendChartCard,
    UserDistributionCard,
} from './components/DashboardWidgets';
import { useDashboardPreferences } from './hooks/useDashboardPreferences';
import { DASHBOARD_COLORS, deriveDashboardViewModel } from './utils/dashboard';
import { useLanguage } from '../../contexts/LanguageContext';
import { getDashboardText } from '../../shared/i18n/dashboardLocale';

const DashboardLoader = ({ label }: { label: string }) => (
    <div className="flex flex-col items-center gap-4 sy-fade-up">
        <div className="relative size-14">
            <div
                className="absolute inset-0 animate-ping rounded-full"
                style={{ background: `${DASHBOARD_COLORS.purple}33` }}
            />
            <div
                className="relative flex size-14 items-center justify-center rounded-full"
                style={{ background: `${DASHBOARD_COLORS.purple}18` }}
            >
                <Loader2 className="size-7 animate-spin" style={{ color: DASHBOARD_COLORS.purple }} />
            </div>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
            {label}
        </p>
    </div>
);

export const Home = () => {
    const { lang } = useLanguage();
    const copy = getDashboardText(lang);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preferencesOpen, setPreferencesOpen] = useState(false);
    const { preferences, setChartMode, setDensity, toggleWidget, resetPreferences } = useDashboardPreferences();

    const fetchStats = async (mode: 'initial' | 'refresh' = 'initial') => {
        if (mode === 'refresh' && stats) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError(null);

        try {
            const nextStats = await dashboardApi.getStats();
            setStats(nextStats);
        } catch {
            setError('dashboard-error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        void fetchStats('initial');
    }, []);

    const viewModel = useMemo(() => (
        stats ? deriveDashboardViewModel(stats, lang) : null
    ), [lang, stats]);

    const bottomWidgets = useMemo(() => {
        if (!viewModel || !stats) return [];

        return [
            preferences.showTopServices
                ? (
                    <TopServicesCard
                        key="top-services"
                        services={viewModel.topServices}
                        summary={viewModel.topServicesSummary}
                        density={preferences.density}
                    />
                )
                : null,
            preferences.showUserDistribution
                ? (
                    <UserDistributionCard
                        key="user-distribution"
                        data={viewModel.distributionData}
                        totalUsers={stats.total_users}
                        summary={viewModel.distributionSummary}
                        density={preferences.density}
                    />
                )
                : null,
            preferences.showRecentActivity
                ? (
                    <RecentActivityCard
                        key="recent-activity"
                        activity={viewModel.recentActivity}
                        summary={viewModel.activitySummary}
                        density={preferences.density}
                    />
                )
                : null,
        ].filter((widget): widget is ReactElement => widget !== null);
    }, [preferences, stats, viewModel]);

    const bottomColClass =
        bottomWidgets.length === 1 ? 'grid-cols-1' :
        bottomWidgets.length === 2 ? 'grid-cols-2' :
        'grid-cols-3';

    if (loading) {
        return (
            <div className="relative">
                <DashboardLoadingShell density={preferences.density} />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div
                        className="rounded-[32px] border px-8 py-6 shadow-2xl backdrop-blur-md"
                        style={{
                            background: 'rgba(var(--rgb-bg), 0.72)',
                            borderColor: 'rgba(var(--rgb-text), 0.08)',
                        }}
                    >
                        <DashboardLoader label={copy.home.loadingLabel} />
                    </div>
                </div>
            </div>
        );
    }

    if (error && !stats) {
        return (
            <div className="flex h-full items-center justify-center">
                <div
                    className="rounded-[28px] border p-8 text-center shadow-sm sy-fade-up"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                >
                    <AlertCircle className="mx-auto size-10" style={{ color: DASHBOARD_COLORS.danger }} />
                    <p className="mt-3 font-semibold" style={{ color: 'var(--color-text)' }}>
                        {copy.home.dashboardError}
                    </p>
                    <button
                        type="button"
                        onClick={() => { void fetchStats('initial'); }}
                        className="mt-5 inline-flex items-center gap-2 rounded-2xl px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                        style={{ background: DASHBOARD_COLORS.purple }}
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        {copy.home.retry}
                    </button>
                </div>
            </div>
        );
    }

    if (!stats || !viewModel) return null;

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            {preferencesOpen && (
                <button
                    type="button"
                    aria-label={copy.home.closePreferences}
                    className="absolute inset-0 z-10 cursor-default"
                    onClick={() => setPreferencesOpen(false)}
                />
            )}

            <DashboardHeader
                onRefresh={() => { void fetchStats('refresh'); }}
                refreshing={refreshing}
                preferencesOpen={preferencesOpen}
                onTogglePreferences={() => setPreferencesOpen((current) => !current)}
            />

            <DashboardPreferencesPanel
                open={preferencesOpen}
                preferences={preferences}
                onChartModeChange={setChartMode}
                onDensityChange={setDensity}
                onToggleWidget={toggleWidget}
                onReset={resetPreferences}
            />

            <KpiStrip metrics={viewModel.metrics} density={preferences.density} />

            {/* Main content: trend chart column + optional operational sidebar */}
            <div className="flex min-h-0 flex-1 gap-4">

                {/* Left column: trend chart (flex-1) + bottom widgets */}
                <div className="flex min-h-0 flex-1 flex-col gap-4">
                    <div className={`min-h-0 ${bottomWidgets.length > 0 ? 'flex-[3]' : 'flex-1'}`}>
                        <TrendChartCard
                            chartMode={preferences.chartMode}
                            data={viewModel.trendData}
                            summary={viewModel.trendSummary}
                            insights={viewModel.trendInsights}
                            density={preferences.density}
                        />
                    </div>

                    {bottomWidgets.length > 0 && (
                        <div className={`grid min-h-0 flex-[2] gap-4 ${bottomColClass}`}>
                            {bottomWidgets}
                        </div>
                    )}
                </div>

                {/* Right sidebar: operational mix */}
                {preferences.showOperationalMix && (
                    <div className="hidden min-h-0 w-[17rem] shrink-0 xl:block">
                        <OperationalMixCard
                            data={viewModel.operationalData}
                            summary={viewModel.operationalSummary}
                            density={preferences.density}
                        />
                    </div>
                )}
            </div>

            <div
                aria-hidden={!refreshing}
                className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-[32px] backdrop-blur-[2px]"
                style={{
                    background: 'rgba(var(--rgb-bg), 0.58)',
                    opacity: refreshing ? 1 : 0,
                    transition: 'opacity 0.3s var(--ease-out-cubic)',
                }}
            >
                {refreshing && <DashboardLoader label={copy.home.loadingRefreshLabel} />}
            </div>
        </div>
    );
};
