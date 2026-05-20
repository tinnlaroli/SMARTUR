import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaMapMarkerAlt, FaQuoteLeft, FaStar } from "react-icons/fa";

const locations = [
  {
    id: "cordoba",
    name: "Córdoba",
    x: "40%",
    y: "55%",
    testimonial:
      "SMARTUR me llevó a rincones cafetaleros que nunca hubiera encontrado por mi cuenta. Una experiencia autética.",
    author: "María Pérez",
    rating: 5,
    userImage: "https://i.pravatar.cc/150?u=maria",
  },
  {
    id: "orizaba",
    name: "Orizaba",
    x: "30%",
    y: "40%",
    testimonial:
      "El algoritmo entendió perfectamente que buscaba aventura y me sugirió la ruta ideal hacia el Pico.",
    author: "Carlos Ruiz",
    rating: 5,
    userImage: "https://i.pravatar.cc/150?u=carlos",
  },
  {
    id: "xalapa",
    name: "Xalapa",
    x: "55%",
    y: "25%",
    testimonial:
      "La mejor ruta cultural. Me encantó cómo la app promueve negocios locales.",
    author: "Ana Gómez",
    rating: 4,
    userImage: "https://i.pravatar.cc/150?u=ana",
  },
  {
    id: "coatepec",
    name: "Coatepec",
    x: "60%",
    y: "35%",
    testimonial:
      "Magia pura. Encontramos fincas hermosas gracias a la recomendación inteligente.",
    author: "Luis Fernando",
    rating: 5,
    userImage: "https://i.pravatar.cc/150?u=luis",
  },
  {
    id: "huatusco",
    name: "Huatusco",
    x: "48%",
    y: "42%",
    testimonial: "Increíble gastronomía y trato local. ¡La app no se equivocó!",
    author: "Elena M.",
    rating: 5,
    userImage: "https://i.pravatar.cc/150?u=elena",
  },
];

export default function ImpactMap() {
  const [activeLoc, setActiveLoc] = useState(locations[0]);

  return (
    <section className="py-20 sm:py-32 bg-slate-950 relative overflow-hidden transition-colors duration-300">
      {/* Topographic Background pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q 25 25, 50 50 T 100 50' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3Cpath d='M0 60 Q 30 20, 60 60 T 100 60' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3Cpath d='M0 40 Q 20 30, 40 40 T 100 40' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: "300px 300px",
        }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="font-sans font-black text-4xl sm:text-5xl text-white mb-6 leading-tight">
            Descubre las <span className="text-[#a3d14f]">Altas Montañas</span>
          </h2>
          <p className="text-lg text-slate-300">
            Nuestros usuarios ya están explorando la región. Selecciona un punto
            interactivo para conocer sus experiencias.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Map Area */}
          <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square bg-slate-900/80 backdrop-blur-xl rounded-[40px] border border-slate-800 p-4 shadow-2xl">
            {/* The Pins */}
            {locations.map((loc) => {
              const isActive = activeLoc.id === loc.id;
              return (
                <button
                  key={loc.id}
                  onClick={() => setActiveLoc(loc)}
                  className={`absolute w-12 h-12 -ml-6 -mt-6 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none ${isActive ? "scale-125 z-20" : "scale-100 hover:scale-110 z-10"}`}
                  style={{ left: loc.x, top: loc.y }}
                  aria-label={`Ver testimonio en ${loc.name}`}
                >
                  <div
                    className={`absolute inset-0 rounded-full animate-ping opacity-75 ${isActive ? "bg-[#ff4d8d]" : "bg-[#a3d14f]"}`}
                  ></div>
                  <div
                    className={`relative flex items-center justify-center w-full h-full rounded-full shadow-xl transition-colors ${isActive ? "bg-[#ff4d8d]" : "bg-slate-800"}`}
                  >
                    <FaMapMarkerAlt
                      className={`text-xl ${isActive ? "text-white" : "text-[#a3d14f]"}`}
                    />
                  </div>

                  {/* Name Label */}
                  <span
                    className={`absolute top-full mt-2 font-bold text-sm bg-slate-900/90 text-[#a3d14f] px-3 py-1 rounded-full whitespace-nowrap backdrop-blur-sm border border-slate-700 transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`}
                  >
                    {loc.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Testimonial Card */}
          <div className="flex justify-center lg:justify-start lg:pl-10">
            <div className="w-full max-w-md relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeLoc.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-800"
                >
                  <FaQuoteLeft className="text-4xl text-slate-800 mb-6" />

                  <div className="flex gap-1 mb-6">
                    {[...Array(activeLoc.rating)].map((_, i) => (
                      <FaStar key={i} className="text-yellow-400 text-lg" />
                    ))}
                  </div>

                  <p className="text-xl sm:text-2xl font-medium text-slate-200 leading-relaxed mb-8">
                    "{activeLoc.testimonial}"
                  </p>

                  <div className="flex items-center gap-4 border-t border-slate-800 pt-6">
                    <img
                      src={activeLoc.userImage}
                      alt={activeLoc.author}
                      className="w-14 h-14 rounded-full object-cover shadow-inner"
                    />
                    <div>
                      <h4 className="font-bold text-white text-lg">
                        {activeLoc.author}
                      </h4>
                      <p className="text-[#a3d14f] font-semibold text-sm uppercase tracking-wider">
                        Experiencia en {activeLoc.name}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Decorative blobs behind the card */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#ff4d8d] rounded-full mix-blend-multiply filter blur-[60px] opacity-30 animate-blob"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#914ef5] rounded-full mix-blend-multiply filter blur-[60px] opacity-30 animate-blob animation-delay-2000"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
