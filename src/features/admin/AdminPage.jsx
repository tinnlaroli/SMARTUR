import React, { useState, useMemo } from 'react'
import { adminApi } from '../../api/adminApi'
import { useResource } from '../../hooks/useResource'
import { adminConfig } from './adminConfig'
import DataTable from '../../components/ui/DataTable'
import CrudFormModal from '../../components/ui/CrudFormModal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

export default function AdminPage() {
    const { items, loading, create, update, remove } = useResource(adminApi)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortByDate, setSortByDate] = useState('')
    const [sortByColumn, setSortByColumn] = useState({
        column: null,
        direction: 'asc',
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [editingItem, setEditingItem] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState({
        open: false,
        id: null,
    })

    // Opciones de ordenamiento por fecha
    const sortOptions = [
        { value: 'recent', label: 'Más recientes primero' },
        { value: 'oldest', label: 'Más antiguos primero' },
    ]

    // Filtrar, buscar y ordenar datos
    const filteredData = useMemo(() => {
        let filtered = items

        // Aplicar búsqueda
        if (searchTerm) {
            filtered = filtered.filter((item) =>
                Object.values(item).some((value) =>
                    String(value)
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                )
            )
        }

        // Aplicar ordenamiento por fecha
        if (sortByDate) {
            filtered = [...filtered].sort((a, b) => {
                const dateA = new Date(a.registered_at || 0)
                const dateB = new Date(b.registered_at || 0)
                return sortByDate === 'recent' ? dateB - dateA : dateA - dateB
            })
        }

        // Aplicar ordenamiento por columna (ID)
        if (sortByColumn.column) {
            filtered = [...filtered].sort((a, b) => {
                const aVal = a[sortByColumn.column]
                const bVal = b[sortByColumn.column]

                // Manejar números
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return sortByColumn.direction === 'asc'
                        ? aVal - bVal
                        : bVal - aVal
                }

                // Manejar strings
                const aStr = String(aVal || '').toLowerCase()
                const bStr = String(bVal || '').toLowerCase()
                if (sortByColumn.direction === 'asc') {
                    return aStr.localeCompare(bStr)
                } else {
                    return bStr.localeCompare(aStr)
                }
            })
        }

        return filtered
    }, [items, searchTerm, sortByDate, sortByColumn])

    // Calcular paginación
    const totalPages = Math.ceil(filteredData.length / itemsPerPage)
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        return filteredData.slice(startIndex, startIndex + itemsPerPage)
    }, [filteredData, currentPage, itemsPerPage])

    // Resetear página cuando cambian los filtros
    const handleSearchChange = (value) => {
        setSearchTerm(value)
        setCurrentPage(1)
    }

    const handleSortByDateChange = (value) => {
        setSortByDate(value)
        setCurrentPage(1)
    }

    const handleColumnSort = (columnKey) => {
        setSortByColumn((prev) => {
            if (prev.column === columnKey) {
                // Si ya está ordenando por esta columna, cambiar dirección
                return {
                    column: columnKey,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc',
                }
            } else {
                // Nueva columna, empezar con ascendente
                return {
                    column: columnKey,
                    direction: 'asc',
                }
            }
        })
        setCurrentPage(1)
    }

    const handleEdit = (item) => {
        setEditingItem(item)
    }

    const handleUpdate = async (formData) => {
        if (editingItem) {
            // Si el password está vacío, no lo incluimos en la actualización
            const updateData = { ...formData }
            if (!updateData.password || updateData.password.trim() === '') {
                delete updateData.password
            }
            await update(editingItem.id, updateData)
            setEditingItem(null)
        }
    }

    const handleDeleteClick = (id) => {
        setDeleteConfirm({ open: true, id })
    }

    const handleDeleteConfirm = async () => {
        if (deleteConfirm.id) {
            await remove(deleteConfirm.id)
            setDeleteConfirm({ open: false, id: null })
            // Ajustar página si es necesario
            if (paginatedData.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1)
            }
        }
    }

    return (
        <>
            <DataTable
                title={adminConfig.title}
                columns={adminConfig.columns}
                data={paginatedData}
                loading={loading}
                formSchema={adminConfig.form}
                onCreate={create}
                onDelete={handleDeleteClick}
                onEdit={handleEdit}
                searchValue={searchTerm}
                onSearchChange={handleSearchChange}
                sortOptions={sortOptions}
                sortValue={sortByDate}
                onSortChange={handleSortByDateChange}
                onColumnSort={handleColumnSort}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={(value) => {
                    setItemsPerPage(value)
                    setCurrentPage(1)
                }}
                addButtonText="Add Admin"
            />

            {editingItem && (
                <CrudFormModal
                    formSchema={adminConfig.form}
                    onSubmit={handleUpdate}
                    editingItem={editingItem}
                    open={true}
                    onClose={() => setEditingItem(null)}
                />
            )}

            <ConfirmDialog
                open={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, id: null })}
                onConfirm={handleDeleteConfirm}
                title="Eliminar Administrador"
                message="¿Estás seguro de que deseas eliminar este administrador? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                type="danger"
            />
        </>
    )
}

