import React, { useEffect, useState } from 'react';
import { Activity, BrainCircuit, MousePointerClick, Timer, Zap } from 'lucide-react';
import { mlApi, type MLHealth } from '../../ml-observability/api/mlApi';
import { DASHBOARD_COLORS } from '../utils/dashboard';
import type { DensityMode } from '../utils/dashboard';

interface Props {
    density: DensityMode;
}

const cardSurface = {
    background: 'var(--color-bg)',
    borderColor: 'var(--color-border)',
} as const;

const cardPadding = (density: DensityMode) => (density === 'compact' ? 'p-4' : 'p-5');

/** Compact metric cell used inside the widget */
const MetricCell: React.FC<{
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
}> = ({ icon: Icon, label, value, color }) => (
    <div
        className="flex min-w-0 flex-1 flex-col items-start gap-1.5 rounded-2xl border p-3"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
    >
        <div className="flex size-7 items-center justify-center rounded-xl" style={{ background: `${color}18` }}>
            <Icon className="size-3.5" style={{ color }} />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-widest truncate w-full" style={{ color: 'var(--color-text-alt)' }}>
            {label}
        </p>
        <p className="text-lg font-black leading-none tabular-nums" style={{ color: 'var(--color-text)' }}>
            {value}
        </p>
    </div>
);

/**
 * Dashboard widget — pulls live ML health data from `/ml/health`.
 * Shows: best algorithm, RMSE, click-through rate (30d) and avg inference latency.
 */
const MLTelemetryWidget: React.FC<Props> = ({ density }) => {
    const [health, setHealth] = useState<MLHealth | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        mlApi
            .getHealth()
            .then((data) => {
                if (!cancelled) { setHealth(data); setLoading(false); }
            })
            .catch(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    // Derived values
    const algo     = health?.latest_metrics?.best_algorithm ?? '—';
    const rmse     = health?.latest_metrics
        ? (health.latest_metrics.algorithms[health.latest_metrics.best_algorithm]?.rmse ?? 0).toFixed(3)
        : '—';
    const ctrTotal   = health?.ctr_30d?.total ?? 0;
    const ctrClicked = health?.ctr_30d?.clicked ?? 0;
    const ctr = ctrTotal > 0 ? `${((ctrClicked / ctrTotal) * 100).toFixed(1)}%` : '—';
    const latestSession = health?.daily_sessions?.[0];
    const latency = latestSession
        ? `${Number(latestSession.avg_latency_ms).toFixed(0)} ms`
        : '—';

    return (
        <section
            className={`rounded-[28px] border ${cardPadding(density)} h-full flex flex-col shadow-[0_10px_35px_rgba(15,23,42,0.06)] overflow-hidden`}
            style={cardSurface}
        >
            {/* Header */}
            <div className="mb-3 flex items-center gap-2.5 shrink-0">
                <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: `${DASHBOARD_COLORS.purple}16` }}
                >
                    <BrainCircuit className="size-4" style={{ color: DASHBOARD_COLORS.purple }} />
                </div>
                <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                        Telemetría IA
                    </h2>
                    <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                        Motor de recomendaciones
                    </p>
                </div>
                {/* Live indicator */}
                <div className="ml-auto flex items-center gap-1.5 shrink-0">
                    <span
                        className="size-1.5 rounded-full animate-pulse"
                        style={{ background: health ? DASHBOARD_COLORS.success : DASHBOARD_COLORS.warning }}
                    />
                    <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-alt)' }}>
                        {health ? algo : loading ? 'cargando…' : 'sin datos'}
                    </span>
                </div>
            </div>

            {/* Metrics row */}
            <div className="flex min-h-0 flex-1 gap-2">
                <MetricCell
                    icon={Activity}
                    label="RMSE"
                    value={loading ? '…' : rmse}
                    color={DASHBOARD_COLORS.purple}
                />
                <MetricCell
                    icon={MousePointerClick}
                    label="CTR 30d"
                    value={loading ? '…' : ctr}
                    color={DASHBOARD_COLORS.cyan}
                />
                <MetricCell
                    icon={Timer}
                    label="Latencia"
                    value={loading ? '…' : latency}
                    color={DASHBOARD_COLORS.green}
                />
                <MetricCell
                    icon={Zap}
                    label="Sesiones"
                    value={loading ? '…' : (health?.daily_sessions?.[0]?.total?.toLocaleString('es-MX') ?? '—')}
                    color={DASHBOARD_COLORS.orange}
                />
            </div>
        </section>
    );
};

export default MLTelemetryWidget;
