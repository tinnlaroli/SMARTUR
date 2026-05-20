const cell = (w: string) => (
    <div className={`h-4 rounded-md ${w}`} style={{ background: 'var(--color-bg-alt)' }} />
);

const headerCell = (w: string) => (
    <div className={`h-3 rounded ${w}`} style={{ background: 'var(--color-border)' }} />
);

interface TableSkeletonProps {
    rows?: number;
    colWidths: string[];
}

/** Full standalone skeleton table (header + body). Drop in where a table component normally renders. */
export const TableSkeleton = ({ rows = 8, colWidths }: TableSkeletonProps) => (
    <div className="overflow-x-auto">
        <table className="min-w-full">
            <thead style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-alt)' }}>
                <tr>
                    {colWidths.map((w, i) => (
                        <th key={i} className="px-5 py-3.5">
                            {headerCell(w === 'flex-1' ? 'w-20' : w)}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                <TableBodyRows rows={rows} colWidths={colWidths} />
            </tbody>
        </table>
    </div>
);

/** Rows-only skeleton for use inside an existing <tbody>. */
export const TableBodyRows = ({ rows = 8, colWidths }: TableSkeletonProps) => (
    <>
        {Array.from({ length: rows }, (_, row) => (
            <tr
                key={row}
                className="animate-pulse"
                style={{ borderBottom: '1px solid var(--color-border)' }}
            >
                {colWidths.map((w, col) => (
                    <td key={col} className="px-5 py-3.5">
                        {cell(w === 'flex-1' ? 'w-full max-w-[200px]' : w)}
                    </td>
                ))}
            </tr>
        ))}
    </>
);
