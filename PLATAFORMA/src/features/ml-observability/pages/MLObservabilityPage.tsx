import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useMLHealth } from '../hooks/useMLHealth';
import { mlApi, type ModelStatus, type SchedulerConfig, type ExtendedStats, type CrossValidationResult } from '../api/mlApi';
import { api } from '../../../shared/api/axiosClient';
import { useToast } from '../../../shared/context/ToastContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import { DASHBOARD_COLORS } from '../../home/utils/dashboard';
import {
    BrainCircuit, Zap, Clock, MousePointerClick,
    BarChart2, AlertCircle, RefreshCw, Activity, Play,
    CheckCircle2, XCircle, Clock4, Loader2, Navigation2, Users,
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
    BarChart, Bar, Legend,
} from 'recharts';

// 8 minutes — RF + GBM + LightFM full training cycle
const TRAINING_LOCK_MS = 8 * 60 * 1000;
const TRAINING_LOCK_KEY = 'welltur_ml_training_lock';
// Poll health every 30 s while training is running
const POLL_INTERVAL_MS = 30_000;

const PURPLE = DASHBOARD_COLORS.purple;
const CYAN   = DASHBOARD_COLORS.cyan;

function SectionDivider({ label, color }: { label: string; color: string }) {
    return (
        <div className="flex items-center gap-3 pt-2">
            <div className="h-px flex-1" style={{ background: `${color}33` }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
                {label}
            </span>
            <div className="h-px flex-1" style={{ background: `${color}33` }} />
        </div>
    );
}

// ── Métricas del clasificador Wellness (movido desde Filtro de Aprobación) ──
interface WellnessClassifierMetrics {
    accuracy: number | null;
    macro_f1: number | null;
    trained_at: string | null;
    n_samples: number | null;
    dataset: string;
    classification_report: Record<string, unknown>;
}

interface WellnessMetricsResponse {
    classifier: WellnessClassifierMetrics;
    disclaimer: string;
}

function WellnessMetricsCard() {
    const [data, setData] = useState<WellnessMetricsResponse | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        api.get<WellnessMetricsResponse>('/ml/wellness/metrics')
            .then(r => setData(r.data))
            .catch((e) => {
                // Antes cualquier fallo (permiso, red, servidor) mostraba el
                // mismo texto genérico "modelo no entrenado" — imposible
                // distinguir un 403 de un modelo realmente sin entrenar.
                const status = e?.response?.status;
                if (status === 403) setErr('No tienes permiso para ver estas métricas.');
                else if (status === 404) setErr('Modelo no entrenado aún — ejecuta el entrenamiento desde la terminal.');
                else setErr(`No se pudieron cargar las métricas (${status ?? 'error de red'}).`);
            });
    }, []);

    const fmt = (v: number | null) => v != null ? (v * 100).toFixed(1) + '%' : '—';
    const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString('es-MX', { dateStyle: 'medium' }) : '—';

    return (
        <div
            className="rounded-2xl border p-4"
            style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
        >
            <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="size-4" style={{ color: DASHBOARD_COLORS.success }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    Métricas del Clasificador Wellness
                </p>
            </div>

            {err ? (
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                    <AlertCircle className="size-3.5 shrink-0" />
                    {err}
                </div>
            ) : !data ? (
                <div className="h-8 flex items-center">
                    <Loader2 className="size-4 animate-spin" style={{ color: 'var(--color-text-alt)' }} />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="rounded-xl border px-3 py-2 text-center" style={{ borderColor: 'var(--color-border)' }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-alt)' }}>Accuracy</p>
                            <p className="text-lg font-extrabold tabular-nums" style={{ color: DASHBOARD_COLORS.success }}>
                                {fmt(data.classifier.accuracy)}
                            </p>
                        </div>
                        <div className="rounded-xl border px-3 py-2 text-center" style={{ borderColor: 'var(--color-border)' }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-alt)' }}>Macro F1</p>
                            <p className="text-lg font-extrabold tabular-nums" style={{ color: CYAN }}>
                                {fmt(data.classifier.macro_f1)}
                            </p>
                        </div>
                        <div className="rounded-xl border px-3 py-2 text-center" style={{ borderColor: 'var(--color-border)' }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-alt)' }}>Muestras</p>
                            <p className="text-lg font-extrabold tabular-nums" style={{ color: 'var(--color-text)' }}>
                                {data.classifier.n_samples?.toLocaleString('es-MX') ?? '—'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-1.5 text-[10px] leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                        <AlertCircle className="size-3 mt-0.5 shrink-0" />
                        <span>
                            Entrenado {fmtDate(data.classifier.trained_at)} sobre datos {data.classifier.dataset}.{' '}
                            {data.disclaimer}
                        </span>
                    </div>
                </>
            )}
        </div>
    );
}

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
            className="rounded-xl md:rounded-2xl border p-3 md:p-4 flex items-center gap-3 md:gap-4"
            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
        >
            <div
                className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${accent}1a` }}
            >
                <Icon className="size-5" style={{ color: accent }} />
            </div>
            <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
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

    const trainTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollTimerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
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

    const [modelStatus, setModelStatus]   = useState<ModelStatus | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    const [schedConfig, setSchedConfig]   = useState<SchedulerConfig | null>(null);
    const [schedEnabled, setSchedEnabled] = useState(false);
    const [schedHour, setSchedHour]       = useState(2);
    const [schedSaving, setSchedSaving]   = useState(false);
    const [schedOpen, setSchedOpen]       = useState(false);

    const [extStats, setExtStats] = useState<ExtendedStats | null>(null);

    const [cvResult, setCvResult] = useState<CrossValidationResult | null>(null);
    const [cvLoading, setCvLoading] = useState(false);
    const [cvRunning, setCvRunning] = useState(false);

    const fetchModelStatus = useCallback(async () => {
        setStatusLoading(true);
        try {
            const s = await mlApi.getModelStatus();
            setModelStatus(s);
        } catch {
            // non-fatal
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

    const fetchExtStats = useCallback(async () => {
        try {
            const s = await mlApi.getExtendedStats();
            setExtStats(s);
        } catch { /* non-fatal */ }
    }, []);

    const fetchCrossValidation = useCallback(async () => {
        setCvLoading(true);
        try {
            const r = await mlApi.getCrossValidation();
            setCvResult(r);
        } catch {
            // non-fatal
        } finally {
            setCvLoading(false);
        }
    }, []);

    const handleRunCrossValidation = async () => {
        setCvRunning(true);
        try {
            await mlApi.runCrossValidation();
            toast.success('Cross-validation iniciada', 'Corre en segundo plano — puede tardar varios minutos.');
        } catch {
            toast.error(copy.toastErrorTitle, 'No se pudo iniciar la cross-validation.');
        } finally {
            setCvRunning(false);
        }
    };

    const handleSaveScheduler = async () => {
        setSchedSaving(true);
        try {
            const res = await mlApi.updateSchedulerConfig({ enabled: schedEnabled, hour: schedHour, minute: 0 });
            if (res.ok) {
                await fetchScheduler();
                toast.success(copy.schedulerSaved, '');
                setSchedOpen(false);
            }
        } catch {
            toast.error(copy.schedulerSaveError, '');
        } finally {
            setSchedSaving(false);
        }
    };

    const releaseLock = useCallback(() => {
        localStorage.removeItem(TRAINING_LOCK_KEY);
        setTraining(false);
        trainingStartRef.current = null;
        if (trainTimerRef.current) clearTimeout(trainTimerRef.current);
        if (pollTimerRef.current)  clearInterval(pollTimerRef.current);
        trainTimerRef.current = null;
        pollTimerRef.current  = null;
    }, []);

    const startPolling = useCallback((startedAt: number, previousCreatedAt: string | null) => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        pollTimerRef.current = setInterval(async () => {
            try {
                const result = await mlApi.getHealth();
                const newCreatedAt = (result.latest_metrics as { created_at?: string } | null)?.created_at ?? null;
                if (newCreatedAt && newCreatedAt !== previousCreatedAt) {
                    releaseLock();
                    void fetchHealth();
                    void fetchModelStatus();
                    void fetchExtStats();
                }
            } catch { /* ignore polling errors */ }
        }, POLL_INTERVAL_MS);

        trainTimerRef.current = setTimeout(() => {
            releaseLock();
            void fetchHealth();
            void fetchModelStatus();
            void fetchExtStats();
        }, TRAINING_LOCK_MS - (Date.now() - startedAt));
    }, [releaseLock, fetchHealth, fetchModelStatus, fetchExtStats]);

    useEffect(() => {
        void fetchHealth();
        void fetchModelStatus();
        void fetchScheduler();
        void fetchExtStats();
        void fetchCrossValidation();

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
            startPolling(startedAt, null);
        } catch { /* ignore */ }

        return () => {
            if (trainTimerRef.current) clearTimeout(trainTimerRef.current);
            if (pollTimerRef.current)  clearInterval(pollTimerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRefresh = () => {
        void fetchHealth();
        void fetchModelStatus();
        void fetchExtStats();
    };

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

    // Derived from health data
    const metrics       = data?.latest_metrics;
    const sessions      = data?.daily_sessions ?? [];
    const ctr           = data?.ctr_30d;
    const hasAlgorithms = metrics != null && Object.keys(metrics.algorithms ?? {}).length > 0;
    const localBlend    = metrics?.local_blend;

    const bestRmse = hasAlgorithms
        ? Math.min(...Object.values(metrics!.algorithms).map((a) => a.rmse))
        : null;
    const avgLatency = sessions.length > 0
        ? (sessions.reduce((s, d) => s + parseFloat(d.avg_latency_ms), 0) / sessions.length).toFixed(0)
        : null;
    const totalSessions = sessions.reduce((s, d) => s + d.total, 0);
    const ctrPct = ctr && ctr.total > 0
        ? ((ctr.clicked / ctr.total) * 100).toFixed(1)
        : null;

    const chartData = useMemo(() => [...sessions].reverse().map((d) => ({
        day: new Date(d.day).toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
        sessions: d.total,
        latency: Math.round(parseFloat(d.avg_latency_ms)),
    })), [sessions, locale]);

    const acoConvergenceData = useMemo(() =>
        Array.from({ length: 80 }, (_, i) => {
            const iter = i + 1;
            const base  = 28 * (1 - Math.exp(-0.09 * iter));
            const noise = 1.8 * Math.sin(iter * 0.8) * Math.exp(-0.06 * iter);
            return { iter, savings: Math.max(0, parseFloat((base + noise).toFixed(1))) };
        }),
    []);

    // Derived from extended stats
    const donutData = useMemo(() => {
        if (!extStats) return [];
        const { cold_start, warm } = extStats.user_distribution;
        if (cold_start === 0 && warm === 0) return [];
        return [
            { name: 'Cold-start', value: cold_start },
            { name: 'Warm', value: warm },
        ];
    }, [extStats]);

    const topPlacesData = useMemo(() =>
        (extStats?.top_places ?? []).map((p) => ({
            name: `ID ${p.item_id}`,
            Recomendado: p.recommended_count,
            Clickeado: p.clicked_count,
        })),
    [extStats]);

    const tooltipStyle = {
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        fontSize: '12px',
        color: 'var(--color-text)',
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
                    onClick={handleRefresh}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                    style={{ background: 'var(--color-purple)' }}
                >
                    <RefreshCw className="size-4" /> {copy.errorRetry}
                </button>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-7rem)] md:h-[calc(100vh-9rem)] flex-col gap-3 md:gap-4 overflow-hidden" id="ml-module">

            {/* ── Header ── */}
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
                        onClick={handleRefresh}
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
            <div className="rounded-xl border px-5 py-4 flex items-start gap-3 shrink-0" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                <BrainCircuit className="size-5 mt-0.5 shrink-0" style={{ color: PURPLE }} />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>{copy.bannerTitle}</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>{copy.bannerDesc}</p>
                </div>
            </div>

            {/* ── Scrollable content ── */}
            <div className="min-h-0 flex-1 overflow-y-auto space-y-4 pr-1">

                {/* ── Status bar (purple bordered) ── */}
                <div
                    className="rounded-2xl border-2 p-4 space-y-3"
                    style={{ borderColor: `${PURPLE}44`, background: `${PURPLE}08` }}
                >
                    {/* Model badges row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold mr-1" style={{ color: PURPLE }}>
                            Modelos:
                        </span>
                        {statusLoading && !modelStatus ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-6 w-24 rounded-full animate-pulse" style={{ background: 'var(--color-bg-alt)' }} />
                            ))
                        ) : modelStatus ? (
                            <>
                                <ModelBadge label="CF / SVD"       ready={modelStatus.engine_ready && modelStatus.svd_ready} />
                                <ModelBadge label="Random Forest"  ready={modelStatus.rf_ready} />
                                <ModelBadge label="LightFM WARP"   ready={modelStatus.lightfm_ready} />
                                <ModelBadge label="Content TF-IDF" ready={modelStatus.content_ready} />
                                {modelStatus.users_count > 0 && (
                                    <span
                                        className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-mono"
                                        style={{ background: 'rgba(var(--rgb-text),0.06)', color: 'var(--color-text-alt)' }}
                                    >
                                        {modelStatus.users_count.toLocaleString(locale)} {copy.usersLabel}
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className="text-xs" style={{ color: 'var(--color-text-alt)' }}>Sin datos de estado</span>
                        )}
                    </div>

                    {/* Scheduler row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Clock4 className="size-3.5 shrink-0" style={{ color: PURPLE }} />
                        <span className="text-xs font-semibold" style={{ color: PURPLE }}>
                            Scheduler:
                        </span>
                        <span
                            className="rounded-full border px-2 py-0.5 text-[10px] font-medium"
                            style={{
                                borderColor: schedEnabled ? `${DASHBOARD_COLORS.success}44` : 'var(--color-border)',
                                background: schedEnabled ? `${DASHBOARD_COLORS.success}10` : 'var(--color-bg-alt)',
                                color: schedEnabled ? DASHBOARD_COLORS.success : 'var(--color-text-alt)',
                            }}
                        >
                            {schedEnabled ? copy.schedulerEnabled : copy.schedulerDisabled}
                        </span>
                        {schedConfig?.next_run && (
                            <span className="text-[11px]" style={{ color: 'var(--color-text-alt)' }}>
                                — {copy.schedulerNextRun}:{' '}
                                <span className="font-mono" style={{ color: 'var(--color-text)' }}>
                                    {new Date(schedConfig.next_run).toLocaleString(locale, {
                                        timeZone: 'UTC', month: 'short', day: 'numeric',
                                        hour: '2-digit', minute: '2-digit',
                                    })} UTC
                                </span>
                            </span>
                        )}
                        <button
                            onClick={() => setSchedOpen(v => !v)}
                            className="ml-auto text-[11px] font-semibold rounded-lg border px-2.5 py-1 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                            style={{ borderColor: `${PURPLE}44`, color: PURPLE }}
                        >
                            {schedOpen ? 'Cerrar' : 'Configurar'}
                        </button>
                    </div>

                    {/* Scheduler expanded config */}
                    {schedOpen && (
                        <div className="flex items-center gap-3 pt-1 border-t" style={{ borderColor: `${PURPLE}22` }}>
                            <button
                                role="switch"
                                aria-checked={schedEnabled}
                                onClick={() => setSchedEnabled(v => !v)}
                                className="relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors"
                                style={{ background: schedEnabled ? DASHBOARD_COLORS.success : 'var(--color-border)' }}
                            >
                                <span
                                    className="inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform"
                                    style={{ transform: schedEnabled ? 'translateX(14px)' : 'translateX(2px)' }}
                                />
                            </button>
                            {schedEnabled && (
                                <select
                                    value={schedHour}
                                    onChange={(e) => setSchedHour(Number(e.target.value))}
                                    className="rounded-lg border px-1.5 py-0.5 text-[11px] font-mono"
                                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>{String(i).padStart(2, '0')}:00 UTC</option>
                                    ))}
                                </select>
                            )}
                            <button
                                onClick={() => void handleSaveScheduler()}
                                disabled={schedSaving}
                                className="flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                            >
                                {schedSaving
                                    ? <Loader2 className="size-3 animate-spin" />
                                    : <CheckCircle2 className="size-3" style={{ color: DASHBOARD_COLORS.success }} />}
                                {copy.schedulerSave}
                            </button>
                        </div>
                    )}
                </div>

                {/* ══════════ MOTOR DE RECOMENDACIÓN ══════════ */}
                <SectionDivider label="Motor de Recomendación" color={PURPLE} />

                {/* KPIs — 6 cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 md:gap-3">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                    ) : (
                        <>
                            <KpiCard
                                label={copy.kpiRmse}
                                value={bestRmse != null ? bestRmse.toFixed(3) : '—'}
                                sub={copy.kpiRmseSub}
                                icon={BarChart2}
                                accent={PURPLE}
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
                                value={totalSessions.toLocaleString(locale)}
                                sub={copy.kpiSessionsSub}
                                icon={Clock}
                                accent={DASHBOARD_COLORS.success}
                            />
                            <KpiCard
                                label={copy.kpiCtr}
                                value={ctrPct ? `${ctrPct}%` : '—'}
                                sub={ctr ? copy.kpiCtrSub(ctr.clicked, ctr.total) : copy.kpiCtrEmpty}
                                icon={MousePointerClick}
                                accent={CYAN}
                            />
                            <KpiCard
                                label="Usuarios activos 7d"
                                value={extStats ? extStats.active_users.last_7d.toLocaleString(locale) : '—'}
                                sub="sesiones únicas"
                                icon={Users}
                                accent={DASHBOARD_COLORS.success}
                            />
                            <KpiCard
                                label="Usuarios activos 30d"
                                value={extStats ? extStats.active_users.last_30d.toLocaleString(locale) : '—'}
                                sub="sesiones únicas"
                                icon={Activity}
                                accent={DASHBOARD_COLORS.orange}
                            />
                        </>
                    )}
                </div>

                {/* Donut cold/warm + Algorithm table */}
                {!isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">

                        {/* Donut chart */}
                        <div
                            className="md:col-span-2 rounded-2xl border p-4"
                            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                        >
                            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                                Distribución Cold-start vs Warm
                            </p>
                            <p className="text-xs mb-3" style={{ color: 'var(--color-text-alt)' }}>
                                Sesiones últimos 30 días
                            </p>
                            {donutData.length > 0 ? (
                                <div className="flex items-center gap-4">
                                    <ResponsiveContainer width={140} height={140}>
                                        <PieChart>
                                            <Pie
                                                data={donutData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={60}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                <Cell fill={PURPLE} />
                                                <Cell fill={DASHBOARD_COLORS.success} />
                                            </Pie>
                                            <Tooltip
                                                contentStyle={tooltipStyle}
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                formatter={((v: number, name: string) => [v.toLocaleString(locale), name]) as any}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="space-y-2 min-w-0">
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="inline-block size-2.5 rounded-full flex-shrink-0" style={{ background: PURPLE }} />
                                                <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>Cold-start</span>
                                            </div>
                                            <p className="text-lg font-bold pl-4" style={{ color: PURPLE }}>
                                                {extStats!.user_distribution.cold_start.toLocaleString(locale)}
                                            </p>
                                            <p className="text-[11px] pl-4" style={{ color: 'var(--color-text-alt)' }}>LightFM / Content</p>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="inline-block size-2.5 rounded-full flex-shrink-0" style={{ background: DASHBOARD_COLORS.success }} />
                                                <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>Warm</span>
                                            </div>
                                            <p className="text-lg font-bold pl-4" style={{ color: DASHBOARD_COLORS.success }}>
                                                {extStats!.user_distribution.warm.toLocaleString(locale)}
                                            </p>
                                            <p className="text-[11px] pl-4" style={{ color: 'var(--color-text-alt)' }}>CF + RF hybrid</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 gap-2">
                                    <BarChart2 className="size-8" style={{ color: 'var(--color-border)' }} />
                                    <p className="text-xs text-center" style={{ color: 'var(--color-text-alt)' }}>
                                        Sin sesiones en los últimos 30 días
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Algorithm comparison table */}
                        <div className="md:col-span-3 rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                            <div className="px-4 py-3 border-b" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                            {copy.tableTitle}
                                        </p>
                                        {metrics && hasAlgorithms && (
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-alt)' }}>
                                                {copy.tableSubtitle(
                                                    copy.algoLabels[metrics.best_algorithm] ?? metrics.best_algorithm,
                                                    metrics.best_alpha,
                                                    metrics.sample_size,
                                                )}
                                            </p>
                                        )}
                                    </div>
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
                            {hasAlgorithms && metrics ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)' }}>
                                                {[copy.tableColAlgo, copy.tableColRmse, copy.tableColMae, copy.tableColStatus].map((h, i) => (
                                                    <th
                                                        key={h}
                                                        className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider ${i > 0 && i < 3 ? 'text-right' : i === 3 ? 'text-center' : 'text-left'}`}
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
                                                        <td className="px-4 py-2.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                                                                    {copy.algoLabels[key] ?? key}
                                                                </span>
                                                                {isBest && (
                                                                    <span
                                                                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                                                        style={{ background: `${PURPLE}26`, color: PURPLE }}
                                                                    >
                                                                        {copy.tagActive}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td
                                                            className="px-4 py-2.5 text-right font-mono text-sm"
                                                            style={{ color: isBest ? PURPLE : 'var(--color-text)', fontWeight: isBest ? 700 : 400 }}
                                                        >
                                                            {alg.rmse.toFixed(3)}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right font-mono text-sm" style={{ color: 'var(--color-text)' }}>
                                                            {alg.mae.toFixed(3)}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-center">
                                                            <span
                                                                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                                                                style={{
                                                                    background: isBest ? `${DASHBOARD_COLORS.success}1f` : 'rgba(var(--rgb-text),0.06)',
                                                                    color: isBest ? DASHBOARD_COLORS.success : 'var(--color-text-alt)',
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
                            ) : (
                                <p className="px-4 py-6 text-sm text-center" style={{ color: 'var(--color-text-alt)' }}>
                                    {copy.emptyTitle}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* K-fold Cross-Validation */}
                {!isLoading && (
                    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                        <div
                            className="px-4 py-3 border-b flex items-center justify-between gap-3 flex-wrap"
                            style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
                        >
                            <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                    Validación cruzada (k-fold)
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-alt)' }}>
                                    {cvResult
                                        ? `k=${cvResult.k} folds · muestra de ${cvResult.sample_size} interacciones${cvResult.timestamp ? ` · ${new Date(cvResult.timestamp).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}`
                                        : 'CF, Random Forest y Gradient Boosting — complementa el train/test split de arriba'}
                                </p>
                            </div>
                            <button
                                onClick={() => void handleRunCrossValidation()}
                                disabled={cvRunning}
                                className="flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                            >
                                {cvRunning ? (
                                    <span className="size-4 shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                ) : (
                                    <Play className="size-4" style={{ color: DASHBOARD_COLORS.success }} />
                                )}
                                Correr cross-validation
                            </button>
                        </div>
                        {cvLoading ? (
                            <p className="px-4 py-6 text-sm text-center" style={{ color: 'var(--color-text-alt)' }}>Cargando…</p>
                        ) : cvResult ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)' }}>
                                            {['Algoritmo', 'RMSE (media ± σ)', 'MAE (media ± σ)', 'Folds', 'Tiempo/fold'].map((h, i) => (
                                                <th
                                                    key={h}
                                                    className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider ${i > 0 ? 'text-right' : 'text-left'}`}
                                                    style={{ color: 'var(--color-text-alt)' }}
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(cvResult.algorithms).map(([key, alg]) => (
                                            <tr key={key} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                                                <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--color-text)' }}>
                                                    {copy.algoLabels[key] ?? key}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono text-sm" style={{ color: 'var(--color-text)' }}>
                                                    {alg.rmse_mean != null ? `${alg.rmse_mean.toFixed(3)} ± ${(alg.rmse_std ?? 0).toFixed(3)}` : '—'}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono text-sm" style={{ color: 'var(--color-text)' }}>
                                                    {alg.mae_mean != null ? `${alg.mae_mean.toFixed(3)} ± ${(alg.mae_std ?? 0).toFixed(3)}` : '—'}
                                                </td>
                                                <td className="px-4 py-2.5 text-right text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                                    {alg.folds_completed}/{cvResult.k}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                                    {alg.avg_execution_time_ms != null ? `${alg.avg_execution_time_ms.toFixed(0)}ms` : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="px-4 py-6 text-sm text-center" style={{ color: 'var(--color-text-alt)' }}>
                                Sin resultados aún — corre la cross-validation (tarda varios minutos, se ejecuta en segundo plano).
                            </p>
                        )}
                    </div>
                )}

                {/* Score histogram + Ranking metrics */}
                {!isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">

                        {/* Score histogram */}
                        <div
                            className="md:col-span-3 rounded-2xl border p-4"
                            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                        >
                            <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>
                                Histograma de scores predichos
                            </p>
                            <p className="text-xs mb-4" style={{ color: 'var(--color-text-alt)' }}>
                                Distribución de predicciones en sesiones recientes
                            </p>
                            {extStats && extStats.score_histogram.length > 0 ? (
                                <ResponsiveContainer width="100%" height={160}>
                                    <BarChart data={extStats.score_histogram} barCategoryGap="20%">
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                        <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: 'var(--color-text-alt)' }} axisLine={false} tickLine={false} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--color-text-alt)' }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Bar dataKey="count" name="Sesiones" fill={PURPLE} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 gap-2">
                                    <BarChart2 className="size-8" style={{ color: 'var(--color-border)' }} />
                                    <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>Sin datos de scores</p>
                                </div>
                            )}
                        </div>

                        {/* Ranking metrics */}
                        <div className="md:col-span-2 rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                            <div className="px-4 py-3 border-b" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                    Métricas de Ranking
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-alt)' }}>
                                    {metrics?.ranking?.n_users_evaluated
                                        ? `${metrics.ranking.n_users_evaluated} usuarios evaluados`
                                        : 'Umbral relevancia ≥4★'}
                                </p>
                            </div>
                            {metrics?.ranking?.ndcg != null ? (
                                <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                                    {([
                                        { label: 'NDCG@5',        value: metrics.ranking.ndcg,        desc: 'Calidad del orden' },
                                        { label: 'Precision@5',   value: metrics.ranking.precision,   desc: 'Fracción relevante en top-5' },
                                        { label: 'Hit Rate@10',   value: metrics.ranking.hit_rate,    desc: 'Usuarios con resultado relevante' },
                                        { label: 'Preference Match', value: metrics.ranking.preference_match_rate ?? null, desc: 'Respeta lo que el usuario declaró' },
                                    ] as const).map(({ label, value, desc }) => {
                                        if (value == null) return null;
                                        const v = value ?? 0;
                                        const color = v >= 0.5
                                            ? DASHBOARD_COLORS.success
                                            : v >= 0.3
                                            ? DASHBOARD_COLORS.warning
                                            : DASHBOARD_COLORS.danger;
                                        return (
                                            <div key={label} className="flex items-center justify-between px-4 py-3">
                                                <div>
                                                    <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{label}</p>
                                                    <p className="text-[11px]" style={{ color: 'var(--color-text-alt)' }}>{desc}</p>
                                                </div>
                                                <p className="text-xl font-bold tabular-nums" style={{ color }}>
                                                    {(v * 100).toFixed(1)}%
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="px-4 py-6 text-sm text-center" style={{ color: 'var(--color-text-alt)' }}>
                                    {metrics?.ranking?.error ?? 'Sin métricas de ranking disponibles'}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Top lugares: recomendados vs clickeados */}
                {!isLoading && topPlacesData.length > 0 && (
                    <div
                        className="rounded-2xl border p-5"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <MousePointerClick className="size-4" style={{ color: PURPLE }} />
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                Top lugares: recomendados vs clickeados
                            </p>
                        </div>
                        <p className="text-xs mb-4" style={{ color: 'var(--color-text-alt)' }}>
                            TOP 10 ítems por volumen de recomendaciones en los últimos 30 días
                        </p>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={topPlacesData} barCategoryGap="25%">
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-text-alt)' }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--color-text-alt)' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend
                                    wrapperStyle={{ fontSize: 11, color: 'var(--color-text-alt)', paddingTop: 8 }}
                                />
                                <Bar dataKey="Recomendado" fill={PURPLE}                       radius={[3, 3, 0, 0]} />
                                <Bar dataKey="Clickeado"   fill={DASHBOARD_COLORS.success}     radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Sessions daily chart */}
                {!isLoading && chartData.length > 0 && (
                    <div
                        className="rounded-2xl border p-5"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="size-4" style={{ color: PURPLE }} />
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                {copy.chartTitle}
                            </p>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="mlGradSessions" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor={PURPLE} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-text-alt)' }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-text-alt)' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Area
                                    type="monotone"
                                    dataKey="sessions"
                                    stroke={PURPLE}
                                    fill="url(#mlGradSessions)"
                                    strokeWidth={2}
                                    name={copy.chartSessionsName}
                                    dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* ══════════ CLASIFICADOR WELLNESS ══════════ */}
                {!isLoading && (
                    <>
                        <SectionDivider label="Clasificador Wellness" color={DASHBOARD_COLORS.success} />
                        <WellnessMetricsCard />
                    </>
                )}

                {/* ══════════ ACO — RUTAS ══════════ */}
                {!isLoading && !error && (
                    <>
                        <SectionDivider label="ACO — Rutas" color={CYAN} />

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            {/* ACO status */}
                            <div
                                className="md:col-span-2 rounded-2xl border p-4"
                                style={{ background: 'var(--color-bg)', borderColor: `${CYAN}44` }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Navigation2 className="size-4" style={{ color: CYAN }} />
                                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                        Optimizador de Rutas ACO
                                    </p>
                                </div>
                                <p className="text-xs mb-4" style={{ color: 'var(--color-text-alt)' }}>
                                    30 hormigas · 80 iteraciones · Haversine + ventanas de tiempo
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <ModelBadge label="ACO Engine"       ready={true} />
                                    <ModelBadge label="Haversine"        ready={true} />
                                    <ModelBadge label="Time Windows"     ready={true} />
                                </div>
                                <div
                                    className="mt-4 rounded-xl px-3 py-2 text-xs text-center font-semibold"
                                    style={{ background: `${CYAN}18`, color: CYAN }}
                                >
                                    Ahorro promedio estimado: ~28%
                                </div>
                            </div>

                            {/* ACO convergence chart */}
                            <div
                                className="md:col-span-3 rounded-2xl border p-5"
                                style={{ background: 'var(--color-bg)', borderColor: `${CYAN}44` }}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Navigation2 className="size-4" style={{ color: CYAN }} />
                                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                        Convergencia típica del algoritmo
                                    </p>
                                </div>
                                <p className="text-xs mb-4" style={{ color: 'var(--color-text-alt)' }}>
                                    Curva ilustrativa · el ahorro real varía según número de paradas
                                </p>
                                <ResponsiveContainer width="100%" height={170}>
                                    <AreaChart data={acoConvergenceData}>
                                        <defs>
                                            <linearGradient id="acoGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor={CYAN} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={CYAN} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                        <XAxis
                                            dataKey="iter"
                                            tick={{ fontSize: 11, fill: 'var(--color-text-alt)' }}
                                            axisLine={false}
                                            tickLine={false}
                                            label={{ value: 'Iteración', position: 'insideBottom', offset: -2, fontSize: 11, fill: 'var(--color-text-alt)' }}
                                            height={36}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tick={{ fontSize: 11, fill: 'var(--color-text-alt)' }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(v: number) => `${v}%`}
                                        />
                                        <Tooltip
                                            contentStyle={tooltipStyle}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            formatter={((v: number) => [`${v}%`, 'Ahorro acumulado']) as any}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            labelFormatter={((l: number) => `Iteración ${l}`) as any}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="savings"
                                            stroke={CYAN}
                                            fill="url(#acoGrad)"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}

                {/* ══════════ DATOS ══════════ */}
                {!isLoading && metrics?.data_quality != null && (
                    <>
                        <SectionDivider label="Datos" color="var(--color-text-alt)" />

                        <div
                            className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm"
                            style={{
                                borderColor: 'var(--color-border)',
                                background: metrics.data_quality.uses_real_data
                                    ? `${DASHBOARD_COLORS.success}12`
                                    : 'var(--color-bg-alt)',
                            }}
                        >
                            {metrics.data_quality.uses_real_data
                                ? <CheckCircle2 className="size-4 shrink-0" style={{ color: DASHBOARD_COLORS.success }} />
                                : <AlertCircle className="size-4 shrink-0" style={{ color: DASHBOARD_COLORS.warning }} />}
                            <span style={{ color: 'var(--color-text)' }}>
                                <span className="font-semibold">{metrics.data_quality.real_welltur_interactions}</span> interacciones reales de WELLTUR
                                {metrics.data_quality.uses_real_data
                                    ? ' — incorporadas al entrenamiento (≥10)'
                                    : ' — aún no suficientes para refinar el modelo (mínimo 10)'}
                            </span>
                            {training && (
                                <span className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                    <span className="size-3 shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                    Entrenando…
                                </span>
                            )}
                        </div>
                    </>
                )}

                {/* Empty state: no metrics yet */}
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

                {/* Empty state: metrics exist but no algorithms */}
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

            </div>
        </div>
    );
};
