import { Mail, Lock, User, ArrowRight, CheckCircle, XCircle, Eye, EyeOff, Camera } from 'lucide-react';
import { useState } from 'react';
import type { SignUpPayload } from '../types';
import { authApi } from '../authApi';
import { useToast } from '../../../shared/context/ToastContext';
import type { AuthStep } from '../context/AuthModalContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { TermsModal } from '../components/TermsModal';

interface SignUpViewProps {
    onSwitchStep: (step: AuthStep) => void;
}

export const SignUpView = ({ onSwitchStep }: SignUpViewProps) => {
    const toast = useToast();
    const { t } = useLanguage();
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
                <div className="flex size-12 items-center justify-center rounded-full bg-violet-600/10">
                    <User className="size-6 text-violet-400" />
                </div>
            </div>

            <div className="mb-8 text-center">
                <h2 className="text-2xl font-semibold text-[var(--color-text)]">{t('auth.signup.title')}</h2>
                <p className="mt-1 text-sm text-[var(--color-text-alt)]">
                    {t('auth.signup.subtitle')}
                </p>
            </div>

            <form onSubmit={handleSingUp} className="space-y-5">
                {/* Photo Upload */}
                <div className="flex flex-col items-center justify-center gap-y-4 pb-2">
                    <div className="relative group">
                        <div className="size-24 overflow-hidden rounded-full border-2 border-[var(--color-border)] bg-[var(--color-bg-alt)] transition-colors group-hover:border-[var(--color-purple)]">
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-[var(--color-text-alt)]">
                                    <User className="size-10" />
                                </div>
                            )}
                        </div>
                        <label
                            htmlFor="photo-upload"
                            className="absolute bottom-0 right-0 flex size-8 cursor-pointer items-center justify-center rounded-full bg-violet-600 text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
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
                    <p className="text-xs text-[var(--color-text-alt)]">{t('auth.signup.photo')}</p>
                </div>

                <div className="space-y-1.5">
                    <label
                        htmlFor="user-name"
                        className="text-xs font-medium tracking-wider text-[var(--color-text-alt)] uppercase"
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
                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 pr-4 pl-9 text-sm text-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-alt)] focus:border-[var(--color-purple)] focus:ring-1 focus:ring-[var(--color-purple)] focus:outline-none"
                        />
                        <User className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-text-alt)]" />
                    </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                    <label
                        htmlFor="user-email"
                        className="text-xs font-medium tracking-wider text-[var(--color-text-alt)] uppercase"
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
                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 pr-4 pl-9 text-sm text-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-alt)] focus:border-[var(--color-purple)] focus:ring-1 focus:ring-[var(--color-purple)] focus:outline-none"
                        />
                        <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-text-alt)]" />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label
                        htmlFor="user-password"
                        className="text-xs font-medium tracking-wider text-[var(--color-text-alt)] uppercase"
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
                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 pr-12 pl-9 text-sm text-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-alt)] focus:border-[var(--color-purple)] focus:ring-1 focus:ring-[var(--color-purple)] focus:outline-none"
                        />
                        <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-text-alt)]" />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--color-text-alt)] transition-colors hover:text-[var(--color-purple)]"
                        >
                            {showPassword ? (
                                <EyeOff className="size-4" />
                            ) : (
                                <Eye className="size-4" />
                            )}
                        </button>
                    </div>

                    {formData.password && (
                        <div className="mt-2 space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-3">
                            <p className="mb-2 text-xs font-medium text-[var(--color-text-alt)]">
                                {t('auth.password.requirements')}
                            </p>

                            <div className="flex items-center gap-2 text-xs">
                                {passwordValidations.minLength ? (
                                    <CheckCircle className="size-3.5 text-emerald-400" />
                                ) : (
                                    <XCircle className="size-3.5 text-zinc-600" />
                                )}
                                <span
                                    className={
                                        passwordValidations.minLength
                                            ? 'text-[var(--color-text)]'
                                            : 'text-[var(--color-text-alt)]'
                                    }
                                >
                                    {t('auth.password.min')}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                                {passwordValidations.hasUpperCase ? (
                                    <CheckCircle className="size-3.5 text-emerald-400" />
                                ) : (
                                    <XCircle className="size-3.5 text-[var(--color-text-alt)]" />
                                )}
                                <span
                                    className={
                                        passwordValidations.hasUpperCase
                                            ? 'text-[var(--color-text)]'
                                            : 'text-[var(--color-text-alt)]'
                                    }
                                >
                                    {t('auth.password.uppercase')}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                                {passwordValidations.hasNumber ? (
                                    <CheckCircle className="size-3.5 text-emerald-400" />
                                ) : (
                                    <XCircle className="size-3.5 text-[var(--color-text-alt)]" />
                                )}
                                <span
                                    className={
                                        passwordValidations.hasNumber
                                            ? 'text-[var(--color-text)]'
                                            : 'text-[var(--color-text-alt)]'
                                    }
                                >
                                    {t('auth.password.number')}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                                {passwordValidations.hasSpecialChar ? (
                                    <CheckCircle className="size-3.5 text-emerald-400" />
                                ) : (
                                    <XCircle className="size-3.5 text-[var(--color-text-alt)]" />
                                )}
                                <span
                                    className={
                                        passwordValidations.hasSpecialChar
                                            ? 'text-[var(--color-text)]'
                                            : 'text-[var(--color-text-alt)]'
                                    }
                                >
                                    {t('auth.password.special')}
                                </span>
                            </div>

                            <div className="mt-3">
                                <div className="mb-1 flex items-center gap-1.5">
                                    <span className="text-xs text-[var(--color-text-alt)]">
                                        {t('auth.password.strength')}
                                    </span>
                                    <span
                                        className={`text-xs font-medium ${
                                            Object.values(passwordValidations).filter(
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
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
                                    <div
                                        className={`h-full transition-all duration-300 ${
                                            Object.values(passwordValidations).filter(
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
                        className="mt-1 size-3.5 rounded border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-purple)] focus:ring-[var(--color-purple)] focus:ring-offset-0"
                    />
                    <label htmlFor="terms" className="text-xs text-[var(--color-text-alt)]">
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
                    className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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

                <p className="text-center text-sm text-[var(--color-text-alt)]">
                    {t('auth.signup.have_account')}{' '}
                    <button
                        type="button"
                        onClick={() => onSwitchStep('login')}
                        className="font-medium text-[var(--color-purple)] transition-colors hover:opacity-80"
                    >
                        {t('auth.signup.login')}
                    </button>
                </p>
            </form>
        </div>

        {modalOpen && <TermsModal type={modalOpen} onClose={() => setModalOpen(null)} />}
    </>
    );
};
