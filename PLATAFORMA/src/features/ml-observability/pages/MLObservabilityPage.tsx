import { useEffect, useRef, useState, useCallback } from 'react';
import { useMLHealth } from '../hooks/useMLHealth';
import { mlApi, type ModelStatus, type SchedulerConfig } from '../api/mlApi';
import { useToast } from '../../../shared/context/ToastContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import { DASHBOARD_COLORS } from '../../home/utils/dashboard';
import {
    BrainCircuit, Zap, Clock, MousePointerClick,
    BarChart2, AlertCircle, RefreshCw, Activity, Play, Target, Trophy,
    Crosshair, CheckCircle2, XCircle, Info, Clock4, Loader2,
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// 8 minutes — RF + GBM + LightFM full training cycle
const TRAINING_LOCK_MS = 8 * 60 * 1000;
const TRAINING_LOCK_KEY = 'smartur_ml_training_lock';
// Poll health every 30 s while training is running
const POLL_INTERVAL_MS = 30_000;

function KpiCard({
    label, value, sub,
    icon: Icon, accent,
}: {
    label: string; value: string; sub?: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    accent: string;
}) {
    return (
        <div
            className="rounded-2xl border p-4 flex items-center gap-4"
            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
        >
            <div
                className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${accent}1a` }}
            >
                <Icon className="size-5" style={{ color: accent }} />
            </div>
            <div className="min-w-0">
                <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                    {value}
                </p>
                <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-alt)' }}>
                    {label}
                </p>
                {sub && (
                    <p className="text-[11px] truncate" style={{ color: 'var(--color-text-alt)' }}>
                        {sub}
                    </p>
                )}
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div
            className="rounded-2xl border h-20 animate-pulse"
            style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
        />
    );
}

function ModelBadge({ label, ready }: { label: string; ready: boolean }) {
    return (
        <div
            className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
            style={{
                borderColor: ready ? `${DASHBOARD_COLORS.success}44` : 'var(--color-border)',
                background: ready ? `${DASHBOARD_COLORS.success}10` : 'var(--color-bg-alt)',
                color: ready ? DASHBOARD_COLORS.success : 'var(--color-text-alt)',
            }}
        >
            {ready
                ? <CheckCircle2 className="size-3 shrink-0" />
                : <XCircle className="size-3 shrink-0" />
            }
            {label}
        </div>
    );
}

export const MLObservabilityPage = () => {
    const { data, isLoading, error, fetchHealth } = useMLHealth();
    const toast = useToast();
    const { lang } = useLanguage();
    const copy = getDashboardText(lang).mlObservability;
    const locale = getDashboardText(lang).locale;

    const trainTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
    const trainingStartRef = useRef<number | null>(null);

    const [training, setTraining] = useState(() => {
        try {
            const ts = localStorage.getItem(TRAINING_LOCK_KEY);
            if (!ts) return false;
            const age = Date.now() - Number(ts);
            if (age >= TRAINING_LOCK_MS) {
                localStorage.removeItem(TRAINING_LOCK_KEY);
                return false;
            }
            return true;
        } catch {
            return false;
        }
    });

    const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    const [schedConfig, setSchedConfig]   = useState<SchedulerConfig | null>(null);
    const [schedEnabled, setSchedEnabled] = useState(false);
    const [schedHour, setSchedHour]       = useState(2);
    const [schedSaving, setSchedSaving]   = useState(false);

    const fetchModelStatus = useCallback(async () => {
        setStatusLoading(true);
        try {
            const s = await mlApi.getModelStatus();
            setModelStatus(s);
        } catch {
            // non-fatal — keep previous status
        } finally {
            setStatusLoading(false);
        }
    }, []);

    const fetchScheduler = useCallback(async () => {
        try {
            const cfg = await mlApi.getSchedulerConfig();
            setSchedConfig(cfg);
            setSchedEnabled(cfg.enabled);
            setSchedHour(cfg.hour);
        } catch { /* non-fatal */ }
    }, []);

    const handleSaveScheduler = async () => {
        setSchedSaving(true);
        try {
            const res = await mlApi.updateSchedulerConfig({ enabled: schedEnabled, hour: schedHour, minute: 0 });
            if (res.ok) {
                await fetchScheduler();
                toast.success(copy.schedulerSaved, '');
            }
        } catch {
            toast.error(copy.schedulerSaveError, '');
        } finally {
            setSchedSaving(false);
        }
    };

    // Release lock + stop polling helper
    const releaseLock = useCallback(() => {
        localStorage.removeItem(TRAINING_LOCK_KEY);
        setTraining(false);
        trainingStartRef.current = null;
        if (trainTimerRef.current)  clearTimeout(trainTimerRef.current);
        if (pollTimerRef.current)   clearInterval(pollTimerRef.current);
        trainTimerRef.current = null;
        pollTimerRef.current  = null;
    }, []);

    // Start polling every 30 s while training; auto-stop when metrics updated
    const startPolling = useCallback((startedAt: number, previousCreatedAt: string | null) => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        pollTimerRef.current = setInterval(async () => {
            try {
                const { getHealth } = mlApi;
                const result = await getHealth();
                // If metrics row is newer than when we started training → done!
                const newCreatedAt = (result.latest_metrics as { created_at?: string } | null)?.created_at ?? null;
                if (newCreatedAt && newCreatedAt !== previousCreatedAt) {
                    releaseLock();
                    // Update health data in the hook — we trigger a fetchHealth to update UI
                    void fetchHealth();
                    void fetchModelStatus();
                }
            } catch { /* ignore polling errors */ }
        }, POLL_INTERVAL_MS);

        // Hard deadline: release lock after TRAINING_LOCK_MS regardless
        trainTimerRef.current = setTimeout(() => {
            releaseLock();
            void fetchHealth();
            void fetchModelStatus();
        }, TRAINING_LOCK_MS - (Date.now() - startedAt));
    }, [releaseLock, fetchHealth, fetchModelStatus]);

    // On mount: restore lock if still active and resume polling
    useEffect(() => {
        void fetchHealth();
        void fetchModelStatus();
        void fetchScheduler();

        try {
            const ts = localStorage.getItem(TRAINING_LOCK_KEY);
            if (!ts) return;
            const startedAt = Number(ts);
            const age = Date.now() - startedAt;
            if (age >= TRAINING_LOCK_MS) {
                releaseLock();
                return;
            }
            trainingStartRef.current = startedAt;
            // Resume polling without knowing the old created_at → use null so any change triggers
            startPolling(startedAt, null);
        } catch { /* ignore */ }

        return () => {
            if (trainTimerRef.current)  clearTimeout(trainTimerRef.current);
            if (pollTimerRef.current)   clearInterval(pollTimerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const metrics        = data?.latest_metrics;
    const sessions       = data?.daily_sessions ?? [];
    const ctr            = data?.ctr_30d;
    const hasAlgorithms  = metrics != null && Object.keys(metrics.algorithms ?? {}).length > 0;
    const ranking        = metrics?.ranking;
    const localBlend     = metrics?.local_blend;

    const bestRmse = hasAlgorithms
        ? Math.min(...Object.values(metrics!.algorithms).map((a) => a.rmse))
        : null;
    const avgLatency =
        sessions.length > 0
            ? (
                sessions.reduce((s, d) => s + parseFloat(d.avg_latency_ms), 0) /
                sessions.length
            ).toFixed(0)
            : null;
    const totalSessions = sessions.reduce((s, d) => s + d.total, 0);
    const ctrPct =
        ctr && ctr.total > 0
            ? ((ctr.clicked / ctr.total) * 100).toFixed(1)
            : null;

    const chartData = [...sessions].reverse().map((d) => ({
        day: new Date(d.day).toLocaleDateString(locale, {
            month: 'short',
            day: 'numeric',
        }),
        sessions: d.total,
        latency: Math.round(parseFloat(d.avg_latency_ms)),
    }));

    const handleTrain = async () => {
        const startedAt = Date.now();
        const previousCreatedAt = (metrics as { created_at?: string } | null)?.created_at ?? null;

        setTraining(true);
        localStorage.setItem(TRAINING_LOCK_KEY, String(startedAt));
        trainingStartRef.current = startedAt;

        startPolling(startedAt, previousCreatedAt);

        try {
            await mlApi.trainModel();
            toast.success(copy.toastTrainTitle, copy.toastTrainDesc);
        } catch {
            toast.error(copy.toastErrorTitle, copy.toastErrorDesc);
            releaseLock();
        }
    };

    if (error) {
        return (
            <div
                className="flex flex-col items-center justify-center gap-3 py-24 rounded-2xl border"
                style={{ borderColor: 'var(--color-border)' }}
            >
                <AlertCircle className="size-10" style={{ color: DASHBOARD_COLORS.danger }} />
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {error}
                </p>
                <button
                    onClick={() => { void fetchHealth(); void fetchModelStatus(); }}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                    style={{ background: 'var(--color-purple)' }}
                >
                    <RefreshCw className="size-4" /> {copy.errorRetry}
                </button>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden" id="ml-module">

            {/* Header */}
            <div className="flex shrink-0 items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                        {copy.title}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        {copy.subtitle}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => void handleTrain()}
                        disabled={training || isLoading}
                        className="flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={training ? copy.trainTooltipActive : copy.trainTooltipIdle}
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                    >
                        {training ? (
                            <>
                                <span className="size-4 shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                {copy.trainingLabel}
                            </>
                        ) : (
                            <>
                                <Play className="size-4" style={{ color: DASHBOARD_COLORS.success }} />
                                {copy.trainBtn}
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => { void fetchHealth(); void fetchModelStatus(); }}
                        disabled={isLoading || statusLoading}
                        className="flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60 disabled:opacity-50"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                    >
                        <RefreshCw className={`size-4 ${(isLoading || statusLoading) ? 'animate-spin' : ''}`} />
                        {copy.refreshBtn}
                    </button>
                </div>
            </div>

            {/* Info banner */}
            <div
                className="shrink-0 rounded-xl border px-5 py-4 flex items-start gap-3"
                style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
            >
                <BrainCircuit className="size-5 mt-0.5 shrink-0" style={{ color: 'var(--color-purple)' }} />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>
                        {copy.bannerTitle}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        {copy.bannerDesc}
                    </p>
                </div>
            </div>

            {/* Scrollable content */}
            <div className="min-h-0 flex-1 overflow-y-auto space-y-4 pr-1">

                {/* Model stack status badges */}
                {(modelStatus || statusLoading) && (
                    <div
                        className="rounded-2xl border p-4"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <Activity className="size-4" style={{ color: 'var(--color-purple)' }} />
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                {copy.modelStatusTitle}
                            </p>
                            {modelStatus && (
                                <span
                                    className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-mono"
                                    style={{ background: 'rgba(var(--rgb-text),0.06)', color: 'var(--color-text-alt)' }}
                                >
                                    {modelStatus.users_count.toLocaleString(locale)} {copy.usersLabel}
                                </span>
                            )}
                        </div>
                        {statusLoading && !modelStatus ? (
                            <div className="flex gap-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-6 w-20 rounded-full animate-pulse"
                                        style={{ background: 'var(--color-bg-alt)' }}
                                    />
                                ))}
                            </div>
                        ) : modelStatus ? (
                            <div className="flex flex-wrap gap-2">
                                <ModelBadge label="CF / SVD" ready={modelStatus.engine_ready && modelStatus.svd_ready} />
                                <ModelBadge label="Random Forest" ready={modelStatus.rf_ready} />
                                <ModelBadge label="Gradient Boosting" ready={modelStatus.gbm_ready} />
                                <ModelBadge label="LightFM WARP" ready={modelStatus.lightfm_ready} />
                                <ModelBadge label="Content TF-IDF" ready={modelStatus.content_ready} />
                            </div>
                        ) : null}
                    </div>
                )}

                {/* Scheduler card */}
                <div
                    className="rounded-2xl border p-4"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Clock4 className="size-4" style={{ color: 'var(--color-purple)' }} />
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                            {copy.schedulerTitle}
                        </p>
                        <span
                            className="ml-auto rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
                            style={{
                                borderColor: schedEnabled ? `${DASHBOARD_COLORS.success}44` : 'var(--color-border)',
                                background: schedEnabled ? `${DASHBOARD_COLORS.success}10` : 'var(--color-bg-alt)',
                                color: schedEnabled ? DASHBOARD_COLORS.success : 'var(--color-text-alt)',
                            }}
                        >
                            {schedEnabled ? copy.schedulerEnabled : copy.schedulerDisabled}
                        </span>
                    </div>

                    {schedConfig?.next_run && (
                        <p className="text-xs mb-3" style={{ color: 'var(--color-text-alt)' }}>
                            {copy.schedulerNextRun}:{' '}
                            <span className="font-mono" style={{ color: 'var(--color-text)' }}>
                                {new Date(schedConfig.next_run).toLocaleString(locale, {
                                    timeZone: 'UTC',
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                })} UTC
                            </span>
                        </p>
                    )}
                    {!schedConfig?.next_run && schedConfig !== null && (
                        <p className="text-xs mb-3" style={{ color: 'var(--color-text-alt)' }}>
                            {copy.schedulerNextRun}: <span style={{ color: 'var(--color-text)' }}>{copy.schedulerNever}</span>
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Toggle */}
                        <button
                            role="switch"
                            aria-checked={schedEnabled}
                            onClick={() => setSchedEnabled(v => !v)}
                            className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
                            style={{
                                background: schedEnabled ? DASHBOARD_COLORS.success : 'var(--color-border)',
                            }}
                        >
                            <span
                                className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                                style={{ transform: schedEnabled ? 'translateX(18px)' : 'translateX(2px)' }}
                            />
                        </button>
                        <label className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                            {copy.schedulerEnabled}
                        </label>

                        {/* Hour picker */}
                        {schedEnabled && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                    {copy.schedulerHour}:
                                </span>
                                <select
                                    value={schedHour}
                                    onChange={(e) => setSchedHour(Number(e.target.value))}
                                    className="rounded-lg border px-2 py-1 text-xs font-mono"
                                    style={{
                                        borderColor: 'var(--color-border)',
                                        background: 'var(--color-bg-alt)',
                                        color: 'var(--color-text)',
                                    }}
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>
                                            {String(i).padStart(2, '0')}:00 UTC
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Save button */}
                        <button
                            onClick={() => void handleSaveScheduler()}
                            disabled={schedSaving}
                            className="ml-auto flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                        >
                            {schedSaving
                                ? <Loader2 className="size-3.5 animate-spin" />
                                : <CheckCircle2 className="size-3.5" style={{ color: DASHBOARD_COLORS.success }} />
                            }
                            {copy.schedulerSave}
                        </button>
                    </div>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                    ) : (
                        <>
                            <KpiCard
                                label={copy.kpiRmse}
                                value={bestRmse != null ? bestRmse.toFixed(3) : '—'}
                                sub={copy.kpiRmseSub}
                                icon={BarChart2}
                                accent={DASHBOARD_COLORS.purple}
                            />
                            <KpiCard
                                label={copy.kpiLatency}
                                value={avgLatency ? `${avgLatency} ms` : '—'}
                                sub={copy.kpiLatencySub}
                                icon={Zap}
                                accent={DASHBOARD_COLORS.warning}
                            />
                            <KpiCard
                                label={copy.kpiSessions}
                                value={String(totalSessions)}
                                sub={copy.kpiSessionsSub}
                                icon={Clock}
                                accent={DASHBOARD_COLORS.success}
                            />
                            <KpiCard
                                label={copy.kpiCtr}
                                value={ctrPct ? `${ctrPct}%` : '—'}
                                sub={
                                    ctr
                                        ? copy.kpiCtrSub(ctr.clicked, ctr.total)
                                        : copy.kpiCtrEmpty
                                }
                                icon={MousePointerClick}
                                accent={DASHBOARD_COLORS.cyan}
                            />
                        </>
                    )}
                </div>

                {/* Sessions chart */}
                {!isLoading && chartData.length > 0 && (
                    <div
                        className="rounded-2xl border p-5"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="size-4" style={{ color: 'var(--color-purple)' }} />
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                {copy.chartTitle}
                            </p>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="mlGradSessions" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={DASHBOARD_COLORS.purple} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={DASHBOARD_COLORS.purple} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-text-alt)' }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-text-alt)' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--color-bg)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        color: 'var(--color-text)',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="sessions"
                                    stroke={DASHBOARD_COLORS.purple}
                                    fill="url(#mlGradSessions)"
                                    strokeWidth={2}
                                    name={copy.chartSessionsName}
                                    dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Algorithm comparison table */}
                {!isLoading && metrics && hasAlgorithms && (
                    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="px-5 py-3 border-b" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                        {copy.tableTitle}
                                    </p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-alt)' }}>
                                        {copy.tableSubtitle(
                                            copy.algoLabels[metrics.best_algorithm] ?? metrics.best_algorithm,
                                            metrics.best_alpha,
                                            metrics.sample_size,
                                        )}
                                    </p>
                                </div>
                                {/* Local blend weights */}
                                {localBlend && (
                                    <div
                                        className="shrink-0 rounded-xl border px-3 py-1.5 text-xs"
                                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                                    >
                                        <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                                            {copy.localBlendTitle}:&nbsp;
                                        </span>
                                        {copy.localBlendRf} {(localBlend.rf * 100).toFixed(1)}%
                                        &nbsp;·&nbsp;
                                        {copy.localBlendGbm} {(localBlend.gbm * 100).toFixed(1)}%
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)' }}>
                                        {[copy.tableColAlgo, copy.tableColRmse, copy.tableColMae, copy.tableColStatus].map((h, i) => (
                                            <th
                                                key={h}
                                                className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${i > 0 && i < 3 ? 'text-right' : i === 3 ? 'text-center' : 'text-left'}`}
                                                style={{ color: 'var(--color-text-alt)' }}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(metrics.algorithms).map(([key, alg]) => {
                                        const isBest = key === metrics.best_algorithm;
                                        return (
                                            <tr
                                                key={key}
                                                className="border-b transition-colors"
                                                style={{ borderColor: 'var(--color-border)' }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-alt)')}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                                                            {copy.algoLabels[key] ?? key}
                                                        </span>
                                                        {isBest && (
                                                            <span
                                                                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                                                style={{
                                                                    background: `${DASHBOARD_COLORS.purple}26`,
                                                                    color: DASHBOARD_COLORS.purple,
                                                                }}
                                                            >
                                                                {copy.tagActive}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td
                                                    className="px-4 py-3 text-right font-mono text-sm"
                                                    style={{
                                                        color: isBest ? DASHBOARD_COLORS.purple : 'var(--color-text)',
                                                        fontWeight: isBest ? 700 : 400,
                                                    }}
                                                >
                                                    {alg.rmse.toFixed(3)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-sm" style={{ color: 'var(--color-text)' }}>
                                                    {alg.mae.toFixed(3)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span
                                                        className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                                                        style={{
                                                            background: isBest
                                                                ? `${DASHBOARD_COLORS.success}1f`
                                                                : 'rgba(var(--rgb-text),0.06)',
                                                            color: isBest
                                                                ? DASHBOARD_COLORS.success
                                                                : 'var(--color-text-alt)',
                                                        }}
                                                    >
                                                        {isBest ? copy.tagProduction : copy.tagReference}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Ranking metrics panel */}
                {!isLoading && ranking && (ranking.ndcg != null || ranking.precision != null || ranking.hit_rate != null) && (
                    <div
                        className="rounded-2xl border p-5"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="size-4" style={{ color: DASHBOARD_COLORS.warning }} />
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                {copy.rankingTitle}
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            {ranking.ndcg != null && (
                                <div
                                    className="rounded-2xl border p-4 flex flex-col gap-1"
                                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
                                >
                                    <div className="flex size-7 items-center justify-center rounded-xl mb-1" style={{ background: `${DASHBOARD_COLORS.purple}18` }}>
                                        <Target className="size-3.5" style={{ color: DASHBOARD_COLORS.purple }} />
                                    </div>
                                    <p className="text-xl font-black tabular-nums" style={{ color: 'var(--color-text)' }}>
                                        {ranking.ndcg.toFixed(3)}
                                    </p>
                                    <p className="text-[11px] font-semibold" style={{ color: 'var(--color-text-alt)' }}>{copy.rankingNdcg}</p>
                                    <p className="text-[10px]" style={{ color: 'var(--color-text-alt)' }}>{copy.rankingNdcgSub}</p>
                                </div>
                            )}
                            {ranking.precision != null && (
                                <div
                                    className="rounded-2xl border p-4 flex flex-col gap-1"
                                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
                                >
                                    <div className="flex size-7 items-center justify-center rounded-xl mb-1" style={{ background: `${DASHBOARD_COLORS.cyan}18` }}>
                                        <Crosshair className="size-3.5" style={{ color: DASHBOARD_COLORS.cyan }} />
                                    </div>
                                    <p className="text-xl font-black tabular-nums" style={{ color: 'var(--color-text)' }}>
                                        {ranking.precision.toFixed(3)}
                                    </p>
                                    <p className="text-[11px] font-semibold" style={{ color: 'var(--color-text-alt)' }}>{copy.rankingPrecision}</p>
                                    <p className="text-[10px]" style={{ color: 'var(--color-text-alt)' }}>{copy.rankingPrecisionSub}</p>
                                </div>
                            )}
                            {ranking.hit_rate != null && (
                                <div
                                    className="rounded-2xl border p-4 flex flex-col gap-1"
                                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
                                >
                                    <div className="flex size-7 items-center justify-center rounded-xl mb-1" style={{ background: `${DASHBOARD_COLORS.success}18` }}>
                                        <Zap className="size-3.5" style={{ color: DASHBOARD_COLORS.success }} />
                                    </div>
                                    <p className="text-xl font-black tabular-nums" style={{ color: 'var(--color-text)' }}>
                                        {(ranking.hit_rate * 100).toFixed(1)}%
                                    </p>
                                    <p className="text-[11px] font-semibold" style={{ color: 'var(--color-text-alt)' }}>{copy.rankingHitRate}</p>
                                    <p className="text-[10px]" style={{ color: 'var(--color-text-alt)' }}>{copy.rankingHitRateSub}</p>
                                </div>
                            )}
                        </div>
                        {/* Explain why NDCG = 0 is expected */}
                        {ranking.ndcg === 0 && ranking.precision === 0 && (
                            <div
                                className="flex items-start gap-2 rounded-xl px-4 py-3 text-xs"
                                style={{
                                    background: `${DASHBOARD_COLORS.warning}12`,
                                    border: `1px solid ${DASHBOARD_COLORS.warning}30`,
                                    color: 'var(--color-text-alt)',
                                }}
                            >
                                <Info className="size-3.5 shrink-0 mt-0.5" style={{ color: DASHBOARD_COLORS.warning }} />
                                {copy.rankingZeroNote}
                            </div>
                        )}
                    </div>
                )}

                {/* Empty state: metrics exist but algorithms is empty */}
                {!isLoading && metrics && !hasAlgorithms && (
                    <div
                        className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl border"
                        style={{ borderColor: 'var(--color-border)' }}
                    >
                        <BarChart2 className="size-10" style={{ color: 'var(--color-border)' }} />
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-alt)' }}>
                            {copy.emptyTitle}
                        </p>
                        <p className="text-xs text-center max-w-sm px-4" style={{ color: 'var(--color-text-alt)' }}>
                            {copy.tableEmptyAlgosHint}
                        </p>
                        <button
                            onClick={() => void handleTrain()}
                            disabled={training}
                            className="mt-1 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: DASHBOARD_COLORS.warning }}
                        >
                            {training ? (
                                <>
                                    <span className="size-4 shrink-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                    {copy.trainingLabel}
                                </>
                            ) : (
                                <>
                                    <Play className="size-4" />
                                    {copy.emptyTrainBtn}
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Empty state when no metrics at all yet */}
                {!isLoading && !metrics && !error && (
                    <div
                        className="flex flex-col items-center justify-center gap-3 py-20 rounded-2xl border"
                        style={{ borderColor: 'var(--color-border)' }}
                    >
                        <BrainCircuit className="size-12" style={{ color: 'var(--color-border)' }} />
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-alt)' }}>
                            {copy.emptyTitle}
                        </p>
                        <p className="text-xs text-center max-w-xs" style={{ color: 'var(--color-text-alt)' }}>
                            {copy.emptyHint}
                        </p>
                        <button
                            onClick={() => void handleTrain()}
                            disabled={training}
                            className="mt-2 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: DASHBOARD_COLORS.success }}
                        >
                            {training ? (
                                <>
                                    <span className="size-4 shrink-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                    {copy.trainingLabel}
                                </>
                            ) : (
                                <>
                                    <Play className="size-4" />
                                    {copy.emptyTrainBtn}
                                </>
                            )}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};
