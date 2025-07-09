import React, { useState } from 'react'
import Step1PerfilBasico from './Step1PerfilBasico'
import Step2Preferencias from './Step2Preferencias'
import Step3Contexto from './Step3Contexto'
import Step4Condiciones from './Step4Condiciones'
import ProgressIndicator from './ProgressIndicator'
import './FormStyles.css'

const steps = [
  'Perfil básico',
  'Preferencias turísticas',
  'Contexto del viaje',
  'Condiciones especiales',
]

const MultiStepForm = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})

  const nextStep = () => {
    // Validación simple para evitar avanzar sin datos mínimos
    if (currentStep === 0 && (!formData.nombre || !formData.email)) return;
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0))

  const updateFormData = (newData) => {
    setFormData((prev) => ({ ...prev, ...newData }))
  }

  return (
    <div className="App">
      <div className="multi-step-form max-w-2xl mx-auto bg-white/90 rounded-2xl shadow-xl p-6 sm:p-10 mt-8 mb-8 animate-fadeInUp">
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
          />
        )}
      </div>
    </div>
  )
}

export default MultiStepForm
