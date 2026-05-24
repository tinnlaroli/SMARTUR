import { useEffect, useMemo, useState } from 'react';
import { useUser } from '../hooks/useUser';
import { UserPen, X, User as UserIcon, Mail, Shield, Activity, Calendar, Laptop, Bot, ChevronDown, ChevronUp } from 'lucide-react';
import EditUserModal from './EditUserModal';
import type { UpdateUserDTO, UserSession, UserRecommendationSession } from '../types/types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import { userServices } from '../api/userApi';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    userId: number | null;
    updateUser: (id: number, data: UpdateUserDTO) => Promise<boolean | undefined>;
}

type DetailTab = 'info' | 'sessions' | 'recommendations';

function formatDate(iso: string, locale: string) {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

const UserDetailModal: React.FC<Props> = ({ isOpen, onClose, userId, updateUser }) => {
    const { user, isLoading, error, findById } = useUser();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<DetailTab>('info');
    const { lang } = useLanguage();
    const mod = useMemo(() => getDashboardText(lang).modules.modals, [lang]);
    const dateLocale = useMemo(
        () => (lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : 'es-MX'),
        [lang],
    );

    // Sessions state
    const [sessions, setSessions] = useState<UserSession[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);

    // Recommendations state
    const [recSessions, setRecSessions] = useState<UserRecommendationSession[]>([]);
    const [recLoading, setRecLoading] = useState(false);
    const [expandedRec, setExpandedRec] = useState<number | null>(null);

    useEffect(() => {
        if (userId && isOpen) {
            findById(userId);
            setActiveTab('info');
            setSessions([]);
            setRecSessions([]);
        }
    }, [userId, isOpen]);

    useEffect(() => {
        if (activeTab === 'sessions' && userId && sessions.length === 0 && !sessionsLoading) {
            setSessionsLoading(true);
            userServices.getUserSessions(userId)
                .then(setSessions)
                .catch(() => setSessions([]))
                .finally(() => setSessionsLoading(false));
        }
    }, [activeTab, userId]);

    useEffect(() => {
        if (activeTab === 'recommendations' && userId && recSessions.length === 0 && !recLoading) {
            setRecLoading(true);
            userServices.getUserRecommendations(userId)
                .then(setRecSessions)
                .catch(() => setRecSessions([]))
                .finally(() => setRecLoading(false));
        }
    }, [activeTab, userId]);

    if (!isOpen) return null;

    const tabs: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
        { id: 'info',            label: 'Info',              icon: <UserIcon className="size-3.5" /> },
        { id: 'sessions',        label: 'Sesiones',          icon: <Laptop className="size-3.5" /> },
        { id: 'recommendations', label: 'Recomendaciones',   icon: <Bot className="size-3.5" /> },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="animate-in fade-in zoom-in-95 w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl duration-200 dark:bg-[#121214]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-white">
                        <UserIcon className="size-5 text-violet-500" />
                        {mod.users.detailTitle}
                    </h2>
                    <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
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

                <div className="p-6 max-h-[65vh] overflow-y-auto">
                    {isLoading && (
                        <div className="flex justify-center py-8">
                            <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-violet-600 dark:border-zinc-700 dark:border-t-violet-500"></div>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-lg bg-rose-50 p-4 dark:bg-rose-900/20">
                            <p className="text-sm font-medium text-rose-800 dark:text-rose-300">{error}</p>
                        </div>
                    )}

                    {/* ── Info tab ── */}
                    {activeTab === 'info' && user && !isLoading && (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                            <div className="col-span-2 flex items-center gap-4 rounded-lg border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                                <div className="size-16 shrink-0 overflow-hidden rounded-full border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 transition-transform hover:scale-105">
                                    {user.photo_url ? (
                                        <img src={user.photo_url} alt={user.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                            <UserIcon className="size-8" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{user.name}</p>
                                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                                        {user.role_id === 1 ? mod.users.platformAdmin : mod.users.registeredUser}
                                    </p>
                                </div>
                            </div>

                            <div className="col-span-2">
                                <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-zinc-500 uppercase dark:text-zinc-500">
                                    <Mail className="size-3" />
                                    {mod.users.emailLabel}
                                </span>
                                <p className="rounded border border-zinc-100 bg-zinc-50/50 p-2 text-sm text-zinc-900 dark:border-zinc-800/50 dark:bg-zinc-800/30 dark:text-zinc-100">{user.email}</p>
                            </div>

                            <div>
                                <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-zinc-500 uppercase dark:text-zinc-500">
                                    <Shield className="size-3" />
                                    {mod.users.roleLabel}
                                </span>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                    user.role_id === 1
                                        ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300'
                                        : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                                }`}>
                                    {user.role_id === 1 ? mod.users.admin : mod.users.user}
                                </span>
                            </div>

                            <div>
                                <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-zinc-500 uppercase dark:text-zinc-500">
                                    <Activity className="size-3" />
                                    {mod.users.statusLabel}
                                </span>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                    user.is_active
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                                }`}>
                                    {user.is_active ? mod.users.active : mod.users.inactive}
                                </span>
                            </div>

                            <div className="col-span-2 grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-zinc-500 uppercase dark:text-zinc-500">
                                        <Calendar className="size-3" />
                                        {mod.users.created}
                                    </span>
                                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400" suppressHydrationWarning>
                                        {new Date(user.created_at).toLocaleString(dateLocale)}
                                    </p>
                                </div>
                                <div>
                                    <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-zinc-500 uppercase dark:text-zinc-500">
                                        <Calendar className="size-3" />
                                        {mod.users.updated}
                                    </span>
                                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400" suppressHydrationWarning>
                                        {new Date(user.updated_at).toLocaleString(dateLocale)}
                                    </p>
                                </div>
                            </div>

                            <div className="col-span-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-violet-700 active:scale-[0.98]"
                                >
                                    <UserPen className="size-4" />
                                    <span>{mod.users.editUser}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Sessions tab ── */}
                    {activeTab === 'sessions' && (
                        <div>
                            {sessionsLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-violet-600 dark:border-zinc-700 dark:border-t-violet-500" />
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-12 text-zinc-400">
                                    <Laptop className="size-10" />
                                    <p className="text-sm">Sin sesiones registradas</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {sessions.map((s) => (
                                        <div key={s.id} className="rounded-lg border p-3 flex items-start gap-3 dark:border-zinc-800">
                                            <div className={`mt-0.5 size-2 rounded-full shrink-0 ${s.revoked ? 'bg-zinc-400' : 'bg-emerald-500'}`} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                                    {s.device_hint || 'Dispositivo desconocido'}
                                                </p>
                                                <p className="text-xs text-zinc-500">
                                                    {s.ip || '—'} · {formatDate(s.created_at, dateLocale)}
                                                </p>
                                                {s.last_seen && (
                                                    <p className="text-xs text-zinc-400">
                                                        Última actividad: {formatDate(s.last_seen, dateLocale)}
                                                    </p>
                                                )}
                                            </div>
                                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                s.revoked
                                                    ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
                                                    : new Date(s.expires_at) < new Date()
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            }`}>
                                                {s.revoked ? 'Revocada' : new Date(s.expires_at) < new Date() ? 'Expirada' : 'Activa'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Recommendations tab ── */}
                    {activeTab === 'recommendations' && (
                        <div>
                            {recLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-violet-600 dark:border-zinc-700 dark:border-t-violet-500" />
                                </div>
                            ) : recSessions.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-12 text-zinc-400">
                                    <Bot className="size-10" />
                                    <p className="text-sm">Sin sesiones de recomendación</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {recSessions.map((s) => {
                                        const clicked = s.feedback.filter((f) => f.clicked).length;
                                        const total = s.feedback.length;
                                        const isExpanded = expandedRec === s.id;
                                        return (
                                            <div key={s.id} className="rounded-lg border dark:border-zinc-800 overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedRec(isExpanded ? null : s.id)}
                                                    className="w-full flex items-center justify-between gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-left"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                                            {formatDate(s.created_at, dateLocale)}
                                                        </p>
                                                        <p className="text-xs text-zinc-500">
                                                            {total} destinos · {clicked} clic{clicked !== 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {total > 0 && (
                                                            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                                                                CTR {total > 0 ? Math.round((clicked / total) * 100) : 0}%
                                                            </span>
                                                        )}
                                                        {isExpanded ? <ChevronUp className="size-4 text-zinc-400" /> : <ChevronDown className="size-4 text-zinc-400" />}
                                                    </div>
                                                </button>
                                                {isExpanded && s.feedback.length > 0 && (
                                                    <div className="border-t dark:border-zinc-800 divide-y dark:divide-zinc-800">
                                                        {s.feedback.map((f) => (
                                                            <div key={f.item_id} className="flex items-center gap-2 px-3 py-2 text-xs">
                                                                <span className="text-zinc-400 w-5 text-right">{f.rank_pos}.</span>
                                                                <span className="flex-1 font-mono text-zinc-600 dark:text-zinc-300 truncate">{f.item_id}</span>
                                                                {f.clicked ? (
                                                                    <span className="rounded-full px-1.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold">✓ clic</span>
                                                                ) : (
                                                                    <span className="rounded-full px-1.5 py-0.5 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 font-semibold">—</span>
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
            {isEditModalOpen && user && <EditUserModal onClose={() => setIsEditModalOpen(false)} onSubmit={updateUser} user={user} />}
        </div>
    );
};

export default UserDetailModal;
