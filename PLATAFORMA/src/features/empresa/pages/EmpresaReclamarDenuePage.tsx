import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CheckCircle2, Clock, Loader2, Lock, MapPin, Search, Store, X, XCircle } from 'lucide-react';
import { api } from '../../../shared/api/axiosClient';
import { empresaApi } from '../api/empresaApi';

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

const ESTADO = {
    pending:  { texto: 'En revisión', color: '#F59E0B', Icono: Clock },
    approved: { texto: 'Verificado',  color: '#10b981', Icono: CheckCircle2 },
    rejected: { texto: 'Rechazado',   color: '#f43f5e', Icono: XCircle },
} as const;

function ModuleLocked() {
    const navigate = useNavigate();
    return (
        <div className="flex h-[calc(100vh-9rem)] items-center justify-center">
            <div
                className="flex max-w-sm flex-col items-center gap-4 rounded-[28px] border p-8 text-center shadow-sm"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
            >
                <div className="flex size-14 items-center justify-center rounded-full" style={{ background: '#F59E0B18' }}>
                    <Lock className="size-6" style={{ color: '#F59E0B' }} />
                </div>
                <div>
                    <p className="font-bold" style={{ color: 'var(--color-text)' }}>
                        Empresa en revisión
                    </p>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                        Podrás reclamar tu negocio una vez que el equipo WELLTUR apruebe tu empresa. Normalmente tarda 24–48 horas.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/empresa/verificacion')}
                    className="rounded-2xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: '#7c3aed' }}
                >
                    Ver verificación
                </button>
            </div>
        </div>
    );
}

/**
 * La empresa busca su negocio en el catálogo del DENUE (INEGI) que usa WELLTUR y pide que se
 * ligue a su cuenta. Tras la verificación del equipo, aparece como verificado en la app.
 */
export function EmpresaReclamarDenuePage() {
    const [q, setQ]                   = useState('');
    const [resultados, setResultados] = useState<LugarDenue[] | null>(null);
    const [buscando, setBuscando]     = useState(false);
    const [elegido, setElegido]       = useState<LugarDenue | null>(null);
    const [evidencia, setEvidencia]   = useState('');
    const [mios, setMios]             = useState<MiReclamo[]>([]);
    const [loading, setLoading]       = useState(true);
    const [saving, setSaving]         = useState(false);
    const [error, setError]           = useState<string | null>(null);
    const [aviso, setAviso]           = useState<string | null>(null);
    const [companyStatus, setCompanyStatus] = useState<string | null>(null);

    useEffect(() => {
        empresaApi.getKycStatus()
            .then(d => setCompanyStatus(d.status))
            .catch(() => setCompanyStatus('unknown'));
    }, []);

    const cargarMios = useCallback(() => {
        api.get<MiReclamo[]>('/empresa/denue/reclamos')
            .then(r => setMios(r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);
    useEffect(() => { cargarMios(); }, [cargarMios]);

    const buscar = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (q.trim().length < 3) { setError('Escribe al menos 3 letras del nombre o del municipio.'); return; }
        setError(null); setAviso(null); setBuscando(true);
        try {
            const r = await api.get<LugarDenue[]>('/empresa/denue/buscar', { params: { q: q.trim() } });
            setResultados(r.data);
        } catch {
            setError('No se pudo buscar. Intenta de nuevo.');
        } finally {
            setBuscando(false);
        }
    };

    const enviar = async () => {
        if (!elegido) return;
        if (evidencia.trim().length < 10) { setError('Describe cómo podemos verificar que el negocio es tuyo.'); return; }
        setSaving(true); setError(null);
        try {
            await api.post('/empresa/denue/reclamos', { poi_id: elegido.id, evidencia: evidencia.trim() });
            setAviso(`Solicitud enviada para "${elegido.name}". Te avisaremos cuando la revisemos.`);
            setElegido(null); setEvidencia(''); setResultados(null); setQ('');
            cargarMios();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(msg ?? 'No se pudo enviar la solicitud.');
        } finally {
            setSaving(false);
        }
    };

    if (companyStatus !== null && companyStatus !== 'active') {
        return <ModuleLocked />;
    }

    return (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Store size={22} style={{ color: '#7c3aed' }} />
                    Reclamar mi negocio
                </h1>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 520 }}>
                    WELLTUR recomienda negocios locales del DENUE (INEGI). Si el tuyo aparece, reclámalo: al verificarlo
                    se mostrará en la app como "Verificado por SMARTUR" y quedará ligado a tu cuenta.
                </p>
            </div>

            {/* Buscador */}
            <form onSubmit={buscar} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="Nombre del negocio o municipio"
                    style={{ ...taStyle, padding: '9px 12px' }}
                />
                <button type="submit" disabled={buscando} style={{ ...btnPrimary, padding: '9px 16px' }}>
                    {buscando ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={13} />}
                    Buscar
                </button>
            </form>

            {aviso && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                    background: '#10b98112', border: '1px solid #10b98140', borderRadius: 12, padding: 12,
                    fontSize: 13, color: 'var(--color-text)',
                }}>
                    <CheckCircle2 size={15} style={{ color: '#10b981' }} /> {aviso}
                </div>
            )}
            {error && !elegido && <p style={{ margin: '0 0 16px', fontSize: 13, color: '#f43f5e' }}>{error}</p>}

            {/* Resultados */}
            {resultados && (resultados.length === 0 ? (
                <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                    No encontramos negocios con ese nombre en el catálogo.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    {resultados.map((l) => {
                        const bloqueado = l.ya_reclamado;
                        const activo = elegido?.id === l.id;
                        return (
                            <div key={l.id} style={{
                                background: 'var(--color-bg-alt)',
                                border: `1px solid ${activo ? '#7c3aed' : 'var(--color-border)'}`,
                                borderRadius: 12, padding: 16, opacity: bloqueado ? 0.55 : 1,
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{l.name}</p>
                                        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <MapPin size={12} />
                                            {[l.municipio, l.estado].filter(Boolean).join(', ')}
                                            {l.categoria_wellness && ` · ${l.categoria_wellness.replaceAll('_', ' ')}`}
                                        </p>
                                        {bloqueado && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>Ya verificado por otra empresa.</p>}
                                        {!bloqueado && l.reclamo_pendiente && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#F59E0B' }}>Tiene una solicitud en revisión.</p>}
                                    </div>
                                    {!bloqueado && !activo && (
                                        <button onClick={() => { setElegido(l); setError(null); }} style={btnGhost}>
                                            Es mi negocio
                                        </button>
                                    )}
                                </div>

                                {activo && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                                        <textarea
                                            placeholder="¿Cómo podemos verificar que el negocio es tuyo? RFC, domicilio, redes sociales, teléfono del local…"
                                            value={evidencia}
                                            onChange={e => setEvidencia(e.target.value)}
                                            rows={3}
                                            style={taStyle}
                                        />
                                        {error && <p style={{ margin: 0, fontSize: 13, color: '#f43f5e' }}>{error}</p>}
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={enviar} disabled={saving} style={btnPrimary}>
                                                {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
                                                Enviar solicitud
                                            </button>
                                            <button onClick={() => { setElegido(null); setError(null); }} style={btnGhost}>
                                                <X size={13} /> Cancelar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}

            {/* Mis solicitudes */}
            <h3 style={{ margin: '8px 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>Mis solicitudes</h3>
            {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
                    <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', opacity: 0.4 }} />
                </div>
            ) : mios.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
                    <Store size={40} style={{ opacity: 0.15, marginBottom: 12 }} />
                    <p style={{ margin: 0, fontSize: 14 }}>Aún no has reclamado ningún negocio.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {mios.map((m) => {
                        const { texto, color, Icono } = ESTADO[m.status];
                        return (
                            <div key={m.claim_id} style={{
                                background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
                                borderRadius: 12, padding: 16,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8,
                            }}>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{m.name}</p>
                                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                                        {m.municipio} · {new Date(m.created_at).toLocaleDateString('es-MX')}
                                    </p>
                                    {m.admin_notes && (
                                        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                                            {m.admin_notes}
                                        </p>
                                    )}
                                </div>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>
                                    <Icono size={13} /> {texto}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const taStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)', color: 'var(--color-text)',
    fontSize: 13, resize: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
};

const btnPrimary: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '7px 14px', borderRadius: 7, border: 'none',
    background: '#7c3aed', color: '#fff',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
};

const btnGhost: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '7px 14px', borderRadius: 7,
    border: '1px solid var(--color-border)',
    background: 'transparent', color: 'var(--color-text)',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    flexShrink: 0,
};
