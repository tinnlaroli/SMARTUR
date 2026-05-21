import { useState, useMemo } from 'react';
import type { User } from '../types/types';
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
    SortableHeadCell,
    TABLE_BADGE_COLORS,
    TABLE_CHECKBOX_CLASS,
    TableBadge,
    nextSort,
    sortRows,
} from '../../../components/ui/DataTable';
import type { SortState } from '../../../components/ui/DataTable';

interface Props {
    users: User[];
    selectedUsers: number[];
    onToggle: (id: number) => void;
    onViewDetail: (id: number) => void;
    role: number | undefined;
    setRole: (roleId: number | undefined) => void;
}

const getInitials = (name?: string | null) =>
    (name || '?')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');

export default function UserTable({ users, selectedUsers, onToggle, onViewDetail, role, setRole }: Props) {
    const [sort, setSort] = useState<SortState | null>(null);
    const handleSort = (key: string) => setSort(prev => nextSort(prev, key));
    const displayData = useMemo(() => sortRows(users, sort), [users, sort]);
    const allSelected = selectedUsers.length === users.length && users.length > 0;

    const toggleAll = () => {
        if (allSelected) {
            selectedUsers.forEach((id) => onToggle(id));
        } else {
            users.forEach((user) => {
                if (!selectedUsers.includes(user.id)) onToggle(user.id);
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
                            <DataTableHeadCell className="w-24">Foto</DataTableHeadCell>
                            <SortableHeadCell sortKey="name" sort={sort} onSort={handleSort}>Nombre</SortableHeadCell>
                            <SortableHeadCell sortKey="email" sort={sort} onSort={handleSort}>Email</SortableHeadCell>
                            <DataTableHeadCell className="w-40">
                                <div className="flex items-center gap-2">
                                    <span>Rol</span>
                                    <DataTableHeaderSelect
                                        value={role || ''}
                                        onChange={(value) => setRole(value ? Number(value) : undefined)}
                                    >
                                        <option value="">Todos</option>
                                        <option value="1">Administrador</option>
                                        <option value="2">Usuario</option>
                                    </DataTableHeaderSelect>
                                </div>
                            </DataTableHeadCell>
                            <DataTableHeadCell className="w-32">Estado</DataTableHeadCell>
                            <SortableHeadCell sortKey="created_at" sort={sort} onSort={handleSort} className="w-36">Registrado</SortableHeadCell>
                        </tr>
                    </DataTableHead>
                    <DataTableBody>
                        {displayData.map((user, index) => (
                            <DataTableRow key={user.id} index={index}>
                                <DataTableCell className="w-14">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user.id)}
                                        onChange={() => onToggle(user.id)}
                                        className={TABLE_CHECKBOX_CLASS}
                                    />
                                </DataTableCell>
                                <DataTableCell className="w-24">
                                    {user.photo_url ? (
                                        <img
                                            src={user.photo_url}
                                            alt={user.name}
                                            className="size-10 rounded-full border object-cover"
                                            style={{ borderColor: 'var(--color-border)' }}
                                        />
                                    ) : (
                                        <div
                                            className="flex size-10 items-center justify-center rounded-full text-xs font-bold text-white"
                                            style={{ background: 'var(--color-purple)' }}
                                        >
                                            {getInitials(user.name)}
                                        </div>
                                    )}
                                </DataTableCell>
                                <DataTableCell>
                                    <DataTableLinkButton onClick={() => onViewDetail(user.id)} title={user.name}>
                                        {user.name}
                                    </DataTableLinkButton>
                                </DataTableCell>
                                <DataTableCell>
                                    <DataTableLinkButton onClick={() => onViewDetail(user.id)} title={user.email}>
                                        {user.email}
                                    </DataTableLinkButton>
                                </DataTableCell>
                                <DataTableCell className="w-40">
                                    <TableBadge
                                        text={user.role_id === 1 ? 'Administrador' : 'Usuario'}
                                        color={
                                            user.role_id === 1 ? TABLE_BADGE_COLORS.violet : TABLE_BADGE_COLORS.neutral
                                        }
                                    />
                                </DataTableCell>
                                <DataTableCell className="w-32">
                                    <TableBadge
                                        text={user.is_active ? 'Activo' : 'Inactivo'}
                                        color={user.is_active ? TABLE_BADGE_COLORS.emerald : TABLE_BADGE_COLORS.rose}
                                    />
                                </DataTableCell>
                                <DataTableCell className="w-36" suppressHydrationWarning>
                                    {new Date(user.created_at).toLocaleDateString('es', {
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
