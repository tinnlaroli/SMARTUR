import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, RefreshCw, Plus, Check, X as XIcon, Clock, Users, Lock, UserCircle2 } from 'lucide-react';
import { bookingEmpresaApi, type EmpresaBooking, type BookingStatus, type WalkinPayload } from '../api/bookingApi';
import { useToast } from '../../../shared/context/ToastContext';
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey';
import { empresaApi, type EmpresaService } from '../api/empresaApi';
import { DATA_TABLE_SHELL_CLASS } from '../../../components/ui/DataTable';
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
                            ? 'Las reservas se activan una vez que el equipo WELLTUR apruebe tu empresa. Normalmente tarda 24-48 horas.'
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

    // Status counts from the current bookings set
    const pendingCount   = useMemo(() => bookings.filter(b => b.status === 'pending').length, [bookings]);
    const confirmedCount = useMemo(() => bookings.filter(b => b.status === 'confirmed').length, [bookings]);

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

    const visibleBookings = bookings.filter(b => {
        if (selectedDate && b.visit_date.substring(0, 10) !== selectedDate) return false;
        return true;
    });

    const filterBtn = (f: Filter, label: string) => {
        const active = filter === f;
        return (
            <button
                key={f}
                onClick={() => setFilter(f)}
                className="rounded-full px-3.5 py-1.5 text-sm font-medium transition-all"
                style={active
                    ? { backgroundColor: ACCENT, color: '#fff' }
                    : { background: 'var(--color-bg-alt)', color: 'var(--color-text-alt)', border: '1px solid var(--color-border)' }
                }
            >
                {label}
            </button>
        );
    };

    return (
        <div className="p-4 sm:p-6">
            {showWalkin && (
                <WalkinModal
                    services={services.filter(s => s.status !== 'rejected')}
                    onClose={() => setShowWalkin(false)}
                    onSaved={load}
                />
            )}

            {/* Header */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl p-2" style={{ backgroundColor: ACCENT + '18' }}>
                            <Calendar size={20} style={{ color: ACCENT }} />
                        </div>
                        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                            Agenda
                        </h1>
                    </div>

                    {/* Stat pills + active date chip */}
                    {!loading && (
                        <div className="mt-2.5 flex flex-wrap items-center gap-2 pl-0 sm:pl-11">
                            {pendingCount > 0 && (
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                                    style={{ background: '#F59E0B18', color: '#D97706' }}
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                    {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                                </span>
                            )}
                            {confirmedCount > 0 && (
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                                    style={{ background: '#10B98118', color: '#059669' }}
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    {confirmedCount} confirmada{confirmedCount !== 1 ? 's' : ''}
                                </span>
                            )}
                            {pendingCount === 0 && confirmedCount === 0 && (
                                <span className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                    {bookings.length === 0 ? 'Sin reservas' : `${bookings.length} reserva${bookings.length !== 1 ? 's' : ''}`}
                                </span>
                            )}
                            {selectedDate && (
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
                                    style={{ borderColor: ACCENT + '40', color: ACCENT }}
                                >
                                    <Calendar size={10} />
                                    {formatDateShort(selectedDate)}
                                    <button
                                        onClick={() => setSelectedDate(null)}
                                        className="ml-0.5 opacity-60 transition-opacity hover:opacity-100"
                                        aria-label="Quitar filtro de fecha"
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                        </div>
                    )}
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
                        style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        Actualizar
                    </button>
                </div>
            </div>

            {/* 2-Column Grid */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">

                {/* LEFT: Calendar + Filters + Table */}
                <div className="flex flex-col gap-4">
                    <AgendaCalendarWidget
                        bookings={bookings}
                        selectedDate={selectedDate}
                        onDaySelect={setSelectedDate}
                    />

                    {/* Status filter tabs */}
                    <div className="flex flex-wrap gap-2">
                        {filterBtn('all',       'Todas')}
                        {filterBtn('pending',   'Pendientes')}
                        {filterBtn('confirmed', 'Confirmadas')}
                        {filterBtn('cancelled', 'Canceladas')}
                    </div>

                    {/* Bookings table */}
                    <div className={DATA_TABLE_SHELL_CLASS}>
                        {loading ? (
                            <TableSkeleton rows={5} colWidths={['w-48', 'flex-1', 'w-28', 'w-14', 'w-24', 'w-28']} />
                        ) : visibleBookings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-14" style={{ color: 'var(--color-text-alt)' }}>
                                <UserCircle2 size={38} className="opacity-15" />
                                <div className="text-center">
                                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                        Sin reservas{selectedDate ? ' para este día' : filter !== 'all' ? ` ${filter === 'pending' ? 'pendientes' : filter === 'confirmed' ? 'confirmadas' : 'canceladas'}` : ''}
                                    </p>
                                    <p className="mt-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                        {selectedDate ? 'Elige otro día en el calendario o limpia el filtro.' : 'Registra una visita directa o espera nuevas reservas.'}
                                    </p>
                                </div>
                                {selectedDate && (
                                    <button
                                        onClick={() => setSelectedDate(null)}
                                        className="mt-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                                    >
                                        Ver todas las fechas
                                    </button>
                                )}
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>
                                            Turista
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>
                                            Servicio
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>
                                            <span className="flex items-center justify-center gap-1">
                                                <Calendar size={11} /> Fecha
                                            </span>
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>
                                            <span className="flex items-center justify-center gap-1">
                                                <Users size={11} /> Pax
                                            </span>
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>
                                            Estado
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
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
                                                {/* Turista */}
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
                                                                <span className="text-[10px] font-semibold" style={{ color: '#D97706' }}>
                                                                    Walk-in
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Servicio */}
                                                <td className="max-w-[150px] px-4 py-3">
                                                    <span className="block truncate text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                                        {b.service_name}
                                                    </span>
                                                </td>

                                                {/* Fecha */}
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

                                                {/* Pax */}
                                                <td className="px-4 py-3 text-center text-sm font-medium" style={{ color: 'var(--color-text-alt)' }}>
                                                    {b.guests}
                                                </td>

                                                {/* Estado */}
                                                <td className="px-4 py-3 text-center">
                                                    <StatusBadge status={b.status} />
                                                </td>

                                                {/* Acciones */}
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
                        )}
                    </div>
                </div>

                {/* RIGHT: Business Hours + Tourist Profile */}
                <div className="flex flex-col gap-4">
                    <BusinessHoursPanel
                        services={services}
                        onUpdate={(id, hours) => {
                            setServices(prev => prev.map(s =>
                                s.id_service === id ? { ...s, operating_hours: hours } : s,
                            ));
                        }}
                    />
                    <TouristProfileCard booking={selectedBooking} />
                </div>
            </div>
        </div>
    );
}

export default EmpresaCalendarioPage;
