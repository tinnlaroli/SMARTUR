import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { initPhoneScene } from '../../../assets/3D/phone';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface HeroSectionProps {
    handleStartExperience: () => void;
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

            const titleEl = hero.querySelector('.hero-title') as HTMLElement;
            const subtitleEl = hero.querySelector('.hero-subtitle') as HTMLElement;
            const ctaEl = hero.querySelector('.hero-cta') as HTMLElement;
            const phoneContainer = phoneContainerRef.current;
            const shimmerEl = hero.querySelector('.hero-shimmer') as HTMLElement;
            const ctaShimmerEl = hero.querySelector('.cta-shimmer') as HTMLElement | null;
            const scrollIndicatorEl = hero.querySelector('.scroll-indicator') as HTMLElement;

            const isMobile = window.matchMedia('(max-width: 767px)').matches;

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

            // Title cascade
            if (titleEl) {
                if (isMobile) {
                    tl.to(titleEl, { opacity: 1, y: 0, duration: 0.6 }, 0.1);
                } else {
                    // Prevent parent from hiding words that will fade in
                    gsap.set(titleEl, { opacity: 1 });
                    
                    // Wrap words for cascade
                    const text = titleEl.innerText;
                    const wordsArr = text.split(/(\s+)/);
                    titleEl.innerHTML = '';
                    wordsArr.forEach((w) => {
                        if (w.trim()) {
                            const span = document.createElement('span');
                            span.className = 'hero-word inline-block perspective-[1000px]';

                            const wl = w.toLowerCase();
                            // Colores de "palabras destacadas" en ES/EN/FR.
                            if (wl.includes('gu├¡a') || wl.includes('guia') || wl.includes('guides') || wl.includes('guide')) span.style.color = '#ff4d8d';
                            if (wl.includes('turismo') || wl.includes('tourism') || wl.includes('tourisme')) span.style.color = '#4db9ca';

                            if (w.includes(',')) {
                                span.innerHTML = w.replace(',', ',<br/>');
                            } else {
                                span.innerText = w;
                            }
                            titleEl.appendChild(span);
                        } else {
                            titleEl.appendChild(document.createTextNode(w));
                        }
                    });

                    const words = titleEl.querySelectorAll('.hero-word');
                    gsap.set(words, { opacity: 0, y: 50, rotateX: 45 });
                    tl.to(
                        words,
                        {
                            opacity: 1,
                            y: 0,
                            rotateX: 0,
                            duration: 0.8,
                            stagger: 0.08,
                            ease: 'back.out(1.2)',
                        },
                        0.1,
                    );
                }
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

        // Global listener for site load - Fallback since we don't have the custom event yet
        setTimeout(animateHero, 1000);

        // Initialize 3D on Desktop only
        let cleanup3D: (() => void) | undefined;
        if (window.matchMedia('(min-width: 768px)').matches && phoneContainerRef.current) {
            try {
                cleanup3D = initPhoneScene(phoneContainerRef.current);
            } catch (e) {
                console.warn('3D Phone init failed:', e);
            }
        }

        return () => {
            if (cleanup3D) cleanup3D();
        };
    }, []);

    return (
        <section
            ref={heroRef}
            id="hero"
            className={`sy-hero-home relative flex min-h-[100dvh] flex-col justify-center overflow-hidden ${isRevealed ? 'hero-revealed' : ''}`}
            style={{ background: 'var(--color-bg)' }}
        >
            {/* Background shimmer */}
            <div
                className="hero-shimmer pointer-events-none absolute inset-0 z-0 -translate-x-full transform opacity-0"
                style={{
                    background:
                        'linear-gradient(120deg, transparent 0%, rgba(var(--rgb-purple-accent), 0.06) 30%, rgba(var(--rgb-pink-primary), 0.08) 50%, rgba(var(--rgb-cyan-accent), 0.06) 70%, transparent 100%)',
                }}
            />

            {/* Background accents */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                <div className="absolute -left-20 top-1/4 h-[400px] w-[400px] rounded-full opacity-[0.07] blur-[100px]" style={{ background: 'var(--color-cyan)' }} />
                <div className="absolute -right-20 bottom-1/4 h-[500px] w-[500px] rounded-full opacity-[0.08] blur-[120px]" style={{ background: 'var(--color-pink)' }} />
            </div>

            <div className="u-container container relative z-10 mx-auto w-full px-4 pt-0">
                <div className="inner flex flex-row items-start justify-between gap-[5rem] pt-[2rem] pb-[4rem] lg:flex-row lg:items-start lg:gap-[4rem] lg:pt-[1.5rem] lg:pb-[3rem] md:flex-col md:items-start md:gap-[4rem] md:pt-[2rem] md:pb-[2rem] max-[767px]:flex-col max-[767px]:items-start max-[767px]:gap-[3rem] max-[767px]:pt-[4rem] max-[767px]:pb-[1rem]">
                    <div className="content z-20 flex-1 max-w-none md:max-w-full">
                        <h1
                            className="u-heading title hero-title mb-0 font-['Outfit'] text-[8.5rem] leading-[0.95] font-black lg:text-[7.2rem] md:text-[5.5rem] max-[767px]:text-[4.5rem]"
                            style={{ color: 'var(--color-text)' }}
                            dangerouslySetInnerHTML={{ __html: title }}
                        />

                        {subtitle ? (
                            <p
                                className="u-text subtitle hero-subtitle mt-[3rem] mb-0 max-w-[32em] text-[1.25rem] leading-[1.65] max-[767px]:text-[1.1rem]"
                                style={{ color: 'var(--color-text-alt)' }}
                            >
                                {subtitle}
                            </p>
                        ) : null}

                        <div className="cta-wrapper hero-cta relative inline-block overflow-hidden mt-[2.75rem]">
                            <button
                                onClick={handleStartExperience}
                                className="cta group relative inline-flex items-center justify-center gap-3 rounded-full bg-[#ff4d8d] px-10 py-5 text-xl font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[#ff4d8d]/90 active:scale-95"
                            >
                                <span>{t('heroSection.cta')}</span>
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </button>

                            <div
                                className="cta-shimmer"
                                aria-hidden="true"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: '-100%',
                                    width: '60%',
                                    height: '100%',
                                    background:
                                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                    transform: 'skewX(-20deg)',
                                    pointerEvents: 'none',
                                    zIndex: 5,
                                }}
                            />
                        </div>
                    </div>

                    <div
                        ref={phoneContainerRef}
                        className="video-wrapper hero-video-wrap relative z-0 hidden aspect-square w-1/2 max-w-[700px] flex-shrink-0 md:flex"
                        style={{
                            maskImage:
                                'radial-gradient(ellipse 92% 92% at center, black 40%, rgba(0,0,0,0.95) 60%, rgba(0,0,0,0) 100%)',
                            WebkitMaskImage:
                                'radial-gradient(ellipse 92% 92% at center, black 40%, rgba(0,0,0,0.95) 60%, rgba(0,0,0,0) 100%)',
                        }}
                    />
                </div>
            </div>

            {/* Scroll Indicator */}
            <div
                className="scroll-indicator absolute bottom-8 left-1/2 z-50 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-2"
                onClick={() => {
                    const nextSection = document.getElementById('como-funciona');
                    if (nextSection) {
                        nextSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }}
            >
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--color-text-alt)' }}>{t('heroSection.scrollIndicator')}</span>
                <ChevronDown className="h-8 w-8 animate-bounce" style={{ color: 'var(--color-pink)' }} strokeWidth={2.5} />
            </div>
        </section>
    );
};
