import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { EmpresaBooking } from '../api/bookingApi';

interface Props {
    bookings: EmpresaBooking[];
    onDaySelect: (date: string | null) => void;
    selectedDate: string | null;
}

const ACCENT = '#a855f7';

function isoDate(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function dayBadgeColor(dayBookings: EmpresaBooking[]): string {
    if (dayBookings.some(b => b.status === 'pending')) return '#F59E0B';
    if (dayBookings.some(b => b.status === 'confirmed')) return '#10B981';
    return '#6B7280';
}

export function AgendaCalendarWidget({ bookings, onDaySelect, selectedDate }: Props) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    const bookingsByDay = useMemo(() => {
        const map: Record<string, EmpresaBooking[]> = {};
        for (const b of bookings) {
            const day = b.visit_date.substring(0, 10);
            (map[day] ??= []).push(b);
        }
        return map;
    }, [bookings]);

    // Monday-first: (getDay() + 6) % 7 → Mon=0 … Sun=6
    const firstDay = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
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

    return (
        <div className="overflow-hidden rounded-2xl border" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>

            {/* Month navigation */}
            <div className="flex items-center justify-between border-b px-4 py-3.5" style={{ borderColor: 'var(--color-border)' }}>
                <button
                    onClick={prevMonth}
                    className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    style={{ color: 'var(--color-text-alt)' }}
                >
                    <ChevronLeft className="size-4" />
                </button>

                <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold capitalize" style={{ color: 'var(--color-text)' }}>
                        {monthLabel}
                    </span>
                    {!isCurrentMonth && (
                        <button
                            onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); }}
                            className="rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors hover:opacity-80"
                            style={{ borderColor: ACCENT + '40', color: ACCENT }}
                        >
                            Hoy
                        </button>
                    )}
                </div>

                <button
                    onClick={nextMonth}
                    className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    style={{ color: 'var(--color-text-alt)' }}
                >
                    <ChevronRight className="size-4" />
                </button>
            </div>

            <div className="px-4 pb-3 pt-4">
                {/* Weekday labels — Monday first */}
                <div className="mb-2 grid grid-cols-7">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                        <div
                            key={d}
                            className="text-center text-[11px] font-bold uppercase tracking-wider"
                            style={{ color: 'var(--color-text-alt)' }}
                        >
                            {d}
                        </div>
                    ))}
                </div>

                {/* Day grid */}
                <div className="grid grid-cols-7 gap-1">
                    {cells.map((day, idx) => {
                        if (!day) return <div key={`e-${idx}`} className="h-[70px]" />;

                        const dateStr = isoDate(viewYear, viewMonth, day);
                        const dayBookings = bookingsByDay[dateStr] ?? [];
                        const isToday = day === today.getDate() && isCurrentMonth;
                        const isSelected = dateStr === selectedDate;
                        const color = dayBadgeColor(dayBookings);

                        return (
                            <button
                                key={dateStr}
                                onClick={() => onDaySelect(isSelected ? null : dateStr)}
                                className={[
                                    'flex h-[70px] flex-col items-center justify-center rounded-2xl transition-all duration-150',
                                    !isSelected ? 'hover:bg-purple-50 dark:hover:bg-purple-900/20' : '',
                                ].join(' ')}
                                style={
                                    isSelected
                                        ? { background: ACCENT, boxShadow: `0 4px 14px ${ACCENT}50` }
                                        : isToday
                                        ? { background: ACCENT + '14', border: `2px solid ${ACCENT}40` }
                                        : {}
                                }
                            >
                                <span
                                    className="text-sm leading-none"
                                    style={{
                                        color: isSelected ? 'white' : isToday ? ACCENT : 'var(--color-text)',
                                        fontWeight: isToday || isSelected ? 700 : 500,
                                    }}
                                >
                                    {day}
                                </span>

                                {dayBookings.length > 0 ? (
                                    <span
                                        className="mt-2 flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none"
                                        style={{
                                            background: isSelected ? 'rgba(255,255,255,0.25)' : color + '22',
                                            color: isSelected ? 'white' : color,
                                        }}
                                    >
                                        {dayBookings.length}
                                    </span>
                                ) : (
                                    <span className="mt-2 h-5" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
                {[
                    ['#F59E0B', 'Pendiente'],
                    ['#10B981', 'Confirmada'],
                    ['#6B7280', 'Cancelada'],
                ].map(([c, l]) => (
                    <div key={l} className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                        <span className="text-[10px]" style={{ color: 'var(--color-text-alt)' }}>{l}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
