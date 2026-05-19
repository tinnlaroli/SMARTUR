import React, { createContext, use, useState, type ReactNode } from 'react';

export type AuthStep = 'login' | 'signup' | 'forgotPassword' | 'twoFactor' | 'resetPassword';

interface AuthModalContextType {
    isOpen: boolean;
    step: AuthStep;
    email: string; // Used for transitions like forgotPassword -> resetPassword or login -> twoFactor
    openModal: (step?: AuthStep, email?: string) => void;
    closeModal: () => void;
    setStep: (step: AuthStep, email?: string) => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStepState] = useState<AuthStep>('login');
    const [email, setEmail] = useState('');

    const openModal = (initialStep: AuthStep = 'login', initialEmail: string = '') => {
        setStepState(initialStep);
        setEmail(initialEmail);
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
    };

    const setStep = (newStep: AuthStep, newEmail?: string) => {
        setStepState(newStep);
        if (newEmail !== undefined) {
            setEmail(newEmail);
        }
    };

    return (
        <AuthModalContext.Provider value={{ isOpen, step, email, openModal, closeModal, setStep }}>
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
