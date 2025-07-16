import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import galardon from '../../assets/galardon.png'
import expNacional from '../../assets/exp_nacional.png'

function LogoCarousel() {
  const logos = [
    { src: galardon, alt: 'Galardón Turístico Veracruz' },
    { src: expNacional, alt: 'ExpoCiencias Nacional 2025' },
  ]
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % logos.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [logos.length])
  return (
    <div className="w-64 sm:w-80 h-44 sm:h-56 flex items-center justify-center relative">
      {logos.map((logo, i) => (
        <img
          key={logo.alt}
          src={logo.src}
          alt={logo.alt}
          className={`absolute left-0 top-0 w-full h-full object-contain transition-opacity duration-700 ${
            i === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
          style={{
            filter:
              i === 0
                ? 'drop-shadow(0 0 16px #ffe066)'
                : 'drop-shadow(0 0 8px #fff)',
          }}
        />
      ))}
    </div>
  )
}

export default function ValidationSection() {
  return (
    <section
      id="validacion"
      className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-br from-purple to-blue text-white relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10 bg-[url('assets/pattern-dots.svg')]"></div>
      <div className="container mx-auto relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-8 justify-center">
          {/* Carrusel de logos */}
          <LogoCarousel />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center md:text-left"
          >
            <div
              className="inline-block px-4 py-1 rounded-full mb-6 border border-yellow-400/60 relative overflow-hidden"
              style={{
                background:
                  'linear-gradient(90deg, #fffbe6 0%, #ffe066 50%, #fffbe6 100%)',
                boxShadow: '0 0 16px 2px #ffe066, 0 0 32px 8px #fffbe6',
              }}
            >
              <span className="text-sm font-semibold text-yellow-700 animate-gold-shine relative z-10">
                PROYECTO GANADOR
              </span>
              <span
                className="absolute inset-0 animate-gold-glow"
                style={{
                  background:
                    'linear-gradient(120deg, transparent 0%, #fffbe6 40%, #ffe066 60%, transparent 100%)',
                  opacity: 0.7,
                }}
              ></span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Impacto académico y social
            </h2>
            <div className="prose prose-lg mx-auto text-white/90">
              <p className="mb-4">
                <span className="font-semibold">
                  Plataforma inteligente de recomendación de servicios para el desarrollo turístico del estado de Veracruz
                </span>{' '}
                (SMARTUR) nació como proyecto ganador del Galardón Turístico "Mi Veracruz 2024", desarrollado por estudiantes de la Universidad Tecnológica del Centro de Veracruz.
              </p>
              <p className="mb-4">
                Nuestra propuesta "Manual de procedimientos para la implementación de un Chatbot a través de IA como estrategia de innovación en la industria hotelera de Veracruz" fue reconocida en la categoría{' '}
                <span className="font-semibold">
                  Propuesta de innovación implementada en la calidad del servicio
                </span>.
              </p>
              <p className="mb-4">
                <span className="font-semibold text-yellow-300">
                  Proyecto acreditado con pase a ExpoCiencias Nacional 2025, Tamaulipas.
                </span>
              </p>
              <p>
                Alineado al <span className="font-semibold">ODS 8</span> de la ONU, promovemos el crecimiento económico sostenible mediante la transformación digital del sector turístico veracruzano.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 