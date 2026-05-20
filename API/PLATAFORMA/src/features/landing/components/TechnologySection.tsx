import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { UserCircle2, BrainCircuit, Compass } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { prefersReducedMotion } from '../utils/motion';

gsap.registerPlugin(ScrollTrigger);

export const TechnologySection: React.FC = () => {
    const { t } = useLanguage();
    const sectionRef = useRef<HTMLDivElement>(null);

    const STEPS = [
        { title: 'how.step1.title', text: 'how.step1.text', Icon: UserCircle2, color: 'var(--color-pink)', rgb: 'var(--rgb-pink-primary)' },
        { title: 'how.step2.title', text: 'how.step2.text', Icon: BrainCircuit, color: 'var(--color-purple)', rgb: 'var(--rgb-purple-accent)' },
        { title: 'how.step3.title', text: 'how.step3.text', Icon: Compass, color: 'var(--color-cyan)', rgb: 'var(--rgb-cyan-accent)' },
    ];

    useEffect(() => {
        if (prefersReducedMotion()) return;
        const ctx = gsap.context(() => {
            gsap.fromTo('.how-step-row',
                { opacity: 0, x: -32 },
                {
                    opacity: 1, x: 0, duration: 0.85, stagger: 0.18, ease: 'power3.out',
                    scrollTrigger: { trigger: sectionRef.current, start: 'top 65%', once: true },
                }
            );
            gsap.fromTo('.how-section-header',
                { opacity: 0, y: 28 },
                {
                    opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
                    scrollTrigger: { trigger: sectionRef.current, start: 'top 70%', once: true },
                }
            );
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="py-24 md:py-36" style={{ background: 'var(--color-bg)' }}>
            <div className="mx-auto max-w-[1240px] px-6">

                {/* Header */}
                <div className="how-section-header mb-16">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.25em]" style={{ color: 'var(--color-purple)' }}>
                        {t('how.label')}
                    </p>
                    <h2
                        className="landing-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tighter"
                        style={{ color: 'var(--color-text)' }}
                    >
                        {t('how.title')}
                    </h2>
                </div>

                {/* Horizontal step cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
                    {STEPS.map((step, i) => {
                        const Icon = step.Icon;
                        return (
                            <div
                                key={step.title}
                                className="how-step-row group flex flex-col gap-5 rounded-3xl p-8"
                                style={{
                                    background: 'var(--color-bg-alt)',
                                    border: '1px solid var(--color-border)',
                                }}
                            >
                                {/* Icon + step index row */}
                                <div className="flex items-center justify-between">
                                    <div
                                        className="flex size-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                                        style={{ background: `rgba(${step.rgb}, 0.1)` }}
                                    >
                                        <Icon className="size-7" style={{ color: step.color }} />
                                    </div>
                                    <span
                                        className="text-[3rem] font-black leading-none tabular-nums tracking-tighter"
                                        style={{ color: `rgba(${step.rgb}, 0.18)`, fontFamily: 'var(--font-heading)' }}
                                    >
                                        0{i + 1}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3
                                    className="text-xl font-bold leading-snug"
                                    style={{ color: 'var(--color-text)' }}
                                >
                                    {t(step.title)}
                                </h3>

                                {/* Description */}
                                <p
                                    className="text-base font-medium leading-relaxed"
                                    style={{ color: 'var(--color-text-alt)' }}
                                >
                                    {t(step.text)}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
