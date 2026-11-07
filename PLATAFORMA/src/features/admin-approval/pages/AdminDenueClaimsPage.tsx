import { useCallback, useEffect, useState } from 'react';
import { Building2, CheckCircle, FileSearch, Loader2, MapPin, Store, X, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey';
import {
    DataTableShell, DataTableScroll, DataTable,
    DataTableHead, DataTableHeadCell,
    DataTableBody, DataTableRow, DataTableCell,
} from '../../../components/ui/DataTable';
import { wellturApi, type ReclamoDenue } from '../../ml-observability/api/wellturApi';

type Estado = 'pending' | 'approved' | 'rejected';
const ETIQUETAS: Record<Estado, string> = { pending: 'Pendientes', approved: 'Aprobados', rejected: 'Rechazados' };

// ── Modal de revisión ─────────────────────────────────────────────────────────

interface ClaimReviewModalProps {
    reclamo: ReclamoDenue;
    onClose: () => void;
    onReviewed: (id: number) => void;
}

function ClaimReviewModal({ reclamo, onClose, onReviewed }: ClaimReviewModalProps) {
    const [action, setAction]         = useState<'approve' | 'reject' | null>(null);
    const [reason, setReason]         = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]           = useState<string | null>(null);
    const pendiente = reclamo.status === 'pending';

    useEscapeKey(onClose);

    const handleSubmit = async () => {
        if (!action) return;
        if (action === 'reject' && !reason.trim()) { setError('Ingresa el motivo.'); return; }
        setSubmitting(true);
        setError(null);
        try {
            await wellturApi.revisarReclamo(reclamo.claim_id, action === 'approve' ? 'approved' : 'rejected', reason.trim());
            onReviewed(reclamo.claim_id);
            onClose();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(msg ?? 'Error al procesar. Intenta de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 50,
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.18 }}
                style={{
                    background: 'var(--color-bg)', borderRadius: 16,
                    width: '100%', maxWidth: 560,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '18px 24px',
                    borderBottom: '1px solid var(--color-border)',
                }}>
                    <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--color-text)' }}>
                        Revisar reclamo de ficha DENUE
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--color-text)' }}>
                        {reclamo.poi_nombre}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)' }}>
                        <MapPin size={14} />
                        <span>{[reclamo.municipio, reclamo.estado].filter(Boolean).join(', ')} · CLEE {reclamo.denue_clee}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--color-text-muted)' }}>
                        <Building2 size={14} />
                        <span>
                            Reclamado por <strong>{reclamo.empresa}</strong> ({reclamo.solicitante})
                            {' · '}empresa {reclamo.empresa_status ?? 'sin estatus'}{reclamo.empresa_certificada ? ' · certificada' : ''}
                        </span>
                    </div>

                    {reclamo.poi_descripcion && (
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                            <strong>DENUE:</strong> {reclamo.poi_descripcion}
                        </p>
                    )}

                    <div style={{
                        background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
                        borderRadius: 12, padding: 14, fontSize: 14, color: 'var(--color-text)', lineHeight: 1.5,
                    }}>
                        <strong>Evidencia:</strong> {reclamo.evidencia}
                    </div>

                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                        Al aprobar, el lugar queda ligado a la empresa y la app lo muestra como "Verificado por SMARTUR".
                    </p>

                    {!pendiente ? (
                        reclamo.admin_notes && (
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                                <strong>Notas:</strong> {reclamo.admin_notes}
                            </p>
                        )
                    ) : (
                        <>
                            {/* Action selector */}
                            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                                <button
                                    onClick={() => setAction('approve')}
                                    style={{
                                        flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 14, fontWeight: 600,
                                        cursor: 'pointer', transition: 'all 0.15s',
                                        background: action === 'approve' ? '#10b981' : 'transparent',
                                        color: action === 'approve' ? '#fff' : '#10b981',
                                        border: '1.5px solid #10b981',
                                    }}
                                >
                                    <CheckCircle size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                                    Aprobar
                                </button>
                                <button
                                    onClick={() => setAction('reject')}
                                    style={{
                                        flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 14, fontWeight: 600,
                                        cursor: 'pointer', transition: 'all 0.15s',
                                        background: action === 'reject' ? '#f43f5e' : 'transparent',
                                        color: action === 'reject' ? '#fff' : '#f43f5e',
                                        border: '1.5px solid #f43f5e',
                                    }}
                                >
                                    <XCircle size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                                    Rechazar
                                </button>
                            </div>

                            {action === 'reject' && (
                                <textarea
                                    placeholder="Motivo del rechazo (visible para la empresa)…"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={3}
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13,
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-bg)', color: 'var(--color-text)',
                                        resize: 'none', boxSizing: 'border-box',
                                    }}
                                />
                            )}

                            {error && <p style={{ margin: 0, color: '#f43f5e', fontSize: 13 }}>{error}</p>}

                            {action && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    style={{
                                        padding: '11px 0', borderRadius: 8, fontSize: 15, fontWeight: 700,
                                        cursor: submitting ? 'not-allowed' : 'pointer', border: 'none',
                                        background: action === 'approve' ? '#10b981' : '#f43f5e',
                                        color: '#fff', opacity: submitting ? 0.7 : 1,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    }}
                                >
                                    {submitting && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                                    {action === 'approve' ? 'Confirmar aprobación' : 'Confirmar rechazo'}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

/**
 * Reclamos de fichas del DENUE: una empresa registrada pide que un negocio del DENUE (INEGI)
 * se ligue a ella. Al aprobarlo, la app lo muestra como "Verificado por SMARTUR".
 */
export function AdminDenueClaimsPage() {
    const [estado, setEstado]       = useState<Estado>('pending');
    const [reclamos, setReclamos]   = useState<ReclamoDenue[]>([]);
    const [loading, setLoading]     = useState(true);
    const [selected, setSelected]   = useState<ReclamoDenue | null>(null);
    const [search, setSearch]       = useState('');

    // El estado de carga se activa al cambiar de pestaña (no dentro del efecto).
    const cargar = useCallback(() => {
        wellturApi.reclamos(estado)
            .then(setReclamos)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [estado]);
    useEffect(() => { cargar(); }, [cargar]);

    const handleReviewed = (id: number) => setReclamos((prev) => prev.filter((r) => r.claim_id !== id));

    const q = search.toLowerCase();
    const filtered = reclamos.filter((r) =>
        r.poi_nombre.toLowerCase().includes(q) ||
        r.empresa.toLowerCase().includes(q) ||
        r.municipio.toLowerCase().includes(q)
    );

    return (
        <DataTableShell>
            {/* Page header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>
                        Reclamos de fichas DENUE
                    </h1>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                        Empresas que piden ligar un negocio del DENUE a su cuenta · {reclamos.length} {ETIQUETAS[estado].toLowerCase()}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {(Object.keys(ETIQUETAS) as Estado[]).map((e) => (
                        <button
                            key={e}
                            onClick={() => { if (e !== estado) { setLoading(true); setEstado(e); } }}
                            className="rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors"
                            style={{
                                borderColor: estado === e ? '#10b981' : 'var(--color-border)',
                                color: estado === e ? '#10b981' : 'var(--color-text-alt)',
                                background: estado === e ? '#10b98112' : 'transparent',
                            }}
                        >
                            {ETIQUETAS[e]}
                        </button>
                    ))}
                    <input
                        type="text"
                        placeholder="Buscar por lugar, empresa o municipio…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-64 rounded-lg border px-4 py-2 text-sm focus:outline-none"
                        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                    />
                </div>
            </div>

            {loading ? (
                <TableSkeleton rows={6} colWidths={['30%', '20%', '25%', '15%', '10%']} />
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
                    <FileSearch size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                    <p>No hay reclamos {ETIQUETAS[estado].toLowerCase()}</p>
                </div>
            ) : (
                <DataTableScroll>
                    <DataTable>
                        <DataTableHead>
                            <tr>
                                <DataTableHeadCell>Lugar (DENUE)</DataTableHeadCell>
                                <DataTableHeadCell>Municipio</DataTableHeadCell>
                                <DataTableHeadCell>Empresa</DataTableHeadCell>
                                <DataTableHeadCell>Solicitado</DataTableHeadCell>
                                <DataTableHeadCell>Estatus</DataTableHeadCell>
                            </tr>
                        </DataTableHead>
                        <DataTableBody>
                            {filtered.map((r) => (
                                <DataTableRow key={r.claim_id} onClick={() => setSelected(r)} className="cursor-pointer">
                                    <DataTableCell style={{ fontWeight: 600 }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                            <Store size={15} style={{ opacity: 0.5 }} /> {r.poi_nombre}
                                        </span>
                                    </DataTableCell>
                                    <DataTableCell>{r.municipio || '—'}</DataTableCell>
                                    <DataTableCell>{r.empresa}</DataTableCell>
                                    <DataTableCell style={{ fontSize: 12, opacity: 0.7 }}>
                                        {new Date(r.created_at).toLocaleDateString('es-MX')}
                                    </DataTableCell>
                                    <DataTableCell style={{ fontSize: 12, opacity: 0.7 }}>{ETIQUETAS[r.status]}</DataTableCell>
                                </DataTableRow>
                            ))}
                        </DataTableBody>
                    </DataTable>
                </DataTableScroll>
            )}

            <AnimatePresence>
                {selected && (
                    <ClaimReviewModal
                        reclamo={selected}
                        onClose={() => setSelected(null)}
                        onReviewed={handleReviewed}
                    />
                )}
            </AnimatePresence>
        </DataTableShell>
    );
}
