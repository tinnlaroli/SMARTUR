import { useEffect, useMemo, useState } from 'react';
import { useCompany } from '../hooks/useCompany';
import { UserPen, X, Building2, MapPin, Phone, Briefcase, Calendar, Loader2, Plus, Trash2, ShieldCheck, ShieldX, ShieldAlert } from 'lucide-react';
import EditCompanyModal from './EditCompanyModal';
import type { UpdateCompanyDTO, CompanyStatus } from '../types/types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import type { SectorId } from '../../../shared/i18n/dashboardModalsLocale';
import { activityApi } from '../../activities/api/activityApi';
import type { Activity } from '../../activities/types/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    companyId: number | null;
    updateCompany: (id: number, data: UpdateCompanyDTO) => Promise<boolean | undefined>;
}

const STATUS_LABEL: Record<CompanyStatus, string> = {
    pending:   'Pendiente de aprobación',
    active:    'Activa',
    suspended: 'Suspendida',
};

const STATUS_CLASS: Record<CompanyStatus, string> = {
    pending:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    active:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    suspended: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

const impactBadge = (value: string | undefined) => {
    if (!value) return null;
    const v = value.toLowerCase();
    const color =
        v === 'alto' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
        v === 'medio' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    return (
        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${color}`}>
            {value}
        </span>
    );
};

const CompanyDetailModal: React.FC<Props> = ({ isOpen, onClose, companyId, updateCompany }) => {
    const { company, isLoading, error, findById } = useCompany();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const { t, lang } = useLanguage();
    const impactOptions = useMemo(() => [
        { label: t('activity.modal.impactLow'), value: 'bajo' },
        { label: t('activity.modal.impactMed'), value: 'medio' },
        { label: t('activity.modal.impactHigh'), value: 'alto' },
    ], [t]);
    const mod = useMemo(() => getDashboardText(lang).modules.modals, [lang]);
    const dateLocale = useMemo(
        () => (lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : 'es-MX'),
        [lang],
    );

    // Activities tab state
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [showNewForm, setShowNewForm] = useState(false);
    const [newProdValue, setNewProdValue] = useState('');
    const [newEnvImpact, setNewEnvImpact] = useState('bajo');
    const [newSocialImpact, setNewSocialImpact] = useState('bajo');
    const [savingActivity, setSavingActivity] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const sectorLabel = (id: number) =>
        mod.companies.sectorNames[id as SectorId] ?? mod.companies.sectorUndefined;

    useEffect(() => {
        if (companyId && isOpen) {
            findById(companyId);
        }
    }, [companyId, isOpen]);

    // Reset tab when modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveTab(0);
            setShowNewForm(false);
        }
    }, [isOpen]);

    // Fetch activities when Activities tab is active
    useEffect(() => {
        if (activeTab === 1 && companyId && isOpen) {
            fetchActivities();
        }
    }, [activeTab, companyId, isOpen]);

    const fetchActivities = async () => {
        if (!companyId) return;
        setLoadingActivities(true);
        try {
            const res = await activityApi.findAll(1, 200);
            setActivities(res.touristActivities.filter((a) => a.company === companyId));
        } catch {
            setActivities([]);
        } finally {
            setLoadingActivities(false);
        }
    };

    const handleCreateActivity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyId) return;
        const val = parseFloat(newProdValue);
        if (isNaN(val) || val < 0) return;
        setSavingActivity(true);
        try {
            await activityApi.create({
                id_company: companyId,
                production_value: val,
                environmental_impact: newEnvImpact,
                social_impact: newSocialImpact,
            });
            setNewProdValue('');
            setNewEnvImpact('bajo');
            setNewSocialImpact('bajo');
            setShowNewForm(false);
            await fetchActivities();
        } catch {
            // noop
        } finally {
            setSavingActivity(false);
        }
    };

    const handleStatusChange = async (newStatus: CompanyStatus) => {
        if (!companyId) return;
        setUpdatingStatus(true);
        try {
            await updateCompany(companyId, { status: newStatus });
            await findById(companyId); // refrescar datos del modal
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleDeleteActivity = async (id: number) => {
        if (!confirm('¿Eliminar esta actividad?')) return;
        setDeletingId(id);
        try {
            await activityApi.delete(id);
            setActivities((prev) => prev.filter((a) => a.id !== id));
        } catch {
            // noop
        } finally {
            setDeletingId(null);
        }
    };

    if (!isOpen) return null;

    const inputCls = "w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-violet-500";
    const inputStyle: React.CSSProperties = {
        background: 'var(--color-bg-alt, #f4f4f5)',
        borderColor: 'var(--color-border, #e4e4e7)',
        color: 'var(--color-text, #18181b)',
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#121214] rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Building2 className="size-5 text-violet-500" />
                        {mod.companies.detailTitle}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6">
                    {[t('companyDetail.tabInfo'), t('companyDetail.tabActivities')].map((tab, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveTab(i)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === i
                                    ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {/* Loading / error states */}
                    {isLoading && (
                        <div className="flex justify-center py-8">
                            <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-violet-600 dark:border-zinc-700 dark:border-t-violet-500"></div>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-lg bg-rose-50 p-4 dark:bg-rose-900/20">
                            <p className="text-sm text-rose-800 dark:text-rose-300 font-medium">{error}</p>
                        </div>
                    )}

                    {/* ── Tab 0: Información ── */}
                    {activeTab === 0 && company && !isLoading && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                <div className="size-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                    <Building2 className="size-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={company.name}>
                                        {company.name}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-500 flex items-center gap-1">
                                        {mod.companies.activeRegistry}
                                    </p>
                                </div>
                            </div>

                            {/* ── Estado de la empresa ── */}
                            <div className="flex items-center justify-between rounded-xl border px-4 py-3"
                                style={{ borderColor: 'var(--color-border, #e4e4e7)', background: 'var(--color-bg-alt, #f4f4f5)' }}>
                                <div className="flex items-center gap-2">
                                    {company.status === 'active'    && <ShieldCheck className="size-4 text-emerald-500" />}
                                    {company.status === 'pending'   && <ShieldAlert className="size-4 text-amber-500" />}
                                    {company.status === 'suspended' && <ShieldX className="size-4 text-rose-500" />}
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[company.status ?? 'active']}`}>
                                        {STATUS_LABEL[company.status ?? 'active']}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {updatingStatus && <Loader2 className="size-4 animate-spin text-zinc-400" />}
                                    {!updatingStatus && company.status !== 'active' && (
                                        <button
                                            onClick={() => handleStatusChange('active')}
                                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                                        >
                                            <ShieldCheck className="size-3" />
                                            Aprobar
                                        </button>
                                    )}
                                    {!updatingStatus && company.status !== 'suspended' && (
                                        <button
                                            onClick={() => handleStatusChange('suspended')}
                                            className="flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 transition-colors"
                                        >
                                            <ShieldX className="size-3" />
                                            Suspender
                                        </button>
                                    )}
                                    {!updatingStatus && company.status !== 'pending' && (
                                        <button
                                            onClick={() => handleStatusChange('pending')}
                                            className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                            style={{ borderColor: 'var(--color-border, #e4e4e7)' }}
                                        >
                                            <ShieldAlert className="size-3" />
                                            Marcar pendiente
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                                <div className="col-span-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5 mb-1.5">
                                        <MapPin className="size-3" />
                                        {mod.companies.addressLabel}
                                    </span>
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50/50 dark:bg-zinc-800/30 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800/50 leading-relaxed">
                                        {company.address}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5 mb-1.5">
                                        <Phone className="size-3" />
                                        {mod.companies.phoneLabel}
                                    </span>
                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                                        {company.phone}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5 mb-1.5">
                                        <Briefcase className="size-3" />
                                        {mod.companies.sectorLabel}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300">
                                        {sectorLabel(company.id_sector)}
                                    </span>
                                </div>

                                <div className="col-span-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5 mb-1.5">
                                        <Calendar className="size-3" />
                                        {mod.companies.registrationDate}
                                    </span>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400" suppressHydrationWarning>
                                        {new Date(company.registration_date).toLocaleDateString(dateLocale, {
                                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 shadow-sm transition-all duration-200 active:scale-[0.98]"
                                >
                                    <UserPen className="size-4" />
                                    <span>{mod.companies.editCompany}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Tab 1: Actividades ── */}
                    {activeTab === 1 && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                    {t('companyDetail.activitiesHeading')}
                                </p>
                                <button
                                    onClick={() => setShowNewForm((v) => !v)}
                                    className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition-colors"
                                >
                                    <Plus className="size-3.5" />
                                    {t('companyDetail.newActivity')}
                                </button>
                            </div>

                            {/* Inline create form */}
                            {showNewForm && (
                                <form
                                    onSubmit={handleCreateActivity}
                                    className="mb-4 rounded-xl border p-4 space-y-3"
                                    style={{ borderColor: 'var(--color-border, #e4e4e7)', background: 'var(--color-bg-alt, #f4f4f5)' }}
                                >
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t('companyDetail.productionValue')}</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder={t('companyDetail.productionValuePh')}
                                            value={newProdValue}
                                            onChange={(e) => setNewProdValue(e.target.value)}
                                            className={inputCls}
                                            style={inputStyle}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t('companyDetail.envImpact')}</label>
                                            <select
                                                value={newEnvImpact}
                                                onChange={(e) => setNewEnvImpact(e.target.value)}
                                                className={inputCls}
                                                style={inputStyle}
                                            >
                                                {impactOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t('companyDetail.socialImpact')}</label>
                                            <select
                                                value={newSocialImpact}
                                                onChange={(e) => setNewSocialImpact(e.target.value)}
                                                className={inputCls}
                                                style={inputStyle}
                                            >
                                                {impactOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowNewForm(false)}
                                            className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                            style={{ borderColor: 'var(--color-border, #e4e4e7)' }}
                                        >
                                            {t('activity.modal.cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={savingActivity}
                                            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
                                        >
                                            {savingActivity && <Loader2 className="size-3 animate-spin" />}
                                            {t('activity.modal.save')}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Activities list */}
                            {loadingActivities ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="size-6 animate-spin text-violet-500" />
                                </div>
                            ) : activities.length === 0 ? (
                                <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                                    {t('companyDetail.noActivities')}
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {activities.map((a) => (
                                        <div
                                            key={a.id}
                                            className="flex items-center justify-between rounded-xl border px-4 py-3"
                                            style={{ borderColor: 'var(--color-border, #e4e4e7)', background: 'var(--color-bg-alt, #f4f4f5)' }}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                                                    ${Number(a.production_value).toLocaleString('es-MX')}
                                                </span>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {impactBadge(a.environmental_impact)}
                                                    {impactBadge(a.social_impact)}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteActivity(a.id)}
                                                disabled={deletingId === a.id}
                                                className="ml-3 shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 transition-colors disabled:opacity-50"
                                            >
                                                {deletingId === a.id
                                                    ? <Loader2 className="size-4 animate-spin" />
                                                    : <Trash2 className="size-4" />}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isEditModalOpen && company && (
                <EditCompanyModal
                    onClose={() => setIsEditModalOpen(false)}
                    onSubmit={updateCompany}
                    company={company}
                />
            )}
        </div>
    );
};

export default CompanyDetailModal;
