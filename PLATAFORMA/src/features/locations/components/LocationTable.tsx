import { useState, useMemo } from 'react';
import type { Location } from '../types/types';
import {
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableHead,
    DataTableHeadCell,
    DataTableLinkButton,
    DataTableRow,
    DataTableScroll,
    DataTableShell,
    SortableHeadCell,
    TABLE_BADGE_COLORS,
    TABLE_CHECKBOX_CLASS,
    TableBadge,
    nextSort,
    sortRows,
} from '../../../components/ui/DataTable';
import type { SortState } from '../../../components/ui/DataTable';

interface Props {
    locations: Location[];
    selectedLocations: number[];
    onToggle: (id: number) => void;
    onViewDetail: (id: number) => void;
}

export default function LocationTable({ locations, selectedLocations, onToggle, onViewDetail }: Props) {
    const [sort, setSort] = useState<SortState | null>(null);
    const handleSort = (key: string) => setSort(prev => nextSort(prev, key));
    const displayData = useMemo(() => sortRows(locations, sort), [locations, sort]);
    const allSelected = selectedLocations.length === locations.length && locations.length > 0;

    const toggleAll = () => {
        if (allSelected) {
            locations.forEach((l) => onToggle(l.id));
        } else {
            locations.forEach((l) => {
                if (!selectedLocations.includes(l.id)) onToggle(l.id);
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
                            <SortableHeadCell sortKey="name" sort={sort} onSort={handleSort}>Nombre</SortableHeadCell>
                            <SortableHeadCell sortKey="state" sort={sort} onSort={handleSort} className="w-40">Estado</SortableHeadCell>
                            <SortableHeadCell sortKey="municipality" sort={sort} onSort={handleSort} className="w-44">Municipio</SortableHeadCell>
                            <DataTableHeadCell className="w-32">Latitud</DataTableHeadCell>
                            <DataTableHeadCell className="w-32">Longitud</DataTableHeadCell>
                        </tr>
                    </DataTableHead>
                    <DataTableBody>
                        {displayData.map((loc, index) => (
                            <DataTableRow key={loc.id} index={index}>
                                <DataTableCell className="w-14">
                                    <input
                                        type="checkbox"
                                        checked={selectedLocations.includes(loc.id)}
                                        onChange={() => onToggle(loc.id)}
                                        className={TABLE_CHECKBOX_CLASS}
                                    />
                                </DataTableCell>
                                <DataTableCell>
                                    <DataTableLinkButton onClick={() => onViewDetail(loc.id)} title={loc.name}>
                                        {loc.name}
                                    </DataTableLinkButton>
                                </DataTableCell>
                                <DataTableCell className="w-40">
                                    <TableBadge text={loc.state} color={TABLE_BADGE_COLORS.violet} />
                                </DataTableCell>
                                <DataTableCell className="w-44">{loc.municipality}</DataTableCell>
                                <DataTableCell className="w-32 tabular-nums text-[var(--color-text-alt)]">
                                    {loc.latitude ?? '—'}
                                </DataTableCell>
                                <DataTableCell className="w-32 tabular-nums text-[var(--color-text-alt)]">
                                    {loc.longitude ?? '—'}
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>
            </DataTableScroll>
        </DataTableShell>
    );
}
