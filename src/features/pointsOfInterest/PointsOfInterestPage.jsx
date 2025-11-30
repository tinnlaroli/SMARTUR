import React, { useState, useMemo } from 'react'
import { pointsOfInterestApi } from '../../api/pointsOfInterestApi'
import { useResource } from '../../hooks/useResource'
import { pointsOfInterestConfig } from './pointsOfInterestConfig'
import DataTable from '../../components/ui/DataTable'
import CrudFormModal from '../../components/ui/CrudFormModal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

export default function PointsOfInterestPage() {
    const { items, loading, create, update, remove } =
        useResource(pointsOfInterestApi)
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

    const sortOptions = [
        { value: 'recent', label: 'Más recientes primero' },
        { value: 'oldest', label: 'Más antiguos primero' },
    ]

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

                if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
                    return sortByColumn.direction === 'asc'
                        ? aVal === bVal
                            ? 0
                            : aVal
                            ? 1
                            : -1
                        : aVal === bVal
                        ? 0
                        : aVal
                        ? -1
                        : 1
                }

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

    const totalPages = Math.ceil(filteredData.length / itemsPerPage)
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        return filteredData.slice(startIndex, startIndex + itemsPerPage)
    }, [filteredData, currentPage, itemsPerPage])

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
                return {
                    column: columnKey,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc',
                }
            } else {
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
            await update(editingItem.id, formData)
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
                title={pointsOfInterestConfig.title}
                columns={pointsOfInterestConfig.columns}
                data={paginatedData}
                loading={loading}
                formSchema={pointsOfInterestConfig.form}
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
                addButtonText="Add Point"
            />

            {editingItem && (
                <CrudFormModal
                    formSchema={pointsOfInterestConfig.form}
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
                title="Eliminar Punto de Interés"
                message="¿Estás seguro de que deseas eliminar este punto de interés? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                type="danger"
            />
        </>
    )
}

