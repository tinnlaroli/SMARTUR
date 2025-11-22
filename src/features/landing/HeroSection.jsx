import React from 'react'
import { motion } from 'framer-motion'
import { FaMapMarkerAlt } from 'react-icons/fa'
import mockupVideo from '../../assets/mockup.mp4'
import iaIcon from '../../assets/iconsLogo/ia.png'
import leafIcon from '../../assets/iconsLogo/leaf.png'
import mountainIcon from '../../assets/iconsLogo/mountain.png'
import personIcon from '../../assets/iconsLogo/person.png'

export default function HeroSection({ handleStartExperience, scrollToSection }) {
  return (
    <section
      id="hero"
      className="relative bg-white min-h-screen flex flex-col justify-center pt-12 pb-12 sm:pt-16 sm:pb-16 px-4 sm:px-6 overflow-hidden"
      aria-label="Hero SMARTUR"
    >
      <div className="container mx-auto max-w-7xl flex-1 w-full px-2 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr,1fr] gap-8 lg:gap-12 items-center h-full">
          
          {/* Contenido de texto - Izquierda */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left space-y-8 max-w-3xl mx-auto lg:mx-0 relative z-10 mt-16 lg:mt-20"
          >
            {/* Título principal - Más grande */}
            <h1 className="text-4xl sm:text-5xl lg:text-[4.5rem] xl:text-[5.5rem] font-bold leading-tight tracking-tight">
              <span className="text-black">IA que </span>
              <span className="text-purple">guía</span>
              <span className="text-black">,</span>
              <br />
              <span className="text-blue">turismo</span>
              <span className="text-black"> que une.</span>
            </h1>

            {/* Subtítulo - Más grande */}
            <p className="text-xl sm:text-2xl lg:text-3xl text-black">
              La plataforma para experiencias{' '}
              <span className="text-orange font-semibold">reales.</span>
            </p>

            {/* Pregunta destacada */}
            <div className="flex justify-center">
              <button
                onClick={handleStartExperience}
                className="inline-flex items-center gap-3 bg-pink hover:bg-pink-dark text-white rounded-full px-8 py-4 shadow-lg text-xl font-semibold transition-all duration-200 transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink cursor-pointer"
              >
                <span>¿A dónde vamos?</span>
                <FaMapMarkerAlt className="text-2xl" />
              </button>
            </div>

            {/* Características con iconos - Mejor distribución */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-4 sm:pt-6 max-w-none">
              {/* PyMES apoyadas */}
              <div className="flex items-center gap-2 sm:gap-3 px-2">
                <img src={personIcon} alt="Person" className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" />
                <div className="border-l-2 border-pink pl-2 sm:pl-3">
                  <p className="text-pink font-bold text-sm sm:text-base uppercase tracking-wide">+100</p>
                  <p className="text-pink text-xs sm:text-sm leading-tight font-semibold">PyMES apoyadas</p>
                </div>
              </div>

              {/* Alineados con las ODS */}
              <div className="flex items-center gap-2 sm:gap-3 px-2">
                <img src={leafIcon} alt="Leaf" className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" />
                <div className="border-l-2 border-green pl-2 sm:pl-3">
                  <p className="text-green font-bold text-sm sm:text-base uppercase tracking-wide">Alineados</p>
                  <p className="text-green text-xs sm:text-sm leading-tight font-semibold">con las ODS</p>
                </div>
              </div>

              {/* Modelo Innovador */}
              <div className="flex items-center gap-2 sm:gap-3 px-2">
                <img src={iaIcon} alt="IA" className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" />
                <div className="border-l-2 border-purple pl-2 sm:pl-3">
                  <p className="text-purple font-bold text-sm sm:text-base uppercase tracking-wide">Modelo</p>
                  <p className="text-purple text-xs sm:text-sm leading-tight font-semibold">innovador</p>
                </div>
              </div>

              {/* Impulsando el turismo */}
              <div className="flex items-center gap-2 sm:gap-3 px-2">
                <img src={mountainIcon} alt="Mountain" className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" />
                <div className="border-l-2 border-orange pl-2 sm:pl-3">
                  <p className="text-orange font-bold text-sm sm:text-base uppercase tracking-wide">Impulsando</p>
                  <p className="text-orange text-xs sm:text-sm leading-tight font-semibold">
                    turismo montañas
                  </p>
                </div>
              </div>
            </div>

            {/* Botones de acción - Mejor espaciado */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 pt-6 sm:pt-8 max-w-2xl">
              <button
                onClick={() => scrollToSection('benefits')}
                className="flex-1 bg-white border-2 border-orange text-orange hover:bg-orange hover:text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-full text-base sm:text-lg shadow-md transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange flex items-center justify-center gap-2 sm:gap-3"
              >
                Conoce la región
                <FaMapMarkerAlt className="text-base sm:text-lg" />
              </button>
              <button
                onClick={handleStartExperience}
                className="flex-1 bg-white border-2 border-green text-green hover:bg-green hover:text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-full text-base sm:text-lg shadow-md transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-green flex items-center justify-center gap-2 sm:gap-3"
              >
                Sobre SMARTUR
                <FaMapMarkerAlt className="text-base sm:text-lg" />
              </button>
            </div>
          </motion.div>

          {/* Video mockup - Derecha */}
          {/* Video mockup - Derecha */}
          <motion.div
            initial={{ opacity: 0, x: 100, y: 100 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="absolute right-[-5%] bottom-0 w-[68%] lg:w-[60%] h-auto z-0 pointer-events-none"
          >
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain"
            >
              <source src={mockupVideo} type="video/mp4" />
            </video>
          </motion.div>

        </div>
      </div>

     {/* Indicador scroll */}
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center justify-center text-gray-400/80 pointer-events-none animate-[bounce_1.5s_ease_infinite] motion-safe:animate-[bounce_1.5s_ease_infinite]">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-70">
          <path
            d="M12 18L24 26L36 18"
            stroke="currentColor"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 28L24 36L36 28"
            stroke="currentColor"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.7"
          />
        </svg>
      </div>

    </section>
  )
}