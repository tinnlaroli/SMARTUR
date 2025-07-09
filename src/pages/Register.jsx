import React from "react";
import { Link } from "react-router-dom";

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple to-blue px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-purple mb-6">Crear una cuenta</h2>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
            <input
              type="text"
              className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:outline-purple"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
            <input
              type="email"
              className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:outline-purple"
              placeholder="tucorreo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:outline-purple"
              placeholder="********"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
            <input
              type="password"
              className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:outline-purple"
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange hover:bg-orange/90 text-white font-bold py-2 rounded-lg"
          >
            Registrarse
          </button>

          <div className="text-center mt-4 text-sm">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-purple font-semibold hover:underline">
              Inicia sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
