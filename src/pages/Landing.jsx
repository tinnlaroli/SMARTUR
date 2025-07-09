import React, { useEffect, useState } from 'react'
import {
  FaMapMarkedAlt,
  FaMagic,
  FaUsers,
  FaCheckCircle,
  FaClipboardList,
  FaMap,
  FaSmileBeam,
  FaChevronDown,
} from 'react-icons/fa'
import {
  FaFacebook,
  FaInstagram,
  FaEnvelope,
  FaXTwitter,
} from 'react-icons/fa6'
import AOS from 'aos'
import 'aos/dist/aos.css'
import LoginModal from '../components/LoginModal'
import RegisterModal from '../components/RegisterModal'
import MultiStepFormModal from '../components/MultiStepFormModal'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import smarturLogo from '../assets/smartur_logo.png'
import galardon from '../assets/galardon.png'
import expNacional from '../assets/exp_nacional.png'

export default function Landing() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, showFormModal, showMultiStepForm, hideMultiStepForm } = useAuth()

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Inicio', target: 'hero' },
    { label: 'Beneficios', target: 'benefits' },
    { label: '¿Cómo funciona?', target: 'funciona' },
    { label: 'Validación', target: 'validacion' },
    { label: 'Galería', target: 'fotos' },
  ];

  const handleStartExperience = () => {
    if (user) {
      // If user is logged in, show the form modal directly
      showMultiStepForm()
    } else {
      // If user is not logged in, just show login modal
      setShowLoginModal(true)
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans scroll-smooth relative overflow-x-hidden">
      {/* Navbar mejorada */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? 'py-2 shadow-lg bg-purple/95 backdrop-blur-md'
            : 'py-4 bg-gradient-to-br from-purple to-blue/90 backdrop-blur-md'
        }`}
        role="banner"
      >
        <div className="container mx-auto px-4 sm:px-6 flex justify-between items-center">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xl sm:text-2xl font-bold text-white flex items-center drop-shadow-lg"
          >
            <img
              src={smarturLogo}
              alt="Logo SMARTUR"
              className="h-10 w-10 mr-2 rounded-full bg-white shadow"
            />
            <span className="bg-white text-purple px-2 py-1 rounded mr-2 shadow-sm">
              SMARTUR
            </span>
          </motion.h1>
          
          {/* Menú desktop */}
          <nav className="hidden md:flex space-x-4 lg:space-x-6 items-center">
            {navLinks.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="text-white hover:text-orange transition-colors relative group px-2 py-1 rounded link-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                tabIndex={0}
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
            <button
              onClick={handleStartExperience}
              className="ml-4 bg-orange hover:bg-orange/90 text-white font-bold py-2 px-4 rounded-full text-sm shadow-lg transition transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange"
            >
              {user ? 'Mi Experiencia' : 'Iniciar sesión'}
            </button>
          </nav>
          
          {/* Menú móvil */}
          <div className="md:hidden flex items-center">
            <button
              onClick={handleStartExperience}
              className="mr-4 bg-orange text-white p-2 rounded-full shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-orange"
              aria-label="Iniciar sesión o experiencia"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white hover:text-orange transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange"
              aria-label="Abrir menú móvil"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    mobileMenuOpen
                      ? 'M6 18L18 6M6 6l12 12'
                      : 'M4 6h16M4 12h16M4 18h16'
                  }
                />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Menú móvil desplegable */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-purple/95 backdrop-blur-sm shadow-lg rounded-b-xl"
          >
            <div className="container mx-auto px-4 py-3 flex flex-col space-y-3">
              {navLinks.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="text-white hover:text-orange py-2 transition-colors border-b border-white/10 rounded link-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                  onClick={() => setMobileMenuOpen(false)}
                  tabIndex={0}
                >
                  {item.label}
                </a>
              ))}
              <button
                onClick={() => {
                  handleStartExperience()
                  setMobileMenuOpen(false)
                }}
                className="mt-2 bg-orange hover:bg-orange/90 text-white font-bold py-2 px-4 rounded-full text-sm shadow transition w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-orange"
              >
                {user ? 'Mi Experiencia' : 'Iniciar sesión'}
              </button>
            </div>
          </motion.div>
        )}
      </header>

      {/* HERO mejorado */}
      <section
        id="hero"
        className="relative bg-gradient-to-br from-purple to-blue text-white pt-32 pb-20 sm:pt-40 sm:pb-32 px-4 sm:px-6 overflow-hidden shadow-lg rounded-b-3xl"
        aria-label="Hero SMARTUR"
      >
        <div className="absolute inset-0 bg-[url('assets/veracruz-hero.jpg')] bg-cover bg-center opacity-20 z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-purple/80 to-blue/60 z-0" />
        
        {/* Elementos decorativos */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/10"
              style={{
                width: Math.random() * 100 + 50,
                height: Math.random() * 100 + 50,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, Math.random() * 100 - 50],
                x: [0, Math.random() * 100 - 50],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 container mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-tight drop-shadow-xl"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange to-yellow-400">
              Descubre Veracruz
            </span>
            <br />
            <span className="text-white">con inteligencia artificial</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto px-4 leading-relaxed"
          >
            Recomendaciones personalizadas que transformarán tu experiencia turística en el estado más fascinante de México.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <button
              onClick={handleStartExperience}
              className="bg-orange hover:bg-orange/90 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange"
            >
              Comenzar mi experiencia
            </button>
            <a
              href="#benefits"
              className="flex items-center justify-center gap-2 text-white hover:text-orange transition-colors link-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-orange"
              tabIndex={0}
            >
              Conoce más <FaChevronDown className="animate-bounce" />
            </a>
          </motion.div>
        </div>
        <div className="absolute right-2 top-2 sm:right-16 sm:top-16 opacity-20 z-0 pointer-events-none select-none">
        </div>
      </section>

      {/* CTA flotante mejorado */}
      <motion.button
        onClick={handleStartExperience}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 bg-orange text-white p-4 rounded-full shadow-xl z-40 flex items-center justify-center"
        style={{ boxShadow: '0 4px 20px rgba(255, 140, 0, 0.5)' }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span className="ml-2 hidden sm:inline">Comenzar</span>
      </motion.button>

      {/* MODALES */}
      {showLoginModal && (
        <LoginModal 
          onClose={() => setShowLoginModal(false)} 
          onShowRegister={() => setShowRegisterModal(true)}
        />
      )}
      {showRegisterModal && (
        <RegisterModal 
          onClose={() => setShowRegisterModal(false)} 
          onShowLogin={() => setShowLoginModal(true)}
        />
      )}
      {showFormModal && (
        <MultiStepFormModal onClose={hideMultiStepForm} />
      )}

      {/* BENEFICIOS mejorados */}
      <section id="benefits" className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-bold mb-12 text-center"
          >
            <span className="relative inline-block">
              <span className="relative z-10">Beneficios exclusivos</span>
              <span className="absolute bottom-0 left-0 w-full h-3 bg-orange/30 -z-1" style={{ bottom: '5px' }}></span>
            </span>
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <FaMagic className="text-5xl" />,
                title: "Recomendaciones Inteligentes",
                desc: "Nuestra IA analiza tus preferencias para sugerirte los mejores lugares, actividades y servicios que realmente disfrutarás.",
                color: "from-orange/10 to-orange/5"
              },
              {
                icon: <FaMapMarkedAlt className="text-5xl" />,
                title: "Mapa Interactivo",
                desc: "Explora destinos verificados con información en tiempo real, rutas optimizadas y puntos de interés cercanos.",
                color: "from-green/10 to-green/5"
              },
              {
                icon: <FaUsers className="text-5xl" />,
                title: "Turismo Sostenible",
                desc: "Conectamos turistas con prestadores locales verificados, impulsando la economía de la región de manera responsable.",
                color: "from-purple/10 to-purple/5"
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`bg-gradient-to-br ${item.color} p-8 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300`}
              >
                <div className="text-orange mb-6 flex justify-center">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-center">{item.title}</h3>
                <p className="text-gray-600 text-center">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNCIONAMIENTO mejorado */}
      <section id="funciona" className="py-16 sm:py-24 px-4 sm:px-6 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('assets/pattern.svg')] opacity-5 z-0"></div>
        <div className="container mx-auto relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-bold mb-16 text-center"
          >
            <span className="relative inline-block">
              <span className="relative z-10">¿Cómo funciona SMARTUR?</span>
              <span className="absolute bottom-0 left-0 w-full h-3 bg-purple/30 -z-1" style={{ bottom: '5px' }}></span>
            </span>
          </motion.h2>
          
          <div className="relative">
            {/* Línea de tiempo */}
            <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-purple to-orange transform -translate-y-1/2 z-0"></div>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 sm:gap-4 relative z-10">
              {[
                { 
                  icon: <FaClipboardList className="text-4xl mx-auto" />, 
                  text: "Responde nuestro breve formulario de preferencias", 
                  step: "1" 
                },
                { 
                  icon: <FaCheckCircle className="text-4xl mx-auto" />, 
                  text: "Recibe recomendaciones personalizadas en segundos", 
                  step: "2" 
                },
                { 
                  icon: <FaMap className="text-4xl mx-auto" />, 
                  text: "Explora opciones en nuestro mapa interactivo", 
                  step: "3" 
                },
                { 
                  icon: <FaSmileBeam className="text-4xl mx-auto" />, 
                  text: "Disfruta una experiencia turística única", 
                  step: "4" 
                },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="bg-white p-6 rounded-xl shadow-md border border-gray-100 text-center hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple to-blue rounded-full flex items-center justify-center mx-auto text-white text-xl font-bold">
                      {step.step}
                    </div>
                    <div className="mt-4 text-purple">
                      {step.icon}
                    </div>
                  </div>
                  <p className="text-gray-700 font-medium">{step.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VALIDACIÓN mejorada */}
      <section id="validacion" className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-br from-purple to-blue text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('assets/pattern-dots.svg')]"></div>
        <div className="container mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8 justify-center">
            {/* Carrusel de logos */}
            <LogoCarousel />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto text-center md:text-left"
            >
              <div className="inline-block px-4 py-1 rounded-full mb-6 border border-yellow-400/60 relative overflow-hidden" style={{ background: 'linear-gradient(90deg, #fffbe6 0%, #ffe066 50%, #fffbe6 100%)', boxShadow: '0 0 16px 2px #ffe066, 0 0 32px 8px #fffbe6' }}>
                <span className="text-sm font-semibold text-yellow-700 animate-gold-shine relative z-10">PROYECTO GANADOR</span>
                <span className="absolute inset-0 animate-gold-glow" style={{ background: 'linear-gradient(120deg, transparent 0%, #fffbe6 40%, #ffe066 60%, transparent 100%)', opacity: 0.7 }}></span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Impacto académico y social</h2>
              <div className="prose prose-lg mx-auto text-white/90">
                <p className="mb-4">
                  <span className="font-semibold">Plataforma inteligente de recomendación de servicios para el desarrollo turístico del estado de Veracruz</span> (SMARTUR) nació como proyecto ganador del Galardón Turístico "Mi Veracruz 2024", desarrollado por estudiantes de la Universidad Tecnológica del Centro de Veracruz.
                </p>
                <p className="mb-4">
                  Nuestra propuesta "Manual de procedimientos para la implementación de un Chatbot a través de IA como estrategia de innovación en la industria hotelera de Veracruz" fue reconocida en la categoría <span className="font-semibold">Propuesta de innovación implementada en la calidad del servicio</span>.
                </p>
                <p className="mb-4">
                  <span className="font-semibold text-yellow-300">Proyecto acreditado con pase a ExpoCiencias Nacional 2025, Tamaulipas.</span>
                </p>
                <p>
                  Alineado al <span className="font-semibold">ODS 8</span> de la ONU, promovemos el crecimiento económico sostenible mediante la transformación digital del sector turístico veracruzano.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* GALERÍA mejorada */}
      <section id="fotos" className="py-16 sm:py-24 px-4 sm:px-6 bg-gray-50">
        <div className="container mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-bold mb-12 text-center"
          >
            <span className="relative inline-block">
              <span className="relative z-10">Nuestro equipo en acción</span>
              <span className="absolute bottom-0 left-0 w-full h-3 bg-orange/30 -z-1" style={{ bottom: '5px' }}></span>
            </span>
          </motion.h2>
          
          <div className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <motion.div
                  key={n}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: (n % 3) * 0.1 }}
                  className="group relative overflow-hidden rounded-xl shadow-lg"
                >
                  <img
                    src={`https://picsum.photos/800/600?random=${n}`}
                    alt={`Exposición ${n}`}
                    className="w-full h-64 sm:h-80 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div>
                      <h3 className="text-white font-bold text-lg">Evento {n}</h3>
                      <p className="text-white/80 text-sm">Presentación del proyecto SMARTUR</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER mejorado */}
      <footer className="bg-gradient-to-br from-purple to-blue text-white pt-12 pb-6 px-4 sm:px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <img src={smarturLogo} alt="Logo SMARTUR" className="h-8 w-8 inline-block mr-2 rounded-full bg-white shadow" />
                <span>SMARTUR</span>
              </h3>
              <p className="text-white/80">Plataforma inteligente de recomendación de servicios para el desarrollo turístico del estado de Veracruz.</p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Enlaces rápidos</h4>
              <ul className="space-y-2">
                {navLinks.map((item, index) => (
                  <li key={index}>
                    <a 
                      href={`#${item.target}`}
                      className="text-white/80 hover:text-orange transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contacto</h4>
              <ul className="space-y-2">
                <li>
                  <a href="mailto:smartur@utcv.edu.mx" className="text-white/80 hover:text-orange transition-colors flex items-center">
                    <FaEnvelope className="mr-2" /> smartur@utcv.edu.mx
                  </a>
                </li>
                <li>
                  <a href="tel:+522281234567" className="text-white/80 hover:text-orange transition-colors">
                    +52 228 123 4567
                  </a>
                </li>
                <li className="text-white/80">
                  UTCV, Avenida Universidad 350, 94910 Cuitláhuac, Ver.
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Síguenos</h4>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                  <FaFacebook className="text-lg" />
                </a>
                <a href="https://www.instagram.com/smar_tur/" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                  <FaInstagram className="text-lg" />
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                  <FaXTwitter className="text-lg" />
                </a>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={handleStartExperience}
                  className="bg-orange hover:bg-orange/90 text-white font-bold py-2 px-6 rounded-full text-sm shadow transition"
                >
                  Acceder a la plataforma
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-white/10 text-center text-sm text-white/60">
            <p>© {new Date().getFullYear()} SMARTUR - Proyecto desarrollado por estudiantes de la Universidad Tecnológica del Centro de Veracruz</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Componente LogoCarousel
function LogoCarousel() {
  const logos = [
    { src: galardon, alt: "Galardón Turístico Veracruz" },
    { src: expNacional, alt: "ExpoCiencias Nacional 2025" },
  ];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % logos.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [logos.length]);
  return (
    <div className="w-64 sm:w-80 h-44 sm:h-56 flex items-center justify-center relative">
      {logos.map((logo, i) => (
        <img
          key={logo.alt}
          src={logo.src}
          alt={logo.alt}
          className={`absolute left-0 top-0 w-full h-full object-contain transition-opacity duration-700 ${i === index ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          style={{ filter: i === 0 ? 'drop-shadow(0 0 16px #ffe066)' : 'drop-shadow(0 0 8px #fff)' }}
        />
      ))}
    </div>
  );
}