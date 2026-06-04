import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, X, ChevronRight, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../utils/motion';
import { api } from '../../../shared/api/axiosClient';
import { isValidEmail } from '../../../shared/contact';

gsap.registerPlugin(ScrollTrigger);

/** Motivos visibles en la landing — enfoque turista */
const REASON_KEYS = [
    'contact.reason.tourist',
    'contact.reason.trip',
    'contact.reason.download',
    'contact.reason.suggestion',
    'contact.reason.pricing',
    'contact.reason.other',
] as const;

type Step = 'email' | 'modal';

export const ContactForm: React.FC = () => {
    const { t } = useLanguage();
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [reason, setReason] = useState('');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const sectionRef = useRef<HTMLElement>(null);

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!isValidEmail(email)) {
            setError(t('contact.invalidEmail'));
            return;
        }
        setStep('modal');
    };

    const handleModalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!reason) {
            setError(t('contact.reasonRequired'));
            return;
        }
        if (message.trim().length < 10) {
            setError(t('contact.messageRequired'));
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/contact', {
                email: email.trim(),
                reason,
                message: message.trim(),
                source: 'plataforma_contact',
            });
            setSubmitted(true);
            setStep('email');
            setEmail('');
            setReason('');
            setMessage('');
        } catch {
            setError(t('contact.error'));
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        const section = sectionRef.current;
        if (!section || prefersReducedMotion()) return;
        const ctx = gsap.context(() => {
            section.querySelectorAll('.reveal-fade-up').forEach((el) => {
                gsap.fromTo(
                    el,
                    { y: 30, opacity: 0 },
                    {
                        y: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
                        scrollTrigger: {
                            trigger: el, start: 'top 90%',
                            toggleActions: 'play none none none', once: true,
                        },
                    },
                );
            });
        }, section);
        return () => ctx.revert();
    }, []);

    const inputClass =
        'w-full rounded-full px-5 py-3 outline-none transition-all duration-300 ease-out placeholder:opacity-60 focus:ring-2 focus:ring-[var(--color-purple)]';
    const inputStyle = {
        background: 'var(--color-bg-alt)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text)',
    };

    return (
        <>
            <section
                ref={sectionRef}
                className="cta-minimal py-16 sm:py-20 md:py-24 lg:py-32"
                style={{ background: 'var(--color-bg)' }}
            >
                <div className="landing-container container mx-auto max-w-7xl px-4 sm:px-6 md:px-12">
                    <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-16 lg:gap-24">

                        {/* Left: title */}
                        <div className="cta-content-left reveal-fade-up">
                            <span
                                className="mb-4 block text-sm font-black tracking-[0.2em] uppercase"
                                style={{ color: 'var(--color-purple)' }}
                            >
                                {t('contact.label')}
                            </span>
                            <h2
                                className="landing-heading text-3xl leading-tight font-black tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
                                style={{ color: 'var(--color-text)' }}
                            >
                                {t('contact.title')}
                            </h2>
                        </div>

                        {/* Right: form or success */}
                        <div className="cta-content-right reveal-fade-up">
                            <p
                                className="mb-6 max-w-md text-base leading-relaxed sm:mb-8 sm:text-lg"
                                style={{ color: 'var(--color-text-alt)' }}
                            >
                                {t('contact.subtitle')}
                            </p>

                            {error && step === 'email' && (
                                <div className="mb-4 flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-pink)' }}>
                                    <AlertCircle className="size-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {submitted ? (
                                <div className="flex flex-col gap-3 py-4 font-semibold" style={{ color: 'var(--color-green)' }}>
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="size-6 shrink-0" />
                                        <span>{t('contact.success')}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSubmitted(false)}
                                        className="w-fit text-xs underline opacity-60 hover:opacity-100"
                                        style={{ color: 'var(--color-text-alt)' }}
                                    >
                                        {t('contact.sendAnother')}
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleEmailSubmit} className="flex w-full max-w-lg flex-col gap-3 sm:flex-row">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={t('contact.email.placeholder')}
                                        required
                                        autoComplete="email"
                                        className={`${inputClass} flex-grow`}
                                        style={inputStyle}
                                    />
                                    <button
                                        type="submit"
                                        className="btn-premium w-full sm:w-auto sm:self-start whitespace-nowrap"
                                    >
                                        <span>
                                            <span
                                                className="btn-base gap-2 px-6 py-2.5 text-sm font-semibold"
                                                style={{ '--bg-color': 'var(--color-pink)' } as React.CSSProperties}
                                            >
                                                {t('contact.email.continue')}
                                                <ChevronRight className="size-4 shrink-0" />
                                            </span>
                                            <span
                                                className="btn-hover gap-2 px-6 py-2.5 text-sm font-semibold"
                                                aria-hidden
                                                style={{ '--hover-text': 'var(--color-pink)' } as React.CSSProperties}
                                            >
                                                {t('contact.email.continue')}
                                                <ChevronRight className="size-4 shrink-0" />
                                            </span>
                                        </span>
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Modal overlay */}
            {step === 'modal' && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
                    onClick={(e) => { if (e.target === e.currentTarget) setStep('email'); }}
                >
                    <div
                        className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl sm:p-8"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                    >
                        {/* Modal header */}
                        <div className="mb-1 flex items-start justify-between">
                            <h3 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                                {t('contact.modal.title')}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setStep('email')}
                                className="ml-4 shrink-0 rounded-lg p-1 opacity-50 transition-opacity hover:opacity-100"
                                style={{ color: 'var(--color-text-alt)' }}
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                        <p className="mb-5 text-sm" style={{ color: 'var(--color-text-alt)' }}>
                            {t('contact.modal.subtitle')}
                        </p>

                        {error && (
                            <div className="mb-4 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>
                                <AlertCircle className="size-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleModalSubmit} className="flex flex-col gap-4">
                            {/* Email */}
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('contact.email.placeholder')}
                                autoComplete="email"
                                className={inputClass}
                                style={inputStyle}
                            />

                            {/* Reason dropdown */}
                            <div className="relative">
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full appearance-none rounded-full py-3 pl-5 pr-10 outline-none transition-all duration-300 focus:ring-2 focus:ring-[var(--color-purple)]"
                                    style={inputStyle}
                                >
                                    <option value="" disabled>{t('contact.reason.placeholder')}</option>
                                    {REASON_KEYS.map((key) => (
                                        <option key={key} value={t(key)}>{t(key)}</option>
                                    ))}
                                </select>
                                <ChevronRight
                                    className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 rotate-90 opacity-50"
                                    style={{ color: 'var(--color-text-alt)' }}
                                />
                            </div>

                            {/* Message */}
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={t('contact.message.placeholder')}
                                rows={4}
                                className="w-full resize-y rounded-2xl px-5 py-3 text-sm outline-none transition-all duration-300 placeholder:opacity-60 focus:ring-2 focus:ring-[var(--color-purple)]"
                                style={inputStyle}
                            />

                            {/* Actions */}
                            <div className="mt-1 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setStep('email')}
                                    className="rounded-full border px-5 py-2.5 text-sm font-medium transition-colors"
                                    style={{ color: 'var(--color-text-alt)', borderColor: 'var(--color-border)' }}
                                >
                                    {t('contact.modal.close')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                                    style={{ background: 'var(--color-purple)' }}
                                >
                                    {submitting ? t('contact.sending') : t('contact.cta.button')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};
