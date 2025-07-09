import React, { useState } from "react";
import { FaSpinner } from 'react-icons/fa'

export default function RegisterModal({ onClose, onShowLogin }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Validación simple
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }
    try {
      // Simular registro
      await new Promise((res) => setTimeout(res, 1000));
      onClose();
    } catch (err) {
      setError('Error al registrar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative animate-fadeInUp focus:outline-none" tabIndex={-1}>
        {/* Botón cerrar */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-purple"
          onClick={onClose}
          aria-label="Cerrar"
        >
          &times;
        </button>

        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-purple">Crear una cuenta</h2>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1" htmlFor="register-fullName">Nombre completo</label>
            <input
              id="register-fullName"
              type="text"
              name="fullName"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple text-sm sm:text-base"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Tu nombre"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1" htmlFor="register-email">Correo electrónico</label>
            <input
              id="register-email"
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
            <label className="block text-sm text-gray-600 mb-1" htmlFor="register-password">Contraseña</label>
            <input
              id="register-password"
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
            <label className="block text-sm text-gray-600 mb-1" htmlFor="register-confirmPassword">Confirmar contraseña</label>
            <input
              id="register-confirmPassword"
              type="password"
              name="confirmPassword"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple text-sm sm:text-base"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="********"
              required
            />
          </div>

          {error && <div className="text-red-600 text-sm text-center animate-fadeInUp">{error}</div>}

          <button
            type="submit"
            className="w-full bg-orange text-white py-2 rounded-md font-semibold hover:bg-orange/90 transition text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? <FaSpinner className="animate-spin" /> : 'Registrarse'}
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