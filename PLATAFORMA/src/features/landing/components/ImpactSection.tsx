import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '../../../contexts/LanguageContext';
import { prefersReducedMotion } from '../utils/motion';

gsap.registerPlugin(ScrollTrigger);

const STAT_KEYS = [
    { num: 'impact.stat1.number', suf: 'impact.stat1.suffix', label: 'impact.stat1.label', color: 'var(--color-pink)' },
    { num: 'impact.stat2.number', suf: 'impact.stat2.suffix', label: 'impact.stat2.label', color: 'var(--color-purple)' },
    { num: 'impact.stat3.number', suf: 'impact.stat3.suffix', label: 'impact.stat3.label', color: 'var(--color-cyan)' },
    { num: 'impact.stat4.number', suf: 'impact.stat4.suffix', label: 'impact.stat4.label', color: 'var(--color-green)' },
];

export const ImpactSection: React.FC = () => {
    const { t } = useLanguage();
    const sectionRef = useRef<HTMLElement>(null);
    const statRefs = useRef<(HTMLSpanElement | null)[]>([]);

    useEffect(() => {
        if (prefersReducedMotion()) {
            statRefs.current.forEach((el, i) => {
                if (!el) return;
                const targetNum = parseFloat(t(STAT_KEYS[i].num));
                if (!Number.isNaN(targetNum)) el.textContent = String(Math.round(targetNum));
            });
            return;
        }
        const ctx = gsap.context(() => {
            // Reveal title/text
            gsap.fromTo('.impact-header',
                { y: 40, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: 'power3.out',
                    scrollTrigger: { trigger: sectionRef.current, start: 'top 65%', once: true } }
            );

            // Animated counters
            statRefs.current.forEach((el, i) => {
                if (!el) return;
                const targetNum = parseFloat(t(STAT_KEYS[i].num));
                if (isNaN(targetNum)) return;
                const proxy = { val: 0 };
                gsap.to(proxy, {
                    val: targetNum,
                    duration: 2,
                    ease: 'power2.out',
                    scrollTrigger: { trigger: el, start: 'top 80%', once: true },
                    onUpdate: () => { if (el) el.textContent = Math.round(proxy.val).toString(); }
                });
            });

            // Card reveals
            gsap.fromTo('.impact-card',
                { y: 50, opacity: 0, scale: 0.95 },
                { y: 0, opacity: 1, scale: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out',
                    scrollTrigger: { trigger: sectionRef.current, start: 'top 60%', once: true } }
            );
        }, sectionRef);
        return () => ctx.revert();
    }, [t]);

    return (
        <section
            ref={sectionRef}
            id="impacto"
            className="relative overflow-x-clip py-16 sm:py-24 md:py-36"
            style={{ background: 'var(--color-bg)' }}
        >
            {/* Background accent */}
            <div className="pointer-events-none absolute inset-0" aria-hidden>
                <div className="float-accent absolute -left-48 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full opacity-10 blur-3xl" style={{ background: 'var(--color-purple)' }} />
            </div>

            <div className="landing-container relative mx-auto w-full max-w-[1240px] px-4 sm:px-6">
                {/* Header */}
                <div className="mb-12 max-w-3xl sm:mb-20">
                    <p className="impact-header mb-4 text-xs font-black uppercase tracking-[0.25em]" style={{ color: 'var(--color-pink)' }}>
                        {t('impact.label')}
                    </p>
                    <h2 className="impact-header landing-heading mb-6 text-[clamp(2rem,5vw,4rem)] leading-tight tracking-tighter" style={{ color: 'var(--color-text)' }}>
                        {t('impact.title')}
                    </h2>
                    <p className="impact-header max-w-xl text-lg font-medium leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                        {t('impact.subtitle')}
                    </p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4">
                    {STAT_KEYS.map((stat, i) => (
                        <div
                            key={stat.num}
                            className="impact-card relative overflow-hidden rounded-2xl p-4 sm:rounded-[1.5rem] sm:p-5 md:rounded-[2rem] md:p-8"
                            style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}
                        >
                            {/* Accent corner */}
                            <div className="absolute top-0 right-0 size-24 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2 blur-2xl" style={{ background: stat.color }} />

                            <div className="relative">
                                <div className="mb-2 text-[clamp(2.5rem,5vw,4rem)] font-black leading-none tracking-tighter" style={{ color: stat.color }}>
                                    <span ref={el => { statRefs.current[i] = el; }}>0</span>
                                    <span className="text-[0.5em] font-black">{t(stat.suf)}</span>
                                </div>
                                <p className="text-[0.65rem] font-bold uppercase tracking-wide sm:text-sm sm:tracking-wider" style={{ color: 'var(--color-text-alt)' }}>
                                    {t(stat.label)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
