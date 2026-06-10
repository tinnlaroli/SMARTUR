import { useCallback, useEffect, useState } from 'react';
import { Calendar, RefreshCw, Plus, Check, X as XIcon, Clock, Users, Lock } from 'lucide-react';
import { bookingEmpresaApi, type EmpresaBooking, type BookingStatus, type WalkinPayload } from '../api/bookingApi';
import { useToast } from '../../../shared/context/ToastContext';
import { empresaApi, type EmpresaService } from '../api/empresaApi';
import { DATA_TABLE_SHELL_CLASS } from '../../../components/ui/DataTable';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';

const ACCENT = '#a855f7';

function StatusBlocker({ status }: { status: 'pending' | 'suspended' }) {
    const isPending = status === 'pending';
    return (
        <div className="flex flex-1 items-center justify-center">
            <div
                className="flex max-w-sm flex-col items-center gap-4 rounded-[28px] border p-8 text-center shadow-sm"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
            >
                <div className="flex size-14 items-center justify-center rounded-full"
                    style={{ background: isPending ? '#F59E0B18' : '#EF444418' }}>
                    <Lock className="size-6" style={{ color: isPending ? '#F59E0B' : '#EF4444' }} />
                </div>
                <div>
                    <p className="font-bold" style={{ color: 'var(--color-text)' }}>
                        {isPending ? 'Empresa en revisión' : 'Empresa suspendida'}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                        {isPending
                            ? 'Las reservas se activan una vez que el equipo SMARTUR apruebe tu empresa. Normalmente tarda 24–48 horas.'
                            : 'Tu cuenta ha sido suspendida. Contacta a soporte en soporte@smartur.online para más información.'}
                    </p>
                </div>
            </div>
        </div>
    );
}

type Filter = 'all' | BookingStatus;

function formatDate(iso: string) {
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(iso));
}

function StatusBadge({ status }: { status: BookingStatus }) {
    const styles: Record<BookingStatus, string> = {
        pending:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        cancelled: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    };
    const labels: Record<BookingStatus, string> = {
        pending:   'Pendiente',
        confirmed: 'Confirmada',
        cancelled: 'Cancelada',
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>
            {labels[status]}
        </span>
    );
}

interface WalkinModalProps {
    services: EmpresaService[];
    onClose: () => void;
    onSaved: () => void;
}

function WalkinModal({ services, onClose, onSaved }: WalkinModalProps) {
    const { success, error } = useToast();
    const today = new Date().toISOString().split('T')[0];
    const [form, setForm] = useState<WalkinPayload>({
        id_service: services[0]?.id_service ?? 0,
        visit_date: today,
        guests: 1,
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.id_service || !form.visit_date) return;
        setSaving(true);
        try {
            await bookingEmpresaApi.walkin(form);
            success('Walk-in registrado');
            onSaved();
            onClose();
        } catch {
            error('Error al registrar walk-in');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div
                className="w-full max-w-sm rounded-2xl border p-6 shadow-xl"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                        Registrar visita directa
                    </h2>
                    <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <XIcon className="size-4" style={{ color: 'var(--color-text-alt)' }} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-alt)' }}>
                            Servicio
                        </label>
                        <select
                            value={form.id_service}
                            onChange={(e) => setForm((f) => ({ ...f, id_service: Number(e.target.value) }))}
                            className="w-full rounded-xl border px-3 py-2 text-sm"
                            style={{
                                background: 'var(--color-bg-alt)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text)',
                            }}
                        >
                            {services.map((s) => (
                                <option key={s.id_service} value={s.id_service}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-alt)' }}>
                                Fecha
                            </label>
                            <input
                                type="date"
                                value={form.visit_date}
                                onChange={(e) => setForm((f) => ({ ...f, visit_date: e.target.value }))}
                                required
                                className="w-full rounded-xl border px-3 py-2 text-sm"
                                style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-alt)' }}>
                                Hora
                            </label>
                            <input
                                type="time"
                                value={form.visit_time ?? ''}
                                onChange={(e) => setForm((f) => ({ ...f, visit_time: e.target.value || undefined }))}
                                className="w-full rounded-xl border px-3 py-2 text-sm"
                                style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-alt)' }}>
                            Visitantes
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={form.guests ?? 1}
                            onChange={(e) => setForm((f) => ({ ...f, guests: Number(e.target.value) }))}
                            className="w-full rounded-xl border px-3 py-2 text-sm"
                            style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-alt)' }}>
                            Notas
                        </label>
                        <input
                            type="text"
                            value={form.notes ?? ''}
                            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || undefined }))}
                            placeholder="Opcional"
                            className="w-full rounded-xl border px-3 py-2 text-sm"
                            style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                        style={{ background: ACCENT }}
                    >
                        {saving ? 'Registrando...' : 'Registrar visita'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export function EmpresaCalendarioPage() {
    const { success, error, info } = useToast();
    const [bookings, setBookings] = useState<EmpresaBooking[]>([]);
    const [services, setServices] = useState<EmpresaService[]>([]);
    const [filter, setFilter] = useState<Filter>('all');
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<number | null>(null);
    const [showWalkin, setShowWalkin] = useState(false);
    const [companyStatus, setCompanyStatus] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [bookingData, svcData] = await Promise.all([
                bookingEmpresaApi.list(filter !== 'all' ? filter : undefined),
                empresaApi.getServices(),
            ]);
            setBookings(bookingData);
            setServices(Array.isArray(svcData) ? svcData : (svcData as { services: EmpresaService[] }).services ?? []);
        } catch {
            error('Error al cargar reservas');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        empresaApi.getProfile()
            .then(({ company }) => setCompanyStatus(company.status))
            .catch(() => {});
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleConfirm = async (id: number) => {
        setActionId(id);
        try {
            await bookingEmpresaApi.confirm(id);
            success('Reserva confirmada');
            await load();
        } catch {
            error('Error al confirmar');
        } finally {
            setActionId(null);
        }
    };

    const handleCancel = async (id: number) => {
        setActionId(id);
        try {
            await bookingEmpresaApi.cancel(id);
            info('Reserva cancelada');
            await load();
        } catch {
            error('Error al cancelar');
        } finally {
            setActionId(null);
        }
    };

    const filterBtn = (f: Filter, label: string) => (
        <button
            onClick={() => setFilter(f)}
            className="rounded-full px-4 py-1.5 text-sm font-medium transition-all"
            style={filter === f
                ? { backgroundColor: ACCENT, color: '#fff' }
                : { background: 'var(--color-bg-alt)', color: 'var(--color-text-alt)', border: '1px solid var(--color-border)' }
            }
        >
            {label}
        </button>
    );

    if (!loading && companyStatus && companyStatus !== 'active') {
        return (
            <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4">
                <div className="shrink-0">
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>Reservas</h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>Gestión de reservas y visitas directas</p>
                </div>
                <StatusBlocker status={companyStatus === 'suspended' ? 'suspended' : 'pending'} />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 sm:p-6">
            {showWalkin && (
                <WalkinModal
                    services={services}
                    onClose={() => setShowWalkin(false)}
                    onSaved={load}
                />
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ backgroundColor: `${ACCENT}20` }}>
                        <Calendar size={22} style={{ color: ACCENT }} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Reservas</h1>
                        <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>{bookings.length} registros</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowWalkin(true)}
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all"
                        style={{ background: ACCENT }}
                    >
                        <Plus size={15} />
                        Visita directa
                    </button>
                    <button
                        onClick={load}
                        className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-colors"
                        style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    >
                        <RefreshCw size={15} />
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {filterBtn('all', 'Todas')}
                {filterBtn('pending', 'Pendientes')}
                {filterBtn('confirmed', 'Confirmadas')}
                {filterBtn('cancelled', 'Canceladas')}
            </div>

            {/* Table */}
            <div className={DATA_TABLE_SHELL_CLASS}>
                {loading ? (
                    <TableSkeleton rows={6} colWidths={['flex-1', 'flex-1', 'w-32', 'w-20', 'w-28', 'w-32']} />
                ) : bookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: 'var(--color-text-alt)' }}>
                        <Calendar size={40} className="opacity-30" />
                        <p className="text-sm">No hay reservas en esta vista</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                                {(['Turista', 'Servicio', 'Fecha', 'Pax', 'Estado', 'Acciones'] as const).map((h, i) => (
                                    <th key={h} className={`py-3 px-4 text-xs font-semibold uppercase tracking-wide ${i < 2 ? 'text-left' : 'text-center'}`} style={{ color: 'var(--color-text-alt)' }}>
                                        {h === 'Fecha'
                                            ? <span className="flex items-center justify-center gap-1"><Calendar size={12} /> Fecha</span>
                                            : h === 'Pax'
                                            ? <span className="flex items-center justify-center gap-1"><Users size={12} /> Pax</span>
                                            : h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((b) => (
                                <tr
                                    key={b.id_booking}
                                    className="border-b transition-colors hover:brightness-[0.97]"
                                    style={{ borderColor: 'var(--color-border)' }}
                                >
                                    <td className="py-3 px-4 font-medium" style={{ color: 'var(--color-text)' }}>
                                        {b.is_walkin ? (
                                            <span className="text-xs italic" style={{ color: 'var(--color-text-alt)' }}>Visita directa</span>
                                        ) : b.tourist_name}
                                    </td>
                                    <td className="py-3 px-4 max-w-[180px] truncate" style={{ color: 'var(--color-text-alt)' }}>
                                        {b.service_name}
                                    </td>
                                    <td className="py-3 px-4 text-center" style={{ color: 'var(--color-text-alt)' }}>
                                        <span className="block">{formatDate(b.visit_date)}</span>
                                        {b.visit_time && (
                                            <span className="flex items-center justify-center gap-0.5 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                                <Clock size={10} />{b.visit_time.slice(0, 5)}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-center" style={{ color: 'var(--color-text-alt)' }}>{b.guests}</td>
                                    <td className="py-3 px-4 text-center">
                                        <StatusBadge status={b.status} />
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {b.status === 'pending' && (
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleConfirm(b.id_booking)}
                                                    disabled={actionId === b.id_booking}
                                                    className="rounded-lg p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 disabled:opacity-40"
                                                    title="Confirmar"
                                                >
                                                    <Check size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleCancel(b.id_booking)}
                                                    disabled={actionId === b.id_booking}
                                                    className="rounded-lg p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 disabled:opacity-40"
                                                    title="Cancelar"
                                                >
                                                    <XIcon size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default EmpresaCalendarioPage;
