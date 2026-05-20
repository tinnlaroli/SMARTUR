import React from "react";
import galardonImg from "../../assets/galardon.png";
import expocienciasImg from "../../assets/exp_nacional.png";
import utcvImg from "../../assets/utcv.png";
import tiImg from "../../assets/ti.png";

export default function TrustBar() {
  return (
    <section className="w-full bg-white dark:bg-slate-950 border-y border-gray-100 dark:border-gray-800 py-6 sm:py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 lg:gap-20">
          {/* Logo UTCV */}
          <div className="flex items-center justify-center grayscale opacity-40 hover:opacity-100 mix-blend-multiply dark:mix-blend-screen hover:grayscale-0 transition-all duration-300">
            <img
              src={utcvImg}
              alt="UTCV"
              className="h-12 sm:h-16 w-auto object-contain dark:invert"
            />
          </div>

          {/* Logo TI */}
          <div className="flex items-center justify-center grayscale opacity-40 hover:opacity-100 mix-blend-multiply dark:mix-blend-screen hover:grayscale-0 transition-all duration-300">
            <img
              src={tiImg}
              alt="Tecnologías de la Información"
              className="h-12 sm:h-16 w-auto object-contain dark:invert"
            />
          </div>

          {/* Galardón Turístico Mi Veracruz */}
          <div className="flex items-center justify-center grayscale opacity-40 hover:opacity-100 mix-blend-multiply dark:mix-blend-screen hover:grayscale-0 transition-all duration-300">
            <img
              src={galardonImg}
              alt="Galardón Turístico Mi Veracruz"
              className="h-12 sm:h-16 w-auto object-contain dark:invert"
            />
          </div>

          {/* Expociencias Nacional 2025 */}
          <div className="flex items-center justify-center grayscale opacity-40 hover:opacity-100 mix-blend-multiply dark:mix-blend-screen hover:grayscale-0 transition-all duration-300">
            <img
              src={expocienciasImg}
              alt="Expociencias Nacional 2025"
              className="h-12 sm:h-16 w-auto object-contain dark:invert"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
