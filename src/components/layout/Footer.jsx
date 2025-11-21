import React, { useState } from 'react'
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaWhatsapp, FaTelegram } from 'react-icons/fa'
import smarturLogo from '../../assets/smartur_logo.png'
import expNacional from '../../assets/exp_nacional.png'
import galardon from '../../assets/galardon.png'

export default function Footer() {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    mensaje: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Datos del formulario:', formData)
    alert('Mensaje enviado. Nos pondremos en contacto contigo pronto.')
    setFormData({ nombre: '', correo: '', mensaje: '' })
  }

  return (
    <div className="w-full">
      {/* Sección de Contacto */}
      <section className="bg-white py-12 px-4 sm:px-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            {/* Sección izquierda - Formulario de contacto */}
            <div className="md:w-1/2">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Contacta con nosotros!</h2>
              <p className="text-gray-600 mb-6">
                ¿Eres un prestador de servicios turísticos de la región y quieres que encontremos la respuesta para cubrir tus necesidades en nuestra plataforma? ¿Tienes algún proyecto o idea que necesitas ayudar a desarrollar?
              </p>
              <p className="text-gray-600 mb-6">
                Déjanos tus datos a través del siguiente formulario y nos pondremos en contacto con algún buen colaborador.
              </p>
              
              <h3 className="text-xl font-bold mb-4 text-gray-800">Estamos listos para ayudarte!</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Nombre"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>
                
                <div>
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    placeholder="Correo"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>
                
                <div>
                  <textarea
                    name="mensaje"
                    value={formData.mensaje}
                    onChange={handleChange}
                    placeholder="Mensaje"
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="bg-pink-500 text-white px-6 py-2 rounded hover:bg-pink-600 transition-colors"
                >
                  Enviar
                </button>
              </form>
            </div>
            
            {/* Línea divisoria */}
            <div className="hidden md:block border-l border-gray-300 mx-4"></div>
            
            {/* Sección derecha - Información de contacto */}
            <div className="md:w-1/2">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Contacto:</h3>
              
              <div className="space-y-4 text-gray-700">
                <div className="flex items-center gap-3">
                  <FaPhone className="text-gray-500" />
                  <span>+33 2711710186</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <FaEnvelope className="text-gray-500" />
                  <span>email: info@gmail.com</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <FaMapMarkerAlt className="text-gray-500 mt-1" />
                  <div>
                    <p>A. L. Universidad 150</p>
                    <p>W.P.D. Castillo web, Tel.:</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer con diseño rosa y forma SVG */}
      <footer className="relative bg-pink-500 text-white w-full overflow-hidden">
        {/* Forma SVG decorativa en la parte superior */}
        <div className="absolute top-0 left-0 w-full transform -translate-y-1">
          <svg 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none" 
            className="w-full h-12 text-pink-500"
          >
            <path 
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
              opacity=".25" 
              className="fill-current"
            ></path>
            <path 
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
              opacity=".5" 
              className="fill-current"
            ></path>
            <path 
              d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
              className="fill-current"
            ></path>
          </svg>
        </div>

        <div className="container mx-auto py-8 px-4 sm:px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Lado izquierdo - Redes sociales y logos */}
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Iconos de redes sociales */}
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-lg"
                  aria-label="Facebook"
                >
                  <FaFacebook className="text-pink-500 text-xl" />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-lg"
                  aria-label="WhatsApp"
                >
                  <FaWhatsapp className="text-pink-500 text-xl" />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-lg"
                  aria-label="Telegram"
                >
                  <FaTelegram className="text-pink-500 text-xl" />
                </a>
              </div>

              {/* Logos */}
              <div className="flex items-center gap-4 flex-wrap justify-center">
                {/* Logo SMARTUR */}
                <img
                  src={smarturLogo}
                  alt="SMARTUR Logo"
                  className="h-12 w-auto object-contain bg-white p-2 rounded-lg shadow-lg"
                />

                {/* Logo ExpoCiencias */}
                <img
                  src={expNacional}
                  alt="ExpoCiencias Nacional 2025 Tamaulipas"
                  className="h-16 w-auto object-contain bg-white p-2 rounded-lg shadow-lg"
                />

                {/* Logo Galardón */}
                <img
                  src={galardon}
                  alt="Galardón Turístico Veracruz"
                  className="h-16 w-auto object-contain bg-white p-2 rounded-lg shadow-lg"
                />
              </div>
            </div>

            {/* Lado derecho - Información de contacto del footer */}
            <div className="text-center md:text-right">
              <h3 className="text-xl font-bold mb-4">Contacto:</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-center md:justify-end gap-2">
                  <FaPhone className="text-sm" />
                  <a href="tel:+522711730136" className="hover:underline">
                    +52 2711730136
                  </a>
                </div>
                <div className="flex items-center justify-center md:justify-end gap-2">
                  <FaEnvelope className="text-sm" />
                  <a href="mailto:smartur@gmail.com" className="hover:underline">
                    smartur@gmail.com
                  </a>
                </div>
                <div className="flex items-center justify-center md:justify-end gap-2">
                  <FaMapMarkerAlt className="text-sm" />
                  <span>Av. Universidad 350, 94910 Cuitláhuac, Ver.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Línea divisoria y copyright */}
          <div className="mt-8 pt-6 border-t border-pink-400 border-opacity-50">
            <div className="text-center text-pink-100">
              <p>&copy; {new Date().getFullYear()} SMARTUR. Todos los derechos reservados.</p>
            </div>
          </div>
        </div>

        {/* Forma SVG decorativa en la parte inferior */}
        <div className="absolute bottom-0 left-0 w-full transform translate-y-1 rotate-180">
          <svg 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none" 
            className="w-full h-12 text-pink-600"
          >
            <path 
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
              opacity=".25" 
              className="fill-current"
            ></path>
            <path 
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
              opacity=".5" 
              className="fill-current"
            ></path>
            <path 
              d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
              className="fill-current"
            ></path>
          </svg>
        </div>
      </footer>
    </div>
  )
}