import { useEffect, useState, useMemo } from 'react';
import {
    X,
    UserCircle,
    Laptop,
    Bot,
    Luggage,
    Heart,
    Leaf,
    Accessibility,
    ChevronDown,
    ChevronUp,
    User as UserIcon,
} from 'lucide-react';
import type { Profile } from '../types/types';
import type { UserSession, UserRecommendationSession } from '../../users/types/types';
import { userServices } from '../../users/api/userApi';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import { MODULE_COLORS } from '../../../shared/config/moduleColors';
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    profile: Profile | null;
}

type Tab = 'profile' | 'sessions' | 'recommendations';

function formatDate(iso: string, locale: string) {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(iso),
    );
}

const humanize = (value?: string | null) => {
    if (!value) return null;
    return value
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());
};

const Badge = ({ text, color }: { text: string; color: string }) => (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
        {text}
    </span>
);

const SectionLabel = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-zinc-500 uppercase dark:text-zinc-500">
        {icon}
        {label}
    </span>
);

const ProfileDetailModal: React.FC<Props> = ({ isOpen, onClose, profile }) => {
    useEscapeKey(onClose);
    const { lang } = useLanguage();
    const m = useMemo(() => getDashboardText(lang).modules, [lang]);
    const dateLocale = useMemo(
        () => (lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : 'es-MX'),
        [lang],
    );

    const [activeTab, setActiveTab] = useState<Tab>('profile');

    // Sessions
    const [sessions, setSessions] = useState<UserSession[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);

    // Recommendations
    const [recSessions, setRecSessions] = useState<UserRecommendationSession[]>([]);
    const [recLoading, setRecLoading] = useState(false);
    const [expandedRec, setExpandedRec] = useState<number | null>(null);

    // Reset on open
    useEffect(() => {
        if (isOpen && profile) {
            setActiveTab('profile');
            setSessions([]);
            setRecSessions([]);
            setExpandedRec(null);
        }
    }, [isOpen, profile?.id]);

    // Load sessions lazily
    useEffect(() => {
        if (activeTab === 'sessions' && profile && sessions.length === 0 && !sessionsLoading) {
            setSessionsLoading(true);
            userServices
                .getUserSessions(profile.user_id)
                .then(setSessions)
                .catch(() => setSessions([]))
                .finally(() => setSessionsLoading(false));
        }
    }, [activeTab, profile?.user_id]);

    // Load recommendations lazily
    useEffect(() => {
        if (activeTab === 'recommendations' && profile && recSessions.length === 0 && !recLoading) {
            setRecLoading(true);
            userServices
                .getUserRecommendations(profile.user_id)
                .then(setRecSessions)
                .catch(() => setRecSessions([]))
                .finally(() => setRecLoading(false));
        }
    }, [activeTab, profile?.user_id]);

    if (!isOpen || !profile) return null;

    const userName = profile.user?.name || m.profiles.userFallback(profile.user_id);
    const userEmail = profile.user?.email || '';

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'profile',         label: m.profiles.tabProfile,         icon: <UserCircle className="size-3.5" /> },
        { id: 'sessions',        label: m.profiles.tabSessions,        icon: <Laptop className="size-3.5" /> },
        { id: 'recommendations', label: m.profiles.tabRecommendations, icon: <Bot className="size-3.5" /> },
    ];

    // Profile data helpers
    const interests = (Array.isArray(profile.interests) ? profile.interests : []).filter(Boolean);
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
    const demographicBits = [
        humanize(profile.gender),
        profile.age ? m.profiles.years(profile.age) : null,
        profile.age_range || null,
    ].filter(Boolean) as string[];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="animate-in fade-in zoom-in-95 w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl duration-200 dark:bg-[#121214]">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        {profile.user?.photo_url ? (
                            <img
                                src={profile.user.photo_url}
                                alt={userName}
                                className="size-9 rounded-full border object-cover dark:border-zinc-700"
                            />
                        ) : (
                            <div
                                className="flex size-9 items-center justify-center rounded-full text-sm font-bold text-white"
                                style={{ background: MODULE_COLORS.profiles }}
                            >
                                {(userName[0] || '?').toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h2 className="text-base font-semibold leading-tight text-zinc-900 dark:text-white">
                                {userName}
                            </h2>
                            {userEmail && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">{userEmail}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Tab bar */}
                <div className="flex gap-1 border-b border-zinc-200 px-4 dark:border-zinc-800">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="max-h-[65vh] overflow-y-auto p-6">

                    {/* ── Perfil tab ── */}
                    {activeTab === 'profile' && (
                        <div className="flex flex-col gap-5">
                            {/* Demographics */}
                            {demographicBits.length > 0 && (
                                <div>
                                    <SectionLabel icon={<UserIcon className="size-3" />} label={m.profiles.demographics} />
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                        {demographicBits.join(' · ')}
                                    </p>
                                </div>
                            )}

                            {/* Travel type */}
                            <div>
                                <SectionLabel icon={<Luggage className="size-3" />} label={m.profiles.colTravelType} />
                                <div className="flex flex-wrap gap-2">
                                    {travelTypeLabel ? (
                                        <Badge text={travelTypeLabel} color="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" />
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
                            </div>

                            {/* Interests */}
                            <div>
                                <SectionLabel icon={<Heart className="size-3" />} label={m.profiles.colInterests} />
                                {interests.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {interests.map((interest) => (
                                            <Badge
                                                key={interest}
                                                text={humanize(interest) || interest}
                                                color="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-xs text-zinc-400">{m.profiles.notAvailable}</span>
                                )}
                            </div>

                            {/* Preferences */}
                            <div>
                                <SectionLabel icon={<Leaf className="size-3" />} label={m.profiles.colPreferences} />
                                <div className="flex flex-wrap gap-2">
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
                                    {profile.activity_level != null && (
                                        <Badge
                                            text={m.profiles.activityLevel(profile.activity_level)}
                                            color="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Accessibility */}
                            <div>
                                <SectionLabel icon={<Accessibility className="size-3" />} label={m.profiles.colAccessibility} />
                                <div className="flex flex-col gap-1">
                                    <div className="flex flex-wrap gap-2">
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
                                    </div>
                                    {profile.accessibility_detail && (
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                            {profile.accessibility_detail}
                                        </p>
                                    )}
                                    {profile.restrictions && (
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                            {m.profiles.restrictionsPrefix} {profile.restrictions}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Sesiones tab ── */}
                    {activeTab === 'sessions' && (
                        <div>
                            {sessionsLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-violet-600 dark:border-zinc-700 dark:border-t-violet-500" />
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-12 text-zinc-400">
                                    <Laptop className="size-10" />
                                    <p className="text-sm">{m.profiles.noSessions}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {sessions.map((s) => (
                                        <div
                                            key={s.id}
                                            className="rounded-lg border p-3 flex items-start gap-3 dark:border-zinc-800"
                                        >
                                            <div
                                                className={`mt-0.5 size-2 rounded-full shrink-0 ${
                                                    s.revoked ? 'bg-zinc-400' : 'bg-emerald-500'
                                                }`}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                                    {s.device_hint || m.profiles.unknownDevice}
                                                </p>
                                                <p className="text-xs text-zinc-500">
                                                    {s.ip || '—'} · {formatDate(s.created_at, dateLocale)}
                                                </p>
                                                {s.last_seen && (
                                                    <p className="text-xs text-zinc-400">
                                                        {m.profiles.lastActivity} {formatDate(s.last_seen, dateLocale)}
                                                    </p>
                                                )}
                                            </div>
                                            <span
                                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                    s.revoked
                                                        ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
                                                        : new Date(s.expires_at) < new Date()
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                }`}
                                            >
                                                {s.revoked
                                                    ? m.profiles.sessionRevoked
                                                    : new Date(s.expires_at) < new Date()
                                                    ? m.profiles.sessionExpired
                                                    : m.profiles.sessionActive}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Recomendaciones tab ── */}
                    {activeTab === 'recommendations' && (
                        <div>
                            {recLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-violet-600 dark:border-zinc-700 dark:border-t-violet-500" />
                                </div>
                            ) : recSessions.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-12 text-zinc-400">
                                    <Bot className="size-10" />
                                    <p className="text-sm">{m.profiles.noRecommendations}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {recSessions.map((s) => {
                                        const clicked = s.feedback.filter((f) => f.clicked).length;
                                        const total = s.feedback.length;
                                        const isExpanded = expandedRec === s.id;
                                        return (
                                            <div
                                                key={s.id}
                                                className="rounded-lg border dark:border-zinc-800 overflow-hidden"
                                            >
                                                <button
                                                    onClick={() => setExpandedRec(isExpanded ? null : s.id)}
                                                    className="w-full flex items-center justify-between gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-left"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                                            {formatDate(s.created_at, dateLocale)}
                                                        </p>
                                                        <p className="text-xs text-zinc-500">
                                                            {m.profiles.recoDestinations(total, clicked)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {total > 0 && (
                                                            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                                                                CTR{' '}
                                                                {Math.round((clicked / total) * 100)}%
                                                            </span>
                                                        )}
                                                        {isExpanded ? (
                                                            <ChevronUp className="size-4 text-zinc-400" />
                                                        ) : (
                                                            <ChevronDown className="size-4 text-zinc-400" />
                                                        )}
                                                    </div>
                                                </button>
                                                {isExpanded && s.feedback.length > 0 && (
                                                    <div className="border-t dark:border-zinc-800 divide-y dark:divide-zinc-800">
                                                        {s.feedback.map((f) => (
                                                            <div
                                                                key={f.item_id}
                                                                className="flex items-center gap-2 px-3 py-2 text-xs"
                                                            >
                                                                <span className="text-zinc-400 w-5 text-right">
                                                                    {f.rank_pos}.
                                                                </span>
                                                                <span className="flex-1 font-mono text-zinc-600 dark:text-zinc-300 truncate">
                                                                    {f.item_id}
                                                                </span>
                                                                {f.clicked ? (
                                                                    <span className="rounded-full px-1.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold">
                                                                        {m.profiles.clickedLabel}
                                                                    </span>
                                                                ) : (
                                                                    <span className="rounded-full px-1.5 py-0.5 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 font-semibold">
                                                                        —
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileDetailModal;
