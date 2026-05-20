import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import clsx from "clsx";

type Props = {
  className?: string;
};

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

export default function AlgorithmDiagram({ className }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    // Start drawing when section approaches viewport, finish before it leaves.
    offset: ["start 0.85", "end 0.25"],
  });

  // Smooth the scroll signal for a "software-professional" feel.
  const p = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 36,
    mass: 0.25,
  });

  const box1 = useTransform(p, (v) => clamp01((v - 0.0) / (0.2 - 0.0)));
  const box2 = useTransform(p, (v) => clamp01((v - 0.12) / (0.36 - 0.12)));
  const box3 = useTransform(p, (v) => clamp01((v - 0.26) / (0.56 - 0.26)));
  const box4 = useTransform(p, (v) => clamp01((v - 0.44) / (0.76 - 0.44)));
  const box5 = useTransform(p, (v) => clamp01((v - 0.62) / (0.98 - 0.62)));

  const line1 = useTransform(p, (v) => clamp01((v - 0.06) / (0.28 - 0.06)));
  const line2 = useTransform(p, (v) => clamp01((v - 0.2) / (0.45 - 0.2)));
  const line3 = useTransform(p, (v) => clamp01((v - 0.38) / (0.65 - 0.38)));
  const line4 = useTransform(p, (v) => clamp01((v - 0.56) / (0.9 - 0.56)));

  const labelOpacity = useTransform(p, [0, 0.12, 1], [0, 1, 1]);
  const noteOpacity = useTransform(p, [0.1, 0.35], [0, 1]);

  return (
    <div
      ref={ref}
      className={clsx("sy-algo-diagram", className)}
      role="img"
      aria-label="Diagrama del pipeline de recomendaciones: contexto, candidatos, filtrado colaborativo, re-ranking con Random Forest y entrega de recomendación."
    >
      <svg
        viewBox="0 0 920 340"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="syStroke" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--rgb-purple-accent))" />
            <stop offset="55%" stopColor="rgb(var(--rgb-cyan-accent))" />
            <stop offset="100%" stopColor="rgb(var(--rgb-pink-primary))" />
          </linearGradient>
          <filter id="syGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.35 0"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connectors */}
        <motion.path
          d="M160 110 H250"
          stroke="url(#syStroke)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          vectorEffect="non-scaling-stroke"
          filter="url(#syGlow)"
          style={{ pathLength: line1 }}
        />
        <motion.path
          d="M340 110 H430"
          stroke="url(#syStroke)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          vectorEffect="non-scaling-stroke"
          filter="url(#syGlow)"
          style={{ pathLength: line2 }}
        />
        <motion.path
          d="M520 110 H610"
          stroke="url(#syStroke)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          vectorEffect="non-scaling-stroke"
          filter="url(#syGlow)"
          style={{ pathLength: line3 }}
        />
        <motion.path
          d="M700 110 H790"
          stroke="url(#syStroke)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          vectorEffect="non-scaling-stroke"
          filter="url(#syGlow)"
          style={{ pathLength: line4 }}
        />

        {/* Boxes */}
        <motion.rect
          x="40"
          y="60"
          width="120"
          height="100"
          rx="18"
          fill="rgba(var(--rgb-bg), 0.55)"
          stroke="rgba(var(--rgb-text), 0.14)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          style={{ pathLength: box1 }}
        />
        <motion.rect
          x="250"
          y="60"
          width="180"
          height="100"
          rx="18"
          fill="rgba(var(--rgb-bg), 0.55)"
          stroke="rgba(var(--rgb-text), 0.14)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          style={{ pathLength: box2 }}
        />
        <motion.rect
          x="430"
          y="60"
          width="180"
          height="100"
          rx="18"
          fill="rgba(var(--rgb-bg), 0.55)"
          stroke="rgba(var(--rgb-text), 0.14)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          style={{ pathLength: box3 }}
        />
        <motion.rect
          x="610"
          y="60"
          width="180"
          height="100"
          rx="18"
          fill="rgba(var(--rgb-bg), 0.55)"
          stroke="rgba(var(--rgb-text), 0.14)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          style={{ pathLength: box4 }}
        />
        <motion.rect
          x="790"
          y="60"
          width="120"
          height="100"
          rx="18"
          fill="rgba(var(--rgb-bg), 0.55)"
          stroke="rgba(var(--rgb-text), 0.14)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          style={{ pathLength: box5 }}
        />

        {/* Labels (fade in early) */}
        <motion.g style={{ opacity: labelOpacity }}>
          <text
            x="100"
            y="103"
            textAnchor="middle"
            fontFamily="var(--font-family-body)"
            fontSize="14"
            fill="rgb(var(--rgb-text))"
          >
            Input
          </text>
          <text
            x="340"
            y="96"
            textAnchor="middle"
            fontFamily="var(--font-family-body)"
            fontSize="14"
            fill="rgb(var(--rgb-text))"
          >
            Context Builder
          </text>
          <text
            x="340"
            y="118"
            textAnchor="middle"
            fontFamily="var(--font-family-body)"
            fontSize="12"
            fill="rgb(var(--rgb-text-alt))"
          >
            preferencias · ubicación
          </text>

          <text
            x="520"
            y="96"
            textAnchor="middle"
            fontFamily="var(--font-family-body)"
            fontSize="14"
            fill="rgb(var(--rgb-text))"
          >
            Candidate Gen
          </text>
          <text
            x="520"
            y="118"
            textAnchor="middle"
            fontFamily="var(--font-family-body)"
            fontSize="12"
            fill="rgb(var(--rgb-text-alt))"
          >
            Collaborative Filtering
          </text>

          <text
            x="700"
            y="96"
            textAnchor="middle"
            fontFamily="var(--font-family-body)"
            fontSize="14"
            fill="rgb(var(--rgb-text))"
          >
            Re-ranker
          </text>
          <text
            x="700"
            y="118"
            textAnchor="middle"
            fontFamily="var(--font-family-body)"
            fontSize="12"
            fill="rgb(var(--rgb-text-alt))"
          >
            Random Forest
          </text>

          <text
            x="850"
            y="103"
            textAnchor="middle"
            fontFamily="var(--font-family-body)"
            fontSize="14"
            fill="rgb(var(--rgb-text))"
          >
            Recommend
          </text>
        </motion.g>

        {/* Secondary note */}
        <motion.text
          x="460"
          y="240"
          textAnchor="middle"
          fontFamily="var(--font-family-body)"
          fontSize="12"
          fill="rgb(var(--rgb-text-alt))"
          style={{ opacity: noteOpacity }}
        >
          Scroll-driven trace · SVG pathLength ↔ progreso de scroll
        </motion.text>
      </svg>

      <style>{`
        .sy-algo-diagram {
          width: 100%;
          height: 260px;
          border-radius: 1.25rem;
          background: rgba(var(--rgb-bg), 0.5);
          border: 1px solid rgba(var(--rgb-text), 0.08);
          backdrop-filter: blur(16px) saturate(1.15);
          -webkit-backdrop-filter: blur(16px) saturate(1.15);
          overflow: hidden;
        }

        @media (max-width: 640px) {
          .sy-algo-diagram {
            height: 220px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sy-algo-diagram {
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
          }
        }
      `}</style>
    </div>
  );
}

