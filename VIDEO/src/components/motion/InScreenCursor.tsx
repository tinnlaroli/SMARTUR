/**
 * InScreenCursor — cursor con trail, movimiento natural y click multi-ripple.
 * Usar position:absolute dentro de un contenedor position:relative.
 */
import { interpolate, useCurrentFrame, Easing } from "remotion";

interface Keyframe { rel: number; x: number; y: number }
interface Click    { rel: number }

interface Props {
  frameIn: number;
  keyframes: Keyframe[];
  clicks?: Click[];
  scale?: number;
}

const easeMove = Easing.bezier(0.25, 0.46, 0.45, 0.94); // ease-out natural
const clamp    = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

/** Mini ghost cursor that trails the main cursor (delayed slightly) */
function GhostCursor({ x, y, opacity, color }: { x: number; y: number; opacity: number; color: string }) {
  return (
    <div style={{
      position: "absolute",
      left: x, top: y,
      transform: "translate(-3px, -2px) scale(0.7)",
      transformOrigin: "3px 2px",
      pointerEvents: "none",
      opacity: opacity * 0.22,
    }}>
      <svg width="20" height="25" viewBox="0 0 20 25">
        <path
          d="M3 1.5L3 19L7.5 14.5L11.5 23L14 22L10 13.5L16.5 13.5L3 1.5Z"
          fill={color} stroke={color} strokeWidth="1.2" strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function InScreenCursor({ frameIn, keyframes, clicks = [], scale = 1 }: Props) {
  const frame = useCurrentFrame();
  const rel   = frame - frameIn;

  const frames = keyframes.map(k => k.rel);
  const xs     = keyframes.map(k => k.x);
  const ys     = keyframes.map(k => k.y);

  const first = frames[0];
  const last  = frames[frames.length - 1];
  if (rel < first || rel > last + 24) return null;

  const x = interpolate(rel, frames, xs, { easing: easeMove, ...clamp });
  const y = interpolate(rel, frames, ys, { easing: easeMove, ...clamp });

  // Trail: 5-frame lag
  const trailRel = Math.max(first, rel - 5);
  const trailX   = interpolate(trailRel, frames, xs, { easing: easeMove, ...clamp });
  const trailY   = interpolate(trailRel, frames, ys, { easing: easeMove, ...clamp });

  const fade = interpolate(rel, [first, first + 6, last + 6, last + 24], [0, 1, 1, 0], clamp);

  const activeClick = clicks.find(c => rel >= c.rel && rel < c.rel + 22);
  const clickProg   = activeClick
    ? interpolate(rel, [activeClick.rel, activeClick.rel + 22], [0, 1], clamp)
    : 0;

  const isHolding = activeClick != null;
  const cursorScale = isHolding
    ? interpolate(rel, [activeClick!.rel, activeClick!.rel + 6, activeClick!.rel + 14], [1, 0.82, 0.95], clamp)
    : 1;

  const cursorColor = isHolding ? "#984EFD" : "white";
  const strokeColor = isHolding ? "#7C3BDB" : "#1a1a1a";

  return (
    <>
      {/* Trail ghost */}
      <GhostCursor x={trailX} y={trailY} opacity={fade} color="#984EFD" />

      {/* Main cursor */}
      <div style={{
        position: "absolute",
        left: x, top: y,
        transform: `translate(-3px, -2px) scale(${scale * cursorScale})`,
        transformOrigin: "3px 2px",
        pointerEvents: "none",
        zIndex: 999,
        opacity: fade,
      }}>
        {/* Ripple rings on click */}
        {isHolding && clickProg > 0 && (
          <>
            <div style={{
              position: "absolute", left: -20, top: -20,
              width: 40, height: 40, borderRadius: "50%",
              border: "2px solid rgba(152,78,253,0.75)",
              scale: String(1 + clickProg * 2.2),
              opacity: (1 - clickProg) * 0.9,
            }} />
            {clickProg > 0.18 && (
              <div style={{
                position: "absolute", left: -14, top: -14,
                width: 28, height: 28, borderRadius: "50%",
                background: "rgba(152,78,253,0.15)",
                scale: String(1 + (clickProg - 0.18) * 1.8),
                opacity: Math.max(0, 0.75 - (clickProg - 0.18) * 1.4),
              }} />
            )}
            {clickProg > 0.35 && (
              <div style={{
                position: "absolute", left: -10, top: -10,
                width: 20, height: 20, borderRadius: "50%",
                border: `1.5px solid rgba(152,78,253,0.50)`,
                scale: String(1 + (clickProg - 0.35) * 2.5),
                opacity: Math.max(0, 0.6 - (clickProg - 0.35) * 1.2),
              }} />
            )}
          </>
        )}

        {/* Cursor dot highlight on hover */}
        <div style={{
          position: "absolute", left: -6, top: -6,
          width: 12, height: 12, borderRadius: "50%",
          background: "rgba(152,78,253,0.20)",
          opacity: fade * 0.8,
        }} />

        {/* Cursor SVG */}
        <svg
          width="20" height="25" viewBox="0 0 20 25"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "3px 2px",
            filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.32)) drop-shadow(0 0 3px rgba(152,78,253,0.20))",
          }}
        >
          <path
            d="M3 1.5L3 19L7.5 14.5L11.5 23L14 22L10 13.5L16.5 13.5L3 1.5Z"
            fill={cursorColor}
            stroke={strokeColor}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </>
  );
}
