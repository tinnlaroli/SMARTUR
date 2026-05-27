import { useEffect, useMemo, useReducer, useState } from 'react';
import axios from 'axios';
import { Wrench, Plus, Loader2, X, AlertCircle } from 'lucide-react';
import {
    empresaApi,
    type EmpresaService,
    type ServiceCreatePayload,
    type ServiceUpdatePayload,
} from '../api/empresaApi';
import { DATA_TABLE_SHELL_CLASS } from '../../../components/ui/DataTable';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { SelectionBar } from '../../../components/ui/SelectionBar';
import { useConfirm } from '../../../components/ui/ConfirmModal';
import SearchInput from '../../tourist-services/components/SearchInput';
import Pagination from '../../users/components/Pagination';
import EmpresaServiceTable from '../components/EmpresaServiceTable';
import { useEmpresaServices } from '../hooks/useEmpresaServices';
import { MODULE_COLORS } from '../../../shared/config/moduleColors';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useToast } from '../../../shared/context/ToastContext';
import { EMPRESA_SERVICE_TYPE_OPTIONS } from '../utils/serviceTypes';

interface ServiceModalProps {
    initial?: EmpresaService | null;
    defaultLocationId?: number | null;
    onClose: () => void;
    onSaved: (svc: EmpresaService) => void;
}

function ServiceModal({ initial, defaultLocationId, onClose, onSaved }: ServiceModalProps) {
    const toast = useToast();
    const { t } = useLanguage();
    const isEdit = !!initial;
    const [form, setForm] = useState({
        name: initial?.name ?? '',
        description: initial?.description ?? '',
        service_type: initial?.service_type ?? 'tour',
        active: initial?.active ?? true,
    });
    const typeOptions = useMemo(() => {
        const known = EMPRESA_SERVICE_TYPE_OPTIONS.map((option) => option.value);
        if (form.service_type && !known.includes(form.service_type)) {
            return [{ value: form.service_type, label: form.service_type }, ...EMPRESA_SERVICE_TYPE_OPTIONS];
        }
        return EMPRESA_SERVICE_TYPE_OPTIONS;
    }, [form.service_type]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;
        setForm((f) => ({
            ...f,
            [name]: name === 'active' ? value === 'true' : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.service_type) {
            setError(t('validation.serviceNameTypeRequired'));
            return;
        }
        if (!isEdit && !defaultLocationId) {
            setError(t('empresa.servicios.modal.errorNoLocation'));
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const payload = {
                name: form.name.trim(),
                description: form.description?.trim() || undefined,
                service_type: form.service_type,
            };

            if (isEdit && initial) {
                const { service } = await empresaApi.updateService(initial.id_service, {
                    ...payload,
                    active: form.active,
                } as ServiceUpdatePayload);
                toast.success(t('empresa.servicios.toast.updated'));
                onSaved(service);
            } else {
                const { service } = await empresaApi.createService({
                    ...payload,
                    id_location: defaultLocationId ?? undefined,
                    active: form.active,
                } as ServiceCreatePayload);
                toast.success(t('empresa.servicios.toast.created'));
                onSaved(service);
            }
        } catch (err) {
            const message = axios.isAxiosError(err)
                ? (err.response?.data as { message?: string } | undefined)?.message
                    ?? 'Error al guardar el servicio.'
                : 'Error al guardar el servicio.';
            setError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full max-w-lg rounded-2xl border p-6 space-y-5"
                style={{
                    background: 'var(--color-bg)',
                    borderColor: 'var(--color-border)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                        {isEdit ? t('empresa.servicios.modal.editTitle') : t('empresa.servicios.modal.createTitle')}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
                        style={{ color: 'var(--color-text-alt)' }}
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nombre */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                            {t('empresa.servicios.modal.name')} <span style={{ color: 'var(--color-pink)' }}>*</span>
                        </label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            maxLength={120}
                            placeholder={t('empresa.servicios.modal.namePlaceholder')}
                            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                            style={{
                                background: 'var(--color-bg-alt)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text)',
                            }}
                        />
                    </div>

                    {/* Tipo */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                            {t('empresa.servicios.modal.serviceType')} <span style={{ color: 'var(--color-pink)' }}>*</span>
                        </label>
                        <select
                            name="service_type"
                            value={form.service_type}
                            onChange={handleChange}
                            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none appearance-none"
                            style={{
                                background: 'var(--color-bg-alt)',
                                borderColor: 'var(--color-border)',
                                color: form.service_type ? 'var(--color-text)' : 'var(--color-text-alt)',
                            }}
                        >
                            <option value="">{t('empresa.servicios.modal.selectType')}</option>
                            {typeOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    {isEdit && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                                {t('empresa.servicios.modal.status')}
                            </label>
                            <select
                                name="active"
                                value={form.active ? 'true' : 'false'}
                                onChange={handleChange}
                                className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none appearance-none"
                                style={{
                                    background: 'var(--color-bg-alt)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-text)',
                                }}
                            >
                                <option value="true">{t('empresa.servicios.modal.active')}</option>
                                <option value="false">{t('empresa.servicios.modal.inactive')}</option>
                            </select>
                        </div>
                    )}

                    {/* Descripción */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                            {t('empresa.servicios.modal.description')}
                        </label>
                        <textarea
                            name="description"
                            value={form.description ?? ''}
                            onChange={handleChange}
                            rows={3}
                            maxLength={400}
                            placeholder="Describe brevemente tu servicio…"
                            className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none"
                            style={{
                                background: 'var(--color-bg-alt)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text)',
                            }}
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div
                            className="flex items-center gap-2 rounded-xl border p-3 text-xs"
                            style={{
                                background: 'var(--color-pink)10',
                                borderColor: 'var(--color-pink)40',
                                color: 'var(--color-pink)',
                            }}
                        >
                            <AlertCircle size={14} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Acciones */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
                            style={{
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text-alt)',
                            }}
                        >
                            {t('empresa.servicios.modal.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
                            style={{ background: 'var(--color-purple)' }}
                        >
                            {saving && <Loader2 size={14} className="animate-spin" />}
                            {saving ? t('empresa.servicios.modal.saving') : isEdit ? t('empresa.servicios.modal.saveChanges') : t('empresa.servicios.modal.createService')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

type ModalState = { isCreateOpen: boolean; editTarget: EmpresaService | null };
type ModalAction =
    | { type: 'OPEN_CREATE' }
    | { type: 'CLOSE_CREATE' }
    | { type: 'OPEN_EDIT'; service: EmpresaService }
    | { type: 'CLOSE_EDIT' };

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
    switch (action.type) {
        case 'OPEN_CREATE':
            return { isCreateOpen: true, editTarget: null };
        case 'CLOSE_CREATE':
            return { ...state, isCreateOpen: false };
        case 'OPEN_EDIT':
            return { isCreateOpen: false, editTarget: action.service };
        case 'CLOSE_EDIT':
            return { ...state, editTarget: null };
        default:
            return state;
    }
};

// ── Página principal ────────────────────────────────────────────────────────
export function EmpresaServiciosPage() {
    const toast = useToast();
    const { t } = useLanguage();
    const {
        services,
        setServices,
        isLoading,
        error,
        page,
        limit,
        search: urlSearch,
        setSearch: setUrlSearch,
        setSearchParams,
        fetchServices,
    } = useEmpresaServices();

    const [companyLocationId, setCompanyLocationId] = useState<number | null>(null);

    const [selectedServices, setSelectedServices] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState(urlSearch);
    const [modalState, dispatchModal] = useReducer(modalReducer, {
        isCreateOpen: false,
        editTarget: null,
    });
    const { confirm, modal: confirmModal } = useConfirm();

    useEffect(() => {
        empresaApi.getProfile()
            .then(({ company }) => setCompanyLocationId(company.id_location))
            .catch(() => setCompanyLocationId(null));
    }, []);

    useEffect(() => {
        if (urlSearch !== searchTerm) setSearchTerm(urlSearch);
    }, [urlSearch, searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== urlSearch) setUrlSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, urlSearch, setUrlSearch]);

    const normalizedSearch = urlSearch.trim().toLowerCase();
    const filteredServices = useMemo(() => {
        if (!normalizedSearch) return services;
        return services.filter((svc) =>
            [svc.name, svc.service_type ?? '', svc.description ?? '']
                .join(' ')
                .toLowerCase()
                .includes(normalizedSearch),
        );
    }, [services, normalizedSearch]);

    const totalPages = Math.max(1, Math.ceil(filteredServices.length / limit));

    useEffect(() => {
        if (page > totalPages) {
            setSearchParams((prev) => {
                prev.set('page', String(totalPages));
                return prev;
            });
        }
    }, [page, totalPages, setSearchParams]);

    const paginatedServices = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredServices.slice(start, start + limit);
    }, [filteredServices, page, limit]);

    const toggleService = (id: number) =>
        setSelectedServices((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
        );

    const openEditById = (id: number) => {
        const service = services.find((s) => s.id_service === id);
        if (service) dispatchModal({ type: 'OPEN_EDIT', service });
    };

    const handleSaved = (svc: EmpresaService) => {
        setServices((prev) => {
            const idx = prev.findIndex((s) => s.id_service === svc.id_service);
            if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = svc;
                return updated;
            }
            return [svc, ...prev];
        });
        dispatchModal({ type: 'CLOSE_CREATE' });
        dispatchModal({ type: 'CLOSE_EDIT' });
        void fetchServices();
    };

    const handleDeleteSelected = async () => {
        const targets = services.filter(
            (s) => selectedServices.includes(s.id_service) && s.active,
        );
        if (targets.length === 0) return;

        const ok = await confirm({
            title: t('empresa.servicios.deleteConfirm.title', { count: targets.length }),
            message: t('empresa.servicios.deleteConfirm.message'),
            confirmLabel: t('empresa.servicios.deleteConfirm.confirmLabel'),
            variant: 'danger',
        });
        if (!ok) return;

        for (const svc of targets) {
            try {
                await empresaApi.deleteService(svc.id_service);
            } catch {
                toast.error(t('empresa.servicios.toast.deleteError', { name: svc.name }));
            }
        }

        await fetchServices();
        setSelectedServices([]);
    };

    return (
        <>
            <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
                {confirmModal}

                <div className="shrink-0">
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                        {t('empresa.servicios.title')}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        {t('empresa.servicios.description')}
                    </p>
                </div>

                <div
                    className="flex shrink-0 items-start gap-3 rounded-xl border px-5 py-4"
                    style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
                >
                    <Wrench className="mt-0.5 size-5 shrink-0" style={{ color: MODULE_COLORS.services }} />
                    <div>
                        <p className="mb-0.5 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                            {t('empresa.servicios.badgeTitle')}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                            {t('empresa.servicios.badgeDescription')}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    <SelectionBar
                        count={selectedServices.length}
                        onDelete={handleDeleteSelected}
                        onEdit={() => {
                            const id = selectedServices[0];
                            if (id) openEditById(id);
                        }}
                        onClear={() => setSelectedServices([])}
                        deleteLabel={t('empresa.servicios.deleteLabel')}
                    />
                    <div className="ml-auto flex items-center gap-2">
                        <SearchInput
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder={t('empresa.servicios.searchPlaceholder')}
                        />
                        <button
                            type="button"
                            onClick={() => dispatchModal({ type: 'OPEN_CREATE' })}
                            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95"
                            style={{ background: MODULE_COLORS.services }}
                        >
                            <Plus className="size-4" />
                            {t('empresa.servicios.newService')}
                        </button>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col">
                    {isLoading && (
                        <div className={`${DATA_TABLE_SHELL_CLASS} flex-1`}>
                            <div className="min-h-0 flex-1 overflow-y-auto">
                                <TableSkeleton
                                    rows={10}
                                    colWidths={['w-8', 'flex-1', 'w-40', 'w-28', 'w-24']}
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
                        <EmpresaServiceTable
                            services={paginatedServices}
                            selectedServices={selectedServices}
                            onToggle={toggleService}
                            onViewDetail={openEditById}
                            serviceTypes={EMPRESA_SERVICE_TYPE_OPTIONS.map((option) => option.value)}
                        />
                    )}
                </div>

                {!isLoading && !error && filteredServices.length > 0 && (
                    <div className="shrink-0">
                        <Pagination
                            page={page}
                            limit={limit}
                            totalPages={totalPages}
                            totalItems={filteredServices.length}
                            setSearchParams={setSearchParams}
                        />
                    </div>
                )}
            </div>

            {modalState.isCreateOpen && (
                <ServiceModal
                    defaultLocationId={companyLocationId}
                    onClose={() => dispatchModal({ type: 'CLOSE_CREATE' })}
                    onSaved={handleSaved}
                />
            )}
            {modalState.editTarget && (
                <ServiceModal
                    initial={modalState.editTarget}
                    onClose={() => dispatchModal({ type: 'CLOSE_EDIT' })}
                    onSaved={handleSaved}
                />
            )}
        </>
    );
}
