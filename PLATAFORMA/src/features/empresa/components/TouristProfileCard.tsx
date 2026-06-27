import { User, Calendar, Users, Leaf, AlertCircle, Accessibility, Mail, Copy, Check as CheckIcon, Tag, Repeat2, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { bookingEmpresaApi, type EmpresaBooking, type TouristProfileResponse, type BookingStatus } from '../api/bookingApi';

interface Props {
    booking: EmpresaBooking | null;
    onStartChat?: (touristId: number) => void;
}

const STATUS_CHIP: Record<BookingStatus, { label: string; className: string }> = {
    pending:   { label: 'Pendiente',  className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    confirmed: { label: 'Confirmada', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    cancelled: { label: 'Cancelada',  className: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' },
};

export function TouristProfileCard({ booking, onStartChat }: Props) {
    const [profile, setProfile] = useState<TouristProfileResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!booking) { setProfile(null); return; }
        setLoading(true);
        bookingEmpresaApi.getTouristProfile(booking.id_booking)
            .then(setProfile)
            .catch(() => setProfile(null))
            .finally(() => setLoading(false));
    }, [booking?.id_booking]);

    const copyEmail = (email: string) => {
        navigator.clipboard.writeText(email).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };

    if (!booking) {
        return (
            <div
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border p-6 text-center"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', minHeight: 160 }}
            >
                <User className="size-8 opacity-20" style={{ color: 'var(--color-text-alt)' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                    Selecciona una reserva para ver el perfil del turista
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="animate-pulse rounded-2xl border p-4" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 rounded-full bg-current opacity-10" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/2 rounded bg-current opacity-10" />
                        <div className="h-2 w-2/3 rounded bg-current opacity-10" />
                        <div className="h-2 w-1/3 rounded bg-current opacity-10" />
                    </div>
                </div>
                <div className="mt-3 space-y-2">
                    <div className="h-2 w-full rounded bg-current opacity-10" />
                    <div className="h-2 w-3/4 rounded bg-current opacity-10" />
                </div>
            </div>
        );
    }

    const tourist = profile?.tourist;
    const bookingInfo = profile?.booking;

    const initials = tourist?.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) ?? '?';

    const memberSince = tourist?.registration_date
        ? new Date(tourist.registration_date).getFullYear()
        : null;

    const bookingCount = tourist?.booking_count ?? 0;
    const visitLabel = bookingCount === 0
        ? 'Primera visita'
        : bookingCount === 1
        ? '1 visita anterior'
        : `${bookingCount} visitas anteriores`;

    const statusChip = bookingInfo?.status ? STATUS_CHIP[bookingInfo.status] : null;

    return (
        <div className="rounded-2xl border p-4" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-alt)' }}>
                Perfil del turista
            </p>

            {/* Avatar + name + email */}
            <div className="flex items-start gap-3">
                {tourist?.photo_url ? (
                    <img
                        src={tourist.photo_url}
                        alt={tourist.name}
                        className="h-14 w-14 shrink-0 rounded-full object-cover"
                    />
                ) : (
                    <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
                        style={{ background: 'var(--color-purple)' }}
                    >
                        {initials}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                        {tourist?.name ?? booking.tourist_name}
                    </p>
                    {memberSince && (
                        <p className="text-[11px]" style={{ color: 'var(--color-text-alt)' }}>
                            Miembro desde {memberSince}
                        </p>
                    )}
                    {tourist?.email && (
                        <button
                            onClick={() => copyEmail(tourist.email)}
                            className="mt-1 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            style={{ color: 'var(--color-text-alt)' }}
                            title="Copiar email"
                        >
                            <Mail className="size-3 shrink-0" />
                            <span className="max-w-[160px] truncate">{tourist.email}</span>
                            {copied
                                ? <CheckIcon className="size-3 shrink-0 text-emerald-500" />
                                : <Copy className="size-3 shrink-0 opacity-50" />
                            }
                        </button>
                    )}
                </div>
            </div>

            {/* Service + booking info chips */}
            {bookingInfo && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {bookingInfo.service_name && (
                        <div className="flex items-center gap-1 rounded-full border px-2 py-0.5" style={{ borderColor: 'var(--color-border)' }}>
                            <Tag className="size-3 shrink-0" style={{ color: 'var(--color-purple)' }} />
                            <span className="max-w-[120px] truncate text-[11px] font-medium" style={{ color: 'var(--color-text)' }}>
                                {bookingInfo.service_name}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-1 rounded-full border px-2 py-0.5" style={{ borderColor: 'var(--color-border)' }}>
                        <Calendar className="size-3" style={{ color: 'var(--color-text-alt)' }} />
                        <span className="text-[11px]" style={{ color: 'var(--color-text-alt)' }}>
                            {new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(bookingInfo.visit_date))}
                            {bookingInfo.visit_time ? ` · ${bookingInfo.visit_time.slice(0, 5)}` : ''}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 rounded-full border px-2 py-0.5" style={{ borderColor: 'var(--color-border)' }}>
                        <Users className="size-3" style={{ color: 'var(--color-text-alt)' }} />
                        <span className="text-[11px]" style={{ color: 'var(--color-text-alt)' }}>
                            {bookingInfo.guests} {bookingInfo.guests === 1 ? 'persona' : 'personas'}
                        </span>
                    </div>
                    {statusChip && (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusChip.className}`}>
                            {statusChip.label}
                        </span>
                    )}
                    {bookingInfo.is_walkin && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            Walk-in
                        </span>
                    )}
                </div>
            )}

            {/* Visit history with this company */}
            <div className="mt-3 flex items-center gap-1.5">
                <Repeat2
                    className="size-3.5 shrink-0"
                    style={{ color: bookingCount > 0 ? 'var(--color-purple)' : 'var(--color-text-alt)' }}
                />
                <span
                    className="text-[11px] font-medium"
                    style={{ color: bookingCount > 0 ? 'var(--color-purple)' : 'var(--color-text-alt)' }}
                >
                    {visitLabel}
                </span>
            </div>

            {/* Interests */}
            {tourist?.interests && tourist.interests.length > 0 && (
                <div className="mt-3">
                    <div className="mb-1 flex items-center gap-1">
                        <Leaf className="size-3" style={{ color: 'var(--color-green)' }} />
                        <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>
                            Intereses
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {tourist.interests.map(interest => (
                            <span
                                key={interest}
                                className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium dark:bg-purple-900/20"
                                style={{ color: 'var(--color-purple)' }}
                            >
                                {interest}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Accessibility / dietary */}
            {(tourist?.has_accessibility || tourist?.dietary_restrictions) && (
                <div className="mt-3 space-y-1.5">
                    {tourist.has_accessibility && (
                        <div>
                            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-cyan)' }}>
                                <Accessibility className="size-3 shrink-0" />
                                <span>Requiere accesibilidad</span>
                            </div>
                            {tourist.accessibility_description && (
                                <p className="mt-0.5 pl-[18px] text-[10px]" style={{ color: 'var(--color-text-alt)' }}>
                                    {tourist.accessibility_description}
                                </p>
                            )}
                        </div>
                    )}
                    {tourist.dietary_restrictions && (
                        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-orange)' }}>
                            <AlertCircle className="size-3 shrink-0" />
                            <span>{tourist.dietary_restrictions}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Notes */}
            {bookingInfo?.notes && (
                <p className="mt-3 rounded-lg p-2 text-[11px] italic" style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-alt)' }}>
                    "{bookingInfo.notes}"
                </p>
            )}

            {/* Start chat CTA */}
            {onStartChat && tourist && booking.user_id && !booking.is_walkin && (
                <button
                    onClick={() => onStartChat(booking.user_id!)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
                    style={{ background: 'var(--color-purple)' }}
                >
                    <MessageCircle className="size-4" />
                    Iniciar chat con {tourist.name.split(' ')[0]}
                </button>
            )}
        </div>
    );
}
