import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";

import paso1 from "../../assets/pasos/1paso.png";
import paso2 from "../../assets/pasos/2paso.png";
import paso3 from "../../assets/pasos/3paso.png";

export default function MockupCarousel() {
  const slides = [
    {
      id: 1,
      image: paso1,
      title: "Paso 1: Perfil de Gustos",
      description:
        "Cuéntanos qué te apasiona. SMARTUR analiza tus preferencias para entender exactamente qué tipo de experiencia buscas.",
      badgeColor: "bg-[#ff4d8d]",
      textColor: "text-[#ff4d8d]",
    },
    {
      id: 2,
      image: paso2,
      title: "Paso 2: Procesamiento Inteligente",
      description:
        "Nuestro algoritmo basado en Random Forest procesa miles de combinaciones para encontrar la ruta ideal que se adapte a ti y al entorno.",
      badgeColor: "bg-[#914ef5]",
      textColor: "text-[#914ef5]",
    },
    {
      id: 3,
      image: paso3,
      title: "Paso 3: Tu Ruta Generada",
      description:
        "¡Listo! Obtén un itinerario personalizado con destinos, actividades y recomendaciones que apoyan a la comunidad local.",
      badgeColor: "bg-[#a3d14f]",
      textColor: "text-[#a3d14f]",
    },
  ];

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900 transition-colors duration-300 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <span className="text-[#914ef5] font-bold tracking-widest uppercase text-sm mb-4 block">
            El Proceso Smart
          </span>
          <h2 className="font-sans font-black text-4xl sm:text-5xl text-gray-900 dark:text-white mb-6">
            Inteligencia en cada paso
          </h2>
          <p className="text-lg text-gray-600 dark:text-slate-300">
            Descubre cómo nuestra tecnología transforma tus preferencias en una
            experiencia turística sostenible y perfecta para ti.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-950 rounded-[40px] shadow-2xl p-6 sm:p-10 lg:p-16 max-w-5xl mx-auto border border-gray-100 dark:border-gray-800">
          <Swiper
            modules={[Autoplay, Pagination, Navigation, EffectFade]}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            spaceBetween={30}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true, dynamicBullets: true }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            loop={true}
            className="w-full !pb-12"
          >
            {slides.map((slide) => (
              <SwiperSlide key={slide.id}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                  {/* Mockup Column */}
                  <div className="flex justify-center order-2 lg:order-1 relative">
                    <div className="relative w-64 sm:w-80 h-auto">
                      {/* Decorative Blur */}
                      <div
                        className={`absolute inset-0 ${slide.badgeColor} blur-[80px] opacity-20 dark:opacity-30 rounded-full`}
                      ></div>
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-auto object-contain drop-shadow-2xl relative z-10"
                      />
                    </div>
                  </div>

                  {/* Text Column */}
                  <div className="text-center lg:text-left order-1 lg:order-2 px-4 lg:px-0">
                    <div
                      className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${slide.badgeColor} text-white font-bold text-xl mb-6 shadow-lg shadow-${slide.textColor}/30`}
                    >
                      {slide.id}
                    </div>
                    <h3
                      className={`font-sans font-bold text-3xl sm:text-4xl mb-4 ${slide.textColor}`}
                    >
                      {slide.title}
                    </h3>
                    <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                      {slide.description}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
