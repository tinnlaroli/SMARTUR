import { useEffect, useReducer, useState, useMemo } from 'react';
import { useCompany } from '../hooks/useCompany';
import Pagination from '../components/Pagination';
import { useSearchParams } from 'react-router-dom';
import CreateCompanyModal from '../components/CreateCompanyModal';
import CompanyDetailModal from '../components/CompanyDetailModal';
import CompanyTable from '../components/CompanyTable';
import SearchInput from '../components/SearchInput';
import { Building2, Plus, AlertCircle } from 'lucide-react';
import type { CompanyStatus } from '../types/types';
import { DATA_TABLE_SHELL_CLASS } from '../../../components/ui/DataTable';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import { useConfirm } from '../../../components/ui/ConfirmModal';
import { SelectionBar } from '../../../components/ui/SelectionBar';
import { MODULE_COLORS } from '../../../shared/config/moduleColors';

type ModalState = { isCreateOpen: boolean; isDetailOpen: boolean; selectedId: number | null };
type ModalAction =
    | { type: 'OPEN_CREATE' } | { type: 'CLOSE_CREATE' }
    | { type: 'OPEN_DETAIL'; id: number } | { type: 'CLOSE_DETAIL' };

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
    switch (action.type) {
        case 'OPEN_CREATE':  return { ...state, isCreateOpen: true };
        case 'CLOSE_CREATE': return { ...state, isCreateOpen: false };
        case 'OPEN_DETAIL':  return { ...state, isDetailOpen: true, selectedId: action.id };
        case 'CLOSE_DETAIL': return { ...state, isDetailOpen: false, selectedId: null };
        default: return state;
    }
};

export const CompanyPage = () => {
    const { lang } = useLanguage();
    const m = useMemo(() => getDashboardText(lang).modules, [lang]);
    const {
        companies, isLoading, error, totalPages,
        createCompany, updateCompany, deleteCompany,
        sector, setSector,
        search: urlSearch, setSearch: setUrlSearch,
    } = useCompany();

    const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const page  = Number(searchParams.get('page'))  || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const [searchTerm, setSearchTerm] = useState(urlSearch);
    const [modalState, dispatchModal] = useReducer(modalReducer, {
        isCreateOpen: false, isDetailOpen: false, selectedId: null,
    });
    const { confirm, modal: confirmModal } = useConfirm();

    useEffect(() => { if (urlSearch !== searchTerm) setSearchTerm(urlSearch); }, [urlSearch]);
    useEffect(() => {
        const t = setTimeout(() => { if (searchTerm !== urlSearch) setUrlSearch(searchTerm); }, 500);
        return () => clearTimeout(t);
    }, [searchTerm, urlSearch, setUrlSearch]);

    const toggleCompany = (id: number) =>
        setSelectedCompanies((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

    const handleUpdateStatus = async (id: number, status: CompanyStatus) => {
        await updateCompany(id, { status });
    };

    const handleDeleteSelected = async () => {
        const ok = await confirm({
            title: m.common.confirmDeleteCompanies(selectedCompanies.length),
            message: m.common.confirmDeleteCompaniesMsg(selectedCompanies.length),
            confirmLabel: m.common.delete,
            variant: 'danger',
        });
        if (!ok) return;
        await Promise.all(selectedCompanies.map((id) => deleteCompany(id)));
        setSelectedCompanies([]);
    };

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            {confirmModal}
            {/* Header */}
            <div className="shrink-0">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                    {m.companies.title}
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                    {m.companies.subtitle}
                </p>
            </div>

            {/* Info banner */}
            <div className="rounded-xl border px-5 py-4 flex items-start gap-3 shrink-0" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                <Building2 className="size-5 mt-0.5 shrink-0" style={{ color: MODULE_COLORS.companies }} />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>{m.companies.bannerTitle}</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>{m.companies.bannerDescription}</p>
                </div>
            </div>

            {/* Action row */}
            <div className="flex items-center gap-3 shrink-0">
                <SelectionBar
                    count={selectedCompanies.length}
                    onDelete={handleDeleteSelected}
                    onEdit={() => dispatchModal({ type: 'OPEN_DETAIL', id: selectedCompanies[0] })}
                    onClear={() => setSelectedCompanies([])}
                />
                <div className="ml-auto flex items-center gap-2">
                    <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder={m.companies.searchPlaceholder} />
                    <button
                        onClick={() => dispatchModal({ type: 'OPEN_CREATE' })}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95"
                        style={{ background: MODULE_COLORS.companies }}
                    >
                        <Plus className="size-4" />
                        {m.companies.add}
                    </button>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
                {isLoading && (
                    <div className={`${DATA_TABLE_SHELL_CLASS} flex-1`}>
                        <div className="flex-1 overflow-y-auto min-h-0">
                            <TableSkeleton
                                rows={9}
                                colWidths={['w-8', 'flex-1', 'w-40', 'w-28', 'w-32', 'w-28']}
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
                    <CompanyTable
                        companies={companies}
                        selectedCompanies={selectedCompanies}
                        onToggle={toggleCompany}
                        onViewDetail={(id) => dispatchModal({ type: 'OPEN_DETAIL', id })}
                        sector={sector}
                        setSector={setSector}
                        onUpdateStatus={handleUpdateStatus}
                    />
                )}
            </div>

            {!isLoading && !error && companies.length > 0 && (
                <Pagination page={page} limit={limit} totalPages={totalPages} setSearchParams={setSearchParams} />
            )}

            {modalState.isCreateOpen && (
                <CreateCompanyModal onClose={() => dispatchModal({ type: 'CLOSE_CREATE' })} onSubmit={createCompany} />
            )}
            {modalState.isDetailOpen && modalState.selectedId && (
                <CompanyDetailModal
                    isOpen={modalState.isDetailOpen}
                    onClose={() => dispatchModal({ type: 'CLOSE_DETAIL' })}
                    companyId={modalState.selectedId}
                    updateCompany={updateCompany}
                />
            )}
        </div>
        
    );
};
