import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Brain, ClipboardCheck, Loader2, MousePointerClick, Star, Users } from 'lucide-react';
import { useUserPreferences } from '../../../contexts/LanguageContext';
import {
    wellturApi, NOMBRES_MODALIDADES, NOMBRES_MOTIVOS,
    type CampanaWelltur, type EtapaB,
} from '../api/wellturApi';

const tarjeta: React.CSSProperties = {
    background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 18,
};
const tenue: React.CSSProperties = { color: 'var(--color-text-alt)', fontSize: 12.5 };

function Kpi({ icono, titulo, valor, nota }: { icono: React.ReactNode; titulo: string; valor: string; nota?: string }) {
    return (
        <div style={tarjeta}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...tenue }}>{icono}{titulo}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)', marginTop: 6 }}>{valor}</div>
            {nota && <div style={{ ...tenue, marginTop: 2 }}>{nota}</div>}
        </div>
    );
}

/** Barras horizontales de una sola serie; cada barra lleva su valor (sin depender del color). */
function Barras({ titulo, datos }: { titulo: string; datos: { etiqueta: string; n: number }[] }) {
    const max = Math.max(1, ...datos.map((d) => d.n));
    return (
        <div style={tarjeta}>
            <div style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>{titulo}</div>
            {datos.length === 0 ? (
                <div style={tenue}>Aún sin datos.</div>
            ) : datos.map((d) => (
                <div key={d.etiqueta} title={`${d.etiqueta}: ${d.n}`}
                    style={{ display: 'grid', gridTemplateColumns: '140px 1fr 40px', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.etiqueta}</span>
                    <div style={{ height: 10, background: 'var(--color-bg-alt)', borderRadius: 6 }}>
                        <div style={{ width: `${(d.n / max) * 100}%`, height: '100%', background: 'var(--color-pink)', borderRadius: 6, minWidth: d.n ? 4 : 0 }} />
                    </div>
                    <span style={{ fontSize: 12.5, textAlign: 'right', color: 'var(--color-text-alt)' }}>{d.n}</span>
                </div>
            ))}
        </div>
    );
}

export function WellturCampaignPage() {
    const { user } = useUserPreferences();
    const esAdmin = user?.role_id === 1;
    const [datos, setDatos] = useState<CampanaWelltur | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [etapaB, setEtapaB] = useState<EtapaB | null>(null);
    const [evaluando, setEvaluando] = useState(false);

    const cargar = useCallback(() => {
        wellturApi.campana().then(setDatos).catch(() => setError('No se pudieron cargar las estadísticas de la campaña.'));
    }, []);
    useEffect(() => { cargar(); }, [cargar]);

    const evaluar = async () => {
        setEvaluando(true);
        try { setEtapaB(await wellturApi.etapaB()); } catch { setError('No se pudo evaluar la etapa B.'); }
        finally { setEvaluando(false); }
    };

    if (error) return <div style={{ padding: 24, color: 'var(--color-text)' }}>{error}</div>;
    if (!datos) return <div style={{ padding: 24, display: 'flex', gap: 8, color: 'var(--color-text-alt)' }}><Loader2 className="animate-spin" size={18} /> Cargando campaña…</div>;

    const pct = Math.round(datos.avance * 100);
    const sat = datos.satisfaccion.promedio;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>Campaña WELLTUR</h1>
                <p style={{ margin: '4px 0 0', ...tenue }}>
                    Datos reales de la app (solo de quienes aceptaron guardar su búsqueda) para validar y reentrenar el modelo.
                </p>
            </div>

            {/* Avance hacia la meta de la etapa B */}
            <div style={tarjeta}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>Meta para reentrenar (etapa B)</div>
                    <div style={{ fontWeight: 800, color: 'var(--color-text)' }}>{datos.completas} / {datos.meta}</div>
                </div>
                <div style={{ height: 14, background: 'var(--color-bg-alt)', borderRadius: 8, marginTop: 10 }}
                    role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-pink)', borderRadius: 8, minWidth: pct ? 6 : 0 }} />
                </div>
                <div style={{ ...tenue, marginTop: 8 }}>
                    Sesiones con PSS-10 <strong>y</strong> calificación de las recomendaciones ({pct} %).
                    {datos.etapa_b_lista ? ' Ya se puede evaluar el reentrenamiento.' : ` Faltan ${datos.meta - datos.completas}.`}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
                <Kpi icono={<Activity size={15} />} titulo="Sesiones guardadas" valor={String(datos.sesiones)} nota={`${datos.personas} personas`} />
                <Kpi icono={<Brain size={15} />} titulo="Con PSS-10" valor={String(datos.sesiones_con_pss)} nota={`${datos.personas_con_pss} personas`} />
                <Kpi icono={<Star size={15} />} titulo="Satisfacción" valor={sat == null ? '—' : `${sat.toFixed(1)} / 5`} nota={`${datos.satisfaccion.n} calificaciones`} />
                <Kpi icono={<MousePointerClick size={15} />} titulo="Abren el detalle"
                    valor={datos.eventos.tasa_apertura == null ? '—' : `${Math.round(datos.eventos.tasa_apertura * 100)} %`}
                    nota={`${datos.eventos.abiertos} de ${datos.eventos.impresiones} lugares · ${datos.eventos.elegidos} "Cómo llegar"`} />
                <Kpi icono={<Users size={15} />} titulo="Reclamos DENUE" valor={String(datos.reclamos_pendientes)} nota="pendientes de revisión" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
                <Barras titulo="Puntaje PSS-10 (bloques de 5; la escala no tiene puntos de corte)"
                    datos={datos.pss10_bloques.map((b) => ({ etiqueta: `${b.desde}–${b.desde === 35 ? 40 : b.desde + 4}`, n: b.n }))} />
                <Barras titulo="Sesiones por día (últimos 30 días)"
                    datos={datos.sesiones_por_dia.map((d) => ({ etiqueta: d.dia, n: d.n }))} />
                <Barras titulo="Motivos del viaje más elegidos"
                    datos={datos.motivos.map((m) => ({ etiqueta: NOMBRES_MOTIVOS[m.codigo] ?? m.codigo, n: m.n }))} />
                <Barras titulo="Formas de experiencia más elegidas"
                    datos={datos.modalidades.map((m) => ({ etiqueta: NOMBRES_MODALIDADES[m.codigo] ?? m.codigo, n: m.n }))} />
                <Barras titulo="Calificación de las recomendaciones"
                    datos={[1, 2, 3, 4, 5].map((c) => ({ etiqueta: `${c} estrella${c > 1 ? 's' : ''}`, n: datos.satisfaccion.distribucion.find((d) => d.calificacion === c)?.n ?? 0 }))} />
            </div>

            {/* Etapa B: evaluación con datos reales; la promoción la decide una persona */}
            <div style={tarjeta}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                        <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>Etapa B · ¿reentrenar con datos reales?</div>
                        <div style={tenue}>Compara, con validación cruzada por persona, el modelo actual contra uno que aprende el efecto del estrés de estas sesiones. Nunca se activa solo.</div>
                    </div>
                    {esAdmin && (
                        <button onClick={evaluar} disabled={evaluando}
                            style={{ padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700,
                                background: 'var(--color-pink)', color: 'var(--color-text-on-vivid)', opacity: evaluando ? 0.6 : 1 }}>
                            {evaluando ? 'Evaluando…' : 'Evaluar ahora'}
                        </button>
                    )}
                </div>
                {etapaB && (
                    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5, color: 'var(--color-text)' }}>
                        <div style={{ fontWeight: 700 }}>{etapaB.lista_para_promover ? '✔ Lista para promover (decisión humana)' : 'Se mantiene la etapa A'}</div>
                        <div>{etapaB.mensaje}</div>
                        <div style={tenue}>
                            {etapaB.n_sesiones} sesiones · {etapaB.n_personas} personas · {etapaB.n_lugares_mostrados} lugares mostrados
                            {etapaB.tasa_interes != null && ` · interés ${Math.round(etapaB.tasa_interes * 100)} %`}
                        </div>
                        {etapaB.estado === 'evaluado' && (
                            <>
                                <div>Log-loss: actual {etapaB.logloss_A?.toFixed(4)} → con estrés {etapaB.logloss_B?.toFixed(4)} · AUC {etapaB.auc_A?.toFixed(3)} → {etapaB.auc_B?.toFixed(3)} · mejor en {etapaB.pliegues_mejor_B}/{etapaB.pliegues} pliegues</div>
                                <div style={tenue}>
                                    OR del estrés por modalidad: {Object.entries(etapaB.or_estres_por_modalidad ?? {})
                                        .map(([w, v]) => `${NOMBRES_MODALIDADES[w] ?? w} ${v}`).join(' · ')}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {esAdmin && datos.reclamos_pendientes > 0 && (
                <Link to="/dashboard/reclamos-denue" style={{ ...tarjeta, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--color-text)' }}>
                    <ClipboardCheck size={18} /> Revisar {datos.reclamos_pendientes} reclamo(s) de fichas del DENUE
                </Link>
            )}
        </div>
    );
}
