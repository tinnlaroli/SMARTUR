import React, { useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  FaChevronRight,
  FaWallet,
  FaDollarSign,
  FaStar,
  FaClock,
  FaCalendarWeek,
  FaCalendarAlt,
  FaSuitcase,
} from "react-icons/fa";

const edadOptions = [
  { label: "18-25", value: "18-25" },
  { label: "26-35", value: "26-35" },
  { label: "36-45", value: "36-45" },
  { label: "46-60", value: "46-60" },
  { label: "60+", value: "60+" },
];

const presupuestoOptions = [
  {
    label: "Económico",
    value: "low",
    range: "< $700/día",
    icon: FaWallet,
    daily: 500,
  },
  {
    label: "Moderado",
    value: "med",
    range: "$700 - $2,000/día",
    icon: FaDollarSign,
    daily: 1200,
  },
  {
    label: "Premium",
    value: "high",
    range: "> $2,000/día",
    icon: FaStar,
    daily: 3000,
  },
];

const duracionOptions = [
  { label: "1-2 días", value: "1-2", icon: FaClock }, // Viaje corto/express
  { label: "3-5 días", value: "3-5", icon: FaCalendarWeek }, // Fin de semana largo
  { label: "6-10 días", value: "6-10", icon: FaCalendarAlt }, // Semana completa
  { label: "10+ días", value: "10+", icon: FaSuitcase }, // Viaje largo/extendido
];

const edadRangeToApprox = (range) => {
  if (!range) return null;
  if (range === "60+") return 65;
  const [a, b] = range.split("-").map(Number);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((a + b) / 2);
};

const diasRangeToDays = (range) => {
  if (!range) return null;
  if (range === "10+") return 14;
  const [a, b] = range.split("-").map(Number);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((a + b) / 2);
};

const Step1PerfilBasico = ({ data = {}, onNext, onChange }) => {
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

  const [edad_range, setEdadRange] = useState(data.edad_range || "");
  const [presupuesto_bucket, setPresupuestoBucket] = useState(
    data.presupuesto_bucket || "",
  );
  const [duracion_dias_range, setDuracionDiasRange] = useState(
    data.duracion_dias_range || "",
  );

  const handleNext = () => {
    if (!edad_range || !presupuesto_bucket || !duracion_dias_range) return;

    const edad = edadRangeToApprox(edad_range);
    const duracion_dias = diasRangeToDays(duracion_dias_range);
    const selectedPresupuesto = presupuestoOptions.find(
      (p) => p.value === presupuesto_bucket,
    );
    const presupuesto_daily = selectedPresupuesto?.daily || 1200;

    onChange({
      edad,
      edad_range,
      presupuesto_daily,
      presupuesto_bucket,
      duracion_dias,
      duracion_dias_range,
    });

    onNext();
  };

  return (
    <div className="step-content" ref={containerRef}>
      {/* Header con título estilo imagen */}
      <div className="step-header">
        <h2 className="step-title">¿Qué te interesa?</h2>
        <p className="step-subtitle">Selecciona tus preferencias de viaje</p>
      </div>

      {/* Rango de edad */}
      <div className="form-section">
        <label className="form-label">Rango de edad</label>
        <div className="options-grid age-grid five-items">
          {edadOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setEdadRange(o.value)}
              className={`age-button ${edad_range === o.value ? "selected" : ""}`}
            >
              <span className="age-number">{o.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Presupuesto */}
      <div className="form-section">
        <label className="form-label">Presupuesto diario</label>
        <div className="options-grid budget-grid three-items">
          {presupuestoOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setPresupuestoBucket(o.value)}
              className={`option-card budget-card ${presupuesto_bucket === o.value ? "selected" : ""}`}
            >
              <div className="option-icon budget-icon">
                <o.icon />
              </div>
              <div className="option-label">{o.label}</div>
              <div className="option-sublabel">{o.range}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Duración */}
      <div className="form-section">
        <label className="form-label">Duración del viaje</label>
        <div className="options-grid four-items">
          {duracionOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setDuracionDiasRange(o.value)}
              className={`option-card ${duracion_dias_range === o.value ? "selected" : ""}`}
            >
              <div className="option-icon">
                <o.icon />
              </div>
              <div className="option-label">{o.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Navegación */}
      <div className="step-navigation">
        <button
          onClick={handleNext}
          disabled={!(edad_range && presupuesto_bucket && duracion_dias_range)}
          className="nav-button next-button"
        >
          <span>Continuar</span>
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

export default Step1PerfilBasico;
