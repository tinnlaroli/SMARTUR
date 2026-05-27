import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { authApi } from '../authApi';
import type { TwoFactorPayload } from '../types';
import { useToast } from '../../../shared/context/ToastContext';
import SmartURLoader from '../components/SmartURLoader';
import type { AuthStep } from '../context/AuthModalContext';
import { useLanguage, useUserPreferences } from '../../../contexts/LanguageContext';

interface TwoFactorViewProps {
    email: string;
    onSwitchStep: (step: AuthStep) => void;
    onClose?: () => void;
}

export const TwoFactorView = ({ email, onSwitchStep, onClose }: TwoFactorViewProps) => {
    const toast = useToast();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { setUser } = useUserPreferences();
    const [otp, setOtp] = useState<string[]>(() => Array(6).fill(''));
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(() => !email);
    const [isReady, setIsReady] = useState(false);
    const pendingActionRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!email) {
            onSwitchStep('login');
        }
    }, [email, onSwitchStep]);

    const handleOtpChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);

        if (digit && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (otp[index]) {
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            } else if (index > 0) {
                inputsRef.current[index - 1]?.focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputsRef.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;
        const newOtp = Array(6).fill('');
        pasted.split('').forEach((char, i) => {
            newOtp[i] = char;
        });
        setOtp(newOtp);
        const nextIndex = Math.min(pasted.length, 5);
        inputsRef.current[nextIndex]?.focus();
    };

    const token = otp.join('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (token.length !== 6) return;

        setIsLoading(true);
        try {
            const payload: TwoFactorPayload = {
                email,
                token,
            };

            const response = await authApi.twoFactor(payload);
            const { token: jwt } = response;

            localStorage.setItem('token', jwt);
            if (response.refreshToken) localStorage.setItem('refreshToken', response.refreshToken);
            setUser(response.user);
            localStorage.removeItem('v1:token');
            localStorage.removeItem('v1:user');

            toast.success(t('auth.twoFactor.success.title'), t('auth.twoFactor.success.body'));

            const apiUser = response.user;
            const userRole = Number(apiUser.role_id) || (Number(apiUser.id) === 1 ? 1 : 2);

            const completeAction = () => {
                if (userRole === 1) {
                    navigate('/dashboard', { replace: true });
                } else if (userRole === 3) {
                    navigate('/empresa/dashboard', { replace: true });
                } else {
                    navigate('/', { replace: true, state: { openForm: true } });
                }
                if (onClose) onClose();
            };

            pendingActionRef.current = completeAction;
            setIsReady(true);

        } catch (error) {
            toast.error(t('auth.twoFactor.error.title'), t('auth.twoFactor.error.body'));
            setIsLoading(false);
        }
    };

    const handleLoaderFinished = () => {
        if (pendingActionRef.current) {
            pendingActionRef.current();
        }
        setIsLoading(false);
        setIsInitialLoading(false);
        setIsReady(false);
    };

    return (
        <div className="w-full">
            {(isInitialLoading || isLoading) && (
                <SmartURLoader
                    isReady={isReady}
                    onFinished={handleLoaderFinished}
                />
            )}

            <div className="mb-6 flex justify-center">
                <div className="rounded-full p-3" style={{ background: 'rgba(var(--rgb-purple-accent),0.1)' }}>
                    <Shield className="size-8" style={{ color: 'var(--color-purple)' }} />
                </div>
            </div>

            <div className="mb-8 text-center">
                <h2 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
                    {t('auth.twoFactor.title')}
                </h2>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-alt)' }}>
                    {t('auth.twoFactor.subtitle')} <br />
                    <span className="font-medium" style={{ color: 'var(--color-text)' }}>{email}</span>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label
                        htmlFor="otp-0"
                        className="block text-center text-xs font-medium tracking-wider uppercase"
                        style={{ color: 'var(--color-text-alt)' }}
                    >
                        {t('auth.twoFactor.label')}
                    </label>

                    <div className="flex items-center justify-center gap-2">
                        {otp.map((digit, index) => (
                            <input
                                key={`otp-${index}`}
                                id={index === 0 ? 'otp-0' : undefined}
                                ref={(el) => {
                                    inputsRef.current[index] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                onFocus={(e) => e.target.select()}
                                className={`h-14 w-12 rounded-lg border text-center text-xl font-bold transition-all duration-150 focus:outline-none ${index === 3 ? 'ml-2' : ''}`}
                                style={{
                                    borderColor: 'var(--color-border)',
                                    background: 'var(--color-bg)',
                                    color: 'var(--color-text)',
                                }}
                                onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--color-purple)')}
                                onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                            />
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || token.length !== 6}
                    className="w-full rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: 'var(--color-purple)' }}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            <span>{t('auth.twoFactor.submitting')}</span>
                        </div>
                    ) : (
                        <span>{t('auth.twoFactor.submit')}</span>
                    )}
                </button>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => onSwitchStep('login')}
                        className="mx-auto flex items-center justify-center gap-2 text-xs transition-colors nav-item-idle"
                    >
                        <ArrowLeft className="size-3" />
                        {t('auth.twoFactor.back')}
                    </button>
                </div>
            </form>
        </div>
    );
};
