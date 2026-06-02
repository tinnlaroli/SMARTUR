import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { initPhoneScene } from '../../../assets/3D/phone';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { prefersReducedMotion } from '../utils/motion';

interface HeroSectionProps {
    handleStartExperience: () => void;
}

/**
 * Converts a string containing <span style="color:X">text</span> and <br/> segments
 * into React elements, avoiding dangerouslySetInnerHTML.
 */
function renderTitle(raw: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    const tokenRe = /(<span\s+style="color:\s*([^"]+)">([^<]*)<\/span>|<br\s*\/?>)/g;
    let last = 0;
    let match: RegExpExecArray | null;
    let idx = 0;
    while ((match = tokenRe.exec(raw)) !== null) {
        if (match.index > last) {
            parts.push(raw.slice(last, match.index));
        }
        if (match[0].startsWith('<br')) {
            parts.push(<br key={`br-${idx}`} />);
        } else {
            parts.push(
                <span key={idx} style={{ color: match[2].trim() }}>
                    {match[3]}
                </span>,
            );
        }
        idx += 1;
        last = tokenRe.lastIndex;
    }
    if (last < raw.length) {
        parts.push(raw.slice(last));
    }
    return parts;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ handleStartExperience }) => {
    const heroRef = useRef<HTMLDivElement>(null);
    const phoneContainerRef = useRef<HTMLDivElement>(null);
    const [isRevealed, setIsRevealed] = useState(false);

    const { t } = useLanguage();

    const title = t('heroSection.titleHtml');
    const subtitle = t('heroSection.subtitle');

    useEffect(() => {
        const hero = heroRef.current;
        if (!hero) return;

        let heroAnimated = false;

        const animateHero = () => {
            if (heroAnimated) return;
            heroAnimated = true;

            // Respect user's motion preference — skip all JS animation
            if (prefersReducedMotion()) {
                setIsRevealed(true);
                return;
            }

            const titleEl = hero.querySelector('.hero-title') as HTMLElement;
            const subtitleEl = hero.querySelector('.hero-subtitle') as HTMLElement;
            const ctaEl = hero.querySelector('.hero-cta') as HTMLElement;
            const phoneContainer = phoneContainerRef.current;
            const shimmerEl = hero.querySelector('.hero-shimmer') as HTMLElement;
            const ctaShimmerEl = hero.querySelector('.cta-shimmer') as HTMLElement | null;
            const scrollIndicatorEl = hero.querySelector('.scroll-indicator') as HTMLElement;

            const isMobile = !window.matchMedia('(min-width: 768px)').matches;

            // Initial states
            gsap.set([titleEl, subtitleEl, ctaEl], { opacity: 0 });
            if (phoneContainer) gsap.set(phoneContainer, { opacity: 0 });
            if (scrollIndicatorEl) gsap.set(scrollIndicatorEl, { opacity: 0, y: -20 });

            if (titleEl) gsap.set(titleEl, { y: 40 });
            if (subtitleEl) gsap.set(subtitleEl, { y: 30, filter: 'blur(8px)' });
            if (ctaEl) gsap.set(ctaEl, { scale: 0.7 });

            if (phoneContainer) {
                if (!isMobile) {
                    gsap.set(phoneContainer, { x: 80, scale: 0.92 });
                } else {
                    gsap.set(phoneContainer, { y: 30 });
                }
            }

            const tl = gsap.timeline({
                defaults: { ease: 'power3.out' },
                onComplete: () => setIsRevealed(true),
            });

            // Background shimmer
            if (shimmerEl) {
                tl.to(shimmerEl, { opacity: 1, x: '200%', duration: 1.5, ease: 'power2.inOut' }, 0);
                tl.to(shimmerEl, { opacity: 0, duration: 0.5 }, 1.2);
            }

            // Title — animate as a block to preserve all renderTitle() HTML colors
            if (titleEl) {
                tl.to(titleEl, { opacity: 1, y: 0, duration: 0.7 }, 0.1);
            }

            // Subtitle
            if (subtitleEl) {
                tl.to(subtitleEl, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1 }, 0.5);
            }

            // CTA
            if (ctaEl) {
                tl.to(ctaEl, { opacity: 1, scale: 1, duration: 1, ease: 'elastic.out(1, 0.5)' }, 0.7);
                if (ctaShimmerEl) {
                    tl.to(
                        ctaShimmerEl,
                        { left: '150%', duration: 0.8, ease: 'power2.inOut' },
                        1.2,
                    );
                }
            }

            // 3D Phone
            if (phoneContainer) {
                tl.to(
                    phoneContainer,
                    {
                        opacity: 1,
                        x: 0,
                        y: 0,
                        scale: 1,
                        duration: 1.2,
                        ease: 'back.out(1.5)',
                    },
                    0.3,
                );
            }

            // Scroll Indicator Fade In
            if (scrollIndicatorEl) {
                tl.to(scrollIndicatorEl, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, 1.5);
            }
        };

        // Listen for loader completion event
        const handleLoaded = () => animateHero();
        window.addEventListener('smartur:loaded', handleLoaded, { once: true });

        // Fallback: if loader already finished before this mounted (instant navigation)
        if (!document.body.classList.contains('is-loading')) {
            setTimeout(animateHero, 80);
        }

        // Initialize 3D on desktop only — matches lg:flex breakpoint (1024px+)
        let cleanup3D: (() => void) | undefined;
        if (window.matchMedia('(min-width: 768px)').matches && phoneContainerRef.current) {
            try {
                cleanup3D = initPhoneScene(phoneContainerRef.current);
            } catch (e) {
                console.warn('3D Phone init failed:', e);
            }
        }

        return () => {
            window.removeEventListener('smartur:loaded', handleLoaded);
            if (cleanup3D) cleanup3D();
        };
    }, []);

    return (
        <section
            ref={heroRef}
            id="hero"
            className={`sy-hero-home ${isRevealed ? 'hero-revealed' : ''}`}
        >
            {/* Background shimmer */}
            <div
                className="hero-shimmer pointer-events-none absolute inset-0 z-0 -translate-x-full transform opacity-0"
                style={{
                    background:
                        'linear-gradient(120deg, transparent 0%, rgba(var(--rgb-purple-accent), 0.06) 30%, rgba(var(--rgb-pink-primary), 0.08) 50%, rgba(var(--rgb-cyan-accent), 0.06) 70%, transparent 100%)',
                }}
            />


            <div className="hero-container">
                <div className="inner">
                    <div className="content">
                        <h1 className="title hero-title">
                            {renderTitle(title)}
                        </h1>

                        {subtitle ? (
                            <p className="subtitle hero-subtitle">
                                {subtitle}
                            </p>
                        ) : null}

                        <div className="cta-wrapper hero-cta rounded-full">
                            {/* Shimmer overlay — one-time GSAP animation on mount */}
                            <div
                                className="cta-shimmer pointer-events-none absolute top-0 left-[-100%] z-[10] h-full w-[60%] -skew-x-[20deg]"
                                aria-hidden="true"
                                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)' }}
                            />
                            <button
                                onClick={handleStartExperience}
                                className="hero-cta-btn btn-premium group"
                                style={{ '--bg-color': 'var(--color-pink)', '--hover-text': 'var(--color-pink)' } as React.CSSProperties}
                            >
                                <span>
                                    <span className="btn-base gap-3 px-8 py-4 text-base font-bold">
                                        {t('heroSection.cta')}
                                        <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                                    </span>
                                    <span className="btn-hover gap-3 px-8 py-4 text-base font-bold" aria-hidden>
                                        {t('heroSection.cta')}
                                        <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                                    </span>
                                </span>
                            </button>
                        </div>
                    </div>

                    <div
                        ref={phoneContainerRef}
                        className="video-wrapper hero-video-wrap"
                        style={{
                            maskImage:
                                'radial-gradient(ellipse 92% 92% at center, black 40%, rgba(0,0,0,0.95) 60%, rgba(0,0,0,0.75) 75%, rgba(0,0,0,0.3) 88%, transparent 100%)',
                            WebkitMaskImage:
                                'radial-gradient(ellipse 92% 92% at center, black 40%, rgba(0,0,0,0.95) 60%, rgba(0,0,0,0.75) 75%, rgba(0,0,0,0.3) 88%, transparent 100%)',
                        }}
                    />
                </div>
            </div>

            {/* Scroll Indicator */}
            <button
                type="button"
                className="scroll-indicator absolute bottom-8 left-1/2 z-50 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-2 border-none bg-transparent p-0"
                onClick={() => {
                    const nextSection = document.getElementById('como-funciona');
                    if (nextSection) {
                        nextSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }}
            >
                <span className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--color-text-alt)' }}>{t('heroSection.scrollIndicator')}</span>
                <ChevronDown className="size-8 scroll-indicator-animate" style={{ color: 'var(--color-pink)' }} strokeWidth={2.5} />
            </button>
        </section>
    );
};
