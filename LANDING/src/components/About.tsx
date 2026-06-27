import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface SlideData {
  id: string;
  label: string;
  text: string;
}

interface TimelineItem {
  title: string;
  text: string;
}

interface AboutProps {
  id?: string;
  title: string;
  subtitle?: string;
  sectionLabel: string;
  award: string;
  awardBadge: string;
  awardYear?: string;
  slides: SlideData[];
  description?: string;
  timelineTitle?: string;
  timelineItems?: TimelineItem[];
}

const SLIDE_COLORS: Record<string, string> = {
  mission: 'var(--color-green)',
  vision: 'var(--color-purple)',
  values: 'var(--color-pink)',
};

export function About({
  id = 'about',
  title,
  subtitle,
  sectionLabel,
  award,
  awardBadge,
  awardYear = '2024',
  slides,
  timelineItems,
}: AboutProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

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
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    const items = section.querySelectorAll('.step-item');
    let mm = gsap.matchMedia();

    mm.add('(min-width: 768px)', () => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${window.innerHeight * 2.5}`,
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          const index = Math.min(Math.floor(self.progress * items.length), items.length - 1);
          setActiveStep(index);
        },
      });
    });

    mm.add('(max-width: 767px)', () => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top center',
        end: 'bottom center',
        scrub: true,
        onUpdate: (self) => {
          const index = Math.min(Math.floor(self.progress * items.length), items.length - 1);
          setActiveStep(index);
        },
      });
    });

    return () => {
      mm.revert();
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === section) t.kill();
      });
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id={id}
      className="sy-about relative min-h-screen py-20 flex items-center overflow-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 top-1/4 h-[500px] w-[500px] rounded-full opacity-[0.05] blur-[120px]" style={{ background: 'var(--color-purple)' }} />
        <div className="absolute -right-32 bottom-1/4 h-[450px] w-[450px] rounded-full opacity-[0.05] blur-[100px]" style={{ background: 'var(--color-green)' }} />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div className="content-column">
            <div className="flex items-center gap-4 mb-8" data-reveal>
              <span className="w-12 h-[2px]" style={{ background: 'var(--color-purple)' }} />
              <span
                className="text-xs font-bold tracking-[0.15em] uppercase"
                style={{ color: 'var(--color-purple)' }}
                dangerouslySetInnerHTML={{ __html: sectionLabel }}
              />
            </div>

            <h2
              className="text-4xl md:text-5xl lg:text-7xl font-black mb-6 leading-tight"
              style={{ color: 'var(--color-text)' }}
              data-reveal
              dangerouslySetInnerHTML={{ __html: title }}
            />

            {subtitle ? (
              <p
                className="text-lg md:text-xl mb-12 max-w-2xl leading-relaxed"
                style={{ color: 'var(--color-text-alt)' }}
                data-reveal
                dangerouslySetInnerHTML={{ __html: subtitle }}
              />
            ) : null}

            <div
              className="flex items-start gap-6 mb-12 p-6 rounded-2xl"
              style={{ background: 'rgba(var(--rgb-green-accent), 0.05)', border: '1px solid rgba(var(--rgb-green-accent), 0.2)' }}
              data-reveal
            >
              <div className="flex flex-col items-center gap-2">
                <svg className="size-10" style={{ color: 'var(--color-green)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                <span className="text-[10px] font-black uppercase" style={{ color: 'var(--color-green)' }}>
                  {awardBadge}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }} dangerouslySetInnerHTML={{ __html: award }} />
                <span className="text-sm font-black" style={{ color: 'var(--color-text-alt)' }}>{awardYear}</span>
              </div>
            </div>

            <div className="relative grid grid-cols-1 min-h-[120px]">
              {slides.map((slide, i) => {
                const accent = SLIDE_COLORS[slide.id] || 'var(--color-purple)';
                return (
                  <div
                    key={slide.id}
                    className={`col-start-1 row-start-1 border-l-4 pl-6 transition-all duration-700 ease-in-out ${i === activeSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
                    style={{ borderColor: accent }}
                  >
                    <h3
                      className="text-sm font-bold uppercase tracking-widest mb-3"
                      style={{ color: accent }}
                      dangerouslySetInnerHTML={{ __html: slide.label }}
                    />
                    <p className="leading-relaxed font-medium" style={{ color: 'var(--color-text-alt)' }} dangerouslySetInnerHTML={{ __html: slide.text }} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="py-12">
            {timelineItems && timelineItems.length > 0 ? (
              <div className="relative border-l-2 pl-8 ml-4" style={{ borderColor: 'var(--color-border)' }}>
                {timelineItems.map((item, i) => (
                  <div
                    key={item.title + String(i)}
                    className={`step-item relative mb-12 transition-all duration-700 ${i === activeStep ? 'opacity-100 scale-100' : 'opacity-30 scale-95'}`}
                  >
                    <div
                      className={`absolute -left-[39px] top-2 size-4 rounded-full border-2 transition-all duration-300 ${i === activeStep ? 'scale-125' : ''}`}
                      style={i === activeStep
                        ? { background: 'var(--color-purple)', borderColor: 'var(--color-purple)', boxShadow: '0 0 0 4px rgba(var(--rgb-purple-accent), 0.2)' }
                        : { background: 'var(--color-bg)', borderColor: 'var(--color-border)' }
                      }
                    />
                    <div
                      className={`p-6 rounded-2xl transition-all duration-500 ${i === activeStep ? 'shadow-xl' : ''}`}
                      style={{
                        background: 'var(--color-bg-alt)',
                        ...(i === activeStep ? { border: '1px solid rgba(var(--rgb-purple-accent), 0.2)' } : { border: '1px solid transparent' }),
                      }}
                    >
                      <h3
                        className="text-xl font-semibold mb-2"
                        style={{ color: 'var(--color-text)' }}
                        dangerouslySetInnerHTML={{ __html: item.title }}
                      />
                      <p className="leading-relaxed text-sm" style={{ color: 'var(--color-text-alt)' }} dangerouslySetInnerHTML={{ __html: item.text }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
