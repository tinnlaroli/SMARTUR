import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Quote } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { prefersReducedMotion } from '../utils/motion';

gsap.registerPlugin(ScrollTrigger);

const TESTIMONIAL_KEYS = [
    { name: 'testimonials.item1.name', role: 'testimonials.item1.role', text: 'testimonials.item1.content', avatar: '🏔️' },
    { name: 'testimonials.item2.name', role: 'testimonials.item2.role', text: 'testimonials.item2.content', avatar: '☕' },
    { name: 'testimonials.item3.name', role: 'testimonials.item3.role', text: 'testimonials.item3.content', avatar: '🌿' },
];

export const Testimonials: React.FC = () => {
    const { t } = useLanguage();
    const sectionRef = useRef<HTMLElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const [activeDot, setActiveDot] = useState(0);

    useEffect(() => {
        if (prefersReducedMotion()) return;
        const ctx = gsap.context(() => {
            gsap.fromTo('.testimonial-card',
                { y: 50, opacity: 0 },
                {
                    y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out',
                    scrollTrigger: { trigger: sectionRef.current, start: 'top 60%', once: true }
                }
            );
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    // Sync dot indicator with mobile horizontal scroll
    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        let rafId = 0;
        const onScroll = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                const cards = Array.from(track.querySelectorAll<HTMLElement>('.testimonial-card'));
                const center = track.scrollLeft + track.clientWidth / 2;
                let closest = 0;
                let minDist = Infinity;
                cards.forEach((card, i) => {
                    const dist = Math.abs((card.offsetLeft + card.offsetWidth / 2) - center);
                    if (dist < minDist) { minDist = dist; closest = i; }
                });
                setActiveDot(closest);
            });
        };

        track.addEventListener('scroll', onScroll, { passive: true });
        return () => track.removeEventListener('scroll', onScroll);
    }, []);

    const scrollToCard = (index: number) => {
        const track = trackRef.current;
        if (!track) return;
        const card = track.querySelectorAll<HTMLElement>('.testimonial-card')[index];
        card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    };

    return (
        <section ref={sectionRef} id="testimonios" className="py-24 md:py-36" style={{ background: 'var(--color-bg)' }}>
            <div className="mx-auto max-w-[1240px] px-6">
                <div className="mb-16 text-center">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.25em]" style={{ color: 'var(--color-pink)' }}>
                        {t('testimonials.label')}
                    </p>
                    <h2 className="landing-heading text-[clamp(2rem,5vw,4rem)] tracking-tighter" style={{ color: 'var(--color-text)' }}>
                        {t('testimonials.title')}
                    </h2>
                </div>

                {/* Grid on md+, horizontal scroll on mobile */}
                <div
                    ref={trackRef}
                    data-testimonial-track
                    className="grid gap-6 md:grid-cols-3 max-[767px]:flex max-[767px]:flex-row max-[767px]:overflow-x-auto max-[767px]:snap-x max-[767px]:snap-mandatory max-[767px]:pb-4 max-[767px]:-mx-6 max-[767px]:px-0"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {TESTIMONIAL_KEYS.map((item, i) => (
                        <article
                            key={item.name}
                            className="testimonial-card group relative overflow-hidden rounded-[2rem] p-8 max-[767px]:flex-none max-[767px]:w-[80vw] max-[767px]:snap-center"
                            style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}
                        >
                            <div
                                className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                                style={{ background: 'rgba(var(--rgb-pink-primary), 0.08)' }}
                            />

                            <Quote className="mb-6 size-8 opacity-20" style={{ color: 'var(--color-pink)' }} />

                            <p className="mb-8 text-base leading-relaxed font-medium" style={{ color: 'var(--color-text-alt)' }}>
                                "{t(item.text)}"
                            </p>

                            <div className="flex items-center gap-4">
                                <div className="flex size-12 items-center justify-center rounded-full text-2xl"
                                    style={{ background: 'var(--color-bg)' }}>
                                    {item.avatar}
                                </div>
                                <div>
                                    <p className="font-bold" style={{ color: 'var(--color-text)' }}>{t(item.name)}</p>
                                    <p className="text-xs font-medium" style={{ color: 'var(--color-text-alt)' }}>{t(item.role)}</p>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Mobile scroll indicator dots */}
                <div className="mt-5 flex items-center justify-center gap-2 md:hidden" aria-hidden="true">
                    {TESTIMONIAL_KEYS.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => scrollToCard(i)}
                            className="h-[6px] rounded-full border-none p-0 transition-all duration-[250ms]"
                            style={{
                                width: activeDot === i ? '20px' : '6px',
                                background: activeDot === i ? 'var(--color-purple)' : 'rgba(var(--rgb-text), 0.2)',
                                transitionTimingFunction: 'var(--ease-out-cubic)',
                            }}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};
