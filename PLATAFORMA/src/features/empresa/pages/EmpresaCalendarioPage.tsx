import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, RefreshCw, Plus, Check, X as XIcon, Clock, Users, Lock, UserCircle2 } from 'lucide-react';
import { bookingEmpresaApi, type EmpresaBooking, type BookingStatus, type WalkinPayload } from '../api/bookingApi';
import { useToast } from '../../../shared/context/ToastContext';
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey';
import { empresaApi, type EmpresaService } from '../api/empresaApi';
import { DATA_TABLE_SHELL_CLASS, DATA_TABLE_SCROLL_CLASS } from '../../../components/ui/DataTable';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { AgendaCalendarWidget } from '../components/AgendaCalendarWidget';
import { TouristProfileCard } from '../components/TouristProfileCard';
import { BusinessHoursPanel } from '../components/BusinessHoursPanel';

const ACCENT = '#a855f7';

function getTouristInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(n => n[0])
        .join('')
        .toUpperCase();
}

function formatDate(iso: string) {
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(iso));
}

function formatDateShort(iso: string) {
    return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(
        new Date(iso + 'T12:00:00'),
    );
}

function StatusBadge({ status }: { status: BookingStatus }) {
    const map: Record<BookingStatus, { label: string; cls: string }> = {
        pending:   { label: 'Pendiente',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
        confirmed: { label: 'Confirmada', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
        cancelled: { label: 'Cancelada',  cls: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' },
    };
    const { label, cls } = map[status];
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
            {label}
        </span>
    );
}

function StatusBlocker({ status }: { status: 'pending' | 'suspended' }) {
    const isPending = status === 'pending';
    return (
        <div className="flex flex-1 items-center justify-center">
            <div
                className="flex max-w-sm flex-col items-center gap-4 rounded-[28px] border p-8 text-center shadow-sm"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
            >
                <div
                    className="flex size-14 items-center justify-center rounded-full"
                    style={{ background: isPending ? '#F59E0B18' : '#EF444418' }}
                >
                    <Lock className="size-6" style={{ color: isPending ? '#F59E0B' : '#EF4444' }} />
                </div>
                <div>
                    <p className="font-bold" style={{ color: 'var(--color-text)' }}>
                        {isPending ? 'Empresa en revisión' : 'Empresa suspendida'}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                        {isPending
                            ? 'Las reservas se activan una vez que el equipo SMARTUR apruebe tu empresa. Normalmente tarda 24-48 horas.'
                            : 'Tu cuenta ha sido suspendida. Contacta a soporte en soporte@smartur.online para más información.'}
                    </p>
                </div>
            </div>
        </div>
    );
}

type Filter = 'all' | BookingStatus;

interface WalkinModalProps {
    services: EmpresaService[];
    onClose: () => void;
    onSaved: () => void;
}

function WalkinModal({ services, onClose, onSaved }: WalkinModalProps) {
    const { success, error } = useToast();
    useEscapeKey(onClose);
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
            success('Visita directa registrada');
            onSaved();
            onClose();
        } catch {
            error('Error al registrar visita directa');
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
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                            Registrar visita directa
                        </h2>
                        <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                            Walk-in sin reserva previa
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        <XIcon className="size-4" style={{ color: 'var(--color-text-alt)' }} />
                    </button>
                </div>

                {services.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                        <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                            No tienes servicios disponibles. Activa al menos uno primero.
                        </p>
                        <button
                            onClick={onClose}
                            className="rounded-xl border px-4 py-2 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                        >
                            Cerrar
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-alt)' }}>
                                Servicio
                            </label>
                            <select
                                value={form.id_service}
                                onChange={e => setForm(f => ({ ...f, id_service: Number(e.target.value) }))}
                                className="w-full rounded-xl border px-3 py-2 text-sm"
                                style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                            >
                                {services.map(s => (
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
                                    onChange={e => setForm(f => ({ ...f, visit_date: e.target.value }))}
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
                                    onChange={e => setForm(f => ({ ...f, visit_time: e.target.value || undefined }))}
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
                                onChange={e => setForm(f => ({ ...f, guests: Number(e.target.value) }))}
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
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value || undefined }))}
                                placeholder="Opcional"
                                className="w-full rounded-xl border px-3 py-2 text-sm"
                                style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="mt-1 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                            style={{ background: ACCENT }}
                        >
                            {saving ? 'Registrando...' : 'Registrar visita'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export function EmpresaCalendarioPage() {
    const navigate = useNavigate();
    const { success, error, info } = useToast();
    const [bookings, setBookings] = useState<EmpresaBooking[]>([]);
    const [services, setServices] = useState<EmpresaService[]>([]);
    const [filter, setFilter] = useState<Filter>('all');
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<number | null>(null);
    const [showWalkin, setShowWalkin] = useState(false);
    const [companyStatus, setCompanyStatus] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<EmpresaBooking | null>(null);

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

    // Blocked state
    if (!loading && companyStatus && companyStatus !== 'active') {
        return (
            <div className="flex h-full flex-col gap-4 overflow-hidden">
                <div className="shrink-0">
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>Reservas</h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>Gestión de reservas y visitas directas</p>
                </div>
                <StatusBlocker status={companyStatus === 'suspended' ? 'suspended' : 'pending'} />
            </div>
        );
    }

    const visibleBookings = bookings.filter(b => {
        if (selectedDate && b.visit_date.substring(0, 10) !== selectedDate) return false;
        return true;
    });

    const filterBtn = (f: Filter, label: string, count?: number) => {
        const active = filter === f;
        return (
            <button
                key={f}
                onClick={() => setFilter(f)}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all"
                style={active
                    ? { backgroundColor: ACCENT, color: '#fff' }
                    : { background: 'var(--color-bg)', color: 'var(--color-text-alt)', border: '1px solid var(--color-border)' }
                }
            >
                {label}
                {count !== undefined && count > 0 && (
                    <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
                        style={{ background: active ? 'rgba(255,255,255,0.25)' : ACCENT + '18', color: active ? 'white' : ACCENT }}
                    >
                        {count}
                    </span>
                )}
            </button>
        );
    };

    return (
        /* ── Full-viewport layout — calendar never shifts ── */
        <div className="flex h-full flex-col overflow-hidden">

            {showWalkin && (
                <WalkinModal
                    services={services.filter(s => s.status !== 'rejected')}
                    onClose={() => setShowWalkin(false)}
                    onSaved={load}
                />
            )}

            {/* ── Header row: title + actions ── */}
            <div className="mb-3 shrink-0 flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold leading-none" style={{ color: 'var(--color-text)' }}>
                        Agenda
                    </h1>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                        Reservas y visitas de tus turistas
                    </p>
                </div>
                <div className="flex shrink-0 gap-2">
                    <button
                        onClick={() => setShowWalkin(true)}
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ background: ACCENT }}
                    >
                        <Plus size={15} /> Visita directa
                    </button>
                    <button
                        onClick={load}
                        className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        Actualizar
                    </button>
                </div>
            </div>

            {/* ── Module info card ── */}
            <div
                className="mb-3 flex shrink-0 items-start gap-3 rounded-xl border px-5 py-4"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
            >
                <Calendar size={16} className="mt-0.5 shrink-0" style={{ color: ACCENT }} />
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Agenda de reservas — </span>
                    Visualiza, confirma y cancela reservas. Haz clic en un día del calendario para filtrar. Selecciona una reserva para ver el perfil del turista e iniciar un chat.
                </p>
            </div>

            {/* ── Main 2-col grid: fills remaining height, no reflow ── */}
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">

                {/* ── LEFT col: Calendar (fixed) + Filters (fixed) + Table (scrolls) ── */}
                <div className="flex min-h-0 flex-col gap-3 overflow-hidden">

                    {/* Calendar — never moves */}
                    <div className="shrink-0">
                        <AgendaCalendarWidget
                            bookings={bookings}
                            selectedDate={selectedDate}
                            onDaySelect={setSelectedDate}
                        />
                    </div>

                    {/* Filter tabs + status chips in one row */}
                    <div className="shrink-0 flex flex-wrap items-center gap-2">
                        {filterBtn('all',       'Todas')}
                        {filterBtn('pending',   'Pendientes', bookings.filter(b => b.status === 'pending').length)}
                        {filterBtn('confirmed', 'Confirmadas', bookings.filter(b => b.status === 'confirmed').length)}
                        {filterBtn('cancelled', 'Canceladas')}
                        {selectedDate && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium" style={{ borderColor: ACCENT + '40', color: ACCENT }}>
                                <Calendar size={10} />
                                {formatDateShort(selectedDate)}
                                <button onClick={() => setSelectedDate(null)} className="ml-0.5 opacity-60 hover:opacity-100">✕</button>
                            </span>
                        )}
                    </div>

                    {/* Booking table — scrolls inside its own container */}
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        <div className={DATA_TABLE_SHELL_CLASS + ' flex-1'}>
                            {loading ? (
                                <div className={DATA_TABLE_SCROLL_CLASS}>
                                    <TableSkeleton rows={5} colWidths={['w-48', 'flex-1', 'w-28', 'w-14', 'w-24', 'w-28']} />
                                </div>
                            ) : visibleBookings.length === 0 ? (
                                <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10" style={{ color: 'var(--color-text-alt)' }}>
                                    <UserCircle2 size={38} className="opacity-15" />
                                    <div className="text-center">
                                        <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                            Sin reservas{selectedDate ? ' para este día' : filter !== 'all' ? ` ${filter === 'pending' ? 'pendientes' : filter === 'confirmed' ? 'confirmadas' : 'canceladas'}` : ''}
                                        </p>
                                        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                            {selectedDate ? 'Elige otro día o limpia el filtro.' : 'Registra una visita directa o espera nuevas reservas.'}
                                        </p>
                                    </div>
                                    {selectedDate && (
                                        <button
                                            onClick={() => setSelectedDate(null)}
                                            className="rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                                        >
                                            Ver todas las fechas
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* Sticky header */}
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>Turista</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>Servicio</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>
                                                    <span className="flex items-center justify-center gap-1"><Calendar size={11} /> Fecha</span>
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>
                                                    <span className="flex items-center justify-center gap-1"><Users size={11} /> Pax</span>
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>Estado</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>Acciones</th>
                                            </tr>
                                        </thead>
                                    </table>

                                    {/* Scrollable tbody */}
                                    <div className={DATA_TABLE_SCROLL_CLASS}>
                                        <table className="w-full text-sm">
                                            <tbody>
                                                {visibleBookings.map(b => {
                                                    const isSelected = selectedBooking?.id_booking === b.id_booking;
                                                    return (
                                                        <tr
                                                            key={b.id_booking}
                                                            onClick={() => setSelectedBooking(prev => prev?.id_booking === b.id_booking ? null : b)}
                                                            className="cursor-pointer border-b transition-colors"
                                                            style={{
                                                                borderColor: 'var(--color-border)',
                                                                background: isSelected ? ACCENT + '08' : undefined,
                                                            }}
                                                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--color-bg-alt)'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = isSelected ? ACCENT + '08' : ''; }}
                                                        >
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2.5">
                                                                    <span
                                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                                                                        style={{ background: b.is_walkin ? '#F59E0B' : ACCENT }}
                                                                    >
                                                                        {getTouristInitials(b.tourist_name)}
                                                                    </span>
                                                                    <div className="min-w-0">
                                                                        <p className="truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                                                            {b.tourist_name}
                                                                        </p>
                                                                        {b.is_walkin && (
                                                                            <span className="text-[10px] font-semibold" style={{ color: '#D97706' }}>Walk-in</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="max-w-[150px] px-4 py-3">
                                                                <span className="block truncate text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                                                    {b.service_name}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className="block text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                                                    {formatDate(b.visit_date)}
                                                                </span>
                                                                {b.visit_time && (
                                                                    <span className="mt-0.5 flex items-center justify-center gap-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                                                        <Clock size={10} /> {b.visit_time.slice(0, 5)}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-center text-sm font-medium" style={{ color: 'var(--color-text-alt)' }}>
                                                                {b.guests}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <StatusBadge status={b.status} />
                                                            </td>
                                                            <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                                                                {b.status === 'pending' ? (
                                                                    <div className="flex items-center justify-center gap-1.5">
                                                                        <button
                                                                            onClick={() => handleConfirm(b.id_booking)}
                                                                            disabled={actionId === b.id_booking}
                                                                            title="Confirmar"
                                                                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors hover:brightness-95 disabled:opacity-40"
                                                                            style={{ background: '#10B98118', color: '#059669' }}
                                                                        >
                                                                            <Check size={12} /> OK
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleCancel(b.id_booking)}
                                                                            disabled={actionId === b.id_booking}
                                                                            title="Cancelar"
                                                                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors hover:brightness-95 disabled:opacity-40"
                                                                            style={{ background: '#EF444418', color: '#DC2626' }}
                                                                        >
                                                                            <XIcon size={12} /> No
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs" style={{ color: 'var(--color-text-alt)' }}>—</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT col: Business hours + Tourist profile ── */}
                <div className="flex min-h-0 flex-col gap-3 overflow-y-auto">
                    <BusinessHoursPanel
                        services={services}
                        onUpdate={(id, hours) => {
                            setServices(prev => prev.map(s =>
                                s.id_service === id ? { ...s, operating_hours: hours } : s,
                            ));
                        }}
                    />
                    <TouristProfileCard
                        booking={selectedBooking}
                        onStartChat={(touristId) => navigate(`/empresa/mensajes?tourist=${touristId}`)}
                    />
                </div>
            </div>
        </div>
    );
}

export default EmpresaCalendarioPage;
