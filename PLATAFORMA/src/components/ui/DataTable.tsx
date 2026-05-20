import { motion } from 'framer-motion';
import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';

export const DATA_TABLE_SHELL_CLASS =
    'flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#121214]';

export const DATA_TABLE_SCROLL_CLASS = 'flex-1 min-h-0 overflow-y-auto';

export const DATA_TABLE_CLASS = 'min-w-full';

export const DATA_TABLE_HEAD_CLASS =
    'border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-[#18181b]';

export const DATA_TABLE_HEAD_CELL_CLASS =
    'px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider';

export const DATA_TABLE_CELL_CLASS = 'px-5 py-3.5 text-sm';

export const TABLE_CHECKBOX_CLASS =
    'size-4 cursor-pointer rounded border-zinc-300 bg-white text-violet-600 focus:ring-violet-500 focus:ring-offset-0 dark:border-zinc-600 dark:bg-zinc-900 dark:text-violet-500';

export const TABLE_BADGE_COLORS = {
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    neutral: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
} as const;

export function DataTableShell({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <div className={`${DATA_TABLE_SHELL_CLASS} ${className}`}>{children}</div>;
}

export function DataTableScroll({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <div className={`${DATA_TABLE_SCROLL_CLASS} ${className}`}>{children}</div>;
}

export function DataTable({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <table className={`${DATA_TABLE_CLASS} ${className}`}>{children}</table>;
}

export function DataTableHead({ children }: { children: ReactNode }) {
    return <thead className={DATA_TABLE_HEAD_CLASS}>{children}</thead>;
}

export function DataTableHeadCell({
    children,
    className = '',
    ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
    return (
        <th
            className={`${DATA_TABLE_HEAD_CELL_CLASS} ${className}`}
            style={{ color: 'var(--color-text-alt)' }}
            {...props}
        >
            {children}
        </th>
    );
}

export function DataTableBody({ children }: { children: ReactNode }) {
    return <tbody>{children}</tbody>;
}

interface DataTableRowProps {
    children: ReactNode;
    index?: number;
    className?: string;
}

export function DataTableRow({ children, index = 0, className = '' }: DataTableRowProps) {
    return (
        <motion.tr
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`transition-colors ${className}`}
            style={{ borderBottom: '1px solid var(--color-border)' }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(var(--rgb-text),0.03)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = '';
            }}
        >
            {children}
        </motion.tr>
    );
}

export function DataTableCell({
    children,
    className = '',
    ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
    return (
        <td className={`${DATA_TABLE_CELL_CLASS} ${className}`} style={{ color: 'var(--color-text-alt)' }} {...props}>
            {children}
        </td>
    );
}

export function TableBadge({ text, color }: { text: string; color: string }) {
    return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>{text}</span>;
}

export function TableOrderBadge({
    children,
    accent = 'var(--color-purple)',
}: {
    children: ReactNode;
    accent?: string;
}) {
    return (
        <span
            className="flex size-7 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ background: accent }}
        >
            {children}
        </span>
    );
}

export function DataTableLinkButton({
    children,
    onClick,
    title,
    className = '',
}: {
    children: ReactNode;
    onClick: () => void;
    title?: string;
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`cursor-pointer truncate text-left text-sm font-medium transition-opacity hover:opacity-80 ${className}`}
            style={{ color: 'var(--color-text)' }}
            title={title}
        >
            {children}
        </button>
    );
}

export function DataTableHeaderSelect({
    value,
    onChange,
    children,
}: {
    value: string | number;
    onChange: (value: string) => void;
    children: ReactNode;
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="cursor-pointer border-0 bg-transparent p-0 text-xs font-bold uppercase tracking-wider focus:ring-0"
            style={{ color: 'var(--color-text-alt)' }}
        >
            {children}
        </select>
    );
}
