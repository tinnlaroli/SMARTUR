import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface SharedPaginationProps {
    /** 1-indexed current page */
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
}

function generatePages(page: number, totalPages: number): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (page <= 3) {
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
    return pages;
}

export function SharedPagination({
    page,
    totalPages,
    total,
    pageSize,
    onPageChange,
    onPageSizeChange,
}: SharedPaginationProps) {
    const go = (p: number) => {
        if (p < 1 || p > totalPages) return;
        onPageChange(p);
    };

    const from = (page - 1) * pageSize + 1;
    const to   = Math.min(page * pageSize, total);

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
            {/* Left: navigation */}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => go(1)}
                    disabled={page <= 1}
                    className={`p-1.5 rounded-md transition-colors ${page <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}
                >
                    <ChevronsLeft size={16} strokeWidth={1.5} />
                </button>
                <button
                    onClick={() => go(page - 1)}
                    disabled={page <= 1}
                    className={`p-1.5 rounded-md transition-colors ${page <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}
                >
                    <ChevronLeft size={16} strokeWidth={1.5} />
                </button>

                <div className="flex items-center gap-1 mx-1">
                    {generatePages(page, totalPages).map((pg, idx) =>
                        pg < 0 ? (
                            <span key={`dots-${pg}-${idx}`} className="px-2 text-zinc-400 dark:text-zinc-600 select-none">…</span>
                        ) : (
                            <button
                                key={pg}
                                onClick={() => go(pg)}
                                className={`min-w-[32px] h-8 px-2 rounded-md text-sm transition-all duration-200 ${
                                    pg === page
                                        ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 font-medium border border-violet-200 dark:border-violet-900'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-300'
                                }`}
                            >
                                {pg}
                            </button>
                        ),
                    )}
                </div>

                <button
                    onClick={() => go(page + 1)}
                    disabled={page >= totalPages}
                    className={`p-1.5 rounded-md transition-colors ${page >= totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}
                >
                    <ChevronRight size={16} strokeWidth={1.5} />
                </button>
                <button
                    onClick={() => go(totalPages)}
                    disabled={page >= totalPages}
                    className={`p-1.5 rounded-md transition-colors ${page >= totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}
                >
                    <ChevronsRight size={16} strokeWidth={1.5} />
                </button>
            </div>

            {/* Right: per-page select + range */}
            <div className="flex items-center gap-4 text-xs justify-end">
                {onPageSizeChange && (
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500 dark:text-zinc-500">Mostrar</span>
                        <select
                            value={pageSize}
                            onChange={e => onPageSizeChange(Number(e.target.value))}
                            className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
                        >
                            {[5, 10, 15, 20, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <span className="text-zinc-500 dark:text-zinc-500">por página</span>
                    </div>
                )}
                <div className="text-zinc-500 dark:text-zinc-500">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {from}–{to} de {total}
                    </span>
                </div>
            </div>
        </div>
    );
}
