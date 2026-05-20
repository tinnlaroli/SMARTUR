import { useEffect, useState } from 'react';
import { authApi } from '../authApi';
import type { ResetPasswordPayload } from '../types';
import { KeyRound, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '../../../shared/context/ToastContext';
import type { AuthStep } from '../context/AuthModalContext';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ResetPasswordViewProps {
    email: string;
    onSwitchStep: (step: AuthStep) => void;
}

export const ResetPasswordView = ({ email, onSwitchStep }: ResetPasswordViewProps) => {
    const toast = useToast();
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState<ResetPasswordPayload>({
        email: email || '',
        token: '',
        newPassword: '',
    });

    useEffect(() => {
        if (!email) {
            onSwitchStep('forgotPassword');
        }
    }, [email, onSwitchStep]);

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await authApi.resetPassword(formData);
            toast.success(t('auth.resetPassword.success.title'), t('auth.resetPassword.success.body'));
            setTimeout(() => onSwitchStep('login'), 2000);
        } catch (error) {
            toast.error(t('auth.resetPassword.error.title'), t('auth.resetPassword.error.body'));
        } finally {
            setIsLoading(false);
        }
    };

    if (!email) return null;

    return (
        <div className="w-full">
            <button
                onClick={() => onSwitchStep('forgotPassword')}
                className="group mb-6 flex items-center gap-1 text-xs transition-colors nav-item-idle"
            >
                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>{t('auth.resetPassword.back')}</span>
            </button>

            <div className="mb-6 flex justify-center">
                <div className="flex size-12 items-center justify-center rounded-full" style={{ background: 'rgba(var(--rgb-purple-accent),0.1)' }}>
                    <KeyRound className="size-6" style={{ color: 'var(--color-purple)' }} />
                </div>
            </div>

            <div className="mb-8 text-center">
                <h2 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
                    {t('auth.resetPassword.title')}
                </h2>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-alt)' }}>
                    {t('auth.resetPassword.subtitle.prefix')}{' '}
                    <span className="font-medium" style={{ color: 'var(--color-purple)' }}>{formData.email}</span>{' '}
                    {t('auth.resetPassword.subtitle.suffix')}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                    <label
                        htmlFor="token"
                        className="text-xs font-medium tracking-wider uppercase"
                        style={{ color: 'var(--color-text-alt)' }}
                    >
                        {t('auth.resetPassword.token.label')}
                    </label>
                    <div className="relative">
                        <input
                            id="token"
                            type="text"
                            name="token"
                            required
                            value={formData.token}
                            onChange={handleFieldChange}
                            placeholder={t('auth.resetPassword.token.placeholder')}
                            className="w-full rounded-lg border py-2.5 pr-4 pl-9 text-sm transition-colors focus:outline-none"
                            style={{
                                borderColor: 'var(--color-border)',
                                background: 'var(--color-bg)',
                                color: 'var(--color-text)',
                            }}
                            onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-purple)')}
                            onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                        />
                        <KeyRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2" style={{ color: 'var(--color-text-alt)' }} />
                    </div>
                    <p className="mt-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                        {t('auth.resetPassword.token.hint')}
                    </p>
                </div>

                <div className="space-y-1.5">
                    <label
                        htmlFor="newPassword"
                        className="text-xs font-medium tracking-wider uppercase"
                        style={{ color: 'var(--color-text-alt)' }}
                    >
                        {t('auth.resetPassword.password.label')}
                    </label>
                    <div className="relative">
                        <input
                            id="newPassword"
                            type={showPassword ? 'text' : 'password'}
                            name="newPassword"
                            required
                            value={formData.newPassword}
                            onChange={handleFieldChange}
                            placeholder="………………"
                            minLength={8}
                            className="w-full rounded-lg border py-2.5 pr-16 pl-9 text-sm transition-colors focus:outline-none"
                            style={{
                                borderColor: 'var(--color-border)',
                                background: 'var(--color-bg)',
                                color: 'var(--color-text)',
                            }}
                            onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-purple)')}
                            onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                        />
                        <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2" style={{ color: 'var(--color-text-alt)' }} />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-xs transition-colors"
                            style={{ color: 'var(--color-purple)' }}
                        >
                            {showPassword ? t('auth.resetPassword.password.hide') : t('auth.resetPassword.password.show')}
                        </button>
                    </div>
                    <p className="mt-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                        {t('auth.resetPassword.password.hint')}
                    </p>
                </div>

                {formData.newPassword && (
                    <div className="space-y-1.5 rounded-lg border p-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                        <p className="mb-2 text-xs font-medium" style={{ color: 'var(--color-text-alt)' }}>
                            {t('auth.resetPassword.requirements')}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                            <CheckCircle className={`size-3 ${formData.newPassword.length >= 8 ? 'text-emerald-400' : 'text-zinc-600'}`} />
                            <span className={formData.newPassword.length >= 8 ? 'text-emerald-400' : ''} style={formData.newPassword.length >= 8 ? {} : { color: 'var(--color-text-alt)' }}>
                                {t('auth.resetPassword.min')}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <CheckCircle className={`size-3 ${/[A-Z]/.test(formData.newPassword) ? 'text-emerald-400' : 'text-zinc-600'}`} />
                            <span className={/[A-Z]/.test(formData.newPassword) ? 'text-emerald-400' : ''} style={/[A-Z]/.test(formData.newPassword) ? {} : { color: 'var(--color-text-alt)' }}>
                                {t('auth.resetPassword.uppercase')}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <CheckCircle className={`size-3 ${/[a-z]/.test(formData.newPassword) ? 'text-emerald-400' : 'text-zinc-600'}`} />
                            <span className={/[a-z]/.test(formData.newPassword) ? 'text-emerald-400' : ''} style={/[a-z]/.test(formData.newPassword) ? {} : { color: 'var(--color-text-alt)' }}>
                                {t('auth.resetPassword.lowercase')}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <CheckCircle className={`size-3 ${/[0-9]/.test(formData.newPassword) ? 'text-emerald-400' : 'text-zinc-600'}`} />
                            <span className={/[0-9]/.test(formData.newPassword) ? 'text-emerald-400' : ''} style={/[0-9]/.test(formData.newPassword) ? {} : { color: 'var(--color-text-alt)' }}>
                                {t('auth.resetPassword.number')}
                            </span>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: 'var(--color-purple)' }}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            <span>{t('auth.resetPassword.submitting')}</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                            <Lock className="size-4" />
                            <span>{t('auth.resetPassword.submit')}</span>
                        </div>
                    )}
                </button>
            </form>
        </div>
    );
};
