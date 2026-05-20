import type { PaginationProps } from '../types/types';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

function Pagination({ page, totalPages, limit, setSearchParams }: PaginationProps) {
    const goToPage = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;

        setSearchParams((prev) => {
            prev.set('page', String(newPage));
            prev.set('limit', String(limit));
            return prev;
        });
    };

    const changeLimit = (newLimit: number) => {
        setSearchParams((prev) => {
            prev.set('limit', String(newLimit));
            prev.set('page', '1');
            return prev;
        });
    };

    const generatePageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (page <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push(-1);
                pages.push(totalPages);
            } else if (page >= totalPages - 2) {
                pages.push(1);
                pages.push(-1);
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push(-1);
                for (let i = page - 1; i <= page + 1; i++) pages.push(i);
                pages.push(-2);
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-1">
                <button
                    onClick={() => goToPage(1)}
                    disabled={page <= 1}
                    className={`p-1.5 rounded-md transition-colors ${page <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}
                    title="Primera página"
                >
                    <ChevronsLeft size={16} strokeWidth={1.5} />
                </button>

                <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className={`p-1.5 rounded-md transition-colors ${page <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}
                    title="Página anterior"
                >
                    <ChevronLeft size={16} strokeWidth={1.5} />
                </button>

                <div className="flex items-center gap-1 mx-1">
                    {generatePageNumbers().map((p, index) => {
                        if (p < 0) {
                            return (
                                <span
                                    key={`sep-${index}`}
                                    className="px-2 text-zinc-400 dark:text-zinc-600 select-none"
                                >
                                    ...
                                </span>
                            );
                        }
                        return (
                            <button
                                key={p}
                                onClick={() => goToPage(p)}
                                className={`min-w-[32px] h-8 px-2 rounded-md text-sm transition-all duration-200 ${p === page ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-medium border border-indigo-200 dark:border-indigo-900' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
                                title={`Ir a página ${p}`}
                            >
                                {p}
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                    className={`p-1.5 rounded-md transition-colors ${page >= totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}
                    title="Página siguiente"
                >
                    <ChevronRight size={16} strokeWidth={1.5} />
                </button>

                <button
                    onClick={() => goToPage(totalPages)}
                    disabled={page >= totalPages}
                    className={`p-1.5 rounded-md transition-colors ${page >= totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}
                    title="Última página"
                >
                    <ChevronsRight size={16} strokeWidth={1.5} />
                </button>
            </div>

            <div className="flex items-center gap-4 text-xs justify-end">
                <div className="flex items-center gap-2">
                    <span className="text-zinc-500 dark:text-zinc-500">Mostrar</span>
                    <select
                        value={limit}
                        onChange={(e) => changeLimit(Number(e.target.value))}
                        className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={20}>20</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                    <span className="text-zinc-500 dark:text-zinc-500">por página</span>
                </div>

                <div className="text-zinc-500 dark:text-zinc-500">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {(page - 1) * limit + 1} - {Math.min(page * limit, totalPages * limit)}
                    </span>{' '}
                    de{' '}
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {totalPages * limit}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default Pagination;
