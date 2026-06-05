import { useState, useEffect, useRef } from 'react';
import { Step1PerfilBasico } from './Step1PerfilBasico';
import { Step2Preferencias } from './Step2Preferencias';
import { Step3Contexto } from './Step3Contexto';
import { Step4Condiciones } from './Step4Condiciones';
import { ProgressIndicator } from './ProgressIndicator';
import { RecommendationsResult } from './RecommendationsResult';
import { X } from 'lucide-react';
import type { FormContext, RecommendationsResponse } from '../types/types';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey';

interface FormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FormModal({ isOpen, onClose }: FormModalProps) {
    useEscapeKey(onClose);
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<Partial<FormContext>>({});
    const [isStep4Loading, setIsStep4Loading] = useState(false);
    const [showRecommendations, setShowRecommendations] = useState(false);
    const [recommendationsData, setRecommendationsData] = useState<RecommendationsResponse | null>(null);
    const { theme } = useTheme();
    const { t } = useLanguage();
    const scrollRef = useRef<HTMLDivElement>(null);
    const isDark = theme === 'dark';

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Scroll modal back to top whenever the step changes
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    }, [currentStep]);

    if (!isOpen) return null;

    const totalSteps = 4;

    const nextStep = () => {
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    };

    const prevStep = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };

    const updateFormData = (newData: Partial<FormContext>) => {
        setFormData((prev) => ({ ...prev, ...newData }));
    };

    const handleShowRecommendations = (result: RecommendationsResponse) => {
        setRecommendationsData(result);
        setShowRecommendations(true);
    };

    const handleCloseFinal = () => {
        setShowRecommendations(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <button
                type="button"
                aria-label={t('form.modal.closeLabel')}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 cursor-default"
                onClick={onClose}
            />
            
            {/* Modal Card */}
            <div
                className={`relative w-full max-w-lg md:max-w-2xl lg:max-w-4xl max-h-[92vh] md:max-h-[85vh] overflow-hidden rounded-2xl md:rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col ${
                    isDark ? 'border border-zinc-800 bg-zinc-900' : 'border border-zinc-200 bg-white'
                }`}
            >
                <button
                    onClick={onClose}
                    className={`absolute top-3 right-3 md:top-6 md:right-6 z-10 rounded-full p-1.5 md:p-2 transition-colors ${
                        isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                >
                    <X className="size-5 md:size-6" />
                </button>

                <div ref={scrollRef} className="p-4 md:p-6 lg:p-8 overflow-y-auto">
                    <ProgressIndicator currentStep={currentStep + 1} totalSteps={totalSteps} isStep4Loading={isStep4Loading} />

                    <div className="mt-8">
                        {currentStep === 0 && <Step1PerfilBasico data={formData} onNext={nextStep} onChange={updateFormData} />}
                        {currentStep === 1 && <Step2Preferencias data={formData} onNext={nextStep} onBack={prevStep} onChange={updateFormData} />}
                        {currentStep === 2 && <Step3Contexto data={formData} onNext={nextStep} onBack={prevStep} onChange={updateFormData} />}
                        {currentStep === 3 && (
                            <Step4Condiciones 
                                data={formData} 
                                onBack={prevStep} 
                                onChange={updateFormData} 
                                onLoadingChange={setIsStep4Loading} 
                                onShowRecommendations={handleShowRecommendations} 
                            />
                        )}
                    </div>
                </div>
            </div>

            {showRecommendations && recommendationsData && (
                <RecommendationsResult 
                    recommendations={recommendationsData.recommendations} 
                    onClose={handleCloseFinal} 
                />
            )}
        </div>
    );
}
