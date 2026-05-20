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
    TABLE_CHECKBOX_CLASS,
} from '../../../components/ui/DataTable';

const SECTOR_LABELS: Record<number, string> = {
    1: 'Alojamiento',
    2: 'Alimentos y Bebidas',
    3: 'Transporte Turístico',
    4: 'Agencias de Viaje',
    5: 'Entretenimiento',
};

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
                                    {SECTOR_LABELS[company.id_sector] ?? 'Sin sector'}
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
