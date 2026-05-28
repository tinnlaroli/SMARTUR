import { Mail, Lock, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LoginPayload } from '../types';
import { authApi } from '../authApi';
import { useToast } from '../../../shared/context/ToastContext';
import SmartURLoader from '../components/SmartURLoader';
import { useAuthModal, type AuthStep } from '../context/AuthModalContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLanguage, useUserPreferences } from '../../../contexts/LanguageContext';

interface LoginViewProps {
    onSwitchStep: (step: AuthStep) => void;
    onClose?: () => void;
}

export const LoginView = ({ onSwitchStep, onClose }: LoginViewProps) => {
    const navigate = useNavigate();
    const { setStep } = useAuthModal();
    const toast = useToast();
    const { t } = useLanguage();
    const { setUser } = useUserPreferences();

    const [formData, setFormData] = useState<LoginPayload>({
        email: '',
        password: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isLoginReady, setIsLoginReady] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const pendingActionRef = useRef<(() => void) | null>(null);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await authApi.login(formData);
            if (response.requiresVerification === true) {
                setStep('twoFactor', response.email);
                toast.success(t('auth.login.success.title'), t('auth.login.success.body'));
                return;
            }

            if (response.token && response.user) {
                localStorage.setItem('token', response.token);
                if (response.refreshToken) localStorage.setItem('refreshToken', response.refreshToken);
                setUser(response.user);
                localStorage.removeItem('v1:token');
                localStorage.removeItem('v1:user');

                const userRole = response.user.role_id || (Number(response.user.id) === 1 ? 1 : 2);

                const completeAction = () => {
                    if (userRole === 1) {
                        navigate('/dashboard');
                    } else if (userRole === 3) {
                        navigate('/empresa/dashboard');
                    } else {
                        navigate('/', { state: { openForm: true } });
                    }
                    if (onClose) onClose();
                };

                pendingActionRef.current = completeAction;
                setIsLoginReady(true);
            }

        } catch (error) {
            toast.error(t('auth.login.error.title'), t('auth.login.error.body'));
            setIsLoading(false);
        }
    };

    const handleLoaderFinished = () => {
        if (pendingActionRef.current) {
            pendingActionRef.current();
        }
        setIsLoading(false);
        setIsLoginReady(false);
    };

    return (
        <div className="w-full">
            {isLoading && (
                <SmartURLoader
                    isReady={isLoginReady}
                    onFinished={handleLoaderFinished}
                />
            )}
            <div className="mb-6 flex justify-center">
                <img src="/image.png" alt="Smartur" className="h-12 w-auto object-contain" />
            </div>

            <div className="mb-8 text-center">
                <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{t('auth.login.title')}</h2>
                <p className={`mt-1 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{t('auth.login.subtitle')}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5">
                    <label htmlFor="user-email" className={`text-xs font-medium tracking-wider uppercase ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        {t('auth.login.email.label')}
                    </label>
                    <div className="relative">
                        <input
                            id="user-email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleFieldChange}
                            placeholder={t('auth.login.email.placeholder')}
                            className={`w-full rounded-lg border py-2.5 pr-4 pl-9 text-sm transition-colors focus:border-[var(--color-purple)] focus:ring-1 focus:ring-[var(--color-purple)] focus:outline-none ${
                                isDark
                                    ? 'border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-500'
                                    : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400'
                            }`}
                        />
                        <Mail className={`absolute top-1/2 left-3 size-4 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="user-password" className={`text-xs font-medium tracking-wider uppercase ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        {t('auth.login.password.label')}
                    </label>
                    <div className="relative">
                        <input
                            id="user-password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={formData.password}
                            onChange={handleFieldChange}
                            placeholder="………………"
                            className={`w-full rounded-lg border py-2.5 pr-10 pl-9 text-sm transition-colors focus:border-[var(--color-purple)] focus:ring-1 focus:ring-[var(--color-purple)] focus:outline-none ${
                                isDark
                                    ? 'border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-500'
                                    : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400'
                            }`}
                        />
                        <Lock className={`absolute top-1/2 left-3 size-4 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={`absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 transition-colors ${
                                isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'
                            }`}
                        >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => onSwitchStep('forgotPassword')}
                        className="flex items-center gap-1 text-xs text-[var(--color-purple)] transition-colors hover:opacity-80"
                    >
                        {t('auth.login.forgot')}
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full rounded-lg bg-[var(--color-purple)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 focus:ring-2 focus:ring-[var(--color-purple)] focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                        isDark ? 'focus:ring-offset-zinc-900' : 'focus:ring-offset-white'
                    }`}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            <span>{t('auth.login.submitting')}</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                            <LogIn className="size-4" />
                            <span>{t('auth.login.submit')}</span>
                        </div>
                    )}
                </button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className={`w-full border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className={`${isDark ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-zinc-500'} px-4`}>{t('auth.login.first_time')}</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => onSwitchStep('signup')}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg border bg-transparent px-4 py-2.5 text-sm font-medium transition-colors focus:ring-2 focus:ring-[var(--color-purple)] focus:ring-offset-2 focus:outline-none ${
                        isDark
                            ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white focus:ring-offset-zinc-900'
                            : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 focus:ring-offset-white'
                    }`}
                >
                    <UserPlus className="size-4" />
                    <span>{t('auth.login.create')}</span>
                </button>
            </form>
        </div>
    );
};
