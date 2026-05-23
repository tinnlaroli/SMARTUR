import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { dashboardApi, type DashboardStats } from './api/dashboardApi';
import {
    DashboardHeader,
    DashboardLoadingShell,
    DashboardPreferencesPanel,
    KpiStrip,
    OperationalMixCard,
    RecentActivityCard,
    ScoreDistributionCard,
    TopCompaniesCard,
    TopServicesCard,
    TrendChartCard,
    UserDistributionCard,
} from './components/DashboardWidgets';
import { WidgetGrid } from './components/WidgetGrid';
import { WidgetCatalog } from './components/WidgetCatalog';
import { useDashboardPreferences } from './hooks/useDashboardPreferences';
import { useWidgetGrid } from './hooks/useWidgetGrid';
import { DASHBOARD_COLORS, deriveDashboardViewModel } from './utils/dashboard';
import { useLanguage } from '../../contexts/LanguageContext';
import { getDashboardText } from '../../shared/i18n/dashboardLocale';
import MLTelemetryWidget from './widgets/MLTelemetryWidget';
import CoverageWidget from './widgets/CoverageWidget';
import LangSwitchWidget from './widgets/LangSwitchWidget';
import B2BFunnelWidget from './widgets/B2BFunnelWidget';

/* ── Loading spinner ────────────────────────────────────────────────── */
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

/* ── Main component ─────────────────────────────────────────────────── */
export const Home = () => {
    const { lang } = useLanguage();
    const copy = getDashboardText(lang);

    /* Data state */
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preferencesOpen, setPreferencesOpen] = useState(false);

    /* Preferences (chart mode, density, time range) */
    const { preferences, setChartMode, setDensity, setTimeRange, toggleWidget, resetPreferences } =
        useDashboardPreferences();

    /* Widget grid state (instances, edit mode, catalog) */
    const {
        instances,
        isEditing,
        catalogOpen,
        activeWidgetIds,
        addWidget,
        removeWidget,
        moveWidget,
        resizeWidget,
        toggleEditing,
        openCatalog,
        closeCatalog,
        resetGrid,
    } = useWidgetGrid();

    /* ── Data fetching ─────────────────────────────────────────────── */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── View model derivation ─────────────────────────────────────── */
    const viewModel = useMemo(
        () => (stats ? deriveDashboardViewModel(stats, lang, preferences.timeRange) : null),
        [lang, stats, preferences.timeRange],
    );

    /* ── Widget renderer ───────────────────────────────────────────── */
    const renderWidget = useCallback(
        (widgetId: string): ReactNode => {
            const { density, chartMode, timeRange } = preferences;

            // Skeleton while loading
            if (!viewModel || !stats) {
                return (
                    <div
                        className="flex h-full items-center justify-center rounded-[28px] border sy-shimmer-pulse"
                        style={{
                            background: 'var(--color-bg)',
                            borderColor: 'var(--color-border)',
                        }}
                    />
                );
            }

            switch (widgetId) {
                case 'kpi-strip':
                    return <KpiStrip metrics={viewModel.metrics} density={density} />;

                case 'trend-chart':
                    return (
                        <TrendChartCard
                            chartMode={chartMode}
                            data={viewModel.trendData}
                            summary={viewModel.trendSummary}
                            insights={viewModel.trendInsights}
                            density={density}
                            timeRange={timeRange}
                        />
                    );

                case 'operational-mix':
                    return (
                        <OperationalMixCard
                            data={viewModel.operationalData}
                            summary={viewModel.operationalSummary}
                            density={density}
                        />
                    );

                case 'top-services':
                    return (
                        <TopServicesCard
                            services={viewModel.topServices}
                            summary={viewModel.topServicesSummary}
                            density={density}
                        />
                    );

                case 'user-distribution':
                    return (
                        <UserDistributionCard
                            data={viewModel.distributionData}
                            totalUsers={stats.total_users}
                            summary={viewModel.distributionSummary}
                            density={density}
                        />
                    );

                case 'recent-activity':
                    return (
                        <RecentActivityCard
                            activity={viewModel.recentActivity}
                            summary={viewModel.activitySummary}
                            density={density}
                        />
                    );

                case 'score-distribution':
                    return (
                        <ScoreDistributionCard
                            data={viewModel.scoreRangeBands}
                            summary={viewModel.scoreRangeSummary}
                            density={density}
                        />
                    );

                case 'top-companies':
                    return (
                        <TopCompaniesCard
                            companies={viewModel.topCompanies}
                            summary={viewModel.topCompaniesSummary}
                            density={density}
                        />
                    );

                /* ── New widgets ─────────────────────────────────── */
                case 'ml-telemetry':
                    return <MLTelemetryWidget density={density} />;

                case 'coverage':
                    return <CoverageWidget stats={stats} density={density} />;

                case 'lang-switch':
                    return <LangSwitchWidget />;

                case 'b2b-funnel':
                    return <B2BFunnelWidget stats={stats} density={density} />;

                default:
                    return null;
            }
        },
        [viewModel, stats, preferences],
    );

    /* ── Loading state ─────────────────────────────────────────────── */
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

    /* ── Error state ───────────────────────────────────────────────── */
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
        <div className="relative flex flex-col gap-4">
            {/* Click-away to close preferences panel */}
            {preferencesOpen && (
                <button
                    type="button"
                    aria-label={copy.home.closePreferences}
                    className="absolute inset-0 z-10 cursor-default"
                    onClick={() => setPreferencesOpen(false)}
                />
            )}

            {/* ── Header ──────────────────────────────────────────── */}
            <DashboardHeader
                onRefresh={() => { void fetchStats('refresh'); }}
                refreshing={refreshing}
                preferencesOpen={preferencesOpen}
                onTogglePreferences={() => setPreferencesOpen((c) => !c)}
                isEditing={isEditing}
                onToggleEditing={toggleEditing}
                onOpenCatalog={openCatalog}
                onResetGrid={resetGrid}
            />

            {/* ── Preferences panel ───────────────────────────────── */}
            <DashboardPreferencesPanel
                open={preferencesOpen}
                preferences={preferences}
                onChartModeChange={setChartMode}
                onDensityChange={setDensity}
                onTimeRangeChange={setTimeRange}
                onToggleWidget={toggleWidget}
                onReset={resetPreferences}
            />

            {/* ── Widget grid ─────────────────────────────────────── */}
            <WidgetGrid
                instances={instances}
                isEditing={isEditing}
                renderWidget={renderWidget}
                onRemove={removeWidget}
                onMove={moveWidget}
                onResize={resizeWidget}
            />

            {/* ── Widget catalog drawer ────────────────────────────── */}
            <WidgetCatalog
                open={catalogOpen}
                onClose={closeCatalog}
                activeWidgetIds={activeWidgetIds}
                onAdd={addWidget}
            />

            {/* ── Refresh overlay ─────────────────────────────────── */}
            <div
                aria-hidden={!refreshing}
                className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center backdrop-blur-[2px]"
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
