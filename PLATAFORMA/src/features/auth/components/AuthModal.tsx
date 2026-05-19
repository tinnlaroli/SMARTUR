import React from 'react';
import { useAuthModal } from '../context/AuthModalContext';
import { LoginView } from '../views/LoginView';
import { SignUpView } from '../views/SignUpView';
import { ForgotPasswordView } from '../views/ForgotPasswordView';
import { TwoFactorView } from '../views/TwoFactorView';
import { ResetPasswordView } from '../views/ResetPasswordView';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContext';
import type { AuthStep } from '../context/AuthModalContext';

interface AuthStepContentProps {
    step: AuthStep;
    email: string;
    setStep: (step: AuthStep, email?: string) => void;
    closeModal: () => void;
}

const AuthStepContent: React.FC<AuthStepContentProps> = ({ step, email, setStep, closeModal }) => {
    switch (step) {
        case 'login':
            return <LoginView onSwitchStep={setStep} onClose={closeModal} />;
        case 'signup':
            return <SignUpView onSwitchStep={setStep} />;
        case 'forgotPassword':
            return <ForgotPasswordView onSwitchStep={setStep} />;
        case 'twoFactor':
            return <TwoFactorView email={email} onSwitchStep={setStep} onClose={closeModal} />;
        case 'resetPassword':
            return <ResetPasswordView email={email} onSwitchStep={setStep} />;
        default:
            return <LoginView onSwitchStep={setStep} onClose={closeModal} />;
    }
};

export const AuthModal: React.FC = () => {
    const { isOpen, step, email, closeModal, setStep } = useAuthModal();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeModal}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className={`relative w-full max-w-md overflow-hidden rounded-2xl p-8 shadow-2xl ${
                                isDark ? 'border border-zinc-800 bg-zinc-900' : 'border border-zinc-200 bg-white'
                            }`}
                        >
                            <button
                                onClick={closeModal}
                                className={`absolute top-4 right-4 rounded-full p-2 transition-colors ${
                                    isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                                }`}
                            >
                                <X className="size-5" />
                            </button>

                            <div className="max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
                                <AuthStepContent
                                    step={step}
                                    email={email}
                                    setStep={setStep}
                                    closeModal={closeModal}
                                />
                            </div>

                            <p className={`mt-8 text-center text-xs ${isDark ? 'text-zinc-600' : 'text-zinc-500'}`}>
                                © 2024 Smartur. Todos los derechos reservados.
                            </p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        
    );
};
