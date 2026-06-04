import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '../../../contexts/LanguageContext';

gsap.registerPlugin(ScrollTrigger);

const SLIDES = [
  {
    id: "mission",
    labelKey: "about.slide.mission.label",
    textKey: "about.slide.mission.text"
  },
  {
    id: "vision",
    labelKey: "about.slide.vision.label",
    textKey: "about.slide.vision.text"
  },
  {
    id: "values",
    labelKey: "about.slide.values.label",
    textKey: "about.slide.values.text"
  }
];

const TIMELINE_ITEMS = [
    {
        titleKey: "about.timeline.item1.title",
        textKey: "about.timeline.item1.text"
    },
    {
        titleKey: "about.timeline.item2.title",
        textKey: "about.timeline.item2.text"
    },
    {
        titleKey: "about.timeline.item3.title",
        textKey: "about.timeline.item3.text"
    },
    {
        titleKey: "about.timeline.item4.title",
        textKey: "about.timeline.item4.text"
    }
];

export const About: React.FC = () => {
    const { t } = useLanguage();
    const sectionRef = useRef<HTMLDivElement>(null);
    const [activeSlide, setActiveSlide] = useState(0);
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % SLIDES.length);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        // Reveal for header and label
        const revealElements = section.querySelectorAll('[data-reveal]');
        revealElements.forEach((el) => {
            gsap.fromTo(el, 
                { y: 30, opacity: 0 },
                { 
                    y: 0, 
                    opacity: 1, 
                    duration: 1, 
                    scrollTrigger: {
                        trigger: el,
                        start: "top 85%",
                        toggleActions: "play none none none"
                    }
                }
            );
        });

        // Sticky Timeline Logic
        const items = section.querySelectorAll('.step-item');
        let mm = gsap.matchMedia();

        mm.add("(min-width: 1024px)", () => {
            ScrollTrigger.create({
                trigger: section,
                start: "top top",
                end: () => `+=${window.innerHeight * 2.5}`,
                pin: true,
                scrub: true,
                onUpdate: (self) => {
                    const index = Math.min(Math.floor(self.progress * items.length), items.length - 1);
                    setActiveStep(index);
                }
            });
        });

        mm.add("(max-width: 1023px)", () => {
            ScrollTrigger.create({
                trigger: section,
                start: "top center",
                end: "bottom center",
                scrub: true,
                onUpdate: (self) => {
                    const index = Math.min(Math.floor(self.progress * items.length), items.length - 1);
                    setActiveStep(index);
                }
            });
        });

        return () => {
            mm.revert();
            ScrollTrigger.getAll().forEach(t => {
                if (t.trigger === section) t.kill();
            });
        };
    }, []);

    return (
        <section ref={sectionRef} id="nosotros" className="sy-about relative flex min-h-0 items-center overflow-x-clip py-16 sm:py-20 lg:min-h-screen lg:py-20" style={{ background: 'var(--color-bg)' }}>
            {/* Background accents */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                <div className="absolute -left-32 top-1/4 h-[280px] w-[280px] rounded-full opacity-[0.05] blur-[80px] sm:h-[400px] sm:w-[400px] sm:blur-[100px] lg:h-[500px] lg:w-[500px] lg:blur-[120px]" style={{ background: 'var(--color-purple)' }} />
                <div className="absolute -right-32 bottom-1/4 h-[240px] w-[240px] rounded-full opacity-[0.05] blur-[80px] sm:h-[350px] sm:w-[350px] lg:h-[450px] lg:w-[450px] lg:blur-[100px]" style={{ background: 'var(--color-green)' }} />
            </div>

            <div className="landing-container container mx-auto w-full max-w-[1240px] px-4 sm:px-6">
                <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-2 md:gap-12 lg:gap-20">
                    
                    {/* Left Column */}
                    <div className="content-column">
                        <div className="section-label flex items-center gap-4 mb-8" data-reveal>
                            <span className="label-line w-12 h-[2px]" style={{ background: 'var(--color-purple)' }} />
                            <span className="label-text text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--color-purple)' }}>{t('about.sectionLabel')}</span>
                        </div>

                        <h2 className="landing-heading mb-6 text-[clamp(2rem,6vw,4.5rem)] font-black leading-tight lg:text-7xl" style={{ color: 'var(--color-text)' }} data-reveal>
                            {t('about.headingPrefix')}<span style={{ color: 'var(--color-purple)' }}>{t('about.headingHighlight')}</span>
                        </h2>

                        <p className="text-lg md:text-xl mb-12 max-w-2xl leading-relaxed" style={{ color: 'var(--color-text-alt)' }} data-reveal>
                            {t('about.subtitle')}
                        </p>

                        {/* Award Seal */}
                        <div className="award-seal mb-12 flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-start sm:gap-6 sm:p-6" 
                            style={{ background: 'rgba(163, 209, 79, 0.05)', border: '1px solid rgba(163, 209, 79, 0.2)' }} 
                            data-reveal
                        >
                            <div className="seal-badge flex flex-col items-center gap-2">
                                <svg className="size-10" style={{ color: 'var(--color-green)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                </svg>
                                <span className="text-[10px] font-black uppercase" style={{ color: 'var(--color-green)' }}>{t('about.award.badge')}</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>{t('about.award.title')}</h3>
                                <span className="text-sm font-black" style={{ color: 'var(--color-text-alt)' }}>{t('about.award.year')}</span>
                            </div>
                        </div>

                        {/* Mission Carousel */}
                        <div className="mission-carousel relative grid grid-cols-1 min-h-[120px]">
                            {SLIDES.map((slide, i) => (
                                <div 
                                    key={slide.id} 
                                    className={`mission-slide col-start-1 row-start-1 border-l-4 pl-6 transition-all duration-700 ease-in-out ${i === activeSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
                                    style={{ borderColor: i === 0 ? 'var(--color-green)' : i === 1 ? 'var(--color-purple)' : 'var(--color-pink)' }}
                                >
                                    <h3 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: i === 0 ? 'var(--color-green)' : i === 1 ? 'var(--color-purple)' : 'var(--color-pink)' }}>
                                        {t(slide.labelKey)}
                                    </h3>
                                    <p className="leading-relaxed font-medium" style={{ color: 'var(--color-text-alt)' }}>
                                        {t(slide.textKey)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Stepper Timeline */}
                    <div className="stepper-column py-4 sm:py-8 lg:py-12">
                        <div className="relative ml-2 border-l-2 pl-6 sm:ml-4 sm:pl-8" style={{ borderColor: 'var(--color-border)' }}>
                            {TIMELINE_ITEMS.map((item, i) => (
                                <div
                                    key={item.titleKey}
                                    className={`step-item relative mb-8 transition-all duration-700 last:mb-0 sm:mb-12 ${i === activeStep ? 'opacity-100 scale-100' : 'opacity-30 scale-95'}`}
                                >
                                    {/* Dot Indicator */}
                                    <div
                                        className={`absolute -left-[31px] top-2 size-4 rounded-full border-2 transition-all duration-300 sm:-left-[39px] ${i === activeStep ? 'scale-125' : ''}`}
                                        style={i === activeStep
                                            ? { background: 'var(--color-purple)', borderColor: 'var(--color-purple)', boxShadow: '0 0 0 4px rgba(var(--rgb-purple-accent), 0.2)' }
                                            : { background: 'var(--color-bg)', borderColor: 'var(--color-border)' }
                                        }
                                    />
                                    
                                    <div
                                        className={`rounded-2xl border p-4 transition-all duration-500 sm:p-6 ${i === activeStep ? 'shadow-xl' : 'border-transparent'}`}
                                        style={{
                                            background: 'var(--color-bg-alt)',
                                            ...(i === activeStep ? { borderColor: 'rgba(var(--rgb-purple-accent), 0.2)' } : {})
                                        }}
                                    >
                                        <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>{t(item.titleKey)}</h3>
                                        <p className="leading-relaxed text-sm" style={{ color: 'var(--color-text-alt)' }}>{t(item.textKey)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
