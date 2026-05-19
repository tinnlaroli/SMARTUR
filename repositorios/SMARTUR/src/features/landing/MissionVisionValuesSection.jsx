import React from "react";
import { motion } from "framer-motion";
import {
  FaMagic,
  FaMapMarkedAlt,
  FaCheckCircle,
  FaSmileBeam,
  FaClipboardList,
  FaUsers,
  FaMap,
} from "react-icons/fa";

export default function MissionVisionValuesSection() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50 relative overflow-hidden">
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
              className="absolute bottom-0 left-0 w-full h-3 bg-pink -z-1 opacity-20"
              style={{ bottom: "5px" }}
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
            className="bg-white rounded-2xl shadow-lg border-2 border-orange p-8 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300"
          >
            <div className="bg-orange/10 rounded-full p-4 mb-4 flex items-center justify-center">
              <FaMagic className="text-3xl text-orange" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-orange">Misión</h3>
            <p className="text-gray-700">
              Ofrecer una plataforma digital inteligente que conecte a los
              turistas con experiencias locales auténticas y personalizadas,
              promoviendo el consumo local y responsable mediante el uso de la
              inteligencia artificial; buscando fortalecer la economía de la
              comunidad receptora y brindando a los consumidores información
              clara, accesible y alineada a sus intereses.
            </p>
          </motion.div>
          {/* Visión */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg border-2 border-purple p-8 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300"
          >
            <div className="bg-purple/10 rounded-full p-4 mb-4 flex items-center justify-center">
              <FaMapMarkedAlt className="text-3xl text-purple" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-purple">Visión</h3>
            <p className="text-gray-700">
              Ser la plataforma digital líder en recomendaciones turísticas
              personalizadas en la región de Las Altas Montañas, reconocida por
              su innovación tecnológica, impacto positivo en economías locales y
              su compromiso con un modelo de turismo sostenible e inclusivo.
            </p>
          </motion.div>
        </div>
        {/* Valores */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border-2 border-pink p-8"
        >
          <h3 className="text-xl font-bold mb-6 text-center text-purple">
            Valores
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[
              {
                label: "Responsabilidad",
                icon: <FaCheckCircle className="text-orange" />,
                border: "border-orange",
                bg: "bg-orange/5",
              },
              {
                label: "Empatía",
                icon: <FaSmileBeam className="text-pink" />,
                border: "border-pink",
                bg: "bg-pink/5",
              },
              {
                label: "Honestidad",
                icon: <FaClipboardList className="text-cyan" />,
                border: "border-cyan",
                bg: "bg-cyan/5",
              },
              {
                label: "Respeto",
                icon: <FaUsers className="text-green" />,
                border: "border-green",
                bg: "bg-green/5",
              },
              {
                label: "Seguridad",
                icon: <FaMap className="text-purple" />,
                border: "border-purple",
                bg: "bg-purple/5",
              },
              {
                label: "Ética",
                icon: <FaMagic className="text-orange" />,
                border: "border-orange",
                bg: "bg-orange/5",
              },
              {
                label: "Inclusión",
                icon: <FaUsers className="text-pink" />,
                border: "border-pink",
                bg: "bg-pink/5",
              },
              {
                label: "Imparcialidad",
                icon: <FaCheckCircle className="text-cyan" />,
                border: "border-cyan",
                bg: "bg-cyan/5",
              },
              {
                label: "Equidad",
                icon: <FaClipboardList className="text-green" />,
                border: "border-green",
                bg: "bg-green/5",
              },
              {
                label: "Fiabilidad",
                icon: <FaSmileBeam className="text-purple" />,
                border: "border-purple",
                bg: "bg-purple/5",
              },
            ].map((valor, i) => (
              <div
                key={valor.label}
                className={`flex flex-col items-center bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-200 border border-gray-100`}
              >
                <div
                  className={`mb-2 text-2xl ${valor.bg} rounded-full p-3 flex items-center justify-center`}
                >
                  {valor.icon}
                </div>
                <span className="font-semibold text-gray-700 text-sm text-center">
                  {valor.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
