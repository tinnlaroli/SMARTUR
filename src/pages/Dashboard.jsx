import React from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const userName = "Fernanda"; // Puedes conectar con contexto luego

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-purple text-white p-4 md:p-6 md:hidden">
        <h2 className="text-xl md:text-2xl font-display font-bold mb-6 md:mb-10">SMARTUR</h2>
        <nav className="flex flex-wrap gap-2 md:gap-0 md:flex-col md:space-y-4 text-xs md:text-sm">
          <Link to="/dashboard" className="block hover:text-orange transition-colors px-2 py-1 md:px-0 md:py-0">
            Panel
          </Link>
          <Link to="/recommender" className="block hover:text-orange transition-colors px-2 py-1 md:px-0 md:py-0">
            Recomendación
          </Link>
          <Link to="/history" className="block hover:text-orange transition-colors px-2 py-1 md:px-0 md:py-0">
              Historial
          </Link>
          <Link to="/map" className="block hover:text-orange transition-colors px-2 py-1 md:px-0 md:py-0">
            Mapa
          </Link>
          <Link to="/about" className="block hover:text-orange transition-colors px-2 py-1 md:px-0 md:py-0">
            Acerca de
          </Link>
        </nav>
      </aside>

      {/* Desktop Sidebar */}      <aside className="w-64 bg-purple text-white p-6 hidden md:block">
        <h2 className="text-2xl font-display font-bold mb-10">SMARTUR</h2>
        <nav className="space-y-4 text-sm">
          <Link to="/dashboard" className="block hover:text-orange transition-colors">
            🏠 Panel de usuario
          </Link>
          <Link to="/recommender" className="block hover:text-orange transition-colors">
            🎯 Generar recomendación
          </Link>
          <Link to="/history" className="block hover:text-orange transition-colors">
            📜 Historial
          </Link>
          <Link to="/map" className="block hover:text-orange transition-colors">
            🗺️ Mapa interactivo
          </Link>
          <Link to="/about" className="block hover:text-orange transition-colors">
            ℹ️ Acerca de SMARTUR
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 bg-gray-50">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
          ¡Hola, {userName}! 👋
        </h1>
        <p className="text-gray-600 mb-6 sm:mb-10 text-sm sm:text-base">
          Bienvenida a tu panel personalizado de SMARTUR. ¿Qué quieres hacer hoy?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Link
            to="/recommender"
            className="bg-green text-white p-4 sm:p-6 rounded-xl shadow hover:bg-green/90 transition"
          >
            <h2 className="text-lg sm:text-xl font-bold mb-2">🎯 Nueva Recomendación</h2>
            <p className="text-sm sm:text-base">Completa el formulario para recibir una experiencia personalizada.</p>
          </Link>

          <Link
            to="/history"
            className="bg-blue text-white p-4 sm:p-6 rounded-xl shadow hover:bg-blue/90 transition"
          >
            <h2 className="text-lg sm:text-xl font-bold mb-2">📜 Recomendaciones previas</h2>
            <p className="text-sm sm:text-base">Consulta tu historial completo.</p>
          </Link>

          <Link
            to="/map"
            className="bg-orange text-white p-4 sm:p-6 rounded-xl shadow hover:bg-orange/90 transition"
          >
            <h2 className="text-lg sm:text-xl font-bold mb-2">🗺️ Explora el mapa</h2>
            <p className="text-sm sm:text-base">Filtra y visualiza servicios turísticos validados.</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
