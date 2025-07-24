import React, { useEffect, useState } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import LoginModal from '../components/LoginModal'
import SignUpModal from '../components/SignUpModal'
import MultiStepFormModal from '../components/MultiStepFormModal'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/landing/Navbar'
import HeroSection from '../components/landing/HeroSection'
import BenefitsSection from '../components/landing/BenefitsSection'
import TimelineSection from '../components/landing/TimelineSection'
import MissionVisionValuesSection from '../components/landing/MissionVisionValuesSection'
import ValidationSection from '../components/landing/ValidationSection'
import GallerySection from '../components/landing/GallerySection'
import Footer from '../components/landing/Footer'

export default function Landing() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, showFormModal, showMultiStepForm, hideMultiStepForm } = useAuth()

  // Navigation links
  const navLinks = [
    { label: 'Inicio', target: 'hero', href: '#hero' },
    { label: 'Beneficios', target: 'benefits', href: '#benefits' },
    { label: '¿Cómo funciona?', target: 'funciona', href: '#funciona' },
    { label: 'Misión y Visión', target: 'mision-vision-valores', href: '#mision-vision-valores' },
    { label: 'Validación', target: 'validacion', href: '#validacion' },
    { label: 'Galería', target: 'fotos', href: '#fotos' },
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
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
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
      
      <ValidationSection />
      
      <GallerySection />
      
      <Footer 
        user={user}
        handleStartExperience={handleStartExperience}
        scrollToSection={scrollToSection}
        navLinks={navLinks}
      />

      {/* MODALES */}
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
    </div>
  )
}
