import { MapPin } from 'lucide-react';
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
    TABLE_BADGE_COLORS,
    TABLE_CHECKBOX_CLASS,
    TableBadge,
} from '../../../components/ui/DataTable';

const LOCATION_COLORS = [
    'var(--color-pink)',
    'var(--color-purple)',
    'var(--color-cyan)',
    'var(--color-green)',
];

function getLocationColor(id: number) {
    return LOCATION_COLORS[id % LOCATION_COLORS.length];
}

interface Props {
    locations: Location[];
    selectedLocations: number[];
    onToggle: (id: number) => void;
    onViewDetail: (id: number) => void;
}

export default function LocationTable({ locations, selectedLocations, onToggle, onViewDetail }: Props) {
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
                            <DataTableHeadCell className="w-16">Icono</DataTableHeadCell>
                            <DataTableHeadCell>Nombre</DataTableHeadCell>
                            <DataTableHeadCell className="w-40">Estado</DataTableHeadCell>
                            <DataTableHeadCell className="w-44">Municipio</DataTableHeadCell>
                            <DataTableHeadCell className="w-32">Latitud</DataTableHeadCell>
                            <DataTableHeadCell className="w-32">Longitud</DataTableHeadCell>
                        </tr>
                    </DataTableHead>
                    <DataTableBody>
                        {locations.map((loc, index) => (
                            <DataTableRow key={loc.id} index={index}>
                                <DataTableCell className="w-14">
                                    <input
                                        type="checkbox"
                                        checked={selectedLocations.includes(loc.id)}
                                        onChange={() => onToggle(loc.id)}
                                        className={TABLE_CHECKBOX_CLASS}
                                    />
                                </DataTableCell>
                                <DataTableCell className="w-16">
                                    <div
                                        className="flex size-10 items-center justify-center rounded-full text-white"
                                        style={{ background: getLocationColor(loc.id) }}
                                    >
                                        <MapPin className="size-4" />
                                    </div>
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
