import { useCallback, useEffect, useState } from 'react';
import { Building2, CheckCircle, FileSearch, MapPin, XCircle } from 'lucide-react';
import { wellturApi, type ReclamoDenue } from '../../ml-observability/api/wellturApi';

type Estado = 'pending' | 'approved' | 'rejected';
const ETIQUETAS: Record<Estado, string> = { pending: 'Pendientes', approved: 'Aprobados', rejected: 'Rechazados' };

const tarjeta: React.CSSProperties = {
    background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 18,
};
const tenue: React.CSSProperties = { color: 'var(--color-text-alt)', fontSize: 12.5 };

/**
 * Reclamos de fichas del DENUE: una empresa registrada pide que un lugar del DENUE se ligue a
 * ella. Al aprobar, el lugar se muestra en la app como "Verificado por SMARTUR".
 */
export function AdminDenueClaimsPage() {
    const [estado, setEstado] = useState<Estado>('pending');
    const [reclamos, setReclamos] = useState<ReclamoDenue[] | null>(null);
    const [notas, setNotas] = useState<Record<number, string>>({});
    const [ocupado, setOcupado] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const cargar = useCallback(() => {
        setReclamos(null);
        wellturApi.reclamos(estado).then(setReclamos).catch(() => setError('No se pudieron cargar los reclamos.'));
    }, [estado]);
    useEffect(() => { cargar(); }, [cargar]);

    const revisar = async (r: ReclamoDenue, decision: 'approved' | 'rejected') => {
        const nota = (notas[r.claim_id] ?? '').trim();
        if (decision === 'rejected' && !nota) { setError('Escribe el motivo del rechazo.'); return; }
        setOcupado(r.claim_id); setError(null);
        try {
            await wellturApi.revisarReclamo(r.claim_id, decision, nota);
            setReclamos((prev) => prev?.filter((x) => x.claim_id !== r.claim_id) ?? null);
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(msg ?? 'No se pudo guardar la revisión.');
        } finally { setOcupado(null); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>Reclamos de fichas del DENUE</h1>
                <p style={{ margin: '4px 0 0', ...tenue }}>
                    Empresas que piden ligar un negocio del DENUE (INEGI) a su cuenta. Verifica la evidencia antes de aprobar:
                    al hacerlo, el lugar aparece en la app como verificado por SMARTUR.
                </p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
                {(Object.keys(ETIQUETAS) as Estado[]).map((e) => (
                    <button key={e} onClick={() => setEstado(e)}
                        style={{ padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                            border: '1px solid var(--color-border)',
                            background: estado === e ? 'var(--color-pink)' : 'var(--color-bg)',
                            color: estado === e ? 'var(--color-text-on-vivid)' : 'var(--color-text)' }}>
                        {ETIQUETAS[e]}
                    </button>
                ))}
            </div>

            {error && <div style={{ ...tarjeta, borderColor: '#d03b3b', color: '#d03b3b' }}>{error}</div>}

            {reclamos === null ? (
                <div style={tenue}>Cargando…</div>
            ) : reclamos.length === 0 ? (
                <div style={{ ...tarjeta, textAlign: 'center', padding: 40, ...tenue }}>
                    <FileSearch size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <div>No hay reclamos {ETIQUETAS[estado].toLowerCase()}.</div>
                </div>
            ) : reclamos.map((r) => (
                <div key={r.claim_id} style={{ ...tarjeta, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>{r.poi_nombre}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...tenue }}>
                                <MapPin size={13} /> {[r.municipio, r.estado].filter(Boolean).join(', ')} · CLEE {r.denue_clee}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--color-text)', justifyContent: 'flex-end' }}>
                                <Building2 size={14} /> {r.empresa}
                            </div>
                            <div style={tenue}>
                                {r.solicitante} · empresa {r.empresa_status ?? 'sin estatus'}{r.empresa_certificada ? ' · certificada' : ''}
                            </div>
                        </div>
                    </div>
                    {r.poi_descripcion && <div style={tenue}>{r.poi_descripcion}</div>}
                    <div style={{ background: 'var(--color-bg-alt)', borderRadius: 12, padding: 12, fontSize: 13.5, color: 'var(--color-text)' }}>
                        <strong>Evidencia de la empresa:</strong> {r.evidencia}
                    </div>
                    <div style={tenue}>Solicitado el {new Date(r.created_at).toLocaleString('es-MX')}</div>

                    {estado === 'pending' ? (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <input
                                placeholder="Notas (obligatorias si rechazas)"
                                value={notas[r.claim_id] ?? ''}
                                onChange={(e) => setNotas((n) => ({ ...n, [r.claim_id]: e.target.value }))}
                                style={{ flex: 1, minWidth: 220, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg)', color: 'var(--color-text)' }}
                            />
                            <button disabled={ocupado === r.claim_id} onClick={() => revisar(r, 'approved')}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: 'none',
                                    cursor: 'pointer', fontWeight: 700, background: 'var(--color-pink)', color: 'var(--color-text-on-vivid)' }}>
                                <CheckCircle size={16} /> Aprobar
                            </button>
                            <button disabled={ocupado === r.claim_id} onClick={() => revisar(r, 'rejected')}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                                    border: '1px solid var(--color-border)', cursor: 'pointer', fontWeight: 700,
                                    background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                                <XCircle size={16} /> Rechazar
                            </button>
                        </div>
                    ) : r.admin_notes ? (
                        <div style={tenue}>Notas: {r.admin_notes}</div>
                    ) : null}
                </div>
            ))}
        </div>
    );
}
