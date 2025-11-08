import React, { useEffect, useState } from 'react'
import { getAllUsers, deleteUser } from './usersService'
import UserTable from './UserTable'
import UserCreateModal from './UserCreate'
import ToastSuccess from '../../components/common/ToastSuccess'
import ToastError from '../../components/common/ToastError'
import ConfirmModal from '../../components/common/ConfirmModal'

export default function UsersList() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [users, setUsers] = useState([])
    const [showSuccess, setShowSuccess] = useState(false)
    const [showError, setShowError] = useState(false)
    const [toastMessage, setToastMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState({
        isOpen: false,
        userId: null,
        userName: '',
    })
    const [deleting, setDeleting] = useState(false)

    const load = async () => {
        try {
            setLoading(true)
            const data = await getAllUsers()
            const usersArray = Array.isArray(data) ? data : data?.data || []
            setUsers(usersArray)
        } catch (error) {
            console.error('Error al cargar usuarios:', error)
            setToastMessage(
                error.message || 'Error al cargar la lista de usuarios'
            )
            setShowError(true)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    const handleDeleteClick = (id, userName) => {
        if (!id && id !== 0) {
            setToastMessage('ID de usuario no válido')
            setShowError(true)
            return
        }
        setDeleteConfirm({
            isOpen: true,
            userId: id,
            userName: userName || 'este usuario',
        })
    }

    const handleConfirmDelete = async () => {
        const { userId } = deleteConfirm

        if (!userId && userId !== 0) {
            setToastMessage('ID de usuario no válido')
            setShowError(true)
            setDeleteConfirm({ isOpen: false, userId: null, userName: '' })
            return
        }

        try {
            setDeleting(true)
            setDeleteConfirm({ isOpen: false, userId: null, userName: '' })

            console.log('Eliminando usuario con ID:', userId)
            const result = await deleteUser(userId)
            console.log('Usuario eliminado exitosamente:', result)

            setToastMessage('Usuario eliminado correctamente')
            setShowSuccess(true)

            // Recargar la lista después de un breve delay
            setTimeout(() => {
                load()
            }, 500)
        } catch (error) {
            console.error('Error al eliminar usuario:', error)
            setToastMessage(
                error.message ||
                    'Error al eliminar usuario. Intenta nuevamente.'
            )
            setShowError(true)
        } finally {
            setDeleting(false)
        }
    }

    const handleCancelDelete = () => {
        setDeleteConfirm({ isOpen: false, userId: null, userName: '' })
    }

    const handleUserCreated = () => {
        setIsModalOpen(false)
        setToastMessage('Usuario creado correctamente')
        setShowSuccess(true)
        load()
    }

    return (
        <div className="p-6">
            {showSuccess && (
                <ToastSuccess
                    message={toastMessage}
                    onClose={() => setShowSuccess(false)}
                />
            )}
            {showError && (
                <ToastError
                    message={toastMessage}
                    onClose={() => setShowError(false)}
                />
            )}

            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Eliminar usuario"
                message={`¿Estás seguro de que deseas eliminar a ${deleteConfirm.userName}? Esta acción no se puede deshacer.`}
                confirmText={deleting ? 'Eliminando...' : 'Eliminar'}
                cancelText="Cancelar"
                confirmColor="bg-red-500 hover:bg-red-600"
            />

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-purple text-white px-4 py-2 rounded-lg hover:bg-purple/90 transition-all font-medium"
                >
                    + Nuevo Usuario
                </button>
            </div>

            <UserCreateModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleUserCreated}
            />

            {loading && users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    Cargando usuarios...
                </div>
            ) : (
                <UserTable
                    data={users}
                    onDelete={handleDeleteClick}
                    deleting={deleting}
                />
            )}
        </div>
    )
}
