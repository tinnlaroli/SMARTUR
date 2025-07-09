import React, { useState } from "react";

export default function LoginModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    // Aquí puedes hacer la lógica de autenticación
    console.log("Iniciar sesión con:", email, password);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8 relative animate-fadeInUp">
        {/* Botón cerrar */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
          onClick={onClose}
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center text-purple">Iniciar sesión</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Correo electrónico</label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Contraseña</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="text-center text-sm">
            <a href="#" className="text-blue hover:underline">¿Olvidaste tu contraseña?</a>
          </div>

          <button
            type="submit"
            className="w-full bg-orange text-white py-2 rounded-md font-semibold hover:bg-orange/90 transition"
          >
            Iniciar sesión
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">¿No tienes cuenta?</p>
          <a
            href="/register"
            className="text-purple font-semibold hover:underline text-sm"
            onClick={onClose}
          >
            Regístrate
          </a>
        </div>
      </div>
    </div>
  );
}
