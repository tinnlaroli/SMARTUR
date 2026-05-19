import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { useLanguage } from '../../../contexts/LanguageContext';
import paperPlaneUrl from '../assets/paper-plane.json?url';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

interface FlightDividerProps {
  handleStartExperience?: () => void;
}

export const FlightDivider: React.FC<FlightDividerProps> = ({ handleStartExperience }) => {
    const sectionRef = useRef<HTMLDivElement>(null);
    const guideRef = useRef<SVGPathElement>(null);
    const trailRef = useRef<SVGPathElement>(null);
    const maskPathRef = useRef<SVGPathElement>(null);
    const planeRef = useRef<HTMLDivElement>(null);

    const { t } = useLanguage();
    const text = [t('flightDivider.line1'), t('flightDivider.line2')];

    useEffect(() => {
        const section = sectionRef.current;
        const guide = guideRef.current;
        const trail = trailRef.current;
        const maskPath = maskPathRef.current;
        const plane = planeRef.current;

        if (!section || !guide || !trail || !maskPath || !plane) return;

        const updatePath = () => {
            const width = window.innerWidth;
            const height = section.clientHeight;
            const pathString = `M ${-0.1 * width}, ${0.8 * height} 
                               C ${0.2 * width}, ${0.8 * height}, ${0.35 * width}, ${0.5 * height}, ${0.45 * width}, ${0.5 * height}
                               C ${0.55 * width}, ${0.5 * height}, ${0.6 * width}, ${0.2 * height}, ${0.5 * width}, ${0.2 * height}
                               C ${0.4 * width}, ${0.2 * height}, ${0.4 * width}, ${0.6 * height}, ${0.55 * width}, ${0.6 * height}
                               S ${0.8 * width}, ${0.1 * height}, ${1.1 * width}, ${0.1 * height}`;
            guide.setAttribute("d", pathString);
            trail.setAttribute("d", pathString);
            maskPath.setAttribute("d", pathString);
        };

        updatePath();
        window.addEventListener("resize", updatePath);

        const isMobile = window.matchMedia("(max-width: 767px)").matches;
        
        gsap.set(plane, { autoAlpha: 1, scale: 0.5 });
        const length = maskPath.getTotalLength();
        gsap.set(maskPath, { strokeDasharray: length, strokeDashoffset: length });

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: isMobile ? "top bottom" : "center center",
                end: isMobile ? "bottom top" : "+=150%",
                pin: !isMobile,
                scrub: 1,
            }
        });

        tl.to(plane, {
            motionPath: {
                path: guide,
                align: guide,
                autoRotate: true,
                alignOrigin: [0.5, 0.5],
            },
            scale: 1.5,
            ease: "none",
            duration: 5
        }, 0);

        tl.to(maskPath, { strokeDashoffset: 0, ease: "none", duration: 5 }, 0);
        tl.set(plane, { zIndex: 50 }, 2.5);

        const textSpans = section.querySelectorAll(".flight-text span span");
        if (textSpans.length > 0) {
            tl.to(textSpans, { opacity: 0, y: -50, duration: 1, ease: "power2.in", stagger: 0.02 }, 4.5);
        }

        return () => {
            window.removeEventListener("resize", updatePath);
            ScrollTrigger.getAll().forEach(t => {
                if (t.trigger === section) t.kill();
            });
        };
    }, []);

    return (
        <section
            ref={sectionRef}
            id="flight-divider"
            className="flight-divider-section relative h-[50vh] md:h-[65vh] lg:h-[80vh] w-full"
            style={{ background: 'var(--color-bg)' }}
        >
            <div className="absolute inset-0 h-full w-full overflow-hidden pointer-events-none">
                
                {/* Divider Text */}
                <div className="flight-text absolute top-[40%] left-1/2 z-40 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center leading-none text-center">
                    {text.map((line, i) => (
                        <div key={i} className={`flex space-x-2 md:space-x-4 ${i === 1 ? "mt-2 md:mt-4" : ""}`}>
                            {line.split(" ").map((word, wi) => (
                                <span key={`${i}-${wi}`} className="inline-block whitespace-nowrap">
                                    {word.split("").map((char, ci) => (
                                        <span key={`${i}-${wi}-${ci}`} className="relative z-20 inline-block text-4xl font-black tracking-tighter text-[var(--color-pink)] uppercase drop-shadow-sm md:text-5xl lg:text-6xl">
                                            {char}
                                        </span>
                                    ))}
                                </span>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Flight SVG */}
                <svg
                    id="flight-svg"
                    className="absolute inset-0 h-full w-full pointer-events-none"
                    fill="none"
                    preserveAspectRatio="none" 
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <mask id="flight-mask">
                            <path 
                                ref={maskPathRef}
                                stroke="white" 
                                strokeWidth="6" 
                                fill="none" 
                            />
                        </mask>
                    </defs>

                    <path
                        ref={guideRef}
                        className="opacity-0"
                        stroke="none"
                        fill="none"
                    />
                    
                    <path
                        ref={trailRef}
                        id="flight-trail"
                        stroke="var(--color-cyan)"
                        strokeWidth="5"
                        strokeDasharray="10 10"
                        strokeLinecap="round"
                        fill="none"
                        mask="url(#flight-mask)"
                        className="opacity-0 lg:opacity-100"
                    />
                </svg>

                {/* Paper Plane (Lottie) */}
                <div ref={planeRef} id="divider-plane" className="absolute top-0 left-0 z-10 size-60 origin-center opacity-0 pointer-events-none">
                    {/* @ts-ignore */}
                    <lottie-player
                        src={paperPlaneUrl}
                        background="transparent"
                        speed="1"
                        loop
                        autoplay
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>
            </div>

        </section>
    );
};
