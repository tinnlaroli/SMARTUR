import React, { useState } from 'react'
import Step1PerfilBasico from '../pages/form/Step1PerfilBasico'
import Step2Preferencias from '../pages/form/Step2Preferencias'
import Step3Contexto from '../pages/form/Step3Contexto'
import Step4Condiciones from '../pages/form/Step4Condiciones'
import ProgressIndicator from '../pages/form/ProgressIndicator'
import '../pages/form/FormStyles.css'

const steps = [
  'Perfil básico',
  'Preferencias turísticas',
  'Contexto del viaje',
  'Condiciones especiales',
]

export default function MultiStepFormModal({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})

  const nextStep = () =>
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0))

  const updateFormData = (newData) => {
    setFormData((prev) => ({ ...prev, ...newData }))
  }

  const handleClose = () => {
    // Reset form data and step when closing
    setCurrentStep(0)
    setFormData({})
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-fadeInUp">
        {/* Botón cerrar */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl z-10"
          onClick={handleClose}
        >
          &times;
        </button>

        <div className="p-6 sm:p-8">
          <div className="multi-step-form-modal">
            <ProgressIndicator
              currentStep={currentStep + 1}
              totalSteps={steps.length}
            />
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
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 