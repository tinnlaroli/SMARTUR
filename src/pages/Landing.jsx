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
import SignUpModal from '../components/SignUpModal'
import MultiStepFormModal from '../components/MultiStepFormModal'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import smarturLogo from '../assets/smartur_logo.png'
import galardon from '../assets/galardon.png'
import expNacional from '../assets/exp_nacional.png'
import TimelineDemo from '../components/timeline-demo'
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
  const { user, showFormModal, showMultiStepForm, hideMultiStepForm } =
    useAuth()

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

  const navLinks = [
    { label: 'Inicio', target: 'hero', href: '#hero' },
    { label: 'Beneficios', target: 'benefits', href: '#benefits' },
    { label: '¿Cómo funciona?', target: 'funciona', href: '#funciona' },
    { label: 'Validación', target: 'validacion', href: '#validacion' },
    { label: 'Galería', target: 'fotos', href: '#fotos' },
  ]

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const headerOffset = 80 // Altura del header fijo
      const elementPosition = element.offsetTop
      const offsetPosition = elementPosition - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

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
      <Navbar
        scrolled={scrolled}
        navLinks={navLinks}
        user={user}
        handleStartExperience={handleStartExperience}
        showLoginModal={showLoginModal}
        showRegisterModal={showRegisterModal}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        scrollToSection={scrollToSection}
      />
      <HeroSection handleStartExperience={handleStartExperience} scrollToSection={scrollToSection} />
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
      <BenefitsSection />
      <TimelineSection />
      <MissionVisionValuesSection />
      <ValidationSection />
      <GallerySection />
      <Footer handleStartExperience={handleStartExperience} scrollToSection={scrollToSection} navLinks={navLinks} />
    </div>
  )
}

// Componente LogoCarousel
function LogoCarousel() {
  const logos = [
    { src: galardon, alt: 'Galardón Turístico Veracruz' },
    { src: expNacional, alt: 'ExpoCiencias Nacional 2025' },
  ]
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % logos.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [logos.length])
  return (
    <div className="w-64 sm:w-80 h-44 sm:h-56 flex items-center justify-center relative">
      {logos.map((logo, i) => (
        <img
          key={logo.alt}
          src={logo.src}
          alt={logo.alt}
          className={`absolute left-0 top-0 w-full h-full object-contain transition-opacity duration-700 ${
            i === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
          style={{
            filter:
              i === 0
                ? 'drop-shadow(0 0 16px #ffe066)'
                : 'drop-shadow(0 0 8px #fff)',
          }}
        />
      ))}
    </div>
  )
}
