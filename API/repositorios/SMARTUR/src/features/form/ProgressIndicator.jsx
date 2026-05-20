import React from 'react'
import { FaUser, FaTree, FaUsers, FaWheelchair, FaCheck } from 'react-icons/fa'

const ProgressIndicator = ({ currentStep, totalSteps, isStep4Loading = false }) => {
  const steps = [
    { name: 'Perfil', icon: FaUser, color: '#4299e1' },
    { name: 'Preferencias', icon: FaTree, color: '#48bb78' },
    { name: 'Contexto', icon: FaUsers, color: '#4299e1' },
    { name: 'Condiciones', icon: FaWheelchair, color: '#ed8936' }
  ]

  // Si el step 4 está cargando, mostrar 100% completado
  const progressPercentage = isStep4Loading 
    ? 100 
    : ((currentStep / totalSteps) * 100).toFixed(0)

  return (
    <div className="progress-indicator" data-current-step={currentStep} aria-label="Progreso del formulario" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div className="progress-bar-background">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="progress-percentage">{progressPercentage}%</div>
      </div>

      {/* Step Indicators */}
      <div className="progress-steps">
        {steps.map((step, idx) => {
          const stepNumber = idx + 1
          // Si es el step 4 y está cargando, marcarlo como completado
          const isStep4AndLoading = stepNumber === totalSteps && isStep4Loading
          const isActive = stepNumber === currentStep && !isStep4AndLoading
          const isCompleted = stepNumber < currentStep || isStep4AndLoading
          const isPending = stepNumber > currentStep && !isStep4AndLoading
          
          return (
            <div key={step.name} className={`progress-step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isPending ? 'pending' : ''}`}>
              <div className="progress-step-connector" />
              <div className="progress-step-circle">
                {isCompleted ? (
                  <FaCheck className="progress-step-icon" />
                ) : (
                  <step.icon className="progress-step-icon" />
                )}
              </div>
              <span className="progress-step-label">{step.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProgressIndicator
