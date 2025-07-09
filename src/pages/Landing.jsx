// src/pages/Landing.jsx
import React, { useEffect, useState } from "react";
import { FaMapMarkedAlt, FaMagic, FaUsers, FaCheckCircle, FaClipboardList, FaMap, FaSmileBeam } from "react-icons/fa";
import { FaFacebook, FaInstagram, FaEnvelope } from "react-icons/fa";
import AOS from "aos";
import "aos/dist/aos.css";
import Modal from "../components/LoginModal"; // Este es tu componente modal de login

export default function Landing() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans scroll-smooth relative">
      {/* Navbar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 py-4 bg-gradient-to-br from-purple to-blue text-white">
        <h1 className="text-2xl font-bold">SMARTUR</h1>
        <nav className="space-x-6">
          <a href="#hero" className="hover:text-orange">Inicio</a>
          <a href="#benefits" className="hover:text-orange">Beneficios</a>
          <a href="#funciona" className="hover:text-orange">¿Cómo funciona?</a>
          <a href="#validacion" className="hover:text-orange">Validación</a>
          <a href="#fotos" className="hover:text-orange">Galería</a>
        </nav>
      </header>

      {/* HERO */}
      <section id="hero" className="relative bg-gradient-to-br from-purple to-blue text-white text-center py-32 px-6">
        <div className="absolute inset-0 bg-[url('assets/veracruz-hero.jpg')] bg-cover bg-center opacity-30 z-0" />
        <div className="relative z-10">
          <h1 className="text-5xl font-extrabold mb-4 drop-shadow">Tu próxima aventura comienza aquí</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Vive Veracruz como nunca antes. SMARTUR te guía con IA hacia lo mejor de tu entorno.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-orange hover:bg-orange/90 text-white font-bold py-3 px-8 rounded-full text-lg shadow transition"
            data-aos="zoom-in"
          >
            Comenzar mi experiencia
          </button>
        </div>
      </section>

      {/* CTA flotante */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 bg-orange text-white px-6 py-3 rounded-full shadow-md hover:bg-orange/90 z-40"
      >
        Comenzar mi experiencia
      </button>

      {/* MODAL LOGIN */}
      {showModal && <Modal onClose={() => setShowModal(false)} />}

      {/* BENEFICIOS */}
      <section id="benefits" className="py-20 px-6 bg-gray-50 text-center" data-aos="fade-up">
        <h2 className="text-3xl font-bold mb-12">¿Por qué SMARTUR?</h2>
        <div className="grid md:grid-cols-3 gap-8 justify-center">
          {[
            {
              icon: <FaMagic className="text-orange" />,
              title: "Recomendaciones Inteligentes",
              desc: "Basadas en tus gustos, no en anuncios.",
            },
            {
              icon: <FaMapMarkedAlt className="text-green" />,
              title: "Explora con Mapa",
              desc: "Visualiza destinos reales y validados.",
            },
            {
              icon: <FaUsers className="text-purple" />,
              title: "Impulsa lo Local",
              desc: "Conectamos turistas con prestadores verificados.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white text-black p-6 rounded-lg shadow-md"
              data-aos="fade-up"
              data-aos-delay={i * 100}
            >
              <div className="text-5xl mb-4 flex justify-center">{item.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FUNCIONAMIENTO */}
      <section id="funciona" className="py-16 px-6 bg-white text-center">
        <h2 className="text-3xl font-bold mb-10" data-aos="fade-up">¿Cómo funciona?</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { icon: <FaClipboardList className="text-pink text-4xl mx-auto mb-2" />, text: "Responde el formulario" },
            { icon: <FaCheckCircle className="text-orange text-4xl mx-auto mb-2" />, text: "Recibe tu recomendación" },
            { icon: <FaMap className="text-green text-4xl mx-auto mb-2" />, text: "Explora el mapa interactivo" },
            { icon: <FaSmileBeam className="text-purple text-4xl mx-auto mb-2" />, text: "Disfruta tu experiencia" },
          ].map((step, i) => (
            <div key={i} data-aos="fade-up" data-aos-delay={i * 100}>
              {step.icon}
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VALIDACIÓN */}
      <section id="validacion" className="py-20 px-6 bg-purple text-white text-center" data-aos="zoom-in">
        <h2 className="text-3xl font-bold mb-4">Proyecto con impacto académico y social</h2>
        <p className="max-w-2xl mx-auto text-lg">
          Inspirado por la convocatoria del Galardón Turístico “Mi Veracruz 2024”, SMARTUR es una plataforma desarrollada por estudiantes de la Universidad Tecnológica del Centro de Veracruz.
          Su proyecto, “Manual de procedimientos para la implementación de un Chatbot a través de IA como estrategia de innovación en la industria hotelera de Veracruz”, fue el proyecto ganador en la categoría Propuesta de innovación implementada en la calidad del servicio.
          Esta iniciativa, alineada al ODS 8, impulsa el crecimiento económico sostenible mediante la transformación digital del sector turístico.
        </p>
      </section>

      {/* CARRUSEL */}
      <section id="fotos" className="py-20 px-6 bg-white text-center" data-aos="fade-up">
        <h2 className="text-3xl font-bold mb-10">Exposiciones del equipo</h2>
        <div className="flex overflow-x-auto space-x-6 px-4 max-w-6xl mx-auto">
          {[1, 2, 3, 4, 5].map((n) => (
            <img
              key={n}
              src={`https://picsum.photos/800/500?random=${n}`}
              alt={`Exposición ${n}`}
              className="rounded-lg shadow-md w-[800px] h-[500px] object-cover flex-shrink-0"
            />
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-purple text-white py-6 px-4 text-center">
        <div className="flex justify-center space-x-6 text-xl mb-4">
          <a href="#" className="hover:text-orange"><FaFacebook /></a>
          <a href="#" className="hover:text-green"><FaInstagram /></a>
          <a href="mailto:smartur@utcv.edu.mx" className="hover:text-blue"><FaEnvelope /></a>
        </div>
        <p>¿Quieres colaborar o registrar tu servicio turístico? Contáctanos.</p>
        <p className="mt-2 text-sm">Equipo SMARTUR - UTCV © 2025</p>
      </footer>
    </div>
  );
}
