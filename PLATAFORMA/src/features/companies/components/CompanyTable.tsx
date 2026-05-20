import type { Company } from '../types/types';
import {
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableHead,
    DataTableHeadCell,
    DataTableHeaderSelect,
    DataTableLinkButton,
    DataTableRow,
    DataTableScroll,
    DataTableShell,
    TABLE_BADGE_COLORS,
    TABLE_CHECKBOX_CLASS,
    TableBadge,
} from '../../../components/ui/DataTable';

const SECTOR_LABELS: Record<number, string> = {
    1: 'Alojamiento',
    2: 'Alimentos y Bebidas',
    3: 'Transporte Turístico',
    4: 'Agencias de Viaje',
    5: 'Entretenimiento',
};

const SECTOR_COLORS: Record<number, string> = {
    1: TABLE_BADGE_COLORS.sky,
    2: TABLE_BADGE_COLORS.emerald,
    3: TABLE_BADGE_COLORS.violet,
    4: TABLE_BADGE_COLORS.amber,
    5: TABLE_BADGE_COLORS.rose,
};

const COMPANY_COLORS = [
    'var(--color-purple)',
    'var(--color-cyan)',
    'var(--color-pink)',
    'var(--color-green)',
];

function getCompanyColor(id: number) {
    return COMPANY_COLORS[id % COMPANY_COLORS.length];
}

function getInitials(name?: string | null) {
    return (name || '?')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p.charAt(0).toUpperCase())
        .join('');
}

interface Props {
    companies: Company[];
    selectedCompanies: number[];
    onToggle: (id: number) => void;
    onViewDetail: (id: number) => void;
    sector: number | undefined;
    setSector: (sectorId: number | undefined) => void;
}

export default function CompanyTable({
    companies,
    selectedCompanies,
    onToggle,
    onViewDetail,
    sector,
    setSector,
}: Props) {
    const allSelected = selectedCompanies.length === companies.length && companies.length > 0;

    const toggleAll = () => {
        if (allSelected) {
            companies.forEach((c) => onToggle(c.id));
        } else {
            companies.forEach((c) => {
                if (!selectedCompanies.includes(c.id)) onToggle(c.id);
            });
        }
    };

    return (
        <DataTableShell>
            <DataTableScroll>
                <DataTable>
                    <DataTableHead>
                        <tr>
                            <DataTableHeadCell className="w-14">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleAll}
                                    className={TABLE_CHECKBOX_CLASS}
                                />
                            </DataTableHeadCell>
                            <DataTableHeadCell className="w-16">Logo</DataTableHeadCell>
                            <DataTableHeadCell>Nombre</DataTableHeadCell>
                            <DataTableHeadCell className="min-w-[220px]">Dirección</DataTableHeadCell>
                            <DataTableHeadCell className="w-36">Teléfono</DataTableHeadCell>
                            <DataTableHeadCell className="w-44">
                                <div className="flex items-center gap-2">
                                    <span>Sector</span>
                                    <DataTableHeaderSelect
                                        value={sector || ''}
                                        onChange={(value) => setSector(value ? Number(value) : undefined)}
                                    >
                                        <option value="">Todos</option>
                                        {Object.entries(SECTOR_LABELS).map(([id, label]) => (
                                            <option key={id} value={id}>
                                                {label}
                                            </option>
                                        ))}
                                    </DataTableHeaderSelect>
                                </div>
                            </DataTableHeadCell>
                            <DataTableHeadCell className="w-36">Registro</DataTableHeadCell>
                        </tr>
                    </DataTableHead>
                    <DataTableBody>
                        {companies.map((company, index) => (
                            <DataTableRow key={company.id} index={index}>
                                <DataTableCell className="w-14">
                                    <input
                                        type="checkbox"
                                        checked={selectedCompanies.includes(company.id)}
                                        onChange={() => onToggle(company.id)}
                                        className={TABLE_CHECKBOX_CLASS}
                                    />
                                </DataTableCell>
                                <DataTableCell className="w-16">
                                    <div
                                        className="flex size-10 items-center justify-center rounded-full text-xs font-bold text-white"
                                        style={{ background: getCompanyColor(company.id) }}
                                    >
                                        {getInitials(company.name)}
                                    </div>
                                </DataTableCell>
                                <DataTableCell>
                                    <DataTableLinkButton onClick={() => onViewDetail(company.id)} title={company.name}>
                                        {company.name}
                                    </DataTableLinkButton>
                                </DataTableCell>
                                <DataTableCell className="min-w-[220px] max-w-sm">
                                    <p className="truncate" title={company.address}>
                                        {company.address}
                                    </p>
                                </DataTableCell>
                                <DataTableCell className="w-36">{company.phone}</DataTableCell>
                                <DataTableCell className="w-44">
                                    <TableBadge
                                        text={SECTOR_LABELS[company.id_sector] ?? 'Sin sector'}
                                        color={SECTOR_COLORS[company.id_sector] ?? TABLE_BADGE_COLORS.neutral}
                                    />
                                </DataTableCell>
                                <DataTableCell className="w-36" suppressHydrationWarning>
                                    {new Date(company.registration_date).toLocaleDateString('es', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                    })}
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>
            </DataTableScroll>
        </DataTableShell>
    );
}
