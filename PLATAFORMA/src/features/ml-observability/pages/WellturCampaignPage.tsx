import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Activity, AlertCircle, BarChart2, Brain, CheckCircle2, HeartPulse, MousePointerClick,
    Play, RefreshCw, Star, Store, Target, XCircle,
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useToast } from '../../../shared/context/ToastContext';
import { useUserPreferences } from '../../../contexts/LanguageContext';
import { DASHBOARD_COLORS } from '../../home/utils/dashboard';
import {
    wellturApi, NOMBRES_MODALIDADES, NOMBRES_MOTIVOS,
    type CampanaWelltur, type EtapaB,
} from '../api/wellturApi';

const PURPLE = DASHBOARD_COLORS.purple;
const CYAN = DASHBOARD_COLORS.cyan;
const GREEN = DASHBOARD_COLORS.green;
const ORANGE = DASHBOARD_COLORS.orange;

const tooltipStyle = {
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    fontSize: '12px',
    color: 'var(--color-text)',
};
const ejeTick = { fontSize: 11, fill: 'var(--color-text-alt)' };

function SectionDivider({ label, color }: { label: string; color: string }) {
    return (
        <div className="flex items-center gap-3 pt-2">
            <div className="h-px flex-1" style={{ background: `${color}33` }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
            <div className="h-px flex-1" style={{ background: `${color}33` }} />
        </div>
    );
}

function KpiCard({ label, value, sub, icon: Icon, accent }: {
    label: string; value: string; sub?: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    accent: string;
}) {
    return (
        <div className="rounded-xl md:rounded-2xl border p-3 md:p-4 flex items-center gap-3 md:gap-4"
            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${accent}1a` }}>
                <Icon className="size-5" style={{ color: accent }} />
            </div>
            <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>{value}</p>
                <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-alt)' }}>{label}</p>
                {sub && <p className="text-[11px] truncate" style={{ color: 'var(--color-text-alt)' }}>{sub}</p>}
            </div>
        </div>
    );
}

function SkeletonCard() {
    return <div className="rounded-2xl border h-20 animate-pulse" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }} />;
}

/** Tarjeta con una gráfica de barras de una sola serie (sin leyenda: el título nombra la serie). */
function GraficaBarras({ titulo, icon: Icon, color, datos, horizontal = false }: {
    titulo: string; color: string; horizontal?: boolean;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    datos: { etiqueta: string; n: number }[];
}) {
    return (
        <div className="rounded-2xl border p-4" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-2 mb-3">
                <Icon className="size-4" style={{ color }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{titulo}</p>
            </div>
            {datos.every((d) => d.n === 0) ? (
                <div className="flex h-[180px] flex-col items-center justify-center gap-2">
                    <BarChart2 className="size-8" style={{ color: 'var(--color-border)' }} />
                    <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>Aún sin datos de la campaña</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={horizontal ? Math.max(180, datos.length * 30) : 180}>
                    {horizontal ? (
                        <BarChart data={datos} layout="vertical" margin={{ left: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                            <XAxis type="number" allowDecimals={false} tick={ejeTick} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="etiqueta" width={130} tick={ejeTick} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--color-bg-alt)' }} />
                            <Bar dataKey="n" name="Personas" fill={color} radius={[0, 4, 4, 0]} barSize={14} />
                        </BarChart>
                    ) : (
                        <BarChart data={datos}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                            <XAxis dataKey="etiqueta" tick={ejeTick} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={ejeTick} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--color-bg-alt)' }} />
                            <Bar dataKey="n" name="Sesiones" fill={color} radius={[4, 4, 0, 0]} barSize={22} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            )}
        </div>
    );
}

export function WellturCampaignPage() {
    const toast = useToast();
    // El contexto de toast no está memoizado: se lee por referencia para no recargar en bucle.
    const toastRef = useRef(toast);
    toastRef.current = toast;
    const { user } = useUserPreferences();
    const esAdmin = user?.role_id === 1;
    const [datos, setDatos] = useState<CampanaWelltur | null>(null);
    const [cargando, setCargando] = useState(true);
    const [etapaB, setEtapaB] = useState<EtapaB | null>(null);
    const [evaluando, setEvaluando] = useState(false);

    const cargar = useCallback(() => {
        wellturApi.campana()
            .then(setDatos)
            .catch(() => toastRef.current.error('Campaña WELLTUR', 'No se pudieron cargar las estadísticas.'))
            .finally(() => setCargando(false));
    }, []);
    useEffect(() => { cargar(); }, [cargar]);

    const evaluar = async () => {
        setEvaluando(true);
        try {
            const r = await wellturApi.etapaB();
            setEtapaB(r);
            toast.success('Etapa B evaluada', r.lista_para_promover ? 'Lista para promover (decisión humana).' : 'Se mantiene la etapa A.');
        } catch {
            toast.error('Etapa B', 'No se pudo evaluar con los datos actuales.');
        } finally {
            setEvaluando(false);
        }
    };

    const pct = datos ? Math.round(datos.avance * 100) : 0;
    const sat = datos?.satisfaccion.promedio ?? null;

    return (
        <div className="flex h-[calc(100vh-7rem)] md:h-[calc(100vh-9rem)] flex-col gap-3 md:gap-4 overflow-hidden" id="welltur-campaign">
            {/* ── Header ── */}
            <div className="flex shrink-0 items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>Campaña WELLTUR</h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        Datos reales de la app para validar y reentrenar el modelo de bienestar
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {esAdmin && (
                        <button
                            onClick={() => void evaluar()}
                            disabled={evaluando || cargando}
                            className="flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Compara el modelo actual contra uno reentrenado con estas sesiones; nunca se activa solo"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                        >
                            {evaluando
                                ? <><span className="size-4 shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin" />Evaluando…</>
                                : <><Play className="size-4" style={{ color: DASHBOARD_COLORS.success }} />Evaluar etapa B</>}
                        </button>
                    )}
                    <button
                        onClick={() => { setCargando(true); cargar(); }}
                        disabled={cargando}
                        className="flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60 disabled:opacity-50"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                    >
                        <RefreshCw className={`size-4 ${cargando ? 'animate-spin' : ''}`} />
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Info banner */}
            <div className="rounded-xl border px-5 py-4 flex items-start gap-3 shrink-0" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                <HeartPulse className="size-5 mt-0.5 shrink-0" style={{ color: PURPLE }} />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>Solo cuentan búsquedas con consentimiento</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        La meta son {datos?.meta ?? 200} sesiones con PSS-10 y calificación. La PSS-10 se aplica una vez por persona (licencia Mapi) y no es un diagnóstico.
                    </p>
                </div>
            </div>

            {/* ── Scrollable content ── */}
            <div className="min-h-0 flex-1 overflow-y-auto space-y-4 pr-1">
                {cargando && !datos ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[0, 1, 2, 3].map((k) => <SkeletonCard key={k} />)}</div>
                ) : datos && (
                    <>
                        {/* ── Avance (barra morada como el estado del modelo) ── */}
                        <div className="rounded-2xl border-2 p-4 space-y-3" style={{ borderColor: `${PURPLE}44`, background: `${PURPLE}08` }}>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <Target className="size-4" style={{ color: PURPLE }} />
                                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Meta para reentrenar (etapa B)</span>
                                </div>
                                <span className="text-sm font-bold" style={{ color: PURPLE }}>{datos.completas} / {datos.meta} · {pct} %</span>
                            </div>
                            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-alt)' }}
                                role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: PURPLE }} />
                            </div>
                            <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                {datos.etapa_b_lista
                                    ? 'Ya hay datos suficientes para evaluar el reentrenamiento.'
                                    : `Faltan ${datos.meta - datos.completas} sesiones con PSS-10 y calificación de las recomendaciones.`}
                            </p>
                        </div>

                        {/* ── KPIs ── */}
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                            <KpiCard label="Sesiones guardadas" value={String(datos.sesiones)} sub={`${datos.personas} personas`} icon={Activity} accent={PURPLE} />
                            <KpiCard label="Con PSS-10" value={String(datos.sesiones_con_pss)} sub={`${datos.personas_con_pss} personas`} icon={Brain} accent={CYAN} />
                            <KpiCard label="Satisfacción" value={sat == null ? '—' : `${sat.toFixed(1)} / 5`} sub={`${datos.satisfaccion.n} calificaciones`} icon={Star} accent={ORANGE} />
                            <KpiCard label="Abren el detalle"
                                value={datos.eventos.tasa_apertura == null ? '—' : `${Math.round(datos.eventos.tasa_apertura * 100)} %`}
                                sub={`${datos.eventos.abiertos}/${datos.eventos.impresiones} · ${datos.eventos.elegidos} "Cómo llegar"`}
                                icon={MousePointerClick} accent={GREEN} />
                            <KpiCard label="Reclamos DENUE" value={String(datos.reclamos_pendientes)} sub="pendientes de revisión" icon={Store} accent={DASHBOARD_COLORS.warning} />
                        </div>

                        <SectionDivider label="Uso de la app" color={PURPLE} />
                        <div className="rounded-2xl border p-4" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <Activity className="size-4" style={{ color: PURPLE }} />
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Sesiones por día (últimos 30 días)</p>
                            </div>
                            {datos.sesiones_por_dia.length === 0 ? (
                                <div className="flex h-[180px] flex-col items-center justify-center gap-2">
                                    <BarChart2 className="size-8" style={{ color: 'var(--color-border)' }} />
                                    <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>Sin sesiones en los últimos 30 días</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart data={datos.sesiones_por_dia.map((d) => ({ dia: d.dia.slice(5), n: d.n }))}>
                                        <defs>
                                            <linearGradient id="wellturGradSesiones" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={PURPLE} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                        <XAxis dataKey="dia" tick={ejeTick} axisLine={false} tickLine={false} />
                                        <YAxis allowDecimals={false} tick={ejeTick} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Area type="monotone" dataKey="n" name="Sesiones" stroke={PURPLE} fill="url(#wellturGradSesiones)" strokeWidth={2} dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <SectionDivider label="Respuestas" color={CYAN} />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <GraficaBarras titulo="Puntaje PSS-10 (bloques de 5; sin puntos de corte)" icon={Brain} color={CYAN}
                                datos={datos.pss10_bloques.map((b) => ({ etiqueta: `${b.desde}–${b.desde === 35 ? 40 : b.desde + 4}`, n: b.n }))} />
                            <GraficaBarras titulo="Calificación de las recomendaciones" icon={Star} color={ORANGE}
                                datos={[1, 2, 3, 4, 5].map((c) => ({ etiqueta: `${c} ★`, n: datos.satisfaccion.distribucion.find((d) => d.calificacion === c)?.n ?? 0 }))} />
                            <GraficaBarras titulo="Motivos del viaje más elegidos" icon={Target} color={PURPLE} horizontal
                                datos={datos.motivos.map((m) => ({ etiqueta: NOMBRES_MOTIVOS[m.codigo] ?? m.codigo, n: m.n }))} />
                            <GraficaBarras titulo="Formas de experiencia más elegidas" icon={HeartPulse} color={GREEN} horizontal
                                datos={datos.modalidades.map((m) => ({ etiqueta: NOMBRES_MODALIDADES[m.codigo] ?? m.codigo, n: m.n }))} />
                        </div>

                        <SectionDivider label="Etapa B · reentrenamiento" color={GREEN} />
                        <div className="rounded-2xl border p-4" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <BarChart2 className="size-4" style={{ color: DASHBOARD_COLORS.success }} />
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>¿Reentrenar con datos reales?</p>
                            </div>
                            {!etapaB ? (
                                <div className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                                    <AlertCircle className="size-4 mt-0.5 shrink-0" />
                                    <p>
                                        Compara, con validación cruzada agrupada por persona, el modelo actual contra uno que aprende el efecto
                                        del estrés por modalidad con estas sesiones. Solo sugiere promoverlo con {datos.meta} sesiones o más y
                                        una mejora consistente; la decisión siempre es humana.
                                        {esAdmin ? ' Usa "Evaluar etapa B" arriba.' : ''}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 text-sm" style={{ color: 'var(--color-text)' }}>
                                    <div className="flex items-center gap-2 font-semibold">
                                        {etapaB.lista_para_promover
                                            ? <CheckCircle2 className="size-4" style={{ color: DASHBOARD_COLORS.success }} />
                                            : <XCircle className="size-4" style={{ color: 'var(--color-text-alt)' }} />}
                                        {etapaB.lista_para_promover ? 'Lista para promover (decisión humana)' : 'Se mantiene la etapa A'}
                                    </div>
                                    <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>{etapaB.mensaje}</p>
                                    <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                        {etapaB.n_sesiones} sesiones · {etapaB.n_personas} personas · {etapaB.n_lugares_mostrados} lugares mostrados
                                        {etapaB.tasa_interes != null && ` · interés ${Math.round(etapaB.tasa_interes * 100)} %`}
                                    </p>
                                    {etapaB.estado === 'evaluado' && (
                                        <>
                                            <p className="text-xs">
                                                Log-loss {etapaB.logloss_A?.toFixed(4)} → {etapaB.logloss_B?.toFixed(4)} · AUC {etapaB.auc_A?.toFixed(3)} → {etapaB.auc_B?.toFixed(3)} · mejor en {etapaB.pliegues_mejor_B}/{etapaB.pliegues} pliegues
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                                OR del estrés: {Object.entries(etapaB.or_estres_por_modalidad ?? {}).map(([w, v]) => `${NOMBRES_MODALIDADES[w] ?? w} ${v}`).join(' · ')}
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {esAdmin && datos.reclamos_pendientes > 0 && (
                            <Link to="/dashboard/reclamos-denue"
                                className="rounded-xl border px-5 py-3 flex items-center gap-3 text-sm font-medium transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                                <Store className="size-4" style={{ color: DASHBOARD_COLORS.warning }} />
                                Revisar {datos.reclamos_pendientes} reclamo(s) de fichas del DENUE
                            </Link>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
