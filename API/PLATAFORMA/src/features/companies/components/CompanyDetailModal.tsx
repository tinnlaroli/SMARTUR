import { useEffect, useMemo, useState } from 'react';
import { useCompany } from '../hooks/useCompany';
import { UserPen, X, Building2, MapPin, Phone, Briefcase, Calendar } from 'lucide-react';
import EditCompanyModal from './EditCompanyModal';
import type { UpdateCompanyDTO } from '../types/types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import type { SectorId } from '../../../shared/i18n/dashboardModalsLocale';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    companyId: number | null;
    updateCompany: (id: number, data: UpdateCompanyDTO) => Promise<boolean | undefined>;
}

const CompanyDetailModal: React.FC<Props> = ({ isOpen, onClose, companyId, updateCompany }) => {
    const { company, isLoading, error, findById } = useCompany();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { lang } = useLanguage();
    const mod = useMemo(() => getDashboardText(lang).modules.modals, [lang]);
    const dateLocale = useMemo(
        () => (lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : 'es-MX'),
        [lang],
    );

    const sectorLabel = (id: number) =>
        mod.companies.sectorNames[id as SectorId] ?? mod.companies.sectorUndefined;

    useEffect(() => {
        if (companyId && isOpen) {
            findById(companyId);
        }
    }, [companyId, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#121214] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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

                    {company && !isLoading && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                <div className="size-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                    <Building2 className="size-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3
                                        className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate"
                                        title={company.name}
                                    >
                                        {company.name}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-500 flex items-center gap-1">
                                        {mod.companies.activeRegistry}
                                    </p>
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
                                        {new Date(company.registration_date).toLocaleDateString(
                                            dateLocale,
                                            {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            }
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="w-full inline-flex items-center justify-center gap-2 
                                    rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white
                                    hover:bg-violet-700 shadow-sm transition-all duration-200 active:scale-[0.98]"
                                >
                                    <UserPen className="size-4" />
                                    <span>{mod.companies.editCompany}</span>
                                </button>
                            </div>
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
