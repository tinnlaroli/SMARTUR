import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";

import Step1PerfilBasico from "../../features/form/Step1PerfilBasico";
import Step2Preferencias from "../../features/form/Step2Preferencias";
import Step3Contexto from "../../features/form/Step3Contexto";
import Step4Condiciones from "../../features/form/Step4Condiciones";
import ProgressIndicator from "../../features/form/ProgressIndicator";
import RecommendationsResultModal from "./RecommendationsResultModal";
import "../../features/form/FormStyles.css";

const steps = [
  "Perfil básico",
  "Preferencias turísticas",
  "Contexto del viaje",
  "Condiciones especiales",
];

export default function MultiStepFormModal({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [isStep4Loading, setIsStep4Loading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendationsData, setRecommendationsData] = useState(null);
  const modalRef = useRef(null);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Enfocar el modal al abrir para accesibilidad
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.focus();
    }
  }, []);

  const nextStep = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      setIsTransitioning(false);
    }, 200);
  };

  const prevStep = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep((prev) => Math.max(prev - 1, 0));
      setIsTransitioning(false);
    }, 200);
  };

  const updateFormData = (newData) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const handleClose = () => {
    // Reset form data and step when closing
    setCurrentStep(0);
    setFormData({});
    setShowRecommendations(false);
    setRecommendationsData(null);
    onClose();
  };

  const handleShowRecommendations = (recData) => {
    setRecommendationsData(recData);
    setShowRecommendations(true);
    // No cerrar el modal del formulario, solo mostrar las recomendaciones
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        // Cerrar al hacer click fuera del modal
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-slideUp focus:outline-none"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior con gradiente (removido por color sólido) */}
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-purple"
          aria-hidden="true"
        ></div>
        {/* Botón cerrar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 bg-white text-gray-600 hover:text-red-500 transition-all duration-300 shadow-md hover:shadow-lg rounded-full w-12 h-12 flex items-center justify-center border-0 hover:bg-red-50 hover:scale-105 z-10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:scale-95"
          aria-label="Cerrar formulario"
        >
          <FaTimes className="text-xl" aria-hidden="true" />
        </button>

        <h2 id="modal-title" className="sr-only">
          Formulario de recomendaciones - Paso {currentStep + 1} de{" "}
          {steps.length}
        </h2>

        <div className="p-2 sm:p-4">
          <div className="multi-step-form-modal">
            <ProgressIndicator
              currentStep={currentStep + 1}
              totalSteps={steps.length}
              isStep4Loading={isStep4Loading}
            />
            <div
              className={`step-wrapper ${isTransitioning ? "fade-out" : "fade-in"}`}
            >
              {currentStep === 0 && (
                <Step1PerfilBasico
                  data={formData}
                  onNext={nextStep}
                  onChange={updateFormData}
                />
              )}
              {currentStep === 1 && (
                <Step2Preferencias
                  data={formData}
                  onNext={nextStep}
                  onBack={prevStep}
                  onChange={updateFormData}
                />
              )}
              {currentStep === 2 && (
                <Step3Contexto
                  data={formData}
                  onNext={nextStep}
                  onBack={prevStep}
                  onChange={updateFormData}
                />
              )}
              {currentStep === 3 && (
                <Step4Condiciones
                  data={formData}
                  onBack={prevStep}
                  onChange={updateFormData}
                  onClose={handleClose}
                  onLoadingChange={setIsStep4Loading}
                  onShowRecommendations={handleShowRecommendations}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Modal de recomendaciones renderizado con Portal */}
      {showRecommendations &&
        recommendationsData &&
        recommendationsData.recommendations &&
        createPortal(
          <RecommendationsResultModal
            recommendations={recommendationsData.recommendations}
            userId={recommendationsData.user_id}
            onClose={() => {
              setShowRecommendations(false);
              setRecommendationsData(null);
              // Cerrar también el modal del formulario
              handleClose();
            }}
          />,
          document.body,
        )}
    </div>
  );
}
