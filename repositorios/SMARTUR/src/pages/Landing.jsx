import React, { useEffect, useState, useCallback } from "react";
import SmartURLoader from "../components/ui/SmartURLoader";
import AOS from "aos";
import "aos/dist/aos.css";
import { FaTimes } from "react-icons/fa";
import LoginModal from "../features/auth/LoginModal";
import SignUpModal from "../features/auth/SignUpModal";
import MultiStepFormModal from "../components/common/MultiStepFormModal";
import { useAuth } from "../features/auth/AuthContext.jsx";
import FloatingNavbar from "../components/layout/FloatingNavbar.jsx";
import HeroSection from "../features/landing/HeroSection";
import TrustBar from "../features/landing/TrustBar";
import ValuePillars from "../features/landing/ValuePillars";
import ImpactMap from "../features/landing/ImpactMap";
import SmartEngine from "../features/landing/SmartEngine";
import Footer from "../components/layout/Footer";
import ForgotPasswordModal from "../features/auth/forgotPassword";
import CordobaMap from "../features/landing/CordobaMap";
import PwaHome from "../components/layout/PwaHome";
import bgPatron from "../assets/bgPatron.png";
import { useLanguage } from "../contexts/LanguageContext";
import logoArriba from "../assets/logo_arriba.png";

const pwaInfoCardsData = [
  {
    id: "company-values",
    title: "Nuestro ADN",
    highlight: "Valores SMARTUR",
    description:
      "Transparencia, innovación responsable y turismo regenerativo para que cada experiencia genere impacto positivo.",
    badgeColor: "text-purple bg-purple/10 border-purple/30",
  },
  {
    id: "pymes",
    title: "Impulso a PyMES",
    highlight: "Apoyo a MiPyMES",
    description:
      "Conectamos emprendimientos turísticos con viajeros listos para descubrir rutas genuinas.",
    badgeColor: "text-pink bg-pink/10 border-pink/30",
  },
  {
    id: "ods",
    title: "Alineados a las ODS",
    highlight: "Agenda 2030",
    description:
      "Cada recomendación prioriza proyectos con enfoque sostenible y comunidades cuidadas.",
    badgeColor: "text-green bg-green/10 border-green/30",
  },
];

export default function Landing() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const { showForgotPasswordModal, closeForgotPasswordModal } = useAuth();
  const {
    user,
    showFormModal,
    showMultiStepForm,
    hideMultiStepForm,
    logout,
    isGlobalLoading,
  } = useAuth();
  const [isStandalonePwa, setIsStandalonePwa] = useState(false);
  const [infoCards, setInfoCards] = useState(pwaInfoCardsData);
  const [focusedCard, setFocusedCard] = useState(null);
  const [showInfoCards, setShowInfoCards] = useState(false);
  const [showCordobaMap, setShowCordobaMap] = useState(false);
  const [loading, setLoading] = useState(true);

  const { t } = useLanguage();

  // Navigation links
  const navLinks = [
    { label: "Inicio", target: "hero", href: "#hero", external: false },
    {
      label: "¿Cómo funciona?",
      target: "smartEngine",
      href: "#smartEngine",
      external: false,
    },
    {
      label: "Validación",
      target: "trustBar",
      href: "#trustBar",
      external: false,
    },
    {
      label: "Sobre Nosotros",
      target: "_blank",
      href: "/about",
      external: true,
    },
    {
      label: "Lugares para visitar",
      target: "_blank",
      href: "/places",
      external: true,
    },
  ];

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.1, rootMargin: "-100px 0px -50% 0px" },
    );

    const sections = [
      "hero",
      "trustBar",
      "valuePillars",
      "smartEngine",
      "impactMap",
    ];
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  // Cambiar el título de la pestaña cuando el usuario se va de la página
  useEffect(() => {
    if (typeof document === "undefined") return;

    const originalTitle = document.title || "SMARTUR";

    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.title = "Te esperamos en SMARTUR";
      } else {
        document.title = originalTitle;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);
    window.addEventListener("blur", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
      window.removeEventListener("blur", handleVisibilityChange);
      document.title = originalTitle;
    };
  }, []);

  // Detectar si estamos en vista móvil (se usará la vista simplificada tipo app)
  useEffect(() => {
    const updateStandalone = () => {
      try {
        const isMobileWidth = window.innerWidth <= 768;

        // Por ahora usamos solo el ancho de pantalla para asegurar
        // que en teléfono se vea la versión sencilla.
        setIsStandalonePwa(isMobileWidth);
      } catch {
        setIsStandalonePwa(false);
      }
    };

    updateStandalone();

    const handleResize = () => updateStandalone();
    window.addEventListener("resize", handleResize);

    let mq;
    if (window.matchMedia) {
      mq = window.matchMedia("(display-mode: standalone)");
      if (mq.addEventListener) {
        mq.addEventListener("change", updateStandalone);
      } else if (mq.addListener) {
        mq.addListener(updateStandalone);
      }
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (mq) {
        if (mq.removeEventListener) {
          mq.removeEventListener("change", updateStandalone);
        } else if (mq.removeListener) {
          mq.removeListener(updateStandalone);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (showFormModal && showLoginModal) {
      setShowLoginModal(false);
    }
  }, [showFormModal, showLoginModal]);

  useEffect(() => {
    setInfoCards(pwaInfoCardsData);
    setFocusedCard(null);
    setShowInfoCards(false);
  }, [isStandalonePwa]);

  const scrollToSection = useCallback(
    (sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        const headerOffset = 80; // Altura del header fijo
        const elementPosition =
          element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });

        // Cerrar menú móvil si está abierto
        if (mobileMenuOpen) {
          setMobileMenuOpen(false);
        }
      }
    },
    [mobileMenuOpen],
  );

  const handleStartExperience = useCallback(() => {
    if (user) {
      showMultiStepForm();
    } else {
      setShowLoginModal(true);
    }
  }, [user, showMultiStepForm]);

  const openInfoCards = () => {
    setShowInfoCards(true);
    if (!infoCards.length) setInfoCards(pwaInfoCardsData);
  };

  const dismissCard = (id) => {
    setInfoCards((prev) => prev.filter((card) => card.id !== id));
  };

  const restoreCards = () => setInfoCards(pwaInfoCardsData);

  // Lock body scroll while loader is active
  useEffect(() => {
    document.body.style.overflow = loading || isGlobalLoading ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [loading, isGlobalLoading]);

  // este es el componente principal que se encarga de renderizar la vista completa para navegador normal y la vista simplificada tipo app para PWA instalada en móvil
  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans scroll-smooth relative">
      {loading && <SmartURLoader onFinished={() => setLoading(false)} />}
      {!loading && isGlobalLoading && <SmartURLoader key="global-loader" />}
      {/* Vista completa para navegador normal */}
      {!isStandalonePwa && (
        <div className="relative">
          {/* Overlay para mejor contraste */}
          <div
            className="fixed inset-0 bg-black/10 z-0"
            aria-hidden="true"
          ></div>

          {/* Contenido principal */}
          <main
            id="main-content"
            className="relative z-10 w-full overflow-x-hidden"
          >
            <FloatingNavbar
              scrolled={scrolled}
              navLinks={navLinks}
              handleStartExperience={handleStartExperience}
              scrollToSection={scrollToSection}
              activeSection={activeSection}
              user={user}
              logout={logout}
            />

            <HeroSection handleStartExperience={handleStartExperience} />

            <div id="trustBar">
              <TrustBar />
            </div>
            <div id="valuePillars">
              <ValuePillars />
            </div>
            <div id="smartEngine">
              <SmartEngine />
            </div>
            <div id="impactMap">
              <ImpactMap />
            </div>

            {/* Giant CTA Final */}
            <section className="py-24 sm:py-32 bg-slate-950 flex justify-center text-center px-4">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-4xl sm:text-6xl text-white font-['Cal_Sans'] mb-10 leading-tight">
                  ¿Listo para redescubrir las{" "}
                  <span className="text-[#a3d14f]">Altas Montañas</span>?
                </h2>
                <button
                  onClick={handleStartExperience}
                  className="bg-[#ff4d8d] hover:bg-[#e03a75] text-white px-10 py-5 rounded-full text-xl sm:text-2xl font-bold transition-all duration-300 shadow-[0_0_20px_rgba(255,77,141,0.4)] hover:shadow-[0_0_30px_rgba(255,77,141,0.6)] hover:scale-105"
                >
                  Comenzar mi aventura
                </button>
              </div>
            </section>

            {/* Sección de mapa de Córdoba - solo visible cuando se activa */}
            {showCordobaMap && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
                <button
                  onClick={() => setShowCordobaMap(false)}
                  className="fixed top-4 right-4 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors"
                  aria-label="Cerrar mapa"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <CordobaMap />
              </div>
            )}

            <Footer
              user={user}
              handleStartExperience={handleStartExperience}
              scrollToSection={scrollToSection}
              navLinks={navLinks}
            />
          </main>
        </div>
      )}

      {/* Vista simplificada tipo app para PWA instalada en móvil */}
      <PwaHome
        isStandalonePwa={isStandalonePwa}
        user={user}
        logout={logout}
        setShowLoginModal={setShowLoginModal}
        handleStartExperience={handleStartExperience}
        setShowCordobaMap={setShowCordobaMap}
        openInfoCards={openInfoCards}
        bgPatron={bgPatron}
        logoArriba={logoArriba}
      />

      {/* Modal informativo para cards en PWA */}
      {focusedCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center px-6 py-10">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 relative text-gray-900">
            <button
              onClick={() => setFocusedCard(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-semibold"
              aria-label="Cerrar detalle"
            >
              ✕
            </button>
            <span
              className={`inline-flex items-center text-[11px] font-semibold border px-3 py-1 rounded-full mb-4 ${focusedCard.badgeColor}`}
            >
              {focusedCard.highlight}
            </span>
            <h3 className="text-xl font-bold mb-3">{focusedCard.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {focusedCard.description}
            </p>
            <button
              onClick={() => setFocusedCard(null)}
              className="mt-6 w-full bg-pink text-white font-semibold py-3 rounded-full shadow hover:bg-pink-dark transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Overlay de cards informativos para PWA */}
      {showInfoCards && (
        <div className="fixed inset-0 z-[9980] bg-black/70 backdrop-blur-sm flex items-center justify-center px-5 py-10">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden relative flex flex-col">
            <button
              onClick={() => {
                setShowInfoCards(false);
                setFocusedCard(null);
              }}
              aria-label="Cerrar panel de información"
              className="absolute top-4 right-4 bg-white text-gray-600 hover:text-red-500 transition-all duration-300 shadow-md hover:shadow-lg rounded-full w-12 h-12 flex items-center justify-center border-0 hover:bg-red-50 hover:scale-105 z-10"
            >
              <FaTimes className="text-xl" />
            </button>
            <div className="flex items-start justify-between px-6 pt-6 pb-3 border-b border-gray-100">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink mb-1">
                  Sobre SMARTUR
                </p>
                <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                  Conoce nuestra esencia
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Toca una tarjeta para ver más detalle.
                </p>
              </div>
            </div>

            <div className="px-6 py-3 flex items-center justify-between text-[11px] text-gray-500">
              <span>
                {infoCards.length
                  ? "Desliza o toca una tarjeta"
                  : "Todas las tarjetas se han cerrado"}
              </span>
              {infoCards.length < pwaInfoCardsData.length && (
                <button
                  onClick={restoreCards}
                  className="text-pink font-semibold hover:underline"
                >
                  Restaurar
                </button>
              )}
            </div>

            <div className="px-6 pb-6 flex-1 overflow-y-auto space-y-4">
              {infoCards.length ? (
                infoCards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => setFocusedCard(card)}
                    className="relative bg-white rounded-2xl border border-gray-100 shadow-md px-4 py-4 cursor-pointer transition-transform duration-300 hover:-translate-y-1"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissCard(card.id);
                      }}
                      className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 text-xs font-semibold"
                      aria-label="Descartar tarjeta"
                    >
                      ✕
                    </button>
                    <span
                      className={`inline-flex items-center text-[11px] font-semibold border px-2.5 py-1 rounded-full mb-3 ${card.badgeColor}`}
                    >
                      {card.highlight}
                    </span>
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">
                      {card.title}
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-gray-400 py-10">
                  No hay tarjetas visibles. Usa “Restaurar” para mostrarlas de
                  nuevo.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALES - Renderizados fuera de las vistas para que funcionen en ambas */}
      {showForgotPasswordModal && (
        <ForgotPasswordModal onClose={closeForgotPasswordModal} />
      )}

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onShowRegister={() => setShowRegisterModal(true)}
        />
      )}
      {showRegisterModal && (
        <SignUpModal
          onClose={() => setShowRegisterModal(false)}
          onShowLogin={() => setShowLoginModal(true)}
        />
      )}
      {showFormModal && <MultiStepFormModal onClose={hideMultiStepForm} />}

      {/* Modal de mapa de Córdoba */}
      {showCordobaMap && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
          <button
            onClick={() => setShowCordobaMap(false)}
            className="fixed top-4 right-4 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors"
            aria-label="Cerrar mapa"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <CordobaMap />
        </div>
      )}
    </div>
  );
}
