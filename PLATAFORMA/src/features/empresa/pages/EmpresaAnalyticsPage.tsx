import { useEffect, useState } from 'react';
import { TrendingUp, Star, BarChart3, Wrench, Award, AlertCircle } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { empresaApi, type AnalyticsResponse } from '../api/empresaApi';

function KpiCard({
    label, value, icon: Icon, color,
}: {
    label: string; value: string | number; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; color: string;
}) {
    return (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5 flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}1a` }}>
                <Icon size={20} style={{ color }} />
            </div>
            <div>
                <p className="text-2xl font-bold text-white">{value === null || value === undefined ? '—' : String(value)}</p>
                <p className="text-xs text-zinc-400">{label}</p>
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

    if (loading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl bg-white/[0.04] h-24 animate-pulse" />
                ))}
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
                <AlertCircle className="text-red-400" size={32} />
                <p className="text-zinc-400 text-sm">{error ?? 'Sin datos disponibles.'}</p>
            </div>
        );
    }

    const { summary, top_servicios, timeline_30d } = data;
    const evalScore = summary.evaluacion_score != null ? Number(summary.evaluacion_score) : null;
    const avgRating = summary.avg_rating != null ? Number(summary.avg_rating).toFixed(1) : '—';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Analytics</h1>
                <p className="text-zinc-400 text-sm mt-1">Métricas de engagement de tus servicios turísticos.</p>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Recomendaciones ML" value={summary.total_recomendaciones} icon={TrendingUp} color="#9CCC44" />
                <KpiCard label="Favoritos"           value={summary.total_favoritos}       icon={Star}      color="#FF7D1F" />
                <KpiCard label="Visitas"             value={summary.total_visitas}         icon={BarChart3} color="#4DB9CA" />
                <KpiCard label="Rating promedio"     value={avgRating}                     icon={Award}     color="#984EFD" />
            </div>

            {/* Evaluación de calidad */}
            {evalScore !== null && (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-white font-semibold text-sm flex items-center gap-2">
                            <Award size={15} className="text-orange-400" />
                            Evaluación de calidad SMARTUR
                        </p>
                        <span className="text-orange-400 font-bold">{evalScore}/100</span>
                    </div>
                    <div className="w-full bg-white/[0.07] rounded-full h-2.5 overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(evalScore, 100)}%`, background: 'linear-gradient(90deg, #FF7D1F, #FF9D50)' }}
                        />
                    </div>
                </div>
            )}

            {/* Timeline chart */}
            {timeline_30d.length > 0 && (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5">
                    <p className="text-white font-semibold text-sm mb-4">Interacciones — últimos 30 días</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={timeline_30d} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id="grad_emp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#FF7D1F" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#FF7D1F" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
                                tickFormatter={(v: string) => v.slice(5)}
                            />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} />
                            <Tooltip
                                contentStyle={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                                labelStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                                itemStyle={{ color: '#FF7D1F' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="interacciones"
                                stroke="#FF7D1F"
                                strokeWidth={2}
                                fill="url(#grad_emp)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Top services table */}
            {top_servicios.length > 0 && (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/[0.07]">
                        <p className="text-white font-semibold text-sm flex items-center gap-2">
                            <Wrench size={15} className="text-orange-400" />
                            Top servicios por engagement
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/[0.07]">
                                    {['Servicio', 'Favoritos', 'Visitas', 'Rating', 'Recomendaciones'].map((h) => (
                                        <th key={h} className="px-5 py-3 text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {top_servicios.map((svc, i) => (
                                    <tr key={svc.id_service} className={i < top_servicios.length - 1 ? 'border-b border-white/[0.05]' : ''}>
                                        <td className="px-5 py-3 text-white font-medium">{svc.name}</td>
                                        <td className="px-5 py-3 text-zinc-300">{svc.favorites}</td>
                                        <td className="px-5 py-3 text-zinc-300">{svc.visits}</td>
                                        <td className="px-5 py-3 text-zinc-300">{svc.rating ?? '—'}</td>
                                        <td className="px-5 py-3 text-zinc-300">{svc.recomendaciones}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {top_servicios.length === 0 && timeline_30d.length === 0 && (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-10 text-center">
                    <BarChart3 className="mx-auto text-zinc-600 mb-3" size={32} />
                    <p className="text-zinc-400 text-sm">
                        Sin datos de engagement aún. Los datos se generan conforme los usuarios interactúan con tus servicios.
                    </p>
                </div>
            )}
        </div>
    );
}
