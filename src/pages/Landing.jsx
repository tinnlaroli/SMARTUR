import React, { useEffect, useState } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import LoginModal from '../features/auth/LoginModal'
import SignUpModal from '../features/auth/SignUpModal'
import MultiStepFormModal from '../components/common/MultiStepFormModal'
import { useAuth } from '../features/auth/AuthContext.jsx'
import Navbar from '../components/layout/Navbar.jsx'
import HeroSection from '../features/landing/HeroSection'
import BenefitsSection from '../features/landing/BenefitsSection'
import TimelineSection from '../features/landing/TimelineSection'
import MissionVisionValuesSection from '../features/landing/MissionVisionValuesSection'
import ValidationSection from '../features/landing/ValidationSection'
import Steps from '../features/landing/Steps.jsx'
import Footer from '../components/layout/Footer'
import ForgotPasswordModal from '../features/auth/forgotPassword'

export default function Landing() {
    const [showLoginModal, setShowLoginModal] = useState(false)
    const [showRegisterModal, setShowRegisterModal] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const { showForgotPasswordModal, closeForgotPasswordModal } = useAuth()
    const { user, showFormModal, showMultiStepForm, hideMultiStepForm } =
        useAuth()

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

    return (
        <div className="min-h-screen bg-white text-gray-800 font-sans scroll-smooth relative overflow-x-hidden">
            <Navbar
                scrolled={scrolled}
                navLinks={navLinks}
                user={user}
                handleStartExperience={handleStartExperience}
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                scrollToSection={scrollToSection}
            />

            <HeroSection
                user={user}
                handleStartExperience={handleStartExperience}
                scrollToSection={scrollToSection}
            />

            <BenefitsSection />

            <TimelineSection />

            <MissionVisionValuesSection />

            <Steps />

            <ValidationSection />

            <Footer
                user={user}
                handleStartExperience={handleStartExperience}
                scrollToSection={scrollToSection}
                navLinks={navLinks}
            />

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
