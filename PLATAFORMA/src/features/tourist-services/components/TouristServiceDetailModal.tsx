import { useEffect, useMemo, useState } from 'react';
import { useTouristService } from '../hooks/useTouristService';
import { UserPen, X, Wrench, Building2, MapPin, Tag, Activity, Award, ClipboardCheck } from 'lucide-react';
import EditTouristServiceModal from './EditTouristServiceModal';
import type { UpdateTouristServiceDTO } from '../types/types';
import EvaluationResultModal from '../../evaluations/components/EvaluationResultModal';
import EvaluationWizardModal from '../../evaluations/components/EvaluationWizardModal';
import { companyServices } from '../../companies/api/companyApi';
import { locationApi } from '../../locations/api/locationApi';
import { instrumentApi } from '../../instrument-builder/api/instrumentApi';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

const SERVICE_TYPE_MAP: Record<string, string> = {
    hotel: 'hotel', restaurant: 'restaurante', tour: 'tour',
    transporte: 'transporte', spa: 'spa',
};
function normalizeType(s: string): string {
    return SERVICE_TYPE_MAP[s.toLowerCase()] ?? s.toLowerCase();
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    serviceId: number | null;
    updateService: (id: number, data: UpdateTouristServiceDTO) => Promise<boolean | undefined>;
}

const TouristServiceDetailModal: React.FC<Props> = ({
    isOpen,
    onClose,
    serviceId,
    updateService,
}) => {
    const { lang, t } = useLanguage();
    const mod = useMemo(() => getDashboardText(lang).modules.modals, [lang]);
    const serviceTypeLabel = (t: string) =>
        (mod.touristServices.serviceTypeLabels as Record<string, string>)[t] ?? t;
    const { service, isLoading, error, findById } = useTouristService();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);
    const [evaluationId, setEvaluationId] = useState<number | null>(null);
    const [companyName, setCompanyName] = useState<string>('');
    const [locationName, setLocationName] = useState<string>('');
    const [hasTemplates, setHasTemplates] = useState<boolean | null>(null);

    useEffect(() => {
        if (serviceId && isOpen) {
            findById(serviceId);
        }
    }, [serviceId, isOpen]);

    useEffect(() => {
        if (!service || !isOpen) {
            setCompanyName('');
            setLocationName('');
            return;
        }

        let cancelled = false;

        Promise.allSettled([
            companyServices.findById(service.id_company),
            locationApi.findById(service.id_location),
        ]).then(([companyResult, locationResult]) => {
            if (cancelled) return;

            setCompanyName(
                companyResult.status === 'fulfilled'
                    ? companyResult.value.company.name
                    : mod.touristServices.linkedCompany,
            );
            setLocationName(
                locationResult.status === 'fulfilled'
                    ? locationResult.value.location.name
                    : mod.touristServices.linkedLocation,
            );
        });

        return () => {
            cancelled = true;
        };
    }, [service, isOpen, mod]);

    useEffect(() => {
        if (!service || !isOpen) { setHasTemplates(null); return; }
        const target = normalizeType(service.service_type);
        instrumentApi.getTemplates(1, 200).then((res) => {
            const active = res.templates.filter((t) => t.estado);
            const match = active.some((t) => normalizeType(String(t.servicio ?? '')) === target);
            setHasTemplates(match);
        }).catch(() => setHasTemplates(false));
    }, [service, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#121214] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Wrench className="size-5 text-violet-500" />
                        {mod.touristServices.detailTitle}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="p-6">
                    {isLoading && (
                        <div className="flex justify-center py-8">
                            <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-violet-600 dark:border-zinc-700 dark:border-t-violet-500"></div>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-lg bg-rose-50 p-4 dark:bg-rose-900/20">
                            <p className="text-sm text-rose-800 dark:text-rose-300 font-medium">
                                {error}
                            </p>
                        </div>
                    )}

                    {service && !isLoading && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                <div className="size-12 overflow-hidden rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                    {service.image_url ? (
                                        <img src={service.image_url} alt={service.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <Tag className="size-6" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3
                                        className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate"
                                        title={service.name}
                                    >
                                        {service.name}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-500 flex items-center gap-2">
                                        {service.total_score !== undefined &&
                                            service.total_score !== null && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-500 border border-violet-500/20">
                                                    <Award className="size-3" />
                                                    {mod.touristServices.scorePrefix}{' '}
                                                    {Number(service.total_score).toFixed(1)}
                                                </span>
                                            )}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                                <div className="col-span-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5 mb-1.5">
                                        {mod.touristServices.descriptionLabel}
                                    </span>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-800/30 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/50 leading-relaxed italic">
                                        "{service.description || mod.touristServices.noDescription}"
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5 mb-1.5">
                                        {mod.touristServices.type}
                                    </span>
                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200 capitalize">
                                        {serviceTypeLabel(service.service_type)}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5 mb-1.5">
                                        <Activity className="size-3" />
                                        {mod.users.status}
                                    </span>
                                    <div>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                service.active
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                                            }`}
                                        >
                                            {service.active ? mod.touristServices.statusBadgeActive : mod.touristServices.statusBadgeInactive}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5 mb-1.5">
                                        <Building2 className="size-3" />
                                        {mod.touristServices.companyLabel}
                                    </span>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                        {companyName || mod.touristServices.loadingCompany}
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5 mb-1.5">
                                        <MapPin className="size-3" />
                                        {mod.touristServices.locationLabel}
                                    </span>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                        {locationName || mod.touristServices.loadingLocation}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                                {service.id_evaluation && (
                                    <button
                                        onClick={() => {
                                            setEvaluationId(service.id_evaluation!);
                                            setIsResultModalOpen(true);
                                        }}
                                        className="w-full inline-flex items-center justify-center gap-2
                                        rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white
                                        hover:bg-emerald-700 shadow-sm transition-all duration-200 active:scale-[0.98] font-bold"
                                    >
                                        <Activity className="size-4" />
                                        <span>{mod.touristServices.viewEvaluationResults}</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => hasTemplates && setIsEvaluationOpen(true)}
                                    disabled={hasTemplates === false}
                                    title={hasTemplates === false ? t('touristService.noInstruments') : t('touristService.evaluateService')}
                                    className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 active:scale-[0.98] ${
                                        hasTemplates === false
                                            ? 'bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed opacity-60'
                                            : 'bg-emerald-600 hover:bg-emerald-700'
                                    }`}
                                >
                                    <ClipboardCheck className="size-4" />
                                    <span>{t('touristService.evaluate')}</span>
                                </button>

                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="w-full inline-flex items-center justify-center gap-2
                                    rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white
                                    hover:bg-violet-700 shadow-sm transition-all duration-200 active:scale-[0.98]"
                                >
                                    <UserPen className="size-4" />
                                    <span>{mod.touristServices.editService}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {isEditModalOpen && service && (
                <EditTouristServiceModal
                    onClose={() => setIsEditModalOpen(false)}
                    onSubmit={updateService}
                    service={service}
                />
            )}
            {isResultModalOpen && evaluationId && (
                <EvaluationResultModal
                    isOpen={isResultModalOpen}
                    onClose={() => setIsResultModalOpen(false)}
                    evaluationId={evaluationId}
                />
            )}
            {isEvaluationOpen && service && (
                <EvaluationWizardModal
                    isOpen={isEvaluationOpen}
                    onClose={() => setIsEvaluationOpen(false)}
                    serviceId={service.id_service}
                    serviceName={service.name}
                    serviceType={service.service_type}
                />
            )}
        </div>
    );
};

export default TouristServiceDetailModal;
