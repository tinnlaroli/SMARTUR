import React from 'react'
import { motion } from 'framer-motion'
import smarturLogo from '../../assets/logo_costado.png'

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
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-white shadow-md border-b-4 border-blue ${
        scrolled ? 'py-2' : 'py-3'
      }`}
      role="banner"
    >
      <div className="container mx-auto px-4 sm:px-6 flex justify-between items-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center"
        >
          <img
            src={smarturLogo}
            alt="Logo SMARTUR"
            className="h-10 w-auto object-contain scale-[3] origin-center"
            style={{ transformOrigin: 'center' }}
          />
        </motion.div>

        {/* Menú desktop */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((item, index) => (
            <button
              key={index}
              onClick={() => scrollToSection(item.target)}
              className="text-gray-700 hover:text-pink transition-colors text-sm font-medium tracking-wide focus:outline-none focus-visible:ring-2 focus-visible:ring-pink cursor-pointer"
              tabIndex={0}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Botones de acción desktop */}
        <div className="hidden md:flex items-center space-x-3">
          <button
            onClick={showLoginModal}
            className="bg-pink hover:bg-pink-dark text-white font-medium py-2 px-6 rounded-full text-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink shadow-md"
          >
            Visita
          </button>
          <button
            onClick={handleStartExperience}
            className="bg-white hover:bg-gray-50 text-pink border-2 border-pink font-medium py-2 px-6 rounded-full text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink"
          >
            Inicia sesión
          </button>
        </div>

        {/* Menú móvil - botón hamburguesa */}
        <div className="md:hidden flex items-center space-x-2">
          <button
            onClick={showLoginModal}
            className="bg-pink hover:bg-pink-dark text-white p-2 rounded-full shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-pink"
            aria-label="Visita"
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-700 hover:text-pink transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink"
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
          className="md:hidden bg-white border-t border-gray-200 shadow-lg"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-3">
            {navLinks.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  scrollToSection(item.target)
                  setMobileMenuOpen(false)
                }}
                className="text-gray-700 hover:text-pink py-2 transition-colors border-b border-gray-100 text-left font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-pink cursor-pointer"
                tabIndex={0}
              >
                {item.label}
              </button>
            ))}
            <div className="flex flex-col space-y-2 pt-2">
              <button
                onClick={() => {
                  showLoginModal()
                  setMobileMenuOpen(false)
                }}
                className="bg-pink hover:bg-pink-dark text-white font-medium py-2 px-4 rounded-full text-sm shadow transition w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-pink"
              >
                Visita
              </button>
              <button
                onClick={() => {
                  handleStartExperience()
                  setMobileMenuOpen(false)
                }}
                className="bg-white hover:bg-gray-50 text-pink border-2 border-pink font-medium py-2 px-4 rounded-full text-sm transition w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-pink"
              >
                Inicia sesión
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </header>
  )
}