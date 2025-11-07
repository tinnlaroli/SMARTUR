import React from 'react'
import { motion } from 'framer-motion'
import { FaClipboardList, FaCheckCircle, FaMap, FaSmileBeam } from 'react-icons/fa'

export default function TimelineSection() {
  return (
    <section
      id="funciona"
      className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-blue-50 to-white relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[url('assets/pattern.svg')] opacity-5 z-0"></div>
      <div className="container mx-auto relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl font-bold mb-16 text-center text-purple"
        >
          <span className="relative inline-block">
            <span className="relative z-10">¿Cómo funciona SMARTUR?</span>
            <span
              className="absolute bottom-0 left-0 w-full h-3 bg-gradient-to-r from-purple to-pink -z-1 opacity-60"
              style={{ bottom: '5px' }}
            ></span>
          </span>
        </motion.h2>
        <div className="relative">
          <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-purple to-orange transform -translate-y-1/2 z-0"></div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 sm:gap-4 relative z-10">
            {[
              {
                icon: <FaClipboardList className="text-3xl text-orange" />,
                text: 'Responde nuestro breve formulario de preferencias',
                step: '1',
                gradient: 'from-orange to-orange-dark',
              },
              {
                icon: <FaCheckCircle className="text-3xl text-green" />,
                text: 'Recibe recomendaciones personalizadas en segundos',
                step: '2',
                gradient: 'from-green to-blue',
              },
              {
                icon: <FaMap className="text-3xl text-blue" />,
                text: 'Explora opciones en nuestro mapa interactivo',
                step: '3',
                gradient: 'from-blue to-purple',
              },
              {
                icon: <FaSmileBeam className="text-3xl text-pink" />,
                text: 'Disfruta una experiencia turística única',
                step: '4',
                gradient: 'from-pink to-orange',
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-100 text-center hover:shadow-xl transition-all duration-300"
              >
                <div className="relative mb-4 flex flex-col items-center">
                  <div className={`w-16 h-16 bg-gradient-to-br ${step.gradient} rounded-full flex items-center justify-center mx-auto text-white text-xl font-bold shadow-lg mb-2`}>{step.step}</div>
                  <div className="bg-white rounded-full p-3 shadow-lg flex items-center justify-center -mt-8">
                    {step.icon}
                  </div>
                </div>
                <p className="text-gray-700 font-medium">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 