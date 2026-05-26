import { useMemo, useState } from 'react';
import { useProfiles } from '../hooks/useProfiles';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../../users/components/Pagination';
import { UserCircle, Luggage, Heart, Leaf, Accessibility } from 'lucide-react';
import { TableBodyRows } from '../../../components/ui/TableSkeleton';
import {
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableHead,
    DataTableHeadCell,
    DataTableRow,
    DataTableScroll,
    DataTableShell,
    TableBadge,
} from '../../../components/ui/DataTable';
import type { Profile } from '../types/types';
import { MODULE_COLORS } from '../../../shared/config/moduleColors';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import ProfileDetailModal from '../components/ProfileDetailModal';

const humanize = (value?: string | null) => {
    if (!value) return null;
    return value
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getInterestLabels = (profile: Profile) =>
    (Array.isArray(profile.interests) ? profile.interests : [])
        .filter(Boolean)
        .map((interest) => humanize(interest) || interest);

const getInitials = (name?: string | null) =>
    (name || '?')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');

export const ProfilesPage = () => {
    const { lang } = useLanguage();
    const m = useMemo(() => getDashboardText(lang).modules, [lang]);
    const { profiles, isLoading, totalPages } = useProfiles();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;

    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            <div className="flex items-center gap-3 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                        {m.profiles.title}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        {m.profiles.subtitle}
                    </p>
                </div>
            </div>

            {/* Info banner */}
            <div className="rounded-xl border px-5 py-4 flex items-start gap-3 shrink-0" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                <UserCircle className="size-5 mt-0.5 shrink-0" style={{ color: MODULE_COLORS.profiles }} />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>Perfiles de viajero</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>Los perfiles agrupan preferencias de viaje recopiladas mediante el formulario inteligente. Se usan para personalizar las recomendaciones del motor de IA.</p>
                </div>
            </div>

            <DataTableShell className="h-full">
                {profiles.length === 0 && !isLoading ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3">
                        <UserCircle className="size-12" style={{ color: 'var(--color-border)' }} />
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-alt)' }}>
                            {m.profiles.empty}
                        </p>
                    </div>
                ) : (
                    <DataTableScroll>
                        <DataTable>
                            <DataTableHead>
                                <tr>
                                    <DataTableHeadCell>{m.profiles.colUser}</DataTableHeadCell>
                                    <DataTableHeadCell>
                                        <span className="flex items-center gap-1.5">
                                            <Luggage className="h-3.5 w-3.5" />
                                            {m.profiles.colTravelType}
                                        </span>
                                    </DataTableHeadCell>
                                    <DataTableHeadCell>
                                        <span className="flex items-center gap-1.5">
                                            <Heart className="h-3.5 w-3.5" />
                                            {m.profiles.colInterests}
                                        </span>
                                    </DataTableHeadCell>
                                    <DataTableHeadCell>
                                        <span className="flex items-center gap-1.5">
                                            <Leaf className="h-3.5 w-3.5" />
                                            {m.profiles.colPreferences}
                                        </span>
                                    </DataTableHeadCell>
                                    <DataTableHeadCell>
                                        <span className="flex items-center gap-1.5">
                                            <Accessibility className="h-3.5 w-3.5" />
                                            {m.profiles.colAccessibility}
                                        </span>
                                    </DataTableHeadCell>
                                </tr>
                            </DataTableHead>
                            <DataTableBody>
                                {isLoading ? (
                                    <TableBodyRows rows={9} colWidths={['w-52', 'w-40', 'flex-1', 'w-44', 'w-56']} />
                                ) : (
                                    profiles.map((profile, i) => {
                                        const demographicBits = [
                                            humanize(profile.gender),
                                            profile.age ? m.profiles.years(profile.age) : null,
                                            profile.age_range || null,
                                        ].filter(Boolean) as string[];
                                        const interestLabels = getInterestLabels(profile);
                                        const userName = profile.user?.name || m.profiles.userFallback(profile.user_id);
                                        const userSubtitle = profile.user?.email || `ID ${profile.user_id}`;
                                        const tt = profile.travel_type || '';
                                        const travelTypeLabel =
                                            tt in m.profiles.travelTypes
                                                ? m.profiles.travelTypes[tt as keyof typeof m.profiles.travelTypes]
                                                : humanize(tt);
                                        const pp = profile.preferred_place || '';
                                        const preferredPlaceLabel =
                                            pp in m.profiles.placeTypes
                                                ? m.profiles.placeTypes[pp as keyof typeof m.profiles.placeTypes]
                                                : humanize(pp);

                                        return (
                                            <DataTableRow
                                                key={profile.id}
                                                index={i}
                                                className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                                                onClick={() => setSelectedProfile(profile)}
                                            >
                                                <DataTableCell>
                                                    <div className="flex min-w-[240px] items-start gap-3">
                                                        {profile.user?.photo_url ? (
                                                            <img
                                                                src={profile.user.photo_url}
                                                                alt={userName}
                                                                className="mt-0.5 size-10 rounded-full border object-cover"
                                                                style={{ borderColor: 'var(--color-border)' }}
                                                            />
                                                        ) : (
                                                            <div
                                                                className="flex size-10 items-center justify-center rounded-full text-xs font-bold text-white"
                                                                style={{ background: 'var(--color-purple)' }}
                                                            >
                                                                {getInitials(userName)}
                                                            </div>
                                                        )}
                                                        <div className="space-y-1">
                                                            <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                                                                {userName}
                                                            </p>
                                                            <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                                                {userSubtitle}
                                                            </p>
                                                            <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                                                {demographicBits.length > 0 ? demographicBits.join(' • ') : m.profiles.profileRegistered}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </DataTableCell>
                                                <DataTableCell className="align-top">
                                                    <div className="flex min-w-[180px] flex-wrap gap-2">
                                                        {travelTypeLabel ? (
                                                            <TableBadge
                                                                text={travelTypeLabel}
                                                                color="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                                                            />
                                                        ) : (
                                                            <span className="text-xs text-zinc-400">{m.profiles.notAvailable}</span>
                                                        )}
                                                        {preferredPlaceLabel && (
                                                            <TableBadge text={preferredPlaceLabel} color="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" />
                                                        )}
                                                        <TableBadge
                                                            text={profile.has_visited_before ? m.profiles.visitedBefore : m.profiles.firstVisit}
                                                            color={
                                                                profile.has_visited_before
                                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                                                            }
                                                        />
                                                    </div>
                                                </DataTableCell>
                                                <DataTableCell className="align-top">
                                                    {interestLabels.length > 0 ? (
                                                        <div className="flex min-w-[240px] flex-wrap gap-2">
                                                            {interestLabels.map((interest) => (
                                                                <TableBadge
                                                                    key={`${profile.id}-${interest}`}
                                                                    text={interest}
                                                                    color="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                                                                />
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-zinc-400">{m.profiles.notAvailable}</span>
                                                    )}
                                                </DataTableCell>
                                                <DataTableCell className="align-top">
                                                    <div className="flex min-w-[190px] flex-wrap gap-2">
                                                        <TableBadge
                                                            text={
                                                                profile.sustainable_preferences
                                                                    ? m.profiles.prioritizesSustainability
                                                                    : m.profiles.noSustainablePriority
                                                            }
                                                            color={
                                                                profile.sustainable_preferences
                                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                                                            }
                                                        />
                                                        {profile.activity_level ? (
                                                            <TableBadge
                                                                text={m.profiles.activityLevel(profile.activity_level)}
                                                                color="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                                                            />
                                                        ) : null}
                                                    </div>
                                                </DataTableCell>
                                                <DataTableCell className="align-top">
                                                    <div className="min-w-[220px] space-y-2">
                                                        <TableBadge
                                                            text={
                                                                profile.has_accessibility
                                                                    ? m.profiles.requiresAccessibility
                                                                    : m.profiles.noSpecialRequirements
                                                            }
                                                            color={
                                                                profile.has_accessibility
                                                                    ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'
                                                                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                                                            }
                                                        />
                                                        {profile.accessibility_detail && (
                                                            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                                                                {profile.accessibility_detail}
                                                            </p>
                                                        )}
                                                        {profile.restrictions && (
                                                            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                                                                {m.profiles.restrictionsPrefix} {profile.restrictions}
                                                            </p>
                                                        )}
                                                    </div>
                                                </DataTableCell>
                                            </DataTableRow>
                                        );
                                    })
                                )}
                            </DataTableBody>
                        </DataTable>
                    </DataTableScroll>
                )}
            </DataTableShell>

            {profiles.length > 0 && (
                <Pagination page={page} limit={limit} totalPages={totalPages} setSearchParams={setSearchParams} />
            )}

            <ProfileDetailModal
                isOpen={selectedProfile !== null}
                onClose={() => setSelectedProfile(null)}
                profile={selectedProfile}
            />
        </div>
    );
};
