import React from 'react'
import { FaUser, FaTree, FaUsers, FaWheelchair } from 'react-icons/fa'

const ProgressIndicator = ({ currentStep, totalSteps }) => {
  const steps = [
    { name: 'Perfil', icon: FaUser, color: 'purple' },
    { name: 'Preferencias', icon: FaTree, color: 'green' },
    { name: 'Contexto', icon: FaUsers, color: 'blue' },
    { name: 'Condiciones', icon: FaWheelchair, color: 'orange' }
  ]

  const getColorClasses = (color) => {
    const colorMap = {
      purple: 'from-purple-400 to-purple-600',
      green: 'from-green-400 to-green-600',
      blue: 'from-blue-400 to-blue-600',
      orange: 'from-orange-400 to-orange-600'
    }
    return colorMap[color] || 'from-gray-400 to-gray-600'
  }

  return (
    <div className="mb-8" aria-label="Progreso del formulario" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
      {/* Progress Bar */}
      <div className="relative mb-6">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple to-orange transition-all duration-500 ease-out shadow-glow"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between items-center">
        {steps.map((step, idx) => {
          const isActive = idx + 1 === currentStep
          const isCompleted = idx + 1 < currentStep
          return (
            <div key={step.name} className="flex flex-col items-center flex-1">
              <div
                className={`progress-step w-10 h-10 flex items-center justify-center rounded-full border-2 mb-2 transition-all duration-300 ${
                  isActive
                    ? `border-orange bg-orange/10 text-orange shadow-glow scale-110`
                    : isCompleted
                    ? `border-green bg-green/10 text-green`
                    : `border-gray-300 bg-white text-gray-400`
                }`}
                aria-current={isActive ? 'step' : undefined}
                tabIndex={0}
              >
                <step.icon className="text-xl" />
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-orange' : isCompleted ? 'text-green' : 'text-gray-400'}`}>{step.name}</span>
            </div>
          )
        })}
      </div>

      {/* Current Step Info */}
      <div className="text-center mt-4">
        <div className="text-sm text-gray-500">
          Paso {currentStep} de {totalSteps}
        </div>
        <div className="text-lg font-semibold text-gray-800 mt-1">
          {steps[currentStep - 1]?.name}
        </div>
      </div>
    </div>
  )
}

export default ProgressIndicator
