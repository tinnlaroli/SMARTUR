import React, { useEffect, useState } from 'react'
import { getAllAdmins, deleteAdmin } from './adminService'
import AdminTable from './AdminTable'
import AdminCreateModal from './AdminCreate'
import ToastSuccess from '../../components/common/ToastSuccess'
import ToastError from '../../components/common/ToastError'
import ConfirmModal from '../../components/common/ConfirmModal'

export default function AdminList() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [admins, setAdmins] = useState([]) // ← Esta es la variable correcta
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
            const data = await getAllAdmins()
            const adminsArray = Array.isArray(data) ? data : data?.data || []
            setAdmins(adminsArray) // ← Guardando en 'admins'
        } catch (error) {
            console.error('Error al cargar Administradors:', error)
            setToastMessage(
                error.message || 'Error al cargar la lista de Administradors'
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
            setToastMessage('ID de Administrador no válido')
            setShowError(true)
            return
        }
        setDeleteConfirm({
            isOpen: true,
            userId: id,
            userName: userName || 'este Administrador',
        })
    }

    const handleConfirmDelete = async () => {
        const { userId } = deleteConfirm

        if (!userId && userId !== 0) {
            setToastMessage('ID de Administrador no válido')
            setShowError(true)
            setDeleteConfirm({ isOpen: false, userId: null, userName: '' })
            return
        }

        try {
            setDeleting(true)
            setDeleteConfirm({ isOpen: false, userId: null, userName: '' })

            console.log('Eliminando Administrador con ID:', userId)
            const result = await deleteAdmin(userId)
            console.log('Administrador eliminado exitosamente:', result)

            setToastMessage('Administrador eliminado correctamente')
            setShowSuccess(true)

            // Recargar la lista después de un breve delay
            setTimeout(() => {
                load()
            }, 500)
        } catch (error) {
            console.error('Error al eliminar Administrador:', error)
            setToastMessage(
                error.message ||
                    'Error al eliminar Administrador. Intenta nuevamente.'
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
        setToastMessage('Administrador creado correctamente')
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
                title="Eliminar Administrador"
                message={`¿Estás seguro de que deseas eliminar a ${deleteConfirm.userName}? Esta acción no se puede deshacer.`}
                confirmText={deleting ? 'Eliminando...' : 'Eliminar'}
                cancelText="Cancelar"
                confirmColor="bg-red-500 hover:bg-red-600"
            />

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Información de administradores</h2>

                <label
                    className="bg-white flex items-center border border-gray-300 py-2 px-4 rounded-lg gap-2 shadow-sm focus-within:border-purple transition-colors"
                    htmlFor="search-bar"
                >
                    <input
                        id="search-bar"
                        placeholder="Buscar Administrador..."
                        className="flex-1 outline-none bg-transparent text-gray-700 min-w-[200px]"
                    />

                    <button className="px-3 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-700 active:scale-95 transition-all duration-150">
                        <span className="text-sm font-medium">Buscar</span>
                    </button>
                </label>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-purple text-white px-4 py-2 rounded-lg hover:bg-purple/90 transition-all font-medium"
                >
                    + Nuevo Administrador
                </button>
            </div>
            <AdminCreateModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleUserCreated}
            />

            {/* CORRECCIÓN: Cambiar 'users' por 'admins' */}
            {loading && admins.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    Cargando Administrador...
                </div>
            ) : (
                <AdminTable
                    data={admins} 
                    onDelete={handleDeleteClick}
                    deleting={deleting}
                />
            )}
        </div>
    )
}