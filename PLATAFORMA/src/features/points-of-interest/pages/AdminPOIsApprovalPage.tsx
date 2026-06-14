import { useEffect, useState } from 'react';
import {
    CheckCircle, XCircle, MapPin, ImageOff, X, Loader2, Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../shared/api/axiosClient';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey';
import {
    DataTableShell, DataTableScroll, DataTable,
    DataTableHead, DataTableHeadCell,
    DataTableBody, DataTableRow, DataTableCell,
} from '../../../components/ui/DataTable';

interface PendingPOI {
    id: number;
    name: string;
    description: string | null;
    categories_raw: string | null;
    image_url: string | null;
    latitude: number | null;
    longitude: number | null;
    company_name: string | null;
    submitted_by_company_id: number | null;
    validation_submitted_at: string;
}

// ── POI Preview Modal ─────────────────────────────────────────────────────────

interface POIPreviewModalProps {
    poi: PendingPOI;
    onClose: () => void;
    onReviewed: (id: number) => void;
}

function POIPreviewModal({ poi, onClose, onReviewed }: POIPreviewModalProps) {
    const [action, setAction]         = useState<'approve' | 'reject' | null>(null);
    const [reason, setReason]         = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]           = useState<string | null>(null);

    useEscapeKey(onClose);

    const handleSubmit = async () => {
        if (!action) return;
        if (action === 'reject' && !reason.trim()) { setError('Ingresa el motivo.'); return; }
        setSubmitting(true);
        setError(null);
        try {
            await api.patch(`/admin/pois/${poi.id}/${action}`, action === 'reject' ? { reason } : {});
            onReviewed(poi.id);
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
                        Revisar POI
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Image */}
                <div style={{ height: 180, background: 'var(--color-bg-alt)', overflow: 'hidden' }}>
                    {poi.image_url ? (
                        <img src={poi.image_url} alt={poi.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <ImageOff size={40} style={{ opacity: 0.25 }} />
                        </div>
                    )}
                </div>

                {/* Body */}
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--color-text)' }}>
                        {poi.name}
                    </h3>

                    {poi.company_name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--color-text-muted)' }}>
                            <Building2 size={14} />
                            <span>Enviado por <strong>{poi.company_name}</strong></span>
                        </div>
                    )}

                    {(poi.latitude || poi.longitude) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)' }}>
                            <MapPin size={14} />
                            <span>{poi.latitude?.toFixed(6)}, {poi.longitude?.toFixed(6)}</span>
                        </div>
                    )}

                    {poi.categories_raw && (
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                            <strong>Categorías:</strong> {poi.categories_raw}
                        </p>
                    )}

                    {poi.description && (
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text)', lineHeight: 1.5 }}>
                            {poi.description}
                        </p>
                    )}

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
                </div>
            </motion.div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminPOIsApprovalPage() {
    const [pois, setPois]             = useState<PendingPOI[]>([]);
    const [loading, setLoading]       = useState(true);
    const [selected, setSelected]     = useState<PendingPOI | null>(null);
    const [search, setSearch]         = useState('');

    useEffect(() => {
        api.get('/admin/pois/pending')
            .then((r) => setPois(r.data.pois ?? []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleReviewed = (id: number) => setPois((prev) => prev.filter((p) => p.id !== id));

    const filtered = pois.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.company_name ?? '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DataTableShell>
            {/* Page header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>
                        Validación de POIs
                    </h1>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                        Puntos de interés enviados por empresas · {pois.length} pendientes
                    </p>
                </div>
                <input
                    type="text"
                    placeholder="Buscar por nombre o empresa…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64 rounded-lg border px-4 py-2 text-sm focus:outline-none"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
            </div>

            {loading ? (
                <TableSkeleton rows={6} />
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
                    <MapPin size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                    <p>No hay POIs pendientes de validación</p>
                </div>
            ) : (
                <DataTableScroll>
                    <DataTable>
                        <DataTableHead>
                            <tr>
                                <DataTableHeadCell>Imagen</DataTableHeadCell>
                                <DataTableHeadCell>Nombre</DataTableHeadCell>
                                <DataTableHeadCell>Empresa</DataTableHeadCell>
                                <DataTableHeadCell>Categorías</DataTableHeadCell>
                                <DataTableHeadCell>Enviado</DataTableHeadCell>
                            </tr>
                        </DataTableHead>
                        <DataTableBody>
                            {filtered.map((poi) => (
                                <DataTableRow
                                    key={poi.id}
                                    onClick={() => setSelected(poi)}
                                    className="cursor-pointer"
                                >
                                    <DataTableCell>
                                        {poi.image_url ? (
                                            <img src={poi.image_url} alt={poi.name}
                                                style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }} />
                                        ) : (
                                            <div style={{
                                                width: 44, height: 44, borderRadius: 8,
                                                background: 'var(--color-bg-alt)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <ImageOff size={18} style={{ opacity: 0.3 }} />
                                            </div>
                                        )}
                                    </DataTableCell>
                                    <DataTableCell style={{ fontWeight: 600 }}>{poi.name}</DataTableCell>
                                    <DataTableCell>{poi.company_name ?? '—'}</DataTableCell>
                                    <DataTableCell style={{ fontSize: 12, opacity: 0.7 }}>
                                        {poi.categories_raw ?? '—'}
                                    </DataTableCell>
                                    <DataTableCell style={{ fontSize: 12, opacity: 0.7 }}>
                                        {new Date(poi.validation_submitted_at).toLocaleDateString('es-MX')}
                                    </DataTableCell>
                                </DataTableRow>
                            ))}
                        </DataTableBody>
                    </DataTable>
                </DataTableScroll>
            )}

            <AnimatePresence>
                {selected && (
                    <POIPreviewModal
                        poi={selected}
                        onClose={() => setSelected(null)}
                        onReviewed={handleReviewed}
                    />
                )}
            </AnimatePresence>
        </DataTableShell>
    );
}
