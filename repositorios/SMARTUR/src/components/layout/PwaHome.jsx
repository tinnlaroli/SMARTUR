import React from "react";
import { FaMapMarkerAlt } from "react-icons/fa";
import clsx from "clsx";

export default function PwaHome({
  isStandalonePwa,
  user,
  logout,
  setShowLoginModal,
  handleStartExperience,
  setShowCordobaMap,
  openInfoCards,
  bgPatron,      // ruta al patrón de fondo
  logoArriba     // ruta al logo (PNG/SVG)
}) {
  if (!isStandalonePwa) return null;

  return (
    <div className="relative min-h-screen flex flex-col bg-white font-sans overflow-x-hidden">
      {/* Fondo superior: patrón en la parte superior - fixed para cubrir todo el ancho */}
      <div
        aria-hidden
        className="fixed top-0 left-0 right-0 h-[25%] z-[1] md:h-[35%]"
        style={{
          backgroundImage: `url(${bgPatron})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          filter: "blur(3px)",
          opacity: 0.85,
          width: "100vw",
          willChange: "transform"
        }}
      />

      {/* Fondo inferior: patrón en la parte inferior - fixed para cubrir todo el ancho */}
      <div
        aria-hidden
        className="fixed bottom-0 left-0 right-0 h-[25%] z-[1]"
        style={{
          backgroundImage: `url(${bgPatron})`,
          backgroundSize: "cover",
          backgroundPosition: "center bottom",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          filter: "blur(3px)",
          opacity: 0.85,
          width: "100vw",
          willChange: "transform"
        }}
      />

      {/* Overlay degradado suave para crear espacio blanco más ancho en el centro */}
      <div className="fixed inset-0 z-[2] bg-gradient-to-b from-transparent via-white via-white via-white to-transparent pointer-events-none" />

      {/* Navbar compacto */}
      <header className="absolute top-4 left-4 right-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-neutral-700/70 max-w-[160px] truncate font-sans">
            {user ? (user.name || user.email) : ""}
          </span>
        </div>
        <div>
          {user ? (
            <button
              onClick={logout}
              aria-label="Cerrar sesión"
              className="text-[11px] font-medium bg-white/30 backdrop-blur-sm border border-white/40 rounded-full px-3 py-1 hover:bg-white/40 transition font-sans"
            >
              Cerrar sesión
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowLoginModal(true);
              }}
              aria-label="Iniciar sesión"
              className="text-[14px] font-semibold bg-pink text-white rounded-full px-3 py-1 shadow-md font-sans relative z-50"
            >
              Iniciar sesión
            </button>
          )}
        </div>
      </header>

      {/* Contenido principal */}
      <main className="relative z-30 flex-1 flex flex-col items-center justify-center px-6 py-10">
        {/* Logo circular elevado - mucho más grande */}
        <div className="w-80 h-80 md:w-96 md:h-96 bg-white rounded-full flex items-center justify-center mb-12 z-40">
          <img src={logoArriba} alt="SMARTUR logo" className="w-72 h-72 md:w-[22rem] md:h-[22rem] object-contain" />
        </div>

        {/* Card blanca con bordes grandes y botones */}
        <section className="w-full max-w-xs bg-white rounded-[28px] shadow-2xl px-6 pt-8 pb-8 space-y-4 z-40">
          <div className="space-y-3">
            {/* Botón principal - rosa */}
            <button
              onClick={handleStartExperience}
              aria-label="¿A dónde vamos?"
              className="w-full relative group overflow-visible"
            >
              <div className="bg-pink hover:bg-pink-dark rounded-full transition-all duration-300 hover:scale-[1.02] flex items-center pr-2 pl-6 py-1 relative overflow-visible">
                <span className="text-white font-bold text-2xl sm:text-3xl flex-1 text-left py-2">
                  ¿A dónde vamos?
                </span>
                <span className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-pink flex-shrink-0 absolute right-[-14px] top-1/2 -translate-y-1/2 z-10">
                  <FaMapMarkerAlt className="w-8 h-8" />
                </span>
              </div>
            </button>

            {/* Botón secundario - naranja */}
            <button
              onClick={() => setShowCordobaMap(true)}
              aria-label="Conoce la región"
              className="w-full relative group overflow-visible"
            >
              <div className="bg-orange hover:bg-orange-dark rounded-full transition-all duration-300 hover:scale-[1.02] flex items-center pr-2 pl-6 py-1 relative overflow-visible">
                <span className="text-white font-bold text-2xl sm:text-3xl flex-1 text-left py-2">
                  Conoce la región
                </span>
                <span className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-orange flex-shrink-0 absolute right-[-14px] top-1/2 -translate-y-1/2 z-10">
                  <FaMapMarkerAlt className="w-8 h-8" />
                </span>
              </div>
            </button>

            {/* Botón terciario - verde */}
            <button
              onClick={openInfoCards}
              aria-label="Sobre nosotros"
              className="w-full relative group overflow-visible"
            >
              <div className="bg-green hover:bg-green-dark rounded-full transition-all duration-300 hover:scale-[1.02] flex items-center pr-2 pl-6 py-1 relative overflow-visible">
                <span className="text-white font-bold text-2xl sm:text-3xl flex-1 text-left py-2">
                  Sobre nosotros
                </span>
                <span className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-green flex-shrink-0 absolute right-[-14px] top-1/2 -translate-y-1/2 z-10">
                  <FaMapMarkerAlt className="w-8 h-8" />
                </span>
              </div>
            </button>
          </div>
        </section>
      </main>

      {/* Footer compacto */}
      <footer className="absolute bottom-4 left-0 right-0 z-30 text-center text-[11px] text-neutral-700/60 font-sans">
        &copy; {new Date().getFullYear()} SMARTUR
      </footer>
    </div>
  );
}
