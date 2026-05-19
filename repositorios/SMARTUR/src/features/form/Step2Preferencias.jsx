// src/features/form/Step2Preferencias.jsx
import React, { useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  FaChevronRight,
  FaChevronLeft,
  FaTree,
  FaMountain,
  FaHiking,
  FaUtensils,
  FaLandmark,
  FaHome,
  FaBolt,
  FaSun,
  FaCloud,
  FaBuilding,
} from "react-icons/fa";

const tiposTurismoList = [
  { label: "Naturaleza", value: "naturaleza", icon: FaMountain },
  { label: "Aventura", value: "aventura", icon: FaHiking },
  { label: "Gastronómico", value: "gastronomico", icon: FaUtensils },
  { label: "Cultural", value: "cultural", icon: FaLandmark },
  { label: "Rural", value: "rural", icon: FaHome },
];

const actividadLevels = [
  { label: "Muy relajado", value: 1, icon: FaCloud },
  { label: "Relajado", value: 2, icon: FaSun },
  { label: "Moderado", value: 3, icon: FaTree },
  { label: "Activo", value: 4, icon: FaBolt },
  { label: "Muy activo", value: 5, icon: FaBolt },
];

const lugarOptions = [
  { label: "Aire libre", value: "aire", icon: FaSun },
  { label: "Cerrado", value: "cerrado", icon: FaBuilding },
  { label: "Indiferente", value: "indiferente", icon: FaTree },
];

const Step2Preferencias = ({ data = {}, onNext, onBack, onChange }) => {
  const containerRef = useRef(null);

  useGSAP(
    () => {
      gsap.from(containerRef.current.children, {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
      });
    },
    { scope: containerRef },
  );

  const [tiposTurismo, setTipos] = useState(data.tiposTurismo || []);
  const [actividad_level, setActividad] = useState(data.actividad_level ?? 3);
  const [preferencia_lugar, setPreferenciaLugar] = useState(
    data.preferencia_lugar || "indiferente",
  );

  const toggleTipo = (v) => {
    setTipos((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  };

  const handleNext = () => {
    if (!tiposTurismo.length) return;

    const payload = {
      tiposTurismo,
      actividad_level: Number(actividad_level),
      preferencia_lugar,
      pref_outdoor: preferencia_lugar === "aire",
    };

    onChange(payload);
    onNext();
  };

  return (
    <div className="step-content" data-step="2" ref={containerRef}>
      {/* Header */}
      <div className="step-header">
        <h2 className="step-title">Preferencias</h2>
        <p className="step-subtitle">
          Selecciona tus intereses para personalizar las recomendaciones
        </p>
      </div>

      {/* Tipos de turismo */}
      <div className="form-section">
        <label className="form-label">
          Tipos de turismo (elige al menos 1)
        </label>
        <div className="options-grid five-items">
          {tiposTurismoList.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => toggleTipo(t.value)}
              className={`option-card ${tiposTurismo.includes(t.value) ? "selected" : ""}`}
            >
              <div className="option-icon">
                <t.icon />
              </div>
              <div className="option-label">{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Nivel de actividad */}
      <div className="form-section">
        <label className="form-label">Nivel de actividad</label>
        <div className="options-grid five-items">
          {actividadLevels.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setActividad(level.value)}
              className={`option-card ${actividad_level === level.value ? "selected" : ""}`}
            >
              <div className="option-icon">
                <level.icon />
              </div>
              <div className="option-label">{level.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Preferencia de lugar */}
      <div className="form-section">
        <label className="form-label">Preferencia de lugar</label>
        <div className="options-grid three-items">
          {lugarOptions.map((lugar) => (
            <button
              key={lugar.value}
              type="button"
              onClick={() => setPreferenciaLugar(lugar.value)}
              className={`option-card ${preferencia_lugar === lugar.value ? "selected" : ""}`}
            >
              <div className="option-icon">
                <lugar.icon />
              </div>
              <div className="option-label">{lugar.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Navegación */}
      <div className="step-navigation">
        <button onClick={onBack} className="nav-button back-button">
          <FaChevronLeft />
          <span>Atrás</span>
        </button>
        <button
          onClick={handleNext}
          disabled={!tiposTurismo.length}
          className="nav-button next-button"
        >
          <span>Continuar</span>
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

export default Step2Preferencias;
