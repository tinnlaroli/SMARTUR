import { useEffect, useReducer, useState, useMemo } from 'react';
import { useTouristService } from '../hooks/useTouristService';
import Pagination from '../components/Pagination';
import { useSearchParams } from 'react-router-dom';
import CreateTouristServiceModal from '../components/CreateTouristServiceModal';
import TouristServiceDetailModal from '../components/TouristServiceDetailModal';
import TouristServiceTable from '../components/TouristServiceTable';
import SearchInput from '../components/SearchInput';
import { ClipboardCheck, Wrench, Plus, AlertCircle } from 'lucide-react';
import { DATA_TABLE_SHELL_CLASS } from '../../../components/ui/DataTable';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import EvaluationWizardModal from '../../evaluations/components/EvaluationWizardModal';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import { useConfirm } from '../../../components/ui/ConfirmModal';
import { SelectionBar } from '../../../components/ui/SelectionBar';
import { MODULE_COLORS } from '../../../shared/config/moduleColors';
import { instrumentApi } from '../../instrument-builder/api/instrumentApi';

type ModalState = {
    isCreateOpen: boolean; isDetailOpen: boolean;
    isEvaluationOpen: boolean; selectedId: number | null;
};
type ModalAction =
    | { type: 'OPEN_CREATE' } | { type: 'CLOSE_CREATE' }
    | { type: 'OPEN_DETAIL'; id: number } | { type: 'CLOSE_DETAIL' }
    | { type: 'OPEN_EVALUATION' } | { type: 'CLOSE_EVALUATION' };

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
    switch (action.type) {
        case 'OPEN_CREATE':     return { ...state, isCreateOpen: true };
        case 'CLOSE_CREATE':    return { ...state, isCreateOpen: false };
        case 'OPEN_DETAIL':     return { ...state, isDetailOpen: true, selectedId: action.id };
        case 'CLOSE_DETAIL':    return { ...state, isDetailOpen: false, selectedId: null };
        case 'OPEN_EVALUATION': return { ...state, isEvaluationOpen: true };
        case 'CLOSE_EVALUATION':return { ...state, isEvaluationOpen: false };
        default: return state;
    }
};

export const TouristServicePage = () => {
    const { lang, t } = useLanguage();
    const m = useMemo(() => getDashboardText(lang).modules, [lang]);
    const {
        services, isLoading, error, totalPages,
        createService, updateService, deleteService,
        search: urlSearch, setSearch: setUrlSearch, fetchServices,
    } = useTouristService();

    const [selectedServices, setSelectedServices] = useState<number[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const page  = Number(searchParams.get('page'))  || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const [searchTerm, setSearchTerm] = useState(urlSearch);
    const [modalState, dispatchModal] = useReducer(modalReducer, {
        isCreateOpen: false, isDetailOpen: false, isEvaluationOpen: false, selectedId: null,
    });
    const { confirm, modal: confirmModal } = useConfirm();

    useEffect(() => { if (urlSearch !== searchTerm) setSearchTerm(urlSearch); }, [urlSearch]);
    useEffect(() => {
        const t = setTimeout(() => { if (searchTerm !== urlSearch) setUrlSearch(searchTerm); }, 500);
        return () => clearTimeout(t);
    }, [searchTerm, urlSearch, setUrlSearch]);

    const toggleService = (id: number) =>
        setSelectedServices((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

    const handleDeleteSelected = async () => {
        const ok = await confirm({
            title: t('touristService.confirmDelete.title', { count: selectedServices.length }),
            message: t('common.irreversibleAction'),
            confirmLabel: t('common.delete'),
            variant: 'danger',
        });
        if (!ok) return;
        for (const id of selectedServices) await deleteService(id);
        setSelectedServices([]);
    };

    const selectedService = services.find((s) => s.id === selectedServices[0]);
    const selectedServiceName = selectedService?.name || '';
    const selectedServiceType = selectedService?.service_type || '';

    // Load all active templates once on mount — used to check hasTemplates instantly
    const [activeTemplateTypes, setActiveTemplateTypes] = useState<Set<string>>(new Set());
    useEffect(() => {
        const TYPE_MAP: Record<string, string> = {
            hotel: 'hotel', restaurant: 'restaurante', restaurante: 'restaurante',
            tour: 'tour', transporte: 'transporte', spa: 'spa',
        };
        instrumentApi.getTemplates(1, 200).then((res) => {
            const types = new Set(
                res.templates
                    .filter((t) => t.estado)
                    .map((t) => TYPE_MAP[t.servicio.toLowerCase()] ?? t.servicio.toLowerCase())
            );
            setActiveTemplateTypes(types);
        }).catch(() => {});
    }, []);

    const hasTemplates: boolean | null = selectedServices.length === 1 && selectedServiceType
        ? activeTemplateTypes.size > 0
            ? activeTemplateTypes.has(selectedServiceType.toLowerCase())
            : null
        : null;

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            {confirmModal}
            {/* Header */}
            <div className="shrink-0">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                    {m.touristServices.title}
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                    {m.touristServices.subtitle}
                </p>
            </div>

            {/* Info banner */}
            <div className="rounded-xl border px-5 py-4 flex items-start gap-3 shrink-0" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                <Wrench className="size-5 mt-0.5 shrink-0" style={{ color: MODULE_COLORS.services }} />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>{t('touristService.pageTitle')}</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>{t('touristService.pageDescription')}</p>
                </div>
            </div>

            {/* Action row */}
            <div className="flex items-center gap-3 shrink-0">
                <SelectionBar
                    count={selectedServices.length}
                    onDelete={handleDeleteSelected}
                    onEdit={() => dispatchModal({ type: 'OPEN_DETAIL', id: selectedServices[0] })}
                    onClear={() => setSelectedServices([])}
                />
                <div className="ml-auto flex items-center gap-2">
                    <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder={m.touristServices.searchPlaceholder} />

                    {selectedServices.length === 1 && (
                        <div className="relative group/eval">
                            <button
                                onClick={() => hasTemplates && dispatchModal({ type: 'OPEN_EVALUATION' })}
                                disabled={hasTemplates === false}
                                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-95 ${
                                    hasTemplates === false
                                        ? 'bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed opacity-60'
                                        : 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer'
                                }`}
                            >
                                <ClipboardCheck className="size-4" />
                                {m.touristServices.evaluate}
                            </button>
                            {hasTemplates === false && (
                                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-800 px-2 py-1 text-xs text-white opacity-0 group-hover/eval:opacity-100 transition-opacity pointer-events-none z-10">
                                    Sin instrumentos para este tipo de servicio
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={() => dispatchModal({ type: 'OPEN_CREATE' })}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95"
                        style={{ background: MODULE_COLORS.services }}
                    >
                        <Plus className="size-4" />
                        {m.touristServices.add}
                    </button>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
                {isLoading && (
                    <div className={`${DATA_TABLE_SHELL_CLASS} flex-1`}>
                        <div className="flex-1 overflow-y-auto min-h-0">
                            <TableSkeleton
                                rows={9}
                                colWidths={['w-8', 'flex-1', 'w-40', 'w-28', 'w-24', 'w-20']}
                            />
                        </div>
                    </div>
                )}
                {error && (
                    <div className={`${DATA_TABLE_SHELL_CLASS} flex flex-1 flex-col items-center justify-center gap-3`}>
                        <AlertCircle className="size-8 text-rose-400" />
                        <p className="text-sm font-medium text-rose-500">{error}</p>
                    </div>
                )}
                {!isLoading && !error && (
                    <TouristServiceTable
                        services={services}
                        selectedServices={selectedServices}
                        onToggle={toggleService}
                        onViewDetail={(id) => dispatchModal({ type: 'OPEN_DETAIL', id })}
                    />
                )}
            </div>

            {!isLoading && !error && services.length > 0 && (
                <Pagination page={page} limit={limit} totalPages={totalPages} setSearchParams={setSearchParams} />
            )}

            {modalState.isCreateOpen && (
                <CreateTouristServiceModal onClose={() => dispatchModal({ type: 'CLOSE_CREATE' })} onSubmit={createService} />
            )}
            {modalState.isDetailOpen && modalState.selectedId && (
                <TouristServiceDetailModal
                    isOpen={modalState.isDetailOpen}
                    onClose={() => dispatchModal({ type: 'CLOSE_DETAIL' })}
                    serviceId={modalState.selectedId}
                    updateService={updateService}
                />
            )}
            {modalState.isEvaluationOpen && selectedServices.length === 1 && (
                <EvaluationWizardModal
                    isOpen={modalState.isEvaluationOpen}
                    onClose={() => { dispatchModal({ type: 'CLOSE_EVALUATION' }); fetchServices(); }}
                    serviceId={selectedServices[0]}
                    serviceName={selectedServiceName}
                    serviceType={selectedServiceType}
                />
            )}
        </div>
    );
};
