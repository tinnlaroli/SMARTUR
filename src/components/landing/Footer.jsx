import React from 'react'
import { FaFacebook, FaInstagram, FaEnvelope, FaXTwitter } from 'react-icons/fa6'
import smarturLogo from '../../assets/smartur_logo.png'

export default function Footer({ handleStartExperience, scrollToSection, navLinks }) {
  return (
    <footer className="bg-gradient-to-br from-purple to-blue text-white pt-12 pb-6 px-4 sm:px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <img
                src={smarturLogo}
                alt="Logo SMARTUR"
                className="h-8 w-8 inline-block mr-2 rounded-full bg-white shadow"
              />
              <span>SMARTUR</span>
            </h3>
            <p className="text-white/80">
              Plataforma inteligente de recomendación de servicios para el desarrollo turístico del estado de Veracruz.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Enlaces rápidos</h4>
            <ul className="space-y-2">
              {navLinks.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => scrollToSection(item.target)}
                    className="text-white/80 hover:text-orange transition-colors cursor-pointer text-left"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Contacto</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:smartur@utcv.edu.mx"
                  className="text-white/80 hover:text-orange transition-colors flex items-center"
                >
                  <FaEnvelope className="mr-2" /> smartur@utcv.edu.mx
                </a>
              </li>
              <li>
                <a
                  href="tel:+522281234567"
                  className="text-white/80 hover:text-orange transition-colors"
                >
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
              <a
                href="#"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <FaFacebook className="text-lg" />
              </a>
              <a
                href="https://www.instagram.com/smar_tur/"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <FaInstagram className="text-lg" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
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
          <p>
            © {new Date().getFullYear()} SMARTUR - Proyecto desarrollado por estudiantes de la Universidad Tecnológica del Centro de Veracruz
          </p>
        </div>
      </div>
      
    </footer>
  )
}
