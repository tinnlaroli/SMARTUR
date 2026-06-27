/**
 * StepCard — layout full-bleed 9:16 para cada paso del flujo.
 *
 * ┌─────────────────────────┐
 * │  badge (paso + sección) │  ← top 120px
 * │  dot-grid background    │
 * │      MOCKUP AREA        │  ← 70% canvas
 * │   (phone o browser)     │
 * │  ▓▓▓ BOTTOM CARD ▓▓▓   │  ← 340px bottom, frosted
 * │  accent line animated   │
 * │  keyword pill           │
 * │  título grande          │
 * │  descripción            │
 * └─────────────────────────┘
 */
import { useCurrentFrame, interpolate, Easing, useVideoConfig, spring } from "remotion";
import { fadeIn, fadeOut, slideUp, SPRING_SMOOTH } from "../helpers/animations";

interface Props {
  stepNumber: number;
  title: string;
  description?: string;
  accentColor: string;
  frameIn: number;
  frameOut: number;
  children?: React.ReactNode;
  bgColor?: string;
}

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const ease    = Easing.bezier(0.4, 0, 0.2, 1);

export function StepCard({
  stepNumber,
  title,
  description = "",
  accentColor,
  frameIn,
  frameOut,
  children,
  bgColor,
}: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rel = frame - frameIn;
  const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

  const opacity = fadeIn(frame, frameIn, 12) * fadeOut(frame, frameOut, 14);

  // Mockup entry spring
  const mockupS     = spring({ frame: rel - 6, fps, config: SPRING_SMOOTH });
  const mockupScale = 0.93 + 0.07 * mockupS;
  const mockupOp    = Math.min(1, mockupS * 2);

  // Bottom card slides up
  const cardY  = slideUp(frame, frameIn + 2, 55, 22);
  const cardOp = fadeIn(frame, frameIn + 2, 16);

  // Animated accent line: grows 0 → 52px
  const accentW = interpolate(frame, [frameIn + 6, frameIn + 22], [0, 52], { easing: easeOut, ...clamp });

  // Title stagger
  const titleOp = fadeIn(frame, frameIn + 14, 16);
  const titleY  = slideUp(frame, frameIn + 14, 28, 18);

  // Description stagger
  const descOp = fadeIn(frame, frameIn + 22, 16);
  const descY  = slideUp(frame, frameIn + 22, 22, 18);

  // Badge
  const badgeOp = fadeIn(frame, frameIn, 12);
  const badgeY  = slideUp(frame, frameIn, 22, 14);

  // Badge circle breathe (slow pulse)
  const badgePulse = interpolate(
    (rel % 90) / 90,
    [0, 0.5, 1],
    [0.35, 0.70, 0.35],
    { easing: ease, ...clamp },
  );

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity }}>
      {/* ── Background gradient ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: bgColor
            ? `radial-gradient(ellipse 130% 65% at 50% 25%, ${bgColor}1A 0%, #F7F5FF 60%)`
            : "#F7F5FF",
        }}
      />

      {/* ── Animated blob — drifts slowly behind mockup ── */}
      <div style={{
        position: "absolute",
        width: 780, height: 780,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${accentColor}0F 0%, ${accentColor}06 50%, transparent 70%)`,
        left: "50%", top: "38%",
        transform: `translate(calc(-50% + ${Math.sin(rel * 0.012) * 40}px), calc(-50% + ${Math.cos(rel * 0.009) * 30}px))`,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        width: 500, height: 500,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${accentColor}08 0%, transparent 65%)`,
        left: "20%", top: "55%",
        transform: `translate(-50%, -50%) translate(${Math.cos(rel * 0.015) * 30}px, ${Math.sin(rel * 0.011) * 20}px)`,
        pointerEvents: "none",
      }} />

      {/* ── Dot grid texture ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(circle, ${accentColor}18 1.5px, transparent 1.5px)`,
          backgroundSize: "36px 36px",
          pointerEvents: "none",
          opacity: 0.55,
          maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 70%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 70%, transparent 100%)",
        }}
      />

      {/* ── Step badge — top left ── */}
      <div
        style={{
          position: "absolute",
          top: 72,
          left: 48,
          display: "flex",
          alignItems: "center",
          gap: 14,
          opacity: badgeOp,
          transform: `translateY(${badgeY}px)`,
          zIndex: 10,
        }}
      >
        {/* Number circle with breathing glow */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              inset: -6,
              borderRadius: "50%",
              background: accentColor,
              opacity: badgePulse,
              filter: "blur(10px)",
            }}
          />
          <div
            style={{
              position: "relative",
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: accentColor,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Cal Sans', 'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: 22,
              boxShadow: `0 4px 20px ${accentColor}55`,
            }}
          >
            {stepNumber}
          </div>
        </div>

        {/* Section label pill */}
        <div
          style={{
            background: `${accentColor}1A`,
            border: `1.5px solid ${accentColor}45`,
            borderRadius: 999,
            padding: "7px 20px",
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: 20,
            color: accentColor,
            letterSpacing: "0.07em",
            textTransform: "uppercase" as const,
            boxShadow: `0 2px 12px ${accentColor}20`,
          }}
        >
          {stepNumber <= 6 ? "Prestador" : "Turista"}
        </div>
      </div>

      {/* ── Mockup area — centered ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 130,
          paddingBottom: 340,
        }}
      >
        <div
          style={{
            transform: `scale(${mockupScale})`,
            opacity: mockupOp,
            transformOrigin: "center center",
          }}
        >
          {children}
        </div>
      </div>

      {/* ── Bottom card — frosted glass ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 272,
          background: "rgba(247,245,255,0.96)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          borderTop: `2px solid ${accentColor}22`,
          padding: "24px 52px 52px",
          opacity: cardOp,
          transform: `translateY(${cardY}px)`,
          zIndex: 5,
        }}
      >
        {/* Animated accent line */}
        <div
          style={{
            width: accentW,
            height: 4,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}70)`,
            marginBottom: 16,
            boxShadow: `0 0 10px ${accentColor}50`,
          }}
        />

        {/* Title */}
        <div
          style={{
            fontFamily: "'Cal Sans', 'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: 56,
            color: "#1E1E23",
            lineHeight: 1.08,
            marginBottom: description ? 14 : 0,
            opacity: titleOp,
            transform: `translateY(${titleY}px)`,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>

        {/* Description — short tagline only */}
        {description && (
          <div
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 500,
              fontSize: 26,
              color: `${accentColor}CC`,
              lineHeight: 1.4,
              opacity: descOp,
              transform: `translateY(${descY}px)`,
              letterSpacing: "-0.01em",
            }}
          >
            {description}
          </div>
        )}
      </div>
    </div>
  );
}
