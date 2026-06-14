import { User, Calendar, Users, Leaf, AlertCircle, Accessibility } from 'lucide-react';
import { useEffect, useState } from 'react';
import { bookingEmpresaApi, type EmpresaBooking, type TouristProfileResponse } from '../api/bookingApi';

interface Props {
    booking: EmpresaBooking | null;
}

export function TouristProfileCard({ booking }: Props) {
    const [profile, setProfile] = useState<TouristProfileResponse | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!booking) { setProfile(null); return; }
        setLoading(true);
        bookingEmpresaApi.getTouristProfile(booking.id_booking)
            .then(setProfile)
            .catch(() => setProfile(null))
            .finally(() => setLoading(false));
    }, [booking?.id_booking]);

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
                    <div className="h-10 w-10 rounded-full bg-current opacity-10" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/2 rounded bg-current opacity-10" />
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

    return (
        <div className="rounded-2xl border p-4" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-alt)' }}>
                Perfil del turista
            </p>

            {/* Avatar + name */}
            <div className="flex items-center gap-3">
                {tourist?.photo_url ? (
                    <img
                        src={tourist.photo_url}
                        alt={tourist.name}
                        className="h-10 w-10 rounded-full object-cover"
                    />
                ) : (
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ background: 'var(--color-purple)' }}
                    >
                        {initials}
                    </div>
                )}
                <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                        {tourist?.name ?? booking.tourist_name}
                    </p>
                    {memberSince && (
                        <p className="text-[11px]" style={{ color: 'var(--color-text-alt)' }}>
                            Miembro desde {memberSince}
                        </p>
                    )}
                </div>
            </div>

            {/* Booking info chips */}
            {bookingInfo && (
                <div className="mt-3 flex flex-wrap gap-2">
                    <div className="flex items-center gap-1 rounded-full border px-2 py-0.5" style={{ borderColor: 'var(--color-border)' }}>
                        <Calendar className="size-3" style={{ color: 'var(--color-text-alt)' }} />
                        <span className="text-[11px]" style={{ color: 'var(--color-text-alt)' }}>
                            {bookingInfo.visit_date}{bookingInfo.visit_time ? ` · ${bookingInfo.visit_time}` : ''}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 rounded-full border px-2 py-0.5" style={{ borderColor: 'var(--color-border)' }}>
                        <Users className="size-3" style={{ color: 'var(--color-text-alt)' }} />
                        <span className="text-[11px]" style={{ color: 'var(--color-text-alt)' }}>
                            {bookingInfo.guests} {bookingInfo.guests === 1 ? 'persona' : 'personas'}
                        </span>
                    </div>
                    {bookingInfo.is_walkin && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            Walk-in
                        </span>
                    )}
                </div>
            )}

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
                                className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-purple-100 dark:bg-purple-900/20"
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
                <div className="mt-3 space-y-1">
                    {tourist.has_accessibility && (
                        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-cyan)' }}>
                            <Accessibility className="size-3" />
                            <span>Requiere accesibilidad</span>
                        </div>
                    )}
                    {tourist.dietary_restrictions && (
                        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-orange)' }}>
                            <AlertCircle className="size-3" />
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
        </div>
    );
}
