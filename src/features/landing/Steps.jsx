import React, { useState, useEffect, useRef } from 'react';
import paso1 from '../../assets/pasos/1paso.png';
import paso2 from '../../assets/pasos/2paso.png';
import paso3 from '../../assets/pasos/3paso.png';
import arrowOrange from '../../assets/flechas/Group-2.svg';
import arrowPurple from '../../assets/flechas/Group-3.svg';
import arrowGreen from '../../assets/flechas/Group-1.svg';

const StepsFlow = () => {
const [activeSection, setActiveSection] = useState(0);
const [scrollDirection, setScrollDirection] = useState('down');
const sectionsRef = useRef([]);
const containerRef = useRef(null);
const lastScrollTop = useRef(0);

const steps = [
{
    title: "Accede",
    subtitle: "a nuestra plataforma",
    description: "Descarga la app y regístrate para empezar a explorar los tesoros escondidos de Las Altas Montañas.",
    image: paso1,
    accentColor: "text-orange-500",
    bgColor: "from-orange-50 via-orange-100/40 to-orange-50/30",
    arrowColor: "#f97316",
    arrowType: "right-down",
    arrowImage: arrowOrange,
},
{
    title: "Responde",
    subtitle: "sencillas preguntas",
    description: "Comparte tus gustos y te recomendaremos lo mejor de la comunidad.",
    image: paso2,
    accentColor: "text-purple-500",
    bgColor: "from-purple-50 via-purple-100/40 to-purple-50/30",
    arrowColor: "#a855f7",
    arrowType: "left-down",
    arrowImage: arrowPurple,
},
{
    title: "Vive",
    subtitle: "experiencias auténticas",
    description: "Conéctate con la cultura local y vive aventuras inolvidables y personalizadas.",
    image: paso3,
    accentColor: "text-green-500",
    bgColor: "from-green-50 via-green-100/40 to-green-50/30",
    arrowColor: "#22c55e",
    arrowType: "none",
    arrowImage: arrowGreen,
},
];

useEffect(() => {
const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const scrollPosition = container.scrollTop;
    const sectionHeight = container.clientHeight;
    const currentSection = Math.round(scrollPosition / sectionHeight);
    
    // Detectar dirección del scroll
    if (scrollPosition > lastScrollTop.current) {
    setScrollDirection('down');
    } else {
    setScrollDirection('up');
    }
    lastScrollTop.current = scrollPosition;

    setActiveSection(Math.min(currentSection, steps.length - 1));
};

const container = containerRef.current;
if (container) {
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
}
}, [steps.length]);

const scrollToNext = () => {
if (activeSection < steps.length - 1) {
    const container = containerRef.current;
    if (container) {
    container.scrollTo({
        top: (activeSection + 1) * container.clientHeight,
        behavior: "smooth",
    });
    }
}
};

const Arrow = ({ type, arrowImage, isActive, sectionIndex }) => {
if (type === "none") return null;

// Posiciones diferentes según la sección
const getPosition = () => {
    if (sectionIndex === 0) {
        // Primera sección: flecha desde abajo izquierda
        return "bottom-[-3%] left-[5%] md:left-[8%]";
    } else if (sectionIndex === 1) {
        // Segunda sección: flecha desde abajo izquierda
        return "bottom-[-3%] left-[3%] md:left-[5%]";
    }
    return "bottom-[-3%] right-[5%] md:right-[8%]";
};

return (
    <div
    className={`absolute ${getPosition()} 
        cursor-pointer z-30 transition-all duration-1000
        ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
    onClick={scrollToNext}
    >
    <img
        src={arrowImage}
        alt="Arrow"
        className="w-32 h-40 md:w-40 md:h-52 lg:w-48 lg:h-64 xl:w-56 xl:h-72 
        drop-shadow-lg animate-float"
        style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))" }}
    />
    </div>
);
};

return (
<div className="h-screen w-full overflow-hidden relative">
    <div
    ref={containerRef}
    className="h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
    <style>{`
        div::-webkit-scrollbar { display: none; }
        
        @keyframes dash {
        0% {
            stroke-dasharray: 0, 300;
        }
        50% {
            stroke-dasharray: 150, 150;
        }
        100% {
            stroke-dasharray: 300, 0;
        }
        }
        
        .animate-dash {
        stroke-dasharray: 300;
        animation: dash 3s ease-in-out infinite;
        }
        
        @keyframes slideInFromTop {
        from {
            opacity: 0;
            transform: translateY(-60px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
        }
        
        @keyframes slideInFromBottom {
        from {
            opacity: 0;
            transform: translateY(60px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
        }
        
        @keyframes slideInFromLeft {
        from {
            opacity: 0;
            transform: translateX(-60px) scale(0.9);
        }
        to {
            opacity: 1;
            transform: translateX(0) scale(1);
        }
        }
        
        @keyframes slideInFromRight {
        from {
            opacity: 0;
            transform: translateX(60px) scale(0.9);
        }
        to {
            opacity: 1;
            transform: translateX(0) scale(1);
        }
        }
        
        @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-15px) rotate(2deg); }
        }
        
        .animate-slide-top { 
            animation: slideInFromTop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; 
        }
        .animate-slide-bottom { 
            animation: slideInFromBottom 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; 
        }
        .animate-slide-left { 
            animation: slideInFromLeft 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; 
        }
        .animate-slide-right { 
            animation: slideInFromRight 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; 
        }
        .animate-float { 
            animation: float 4s ease-in-out infinite; 
        }
    `}</style>

    {steps.map((step, index) => (
        <section
        key={index}
        ref={(el) => (sectionsRef.current[index] = el)}
        className={`h-screen w-full snap-start flex items-center justify-center relative overflow-hidden
            bg-gradient-to-br ${step.bgColor} transition-all duration-700`}
        >
        <div className="max-w-[95rem] w-full h-full mx-auto px-6 md:px-12 lg:px-16 flex flex-col justify-center items-center relative">
            
            {/* Layout diferente según la sección */}
            {index === 0 ? (
                // Sección 1: Layout vertical - texto arriba, imagen centrada abajo
                <div className="w-full flex flex-col items-center gap-8 lg:gap-12">
                    {/* Texto centrado arriba */}
                    <div className={`w-full text-center z-10 transition-opacity duration-500 ${
                        activeSection === index ? 'animate-slide-top opacity-100' : 'opacity-0'
                    }`}>
                        <h1 className="font-black leading-[0.9] mb-6">
                        <span className={`block text-5xl sm:text-6xl md:text-7xl lg:text-[6.5rem] xl:text-[7.5rem] ${step.accentColor} drop-shadow-lg`}>
                            {step.title}
                        </span>
                        <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-[4.5rem] xl:text-[5.5rem] text-gray-900 mt-2">
                            {step.subtitle}
                        </span>
                        </h1>
                        
                        <p className="text-lg md:text-xl lg:text-2xl text-gray-800 font-medium leading-relaxed max-w-2xl mx-auto">
                        {step.description}
                        </p>
                    </div>

                    {/* Imagen centrada abajo */}
                    <div className={`w-full flex items-center justify-center relative transition-opacity duration-500 ${
                        activeSection === index ? 'animate-slide-bottom opacity-100' : 'opacity-0'
                    }`}>
                        <div className="relative animate-float">
                        <img
                            src={step.image}
                            alt={`${step.title} - Paso ${index + 1}`}
                            className="w-64 sm:w-80 md:w-[19rem] lg:w-[23rem] xl:w-[27rem] 2xl:w-[32rem] h-auto object-contain 
                            drop-shadow-2xl transform hover:scale-105 transition-transform duration-500"
                        />
                        </div>
                    </div>
                </div>
            ) : index === 1 ? (
                // Sección 2: Layout horizontal - texto izquierda, imagen derecha (inclinada)
                <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 xl:gap-20">
                    {/* Texto a la izquierda */}
                    <div className={`flex-1 lg:flex-[1.1] text-center lg:text-left z-10 transition-opacity duration-500 ${
                        activeSection === index ? 'animate-slide-left opacity-100' : 'opacity-0'
                    }`}>
                        <h1 className="font-black leading-[0.9] mb-6">
                        <span className={`block text-5xl sm:text-6xl md:text-7xl lg:text-[6.5rem] xl:text-[7.5rem] ${step.accentColor} drop-shadow-lg`}>
                            {step.title}
                        </span>
                        <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-[5.5rem] xl:text-[6.5rem] text-gray-900 mt-2">
                            {step.subtitle}
                        </span>
                        </h1>
                        
                        <p className="text-lg md:text-xl lg:text-2xl text-gray-800 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                        {step.description}
                        </p>
                    </div>

                    {/* Imagen a la derecha con rotación */}
                    <div className={`flex-1 lg:flex-[1.1] flex items-center justify-center lg:justify-end relative transition-opacity duration-500 ${
                        activeSection === index ? 'animate-slide-right opacity-100' : 'opacity-0'
                    }`}>
                        <div className="relative animate-float" style={{ transform: 'rotate(-8deg)' }}>
                        <img
                            src={step.image}
                            alt={`${step.title} - Paso ${index + 1}`}
                            className="w-72 sm:w-80 md:w-[24rem] lg:w-[32rem] xl:w-[38rem] 2xl:w-[44rem] h-auto object-contain 
                            drop-shadow-2xl transform hover:scale-105 transition-transform duration-500"
                        />
                        </div>
                    </div>
                </div>
            ) : (
                // Sección 3: Layout horizontal - imagen izquierda (inclinada), texto derecha
                <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 xl:gap-20">
                    {/* Imagen a la izquierda con rotación */}
                    <div className={`flex-1 lg:flex-[1.3] flex items-center justify-center lg:justify-start relative transition-opacity duration-500 ${
                        activeSection === index ? 'animate-slide-left opacity-100' : 'opacity-0'
                    }`}>
                        <div className="relative animate-float" style={{ transform: 'rotate(8deg)' }}>
                        <img
                            src={step.image}
                            alt={`${step.title} - Paso ${index + 1}`}
                            className="w-80 sm:w-96 md:w-[28rem] lg:w-[44rem] xl:w-[52rem] 2xl:w-[60rem] h-auto object-contain 
                            drop-shadow-2xl transform hover:scale-105 transition-transform duration-500"
                        />
                        </div>
                    </div>

                    {/* Texto a la derecha */}
                    <div className={`flex-1 lg:flex-[1.1] text-center lg:text-left z-10 transition-opacity duration-500 ${
                        activeSection === index ? 'animate-slide-right opacity-100' : 'opacity-0'
                    }`}>
                        <h1 className="font-black leading-[0.9] mb-6">
                        <span className={`block text-6xl sm:text-7xl md:text-8xl lg:text-[8rem] xl:text-[9rem] ${step.accentColor} drop-shadow-lg`}>
                            {step.title}
                        </span>
                        <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-[7rem] xl:text-[8rem] text-gray-900 mt-2">
                            {step.subtitle}
                        </span>
                        </h1>
                        
                        <p className="text-lg md:text-xl lg:text-2xl text-gray-800 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                        {step.description}
                        </p>
                    </div>
                </div>
            )}

            {/* Flecha animada conectando secciones */}
            <Arrow 
            type={step.arrowType} 
            arrowImage={step.arrowImage}
            isActive={activeSection === index}
            sectionIndex={index}
            />
        </div>

        {/* Indicadores de progreso mejorados */}
        <div className="absolute bottom-8 right-8 flex flex-col gap-5 z-40">
            {steps.map((_, idx) => {
            const isActive = activeSection === idx;
            const colors = [
                { bg: "bg-orange-500", ring: "ring-orange-400/60", shadow: "shadow-orange-500/50" },
                { bg: "bg-purple-500", ring: "ring-purple-400/60", shadow: "shadow-purple-500/50" },
                { bg: "bg-green-500", ring: "ring-green-400/60", shadow: "shadow-green-500/50" },
            ];
            const colorScheme = colors[idx];
            
            return (
                <button
                key={idx}
                onClick={() => {
                    const container = containerRef.current;
                    if (container) {
                    container.scrollTo({
                        top: idx * container.clientHeight,
                        behavior: "smooth",
                    });
                    }
                }}
                className={`relative rounded-full transition-all duration-300 
                    ${isActive 
                    ? `w-6 h-6 ${colorScheme.bg} ${colorScheme.ring} ring-4 ${colorScheme.shadow} shadow-lg scale-110` 
                    : 'w-4 h-4 bg-white/50 hover:bg-white/80 hover:scale-110 shadow-md'
                    }`}
                aria-label={`Ir al paso ${idx + 1}`}
                >
                {isActive && (
                    <span className="absolute inset-0 rounded-full animate-ping bg-white/60"></span>
                )}
                </button>
            );
            })}
        </div>
        </section>
    ))}
    </div>
</div>
);
};

export default StepsFlow;