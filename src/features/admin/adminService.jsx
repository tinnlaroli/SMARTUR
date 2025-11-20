const API_URL = 'http://localhost:3002/api'

function getAuthHeaders() {
    const token = localStorage.getItem('token')
    const headers = { 'Content-Type': 'application/json' }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }
    return headers
}

export async function getAllAdmins() {
    try {
        const res = await fetch(`${API_URL}/admin`, {
            headers: getAuthHeaders(),
        })
        if (!res.ok) {
            const errorText = await res.text()
            throw new Error(errorText || 'Error al obtener administradores')
        }
        const data = await res.json()
        return data.admins
    } catch (error) {
        throw error
    }
}

export async function createAdmin(data) {
    try {
        const res = await fetch(`${API_URL}/admin/register`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        })
        if (!res.ok) {
            const errorText = await res.text()
            throw new Error(errorText || 'Error al crear usuario')
        }
        return await res.json()
    } catch (error) {
        throw error
    }
}

export const deleteAdmin = async (userId) => {
    try {
        if (!userId && userId !== 0) {
            throw new Error('ID de usuario no válido')
        }

        const url = `${API_URL}/admin/delete/${userId}`

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        })

        if (!response.ok) {
            let errorMessage = 'Error al eliminar usuario'
            try {
                const errorData = await response.json()
                errorMessage = errorData.message || errorMessage
            } catch (parseError) {
                errorMessage = `Error ${response.status}: ${response.statusText}`
            }

            throw new Error(errorMessage)
        }

        try {
            const result = await response.json()
            return result
        } catch (jsonError) {
            return { success: true, message: 'Usuario eliminado correctamente' }
        }
    } catch (error) {
        throw error
    }
}
