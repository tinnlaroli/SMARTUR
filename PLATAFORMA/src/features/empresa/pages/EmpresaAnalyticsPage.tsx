import { useEffect, useMemo, useState, type CSSProperties, type ComponentType } from 'react';
import {
    TrendingUp,
    Star,
    BarChart3,
    Award,
    AlertCircle,
    Activity,
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { empresaApi, type AnalyticsResponse } from '../api/empresaApi';
import { MODULE_COLORS } from '../../../shared/config/moduleColors';
import { DATA_TABLE_SHELL_CLASS, TableBadge, TABLE_BADGE_COLORS } from '../../../components/ui/DataTable';
import {
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableHead,
    DataTableHeadCell,
    DataTableRow,
    DataTableScroll,
    DataTableShell,
} from '../../../components/ui/DataTable';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';

function KpiCard({
    label, value, icon: Icon, color,
}: {
    label: string;
    value: string | number;
    icon: ComponentType<{ size?: number; style?: CSSProperties }>;
    color: string;
}) {
    return (
        <div
            className="rounded-2xl border p-5"
            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
        >
            <div className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}1a` }}>
                <Icon size={20} style={{ color }} />
            </div>
            <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {value === null || value === undefined ? '—' : String(value)}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>{label}</p>
                </div>
            </div>
        </div>
    );
}

export function EmpresaAnalyticsPage() {
    const [data, setData] = useState<AnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        empresaApi.getAnalytics()
            .then(setData)
            .catch(() => setError('Error al cargar analytics.'))
            .finally(() => setLoading(false));
    }, []);

    const summary = data?.summary;
    const topServicios = data?.top_servicios ?? [];
    const timeline30d = data?.timeline_30d ?? [];
    const evalScore = summary?.evaluacion_score != null ? Number(summary.evaluacion_score) : null;
    const avgRating = summary?.avg_rating != null ? Number(summary.avg_rating).toFixed(1) : '—';
    const hasData = timeline30d.length > 0 || topServicios.length > 0;
    const interactionTotal = useMemo(
        () => timeline30d.reduce((acc, row) => acc + row.interacciones, 0),
        [timeline30d],
    );

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            <div className="shrink-0">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                    Analytics
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                    Monitorea recomendaciones, favoritos, visitas y calidad percibida de tus servicios.
                </p>
            </div>

            <div
                className="flex shrink-0 items-start gap-3 rounded-xl border px-5 py-4"
                style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
            >
                <Activity className="mt-0.5 size-5 shrink-0" style={{ color: MODULE_COLORS.services }} />
                <div>
                    <p className="mb-0.5 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        Rendimiento de servicios
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        Estos indicadores reflejan el interes real de los turistas y te ayudan a priorizar mejoras.
                    </p>
                </div>
            </div>

            {loading && (
                <div className="grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-24 animate-pulse rounded-2xl border"
                            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                        />
                    ))}
                </div>
            )}

            {!loading && !error && summary && (
                <div className="grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-4">
                    <KpiCard label="Recomendaciones ML" value={summary.total_recomendaciones} icon={TrendingUp} color="#9CCC44" />
                    <KpiCard label="Favoritos" value={summary.total_favoritos} icon={Star} color="#FF7D1F" />
                    <KpiCard label="Visitas" value={summary.total_visitas} icon={BarChart3} color="#4DB9CA" />
                    <KpiCard label="Rating promedio" value={avgRating} icon={Award} color="var(--color-purple)" />
                </div>
            )}

            {error && !loading && (
                <div className={`${DATA_TABLE_SHELL_CLASS} flex flex-1 flex-col items-center justify-center gap-3`}>
                    <AlertCircle className="size-8 text-rose-400" />
                    <p className="text-sm font-medium text-rose-500">{error}</p>
                </div>
            )}

            {!loading && !error && !hasData && (
                <div
                    className="flex h-full flex-col items-center justify-center gap-4 rounded-lg border p-12 text-center"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                >
                    <div
                        className="flex size-14 items-center justify-center rounded-2xl"
                        style={{ background: `${MODULE_COLORS.services}18` }}
                    >
                        <BarChart3 size={24} style={{ color: MODULE_COLORS.services }} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                            Sin datos de engagement por ahora
                        </p>
                        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                            Cuando los turistas interactuen con tus servicios, aqui veras su rendimiento.
                        </p>
                    </div>
                </div>
            )}

            {!loading && !error && hasData && (
                <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-5">
                    <div className="flex min-h-0 flex-col gap-4 xl:col-span-3">
                        <div
                            className="rounded-2xl border p-5"
                            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                        >
                            <p className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                Interacciones - ultimos 30 dias
                            </p>
                            {timeline30d.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={timeline30d} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                                        <defs>
                                            <linearGradient id="grad_emp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={MODULE_COLORS.services} stopOpacity={0.25} />
                                                <stop offset="95%" stopColor={MODULE_COLORS.services} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--rgb-text), 0.08)" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fill: 'var(--color-text-alt)', fontSize: 10 }}
                                            tickFormatter={(v: string) => v.slice(5)}
                                        />
                                        <YAxis tick={{ fill: 'var(--color-text-alt)', fontSize: 10 }} />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'var(--color-bg-alt)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 12,
                                            }}
                                            labelStyle={{ color: 'var(--color-text-alt)', fontSize: 11 }}
                                            itemStyle={{ color: MODULE_COLORS.services }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="interacciones"
                                            stroke={MODULE_COLORS.services}
                                            strokeWidth={2}
                                            fill="url(#grad_emp)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                    Aun no hay actividad para graficar.
                                </p>
                            )}
                        </div>

                        <DataTableShell className="h-full">
                            {topServicios.length === 0 ? (
                                <div className="flex h-full items-center justify-center p-6 text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                    No hay servicios con engagement registrado.
                                </div>
                            ) : (
                                <DataTableScroll>
                                    <DataTable>
                                        <DataTableHead>
                                            <tr>
                                                <DataTableHeadCell className="w-14">#</DataTableHeadCell>
                                                <DataTableHeadCell>Servicio</DataTableHeadCell>
                                                <DataTableHeadCell className="w-28">Favoritos</DataTableHeadCell>
                                                <DataTableHeadCell className="w-24">Visitas</DataTableHeadCell>
                                                <DataTableHeadCell className="w-24">Rating</DataTableHeadCell>
                                                <DataTableHeadCell className="w-36">Recomendaciones</DataTableHeadCell>
                                            </tr>
                                        </DataTableHead>
                                        <DataTableBody>
                                            {topServicios.map((svc, index) => (
                                                <DataTableRow key={svc.id_service} index={index}>
                                                    <DataTableCell className="w-14">
                                                        <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                                                            {index + 1}
                                                        </span>
                                                    </DataTableCell>
                                                    <DataTableCell>
                                                        <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                                            {svc.name}
                                                        </span>
                                                    </DataTableCell>
                                                    <DataTableCell className="w-28">{svc.favorites}</DataTableCell>
                                                    <DataTableCell className="w-24">{svc.visits}</DataTableCell>
                                                    <DataTableCell className="w-24">
                                                        {svc.rating != null ? (
                                                            <TableBadge
                                                                text={svc.rating.toFixed(1)}
                                                                color={TABLE_BADGE_COLORS.amber}
                                                            />
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </DataTableCell>
                                                    <DataTableCell className="w-36">{svc.recomendaciones}</DataTableCell>
                                                </DataTableRow>
                                            ))}
                                        </DataTableBody>
                                    </DataTable>
                                </DataTableScroll>
                            )}
                        </DataTableShell>
                    </div>

                    <div className="flex min-h-0 flex-col gap-4 xl:col-span-2">
                        <div
                            className="rounded-2xl border p-5"
                            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                        >
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                Resumen ejecutivo
                            </p>
                            <div className="mt-4 space-y-3 text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                <p>
                                    Total de interacciones en 30 dias:{' '}
                                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                                        {interactionTotal}
                                    </span>
                                </p>
                                <p>
                                    Servicios activos:{' '}
                                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                                        {summary?.total_servicios_activos ?? 0}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {evalScore !== null ? (
                            <div
                                className="rounded-2xl border p-5"
                                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                        <Award size={15} style={{ color: MODULE_COLORS.services }} />
                                        Evaluacion de calidad SMARTUR
                                    </p>
                                    <span className="font-bold" style={{ color: MODULE_COLORS.services }}>
                                        {evalScore}/100
                                    </span>
                                </div>
                                <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--color-bg-alt)' }}>
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(evalScore, 100)}%`,
                                            background: `linear-gradient(90deg, ${MODULE_COLORS.services}, var(--color-orange))`,
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div
                                className="rounded-2xl border p-5 text-sm"
                                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                            >
                                Aun no hay score de calidad disponible para tu empresa.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {loading && (
                <div className="min-h-0 flex-1">
                    <div className={`${DATA_TABLE_SHELL_CLASS} h-full`}>
                        <TableSkeleton rows={8} colWidths={['w-14', 'flex-1', 'w-28', 'w-24', 'w-24', 'w-36']} />
                    </div>
                </div>
            )}
        </div>
    );
}
