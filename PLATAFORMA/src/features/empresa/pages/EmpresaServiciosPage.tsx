import { useEffect, useState } from 'react';
import {
    Wrench, CheckCircle2, XCircle, Plus, Pencil, Trash2,
    Loader2, X, AlertCircle,
} from 'lucide-react';
import {
    empresaApi,
    type EmpresaService,
    type ServiceCreatePayload,
    type ServiceUpdatePayload,
} from '../api/empresaApi';

// ── Service type options ────────────────────────────────────────────────────
const SERVICE_TYPES = [
    'Restaurante',
    'Hotel',
    'Ecoturismo',
    'Aventura',
    'Cultural',
    'Artesanías',
    'Transporte',
    'Guía Turístico',
    'Spa / Bienestar',
    'Entretenimiento',
    'Otro',
];

// ── Modal de creación / edición ─────────────────────────────────────────────
interface ServiceModalProps {
    initial?: EmpresaService | null;
    onClose: () => void;
    onSaved: (svc: EmpresaService) => void;
}

function ServiceModal({ initial, onClose, onSaved }: ServiceModalProps) {
    const isEdit = !!initial;
    const [form, setForm] = useState<ServiceCreatePayload>({
        name: initial?.name ?? '',
        description: initial?.description ?? '',
        service_type: initial?.service_type ?? '',
        address: initial?.address ?? '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.service_type) {
            setError('Nombre y tipo de servicio son obligatorios.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const payload = {
                ...form,
                name: form.name.trim(),
                description: form.description?.trim() || undefined,
                address: form.address?.trim() || undefined,
            };
            if (isEdit && initial) {
                const { service } = await empresaApi.updateService(initial.id_service, payload as ServiceUpdatePayload);
                onSaved(service);
            } else {
                const { service } = await empresaApi.createService(payload);
                onSaved(service);
            }
        } catch {
            setError('Error al guardar el servicio. Intenta de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full max-w-lg rounded-2xl border p-6 space-y-5"
                style={{
                    background: 'var(--color-bg)',
                    borderColor: 'var(--color-border)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                        {isEdit ? 'Editar servicio' : 'Nuevo servicio'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
                        style={{ color: 'var(--color-text-alt)' }}
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nombre */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                            Nombre <span style={{ color: 'var(--color-pink)' }}>*</span>
                        </label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            maxLength={120}
                            placeholder="Ej: Restaurante El Mirador"
                            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                            style={{
                                background: 'var(--color-bg-alt)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text)',
                            }}
                        />
                    </div>

                    {/* Tipo */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                            Tipo de servicio <span style={{ color: 'var(--color-pink)' }}>*</span>
                        </label>
                        <select
                            name="service_type"
                            value={form.service_type}
                            onChange={handleChange}
                            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none appearance-none"
                            style={{
                                background: 'var(--color-bg-alt)',
                                borderColor: 'var(--color-border)',
                                color: form.service_type ? 'var(--color-text)' : 'var(--color-text-alt)',
                            }}
                        >
                            <option value="">Selecciona un tipo…</option>
                            {SERVICE_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    {/* Descripción */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                            Descripción
                        </label>
                        <textarea
                            name="description"
                            value={form.description ?? ''}
                            onChange={handleChange}
                            rows={3}
                            maxLength={400}
                            placeholder="Describe brevemente tu servicio…"
                            className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none"
                            style={{
                                background: 'var(--color-bg-alt)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text)',
                            }}
                        />
                    </div>

                    {/* Dirección */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                            Dirección
                        </label>
                        <input
                            name="address"
                            value={form.address ?? ''}
                            onChange={handleChange}
                            maxLength={200}
                            placeholder="Ej: Av. Oriente 5, Orizaba, Ver."
                            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                            style={{
                                background: 'var(--color-bg-alt)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text)',
                            }}
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div
                            className="flex items-center gap-2 rounded-xl border p-3 text-xs"
                            style={{
                                background: 'var(--color-pink)10',
                                borderColor: 'var(--color-pink)40',
                                color: 'var(--color-pink)',
                            }}
                        >
                            <AlertCircle size={14} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Acciones */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
                            style={{
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text-alt)',
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
                            style={{ background: 'var(--color-purple)' }}
                        >
                            {saving && <Loader2 size={14} className="animate-spin" />}
                            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear servicio'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Modal de confirmación de eliminación ────────────────────────────────────
interface DeleteModalProps {
    service: EmpresaService;
    onClose: () => void;
    onDeleted: (id: number) => void;
}

function DeleteModal({ service, onClose, onDeleted }: DeleteModalProps) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await empresaApi.deleteService(service.id_service);
            onDeleted(service.id_service);
        } catch {
            setDeleting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full max-w-sm rounded-2xl border p-6 space-y-4"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="flex size-10 items-center justify-center rounded-xl shrink-0"
                        style={{ background: 'var(--color-pink)18' }}
                    >
                        <Trash2 size={18} style={{ color: 'var(--color-pink)' }} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                            Desactivar servicio
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                            Esta acción oculta el servicio de la app.
                        </p>
                    </div>
                </div>

                <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                    ¿Estás seguro de que quieres desactivar{' '}
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                        {service.name}
                    </span>
                    ? Los turistas no podrán verlo hasta que lo reactives.
                </p>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                        style={{ background: 'var(--color-pink)' }}
                    >
                        {deleting && <Loader2 size={14} className="animate-spin" />}
                        {deleting ? 'Desactivando…' : 'Desactivar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Página principal ────────────────────────────────────────────────────────
export function EmpresaServiciosPage() {
    const [services, setServices] = useState<EmpresaService[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState<string | null>(null);

    // Modals
    const [showCreate, setShowCreate]   = useState(false);
    const [editTarget, setEditTarget]   = useState<EmpresaService | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<EmpresaService | null>(null);

    useEffect(() => {
        empresaApi.getServices()
            .then(({ services: svcs }) => setServices(svcs))
            .catch(() => setError('Error al cargar servicios.'))
            .finally(() => setLoading(false));
    }, []);

    const handleSaved = (svc: EmpresaService) => {
        setServices((prev) => {
            const idx = prev.findIndex((s) => s.id_service === svc.id_service);
            if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = svc;
                return updated;
            }
            return [svc, ...prev];
        });
        setShowCreate(false);
        setEditTarget(null);
    };

    const handleDeleted = (id: number) => {
        // Soft-delete: mark as inactive instead of removing from list
        setServices((prev) =>
            prev.map((s) => (s.id_service === id ? { ...s, active: false } : s)),
        );
        setDeleteTarget(null);
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-20 rounded-2xl animate-pulse"
                        style={{ background: 'var(--color-bg-alt)' }}
                    />
                ))}
            </div>
        );
    }

    return (
        <>
            <div className="space-y-5">
                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1
                            className="text-xl font-bold"
                            style={{ color: 'var(--color-text)' }}
                        >
                            Mis Servicios
                        </h1>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-alt)' }}>
                            {services.length > 0
                                ? `${services.length} servicio${services.length !== 1 ? 's' : ''} registrado${services.length !== 1 ? 's' : ''}`
                                : 'Aún no tienes servicios registrados.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shrink-0"
                        style={{ background: 'var(--color-purple)' }}
                    >
                        <Plus size={15} /> Nuevo servicio
                    </button>
                </div>

                {/* ── Error global ── */}
                {error && (
                    <div
                        className="rounded-2xl border p-4 text-sm"
                        style={{
                            background: 'var(--color-pink)10',
                            borderColor: 'var(--color-pink)40',
                            color: 'var(--color-pink)',
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* ── Empty state ── */}
                {services.length === 0 && !error && (
                    <div
                        className="rounded-2xl border p-12 text-center space-y-4"
                        style={{
                            background: 'var(--color-bg)',
                            borderColor: 'var(--color-border)',
                        }}
                    >
                        <div
                            className="mx-auto flex size-14 items-center justify-center rounded-2xl"
                            style={{ background: 'var(--color-purple)18' }}
                        >
                            <Wrench size={24} style={{ color: 'var(--color-purple)' }} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                Sin servicios todavía
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--color-text-alt)' }}>
                                Agrega tu primer servicio turístico para que aparezca en la app SMARTUR.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowCreate(true)}
                            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
                            style={{ background: 'var(--color-purple)' }}
                        >
                            <Plus size={15} /> Agregar servicio
                        </button>
                    </div>
                )}

                {/* ── Lista de servicios ── */}
                <div className="space-y-3">
                    {services.map((svc) => (
                        <div
                            key={svc.id_service}
                            className="flex items-center gap-4 rounded-2xl border p-4"
                            style={{
                                background: 'var(--color-bg)',
                                borderColor: 'var(--color-border)',
                            }}
                        >
                            {/* Thumbnail / icon */}
                            {svc.image_url ? (
                                <img
                                    src={svc.image_url}
                                    alt={svc.name}
                                    className="size-16 rounded-xl object-cover shrink-0"
                                />
                            ) : (
                                <div
                                    className="size-16 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: 'var(--color-bg-alt)' }}
                                >
                                    <Wrench size={20} style={{ color: 'var(--color-text-alt)' }} />
                                </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p
                                        className="text-sm font-semibold truncate"
                                        style={{ color: 'var(--color-text)' }}
                                    >
                                        {svc.name}
                                    </p>
                                    {svc.active
                                        ? <CheckCircle2 size={13} className="shrink-0 text-green-400" />
                                        : <XCircle size={13} className="shrink-0 text-red-400" />}
                                </div>
                                {svc.service_type && (
                                    <p
                                        className="text-[11px] font-semibold mb-1"
                                        style={{ color: 'var(--color-purple)' }}
                                    >
                                        {svc.service_type}
                                    </p>
                                )}
                                {svc.description && (
                                    <p
                                        className="text-xs line-clamp-1"
                                        style={{ color: 'var(--color-text-alt)' }}
                                    >
                                        {svc.description}
                                    </p>
                                )}
                            </div>

                            {/* Status chip */}
                            <span
                                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
                                    svc.active
                                        ? 'bg-green-500/15 text-green-400 border-green-500/25'
                                        : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25'
                                }`}
                            >
                                {svc.active ? 'Activo' : 'Inactivo'}
                            </span>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setEditTarget(svc)}
                                    title="Editar"
                                    className="flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
                                    style={{ color: 'var(--color-text-alt)' }}
                                >
                                    <Pencil size={14} />
                                </button>
                                {svc.active && (
                                    <button
                                        type="button"
                                        onClick={() => setDeleteTarget(svc)}
                                        title="Desactivar"
                                        className="flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-red-500/15"
                                        style={{ color: 'var(--color-pink)' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Modals ── */}
            {showCreate && (
                <ServiceModal onClose={() => setShowCreate(false)} onSaved={handleSaved} />
            )}
            {editTarget && (
                <ServiceModal
                    initial={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSaved={handleSaved}
                />
            )}
            {deleteTarget && (
                <DeleteModal
                    service={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onDeleted={handleDeleted}
                />
            )}
        </>
    );
}
