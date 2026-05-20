import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import leafIcon from "../../assets/iconsLogo/leaf.svg";
import mountainIcon from "../../assets/iconsLogo/mountain.svg";
import circuitIcon from "../../assets/iconsLogo/circuit.svg";
import personIcon from "../../assets/iconsLogo/person.svg";

export default function ValuePillars() {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  const pillars = [
    {
      id: "sostenibilidad",
      title: "Sostenibilidad",
      description:
        "Conectamos con áreas naturales protegidas priorizando el turismo regenerativo.",
      icon: leafIcon,
      color: "text-[#a3d14f]",
      bgClass: "bg-[#a3d14f]/10",
      borderColor: "border-[#a3d14f]/20",
      iconWidth: "w-10",
    },
    {
      id: "identidad",
      title: "Identidad",
      description:
        "Resaltamos la cultura y autenticidad del paisaje de las Altas Montañas.",
      icon: mountainIcon,
      color: "text-[#ff7d1f]",
      bgClass: "bg-[#ff7d1f]/10",
      borderColor: "border-[#ff7d1f]/20",
      iconWidth: "w-12",
    },
    {
      id: "inteligencia",
      title: "Inteligencia",
      description:
        "Algoritmos precisos que aprenden de ti para sugerir la experiencia perfecta.",
      icon: circuitIcon,
      color: "text-[#914ef5]",
      bgClass: "bg-[#914ef5]/10",
      borderColor: "border-[#914ef5]/20",
      iconWidth: "w-10",
    },
    {
      id: "comunidad",
      title: "Comunidad",
      description:
        "Impulso directo a la red de MiPyMEs locales y su economía circular.",
      icon: personIcon,
      color: "text-[#ff4d8d]",
      bgClass: "bg-[#ff4d8d]/10",
      borderColor: "border-[#ff4d8d]/20",
      iconWidth: "w-10",
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-slate-950 transition-colors duration-300 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {pillars.map((pillar, index) => (
            <div
              key={pillar.id}
              data-aos="fade-up"
              data-aos-delay={index * 150}
              className={`flex flex-col p-8 rounded-3xl border ${pillar.borderColor} ${pillar.bgClass} hover:-translate-y-2 transition-transform duration-300`}
            >
              <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
                <img
                  src={pillar.icon}
                  alt={pillar.title}
                  className={`${pillar.iconWidth} h-auto object-contain dark:opacity-90`}
                />
              </div>
              <h3
                className={`font-sans font-bold text-2xl mb-3 ${pillar.color}`}
              >
                {pillar.title}
              </h3>
              <p className="text-gray-700 dark:text-slate-300 font-medium leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
