import React, { useEffect, useState } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import LoginModal from '../features/auth/LoginModal'
import SignUpModal from '../features/auth/SignUpModal'
import MultiStepFormModal from '../components/common/MultiStepFormModal'
import { useAuth } from '../features/auth/AuthContext.jsx'
import Navbar from '../components/layout/Navbar.jsx'
import HeroSection from '../features/landing/HeroSection'
import CompanyValues from '../features/landing/CompanyValues.jsx'
import TimelineSection from '../features/landing/TimelineSection'
import MissionVisionValuesSection from '../features/landing/MissionVisionValuesSection'
import ValidationSection from '../features/landing/ValidationSection'
import Steps from '../features/landing/Steps.jsx'
import Footer from '../components/layout/Footer'
import ForgotPasswordModal from '../features/auth/forgotPassword'
import bgPatron from '../assets/bgPatron.png';
import logoArriba from '../assets/logo_arriba.png';
import { FaMapMarkerAlt } from "react-icons/fa";

export default function Landing() {
    const [showLoginModal, setShowLoginModal] = useState(false)
    const [showRegisterModal, setShowRegisterModal] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const { showForgotPasswordModal, closeForgotPasswordModal } = useAuth()
    const { user, showFormModal, showMultiStepForm, hideMultiStepForm, logout } =
        useAuth()
    const [isStandalonePwa, setIsStandalonePwa] = useState(false)

    // Navigation links
    const navLinks = [
        { label: 'Inicio', target: 'hero', href: '#hero' },
        { label: 'Beneficios', target: 'benefits', href: '#benefits' },
        { label: '¿Cómo funciona?', target: 'funciona', href: '#funciona' },
        {
            label: 'Misión y Visión',
            target: 'mision-vision-valores',
            href: '#mision-vision-valores',
        },
        { label: 'Validación', target: 'validacion', href: '#validacion' },
        { label: 'Galería', target: 'fotos', href: '#fotos' }
    ]

    useEffect(() => {
        AOS.init({ duration: 1000, once: true })

        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Detectar si estamos en vista móvil (se usará la vista simplificada tipo app)
    useEffect(() => {
        const updateStandalone = () => {
            try {
                const isMobileWidth = window.innerWidth <= 768

                // Por ahora usamos solo el ancho de pantalla para asegurar
                // que en teléfono se vea la versión sencilla.
                setIsStandalonePwa(isMobileWidth)
            } catch {
                setIsStandalonePwa(false)
            }
        }

        updateStandalone()

        const handleResize = () => updateStandalone()
        window.addEventListener('resize', handleResize)

        let mq
        if (window.matchMedia) {
            mq = window.matchMedia('(display-mode: standalone)')
            if (mq.addEventListener) {
                mq.addEventListener('change', updateStandalone)
            } else if (mq.addListener) {
                mq.addListener(updateStandalone)
            }
        }

        return () => {
            window.removeEventListener('resize', handleResize)
            if (mq) {
                if (mq.removeEventListener) {
                    mq.removeEventListener('change', updateStandalone)
                } else if (mq.removeListener) {
                    mq.removeListener(updateStandalone)
                }
            }
        }
    }, [])

    useEffect(() => {
        if (showFormModal && showLoginModal) {
            setShowLoginModal(false)
        }
    }, [showFormModal, showLoginModal])

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId)
        if (element) {
            const headerOffset = 80 // Altura del header fijo
            const elementPosition =
                element.getBoundingClientRect().top + window.pageYOffset
            const offsetPosition = elementPosition - headerOffset

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
            })
        }
    }

    const handleStartExperience = () => {
        if (user) {
            showMultiStepForm()
        } else {
            setShowLoginModal(true)
        }
    }

    // este es el componente principal que se encarga de renderizar la vista completa para navegador normal y la vista simplificada tipo app para PWA instalada en móvil
    return (
        <div className="min-h-screen bg-white text-gray-800 font-sans scroll-smooth relative overflow-x-hidden">
            {/* Vista completa para navegador normal */}
            {!isStandalonePwa && (
                <div className="relative">
                    
                    {/* Overlay para mejor contraste */}
                    <div className="fixed inset-0 bg-black/10 z-0"></div>
    
                    {/* Contenido principal */}
                    <div className="relative z-10">
                        <Navbar
                            scrolled={scrolled}
                            navLinks={navLinks}
                            user={user}
                            handleStartExperience={handleStartExperience}
                            mobileMenuOpen={mobileMenuOpen}
                            setMobileMenuOpen={setMobileMenuOpen}
                            scrollToSection={scrollToSection}
                            logout={logout}
                            showLoginModal={showLoginModal}
                        />
    
                        <HeroSection
                            user={user}
                            handleStartExperience={handleStartExperience}
                            scrollToSection={scrollToSection}
                        />
    
                        <CompanyValues />
    
                        <Steps />
    
                        <ValidationSection />
    
                        <Footer
                            user={user}
                            handleStartExperience={handleStartExperience}
                            scrollToSection={scrollToSection}
                            navLinks={navLinks}
                        />
                    </div>
                </div>
            )}
    
            {/* Vista simplificada tipo app para PWA instalada en móvil */}
            {isStandalonePwa && (
                <div className="relative min-h-screen overflow-hidden flex flex-col">
                    {/* Fondo con patrón con ligero blur (anclado al contenedor para evitar zoom al hacer scroll en móvil) */}
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 blur-sm opacity-90"
                        style={{ backgroundImage: `url(${bgPatron})` }}
                    ></div>

                    {/* Contenido PWA */}
                    <div className="relative z-10 flex-1 flex flex-col items-center justify-between px-6 py-6">
                        {/* Navbar compacto para PWA */}
                        <div className="w-full max-w-sm flex items-center justify-between mb-3 text-white">
                            <span className="text-xs text-white/80 truncate pr-2">
                                {user ? (
                                    <>
                                        Bienvenido:{' '}
                                        <span className="font-semibold">
                                            {user.name || user.email}
                                        </span>
                                    </>
                                ) : (
                                    'Inicia tu experiencia SMARTUR'
                                )}
                            </span>
                            {user ? (
                                <button
                                    onClick={logout}
                                    className="text-xs font-semibold bg-white/10 border border-white/40 rounded-full px-3 py-1 hover:bg-white/20 transition-colors"
                                >
                                    Cerrar sesión
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowLoginModal(true)}
                                    className="text-xs font-semibold bg-white text-pink rounded-full px-3 py-1 shadow"
                                >
                                    Inicia sesión
                                </button>
                            )}
                        </div>

                        {/* Logo centrado en la parte superior, más pegado al cuadro blanco */}
                        <div className="flex items-center justify-center mb-2 mt-2">
                            <div className="w-64 h-64 bg-white rounded-full shadow-2xl flex items-center justify-center">
                                <img
                                    src={logoArriba}
                                    alt="SMARTUR Logo"
                                    className="w-56 h-56 object-contain drop-shadow-2xl"
                                />
                            </div>
                        </div>

                        {/* Tarjeta blanca con botones y frase descriptiva juntos */}
                        <div className="w-full max-w-sm mb-4 bg-white/95 rounded-3xl shadow-2xl px-5 py-5 space-y-4">
                            {/* Botones de navegación */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleStartExperience}
                                    className="w-full bg-pink hover:bg-pink-dark text-white font-bold py-3 px-6 rounded-full shadow-lg text-base flex items-center justify-between hover:shadow-xl hover:scale-105 transition-all duration-300"
                                >
                                    <span>¿A dónde vamos?</span>
                                    <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-pink">
                                        <FaMapMarkerAlt className="w-6 h-6" />
                                    </span>
                                </button>

                                <button
                                    onClick={() => scrollToSection('benefits')}
                                    className="w-full bg-orange hover:bg-orange/90 text-white font-bold py-3 px-6 rounded-full shadow-lg text-base flex items-center justify-between hover:shadow-xl hover:scale-105 transition-all duration-300"
                                >
                                    <span>Conoce la región</span>
                                    <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-orange">
                                        <FaMapMarkerAlt className="w-6 h-6" />
                                    </span>
                                </button>

                                <button
                                    onClick={() => scrollToSection('mision-vision-valores')}
                                    className="w-full bg-green hover:bg-green/90 text-white font-bold py-3 px-6 rounded-full shadow-lg text-base flex items-center justify-between hover:shadow-xl hover:scale-105 transition-all duration-300"
                                >
                                    <span>Sobre nosotros</span>
                                    <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-green">
                                        <FaMapMarkerAlt className="w-6 h-6" />
                                    </span>
                                </button>
                            </div>

                            {/* Texto dentro del mismo cuadro */}
                            <p className="text-xs text-gray-400 text-center max-w-xs mx-auto font-light leading-relaxed italic">
                                IA que <span className="text-purple font-semibold">guía</span>,{' '}
                                <span className="text-blue font-semibold">turismo</span> que une.
                            </p>
                        </div>

                        {/* Footer compacto para PWA */}
                        <div className="w-full max-w-sm mx-auto text-[10px] text-white/70 text-center pb-1">
                            &copy; {new Date().getFullYear()} SMARTUR
                        </div>
                    </div>
                </div>
            )}
    
            {/* MODALES */}
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
            {showFormModal && (
                <MultiStepFormModal onClose={hideMultiStepForm} />
            )}
        </div>
    )
}
