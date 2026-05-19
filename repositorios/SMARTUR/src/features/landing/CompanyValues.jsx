import React from "react";
import { useLanguage } from "../../contexts/LanguageContext";

const CompanyValuesGrid = () => {
  const { t } = useLanguage();

  const values = [
    { name: t("values.list.imparcialidad"), color: "orange" },
    { name: t("values.list.seguridad"), color: "green" },
    { name: t("values.list.equidad"), color: "blue" },
    { name: t("values.list.honestidad"), color: "purple" },
    { name: t("values.list.respeto"), color: "pink" },
    { name: t("values.list.responsabilidad"), color: "yellow" },
    { name: t("values.list.inclusion"), color: "teal" },
    { name: t("values.list.empatia"), color: "indigo" },
    { name: t("values.list.fidelidad"), color: "orange" },
    { name: t("values.list.etica"), color: "green" },
  ];

  const getColorClass = (color) => {
    const colorMap = {
      orange: "bg-orange text-white",
      green: "bg-green text-white",
      blue: "bg-blue text-white",
      purple: "bg-purple text-white",
      pink: "bg-pink text-white",
      yellow: "bg-yellow text-gray-800",
      teal: "bg-teal text-white",
      indigo: "bg-indigo text-white",
    };
    return colorMap[color] || "bg-gray-200 text-gray-800";
  };

  return (
    <section
      id="companyValues"
      className="py-16 px-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300"
    >
      <div className="max-w-6xl mx-auto">
        {/* Encabezado */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-sans text-gray-900 dark:text-white">
            {t("values.title1")}
            <span className="text-orange">{t("values.title2")}</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-slate-300 max-w-3xl mx-auto">
            {t("values.subtitle")}
          </p>
        </div>

        {/* Grid superior: Misión, Visión, Compromiso, Historia en 2x2 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Misión */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border-l-4 border-orange hover:shadow-lg transition-all duration-300 h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-3 font-sans text-orange">
              {t("values.mission.title")}
            </h2>
            <p className="text-gray-700 dark:text-slate-300 leading-relaxed flex-grow">
              {t("values.mission.text")}
            </p>
          </div>

          {/* Visión */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border-l-4 border-green hover:shadow-lg transition-all duration-300 h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-3 font-sans text-green">
              {t("values.vision.title")}
            </h2>
            <p className="text-gray-700 dark:text-slate-300 leading-relaxed flex-grow">
              {t("values.vision.text")}
            </p>
          </div>

          {/* Compromiso */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border-l-4 border-blue hover:shadow-lg transition-all duration-300 h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-3 font-sans text-blue">
              {t("values.commitment.title")}
            </h2>
            <p className="text-gray-700 dark:text-slate-300 leading-relaxed flex-grow">
              {t("values.commitment.text")}
            </p>
          </div>

          {/* Historia */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border-l-4 border-purple hover:shadow-lg transition-all duration-300 h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-3 font-sans text-purple">
              {t("values.history.title")}
            </h2>
            <p className="text-gray-700 dark:text-slate-300 leading-relaxed flex-grow">
              {t("values.history.text")}
            </p>
          </div>
        </div>

        {/* Sección de Valores con distribución aleatoria y efectos de desvanecimiento */}
        <div>
          <h2 className="text-3xl font-bold text-center mb-8 mt-12 font-sans text-gray-800 dark:text-white">
            {t("values.guide.title")}
          </h2>

          {/* Contenedor con valores moviéndose de derecha a izquierda */}
          <div className="relative w-full h-[400px] overflow-hidden">
            {/* Crear múltiples instancias de valores para más densidad */}
            {[...values, ...values.slice(0, 8)].map((value, index) => {
              // Mejor distribución de posiciones verticales para evitar colisiones
              // Usar una fórmula que distribuya mejor en el espacio disponible
              const totalItems = values.length + 8;
              const spacing = 85 / totalItems; // Espaciado base
              const basePosition = 5 + index * spacing;

              // Agregar variación aleatoria pero controlada para evitar colisiones
              const variation = ((index * 13.7) % 7) - 3; // Variación entre -3 y 3
              const randomTop = Math.max(
                5,
                Math.min(90, basePosition + variation),
              );
              const top = `${randomTop}%`;

              // Delay más variado y distribuido
              const baseDelay = index * 1.2;
              const delayVariation = ((index * 11.3) % 5) * 0.6;
              const delay = baseDelay + delayVariation;

              // Duración variada: entre 18-25 segundos
              const baseDuration = 18;
              const durationVariation = ((index * 7.1) % 4) * 1.8;
              const duration = baseDuration + durationVariation;

              return (
                <div
                  key={`value-${index}`}
                  className={`absolute px-4 py-2 rounded-full shadow-md text-sm font-medium ${getColorClass(
                    value.color,
                  )} value-slide`}
                  style={{
                    top: top,
                    left: "110%",
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                  }}
                >
                  {value.name}
                </div>
              );
            })}
          </div>

          <style>{`
            @keyframes slideLeft {
            0% {
                left: 110%;
                opacity: 0;
                transform: translateY(-50%) scale(0.8);
            }
            10% {
                opacity: 1;
                transform: translateY(-50%) scale(1);
            }
            85% {
                opacity: 1;
                transform: translateY(-50%) scale(1);
            }
            95% {
                opacity: 0.5;
                transform: translateY(-50%) scale(0.95);
            }
            100% {
                left: -10%;
                opacity: 0;
                transform: translateY(-50%) scale(0.8);
            }
            }
            
            .value-slide {
            animation: slideLeft linear infinite;
            transform: translateY(-50%);
            will-change: left, opacity, transform;
            white-space: nowrap;
            }
            
            .value-slide:hover {
            animation-play-state: paused;
            transform: translateY(-50%) scale(1.2) !important;
            opacity: 1 !important;
            z-index: 10;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3) !important;
            }
        `}</style>
        </div>
      </div>
    </section>
  );
};

export default CompanyValuesGrid;
