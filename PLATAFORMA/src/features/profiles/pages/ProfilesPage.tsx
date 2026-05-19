import { useMemo } from 'react';
import { useProfiles } from '../hooks/useProfiles';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../../users/components/Pagination';
import { UserCircle, Luggage, Heart, Leaf, Accessibility } from 'lucide-react';
import { motion } from 'framer-motion';
import { TableBodyRows } from '../../../components/ui/TableSkeleton';
import type { Profile } from '../types/types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

const Badge = ({ text, color }: { text: string; color: string }) => (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>{text}</span>
);

const TH = ({ children }: { children: React.ReactNode }) => (
    <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-alt)' }}>
        {children}
    </th>
);

const TD = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <td className={`px-5 py-3.5 text-sm ${className}`} style={{ color: 'var(--color-text-alt)' }}>
        {children}
    </td>
);

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

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            <div className="flex items-center gap-3 shrink-0">
                <div className="flex size-10 items-center justify-center rounded-xl" style={{ background: 'var(--color-purple)' }}>
                    <UserCircle className="size-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                        {m.profiles.title}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        {m.profiles.subtitle}
                    </p>
                </div>
            </div>

            <div className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#121214]">
                {profiles.length === 0 && !isLoading ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3">
                        <UserCircle className="size-12" style={{ color: 'var(--color-border)' }} />
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-alt)' }}>
                            {m.profiles.empty}
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto min-h-0">
                        <table className="min-w-full">
                            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-[#18181b]">
                                <tr>
                                    <TH>{m.profiles.colOrder}</TH>
                                    <TH>{m.profiles.colUser}</TH>
                                    <TH>
                                        <span className="flex items-center gap-1.5">
                                            <Luggage className="h-3.5 w-3.5" />
                                            {m.profiles.colTravelType}
                                        </span>
                                    </TH>
                                    <TH>
                                        <span className="flex items-center gap-1.5">
                                            <Heart className="h-3.5 w-3.5" />
                                            {m.profiles.colInterests}
                                        </span>
                                    </TH>
                                    <TH>
                                        <span className="flex items-center gap-1.5">
                                            <Leaf className="h-3.5 w-3.5" />
                                            {m.profiles.colPreferences}
                                        </span>
                                    </TH>
                                    <TH>
                                        <span className="flex items-center gap-1.5">
                                            <Accessibility className="h-3.5 w-3.5" />
                                            {m.profiles.colAccessibility}
                                        </span>
                                    </TH>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <TableBodyRows rows={9} colWidths={['w-7', 'w-52', 'w-40', 'flex-1', 'w-44', 'w-56']} />
                                ) : (
                                    profiles.map((profile, i) => {
                                        const rowNumber = (page - 1) * limit + i + 1;
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
                                            <motion.tr
                                                key={profile.id}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="transition-colors"
                                                style={{ borderBottom: '1px solid var(--color-border)' }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(var(--rgb-text),0.03)')}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                                            >
                                                <TD>
                                                    <span
                                                        className="flex size-7 items-center justify-center rounded-lg text-xs font-bold text-white"
                                                        style={{ background: 'var(--color-purple)' }}
                                                    >
                                                        {rowNumber}
                                                    </span>
                                                </TD>
                                                <TD>
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
                                                </TD>
                                                <TD className="align-top">
                                                    <div className="flex min-w-[180px] flex-wrap gap-2">
                                                        {travelTypeLabel ? (
                                                            <Badge
                                                                text={travelTypeLabel}
                                                                color="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                                                            />
                                                        ) : (
                                                            <span className="text-xs text-zinc-400">{m.profiles.notAvailable}</span>
                                                        )}
                                                        {preferredPlaceLabel && (
                                                            <Badge text={preferredPlaceLabel} color="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" />
                                                        )}
                                                        <Badge
                                                            text={profile.has_visited_before ? m.profiles.visitedBefore : m.profiles.firstVisit}
                                                            color={
                                                                profile.has_visited_before
                                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                                                            }
                                                        />
                                                    </div>
                                                </TD>
                                                <TD className="align-top">
                                                    {interestLabels.length > 0 ? (
                                                        <div className="flex min-w-[240px] flex-wrap gap-2">
                                                            {interestLabels.map((interest) => (
                                                                <Badge
                                                                    key={`${profile.id}-${interest}`}
                                                                    text={interest}
                                                                    color="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                                                                />
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-zinc-400">{m.profiles.notAvailable}</span>
                                                    )}
                                                </TD>
                                                <TD className="align-top">
                                                    <div className="flex min-w-[190px] flex-wrap gap-2">
                                                        <Badge
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
                                                            <Badge
                                                                text={m.profiles.activityLevel(profile.activity_level)}
                                                                color="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                                                            />
                                                        ) : null}
                                                    </div>
                                                </TD>
                                                <TD className="align-top">
                                                    <div className="min-w-[220px] space-y-2">
                                                        <Badge
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
                                                </TD>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {profiles.length > 0 && (
                <Pagination page={page} limit={limit} totalPages={totalPages} setSearchParams={setSearchParams} />
            )}
        </div>
    );
};
