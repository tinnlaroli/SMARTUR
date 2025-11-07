import React from 'react'
import { motion } from 'framer-motion'
import { FaMagic, FaMapMarkedAlt, FaCheckCircle, FaSmileBeam, FaClipboardList, FaUsers, FaMap } from 'react-icons/fa'

export default function MissionVisionValuesSection() {
  return (
    <section
      id="mision-vision-valores"
      className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-pink-50 to-white relative overflow-hidden"
    >
      <div className="container mx-auto relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl font-bold mb-12 text-center text-pink"
        >
          <span className="relative inline-block">
            <span className="relative z-10">Misión, Visión y Valores</span>
            <span
              className="absolute bottom-0 left-0 w-full h-3 bg-gradient-to-r from-orange to-pink -z-1 opacity-60"
              style={{ bottom: '5px' }}
            ></span>
          </span>
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
          {/* Misión */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-orange to-pink rounded-2xl shadow-lg border-2 border-orange p-8 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300"
          >
            <div className="bg-white rounded-full p-4 mb-4 shadow-lg border-2 border-orange flex items-center justify-center">
              <FaMagic className="text-3xl text-orange" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-orange">Misión</h3>
            <p className="text-white">
              Ofrecer una plataforma digital inteligente que conecte a los turistas con experiencias locales auténticas y personalizadas, promoviendo el consumo local y responsable mediante el uso de la inteligencia artificial; buscando fortalecer la economía de la comunidad receptora y brindando a los consumidores información clara, accesible y alineada a sus intereses.
            </p>
          </motion.div>
          {/* Visión */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-gradient-to-br from-purple to-blue rounded-2xl shadow-lg border-2 border-purple p-8 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300"
          >
            <div className="bg-white rounded-full p-4 mb-4 shadow-lg border-2 border-purple flex items-center justify-center">
              <FaMapMarkedAlt className="text-3xl text-purple" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-purple">Visión</h3>
            <p className="text-white">
              Ser la plataforma digital líder en recomendaciones turísticas personalizadas en la región de Las Altas Montañas, reconocida por su innovación tecnológica, impacto positivo en economías locales y su compromiso con un modelo de turismo sostenible e inclusivo.
            </p>
          </motion.div>
        </div>
        {/* Valores */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gradient-to-br from-pink to-orange rounded-2xl shadow-lg border-2 border-pink p-8"
        >
          <h3 className="text-xl font-bold mb-6 text-center text-white">Valores</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[
              { label: 'Responsabilidad', icon: <FaCheckCircle className="text-orange" />, border: 'border-orange' },
              { label: 'Empatía', icon: <FaSmileBeam className="text-pink" />, border: 'border-pink' },
              { label: 'Honestidad', icon: <FaClipboardList className="text-blue" />, border: 'border-blue' },
              { label: 'Respeto', icon: <FaUsers className="text-green" />, border: 'border-green' },
              { label: 'Seguridad', icon: <FaMap className="text-yellow" />, border: 'border-yellow' },
              { label: 'Ética', icon: <FaMagic className="text-purple" />, border: 'border-purple' },
              { label: 'Inclusión', icon: <FaUsers className="text-orange" />, border: 'border-orange' },
              { label: 'Imparcialidad', icon: <FaCheckCircle className="text-blue" />, border: 'border-blue' },
              { label: 'Equidad', icon: <FaClipboardList className="text-purple" />, border: 'border-purple' },
              { label: 'Fiabilidad', icon: <FaSmileBeam className="text-green" />, border: 'border-green' },
            ].map((valor, i) => (
              <div
                key={valor.label}
                className="flex flex-col items-center bg-white/10 rounded-xl shadow p-4 hover:shadow-lg transition-all duration-200 border border-white/20"
              >
                <div className={`mb-2 text-2xl bg-white rounded-full p-3 shadow-lg border-2 ${valor.border} flex items-center justify-center`}>
                  {valor.icon}
                </div>
                <span className="font-semibold text-white text-sm text-center">
                  {valor.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
} 