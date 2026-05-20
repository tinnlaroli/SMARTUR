// src/features/form/Step4Condiciones.jsx
import React, { useState, useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  FaChevronLeft,
  FaArrowLeft,
  FaCheck,
  FaWheelchair,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

import { useAuth } from "../auth/AuthContext.jsx";
import { useRecommendations } from "../../shared/hooks/useRecommendations.js";
import SmartURLoader from "../../components/ui/SmartURLoader";

const Step4Condiciones = ({
  data = {},
  onBack,
  onChange,
  onClose,
  onLoadingChange,
  onShowRecommendations,
}) => {
  const { user, token: authToken } = useAuth() || {};
  const token = authToken || localStorage.getItem("token");

  const [accesibilidad, setAccesibilidad] = useState(
    data.accesibilidad || "no",
  );
  const [detalleAcc, setDetalleAcc] = useState(data.detalleAcc || "");
  const [visitado, setVisitado] = useState(data.visitado || "no");

  const { loading, error, getRecommendations, cancel } = useRecommendations();
  const [showResults, setShowResults] = useState(false);
  const [recResponse, setRecResponse] = useState(null);
  const [apiError, setApiError] = useState(null);
  const isSubmittingRef = useRef(false);
  const containerRef = useRef(null);

  useGSAP(
    () => {
      if (loading || apiError) return;

      gsap.from(containerRef.current.children, {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
      });
    },
    { scope: containerRef, dependencies: [loading, apiError] },
  );

  // Notificar al padre cuando cambia el estado de loading
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(loading);
    }
  }, [loading, onLoadingChange]);

  useEffect(() => {
    return () => {
      if (!isSubmittingRef.current) {
        if (cancel) cancel();
      }
    };
  }, []);

  const persistLocalFields = () => {
    onChange({
      accesibilidad,
      detalleAcc: accesibilidad === "si" ? detalleAcc : "",
      visitado,
    });
  };

  const buildContext = () => {
    const d = data || {};
    const preferencia_lugar = d.preferencia_lugar || "indiferente";
    const pref_outdoor = preferencia_lugar === "aire";
    const services = d.services || [];

    return {
      edad: d.edad ?? undefined,
      edad_range: d.edad_range,
      presupuesto_daily: d.presupuesto_daily,
      presupuesto_bucket: d.presupuesto_bucket,
      duracion_dias: d.duracion_dias,
      duracion_dias_range: d.duracion_dias_range,
      tiposTurismo: d.tiposTurismo || [],
      actividad_level: d.actividad_level ?? 3,
      preferencia_lugar,
      pref_outdoor,
      group_type: d.group_type,
      services,
      needs_hotel: services.includes("hospedaje"),
      needs_transport: services.includes("transporte"),
      pref_food: services.includes("alimentos"),
      wants_tours: services.includes("tours"),
      accesibilidad: accesibilidad === "si" ? "si" : "no",
      detalleAcc: accesibilidad === "si" ? detalleAcc : "",
      visitado: visitado === "si" ? "si" : "no",
    };
  };

  const handleFinalizar = () => {
    if (onClose) onClose();
  };

  const handleFinish = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    persistLocalFields();

    if (!user || !user.id) {
      alert("Debes iniciar sesión.");
      isSubmittingRef.current = false;
      return;
    }

    const context = buildContext();
    console.log("[Step4] Enviando context al recommender:", context);

    setApiError(null);

    try {
      const result = await getRecommendations({
        userId: String(user.id),
        alpha: 0.7,
        candidates: 200,
        k_cf: 20,
        context, // Este objeto ya contiene todo lo de Step 1, 2 y 3
        token,
      });

      console.log("[Step4] Resultado recibido:", result);

      if (!result) {
        setApiError("No se recibió respuesta del servidor.");
        isSubmittingRef.current = false;
        return;
      }

      if (result.recommendations && result.recommendations.length > 0) {
        // Pasar los datos al componente padre para que muestre el modal
        if (onShowRecommendations) {
          onShowRecommendations(result);
        } else {
          // Fallback: mantener el comportamiento anterior si no hay callback
          setRecResponse(result);
          setShowResults(true);
          if (onClose) {
            onClose();
          }
        }
      } else {
        setApiError(
          "No se encontraron recomendaciones con el contexto proporcionado.",
        );
      }
    } catch (err) {
      console.error("[Step4] Error al obtener recomendaciones:", err);
      setApiError(err?.message || "Error al conectar con el servidor");
    } finally {
      isSubmittingRef.current = false;
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="relative min-h-[400px] w-full flex flex-col items-center justify-center">
        <SmartURLoader isMini />
        <div className="mt-8 text-center z-[100000]">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Generando tus recomendaciones personalizadas...
          </h3>
          <p className="text-sm text-gray-500">
            Esto puede tardar unos segundos
          </p>
        </div>
      </div>
    );
  }

  // Error
  if (apiError) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3 className="error-title">Error al generar recomendaciones</h3>
        <div className="error-message">{apiError}</div>
        <button
          onClick={() => {
            setApiError(null);
            isSubmittingRef.current = false;
          }}
          className="btn-retry"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const accesibilidadOptions = [
    { label: "Sí", value: "si", icon: FaCheckCircle },
    { label: "No", value: "no", icon: FaTimesCircle },
  ];

  const visitadoOptions = [
    { label: "Sí", value: "si", icon: FaMapMarkerAlt },
    { label: "No", value: "no", icon: FaMapMarkerAlt },
  ];

  // Formulario
  return (
    <div className="step-content" data-step="4" ref={containerRef}>
      {/* Header */}
      <div className="step-header">
        <h2 className="step-title">Condiciones Especiales</h2>
        <p className="step-subtitle">
          Ayúdanos a personalizar aún más tu experiencia
        </p>
      </div>

      {/* Accesibilidad */}
      <div className="form-section">
        <label className="form-label">¿Necesitas accesibilidad?</label>
        <div className="options-grid two-items">
          {accesibilidadOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setAccesibilidad(option.value)}
              className={`option-card ${accesibilidad === option.value ? "selected" : ""}`}
            >
              <div className="option-icon">
                <option.icon />
              </div>
              <div className="option-label">{option.label}</div>
            </button>
          ))}
        </div>
        {accesibilidad === "si" && (
          <div className="textarea-wrapper">
            <textarea
              value={detalleAcc}
              onChange={(e) => setDetalleAcc(e.target.value)}
              placeholder="Describe tu requerimiento de accesibilidad..."
              rows="4"
              className="form-textarea"
            />
          </div>
        )}
      </div>

      {/* Visitado */}
      <div className="form-section">
        <label className="form-label">¿Has visitado la región antes?</label>
        <div className="options-grid two-items">
          {visitadoOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setVisitado(option.value)}
              className={`option-card ${visitado === option.value ? "selected" : ""}`}
            >
              <div className="option-icon">
                <option.icon />
              </div>
              <div className="option-label">{option.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Botones de navegación */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          disabled={loading}
          className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center space-x-2">
            <FaArrowLeft className="w-4 h-4" />
            <span>Atrás</span>
          </span>
        </button>
        <button
          onClick={handleFinish}
          disabled={loading}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
            loading
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-orange text-white hover:shadow-lg hover:scale-105"
          }`}
        >
          <span>Finalizar</span>
          <FaCheck className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Step4Condiciones;



// {
//   "alpha": 0.7,
//   "candidates": 200,
//   "k_cf": 20,
//   "context": {
//     "edad": 25, 
//     "edad_range": "20-30",
//     "presupuesto_daily": 1500,
//     "presupuesto_bucket": "medio",
//     "duracion_dias": 3,
//     "duracion_dias_range": "1-3",
//     "tiposTurismo": ["cultura", "naturaleza"],
//     "actividad_level": 3,
//     "preferencia_lugar": "aire",
//     "pref_outdoor": true,
//     "group_type": "pareja",
//     "services": ["hospedaje", "alimentos"],
//     "needs_hotel": true,
//     "needs_transport": false,
//     "pref_food": true,
//     "wants_tours": false,
//     "accesibilidad": "si",
//     "detalleAcc": "Silla de ruedas",
//     "visitado": "no"
//   }
// }
