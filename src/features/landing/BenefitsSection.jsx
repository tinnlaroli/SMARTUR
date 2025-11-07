import React from 'react'
import { motion } from 'framer-motion'
import { FaMagic, FaMapMarkedAlt, FaUsers } from 'react-icons/fa'

export default function BenefitsSection() {
  return (
    <section
      id="benefits"
      className="relative py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-blue-50 to-white"
    >
      <div className="container mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl font-bold mb-12 text-center text-blue"
        >
          <span className="relative inline-block">
            <span className="relative z-10">Beneficios exclusivos</span>
            <span
              className="absolute bottom-0 left-0 w-full h-3 bg-gradient-to-r from-orange to-pink -z-1 opacity-60"
              style={{ bottom: '5px' }}
            ></span>
          </span>
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: <FaMagic className="text-4xl text-orange" />,
              title: 'Recomendaciones Inteligentes',
              desc: 'Nuestra IA analiza tus preferencias para sugerirte los mejores lugares, actividades y servicios que realmente disfrutarás.',
              gradient: 'from-orange to-orange-dark',
              border: 'border-orange',
              text: 'text-orange',
            },
            {
              icon: <FaMapMarkedAlt className="text-4xl text-green" />,
              title: 'Mapa Interactivo',
              desc: 'Explora destinos verificados con información en tiempo real, rutas optimizadas y puntos de interés cercanos.',
              gradient: 'from-green to-blue',
              border: 'border-green',
              text: 'text-green',
            },
            {
              icon: <FaUsers className="text-4xl text-purple" />,
              title: 'Turismo Sostenible',
              desc: 'Conectamos turistas con prestadores locales verificados, impulsando la economía de la región de manera responsable.',
              gradient: 'from-purple to-blue-dark',
              border: 'border-purple',
              text: 'text-purple',
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`bg-gradient-to-br ${item.gradient} p-8 rounded-2xl shadow-lg border-2 ${item.border} transition-all duration-300`}
            >
              <div className="flex justify-center mb-6">
                <div className="bg-white rounded-full p-4 shadow-lg flex items-center justify-center">
                  {item.icon}
                </div>
              </div>
              <h3 className={`text-xl font-bold mb-3 text-center ${item.text}`}>{item.title}</h3>
              <p className="text-white text-center">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 