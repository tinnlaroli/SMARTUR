import { interpolate, useCurrentFrame, Easing } from "remotion";

interface Keyframe {
  frame: number;
  x: number;
  y: number;
}

interface ClickEvent {
  frame: number;
}

interface Props {
  keyframes: Keyframe[];
  clicks?: ClickEvent[];
  scale?: number;
}

function easeInOut(t: number) {
  return Easing.bezier(0.4, 0, 0.2, 1)(t);
}

export function MouseCursor({ keyframes, clicks = [], scale = 1 }: Props) {
  const frame = useCurrentFrame();

  // Interpolate X and Y through all keyframes
  const frames = keyframes.map((k) => k.frame);
  const xs = keyframes.map((k) => k.x);
  const ys = keyframes.map((k) => k.y);

  const x = interpolate(frame, frames, xs, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeInOut,
  });

  const y = interpolate(frame, frames, ys, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeInOut,
  });

  // Click ripple: find active click
  const activeClick = clicks.find(
    (c) => frame >= c.frame && frame < c.frame + 20
  );
  const clickProgress = activeClick
    ? interpolate(frame, [activeClick.frame, activeClick.frame + 20], [0, 1], {
        extrapolateRight: "clamp",
        easing: Easing.bezier(0, 0, 0.2, 1),
      })
    : 0;

  const cursorScale = activeClick
    ? interpolate(
        frame,
        [activeClick.frame, activeClick.frame + 6, activeClick.frame + 14],
        [1, 0.82, 1],
        { extrapolateRight: "clamp", easing: easeInOut }
      )
    : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-4px, -2px) scale(${scale})`,
        transformOrigin: "4px 2px",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      {/* Click ripple ring */}
      {activeClick && clickProgress > 0 && (
        <div
          style={{
            position: "absolute",
            left: -20,
            top: -20,
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "2px solid rgba(152,78,253,0.7)",
            transform: `scale(${1 + clickProgress * 1.8})`,
            opacity: 1 - clickProgress,
            pointerEvents: "none",
          }}
        />
      )}
      {/* Cursor SVG */}
      <svg
        width="26"
        height="32"
        viewBox="0 0 26 32"
        fill="none"
        style={{ transform: `scale(${cursorScale})`, transformOrigin: "4px 2px", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.28))" }}
      >
        <path
          d="M4 2L4 25L9.5 19.5L14.5 29L17.5 27.5L12.5 17.5L21 17.5L4 2Z"
          fill="white"
          stroke="#1a1a1a"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
