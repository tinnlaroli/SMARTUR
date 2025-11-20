import React from 'react'

const TrashIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 16 16"
        className="w-4 h-4"
    >
        <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5" />
    </svg>
)

// ✅ Cambiado a AdminTable (con mayúscula)
export default function AdminTable({ data, onDelete, deleting = false }) {
    return (
        <div className="overflow-x-auto bg-white shadow rounded-lg">
            <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-gray-100 text-gray-700">
                    <tr>
                        <th className="px-4 py-3 border-b">ID Usuario</th>
                        <th className="px-4 py-3 border-b">Nombre</th>
                        <th className="px-4 py-3 border-b">Email</th>
                        <th className="px-4 py-3 border-b">
                            Fecha de Registro
                        </th>
                        <th className="px-4 py-3 border-b text-center">
                            Acciones
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {data && data.length > 0 ? (
                        data.map((u, i) => {
                            const userId =
                                u.user_id || u.id || u.userId || u.UserID

                            return (
                                <tr
                                    key={userId || i}
                                    className="hover:bg-gray-50 border-b"
                                >
                                    <td className="px-4 py-3">
                                        {userId || i + 1}
                                    </td>
                                    <td className="px-4 py-3">
                                        {u.name || u.nombre || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {u.email || u.correo || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {u.registered_at ||
                                        u.created_at ||
                                        u.fecha_registro
                                            ? new Date(
                                                  u.registered_at ||
                                                      u.created_at ||
                                                      u.fecha_registro
                                              ).toLocaleDateString()
                                            : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                if (
                                                    onDelete &&
                                                    userId &&
                                                    !deleting
                                                ) {
                                                    const userName =
                                                        u.name ||
                                                        u.nombre ||
                                                        u.email ||
                                                        'el usuario'
                                                    onDelete(userId, userName)
                                                }
                                            }}
                                            disabled={!userId || deleting}
                                            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                        >
                                            <TrashIcon />
                                            {deleting ? 'Eliminando...' : 'Eliminar'}
                                        </button>
                                    </td>
                                </tr>
                            )
                        })
                    ) : (
                        <tr>
                            <td
                                colSpan="5"
                                className="text-center py-8 text-gray-500 italic"
                            >
                                No hay administradores registrados
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}