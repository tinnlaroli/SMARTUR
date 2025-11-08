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
        console.log('=== INICIANDO ELIMINACIÓN ===')
        console.log('ID del usuario:', id)
        console.log('Tipo de ID:', typeof id)

        const endpoint = `${API_URL}/users/delete/${id}`
        console.log('Endpoint completo:', endpoint)

        const headers = getAuthHeaders()
        const token = localStorage.getItem('token')
        console.log('Token presente:', !!token)
        console.log('Headers:', {
            ...headers,
            Authorization: headers.Authorization ? 'Bearer ***' : 'No token',
        })

        console.log('Realizando petición DELETE...')
        const res = await fetch(endpoint, {
            method: 'DELETE',
            headers: headers,
        })

        console.log('=== RESPUESTA DEL SERVIDOR ===')
        console.log('Status:', res.status)
        console.log('Status Text:', res.statusText)
        console.log('OK:', res.ok)
        console.log(
            'Headers de respuesta:',
            Object.fromEntries(res.headers.entries())
        )

        // Leer el cuerpo de la respuesta una sola vez
        const responseText = await res.text()
        console.log('Texto de respuesta:', responseText || '(vacío)')

        if (!res.ok) {
            console.error('=== ERROR DEL SERVIDOR ===')
            console.error('Texto del error:', responseText)

            const errorMessage =
                responseText || `Error al eliminar usuario (${res.status})`
            console.error('Mensaje de error final:', errorMessage)
            throw new Error(errorMessage)
        }

        // Intentar parsear como JSON, si falla asumir éxito
        let result
        try {
            if (responseText && responseText.trim()) {
                result = JSON.parse(responseText)
                console.log('Respuesta parseada como JSON:', result)
            } else {
                result = { success: true, message: 'Usuario eliminado' }
                console.log('Respuesta vacía, asumiendo éxito')
            }
        } catch (parseError) {
            console.log('No se pudo parsear como JSON, asumiendo éxito')
            console.log('Error de parseo:', parseError)
            result = { success: true, message: 'Usuario eliminado' }
        }

        console.log('=== ELIMINACIÓN EXITOSA ===')
        console.log('Resultado final:', result)
        return result
    } catch (error) {
        console.error('=== ERROR EN deleteUser ===')
        console.error('Tipo de error:', error.name)
        console.error('Mensaje:', error.message)
        console.error('Stack:', error.stack)

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error(
                'Error de conexión. Verifica que el servidor esté corriendo.'
            )
        }

        throw error
    }
}
