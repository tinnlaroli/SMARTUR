import { useEffect, useMemo, useState } from 'react';
import { useUser } from '../hooks/useUser';
import { UserPen, X, User as UserIcon, Mail, Shield, Activity, Calendar, BrainCircuit } from 'lucide-react';
import { api } from '../../../shared/api/axiosClient';
import EditUserModal from './EditUserModal';
import type { UpdateUserDTO } from '../types/types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

interface AiMetrics {
    total_sessions: number;
    total_items_shown: number;
    total_clicks: number;
    ctr_pct: number;
    avg_latency_ms: number;
    last_session_at: string | null;
    top_algorithm: string | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    userId: number | null;
    updateUser: (id: number, data: UpdateUserDTO) => Promise<boolean | undefined>;
}

const UserDetailModal: React.FC<Props> = ({ isOpen, onClose, userId, updateUser }) => {
    const { user, isLoading, error, findById } = useUser();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [aiMetrics, setAiMetrics] = useState<AiMetrics | null>(null);
    const { lang } = useLanguage();
    const mod = useMemo(() => getDashboardText(lang).modules.modals, [lang]);
    const dateLocale = useMemo(
        () => (lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : 'es-MX'),
        [lang],
    );

    useEffect(() => {
        if (userId && isOpen) {
            findById(userId);
            setAiMetrics(null);
            api.get<AiMetrics>(`/ml/sessions/user/${userId}`)
                .then(r => setAiMetrics(r.data))
                .catch(() => {});
        }
    }, [userId, isOpen]);

    // Re-fetch user data whenever EditModal closes (covers both save & cancel — harmless extra request)
    useEffect(() => {
        if (!isEditModalOpen && userId && isOpen) findById(userId);
    }, [isEditModalOpen]);

    if (!isOpen) return null;

    const getRoleLabel = (role_id: number) => {
        if (role_id === 1) return mod.users.admin;
        if (role_id === 3) return mod.users.roleEmpresa;
        return mod.users.user;
    };

    const getRoleSubtitle = (role_id: number) => {
        if (role_id === 1) return mod.users.platformAdmin;
        if (role_id === 3) return mod.users.roleEmpresa;
        return mod.users.registeredUser;
    };

    const getRoleBadgeStyle = (role_id: number): React.CSSProperties => {
        if (role_id === 1) return {
            background: 'rgba(var(--rgb-purple-accent), 0.12)',
            color: 'var(--color-purple)',
            border: '1px solid rgba(var(--rgb-purple-accent), 0.25)',
        };
        if (role_id === 3) return {
            background: 'rgba(245,158,11, 0.12)',
            color: '#b45309',
            border: '1px solid rgba(245,158,11, 0.3)',
        };
        return {
            background: 'rgba(var(--rgb-text), 0.07)',
            color: 'var(--color-text-alt)',
            border: '1px solid rgba(var(--rgb-text), 0.12)',
        };
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div
                className="animate-in fade-in zoom-in-95 w-full max-w-lg overflow-hidden rounded-xl shadow-2xl duration-200"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <h2 className="flex items-center gap-2 text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                        <UserIcon className="size-5" style={{ color: 'var(--color-purple)' }} />
                        {mod.users.detailTitle}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 transition-colors"
                        style={{ color: 'var(--color-text-alt)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(var(--rgb-text),0.07)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[65vh] overflow-y-auto">
                    {isLoading && (
                        <div className="flex justify-center py-8">
                            <div className="size-8 animate-spin rounded-full border-4" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-purple)' }} />
                        </div>
                    )}

                    {error && (
                        <div className="rounded-lg p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <p className="text-sm font-medium" style={{ color: '#dc2626' }}>{error}</p>
                        </div>
                    )}

                    {user && !isLoading && (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                            {/* Avatar + nombre */}
                            <div className="col-span-2 flex items-center gap-4 rounded-lg p-4" style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
                                <div className="size-16 shrink-0 overflow-hidden rounded-full" style={{ border: '2px solid var(--color-border)', background: 'var(--color-bg-alt)' }}>
                                    {user.photo_url ? (
                                        <img src={user.photo_url} alt={user.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center" style={{ color: 'var(--color-text-alt)' }}>
                                            <UserIcon className="size-8" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>{user.name}</p>
                                    <p className="text-xs font-medium" style={{ color: 'var(--color-text-alt)' }}>
                                        {getRoleSubtitle(user.role_id)}
                                    </p>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="col-span-2">
                                <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-text-alt)' }}>
                                    <Mail className="size-3" />
                                    {mod.users.emailLabel}
                                </span>
                                <p className="rounded p-2 text-sm" style={{ color: 'var(--color-text)', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
                                    {user.email}
                                </p>
                            </div>

                            {/* Rol */}
                            <div>
                                <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-text-alt)' }}>
                                    <Shield className="size-3" />
                                    {mod.users.roleLabel}
                                </span>
                                <span
                                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                    style={getRoleBadgeStyle(user.role_id)}
                                >
                                    {getRoleLabel(user.role_id)}
                                </span>
                            </div>

                            {/* Estado */}
                            <div>
                                <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-text-alt)' }}>
                                    <Activity className="size-3" />
                                    {mod.users.statusLabel}
                                </span>
                                <span
                                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                    style={user.is_active
                                        ? { background: 'rgba(16,185,129,0.12)', color: '#065f46', border: '1px solid rgba(16,185,129,0.3)' }
                                        : { background: 'rgba(239,68,68,0.1)',  color: '#dc2626', border: '1px solid rgba(239,68,68,0.25)' }
                                    }
                                >
                                    {user.is_active ? mod.users.active : mod.users.inactive}
                                </span>
                            </div>

                            {/* Fechas */}
                            <div className="col-span-2 grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-text-alt)' }}>
                                        <Calendar className="size-3" />
                                        {mod.users.created}
                                    </span>
                                    <p className="text-[11px]" style={{ color: 'var(--color-text-alt)' }} suppressHydrationWarning>
                                        {new Date(user.created_at).toLocaleString(dateLocale)}
                                    </p>
                                </div>
                                <div>
                                    <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-text-alt)' }}>
                                        <Calendar className="size-3" />
                                        {mod.users.updated}
                                    </span>
                                    <p className="text-[11px]" style={{ color: 'var(--color-text-alt)' }} suppressHydrationWarning>
                                        {new Date(user.updated_at).toLocaleString(dateLocale)}
                                    </p>
                                </div>
                            </div>

                            {/* Actividad IA */}
                            <div className="col-span-2 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                                <span className="mb-3 flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-text-alt)' }}>
                                    <BrainCircuit className="size-3" style={{ color: 'var(--color-purple)' }} />
                                    {mod.users.aiActivity}
                                </span>
                                {aiMetrics === null ? (
                                    <div className="h-4 w-24 animate-pulse rounded" style={{ background: 'var(--color-border)' }} />
                                ) : aiMetrics.total_sessions === 0 ? (
                                    <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>{mod.users.aiNoSessions}</p>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { label: mod.users.aiSessions, value: String(aiMetrics.total_sessions) },
                                            { label: mod.users.aiCtr, value: `${aiMetrics.ctr_pct ?? 0}%` },
                                            { label: mod.users.aiLatency, value: aiMetrics.avg_latency_ms ? `${aiMetrics.avg_latency_ms}ms` : '—' },
                                            { label: mod.users.aiAlgorithm, value: aiMetrics.top_algorithm ?? '—' },
                                            { label: mod.users.aiLastSession, value: aiMetrics.last_session_at ? new Date(aiMetrics.last_session_at).toLocaleDateString(dateLocale) : '—' },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="rounded-lg p-2 text-center" style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
                                                <p className="text-[9px] font-bold uppercase tracking-wider truncate" style={{ color: 'var(--color-text-alt)' }}>{label}</p>
                                                <p className="mt-0.5 text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Botón editar */}
                            <div className="col-span-2 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 active:scale-[0.98]"
                                    style={{ background: 'var(--color-purple)' }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                >
                                    <UserPen className="size-4" />
                                    <span>{mod.users.editUser}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isEditModalOpen && user && (
                <EditUserModal
                    onClose={() => setIsEditModalOpen(false)}
                    onSubmit={updateUser}
                    user={user}
                />
            )}
        </div>
    );
};

export default UserDetailModal;
