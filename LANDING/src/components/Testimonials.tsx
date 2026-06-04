import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useAnimation, useInView, type Variants } from 'framer-motion';
import { Quote, Star } from 'lucide-react';

interface TestimonialData {
  name: string;
  role: string;
  business: string;
  content: string;
  avatar?: string;
}

interface TestimonialsProps {
  title: string;
  testimonials: TestimonialData[];
}

interface AnimTestimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar: string;
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
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

function parseRoleAndCompany(roleLine: string): { role: string; company: string } {
  const comma = roleLine.indexOf(',');
  if (comma === -1) return { role: roleLine, company: 'Veracruz' };
  return {
    role: roleLine.slice(0, comma).trim(),
    company: roleLine.slice(comma + 1).trim(),
  };
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop&crop=face',
];

export function Testimonials({ title, testimonials }: TestimonialsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const controls = useAnimation();

  const animTestimonials = useMemo<AnimTestimonial[]>(
    () =>
      testimonials.map((item, i) => {
        const { role, company } = parseRoleAndCompany(item.role);
        return {
          id: i + 1,
          name: item.name,
          role,
          company: item.business || company,
          content: item.content,
          rating: 5,
          avatar: item.avatar || DEFAULT_AVATARS[i % DEFAULT_AVATARS.length],
        };
      }),
    [testimonials]
  );

  useEffect(() => {
    if (isInView) {
      void controls.start('visible');
    }
  }, [isInView, controls]);

  useEffect(() => {
    if (animTestimonials.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % animTestimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [animTestimonials.length]);

  if (animTestimonials.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id="testimonios"
      className="relative overflow-hidden py-24 md:py-36"
      style={{ background: 'var(--color-bg-alt)' }}
    >
      <div className="mx-auto max-w-[1240px] px-6">
        <motion.div
          initial="hidden"
          animate={controls}
          variants={containerVariants}
          className="grid w-full grid-cols-1 gap-12 md:grid-cols-2 md:gap-16 lg:gap-24"
        >
          <motion.div variants={itemVariants} className="flex flex-col justify-center">
            <div className="space-y-6">
              <h2
                className="text-[clamp(2rem,5vw,3.5rem)] font-black tracking-tighter"
                style={{ color: 'var(--color-text)' }}
                dangerouslySetInnerHTML={{ __html: title }}
              />

              <div className="flex items-center gap-3 pt-2">
                {animTestimonials.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className="rounded-full border-none p-0 transition-all duration-300 cursor-pointer"
                    style={{
                      height: '10px',
                      width: activeIndex === index ? '40px' : '10px',
                      background:
                        activeIndex === index
                          ? 'var(--color-cyan)'
                          : 'rgba(var(--rgb-text), 0.2)',
                    }}
                    aria-label={`View testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="relative mr-0 min-h-[320px] md:mr-6 md:min-h-[400px]">
            {animTestimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                className="absolute inset-0"
                initial={{ opacity: 0, x: 80 }}
                animate={{
                  opacity: activeIndex === index ? 1 : 0,
                  x: activeIndex === index ? 0 : 80,
                  scale: activeIndex === index ? 1 : 0.94,
                  pointerEvents: activeIndex === index ? 'auto' as const : 'none' as const,
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                style={{ zIndex: activeIndex === index ? 10 : 0 }}
              >
                <div
                  className="flex h-full flex-col rounded-[2rem] border p-8 shadow-lg"
                  style={{
                    background: 'var(--color-bg)',
                    borderColor: 'var(--color-border)',
                    boxShadow: '0 12px 40px -18px rgba(var(--rgb-purple-accent), 0.2)',
                  }}
                >
                  <div className="mb-6 flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-[var(--color-pink)] text-[var(--color-pink)]"
                      />
                    ))}
                  </div>

                  <div className="relative mb-6 flex-1">
                    <Quote
                      className="absolute -top-2 -left-2 h-8 w-8 rotate-180 opacity-20"
                      style={{ color: 'var(--color-pink)' }}
                    />
                    <p
                      className="relative z-10 text-lg leading-relaxed font-medium"
                      style={{ color: 'var(--color-text)' }}
                    >
                      &ldquo;{testimonial.content}&rdquo;
                    </p>
                  </div>

                  <hr className="my-4 border-0 h-px" style={{ background: 'var(--color-border)' }} />

                  <div className="flex items-center gap-4">
                    <div
                      className="h-12 w-12 rounded-full border overflow-hidden flex-shrink-0"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      {testimonial.avatar ? (
                        <img
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div
                          className="h-full w-full flex items-center justify-center text-sm font-bold"
                          style={{ background: 'rgba(var(--rgb-purple-accent), 0.15)', color: 'var(--color-purple)' }}
                        >
                          {testimonial.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold" style={{ color: 'var(--color-text)' }}>
                        {testimonial.name}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        {testimonial.role}
                        {testimonial.company ? `, ${testimonial.company}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            <div
              className="absolute -bottom-6 -left-6 h-24 w-24 rounded-xl"
              style={{ background: 'rgba(var(--rgb-purple-accent), 0.08)' }}
              aria-hidden
            />
            <div
              className="absolute -top-6 -right-6 h-24 w-24 rounded-xl"
              style={{ background: 'rgba(var(--rgb-pink-primary), 0.08)' }}
              aria-hidden
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default Testimonials;
