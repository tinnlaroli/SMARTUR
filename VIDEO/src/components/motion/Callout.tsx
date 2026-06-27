/**
 * Callout — animated label with a line pointing to a UI element.
 * Appears with a spring animation.
 */
import { useCurrentFrame, useVideoConfig, spring, interpolate, Easing } from "remotion";
import { SPRING_SMOOTH } from "../../helpers/animations";

interface Props {
  frameIn: number;
  frameOut?: number;
  /** Tip of the pointer arrow (absolute coords in the scene) */
  tipX: number;
  tipY: number;
  /** Where the label box appears (offset from tip) */
  offsetX?: number;
  offsetY?: number;
  label: string;
  sublabel?: string;
  color?: string;
}

export function Callout({
  frameIn,
  frameOut,
  tipX, tipY,
  offsetX = 80,
  offsetY = -60,
  label,
  sublabel,
  color = "#984EFD",
}: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rel = frame - frameIn;

  const s = spring({ frame: rel, fps, config: SPRING_SMOOTH });

  const fadeOut = frameOut != null
    ? interpolate(frame, [frameOut - 10, frameOut], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;
  const opacity = Math.min(1, s * 1.5) * fadeOut;

  const labelX = tipX + offsetX;
  const labelY = tipY + offsetY;
  const lineLen = Math.hypot(offsetX, offsetY);

  // Line draw animation
  const dashOffset = interpolate(rel, [0, 18], [lineLen, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0, 0, 0.2, 1),
  });

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity }}>
      {/* SVG connector line */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
        <line
          x1={tipX} y1={tipY}
          x2={labelX + (offsetX > 0 ? 0 : 100)} y2={labelY + 20}
          stroke={color}
          strokeWidth={2.5}
          strokeDasharray={lineLen}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
        {/* Tip dot */}
        <circle cx={tipX} cy={tipY} r={5} fill={color} opacity={opacity} />
      </svg>

      {/* Label box */}
      <div style={{
        position: "absolute",
        left: labelX,
        top: labelY,
        background: color,
        color: "#fff",
        borderRadius: 16,
        padding: "10px 20px",
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 700,
        fontSize: 22,
        whiteSpace: "nowrap",
        boxShadow: `0 8px 28px ${color}50`,
        transform: `scale(${0.7 + 0.3 * s}) translateY(${(1 - s) * 14}px)`,
        transformOrigin: offsetX > 0 ? "left center" : "right center",
      }}>
        {label}
        {sublabel && (
          <div style={{ fontWeight: 400, fontSize: 16, opacity: 0.85, marginTop: 2 }}>{sublabel}</div>
        )}
      </div>
    </div>
  );
}
