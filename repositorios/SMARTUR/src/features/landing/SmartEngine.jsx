import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BrainCircuit, Map, Leaf, Compass } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function SmartEngine() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const stepsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate title
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          },
        },
      );

      // Animate steps with clear sequence
      stepsRef.current.forEach((step, index) => {
        gsap.fromTo(
          step,
          { opacity: 0, x: -30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 60%",
            },
            delay: index * 0.2, // Stagger effect
          },
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const steps = [
    {
      id: "input",
      title: "1. Tu Perfil",
      desc: "Analizamos tus preferencias: aventura, relax, cultura o naturaleza.",
      icon: <Compass className="w-8 h-8 text-[#914ef5]" />,
      bgColor: "bg-[#914ef5]/10",
      borderColor: "border-[#914ef5]/30",
    },
    {
      id: "processing",
      title: "2. Motor Inteligente",
      desc: "El algoritmo cruza miles de datos hiperlocales en tiempo real.",
      icon: <BrainCircuit className="w-8 h-8 text-[#ff4d8d]" />,
      bgColor: "bg-[#ff4d8d]/10",
      borderColor: "border-[#ff4d8d]/30",
    },
    {
      id: "sustainability",
      title: "3. Filtro Verde",
      desc: "Priorizamos experiencias con impacto positivo en la comunidad.",
      icon: <Leaf className="w-8 h-8 text-[#a3d14f]" />,
      bgColor: "bg-[#a3d14f]/10",
      borderColor: "border-[#a3d14f]/30",
    },
    {
      id: "output",
      title: "4. Ruta Perfecta",
      desc: "Obtienes un itinerario único, listo para vivirse al máximo.",
      icon: <Map className="w-8 h-8 text-[#ff7d1f]" />,
      bgColor: "bg-[#ff7d1f]/10",
      borderColor: "border-[#ff7d1f]/30",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="py-24 sm:py-32 bg-white relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div ref={titleRef} className="text-center mb-16 md:mb-24">
          <p className="font-['Outfit'] font-bold uppercase tracking-widest text-[#914ef5] text-sm mb-3">
            Smart Routes
          </p>
          <h2 className="font-['Cal_Sans'] text-4xl sm:text-5xl lg:text-6xl text-slate-900 mb-6">
            Así funciona la
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#914ef5] to-[#ff4d8d]">
              {" "}
              magia
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-['Outfit']">
            Nuestro Motor Inteligente analiza variables complejas para
            simplificar tu experiencia de viaje.
          </p>
        </div>

        <div className="relative">
          {/* Animated Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-[50%] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-[#914ef5] via-[#ff4d8d] to-[#ff7d1f] opacity-20 -translate-y-1/2 -z-10" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div
                key={step.id}
                ref={(el) => (stepsRef.current[index] = el)}
                className="relative flex flex-col items-center text-center group"
              >
                <div
                  className={`
                    w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-6 
                    border-2 ${step.borderColor} ${step.bgColor} backdrop-blur-sm
                    transition-transform duration-500 group-hover:scale-110 group-hover:shadow-xl
                    bg-white
                  `}
                >
                  {step.icon}
                </div>

                <h3 className="font-['Cal_Sans'] text-2xl text-slate-900 mb-3">
                  {step.title}
                </h3>

                <p className="font-['Outfit'] text-slate-600 leading-relaxed px-4">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-[#914ef5] rounded-full mix-blend-multiply filter blur-[100px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-64 h-64 bg-[#ff4d8d] rounded-full mix-blend-multiply filter blur-[100px] opacity-10 pointer-events-none" />
    </section>
  );
}
