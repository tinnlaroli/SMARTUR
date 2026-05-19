import React, { useState, useRef } from 'react';
import gsap from 'gsap';
import { useLanguage } from '../../../contexts/LanguageContext';

const FAQ_KEYS = [
    { q: 'faq1.question', a: 'faq1.answer' },
    { q: 'faq2.question', a: 'faq2.answer' },
    { q: 'faq3.question', a: 'faq3.answer' },
    { q: 'faq4.question', a: 'faq4.answer' },
    { q: 'faq5.question', a: 'faq5.answer' },
];

export const Faqs: React.FC = () => {
    const { t } = useLanguage();
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const panelRefs = useRef<(HTMLDivElement | null)[]>([]);

    const toggleFaq = (index: number) => {
        const isOpening = openIndex !== index;
        
        // Close current
        if (openIndex !== null && panelRefs.current[openIndex]) {
            gsap.to(panelRefs.current[openIndex], { 
                height: 0, 
                opacity: 0, 
                duration: 0.4, 
                ease: 'power2.inOut',
                onComplete: () => {
                    if (!isOpening) setOpenIndex(null);
                }
            });
        }

        // Open new
        if (isOpening) {
            setOpenIndex(index);
            if (panelRefs.current[index]) {
                gsap.fromTo(panelRefs.current[index],
                    { height: 0, opacity: 0 },
                    { height: 'auto', opacity: 1, duration: 0.5, ease: 'power2.out' }
                );
            }
        }
    };

    return (
        <section id="faqs" className="relative overflow-hidden py-24 md:py-36" style={{ background: 'var(--color-bg)' }}>
            {/* Background Accent */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                <div className="absolute -left-24 top-1/2 size-80 -translate-y-1/2 rounded-full opacity-[0.04] blur-[100px]" style={{ background: 'var(--color-purple)' }} />
            </div>

            <div className="container mx-auto px-4 max-w-2xl">
                <div className="mb-16 text-center">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.25em]" style={{ color: 'var(--color-purple)' }}>
                        {t('faqs.label')}
                    </p>
                    <h2 className="landing-heading text-[clamp(2rem,5vw,4rem)] tracking-tighter leading-tight" style={{ color: 'var(--color-text)' }}>
                        {t('faqs.title')}
                    </h2>
                </div>

                <div className="faqs-container">
                    {FAQ_KEYS.map((faq, i) => (
                        <div
                            key={faq.q}
                            className={`faq-item py-6 transition-all duration-300 border-t ${i === FAQ_KEYS.length - 1 ? 'border-b' : ''}`}
                            style={{ borderColor: 'var(--color-border)' }}
                        >
                            <button
                                onClick={() => toggleFaq(i)}
                                className="group flex w-full items-center justify-start text-left gap-6 appearance-none bg-transparent border-none p-0 cursor-pointer"
                                aria-expanded={openIndex === i}
                            >
                                {/* Plus Icon Left */}
                                <div className="relative flex items-center justify-center size-4 shrink-0">
                                    <span 
                                        className={`absolute block w-full h-[2px] rounded-full transition-transform duration-300 ${openIndex === i ? 'rotate-45' : ''}`} 
                                        style={{ background: 'var(--color-purple)' }}
                                    />
                                    <span 
                                        className={`absolute block w-full h-[2px] rounded-full transition-transform duration-300 ${openIndex === i ? 'rotate-[135deg]' : 'rotate-90'}`} 
                                        style={{ background: 'var(--color-purple)' }}
                                    />
                                </div>

                                <h3
                                    className="text-lg md:text-xl font-bold transition-colors duration-300 m-0"
                                    style={{ color: openIndex === i ? 'var(--color-text)' : 'var(--color-text-alt)' }}
                                >
                                    {t(faq.q)}
                                </h3>
                            </button>

                            <div
                                ref={el => { panelRefs.current[i] = el; }}
                                className="panel overflow-hidden"
                                style={{ height: openIndex === i ? 'auto' : 0, opacity: openIndex === i ? 1 : 0 }}
                            >
                                <div className="answer pt-4 pl-10 text-base md:text-lg font-medium leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-alt)' }}>
                                    {t(faq.a)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
