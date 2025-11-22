import React from "react";

export const UserTable = ({ users, onDelete }) => {
    return (
        <table className="bg-white w-full text-left border-collapse">
            <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm">
                    <th className="p-3">ID</th>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Registro</th>
                    <th className="p-3">Acciones</th>
                </tr>
            </thead>

            <tbody>
                {users.map((u) => (
                    <tr
                        key={u.id}
                        className="border-b hover:bg-gray-50 transition"
                    >
                        <td className="p-3">{u.id}</td>
                        <td className="p-3">{u.name}</td>
                        <td className="p-3">{u.email}</td>
                        <td className="p-3">{u.role_id}</td>
                        <td className="p-3">
                            {new Date(u.registered_at).toLocaleDateString()}
                        </td>

                        <td className="p-3">
                            <button
                                onClick={() => onDelete(u.id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                            >
                                Eliminar
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
