/**
 * HighlightRing — "Scanner UI" style highlight: corner L-brackets,
 * sweep line, inner glow, spring-in. Used inside DynamicBrowserMockup
 * (outside camera transform, in viewport coords).
 */
import { interpolate, useCurrentFrame, useVideoConfig, spring, Easing } from "remotion";
import { SPRING_BOUNCE } from "../../helpers/animations";

interface Props {
  frameIn: number;
  frameOut?: number;
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

/** Single L-bracket corner rendered at its absolute position */
function Corner({ x, y, flipH, flipV, color, scale }: {
  x: number; y: number; flipH: boolean; flipV: boolean;
  color: string; scale: number;
}) {
  const W = 18; const T = 3; const R = 3;
  return (
    <div style={{
      position: "absolute",
      left: x, top: y,
      width: W, height: W,
      transform: `scale(${scale}) ${flipH ? "scaleX(-1)" : ""} ${flipV ? "scaleY(-1)" : ""}`,
      transformOrigin: flipH ? "right center" : "left center",
      pointerEvents: "none",
    }}>
      {/* Horizontal arm */}
      <div style={{ position: "absolute", top: 0, left: 0, width: W, height: T, borderRadius: R, background: color, boxShadow: `0 0 6px ${color}` }} />
      {/* Vertical arm */}
      <div style={{ position: "absolute", top: 0, left: 0, width: T, height: W, borderRadius: R, background: color, boxShadow: `0 0 6px ${color}` }} />
    </div>
  );
}

export function HighlightRing({
  frameIn, frameOut,
  x, y, width, height,
  color = "#984EFD",
  radius = 10,
  label,
  labelSide = "bottom",
}: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rel = frame - frameIn;

  const s = spring({ frame: rel, fps, config: SPRING_BOUNCE });

  const fadeInV  = interpolate(rel, [0, 8], [0, 1], { ...clamp, easing: Easing.bezier(0, 0, 0.2, 1) });
  const fadeOutV = frameOut != null
    ? interpolate(frame, [frameOut - 8, frameOut], [1, 0], clamp)
    : 1;
  const opacity = fadeInV * fadeOutV;

  // Corner brackets spring in from outside
  const cornerSlide = interpolate(rel, [0, 22], [10, 0], { easing: easeOut, ...clamp });

  // Scanning sweep line
  const sweepY = interpolate((rel % 50) / 50, [0, 1], [0, height], clamp);
  const sweepOp = interpolate(rel, [0, 8, Math.max(9, (frameOut ?? frameIn + 1000) - frameIn - 10), (frameOut ?? frameIn + 1000) - frameIn], [0, 0.7, 0.7, 0], clamp);

  // Inner glow tint
  const glowOp = interpolate(rel, [0, 12], [0, 0.06], clamp) * (fadeOutV);

  // Label spring
  const labelS = interpolate(rel, [8, 26], [0.7, 1], { easing: easeOut, ...clamp });
  const labelOffset = 12;

  const labelStyle: React.CSSProperties = {
    position: "absolute",
    background: color,
    color: "#fff",
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 700,
    fontSize: 20,
    padding: "5px 16px",
    borderRadius: 999,
    whiteSpace: "nowrap",
    boxShadow: `0 4px 18px ${color}55`,
    opacity,
    scale: String(labelS),
    ...(labelSide === "bottom" && { top: height + labelOffset, left: "50%", translate: "-50% 0px" }),
    ...(labelSide === "top"    && { bottom: height + labelOffset, left: "50%", translate: "-50% 0px" }),
    ...(labelSide === "right"  && { left: width + labelOffset, top: "50%", translate: "0px -50%" }),
    ...(labelSide === "left"   && { right: width + labelOffset, top: "50%", translate: "0px -50%" }),
  };

  return (
    <div style={{ position: "absolute", left: x, top: y, width, height, pointerEvents: "none", opacity }}>
      {/* Inner glow */}
      <div style={{
        position: "absolute", inset: 0,
        borderRadius: radius,
        background: color,
        opacity: glowOp,
      }} />

      {/* Scan sweep line */}
      <div style={{
        position: "absolute",
        left: 0, top: sweepY,
        width: "100%", height: 2,
        background: `linear-gradient(90deg, transparent 0%, ${color}50 20%, ${color} 50%, ${color}50 80%, transparent 100%)`,
        opacity: sweepOp,
        pointerEvents: "none",
        borderRadius: 999,
      }} />

      {/* Corner L-brackets */}
      <Corner x={-cornerSlide - 4} y={-cornerSlide - 4} flipH={false} flipV={false} color={color} scale={1} />
      <Corner x={width + cornerSlide - 14} y={-cornerSlide - 4} flipH={true} flipV={false} color={color} scale={1} />
      <Corner x={-cornerSlide - 4} y={height + cornerSlide - 14} flipH={false} flipV={true} color={color} scale={1} />
      <Corner x={width + cornerSlide - 14} y={height + cornerSlide - 14} flipH={true} flipV={true} color={color} scale={1} />

      {/* Outer pulse ring */}
      <div style={{
        position: "absolute",
        inset: -6,
        borderRadius: radius + 4,
        border: `1.5px solid ${color}30`,
        transform: `scale(${1 + Math.sin(rel * 0.08) * 0.025})`,
      }} />

      {/* Label */}
      {label && <div style={labelStyle}>{label}</div>}
    </div>
  );
}
