import React from 'react'
import { motion } from 'framer-motion'
import smarturLogo from '../../assets/smartur_logo.png'
import ColorWheel from '../ui/ColorWheel'

export default function Navbar({
  scrolled,
  navLinks,
  user,
  handleStartExperience,
  showLoginModal,
  showRegisterModal,
  mobileMenuOpen,
  setMobileMenuOpen,
  scrollToSection,
}) {
  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 navbar-glass ${
        scrolled
          ? 'py-2 shadow-lg bg-gradient-to-r from-purple to-blue/95 backdrop-blur-md'
          : 'py-4 bg-gradient-to-br from-purple to-blue/90 backdrop-blur-md'
      }`}
      role="banner"
    >
      <div className="container mx-auto px-4 sm:px-6 flex justify-between items-center">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xl sm:text-2xl font-bold text-white flex items-center drop-shadow-lg font-sans tracking-wide"
        >
          <div className="flex items-center m-2 rounded-full bg-white p-2">
            <div>
              <ColorWheel className="h-16 w-16" />
            </div>
            <img
              src={smarturLogo}
              alt="Logo SMARTUR"
              className="h-20 w-20"
            />
          </div>
          <span className="bg-gradient-to-r from-orange to-pink text-white px-2 py-1 rounded mr-2 shadow-sm font-sans">
            SMARTUR
          </span>
        </motion.h1>

        {/* Menú desktop */}
        <nav className="hidden md:flex space-x-4 lg:space-x-6 items-center">
          {navLinks.map((item, index) => (
            <button
              key={index}
              onClick={() => scrollToSection(item.target)}
              className="text-white hover:text-yellow-300 transition-colors relative group px-2 py-1 rounded link-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-orange cursor-pointer nav-button font-sans tracking-wide"
              tabIndex={0}
            >
              {item.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-orange to-pink transition-all duration-300 group-hover:w-full"></span>
            </button>
          ))}
          <button
            onClick={handleStartExperience}
            className="ml-4 bg-gradient-to-r from-orange to-pink hover:from-pink hover:to-orange text-white font-bold py-2 px-4 rounded-full text-sm shadow-lg transition transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink font-sans"
          >
            {user ? 'Mi Experiencia' : 'Iniciar sesión'}
          </button>
        </nav>

        {/* Menú móvil */}
        <div className="md:hidden flex items-center">
          <button
            onClick={handleStartExperience}
            className="mr-4 bg-gradient-to-r from-orange to-pink hover:from-pink hover:to-orange text-white p-2 rounded-full shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-pink"
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
            className="text-white hover:text-yellow-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange"
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
          className="md:hidden bg-gradient-to-br from-purple to-blue/95 backdrop-blur-sm shadow-lg rounded-b-xl"
        >
          <div className="container mx-auto px-4 py-3 flex flex-col space-y-3">
            {navLinks.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  scrollToSection(item.target)
                  setMobileMenuOpen(false)
                }}
                className="text-white hover:text-yellow-300 py-2 transition-colors border-b border-white/10 rounded link-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-orange text-left cursor-pointer font-sans tracking-wide"
                tabIndex={0}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => {
                handleStartExperience()
                setMobileMenuOpen(false)
              }}
              className="mt-2 bg-gradient-to-r from-orange to-pink hover:from-pink hover:to-orange text-white font-bold py-2 px-4 rounded-full text-sm shadow transition w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-pink font-sans"
            >
              {user ? 'Mi Experiencia' : 'Iniciar sesión'}
            </button>
          </div>
        </motion.div>
      )}
    </header>
  )
} 