import React, { useState } from "react";

export default function RegisterModal({ onClose, onShowLogin }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    // Aquí puedes hacer la lógica de registro
    console.log("Registrar con:", formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 sm:p-8 relative animate-fadeInUp">
        {/* Botón cerrar */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
          onClick={onClose}
        >
          &times;
        </button>

        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-purple">Crear una cuenta</h2>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nombre completo</label>
            <input
              type="text"
              name="fullName"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple text-sm sm:text-base"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Tu nombre"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Correo electrónico</label>
            <input
              type="email"
              name="email"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple text-sm sm:text-base"
              value={formData.email}
              onChange={handleChange}
              placeholder="tucorreo@ejemplo.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Contraseña</label>
            <input
              type="password"
              name="password"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple text-sm sm:text-base"
              value={formData.password}
              onChange={handleChange}
              placeholder="********"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Confirmar contraseña</label>
            <input
              type="password"
              name="confirmPassword"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple text-sm sm:text-base"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="********"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange text-white py-2 rounded-md font-semibold hover:bg-orange/90 transition text-sm sm:text-base"
          >
            Registrarse
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs sm:text-sm text-gray-600">¿Ya tienes cuenta?</p>
          <button
            className="text-purple font-semibold hover:underline text-xs sm:text-sm"
            onClick={() => {
              onClose();
              onShowLogin();
            }}
          >
            Inicia sesión
          </button>
        </div>
      </div>
    </div>
  );
} 