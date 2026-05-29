import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { DashboardHeader, DashboardLoadingShell } from '../../home/components/DashboardWidgets';
import { WidgetCatalog } from '../../home/components/WidgetCatalog';
import { WidgetGrid } from '../../home/components/WidgetGrid';
import { DASHBOARD_COLORS } from '../../home/utils/dashboard';
import { useUserPreferences } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import { empresaApi, type AnalyticsResponse, type EmpresaProfile } from '../api/empresaApi';
import {
    EmpresaEngagementTrendCard,
    EmpresaKpiStrip,
    EmpresaProfileCard,
    EmpresaQualityScoreCard,
    EmpresaQuickActionsCard,
    EmpresaStatusBanner,
    EmpresaTopServicesCard,
} from '../dashboard/components/EmpresaDashboardWidgets';
import { useEmpresaDashboardPreferences } from '../dashboard/hooks/useEmpresaDashboardPreferences';
import { useEmpresaWidgetGrid } from '../dashboard/hooks/useEmpresaWidgetGrid';
import { deriveEmpresaDashboardViewModel } from '../dashboard/utils/empresaDashboard';
import {
    EMPRESA_WIDGET_REGISTRY,
    EMPRESA_WIDGET_REGISTRY_MAP,
} from '../dashboard/widgets/empresaWidgetRegistry';
import LangSwitchWidget from '../../home/widgets/LangSwitchWidget';

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

export function EmpresaDashboardPage() {
    const { user, lang } = useUserPreferences();
    const copy = getDashboardText(lang);

    const [profile, setProfile] = useState<EmpresaProfile | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { preferences } = useEmpresaDashboardPreferences();
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
    } = useEmpresaWidgetGrid();

    const fetchData = async (mode: 'initial' | 'refresh' = 'initial') => {
        if (mode === 'refresh' && profile && analytics) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);
        try {
            const [profileRes, analyticsRes] = await Promise.all([
                empresaApi.getProfile(),
                empresaApi.getAnalytics(),
            ]);
            setProfile(profileRes.company);
            setAnalytics(analyticsRes);
        } catch {
            setError('dashboard-error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        void fetchData('initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const viewModel = useMemo(
        () => (profile && analytics ? deriveEmpresaDashboardViewModel(profile, analytics) : null),
        [profile, analytics],
    );

    const headerTitle = `Bienvenido, ${user?.name?.split(' ')[0] ?? 'Empresa'}`;
    const headerSubtitle = profile
        ? `${profile.name}${profile.location_name ? ` · ${profile.location_name}` : ''} — KPIs de engagement y servicios de tu empresa.`
        : 'KPIs de engagement y servicios disenados para leerse rapido, sin depender de scroll.';

    const renderWidget = useCallback(
        (widgetId: string): ReactNode => {
            const { density } = preferences;

            if (!viewModel || !profile) {
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
                    return <EmpresaKpiStrip metrics={viewModel.metrics} density={density} />;

                case 'engagement-trend':
                    return (
                        <EmpresaEngagementTrendCard
                            data={viewModel.trendData}
                            summary={viewModel.trendSummary}
                            insights={viewModel.trendInsights}
                            density={density}
                        />
                    );

                case 'top-services':
                    return (
                        <EmpresaTopServicesCard
                            services={viewModel.topServices}
                            summary={viewModel.topServicesSummary}
                            density={density}
                        />
                    );

                case 'company-profile':
                    return <EmpresaProfileCard profile={profile} density={density} />;

                case 'quick-actions':
                    return <EmpresaQuickActionsCard density={density} />;

                case 'quality-score':
                    return (
                        <EmpresaQualityScoreCard
                            score={viewModel.qualityScore}
                            summary={viewModel.qualitySummary}
                            density={density}
                        />
                    );

                case 'status-banner':
                    return viewModel.showStatusBanner ? (
                        <EmpresaStatusBanner message={viewModel.statusMessage} />
                    ) : (
                        <EmptyWidgetPlaceholder message="Tu empresa esta activa. Este aviso solo aparece en revision o suspension." />
                    );

                case 'lang-switch':
                    return <LangSwitchWidget />;

                default:
                    return null;
            }
        },
        [preferences, profile, viewModel],
    );

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

    if (error && (!profile || !analytics)) {
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
                        onClick={() => { void fetchData('initial'); }}
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

    if (!profile || !analytics || !viewModel) return null;

    return (
        <div className="relative flex flex-col gap-4">
            <DashboardHeader
                title={headerTitle}
                subtitle={headerSubtitle}
                onRefresh={() => { void fetchData('refresh'); }}
                refreshing={refreshing}
                isEditing={isEditing}
                onToggleEditing={toggleEditing}
                onOpenCatalog={openCatalog}
                onResetGrid={resetGrid}
            />

            <WidgetGrid
                instances={instances}
                registryMap={EMPRESA_WIDGET_REGISTRY_MAP}
                isEditing={isEditing}
                renderWidget={renderWidget}
                onRemove={removeWidget}
                onMove={moveWidget}
                onResize={resizeWidget}
            />

            <WidgetCatalog
                open={catalogOpen}
                onClose={closeCatalog}
                activeWidgetIds={activeWidgetIds}
                onAdd={addWidget}
                registry={EMPRESA_WIDGET_REGISTRY}
            />

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
}

function EmptyWidgetPlaceholder({ message }: { message: string }) {
    return (
        <div
            className="flex h-full items-center justify-center rounded-[28px] border p-6 text-center"
            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
        >
            <p className="max-w-sm text-sm" style={{ color: 'var(--color-text-alt)' }}>
                {message}
            </p>
        </div>
    );
}
