import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";

const criterios = [
  {
    nombre: "INFRAESTRUCTURA",
    descripciones: [
      "Instalaciones limitadas, mobiliario básico, espacios reducidos menores a 1.5 metros por comensal según la normativa local.",
      "Instalaciones funcionales, mobiliario cómodo, distribución mínima adecuada de 1.5 metros por comensal.",
      "Ambientes confortables, decoración básica, mobiliario en buen estado.",
      "Diseño planeado, decoración coherente, espacios amplios y funcionales.",
      "Diseño de autor, materiales de alta calidad, innovación arquitectónica.",
    ],
  },
  {
    nombre: "ACCESIBILIDAD",
    descripciones: [
      "Sin facilidades para personas con discapacidad.",
      "Rampas improvisadas, acceso parcial.",
      "Adaptaciones parciales en baños y accesos.",
      "Accesos adecuados, señalización clara y adaptación integral.",
      "Accesibilidad total, señalética braille, personal capacitado.",
    ],
  },
  {
    nombre: "SERVICIO AL CLIENTE",
    descripciones: [
      "Personal sin capacitación, trato indiferente.",
      "Trato cortés, tiempos de espera largos.",
      "Personal capacitado, trato profesional.",
      "Atención personalizada, enfoque en experiencia.",
      "Servicio proactivo, manejo de quejas con excelencia.",
    ],
  },
  {
    nombre: "VARIEDAD EN CARTA/MENÚ",
    descripciones: [
      "Menú limitado, sin descripciones ni precios.",
      "Variedad básica, sin información detallada.",
      "Carta estructurada, ingredientes señalados.",
      "Carta extensa, incluye alérgenos, opciones especiales.",
      "Carta de autor, menús degustación, presentación destacada.",
    ],
  },
  {
    nombre: "CALIDAD GASTRONÓMICA",
    descripciones: [
      "Preparación básica, sin técnica.",
      "Platillos tradicionales, ejecución regular.",
      "Buen sabor, técnicas adecuadas.",
      "Alta calidad, ingredientes frescos.",
      "Alta cocina, creatividad culinaria, técnicas complejas.",
    ],
  },
  {
    nombre: "HIGIENE Y LIMPIEZA",
    descripciones: [
      "Deficiente, sin prácticas claras.",
      "Limpieza en áreas visibles.",
      "Higiene aceptable, aplicación de normas básicas.",
      "Cumplimiento de NOMs y monitoreo frecuente.",
      "Higiene impecable, certificaciones como Distintivo H.",
    ],
  },
  {
    nombre: "SANITARIOS",
    descripciones: [
      "Sucios, sin insumos.",
      "Limpios pero básicos.",
      "Adecuados, con lo necesario.",
      "Decorados, buena ventilación.",
      "De lujo, automatizados, ambientación cuidada.",
    ],
  },
  {
    nombre: "AMBIENTE Y DECORACIÓN",
    descripciones: [
      "Sin estilo definido, descuidado.",
      "Decoración genérica, poco mantenimiento.",
      "Estilo definido, iluminación adecuada.",
      "Decoración temática, control ambiental.",
      "Diseño de interiores profesional, experiencia multisensorial.",
    ],
  },
  {
    nombre: "AMBIENTACIÓN MUSICAL",
    descripciones: [
      "No hay música o es inapropiada.",
      "Música de fondo poco cuidada.",
      "Ambiental acorde, volumen moderado.",
      "Selección musical profesional.",
      "Ambientación envolvente, curaduría musical.",
    ],
  },
  {
    nombre: "GESTIÓN ADMINISTRATIVA",
    descripciones: [
      "Sin control de inventarios ni recursos.",
      "Gestión básica, errores frecuentes.",
      "Organizada, control parcial de procesos.",
      "Uso de sistemas administrativos, liderazgo.",
      "Gestión con software, indicadores, cultura organizacional.",
    ],
  },
  {
    nombre: "GESTIÓN DEL PERSONAL",
    descripciones: [
      "Alta rotación, sin capacitación.",
      "Contratación informal, escasa capacitación.",
      "Capacitación básica y tareas claras.",
      "Formación continua, motivación del personal.",
      "Clima laboral positivo, formación profesional.",
    ],
  },
  {
    nombre: "MANEJO DE RESIDUOS",
    descripciones: [
      "Sin separación ni gestión.",
      "Separación básica sin control.",
      "Separación correcta de residuos comunes.",
      "Gestión responsable, reciclaje.",
      "Política integral, cero desperdicio.",
    ],
  },
  {
    nombre: "USO DE PRODUCTOS LOCALES",
    descripciones: [
      "No utiliza productos locales.",
      "Uso ocasional de ingredientes locales.",
      "Integración parcial de insumos regionales.",
      "Predomina uso de productos locales.",
      "Uso exclusivo de insumos locales y sostenibles.",
    ],
  },
  {
    nombre: "DISTINTIVOS",
    descripciones: [
      "Sin opiniones o reconocimientos.",
      "Opiniones mixtas, clientela local.",
      "Reputación sólida, clientela constante.",
      "Reconocimientos estatales o gastronómicos.",
      "Premios nacionales o internacionales.",
    ],
  },
];

export default function ModalLineamientosRestaurantes({ onClose }) {
  const [puntajes, setPuntajes] = useState(Array(criterios.length).fill(null));

  const handleSelect = (criterioIndex, valor) => {
    const updated = [...puntajes];
    updated[criterioIndex] = valor;
    setPuntajes(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-xl relative p-8 space-y-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-xl">
          <FaTimes />
        </button>
        <h2 className="text-3xl font-bold text-purple text-center">Evaluación Restaurantera</h2>
        {criterios.map((criterio, index) => (
          <div key={index} className="border-t pt-6">
            <h3 className="text-xl font-semibold text-orange mb-4">{criterio.nombre}</h3>
            <div className="space-y-3">
              {criterio.descripciones.map((desc, i) => (
                <label
                  key={i}
                  className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                    puntajes[index] === i
                      ? "bg-orange text-white border-orange"
                      : "bg-gray-100 hover:bg-orange/10"
                  }`}
                >
                  <input
                    type="radio"
                    name={`criterio-${index}`}
                    className="mr-2"
                    checked={puntajes[index] === i}
                    onChange={() => handleSelect(index, i)}
                  />
                  <span className="text-sm">{desc}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        <div className="text-center pt-6">
          <button
            onClick={() => alert("Puntajes guardados: " + JSON.stringify(puntajes))}
            className="bg-purple hover:bg-purple/90 text-white font-bold py-3 px-6 rounded-full transition"
          >
            Guardar Evaluación
          </button>
        </div>
      </div>
    </div>
  );
}
