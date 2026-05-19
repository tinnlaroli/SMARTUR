import React, { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "¿SMARTUR es completamente gratuito para el turista?",
    answer:
      "Sí, usar la plataforma y obtener recomendaciones inteligentes es 100% gratuito para los viajeros. Nuestro objetivo principal es fomentar el turismo en la región de las Altas Montañas, conectando a turistas con negocios locales increíbles de manera accesible y gratuita.",
  },
  {
    question: "¿Cómo funciona la IA (Random Forest) en sus recomendaciones?",
    answer:
      "Al registrarte, completas un perfil con tus gustos y capacidades físicas. Nuestro modelo de predicción, basado en el algoritmo de Random Forest, evalúa múltiples variables y encuentra patrones que sugieren las rutas, destinos y negocios que mejor se alinean a tus intereses específicos, optimizando tu experiencia.",
  },
  {
    question: "¿Están seguros mis datos e información personal?",
    answer:
      "Absolutamente. La arquitectura de SMARTUR protege tu privacidad implementando estrictas políticas de roles y permisos con PostgreSQL. Toda tu información se mantiene encriptada y se consulta únicamente de manera anonimizada para enriquecer el modelo de IA.",
  },
  {
    question: "¿Qué municipios abarca actualmente la plataforma?",
    answer:
      "Nuestra cobertura inicial y modelo de análisis están centrados en la región de las Altas Montañas en el Estado de Veracruz, incluyendo zonas clave como Orizaba, Córdoba, Chocamán, Coscomatepec, Fortín, Huatusco, Xalapa, Coatepec y Xico, con planes futuros de expansión regional.",
  },
  {
    question:
      "Soy prestador de servicios turísticos, ¿puedo registrar mi negocio?",
    answer:
      "¡Claro que sí! Contamos con un portal dedicado (B2B) para que negocios y PyMES turísticas soliciten una evaluación o registro. Esto les permite ser parte de nuestra red inteligente y aparecer en las sugerencias automáticas generadas por nuestra Plataforma para los turistas.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 sm:py-28 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <span className="inline-block py-1 px-3 rounded-full bg-pink-100 dark:bg-pink-900/30 text-[#ff4d8d] text-sm font-bold tracking-widest uppercase mb-4">
            Resuelve tus dudas
          </span>
          <h2 className="font-sans font-black text-4xl sm:text-5xl text-gray-900 dark:text-white">
            Preguntas Frecuentes
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-white dark:bg-slate-950 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-6 sm:p-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-lg sm:text-xl text-left text-gray-900 dark:text-white pr-6">
                    {faq.question}
                  </span>
                  <div
                    className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-300 ${isOpen ? "bg-[#ff4d8d] text-white" : "bg-slate-100 dark:bg-slate-800 text-gray-400"}`}
                  >
                    <FaChevronDown
                      className={`transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
                    />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0 text-gray-600 dark:text-slate-300 text-lg leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
