import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-3xl font-bold">404: Página no encontrada</h1>
            <p className="text-gray-600">
                La página que estás buscando no existe.
            </p>
            <Link to="/" className="text-blue-600 hover:underline mt-4">
                Volver a la página de inicio
            </Link>
        </div>
    )
}

export default NotFound
