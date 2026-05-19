import React, { useState, useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLanguage } from "../../contexts/LanguageContext";
import paso1 from "../../assets/pasos/1paso.png";
import paso2 from "../../assets/pasos/2paso.png";
import paso3 from "../../assets/pasos/3paso.png";

gsap.registerPlugin(ScrollTrigger);

const StepsFlow = () => {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const containerRef = useRef(null);

  const steps = [
    {
      title: t("steps.1.title"),
      subtitle: t("steps.1.subtitle"),
      description: t("steps.1.desc"),
      image: paso1,
      accentColor: "text-orange-500",
      bgColor: "bg-white dark:bg-slate-900",
    },
    {
      title: t("steps.2.title"),
      subtitle: t("steps.2.subtitle"),
      description: t("steps.2.desc"),
      image: paso2,
      accentColor: "text-purple-500",
      bgColor: "bg-white dark:bg-slate-900",
    },
    {
      title: t("steps.3.title"),
      subtitle: t("steps.3.subtitle"),
      description: t("steps.3.desc"),
      image: paso3,
      accentColor: "text-green-500",
      bgColor: "bg-white dark:bg-slate-900",
    },
  ];

  const scrollToSection = useCallback(
    (targetIndex) => {
      const stepsSection = document.getElementById("steps");
      if (!stepsSection) return;

      const pinDistance = window.innerHeight * steps.length;
      const progress = targetIndex / (steps.length - 1);
      const targetScroll = stepsSection.offsetTop + pinDistance * progress;

      window.scrollTo({
        top: targetScroll,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    },
    [prefersReducedMotion, steps.length],
  );

  const scrollToNext = useCallback(() => {
    if (activeSection >= steps.length - 1) return;
    scrollToSection(activeSection + 1);
  }, [activeSection, scrollToSection, steps.length]);

  const scrollToPrevious = useCallback(() => {
    if (activeSection <= 0) return;
    scrollToSection(activeSection - 1);
  }, [activeSection, scrollToSection]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    let ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: () => `+=${window.innerHeight * steps.length}`,
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          const total = steps.length;
          const index = Math.min(Math.floor(self.progress * total), total - 1);
          setActiveSection(index);
        },
      });
    });
    return () => ctx.revert();
  }, [prefersReducedMotion, steps.length]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updatePreference);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(updatePreference);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", updatePreference);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(updatePreference);
      }
    };
  }, []);

  const currentStepLabel = String(activeSection + 1).padStart(2, "0");
  const totalStepsLabel = String(steps.length).padStart(2, "0");

  const getAnimationClass = (isActive, animationName) => {
    if (!isActive) return "opacity-0 scale-95 pointer-events-none";
    if (prefersReducedMotion || !animationName)
      return "opacity-100 scale-100 pointer-events-auto transition-all duration-500 delay-150";
    return `${animationName} opacity-100 scale-100 pointer-events-auto transition-all duration-500 delay-150`;
  };

  return (
    <div
      id="steps"
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300"
    >
      <style>{`
        @keyframes slideInFromTop {
          from { opacity: 0; transform: translateY(-60px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInFromBottom {
          from { opacity: 0; transform: translateY(60px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInFromLeft {
          from { opacity: 0; transform: translateX(-60px) scale(0.9); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(60px) scale(0.9); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        
        .animate-slide-top { animation: slideInFromTop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-slide-bottom { animation: slideInFromBottom 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-slide-left { animation: slideInFromLeft 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-slide-right { animation: slideInFromRight 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-float { animation: float 4s ease-in-out infinite; }
    `}</style>

      {steps.map((step, index) => (
        <section
          key={index}
          role="group"
          aria-label={`${t("steps.1.title")} ${index + 1}: ${step.title}`}
          className={`absolute inset-0 w-full flex items-center justify-center overflow-hidden transition-all duration-700
          ${activeSection === index ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none translate-y-8"}
          ${step.bgColor}`}
        >
          <div className="max-w-[95rem] w-full h-full mx-auto px-6 md:px-12 lg:px-16 flex flex-col justify-center items-center relative">
            {index === 0 ? (
              <div className="w-full flex flex-col items-center gap-8 lg:gap-12">
                <div
                  className={`w-full text-center z-10 transition-opacity duration-500 ${getAnimationClass(
                    activeSection === index,
                    "animate-slide-top",
                  )}`}
                >
                  <h1 className="font-black leading-[0.9] mb-6">
                    <span
                      className={`block text-[clamp(2.5rem,8vw,6.5rem)] ${step.accentColor} drop-shadow-lg`}
                    >
                      {step.title}
                    </span>
                    <span className="block text-[clamp(1.75rem,6vw,4.5rem)] text-gray-900 dark:text-white mt-2">
                      {step.subtitle}
                    </span>
                  </h1>

                  <p className="text-lg md:text-xl lg:text-2xl text-gray-800 dark:text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
                    {step.description}
                  </p>
                </div>

                <div
                  className={`absolute bottom-0 w-full flex items-end justify-center transition-opacity duration-500 ${getAnimationClass(
                    activeSection === index,
                    "animate-slide-bottom",
                  )}`}
                >
                  <div className="relative flex justify-center w-full">
                    <img
                      src={step.image}
                      alt={`${step.title} - Paso ${index + 1}`}
                      className={`w-40 sm:w-56 md:w-[14rem] lg:w-[16rem] xl:w-[20rem] 2xl:w-[24rem] h-auto object-contain drop-shadow-2xl translate-y-[10%] ${prefersReducedMotion ? "" : "hover:scale-105"}`}
                    />
                  </div>
                </div>
              </div>
            ) : index === 1 ? (
              <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 xl:gap-20">
                <div
                  className={`flex-1 lg:flex-[1.1] text-center lg:text-left z-10 transition-opacity duration-500 ${getAnimationClass(
                    activeSection === index,
                    "animate-slide-left",
                  )}`}
                >
                  <h1 className="font-black leading-[0.9] mb-6">
                    <span
                      className={`block text-[clamp(2.5rem,8vw,6.5rem)] ${step.accentColor} drop-shadow-lg`}
                    >
                      {step.title}
                    </span>
                    <span className="block text-[clamp(2rem,7vw,5.5rem)] text-gray-900 dark:text-white mt-2">
                      {step.subtitle}
                    </span>
                  </h1>

                  <p className="text-lg md:text-xl lg:text-2xl text-gray-800 dark:text-slate-300 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                    {step.description}
                  </p>
                </div>

                <div
                  className={`flex-1 lg:flex-[1.1] flex items-center justify-center lg:justify-end relative transition-opacity duration-500 ${getAnimationClass(
                    activeSection === index,
                    "animate-slide-right",
                  )}`}
                >
                  <div
                    className={`relative ${prefersReducedMotion ? "" : "animate-float"}`}
                    style={{ transform: "rotate(-8deg)" }}
                  >
                    <img
                      src={step.image}
                      alt={`${step.title} - Paso ${index + 1}`}
                      className={`w-56 sm:w-64 md:w-[18rem] lg:w-[22rem] xl:w-[26rem] 2xl:w-[30rem] h-auto object-contain drop-shadow-2xl transform transition-transform duration-500 ${prefersReducedMotion ? "" : "hover:scale-105"}`}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 xl:gap-20">
                <div
                  className={`flex-1 lg:flex-[1.3] flex items-center justify-center lg:justify-start relative transition-opacity duration-500 ${getAnimationClass(
                    activeSection === index,
                    "animate-slide-left",
                  )}`}
                >
                  <div
                    className={`relative ${prefersReducedMotion ? "" : "animate-float"}`}
                    style={{ transform: "rotate(8deg)" }}
                  >
                    <img
                      src={step.image}
                      alt={`${step.title} - Paso ${index + 1}`}
                      className={`w-56 sm:w-64 md:w-[18rem] lg:w-[22rem] xl:w-[26rem] 2xl:w-[30rem] h-auto object-contain drop-shadow-2xl transform transition-transform duration-500 ${prefersReducedMotion ? "" : "hover:scale-105"}`}
                    />
                  </div>
                </div>

                <div
                  className={`flex-1 lg:flex-[1.1] text-center lg:text-left z-10 transition-opacity duration-500 ${getAnimationClass(
                    activeSection === index,
                    "animate-slide-right",
                  )}`}
                >
                  <h1 className="font-black leading-[0.9] mb-6">
                    <span
                      className={`block text-[clamp(3rem,10vw,8rem)] ${step.accentColor} drop-shadow-lg`}
                    >
                      {step.title}
                    </span>
                    <span className="block text-[clamp(2.5rem,8vw,7rem)] text-gray-900 dark:text-white mt-2">
                      {step.subtitle}
                    </span>
                  </h1>

                  <p className="text-lg md:text-xl lg:text-2xl text-gray-800 dark:text-slate-300 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                    {step.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-8 right-8 z-40 flex flex-col items-end gap-4 text-right">
            <span
              className="rounded-full bg-white/80 dark:bg-slate-800/80 px-4 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-gray-700 dark:text-slate-300 shadow-sm"
              aria-live="polite"
            >
              {t("steps.stepLabel")} {currentStepLabel} / {totalStepsLabel}
            </span>
            <div className="flex flex-col gap-5">
              {steps.map((_, idx) => {
                const isActive = activeSection === idx;
                const colors = [
                  {
                    bg: "bg-orange-500",
                    ring: "ring-orange-400/60",
                    shadow: "shadow-orange-500/50",
                  },
                  {
                    bg: "bg-purple-500",
                    ring: "ring-purple-400/60",
                    shadow: "shadow-purple-500/50",
                  },
                  {
                    bg: "bg-green-500",
                    ring: "ring-green-400/60",
                    shadow: "shadow-green-500/50",
                  },
                ];
                const colorScheme = colors[idx];

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(idx);
                    }}
                    className={`relative rounded-full transition-all duration-300 
                  ${
                    isActive
                      ? `w-6 h-6 ${colorScheme.bg} ${colorScheme.ring} ring-4 ${colorScheme.shadow} shadow-lg scale-110`
                      : "w-4 h-4 bg-white/50 dark:bg-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-500/80 hover:scale-110 shadow-md"
                  }`}
                    aria-label={`${t("steps.1.title")} ${idx + 1}`}
                    aria-pressed={isActive}
                  >
                    {isActive && !prefersReducedMotion && (
                      <span className="absolute inset-0 rounded-full animate-ping bg-white/60"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export default StepsFlow;
