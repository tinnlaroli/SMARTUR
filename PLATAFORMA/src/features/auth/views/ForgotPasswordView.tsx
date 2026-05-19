import { useState } from 'react';
import type { ForgotPasswordPayload } from '../types';
import { authApi } from '../authApi';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { useToast } from '../../../shared/context/ToastContext';
import type { AuthStep } from '../context/AuthModalContext';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ForgotPasswordViewProps {
    onSwitchStep: (step: AuthStep, email?: string) => void;
}

export const ForgotPasswordView = ({ onSwitchStep }: ForgotPasswordViewProps) => {
    const toast = useToast();
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState<ForgotPasswordPayload>({
        email: '',
    });

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await authApi.forgotPassword(formData);
            toast.success(t('auth.forgot.success.title'), t('auth.forgot.success.body'));
            onSwitchStep('resetPassword', formData.email);
        } catch (error) {
            toast.error(t('auth.forgot.error.title'), t('auth.forgot.error.body'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <button
                onClick={() => onSwitchStep('login')}
                className="group mb-6 flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-zinc-300"
            >
                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>{t('auth.forgot.back')}</span>
            </button>

            <div className="mb-6 flex justify-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-[rgba(var(--rgb-purple-accent),0.1)]">
                    <Mail className="size-6 text-[var(--color-purple)]" />
                </div>
            </div>

            <div className="mb-8 text-center">
                <h2 className="text-2xl font-semibold text-[var(--color-text)]">
                    {t('auth.forgot.title')}
                </h2>
                <p className="mt-2 text-sm text-[var(--color-text-alt)]">
                    {t('auth.forgot.subtitle')}
                </p>
            </div>

            <form onSubmit={handleReset} className="space-y-5">
                <div className="space-y-1.5">
                    <label
                        htmlFor="user-email"
                        className="text-xs font-medium tracking-wider text-[var(--color-text-alt)] uppercase"
                    >
                        {t('auth.forgot.email.label')}
                    </label>
                    <div className="relative">
                        <input
                            id="user-email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleFieldChange}
                            placeholder={t('auth.forgot.email.placeholder')}
                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 pr-4 pl-9 text-sm text-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-alt)] focus:border-[var(--color-purple)] focus:ring-1 focus:ring-[var(--color-purple)] focus:outline-none"
                        />
                        <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-text-alt)]" />
                    </div>
                    <p className="mt-1 text-xs text-[var(--color-text-alt)]">
                        {t('auth.forgot.email.hint')}
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-lg bg-[var(--color-purple)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 focus:ring-2 focus:ring-[var(--color-purple)] focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            <span>{t('auth.forgot.submitting')}</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                            <Send className="size-4" />
                            <span>{t('auth.forgot.submit')}</span>
                        </div>
                    )}
                </button>

                <div className="mt-4 text-center">
                    <p className="text-xs text-[var(--color-text-alt)]">
                        {t('auth.forgot.no_account')}{' '}
                        <button
                            type="button"
                            onClick={() => onSwitchStep('signup')}
                            className="font-medium text-[var(--color-purple)] transition-colors hover:opacity-80"
                        >
                            {t('auth.forgot.register')}
                        </button>
                    </p>
                </div>
            </form>
        </div>
    );
};
