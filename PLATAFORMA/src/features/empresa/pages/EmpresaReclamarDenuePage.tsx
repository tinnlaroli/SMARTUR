import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock, MapPin, Search, XCircle } from 'lucide-react';
import { api } from '../../../shared/api/axiosClient';

interface LugarDenue {
    id: number;
    name: string;
    categoria_wellness: string | null;
    description: string | null;
    municipio: string;
    estado: string;
    ya_reclamado: boolean;
    reclamo_pendiente: boolean;
}

interface MiReclamo {
    claim_id: number;
    status: 'pending' | 'approved' | 'rejected';
    name: string;
    municipio: string;
    admin_notes: string | null;
    created_at: string;
}

const tarjeta: React.CSSProperties = {
    background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 16,
};
const tenue: React.CSSProperties = { color: 'var(--color-text-alt)', fontSize: 12.5 };
const ESTADO = {
    pending: { texto: 'En revisión', icono: <Clock size={14} /> },
    approved: { texto: 'Verificado', icono: <CheckCircle2 size={14} /> },
    rejected: { texto: 'Rechazado', icono: <XCircle size={14} /> },
};

/**
 * La empresa busca su negocio en el catálogo del DENUE (INEGI) que usa WELLTUR y pide
 * que se ligue a su cuenta. Tras la verificación del equipo, aparece como verificado en la app.
 */
export function EmpresaReclamarDenuePage() {
    const [q, setQ] = useState('');
    const [resultados, setResultados] = useState<LugarDenue[] | null>(null);
    const [elegido, setElegido] = useState<LugarDenue | null>(null);
    const [evidencia, setEvidencia] = useState('');
    const [mios, setMios] = useState<MiReclamo[]>([]);
    const [mensaje, setMensaje] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);

    const cargarMios = useCallback(() => {
        api.get<MiReclamo[]>('/empresa/denue/reclamos').then((r) => setMios(r.data)).catch(() => {});
    }, []);
    useEffect(() => { cargarMios(); }, [cargarMios]);

    const buscar = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (q.trim().length < 3) { setMensaje('Escribe al menos 3 letras del nombre o el municipio.'); return; }
        setMensaje(null);
        try {
            const r = await api.get<LugarDenue[]>('/empresa/denue/buscar', { params: { q: q.trim() } });
            setResultados(r.data);
        } catch { setMensaje('No se pudo buscar. Intenta de nuevo.'); }
    };

    const enviar = async () => {
        if (!elegido) return;
        setEnviando(true); setMensaje(null);
        try {
            await api.post('/empresa/denue/reclamos', { poi_id: elegido.id, evidencia: evidencia.trim() });
            setMensaje(`Solicitud enviada para "${elegido.name}". Te avisaremos cuando la revisemos.`);
            setElegido(null); setEvidencia(''); setResultados(null); cargarMios();
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setMensaje(msg ?? 'No se pudo enviar la solicitud.');
        } finally { setEnviando(false); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 860 }}>
            <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>Reclamar mi negocio</h1>
                <p style={{ margin: '4px 0 0', ...tenue }}>
                    WELLTUR recomienda negocios locales a partir del DENUE (INEGI). Si tu negocio aparece, reclámalo:
                    al verificarlo, se mostrará en la app como "Verificado por SMARTUR" y quedará ligado a tu cuenta.
                </p>
            </div>

            <form onSubmit={buscar} style={{ display: 'flex', gap: 8 }}>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre del negocio o municipio"
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--color-border)',
                        background: 'var(--color-bg)', color: 'var(--color-text)' }} />
                <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 12,
                    border: 'none', cursor: 'pointer', fontWeight: 700, background: 'var(--color-pink)', color: 'var(--color-text-on-vivid)' }}>
                    <Search size={16} /> Buscar
                </button>
            </form>

            {mensaje && <div style={{ ...tarjeta, color: 'var(--color-text)' }}>{mensaje}</div>}

            {resultados && (resultados.length === 0 ? (
                <div style={tenue}>No encontramos negocios con ese nombre en el catálogo.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {resultados.map((l) => {
                        const bloqueado = l.ya_reclamado;
                        return (
                            <button key={l.id} disabled={bloqueado} onClick={() => setElegido(l)}
                                style={{ ...tarjeta, textAlign: 'left', cursor: bloqueado ? 'not-allowed' : 'pointer', opacity: bloqueado ? 0.55 : 1,
                                    borderColor: elegido?.id === l.id ? 'var(--color-pink)' : 'var(--color-border)', borderWidth: elegido?.id === l.id ? 2 : 1 }}>
                                <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{l.name}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...tenue }}>
                                    <MapPin size={13} /> {[l.municipio, l.estado].filter(Boolean).join(', ')}
                                    {l.categoria_wellness && ` · ${l.categoria_wellness.replaceAll('_', ' ')}`}
                                    {bloqueado && ' · ya verificado por otra empresa'}
                                    {!bloqueado && l.reclamo_pendiente && ' · tiene una solicitud en revisión'}
                                </div>
                            </button>
                        );
                    })}
                </div>
            ))}

            {elegido && (
                <div style={{ ...tarjeta, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>Reclamar "{elegido.name}"</div>
                    <textarea value={evidencia} onChange={(e) => setEvidencia(e.target.value)} rows={4}
                        placeholder="¿Cómo podemos verificar que el negocio es tuyo? (RFC, domicilio, redes sociales, teléfono del local…)"
                        style={{ padding: 12, borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                            color: 'var(--color-text)', resize: 'vertical' }} />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => setElegido(null)} style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--color-border)',
                            background: 'var(--color-bg)', color: 'var(--color-text)', cursor: 'pointer' }}>Cancelar</button>
                        <button disabled={enviando || evidencia.trim().length < 10} onClick={enviar}
                            style={{ padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700,
                                background: 'var(--color-pink)', color: 'var(--color-text-on-vivid)', opacity: evidencia.trim().length < 10 ? 0.5 : 1 }}>
                            {enviando ? 'Enviando…' : 'Enviar solicitud'}
                        </button>
                    </div>
                </div>
            )}

            <div>
                <div style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Mis solicitudes</div>
                {mios.length === 0 ? <div style={tenue}>Aún no has reclamado ningún negocio.</div> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {mios.map((m) => (
                            <div key={m.claim_id} style={{ ...tarjeta, display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                                <div>
                                    <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{m.name}</div>
                                    <div style={tenue}>{m.municipio} · {new Date(m.created_at).toLocaleDateString('es-MX')}</div>
                                    {m.admin_notes && <div style={tenue}>Notas: {m.admin_notes}</div>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--color-text)' }}>
                                    {ESTADO[m.status].icono} {ESTADO[m.status].texto}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
