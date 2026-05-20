import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Building2, Map, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { prefersReducedMotion } from '../utils/motion';

gsap.registerPlugin(ScrollTrigger);

interface ActionBridgeProps {
  handleStartExperience: () => void;
}

export const ActionBridge: React.FC<ActionBridgeProps> = ({ handleStartExperience }) => {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.bridge-action',
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="action-bridge-section relative z-20 py-12 md:py-16 lg:py-20"
    >
      <div className="container mx-auto px-4">
        <div className="relative max-w-5xl mx-auto">
          <div className="relative z-10 flex flex-col md:flex-row gap-4 md:gap-6 justify-center items-stretch">

            {/* Soy turista — PRIMARY (pink) */}
            <button
              type="button"
              onClick={handleStartExperience}
              className="bridge-action group relative w-full md:w-auto md:min-w-[280px] p-4 rounded-[2rem]"
            >
              <div className="flex items-center gap-5">
                <div className="icon-box size-16 shrink-0 rounded-full flex items-center justify-center">
                  <Map size={32} />
                </div>
                <span className="bridge-label text-left flex-grow text-xl font-bold leading-snug">
                  {t('actionBridge.tourist.label')}
                </span>
                <div className="action-arrow size-10 shrink-0 rounded-full flex items-center justify-center">
                  <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                </div>
              </div>
            </button>

            {/* Divider */}
            <div className="hidden md:flex flex-col items-center justify-center gap-2 px-1" aria-hidden="true">
              <div className="w-px flex-1 rounded-full" style={{ background: 'var(--color-border)' }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-alt)', opacity: 0.5 }}>o</span>
              <div className="w-px flex-1 rounded-full" style={{ background: 'var(--color-border)' }} />
            </div>

            {/* Tengo un negocio — SECONDARY (gray) + external link icon */}
            <a
              href={import.meta.env.VITE_BUSINESS_URL ?? 'http://2.24.112.25:4321/'}
              target="_blank"
              rel="noopener noreferrer"
              className="bridge-action bridge-action--tourist group relative w-full md:w-auto md:min-w-[280px] p-4 rounded-[2rem]"
            >
              <div className="flex items-center gap-5">
                <div className="icon-box-tourist size-16 shrink-0 rounded-full flex items-center justify-center">
                  <Building2 size={32} />
                </div>
                <span className="bridge-label-tourist text-left flex-grow text-xl font-bold leading-snug">
                  {t('actionBridge.business.label')}
                </span>
                <div className="action-arrow-tourist size-10 shrink-0 rounded-full flex items-center justify-center">
                  <ExternalLink size={20} />
                </div>
              </div>
            </a>

          </div>
        </div>
      </div>
    </section>
  );
};
