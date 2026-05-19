// src/features/form/Step3Contexto.jsx
import React, { useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  FaChevronRight,
  FaChevronLeft,
  FaUser,
  FaHeart,
  FaUsers,
  FaUserFriends,
  FaBed,
  FaCar,
  FaUtensils,
  FaRoute,
} from "react-icons/fa";

const companyOptions = [
  { label: "Solo", value: "solo", icon: FaUser },
  { label: "Pareja", value: "pareja", icon: FaHeart },
  { label: "Familia", value: "familia", icon: FaUsers },
  { label: "Amigos", value: "amigos", icon: FaUserFriends },
];

const servicesList = [
  { label: "Hospedaje", value: "hospedaje", icon: FaBed },
  { label: "Transporte", value: "transporte", icon: FaCar },
  { label: "Alimentos", value: "alimentos", icon: FaUtensils },
  { label: "Tours", value: "tours", icon: FaRoute },
];

const Step3Contexto = ({ data = {}, onNext, onBack, onChange }) => {
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

  const [group_type, setGroupType] = useState(data.group_type || "");
  const [services, setServices] = useState(data.services || []);

  const toggleService = (v) => {
    setServices((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  };

  const handleNext = () => {
    if (!group_type) return;

    const payload = {
      group_type,
      services,
      needs_hotel: services.includes("hospedaje"),
      needs_transport: services.includes("transporte"),
      pref_food: services.includes("alimentos"),
      wants_tours: services.includes("tours"),
    };

    onChange(payload);
    onNext();
  };

  return (
    <div className="step-content" data-step="3" ref={containerRef}>
      {/* Header */}
      <div className="step-header">
        <h2 className="step-title">Contexto del Viaje</h2>
        <p className="step-subtitle">
          Cuéntanos sobre tu compañía y servicios preferidos
        </p>
      </div>

      {/* Viajas con */}
      <div className="form-section">
        <label className="form-label">Viajas con</label>
        <div className="options-grid four-items">
          {companyOptions.map((c) => (
            <button
              key={c.value}
              onClick={() => setGroupType(c.value)}
              type="button"
              className={`option-card ${group_type === c.value ? "selected" : ""}`}
            >
              <div className="option-icon">
                <c.icon />
              </div>
              <div className="option-label">{c.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Servicios */}
      <div className="form-section">
        <label className="form-label">Servicios que quieres incluir</label>
        <div className="options-grid four-items">
          {servicesList.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => toggleService(s.value)}
              className={`option-card ${services.includes(s.value) ? "selected" : ""}`}
            >
              <div className="option-icon">
                <s.icon />
              </div>
              <div className="option-label">{s.label}</div>
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
          disabled={!group_type}
          className="nav-button next-button"
        >
          <span>Continuar</span>
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

export default Step3Contexto;
