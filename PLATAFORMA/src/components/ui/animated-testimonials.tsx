import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimation, useInView, type Variants } from 'framer-motion';
import { Quote, Star } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface Testimonial {
    id: number;
    name: string;
    role: string;
    company: string;
    content: string;
    rating: number;
    avatar: string;
}

export interface AnimatedTestimonialsProps {
    title?: string;
    subtitle?: string;
    /** Eyebrow label (e.g. "Testimonios") — plain text, no chip */
    sectionLabel?: string;
    testimonials?: Testimonial[];
    autoRotateInterval?: number;
    trustedCompanies?: string[];
    trustedCompaniesTitle?: string;
    className?: string;
    sectionId?: string;
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: 'easeOut',
        },
    },
};

const MOBILE_MQ = '(max-width: 767px)';

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
    return (
        <div
            className="flex w-full flex-col rounded-2xl border p-5 shadow-lg sm:rounded-[2rem] sm:p-8"
            style={{
                background: 'var(--color-bg-alt)',
                borderColor: 'var(--color-border)',
                boxShadow: '0 12px 40px -18px rgba(var(--rgb-purple-accent), 0.2)',
            }}
        >
            <div className="mb-4 flex gap-1 sm:mb-6">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                        key={i}
                        className="h-5 w-5 fill-[var(--color-pink)] text-[var(--color-pink)]"
                    />
                ))}
            </div>

            <div className="relative mb-4 sm:mb-6">
                <Quote
                    className="absolute -top-2 -left-2 h-8 w-8 rotate-180 opacity-20"
                    style={{ color: 'var(--color-pink)' }}
                />
                <p
                    className="relative z-10 text-base leading-relaxed font-medium sm:text-lg"
                    style={{ color: 'var(--color-text)' }}
                >
                    &ldquo;{testimonial.content}&rdquo;
                </p>
            </div>

            <Separator className="my-3 sm:my-4" />

            <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border" style={{ borderColor: 'var(--color-border)' }}>
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 text-left">
                    <h3 className="font-bold" style={{ color: 'var(--color-text)' }}>
                        {testimonial.name}
                    </h3>
                    <p className="text-sm leading-snug" style={{ color: 'var(--color-text-alt)' }}>
                        {testimonial.role}
                        {testimonial.company ? `, ${testimonial.company}` : ''}
                    </p>
                </div>
            </div>
        </div>
    );
}

export function AnimatedTestimonials({
    title = 'Loved by the community',
    subtitle = "Don't just take our word for it.",
    sectionLabel,
    testimonials = [],
    autoRotateInterval = 6000,
    trustedCompanies = [],
    trustedCompaniesTitle = 'Trusted by developers from companies worldwide',
    className,
    sectionId = 'testimonios',
}: AnimatedTestimonialsProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isMobileLayout, setIsMobileLayout] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
    const controls = useAnimation();

    useEffect(() => {
        const mq = window.matchMedia(MOBILE_MQ);
        const update = () => setIsMobileLayout(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        if (isInView) {
            void controls.start('visible');
        }
    }, [isInView, controls]);

    useEffect(() => {
        if (autoRotateInterval <= 0 || testimonials.length <= 1) return;

        const interval = setInterval(() => {
            setActiveIndex((current) => (current + 1) % testimonials.length);
        }, autoRotateInterval);

        return () => clearInterval(interval);
    }, [autoRotateInterval, testimonials.length]);

    if (testimonials.length === 0) {
        return null;
    }

    const active = testimonials[activeIndex];

    return (
        <section
            ref={sectionRef}
            id={sectionId}
            className={cn(
                'landing-testimonials relative isolate overflow-x-clip py-16 sm:py-24 md:py-36',
                className,
            )}
        >
            <div className="landing-container mx-auto w-full max-w-[1240px] px-4 sm:px-6">
                <motion.div
                    initial="hidden"
                    animate={controls}
                    variants={containerVariants}
                    className="grid w-full grid-cols-1 gap-8 sm:gap-12 md:grid-cols-2 md:gap-16 lg:gap-24"
                >
                    <motion.div variants={itemVariants} className="flex flex-col justify-center">
                        <div className="space-y-4 sm:space-y-6">
                            {sectionLabel ? (
                                <p
                                    className="text-xs font-black uppercase tracking-[0.25em]"
                                    style={{ color: 'var(--color-cyan)' }}
                                >
                                    {sectionLabel}
                                </p>
                            ) : null}

                            <h2
                                className="landing-heading text-[clamp(2rem,5vw,3.5rem)] font-black tracking-tighter"
                                style={{ color: 'var(--color-text)' }}
                            >
                                {title}
                            </h2>

                            <p
                                className="max-w-[600px] text-base leading-relaxed sm:text-lg md:text-xl"
                                style={{ color: 'var(--color-text-alt)' }}
                            >
                                {subtitle}
                            </p>

                            <div className="flex items-center gap-3 pt-1 sm:pt-2">
                                {testimonials.map((_, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => setActiveIndex(index)}
                                        className="rounded-full border-none p-0 transition-all duration-300"
                                        style={{
                                            height: '10px',
                                            width: activeIndex === index ? '40px' : '10px',
                                            background:
                                                activeIndex === index
                                                    ? 'var(--color-cyan)'
                                                    : 'rgba(var(--rgb-text), 0.2)',
                                        }}
                                        aria-label={`View testimonial ${index + 1}`}
                                        aria-current={activeIndex === index ? 'true' : undefined}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className={cn(
                            'w-full',
                            isMobileLayout
                                ? 'relative min-h-0'
                                : 'relative mr-0 min-h-[400px] md:mr-6',
                        )}
                    >
                        {isMobileLayout ? (
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={active.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.35, ease: 'easeOut' }}
                                    className="relative w-full"
                                >
                                    <TestimonialCard testimonial={active} />
                                </motion.div>
                            </AnimatePresence>
                        ) : (
                            <>
                                {testimonials.map((testimonial, index) => (
                                    <motion.div
                                        key={testimonial.id}
                                        className="absolute inset-0"
                                        initial={false}
                                        animate={{
                                            opacity: activeIndex === index ? 1 : 0,
                                            x: activeIndex === index ? 0 : 80,
                                            scale: activeIndex === index ? 1 : 0.94,
                                            pointerEvents: activeIndex === index ? 'auto' : 'none',
                                        }}
                                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                                        style={{ zIndex: activeIndex === index ? 10 : 0 }}
                                    >
                                        <TestimonialCard testimonial={testimonial} />
                                    </motion.div>
                                ))}

                                <div
                                    className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-xl"
                                    style={{ background: 'rgba(var(--rgb-purple-accent), 0.08)' }}
                                    aria-hidden
                                />
                                <div
                                    className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-xl"
                                    style={{ background: 'rgba(var(--rgb-pink-primary), 0.08)' }}
                                    aria-hidden
                                />
                            </>
                        )}
                    </motion.div>
                </motion.div>

                {trustedCompanies.length > 0 ? (
                    <motion.div
                        variants={itemVariants}
                        initial="hidden"
                        animate={controls}
                        className="mt-20 text-center"
                    >
                        <h3 className="mb-8 text-sm font-medium tracking-wide" style={{ color: 'var(--color-text-alt)' }}>
                            {trustedCompaniesTitle}
                        </h3>
                        <div className="flex flex-wrap justify-center gap-x-12 gap-y-8">
                            {trustedCompanies.map((company) => (
                                <div
                                    key={company}
                                    className="text-xl font-semibold opacity-40 md:text-2xl"
                                    style={{ color: 'var(--color-text)' }}
                                >
                                    {company}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ) : null}
            </div>
        </section>
    );
}
