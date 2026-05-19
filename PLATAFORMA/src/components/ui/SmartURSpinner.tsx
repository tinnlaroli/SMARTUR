import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const ARCS = [
    { color: '#f58220', startDeg: -180,   ox:  50, oy: -10, r: 29 },
    { color: '#ff4d8d', startDeg: 120.5,  ox:  50, oy: -10, r: 43 },
    { color: '#a3d14f', startDeg: -209.7, ox:  50, oy: -20, r: 79 },
    { color: '#914ef5', startDeg: 82.9,   ox: -50, oy:  10, r: 90 },
] as const;

const PLANES = [
    'M56.69,60.06 L35.69,74.51 C35.30,74.77,35.38,75.37,35.82,75.53 L39.90,76.99 L53.47,64.58 L42.75,78.01 L43.80,82.03 C43.88,82.30,44.22,82.39,44.42,82.18 L46.84,79.47 L50.25,80.68 C50.56,80.80,50.90,80.62,51.00,80.30 L56.97,60.27 C57.02,60.11,56.83,59.97,56.69,60.06 Z',
    'M121.87,85.05 L110.55,62.23 C110.34,61.80,110.70,61.32,111.16,61.39 L115.44,62.11 L121.26,79.55 L118.42,62.60 L121.30,59.59 C121.50,59.39,121.84,59.49,121.91,59.76 L122.71,63.31 L126.28,63.91 C126.60,63.96,126.82,64.27,126.75,64.60 L122.22,85.01 C122.18,85.18,121.95,85.21,121.87,85.05 Z',
    'M26.97,99.42 L22.90,124.57 C22.83,125.04,23.32,125.40,23.74,125.19 L27.61,123.24 L28.01,104.86 L30.31,121.89 L33.95,123.91 C34.20,124.05,34.51,123.85,34.49,123.57 L34.20,119.94 L37.43,118.32 C37.73,118.17,37.83,117.81,37.67,117.51 L27.31,99.36 C27.22,99.20,27.00,99.25,26.97,99.42 Z',
    'M83.05,150.96 L104.71,164.38 C105.12,164.63,105.63,164.32,105.60,163.86 L105.29,159.53 L88.48,152.10 L105.08,156.52 L108.34,153.93 C108.57,153.75,108.51,153.40,108.24,153.31 L104.78,152.18 L104.52,148.57 C104.49,148.24,104.20,148.00,103.87,148.04 L83.12,150.63 C82.96,150.65,82.91,150.87,83.05,150.96 Z',
];

export const SmartURSpinner = ({ size = 96 }: { size?: number }) => {
    const wrapRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const planes = wrapRef.current?.querySelectorAll('[data-plane]');
        if (!planes) return;

        planes.forEach((el, i) => {
            const { startDeg, r } = ARCS[i];
            const rad = (startDeg * Math.PI) / 180;

            gsap.from(el, {
                x: -(r * Math.cos(rad)),
                y: -(r * Math.sin(rad)),
                scale: 0,
                opacity: 0,
                duration: 0.4,
                ease: 'power2.out',
                delay: i * 0.07,
            });

            gsap.to(el, {
                rotation: (i % 2 === 0 ? 1 : -1) * 360,
                duration: 1.4 + i * 0.15,
                repeat: -1,
                ease: 'none',
            });
        });
    }, { scope: wrapRef });

    return (
        <div ref={wrapRef} style={{ width: size, height: size, flexShrink: 0 }}>
            <svg
                viewBox="0 0 169.42 218.53"
                width={size}
                height={size}
                style={{ overflow: 'visible' }}
                aria-hidden
            >
                {ARCS.map((arc, i) => (
                    <g
                        key={i}
                        data-plane={i}
                        style={{ transformOrigin: `${arc.ox}px ${arc.oy}px` }}
                    >
                        <path d={PLANES[i]} fill={arc.color} />
                    </g>
                ))}
            </svg>
        </div>
    );
};
