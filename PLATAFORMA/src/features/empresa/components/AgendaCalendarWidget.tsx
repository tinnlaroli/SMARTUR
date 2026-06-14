import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { EmpresaBooking } from '../api/bookingApi';

interface Props {
    bookings: EmpresaBooking[];
    onDaySelect: (date: string | null) => void;
    selectedDate: string | null;
}

const STATUS_COLOR: Record<string, string> = {
    pending: '#F59E0B',
    confirmed: '#10B981',
    cancelled: '#6B7280',
};

function isoDate(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
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

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
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

    const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

    return (
        <div className="rounded-2xl border p-4" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
                <button onClick={prevMonth} className="rounded-lg p-1.5 transition-colors" style={{ color: 'var(--color-text-alt)' }}>
                    <ChevronLeft className="size-4" />
                </button>
                <span className="text-sm font-semibold capitalize" style={{ color: 'var(--color-text)' }}>
                    {monthLabel}
                </span>
                <button onClick={nextMonth} className="rounded-lg p-1.5 transition-colors" style={{ color: 'var(--color-text-alt)' }}>
                    <ChevronRight className="size-4" />
                </button>
            </div>

            {/* Weekday labels */}
            <div className="mb-1 grid grid-cols-7 text-center">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                    <div key={d} className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-alt)' }}>
                        {d}
                    </div>
                ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-0.5">
                {cells.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} />;
                    const dateStr = isoDate(viewYear, viewMonth, day);
                    const dayBookings = bookingsByDay[dateStr] ?? [];
                    const isToday =
                        day === today.getDate() &&
                        viewMonth === today.getMonth() &&
                        viewYear === today.getFullYear();
                    const isSelected = dateStr === selectedDate;

                    return (
                        <button
                            key={dateStr}
                            onClick={() => onDaySelect(isSelected ? null : dateStr)}
                            className="flex flex-col items-center rounded-lg p-1 transition-colors hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            style={isSelected ? { background: 'var(--color-purple)', color: 'white' } : {}}
                        >
                            <span
                                className={`text-xs font-medium leading-5 ${isToday && !isSelected ? 'rounded-full px-1 font-bold' : ''}`}
                                style={
                                    isToday && !isSelected
                                        ? { background: 'var(--color-purple)', color: 'white' }
                                        : isSelected
                                        ? { color: 'white' }
                                        : { color: 'var(--color-text)' }
                                }
                            >
                                {day}
                            </span>
                            {/* Booking dots */}
                            {dayBookings.length > 0 && (
                                <div className="mt-0.5 flex gap-0.5">
                                    {dayBookings.slice(0, 3).map((b, i) => (
                                        <span
                                            key={i}
                                            className="h-1 w-1 rounded-full"
                                            style={{ background: isSelected ? 'white' : STATUS_COLOR[b.status] ?? '#6B7280' }}
                                        />
                                    ))}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-3">
                {[['pending', 'Pendiente'], ['confirmed', 'Confirmada'], ['cancelled', 'Cancelada']].map(([s, l]) => (
                    <div key={s} className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[s] }} />
                        <span className="text-[10px]" style={{ color: 'var(--color-text-alt)' }}>{l}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
