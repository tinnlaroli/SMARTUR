import React from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const userName = "Fernanda"; // Puedes conectar con contexto luego

  return (
    <div className="min-h-screen flex bg-white">
      {/* Sidebar */}
      <aside className="w-64 bg-purple text-white p-6 hidden md:block">
        <h2 className="text-2xl font-display font-bold mb-10">SMARTUR</h2>
        <nav className="space-y-4 text-sm">
          <Link to="/dashboard" className="block hover:text-orange">
            🏠 Panel de usuario
          </Link>
          <Link to="/recommender" className="block hover:text-orange">
            🎯 Generar recomendación
          </Link>
          <Link to="/history" className="block hover:text-orange">
            📜 Historial
          </Link>
          <Link to="/map" className="block hover:text-orange">
            🗺️ Mapa interactivo
          </Link>
          <Link to="/about" className="block hover:text-orange">
            ℹ️ Acerca de SMARTUR
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-gray-50">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          ¡Hola, {userName}! 👋
        </h1>
        <p className="text-gray-600 mb-10">
          Bienvenida a tu panel personalizado de SMARTUR. ¿Qué quieres hacer hoy?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/recommender"
            className="bg-green text-white p-6 rounded-xl shadow hover:bg-green/90 transition"
          >
            <h2 className="text-xl font-bold mb-2">🎯 Nueva Recomendación</h2>
            <p>Completa el formulario para recibir una experiencia personalizada.</p>
          </Link>

          <Link
            to="/history"
            className="bg-blue text-white p-6 rounded-xl shadow hover:bg-blue/90 transition"
          >
            <h2 className="text-xl font-bold mb-2">📜 Recomendaciones previas</h2>
            <p>Consulta tu historial completo.</p>
          </Link>

          <Link
            to="/map"
            className="bg-orange text-white p-6 rounded-xl shadow hover:bg-orange/90 transition"
          >
            <h2 className="text-xl font-bold mb-2">🗺️ Explora el mapa</h2>
            <p>Filtra y visualiza servicios turísticos validados.</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
