import React from 'react'
import { motion } from 'framer-motion'
import { FaChevronDown } from 'react-icons/fa'

export default function HeroSection({ handleStartExperience, scrollToSection }) {
  return (
    <section
      id="hero"
      className="relative bg-gradient-to-br from-purple to-blue text-white pt-32 pb-20 sm:pt-40 sm:pb-32 px-4 sm:px-6 overflow-hidden shadow-lg rounded-b-3xl"
      aria-label="Hero SMARTUR"
    >
      <div className="absolute inset-0 bg-[url('assets/veracruz-hero.jpg')] bg-cover bg-center opacity-50 z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-purple/80 to-blue/60 z-0" />
      <div className="relative z-10 container mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-tight font-sans"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange via-orange-400 to-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]">
            Descubre Veracruz
          </span>
          <br />
          <span className="text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]">con inteligencia artificial</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto px-4 leading-relaxed font-sans text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
        >
          Recomendaciones personalizadas que transformarán tu experiencia turística en el estado más fascinante de México.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <button
            onClick={handleStartExperience}
            className="bg-gradient-to-r from-orange to-pink hover:from-pink hover:to-orange text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink font-sans"
          >
            Comenzar mi experiencia
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              scrollToSection('benefits')
            }}
            className="flex items-center justify-center gap-2 text-white hover:text-orange transition-colors link-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-orange cursor-pointer nav-button font-sans text-lg"
            tabIndex={0}
          >
            Conoce más <FaChevronDown className="animate-bounce" />
          </button>
        </motion.div>
      </div>
      <div className="absolute right-2 top-2 sm:right-16 sm:top-16 opacity-20 z-0 pointer-events-none select-none"></div>
    </section>
  )
} 