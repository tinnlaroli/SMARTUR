import React, { createContext, use, useState, type ReactNode } from 'react';

export type AuthStep = 'login' | 'signup' | 'forgotPassword' | 'twoFactor' | 'resetPassword' | 'qrLogin';

interface AuthModalContextType {
    isOpen: boolean;
    step: AuthStep;
    email: string; // Used for transitions like forgotPassword -> resetPassword or login -> twoFactor
    rememberMe: boolean; // Elegido en login, consumido en el paso de 2FA
    openModal: (step?: AuthStep, email?: string) => void;
    closeModal: () => void;
    setStep: (step: AuthStep, email?: string, rememberMe?: boolean) => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStepState] = useState<AuthStep>('login');
    const [email, setEmail] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const openModal = (initialStep: AuthStep = 'login', initialEmail: string = '') => {
        setStepState(initialStep);
        setEmail(initialEmail);
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
    };

    const setStep = (newStep: AuthStep, newEmail?: string, newRememberMe?: boolean) => {
        setStepState(newStep);
        if (newEmail !== undefined) {
            setEmail(newEmail);
        }
        if (newRememberMe !== undefined) {
            setRememberMe(newRememberMe);
        }
    };

    return (
        <AuthModalContext.Provider value={{ isOpen, step, email, rememberMe, openModal, closeModal, setStep }}>
            {children}
        </AuthModalContext.Provider>
    );
};

export const useAuthModal = () => {
    const context = use(AuthModalContext);
    if (context === undefined) {
        throw new Error('useAuthModal must be used within an AuthModalProvider');
    }
    return context;
};
