import React from "react";
import { FaArrowRight } from "react-icons/fa";

export default function B2BBlock() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 transition-colors duration-300 relative">
      {/* Decorative gradient element */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#914ef5]/5 to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Heading */}
          <div className="text-center lg:text-left">
            <span className="inline-block py-1 px-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold tracking-widest uppercase mb-6">
              Para Comercios
            </span>
            <h2 className="font-sans font-black text-5xl sm:text-6xl md:text-7xl leading-[1.1] text-gray-900 dark:text-white">
              Solicita
              <br />
              <span className="text-[#914ef5]">una evaluación</span>
            </h2>
          </div>

          {/* Right Column - Description & CTA */}
          <div className="text-center lg:text-left lg:border-l-2 border-gray-100 dark:border-gray-800 lg:pl-16">
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-slate-300 leading-relaxed mb-10">
              Transforma tu negocio turístico. Únete a la red inteligente de las
              Altas Montañas y conecta directamente con viajeros que buscan
              exactamente lo que ofreces.
            </p>

            <a
              href="http://localhost:4321/" // Astro landing URL
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-[#914ef5] hover:bg-[#7a3cdb] text-white px-10 py-5 rounded-full font-bold text-xl shadow-xl shadow-[#914ef5]/30 transform hover:-translate-y-1 transition-all duration-300"
            >
              <span>Formar parte</span>
              <FaArrowRight className="text-lg" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
