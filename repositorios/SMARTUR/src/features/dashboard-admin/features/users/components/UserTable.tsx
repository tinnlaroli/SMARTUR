import type { User } from '../types/types';
import { useRef } from 'react';

interface Props {
    users: User[];
    selectedUsers: number[];
    onToggle: (id: number) => void;
    onViewDetail: (id: number) => void;
    role: number | undefined;
    setRole: (roleId: number | undefined) => void;
}

export default function UserTable({
    users,
    selectedUsers,
    onToggle,
    onViewDetail,
    role,
    setRole,
}: Props) {
    const tableRef = useRef<HTMLDivElement>(null);

    return (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121214] h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-zinc-50 dark:bg-[#18181b] border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center px-4 py-3.5 gap-4">
                    <div className="w-8 flex-shrink-0">
                        <input
                            type="checkbox"
                            checked={selectedUsers.length === users.length && users.length > 0}
                            onChange={() => {
                                if (selectedUsers.length === users.length) {
                                    selectedUsers.forEach((id) => onToggle(id));
                                } else {
                                    users.forEach((user) => {
                                        if (!selectedUsers.includes(user.id)) {
                                            onToggle(user.id);
                                        }
                                    });
                                }
                            }}
                            className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                        />
                    </div>
                    <div className="w-16 flex-shrink-0 text-xs font-medium uppercase tracking-wider text-zinc-400">
                        ID
                    </div>
                    <div className="flex-1 min-w-[200px] text-xs font-medium uppercase tracking-wider text-zinc-400">
                        Nombre
                    </div>
                    <div className="flex-1 min-w-[250px] text-xs font-medium uppercase tracking-wider text-zinc-400">
                        Email
                    </div>
                    <div className="w-32 flex-shrink-0 text-xs font-medium uppercase tracking-wider text-zinc-400">
                        <div className="flex items-center gap-2">
                            <span>Rol</span>
                            <select
                                value={role || ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setRole(value ? Number(value) : undefined);
                                }}
                                className="border-0 bg-transparent p-0 text-xs font-medium text-zinc-400 focus:ring-0 cursor-pointer hover:text-white transition-colors"
                            >
                                <option value="" className="bg-zinc-900 text-zinc-400">
                                    Todos
                                </option>
                                <option value="1" className="bg-zinc-900 text-zinc-400">
                                    Administrador
                                </option>
                                <option value="2" className="bg-zinc-900 text-zinc-400">
                                    Usuario
                                </option>
                            </select>
                        </div>
                    </div>
                    <div className="w-24 flex-shrink-0 text-xs font-medium uppercase tracking-wider text-zinc-400">
                        Estado
                    </div>
                    <div className="w-28 flex-shrink-0 text-xs font-medium uppercase tracking-wider text-zinc-400">
                        Registrado
                    </div>
                </div>
            </div>

            <div ref={tableRef} className="flex-1 overflow-y-auto min-h-0">
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {users.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center px-4 py-4 gap-4 transition-colors hover:bg-zinc-800/50 group"
                        >
                            <div className="w-8 flex-shrink-0">
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.includes(user.id)}
                                    onChange={() => onToggle(user.id)}
                                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                                />
                            </div>

                            <div className="w-16 flex-shrink-0 text-sm font-medium text-zinc-100">
                                {user.id}
                            </div>

                            <div
                                onClick={() => onViewDetail(user.id)}
                                className="flex-1 min-w-[200px] text-sm text-zinc-300 truncate cursor-pointer hover:text-indigo-400 transition-colors"
                                title={user.name}
                            >
                                {user.name}
                            </div>

                            <div
                                onClick={() => onViewDetail(user.id)}
                                className="flex-1 min-w-[250px] text-sm text-zinc-300 truncate cursor-pointer hover:text-indigo-400 transition-colors"
                                title={user.email}
                            >
                                {user.email}
                            </div>

                            <div className="w-32 flex-shrink-0 text-sm">
                                <span
                                    className={`inline-flex items-center text-xs font-medium ${
                                        user.role_id === 1 ? 'text-indigo-400' : 'text-zinc-400'
                                    }`}
                                >
                                    <span
                                        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                                            user.role_id === 1 ? 'bg-indigo-400' : 'bg-zinc-500'
                                        }`}
                                    />
                                    {user.role_id === 1 ? 'Administrador' : 'Usuario'}
                                </span>
                            </div>

                            <div className="w-24 flex-shrink-0 text-sm">
                                <span
                                    className={`inline-flex items-center text-xs font-medium ${
                                        user.is_active ? 'text-emerald-400' : 'text-rose-400'
                                    }`}
                                >
                                    <span
                                        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                                            user.is_active ? 'bg-emerald-400' : 'bg-rose-400'
                                        }`}
                                    />
                                    {user.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>

                            <div className="w-28 flex-shrink-0 text-sm text-zinc-400">
                                {new Date(user.created_at).toLocaleDateString('es', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
