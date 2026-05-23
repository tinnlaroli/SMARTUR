import { useEffect, useRef, useState } from 'react';
import { useMLHealth } from '../hooks/useMLHealth';
import { mlApi } from '../api/mlApi';
import { useToast } from '../../../shared/context/ToastContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import { DASHBOARD_COLORS } from '../../home/utils/dashboard';
import {
    BrainCircuit, Zap, Clock, MousePointerClick,
    BarChart2, AlertCircle, RefreshCw, Activity, Play,
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

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

const TRAINING_LOCK_KEY = 'smartur_ml_training_lock';
const TRAINING_LOCK_MS = 3 * 60 * 1000; // 3 minutes — typical training window

export const MLObservabilityPage = () => {
    const { data, isLoading, error, fetchHealth } = useMLHealth();
    const toast = useToast();
    const { lang } = useLanguage();
    const copy = getDashboardText(lang).mlObservability;
    const locale = getDashboardText(lang).locale;

    const trainTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autoRefreshRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // Auto-expire lock based on remaining time
    useEffect(() => {
        try {
            const ts = localStorage.getItem(TRAINING_LOCK_KEY);
            if (!ts) return;
            const age = Date.now() - Number(ts);
            const remaining = TRAINING_LOCK_MS - age;
            if (remaining <= 0) {
                localStorage.removeItem(TRAINING_LOCK_KEY);
                setTraining(false);
                return;
            }
            trainTimerRef.current = setTimeout(() => {
                localStorage.removeItem(TRAINING_LOCK_KEY);
                setTraining(false);
                // Auto-refresh when lock expires (training should be done)
                void fetchHealth();
            }, remaining);
        } catch { /* ignore */ }

        return () => {
            if (trainTimerRef.current)  clearTimeout(trainTimerRef.current);
            if (autoRefreshRef.current) clearTimeout(autoRefreshRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { fetchHealth(); }, [fetchHealth]);

    const metrics    = data?.latest_metrics;
    const sessions   = data?.daily_sessions ?? [];
    const ctr        = data?.ctr_30d;

    const bestRmse = metrics
        ? Math.min(...Object.values(metrics.algorithms).map((a) => a.rmse))
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
        setTraining(true);
        const lockTime = Date.now();
        localStorage.setItem(TRAINING_LOCK_KEY, String(lockTime));

        // Release lock after 3 minutes and auto-refresh data
        if (trainTimerRef.current) clearTimeout(trainTimerRef.current);
        trainTimerRef.current = setTimeout(() => {
            localStorage.removeItem(TRAINING_LOCK_KEY);
            setTraining(false);
            void fetchHealth(); // auto-refresh when training window closes
        }, TRAINING_LOCK_MS);

        try {
            await mlApi.trainModel();
            toast.success(copy.toastTrainTitle, copy.toastTrainDesc);
        } catch {
            toast.error(copy.toastErrorTitle, copy.toastErrorDesc);
            // Release lock immediately on failure
            if (trainTimerRef.current) clearTimeout(trainTimerRef.current);
            localStorage.removeItem(TRAINING_LOCK_KEY);
            setTraining(false);
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
                    onClick={fetchHealth}
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
                        onClick={handleTrain}
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
                        onClick={fetchHealth}
                        disabled={isLoading}
                        className="flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60 disabled:opacity-50"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                    >
                        <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
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
                        {copy.bannerDesc.split('user_interaction').map((part, i, arr) =>
                            i < arr.length - 1 ? (
                                <span key={i}>
                                    {part}
                                    <code className="rounded px-1 py-0.5 text-xs font-mono" style={{ background: 'rgba(var(--rgb-text),0.08)' }}>
                                        user_interaction
                                    </code>
                                </span>
                            ) : (
                                <span key={i}>
                                    {part.split('user_rating').map((p2, j, arr2) =>
                                        j < arr2.length - 1 ? (
                                            <span key={j}>
                                                {p2}
                                                <code className="rounded px-1 py-0.5 text-xs font-mono" style={{ background: 'rgba(var(--rgb-text),0.08)' }}>
                                                    user_rating
                                                </code>
                                            </span>
                                        ) : (
                                            <span key={j}>{p2}</span>
                                        )
                                    )}
                                </span>
                            )
                        )}
                    </p>
                </div>
            </div>

            {/* Scrollable content */}
            <div className="min-h-0 flex-1 overflow-y-auto space-y-4 pr-1">

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
                {!isLoading && metrics && (
                    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="px-5 py-3 border-b" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
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

                {/* Empty state when no metrics yet */}
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
                            onClick={handleTrain}
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
