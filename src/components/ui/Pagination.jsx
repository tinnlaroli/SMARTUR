import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    itemsPerPage = 10,
    onItemsPerPageChange,
}) {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

    return (
        <div className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Items por página:</span>
                <select
                    value={itemsPerPage}
                    onChange={(e) =>
                        onItemsPerPageChange(Number(e.target.value))
                    }
                    className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                </select>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="size-4" />
                </button>

                <div className="flex gap-1">
                    {pages.map((page) => (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`px-3 py-1 rounded-lg border transition ${
                                currentPage === page
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronRight className="size-4" />
                </button>

                <span className="text-sm text-gray-600 ml-2">
                    Página {currentPage} de {totalPages}
                </span>
            </div>
        </div>
    )
}

