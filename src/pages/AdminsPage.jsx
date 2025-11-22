import React, { useState } from 'react'
import { AdminTable } from '../features/admin/AdminTable'
import { useAdmins } from '../hooks/useAdmins'
import CreateAdminModal from '../features/admin/CreateAdminModal'
import ConfirmModal from '../components/common/ConfirmModal'
import ToastError from '../components/common/ToastError'
import ToastSuccess from '../components/common/ToastSuccess'


export default function AdminsPage() {
    const { admins, loading, removeAdmin, createAdmin } = useAdmins()

    const [openCreate, setOpenCreate] = useState(false)
    const [deleteId, setDeleteId] = useState(null)
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    const [search, setSearch] = useState('')
    const [sortOrder, setSortOrder] = useState('newest')

    const filteredAdmins = admins
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

    const onConfirmDelete = async () => {
        try {
            await removeAdmin(deleteId)
            setSuccessMessage('Usuario eliminado correctamente')
        } catch {
            setErrorMessage('Error al eliminar usuario')
        }
        setDeleteId(null)
    }

    return (
        <div className="bg-white p-5">
            <ToastError
                message={errorMessage}
                onClose={() => setErrorMessage('')}
            />
            <ToastSuccess
                message={successMessage}
                onClose={() => setSuccessMessage('')}
            />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold">
                    Administrador de usuarios
                </h1>

                <input
                    type="text"
                    className="border px-3 py-2 rounded w-64"
                    placeholder="Buscar usuario..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <button
                    onClick={() => setOpenCreate(true)}
                    className="bg-purple text-white px-4 py-2 rounded hover:bg-purple/90 transition-all font-medium"
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

            <AdminTable
                admins={filteredAdmins}
                onDelete={(id) => setDeleteId(id)}
            />

            <CreateAdminModal
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onSubmit={async (data) => {
                    try {
                        await createAdmin(data)
                        setSuccessMessage('Usuario creado correctamente')
                    } catch {
                        setErrorMessage('Error al crear usuario')
                    }
                }}
            />

            <ConfirmModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={onConfirmDelete}
                title="Eliminar usuario"
                message="¿Estás seguro de que deseas eliminar este usuario?"
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </div>
    )
}
