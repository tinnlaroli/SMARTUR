import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { EmpresaBooking, BookingStatus } from '../api/bookingApi';

interface Props {
    bookings: EmpresaBooking[];
    onDaySelect: (date: string | null) => void;
    selectedDate: string | null;
}

const ACCENT = '#a855f7';

const STATUS_STYLE: Record<BookingStatus, { bg: string; text: string; dot: string }> = {
    pending:   { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
    confirmed: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
    cancelled: { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
};

function isoDate(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function firstName(name: string) {
    return name.split(' ')[0] ?? name;
}

export function AgendaCalendarWidget({ bookings, onDaySelect, selectedDate }: Props) {
    const today = new Date();
    const [viewYear, setViewYear]   = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    const bookingsByDay = useMemo(() => {
        const map: Record<string, EmpresaBooking[]> = {};
        for (const b of bookings) {
            const day = b.visit_date.substring(0, 10);
            (map[day] ??= []).push(b);
        }
        return map;
    }, [bookings]);

    // Month stats
    const monthStats = useMemo(() => {
        let pending = 0, confirmed = 0, cancelled = 0;
        for (const b of bookings) {
            const d = new Date(b.visit_date + 'T12:00:00');
            if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
                if (b.status === 'pending') pending++;
                else if (b.status === 'confirmed') confirmed++;
                else if (b.status === 'cancelled') cancelled++;
            }
        }
        return { pending, confirmed, cancelled };
    }, [bookings, viewYear, viewMonth]);

    // Monday-first grid: (getDay() + 6) % 7 → Mon=0 … Sun=6
    const firstDay    = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const prevMonth = () => {
        if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
        else setViewMonth(m => m + 1);
    };

    const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
    const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

    const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const MAX_VISIBLE = 2;

    return (
        <div
            className="overflow-hidden rounded-2xl border"
            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between border-b px-5 py-4"
                style={{ borderColor: 'var(--color-border)' }}
            >
                <div className="flex items-center gap-2">
                    <CalendarDays className="size-4" style={{ color: ACCENT }} />
                    <span
                        className="text-sm font-bold capitalize"
                        style={{ color: 'var(--color-text)' }}
                    >
                        {monthLabel}
                    </span>
                    {!isCurrentMonth && (
                        <button
                            onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); }}
                            className="ml-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors hover:opacity-80"
                            style={{ borderColor: ACCENT + '40', color: ACCENT }}
                        >
                            Hoy
                        </button>
                    )}
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={prevMonth}
                        className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        style={{ color: 'var(--color-text-alt)' }}
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                    <button
                        onClick={nextMonth}
                        className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        style={{ color: 'var(--color-text-alt)' }}
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </div>
            </div>

            {/* Weekday headers */}
            <div
                className="grid grid-cols-7 border-b"
                style={{ borderColor: 'var(--color-border)' }}
            >
                {DAYS.map((d, i) => (
                    <div
                        key={d}
                        className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide"
                        style={{
                            color: i >= 5 ? ACCENT + 'bb' : 'var(--color-text-alt)',
                            borderRight: i < 6 ? '1px solid var(--color-border)' : undefined,
                        }}
                    >
                        {d}
                    </div>
                ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7">
                {cells.map((day, idx) => {
                    if (!day) {
                        return (
                            <div
                                key={`e-${idx}`}
                                className="min-h-[96px]"
                                style={{
                                    background: 'var(--color-bg-alt)',
                                    borderRight: idx % 7 < 6 ? '1px solid var(--color-border)' : undefined,
                                    borderBottom: '1px solid var(--color-border)',
                                    opacity: 0.5,
                                }}
                            />
                        );
                    }

                    const dateStr  = isoDate(viewYear, viewMonth, day);
                    const dayBkgs  = bookingsByDay[dateStr] ?? [];
                    const isToday  = day === today.getDate() && isCurrentMonth;
                    const isSel    = dateStr === selectedDate;
                    const visible  = dayBkgs.slice(0, MAX_VISIBLE);
                    const overflow = dayBkgs.length - MAX_VISIBLE;

                    return (
                        <button
                            key={dateStr}
                            onClick={() => onDaySelect(isSel ? null : dateStr)}
                            className="group flex min-h-[96px] flex-col gap-1 p-1.5 text-left transition-all duration-100"
                            style={{
                                borderRight: idx % 7 < 6 ? '1px solid var(--color-border)' : undefined,
                                borderBottom: '1px solid var(--color-border)',
                                background: isSel ? ACCENT + '0e' : 'var(--color-bg)',
                            }}
                        >
                            {/* Date number */}
                            <div className="flex items-center justify-end pr-0.5 pt-0.5">
                                <span
                                    className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold leading-none transition-colors"
                                    style={
                                        isToday
                                            ? { background: ACCENT, color: 'white', fontWeight: 700 }
                                            : isSel
                                            ? { background: ACCENT + '20', color: ACCENT, fontWeight: 700 }
                                            : { color: 'var(--color-text-alt)' }
                                    }
                                >
                                    {day}
                                </span>
                            </div>

                            {/* Event chips */}
                            <div className="flex flex-col gap-0.5">
                                {visible.map(b => {
                                    const s = STATUS_STYLE[b.status];
                                    return (
                                        <div
                                            key={b.id_booking}
                                            className="flex items-center gap-1 overflow-hidden rounded px-1 py-0.5"
                                            style={{ background: s.bg }}
                                        >
                                            <span
                                                className="h-1.5 w-1.5 shrink-0 rounded-full"
                                                style={{ background: s.dot }}
                                            />
                                            <span
                                                className="truncate text-[10px] font-medium leading-tight"
                                                style={{ color: s.text }}
                                            >
                                                {firstName(b.tourist_name)}
                                                {b.visit_time ? ` · ${b.visit_time.slice(0, 5)}` : ''}
                                            </span>
                                        </div>
                                    );
                                })}
                                {overflow > 0 && (
                                    <span
                                        className="pl-1 text-[10px] font-medium"
                                        style={{ color: 'var(--color-text-alt)' }}
                                    >
                                        +{overflow} más
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Month summary bar */}
            {(monthStats.pending > 0 || monthStats.confirmed > 0 || monthStats.cancelled > 0) && (
                <div
                    className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t px-5 py-3"
                    style={{ borderColor: 'var(--color-border)' }}
                >
                    {monthStats.pending > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: '#F59E0B' }} />
                            <span className="text-[11px] font-medium" style={{ color: '#92400E' }}>
                                {monthStats.pending} pendiente{monthStats.pending !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                    {monthStats.confirmed > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: '#10B981' }} />
                            <span className="text-[11px] font-medium" style={{ color: '#065F46' }}>
                                {monthStats.confirmed} confirmada{monthStats.confirmed !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                    {monthStats.cancelled > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: '#9CA3AF' }} />
                            <span className="text-[11px]" style={{ color: 'var(--color-text-alt)' }}>
                                {monthStats.cancelled} cancelada{monthStats.cancelled !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
