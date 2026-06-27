/**
 * ButtonPress — wraps a rectangular region and animates a button-press effect:
 * - scale down on press frame
 * - ripple circle expands out
 * - scale back up
 *
 * Place it absolutely over the target button in a screenshot.
 */
import { interpolate, useCurrentFrame, Easing } from "remotion";

interface Props {
  /** Frame when the press starts */
  pressFrame: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  radius?: number;
}

export function ButtonPress({ pressFrame, x, y, width, height, color = "#984EFD", radius = 10 }: Props) {
  const frame = useCurrentFrame();
  const rel = frame - pressFrame;

  if (rel < 0 || rel > 40) return null;

  const scale = interpolate(rel, [0, 5, 14, 28], [1, 0.93, 0.93, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 0, 0.4, 1),
  });

  const rippleScale = interpolate(rel, [4, 30], [0, 2.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0, 0, 0.2, 1),
  });

  const rippleOpacity = interpolate(rel, [4, 8, 30], [0, 0.45, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const overlayOpacity = interpolate(rel, [0, 4, 14, 28], [0, 0.18, 0.18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        pointerEvents: "none",
        transform: `scale(${scale})`,
        transformOrigin: "center center",
        borderRadius: radius,
        overflow: "visible",
      }}
    >
      {/* Press overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          background: color,
          opacity: overlayOpacity,
        }}
      />
      {/* Ripple */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: Math.max(width, height),
          height: Math.max(width, height),
          borderRadius: "50%",
          background: color,
          opacity: rippleOpacity,
          transform: `translate(-50%, -50%) scale(${rippleScale})`,
        }}
      />
    </div>
  );
}
