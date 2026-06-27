/**
 * ZoomRegion — Ken Burns-style zoom into a specific region of the canvas.
 * Wraps children and applies a smooth scale + translate so the focal point
 * ends up centered in the viewport.
 *
 * Props:
 *   frameIn     — frame when zoom starts
 *   frameOut    — frame when zoom returns to 1× (or end of scene)
 *   targetX/Y   — focus point as 0–1 fraction of the container (0.5 = center)
 *   zoomScale   — how much to zoom in (e.g. 1.8 = 80% zoom)
 *   duration    — frames to reach full zoom (default 24)
 */
import { interpolate, useCurrentFrame, Easing } from "remotion";

interface Props {
  frameIn: number;
  frameOut: number;
  targetX?: number;
  targetY?: number;
  zoomScale?: number;
  duration?: number;
  children: React.ReactNode;
  width?: number;
  height?: number;
}

const ease = Easing.bezier(0.4, 0, 0.2, 1);

export function ZoomRegion({
  frameIn,
  frameOut,
  targetX = 0.5,
  targetY = 0.5,
  zoomScale = 1.7,
  duration = 24,
  children,
  width = 1080,
  height = 1920,
}: Props) {
  const frame = useCurrentFrame();

  const zoomIn = interpolate(frame, [frameIn, frameIn + duration], [1, zoomScale], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  const zoomOut = interpolate(frame, [frameOut - duration, frameOut], [zoomScale, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  const scale = frame < frameOut - duration ? zoomIn : zoomOut;

  // Translate so the target point stays centered
  const tx = (0.5 - targetX) * width  * (scale - 1);
  const ty = (0.5 - targetY) * height * (scale - 1);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale}) translate(${tx / scale}px, ${ty / scale}px)`,
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
