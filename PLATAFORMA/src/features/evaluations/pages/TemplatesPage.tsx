import { useMemo } from 'react';
import { useTemplates } from '../hooks/useTemplates';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../../users/components/Pagination';
import { Plus, ListChecks } from 'lucide-react';
import { CardSkeleton } from '../../../components/ui/CardSkeleton';
import { motion } from 'framer-motion';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

export const TemplatesPage = () => {
    const { lang } = useLanguage();
    const m = useMemo(() => getDashboardText(lang).modules, [lang]);
    const { templates, isLoading, totalPages } = useTemplates();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            <div className="sm:flex sm:items-center sm:justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">{m.templates.title}</h1>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{m.templates.subtitle}</p>
                </div>
                <button className="mt-4 flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-500 sm:mt-0">
                    <Plus className="size-4" />
                    {m.templates.new}
                </button>
            </div>

            {isLoading ? (
                <CardSkeleton count={4} gridClassName="grid grid-cols-1 gap-4 md:grid-cols-2" />
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {templates.length === 0 ? (
                        <div className="col-span-full rounded-2xl border-2 border-dashed border-zinc-200 py-12 text-center dark:border-zinc-800">
                            <ListChecks className="mx-auto mb-4 size-12 text-zinc-300" />
                            <p className="text-zinc-500">{m.templates.empty}</p>
                        </div>
                    ) : (
                        templates.map((template, index) => (
                            <motion.div
                                key={template.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#121214]"
                            >
                                <div>
                                    <h3 className="font-semibold text-zinc-900 dark:text-white">
                                        {template.name}{' '}
                                        <span className="text-xs font-normal text-zinc-500">v{template.version}</span>
                                    </h3>
                                    <p className="text-sm text-zinc-500">{template.servicio}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`h-2.5 w-2.5 rounded-full ${template.estado ? 'bg-green-500' : 'bg-zinc-300'}`} />
                                    <button
                                        type="button"
                                        className="text-sm font-semibold text-violet-600 dark:text-violet-400"
                                    >
                                        {m.templates.edit}
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            <Pagination page={page} limit={limit} totalPages={totalPages} setSearchParams={setSearchParams} />
        </div>
    );
};
