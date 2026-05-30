import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { prefersReducedMotion } from '../utils/motion';

gsap.registerPlugin(ScrollTrigger);

interface StatementsProps { handleStartExperience?: () => void; }

function rotateSquarePercent(angle: number, sizePercent: number, w: number, h: number) {
    const square = [{ x: -0.5, y: -0.5 }, { x: 0.5, y: -0.5 }, { x: 0.5, y: 0.5 }, { x: -0.5, y: 0.5 }];
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const sz = sizePercent * (w < h ? w / 100 : h / 100);
    return square.map(p => {
        const rx = p.x * sz * cos - p.y * sz * sin;
        const ry = p.x * sz * sin + p.y * sz * cos;
        return { x: 50 + (rx / w) * 100, y: 50 + (ry / h) * 100 };
    });
}

export const Statements: React.FC<StatementsProps> = ({ handleStartExperience }) => {
    const { t } = useLanguage();
    const innerRef = useRef<HTMLDivElement>(null);

    const SECTIONS = [
        {
            id: 'hook',
            label: () => t('story.hook.label'),
            title: () => t('story.hook.title'),
            text: () => t('story.hook.text'),
            bg: 'var(--color-bg)',
            textColor: 'var(--color-text)',
            accentColor: 'var(--color-purple)',
            labelColor: 'var(--color-purple)',
            isVivid: false,
        },
        {
            id: 'conflict',
            label: () => t('story.conflict.label'),
            title: () => t('story.conflict.title'),
            text: () => t('story.conflict.text'),
            bg: 'var(--color-pink)',
            textColor: 'var(--color-text-on-vivid)',
            accentColor: 'rgba(255,255,255,0.9)',
            labelColor: 'rgba(255,255,255,0.65)',
            isVivid: true,
        },
        {
            id: 'guide',
            label: () => t('story.guide.label'),
            title: () => t('story.guide.title'),
            text: () => t('story.guide.text'),
            bg: 'var(--color-cyan)',
            textColor: 'var(--color-text-on-vivid)',
            accentColor: 'rgba(255,255,255,0.9)',
            labelColor: 'rgba(255,255,255,0.65)',
            isVivid: true,
        },
        {
            id: 'cta',
            label: () => t('story.cta.label'),
            title: () => t('story.cta.title'),
            text: () => t('story.cta.text'),
            bg: 'var(--color-bg)',
            textColor: 'var(--color-text)',
            accentColor: 'var(--color-purple)',
            labelColor: 'var(--color-purple)',
            isVivid: false,
        },
    ];

    useEffect(() => {
        const inner = innerRef.current;
        if (!inner) return;
        if (prefersReducedMotion()) return;

        const panels = Array.from(inner.querySelectorAll<HTMLElement>('.st-panel'));
        const sizes = [window.innerWidth, window.innerHeight];
        const initRotation = 35;
        const theta = (initRotation * Math.PI) / 180;
        const factor = (Math.abs(Math.cos(theta)) + Math.abs(Math.sin(theta))) *
            (window.innerHeight > window.innerWidth ? 1.8 : 1.0);

        // Stack all panels absolutely — CSS already positions them, GSAP just adjusts z-index
        panels.forEach((el, i) => {
            gsap.set(el, {
                zIndex: panels.length - i, // panel 0 on top
                clipPath: 'none',
            });
        });

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: inner,
                pin: true,
                scrub: true,
                start: 'top top',
                end: () => `+=${window.innerHeight * (window.innerWidth < 1024 ? 2 : 3)}`,
                invalidateOnRefresh: true,
                onRefresh: () => { sizes[0] = window.innerWidth; sizes[1] = window.innerHeight; },
            },
        });

        // For each panel except the last: animate clip-path shrinking to reveal next panel
        panels.forEach((el, i) => {
            if (i === panels.length - 1) return; // ignoreLast — stays fully visible at bottom

            const p = { prog: 0 };
            tl.fromTo(p, { prog: 0 }, {
                prog: 1,
                duration: 1,
                ease: 'none',
                onUpdate() {
                    const progress = p.prog;
                    const [ww, wh] = sizes;
                    const angle = initRotation + progress * 75;
                    const maxSide = Math.max(ww, wh) * factor;
                    const initSize = (maxSide / Math.min(ww, wh)) * 100;
                    const sizePercent = initSize * (1 - progress);
                    const rotated = rotateSquarePercent(angle, sizePercent, ww, wh);
                    el.style.clipPath = `polygon(${rotated.map(pt => `${pt.x}% ${pt.y}%`).join(', ')})`;
                }
            });
        });

        return () => {
            tl.kill();
            ScrollTrigger.getAll().forEach(st => st.kill());
        };
    }, []);

    return (
        <div className="sy-statements relative z-10">
            {/*
              .sy-rect-inner: height 100dvh, position relative, overflow hidden.
              All panels are absolute full-size, stacked via CSS z-index set by GSAP.
              Clip-path animation acts as a rotating-square "curtain" that peels away the top panel
              to reveal the one below — no opacity juggling needed.
            */}
            <div
                ref={innerRef}
                className="sy-rect-inner"
                style={{ position: 'relative', height: '100dvh', minHeight: 'clamp(500px, 100dvh, 100dvh)', overflow: 'hidden' }}
            >
                {SECTIONS.map((section, idx) => (
                    <div
                        key={section.id}
                        className="st-panel absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
                        style={{
                            background: section.bg,
                            color: section.textColor,
                        }}
                    >
                        <div className="flex flex-col items-center" style={{ maxWidth: '62rem', width: '100%' }}>

                            {/* Title */}
                            <h2
                                className="landing-heading mb-6 font-black uppercase text-center"
                                style={{
                                    fontSize: 'clamp(2.8rem, 7.5vw, 7rem)',
                                    lineHeight: 1.05,
                                    letterSpacing: '-0.035em',
                                    color: section.textColor,
                                }}
                            >
                                {section.title().split('\n').map((line, i) => (
                                    <React.Fragment key={i}>
                                        {i === 0
                                            ? line
                                            : (
                                                <>
                                                    <br />
                                                    <span style={{ color: section.accentColor }}>
                                                        {line}
                                                    </span>
                                                </>
                                            )
                                        }
                                    </React.Fragment>
                                ))}
                            </h2>

                            {/* Body */}
                            <p
                                className="text-center font-medium"
                                style={{
                                    fontSize: 'clamp(1.05rem, 2.2vw, 1.3rem)',
                                    lineHeight: 1.7,
                                    color: section.textColor,
                                    opacity: section.isVivid ? 0.88 : 0.72,
                                    maxWidth: '52ch',
                                }}
                            >
                                {section.text()}
                            </p>

                            {/* CTA — último panel */}
                            {idx === SECTIONS.length - 1 && handleStartExperience && (
                                <div style={{ marginTop: '3rem', display: 'inline-block' }}>
                                    <button
                                        type="button"
                                        onClick={handleStartExperience}
                                        className="btn-premium group"
                                    >
                                        <span>
                                            <span
                                                className="btn-base gap-3 px-10 py-5 text-lg font-bold"
                                                style={{ '--bg-color': 'var(--color-pink)' } as React.CSSProperties}
                                            >
                                                {t('story.cta.button')}
                                                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                                            </span>
                                            <span
                                                className="btn-hover gap-3 px-10 py-5 text-lg font-bold"
                                                aria-hidden
                                                style={{ '--hover-text': 'var(--color-pink)' } as React.CSSProperties}
                                            >
                                                {t('story.cta.button')}
                                                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                                            </span>
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
