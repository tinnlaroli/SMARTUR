import React, { useState } from 'react'
import { FaTimes } from 'react-icons/fa'

import Step1PerfilBasico from '../../features/form/Step1PerfilBasico'
import Step2Preferencias from '../../features/form/Step2Preferencias'
import Step3Contexto from '../../features/form/Step3Contexto'
import Step4Condiciones from '../../features/form/Step4Condiciones'
import ProgressIndicator from '../../features/form/ProgressIndicator'
import '../../features/form/FormStyles.css'

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
          onClick={handleClose}
          className="absolute top-4 right-4 bg-white text-gray-600 hover:text-red-500 transition-all duration-300 shadow-md hover:shadow-lg rounded-full w-12 h-12 flex items-center justify-center border-0 hover:bg-red-50 hover:scale-105 z-10"
        >
          <FaTimes className="text-xl" />
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