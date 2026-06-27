/**
 * InScreenHighlight — Scanner UI highlight for CSS screens.
 * Corner L-brackets spring in from their corners, sonar ping rings,
 * animated sweep line, inner glow, label pill.
 */
import { interpolate, useCurrentFrame, useVideoConfig, spring, Easing } from "remotion";
import { SPRING_BOUNCE } from "../../helpers/animations";

interface Props {
  relIn: number;
  relOut?: number;
  frameIn: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  radius?: number;
  label?: string;
  labelSide?: "top" | "bottom" | "left" | "right";
}

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const clamp   = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// Corner L-bracket — slides in from its respective corner
function Corner({ side, color, spring: s }: {
  side: "tl" | "tr" | "bl" | "br";
  color: string;
  spring: number;
}) {
  const W = 16; const T = 2.5; const R = 2;
  const isRight  = side === "tr" || side === "br";
  const isBottom = side === "bl" || side === "br";

  // Spring from 0→1 affects slide AND opacity
  const slide  = (1 - s) * 10;
  const opacity = Math.min(1, s * 2);

  return (
    <div style={{
      position: "absolute",
      ...(isRight  ? { right: -slide - 4 } : { left: -slide - 4 }),
      ...(isBottom ? { bottom: -slide - 4 } : { top: -slide - 4 }),
      width: W, height: W,
      transform: `${isRight ? "scaleX(-1)" : ""} ${isBottom ? "scaleY(-1)" : ""}`.trim(),
      pointerEvents: "none",
      opacity,
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, width: W, height: T,
        borderRadius: R, background: color,
        boxShadow: `0 0 7px ${color}CC, 0 0 2px ${color}`,
      }} />
      <div style={{
        position: "absolute", top: 0, left: 0, width: T, height: W,
        borderRadius: R, background: color,
        boxShadow: `0 0 7px ${color}CC, 0 0 2px ${color}`,
      }} />
    </div>
  );
}

// Sonar ping ring — expands and fades out
function SonarRing({ delay, color, w, h, radius }: { delay: number; color: string; w: number; h: number; radius: number }) {
  const frame = useCurrentFrame();
  const CYCLE = 72;
  const pingRel = (frame - delay) % CYCLE;
  const prog = Math.max(0, pingRel / CYCLE);
  const expansion = prog * 26;
  const opacity = interpolate(pingRel, [0, 8, 52, CYCLE], [0, 0.55, 0.08, 0], clamp);

  if (opacity <= 0) return null;
  return (
    <div style={{
      position: "absolute",
      left: -expansion,
      top: -expansion * (h / w),   // scale proportionally
      width: w + expansion * 2,
      height: h + expansion * 2 * (h / w),
      borderRadius: radius + expansion,
      border: `1.5px solid ${color}`,
      opacity,
      pointerEvents: "none",
    }} />
  );
}

export function InScreenHighlight({
  relIn, relOut, frameIn,
  x, y, width, height,
  color = "#984EFD",
  radius = 8,
  label,
  labelSide = "bottom",
}: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rel      = frame - frameIn;
  const localRel = rel - relIn;

  if (rel < relIn) return null;

  // Entry spring — corners & scale
  const s = spring({ frame: localRel, fps, config: { damping: 12, stiffness: 200, mass: 0.8 } });

  const fadeInV  = interpolate(localRel, [0, 10], [0, 1], clamp);
  const fadeOutV = relOut != null ? interpolate(rel, [relOut - 8, relOut], [1, 0], clamp) : 1;
  const opacity  = fadeInV * fadeOutV;

  // Scale: spring pop 1.18 → 1.0
  const scaleIn = interpolate(Math.min(1, s), [0, 1], [1.18, 1.0], clamp);

  // Sweep line (two pass: top→bottom, then bottom→top)
  const sweepCycle = localRel % 50;
  const sweepY = sweepCycle < 25
    ? interpolate(sweepCycle, [0, 25], [0, height], clamp)
    : interpolate(sweepCycle, [25, 50], [height, 0], clamp);
  const sweepOp = Math.min(1, interpolate(localRel, [0, 10], [0, 0.7], clamp)) * fadeOutV;

  // Inner glow pulse
  const glowBase = interpolate(localRel, [0, 14], [0, 0.09], clamp) * fadeOutV;
  const glowPulse = glowBase + Math.sin(localRel * 0.08) * 0.03;

  const labelOff = 10;
  const labelOp  = Math.min(opacity, interpolate(localRel, [6, 16], [0, 1], clamp));
  const labelS   = interpolate(localRel, [6, 20], [0.7, 1], { easing: easeOut, ...clamp });

  const labelStyle: React.CSSProperties = {
    position: "absolute",
    background: `linear-gradient(135deg, ${color}, ${color}CC)`,
    color: "#fff",
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 700, fontSize: 9,
    padding: "3px 9px", borderRadius: 999,
    whiteSpace: "nowrap", opacity: labelOp,
    boxShadow: `0 2px 10px ${color}60`,
    scale: String(labelS),
    ...(labelSide === "bottom" && { top: height + labelOff, left: "50%", translate: "-50% 0px" }),
    ...(labelSide === "top"    && { bottom: height + labelOff, left: "50%", translate: "-50% 0px" }),
    ...(labelSide === "right"  && { left: width + labelOff, top: "50%", translate: "0px -50%" }),
    ...(labelSide === "left"   && { right: width + labelOff, top: "50%", translate: "0px -50%" }),
  };

  const absFrameIn = frameIn + relIn;

  return (
    <div style={{
      position: "absolute", left: x, top: y, width, height,
      pointerEvents: "none", opacity, zIndex: 100,
    }}>
      {/* Sonar ping rings — staggered */}
      <SonarRing delay={absFrameIn + 14} color={color} w={width} h={height} radius={radius} />
      <SonarRing delay={absFrameIn + 50} color={color} w={width} h={height} radius={radius} />

      {/* Inner glow fill */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: radius,
        background: color, opacity: glowPulse,
      }} />

      {/* Scan sweep */}
      <div style={{
        position: "absolute", left: 4, right: 4, top: sweepY, height: 1.5,
        background: `linear-gradient(90deg, transparent 0%, ${color}70 30%, ${color} 50%, ${color}70 70%, transparent 100%)`,
        opacity: sweepOp, borderRadius: 999,
      }} />

      {/* Main border + scale-in */}
      <div style={{
        position: "absolute", inset: -3, borderRadius: radius + 2,
        border: `1.5px solid ${color}`,
        transform: `scale(${scaleIn})`,
        boxShadow: `0 0 12px ${color}40, inset 0 0 8px ${color}12`,
      }} />

      {/* Corner L-brackets — each springs from its corner */}
      <Corner side="tl" color={color} spring={s} />
      <Corner side="tr" color={color} spring={s} />
      <Corner side="bl" color={color} spring={s} />
      <Corner side="br" color={color} spring={s} />

      {label && <div style={labelStyle}>{label}</div>}
    </div>
  );
}
