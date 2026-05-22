import { useEffect, useRef, useState } from 'react';
import { useMLHealth } from '../hooks/useMLHealth';
import { mlApi } from '../api/mlApi';
import { useToast } from '../../../shared/context/ToastContext';
import {
    BrainCircuit, Zap, Clock, MousePointerClick,
    BarChart2, AlertCircle, RefreshCw, Activity, Play,
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const ALGO_LABELS: Record<string, string> = {
    baseline: 'Baseline (media global)',
    cf_knn_pearson: 'CF Pearson KNN',
    random_forest: 'Random Forest',
    gradient_boosting: 'Gradient Boosting',
    hybrid_cf_rf: 'Híbrido CF + RF',
    hybrid_triple: 'Híbrido Triple',
};

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
    const trainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
            }, remaining);
        } catch { /* ignore */ }

        return () => {
            if (trainTimerRef.current) clearTimeout(trainTimerRef.current);
        };
    }, []);

    useEffect(() => { fetchHealth(); }, [fetchHealth]);

    const metrics = data?.latest_metrics;
    const sessions = data?.daily_sessions ?? [];
    const ctr = data?.ctr_30d;

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
        day: new Date(d.day).toLocaleDateString('es-MX', {
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

        // Auto-release after 3 minutes regardless
        if (trainTimerRef.current) clearTimeout(trainTimerRef.current);
        trainTimerRef.current = setTimeout(() => {
            localStorage.removeItem(TRAINING_LOCK_KEY);
            setTraining(false);
        }, TRAINING_LOCK_MS);

        try {
            await mlApi.trainModel();
            toast.success('Entrenamiento iniciado', 'El modelo está re-entrenando en segundo plano. El botón se habilitará automáticamente en ~3 minutos. Usa "Actualizar" para ver los nuevos resultados.');
        } catch {
            toast.error('Error', 'No se pudo iniciar el entrenamiento.');
            // Release lock on failure
            if (trainTimerRef.current) clearTimeout(trainTimerRef.current);
            localStorage.removeItem(TRAINING_LOCK_KEY);
            setTraining(false);
        }
        // Note: setTraining(false) NOT called on success — timer handles it
    };

    if (error) {
        return (
            <div
                className="flex flex-col items-center justify-center gap-3 py-24 rounded-2xl border"
                style={{ borderColor: 'var(--color-border)' }}
            >
                <AlertCircle className="size-10 text-rose-400" />
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {error}
                </p>
                <button
                    onClick={fetchHealth}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                    style={{ background: 'var(--color-purple)' }}
                >
                    <RefreshCw className="size-4" /> Reintentar
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
                        ML / Observabilidad IA
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        Estado del motor de recomendaciones híbrido (CF + RF)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleTrain}
                        disabled={training || isLoading}
                        className="flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={training ? 'Entrenamiento en curso — espera ~3 minutos antes de volver a entrenar' : 'Entrenar modelo'}
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                    >
                        {training ? (
                            <>
                                <span className="size-4 shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                Entrenando en segundo plano…
                            </>
                        ) : (
                            <>
                                <Play className="size-4" style={{ color: 'var(--color-green)' }} />
                                Entrenar modelo
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
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Info banner — at top */}
            <div
                className="shrink-0 rounded-xl border px-5 py-4 flex items-start gap-3"
                style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
            >
                <BrainCircuit className="size-5 mt-0.5 shrink-0" style={{ color: 'var(--color-purple)' }} />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>
                        Recolección de datos activa
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        La app móvil envía señales implícitas (tiempo en pantalla, favoritos, filtros
                        seleccionados) y calificaciones explícitas (1–5 estrellas). Estos datos alimentan el
                        motor de Collaborative Filtering. El modelo se retroalimenta automáticamente al
                        re-entrenarse con las tablas{' '}
                        <code className="rounded px-1 py-0.5 text-xs font-mono" style={{ background: 'rgba(var(--rgb-text),0.08)' }}>
                            user_interaction
                        </code>{' '}
                        y{' '}
                        <code className="rounded px-1 py-0.5 text-xs font-mono" style={{ background: 'rgba(var(--rgb-text),0.08)' }}>
                            user_rating
                        </code>.
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
                                label="Mejor RMSE almacenado"
                                value={bestRmse != null ? bestRmse.toFixed(3) : '—'}
                                sub="Menor = mejor predicción"
                                icon={BarChart2}
                                accent="var(--color-purple)"
                            />
                            <KpiCard
                                label="Latencia promedio (30d)"
                                value={avgLatency ? `${avgLatency} ms` : '—'}
                                sub="Por solicitud de recomendación"
                                icon={Zap}
                                accent="#f59e0b"
                            />
                            <KpiCard
                                label="Sesiones totales (30d)"
                                value={String(totalSessions)}
                                sub="Solicitudes de recomendación"
                                icon={Clock}
                                accent="#10b981"
                            />
                            <KpiCard
                                label="Click-through rate (30d)"
                                value={ctrPct ? `${ctrPct}%` : '—'}
                                sub={
                                    ctr
                                        ? `${ctr.clicked} clicks / ${ctr.total} recomendaciones`
                                        : 'Sin datos aún'
                                }
                                icon={MousePointerClick}
                                accent="#6366f1"
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
                                Sesiones de recomendación — últimos 30 días
                            </p>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="mlGradSessions" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-purple)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--color-purple)" stopOpacity={0} />
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
                                <Area type="monotone" dataKey="sessions" stroke="var(--color-purple)" fill="url(#mlGradSessions)" strokeWidth={2} name="Sesiones" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Algorithm comparison table */}
                {!isLoading && metrics && (
                    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="px-5 py-3 border-b" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                Comparación de algoritmos
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-alt)' }}>
                                En producción:{' '}
                                <strong>{ALGO_LABELS[metrics.best_algorithm] ?? metrics.best_algorithm}</strong>{' '}
                                · α = {metrics.best_alpha}
                                {metrics.sample_size && ` · n = ${metrics.sample_size.toLocaleString()}`}
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)' }}>
                                        {['Algoritmo', 'RMSE ↓', 'MAE ↓', 'Estado'].map((h, i) => (
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
                                                            {ALGO_LABELS[key] ?? key}
                                                        </span>
                                                        {isBest && (
                                                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--color-purple)' }}>
                                                                ACTIVO
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-sm" style={{ color: isBest ? 'var(--color-purple)' : 'var(--color-text)', fontWeight: isBest ? 700 : 400 }}>
                                                    {alg.rmse.toFixed(3)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-sm" style={{ color: 'var(--color-text)' }}>
                                                    {alg.mae.toFixed(3)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span
                                                        className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                                                        style={{
                                                            background: isBest ? 'rgba(16,185,129,0.12)' : 'rgba(var(--rgb-text),0.06)',
                                                            color: isBest ? '#10b981' : 'var(--color-text-alt)',
                                                        }}
                                                    >
                                                        {isBest ? 'En producción' : 'Referencia'}
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
                    <div className="flex flex-col items-center justify-center gap-3 py-20 rounded-2xl border" style={{ borderColor: 'var(--color-border)' }}>
                        <BrainCircuit className="size-12" style={{ color: 'var(--color-border)' }} />
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-alt)' }}>
                            Sin métricas almacenadas
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                            Las métricas aparecerán la primera vez que el MODELO entrene y persista
                            su estado en{' '}
                            <code className="font-mono">models/algorithm_metrics.json</code>
                        </p>
                        <button
                            onClick={handleTrain}
                            disabled={training}
                            className="mt-2 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: 'var(--color-green)' }}
                        >
                            {training ? (
                                <>
                                    <span className="size-4 shrink-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                    Entrenando…
                                </>
                            ) : (
                                <>
                                    <Play className="size-4" />
                                    Iniciar primer entrenamiento
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
