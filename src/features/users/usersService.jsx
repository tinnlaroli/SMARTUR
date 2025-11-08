const API_URL = 'http://localhost:3002/api'

// Función helper para obtener headers con autenticación
function getAuthHeaders() {
    const token = localStorage.getItem('token')
    const headers = { 'Content-Type': 'application/json' }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }
    return headers
}

export async function getAllUsers() {
    try {
        const res = await fetch(`${API_URL}/users`, {
            headers: getAuthHeaders(),
        })
        if (!res.ok) {
            const errorText = await res.text()
            throw new Error(errorText || 'Error al obtener usuarios')
        }
        return await res.json()
    } catch (error) {
        console.error('Error en getAllUsers:', error)
        throw error
    }
}

export async function createUser(data) {
    try {
        const res = await fetch(`${API_URL}/users/register`, {
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
        console.error('Error en createUser:', error)
        throw error
    }
}

export async function deleteUser(id) {
    try {
        const endpoint = `${API_URL}/users/delete/${id}`


        const headers = getAuthHeaders()
       
        const res = await fetch(endpoint, {
            method: 'DELETE',
            headers: headers,
        })

        const responseText = await res.text()

        if (!res.ok) {
            const errorMessage =
                responseText || `Error al eliminar usuario (${res.status})`
            throw new Error(errorMessage)
        }

        let result
        try {
            if (responseText && responseText.trim()) {
                result = JSON.parse(responseText)
            } else {
                result = { success: true, message: 'Usuario eliminado' }
            }
        } catch (parseError) {
            result = { success: true, message: 'Usuario eliminado' }
        }
        return result
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error(
                'Error de conexión. Verifica que el servidor esté corriendo.'
            )
        }

        throw error
    }
}
