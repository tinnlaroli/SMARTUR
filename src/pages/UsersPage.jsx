import React, { useState } from "react";
import { UserTable } from '../features/users/UserTable'
import { useUsers } from '../hooks/useUsers'
import CreateUserModal from '../features/users/CreateUserModal'

export default function UsersPage() {
    const { users, loading, removeUser, createUser } = useUsers()
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [sortOrder, setSortOrder] = useState('newest')

    const filteredUsers = users
        .filter(
            (u) =>
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            const dateA = new Date(a.registered_at).getTime()
            const dateB = new Date(b.registered_at).getTime()

            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
        })

    if (loading)
        return <p className="text-center mt-10">Cargando usuarios...</p>

    return (
        <div className="bg-white p-5">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold">User Management</h1>

                <input
                    type="text"
                    className="border px-3 py-2 rounded w-64"
                    placeholder="Buscar usuario..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <button
                    onClick={() => setOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    + Add User
                </button>
            </div>

            <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="border px-3 py-1 rounded mb-4"
            >
                <option value="newest">Más recientes primero</option>
                <option value="oldest">Más antiguos primero</option>
            </select>

            <UserTable users={filteredUsers} onDelete={removeUser} />

            <CreateUserModal
                open={open}
                onClose={() => setOpen(false)}
                onSubmit={createUser}
            />
        </div>
    )
}
