import { Mail, Lock, User, ArrowRight, CheckCircle, XCircle, Eye, EyeOff, Camera } from 'lucide-react';
import { useState } from 'react';
import type { SignUpPayload } from '../types';
import { authApi } from '../authApi';
import { useToast } from '../../../shared/context/ToastContext';
import type { AuthStep } from '../context/AuthModalContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { TermsModal } from '../components/TermsModal';
import { useTheme } from '../../../contexts/ThemeContext';

interface SignUpViewProps {
    onSwitchStep: (step: AuthStep) => void;
}

export const SignUpView = ({ onSwitchStep }: SignUpViewProps) => {
    const toast = useToast();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [formData, setFormData] = useState<SignUpPayload>({
        name: '',
        email: '',
        password: '',
        role_id: 2,
    });

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState<'terms' | 'privacy' | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData((prev) => ({ ...prev, image: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let newValue = value;
        if (name === 'name') {
            newValue = value.replace(/[0-9]/g, '');
        }
        setFormData((prev) => ({
            ...prev,
            [name]: newValue,
        }));
    };

    const handleSingUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await authApi.signUp(formData);
            onSwitchStep('login');
            toast.success(t('auth.signup.success.title'), t('auth.signup.success.body'));
        } catch (error) {
            toast.error(t('auth.signup.error.title'), t('auth.signup.error.body'));
        } finally {
            setIsLoading(false);
        }
    };

    const passwordValidations = {
        minLength: formData.password.length >= 8,
        hasUpperCase: /[A-Z]/.test(formData.password),
        hasNumber: /[0-9]/.test(formData.password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    };

    const allValidationsPassed = Object.values(passwordValidations).every(Boolean);

    return (
        <>
            <div className="w-full">
                <div className="mb-6 flex justify-center">
                    <img src={theme === 'welltur' ? '/wellturLogo.png' : '/logo.png'} alt={theme === 'welltur' ? 'WELLTUR' : 'SMARTUR'} className="h-12 w-auto object-contain" />
                </div>

                <div className="mb-8 text-center">
                    <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{t('auth.signup.title')}</h2>
                    <p className={`mt-1 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {t('auth.signup.subtitle')}
                    </p>
                </div>

                <form onSubmit={handleSingUp} className="space-y-5">
                    {/* Photo Upload */}
                    <div className="flex flex-col items-center justify-center gap-y-4 pb-2">
                        <div className="relative group">
                            <div className={`size-24 overflow-hidden rounded-full border-2 transition-colors group-hover:border-[var(--color-purple)] ${isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-300 bg-zinc-50'
                                }`}>
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className={`flex h-full w-full items-center justify-center ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                        <User className="size-10" />
                                    </div>
                                )}
                            </div>
                            <label
                                htmlFor="photo-upload"
                                className="absolute bottom-0 right-0 flex size-8 cursor-pointer items-center justify-center rounded-full bg-[var(--color-purple)] text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
                            >
                                <Camera className="size-4" />
                                <input
                                    id="photo-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{t('auth.signup.photo')}</p>
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="user-name"
                            className={`text-xs font-medium tracking-wider uppercase ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}
                        >
                            {t('auth.signup.name.label')}
                        </label>
                        <div className="relative">
                            <input
                                id="user-name"
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleFieldChange}
                                placeholder={t('auth.signup.name.placeholder')}
                                className={`w-full rounded-lg border py-2.5 pr-4 pl-9 text-sm transition-colors focus:border-[var(--color-purple)] focus:ring-1 focus:ring-[var(--color-purple)] focus:outline-none ${isDark
                                    ? 'border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-500'
                                    : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400'
                                    }`}
                            />
                            <User className={`absolute top-1/2 left-3 size-4 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="user-email"
                            className={`text-xs font-medium tracking-wider uppercase ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}
                        >
                            {t('auth.signup.email.label')}
                        </label>
                        <div className="relative">
                            <input
                                id="user-email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleFieldChange}
                                placeholder={t('auth.signup.email.placeholder')}
                                className={`w-full rounded-lg border py-2.5 pr-4 pl-9 text-sm transition-colors focus:border-[var(--color-purple)] focus:ring-1 focus:ring-[var(--color-purple)] focus:outline-none ${isDark
                                    ? 'border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-500'
                                    : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400'
                                    }`}
                            />
                            <Mail className={`absolute top-1/2 left-3 size-4 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="user-password"
                            className={`text-xs font-medium tracking-wider uppercase ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}
                        >
                            {t('auth.signup.password.label')}
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
                                className={`w-full rounded-lg border py-2.5 pr-10 pl-9 text-sm transition-colors focus:border-[var(--color-purple)] focus:ring-1 focus:ring-[var(--color-purple)] focus:outline-none ${isDark
                                    ? 'border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-500'
                                    : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400'
                                    }`}
                            />
                            <Lock className={`absolute top-1/2 left-3 size-4 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={`absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 transition-colors ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'
                                    }`}
                            >
                                {showPassword ? (
                                    <EyeOff className="size-4" />
                                ) : (
                                    <Eye className="size-4" />
                                )}
                            </button>
                        </div>

                        {formData.password && (
                            <div className={`mt-2 space-y-2 rounded-lg border p-3 ${isDark ? 'border-zinc-800 bg-zinc-950/50' : 'border-zinc-200 bg-zinc-50'}`}>
                                <p className={`mb-2 text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                    {t('auth.password.requirements')}
                                </p>

                                <div className="flex items-center gap-2 text-xs">
                                    {passwordValidations.minLength ? (
                                        <CheckCircle className="size-3.5 text-emerald-400" />
                                    ) : (
                                        <XCircle className={`size-3.5 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
                                    )}
                                    <span
                                        className={
                                            passwordValidations.minLength
                                                ? (isDark ? 'text-zinc-200' : 'text-zinc-700')
                                                : (isDark ? 'text-zinc-500' : 'text-zinc-400')
                                        }
                                    >
                                        {t('auth.password.min')}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-xs">
                                    {passwordValidations.hasUpperCase ? (
                                        <CheckCircle className="size-3.5 text-emerald-400" />
                                    ) : (
                                        <XCircle className={`size-3.5 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
                                    )}
                                    <span
                                        className={
                                            passwordValidations.hasUpperCase
                                                ? (isDark ? 'text-zinc-200' : 'text-zinc-700')
                                                : (isDark ? 'text-zinc-500' : 'text-zinc-400')
                                        }
                                    >
                                        {t('auth.password.uppercase')}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-xs">
                                    {passwordValidations.hasNumber ? (
                                        <CheckCircle className="size-3.5 text-emerald-400" />
                                    ) : (
                                        <XCircle className={`size-3.5 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
                                    )}
                                    <span
                                        className={
                                            passwordValidations.hasNumber
                                                ? (isDark ? 'text-zinc-200' : 'text-zinc-700')
                                                : (isDark ? 'text-zinc-500' : 'text-zinc-400')
                                        }
                                    >
                                        {t('auth.password.number')}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-xs">
                                    {passwordValidations.hasSpecialChar ? (
                                        <CheckCircle className="size-3.5 text-emerald-400" />
                                    ) : (
                                        <XCircle className={`size-3.5 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
                                    )}
                                    <span
                                        className={
                                            passwordValidations.hasSpecialChar
                                                ? (isDark ? 'text-zinc-200' : 'text-zinc-700')
                                                : (isDark ? 'text-zinc-500' : 'text-zinc-400')
                                        }
                                    >
                                        {t('auth.password.special')}
                                    </span>
                                </div>

                                <div className="mt-3">
                                    <div className="mb-1 flex items-center gap-1.5">
                                        <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                            {t('auth.password.strength')}
                                        </span>
                                        <span
                                            className={`text-xs font-medium ${Object.values(passwordValidations).filter(
                                                Boolean,
                                            ).length <= 2
                                                ? 'text-rose-400'
                                                : Object.values(passwordValidations).filter(
                                                    Boolean,
                                                ).length <= 3
                                                    ? 'text-yellow-400'
                                                    : 'text-emerald-400'
                                                }`}
                                        >
                                            {Object.values(passwordValidations).filter(Boolean)
                                                .length <= 2
                                                ? t('auth.password.weak')
                                                : Object.values(passwordValidations).filter(
                                                    Boolean,
                                                ).length <= 3
                                                    ? t('auth.password.medium')
                                                    : t('auth.password.strong')}
                                        </span>
                                    </div>
                                    <div className={`h-1.5 w-full overflow-hidden rounded-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                                        <div
                                            className={`h-full transition-all duration-300 ${Object.values(passwordValidations).filter(
                                                Boolean,
                                            ).length <= 2
                                                ? 'bg-rose-500'
                                                : Object.values(passwordValidations).filter(
                                                    Boolean,
                                                ).length <= 3
                                                    ? 'bg-yellow-500'
                                                    : 'bg-emerald-500'
                                                }`}
                                            style={{
                                                width: `${(Object.values(passwordValidations).filter(Boolean).length / 4) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-start gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="terms"
                            required
                            className="size-4 rounded accent-violet-600"
                        />
                        <label htmlFor="terms" className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {t('auth.signup.terms.prefix')}{' '}
                            <button
                                type="button"
                                onClick={() => setModalOpen('terms')}
                                className="text-[var(--color-purple)] transition-colors hover:opacity-80 underline"
                            >
                                {t('auth.signup.terms.link')}
                            </button>{' '}
                            {t('auth.signup.terms.and')}{' '}
                            <button
                                type="button"
                                onClick={() => setModalOpen('privacy')}
                                className="text-[var(--color-purple)] transition-colors hover:opacity-80 underline"
                            >
                                {t('auth.signup.privacy.link')}
                            </button>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !allValidationsPassed}
                        className={`w-full rounded-lg bg-[var(--color-purple)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 focus:ring-2 focus:ring-[var(--color-purple)] focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? 'focus:ring-offset-zinc-900' : 'focus:ring-offset-white'
                            }`}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                <span>{t('auth.signup.submitting')}</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <span>{t('auth.signup.submit')}</span>
                                <ArrowRight className="size-4" />
                            </div>
                        )}
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className={`w-full border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className={`${isDark ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-zinc-500'} px-4`}>{t('auth.signup.have_account')}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => onSwitchStep('login')}
                        className={`flex w-full items-center justify-center gap-2 rounded-lg border bg-transparent px-4 py-2.5 text-sm font-medium transition-colors focus:ring-2 focus:ring-[var(--color-purple)] focus:ring-offset-2 focus:outline-none ${isDark
                            ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white focus:ring-offset-zinc-900'
                            : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 focus:ring-offset-white'
                            }`}
                    >
                        <User className="size-4" />
                        <span>{t('auth.login.submit')}</span>
                    </button>
                </form>
            </div>

            {modalOpen && <TermsModal type={modalOpen} onClose={() => setModalOpen(null)} />}
        </>
    );
};
