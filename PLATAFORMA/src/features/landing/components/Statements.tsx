import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { prefersReducedMotion } from '../utils/motion';

gsap.registerPlugin(ScrollTrigger);

interface StatementsProps { handleStartExperience?: () => void; }

type StorySection =
    | {
          id: string;
          label: () => string;
          title: () => string;
          text: () => string;
          ambientMode: 'hero' | 'transparent';
          textColor: string;
          accentColor: string;
          labelColor: string;
          isVivid: false;
      }
    | {
          id: string;
          label: () => string;
          title: () => string;
          text: () => string;
          bg: string;
          textColor: string;
          accentColor: string;
          labelColor: string;
          isVivid: boolean;
      };

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

function StoryPanelContent({
    section,
    showCta,
    onStart,
    ctaLabel,
}: {
    section: StorySection;
    showCta?: boolean;
    onStart?: () => void;
    ctaLabel?: string;
}) {
    return (
        <div className="st-panel-content landing-story-content relative z-[1] flex w-full max-w-[62rem] flex-col items-center px-4 sm:px-6">
            <h2
                className="landing-heading mb-6 text-center font-black uppercase"
                style={{
                    fontSize: 'clamp(2.8rem, 7.5vw, 7rem)',
                    lineHeight: 1.05,
                    letterSpacing: '-0.035em',
                    color: section.textColor,
                }}
            >
                {section.title().split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                        {i === 0 ? (
                            line
                        ) : (
                            <>
                                <br />
                                <span style={{ color: section.accentColor }}>{line}</span>
                            </>
                        )}
                    </React.Fragment>
                ))}
            </h2>

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

            {showCta && onStart && ctaLabel ? (
                <div className="mt-8 sm:mt-12 inline-block max-w-full">
                    <button type="button" onClick={onStart} className="btn-premium group max-w-full">
                        <span>
                            <span
                                className="btn-base gap-2 px-6 py-3.5 text-base font-bold sm:gap-3 sm:px-10 sm:py-5 sm:text-lg"
                                style={{ '--bg-color': 'var(--color-pink)' } as React.CSSProperties}
                            >
                                {ctaLabel}
                                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                            </span>
                            <span
                                className="btn-hover gap-2 px-6 py-3.5 text-base font-bold sm:gap-3 sm:px-10 sm:py-5 sm:text-lg"
                                aria-hidden
                                style={{ '--hover-text': 'var(--color-pink)' } as React.CSSProperties}
                            >
                                {ctaLabel}
                                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                            </span>
                        </span>
                    </button>
                </div>
            ) : null}
        </div>
    );
}

export const Statements: React.FC<StatementsProps> = ({ handleStartExperience }) => {
    const { t } = useLanguage();
    const innerRef = useRef<HTMLDivElement>(null);

    const SECTIONS: StorySection[] = [
        {
            id: 'hook',
            label: () => t('story.hook.label'),
            title: () => t('story.hook.title'),
            text: () => t('story.hook.text'),
            ambientMode: 'hero',
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
            ambientMode: 'transparent',
            textColor: 'var(--color-text)',
            accentColor: 'var(--color-purple)',
            labelColor: 'var(--color-purple)',
            isVivid: false,
        },
    ];

    const panelSurfaceClass = (section: StorySection) => {
        if (!('ambientMode' in section)) return '';
        return section.ambientMode === 'hero' ? ' st-panel-hero-surface' : ' landing-ambient-bg';
    };

    useEffect(() => {
        const root = innerRef.current?.closest('.sy-statements');
        if (!root) return;

        const onStoryVisibility = ([entry]: IntersectionObserverEntry[]) => {
            document.documentElement.classList.toggle('story-section-active', entry.isIntersecting);
        };
        const visibilityObserver = new IntersectionObserver(onStoryVisibility, { threshold: 0.08 });
        visibilityObserver.observe(root);

        return () => {
            visibilityObserver.disconnect();
            document.documentElement.classList.remove('story-section-active');
        };
    }, []);

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

        panels.forEach((el, i) => {
            gsap.set(el, {
                zIndex: panels.length - i,
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
                onRefresh: () => {
                    sizes[0] = window.innerWidth;
                    sizes[1] = window.innerHeight;
                },
            },
        });

        panels.forEach((el, i) => {
            if (i === panels.length - 1) return;

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
                },
            });
        });

        return () => {
            tl.kill();
            ScrollTrigger.getAll().forEach(st => st.kill());
        };
    }, []);

    return (
        <div id="historia" className="sy-statements relative z-10 max-w-full overflow-x-clip">
            <div
                ref={innerRef}
                className="sy-rect-inner"
                style={{ position: 'relative', height: '100dvh', minHeight: 'clamp(500px, 100dvh, 100dvh)', overflow: 'hidden' }}
            >
                {SECTIONS.map((section, idx) => (
                    <div
                        key={section.id}
                        data-panel={section.id}
                        className={`st-panel absolute inset-0 flex flex-col items-center justify-center p-4 text-center sm:p-6 md:p-8${panelSurfaceClass(section)}`}
                        style={{
                            ...('ambientMode' in section ? {} : { background: section.bg }),
                            color: section.textColor,
                        }}
                    >
                        <StoryPanelContent
                            section={section}
                            showCta={idx === SECTIONS.length - 1}
                            onStart={handleStartExperience}
                            ctaLabel={t('story.cta.button')}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
