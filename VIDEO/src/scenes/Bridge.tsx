/**
 * Bridge — "Dos flujos. Un ecosistema."
 * Word-by-word spring reveal, gradient beam from center, pills slide in from sides.
 */
import { Building2, Compass } from "lucide-react";
import { useCurrentFrame, interpolate, spring, Easing, useVideoConfig } from "remotion";
import { fadeIn, fadeOut } from "../helpers/animations";
import { T } from "../helpers/timing";

const easeOut   = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);
const clamp     = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const PURPLE = "#984EFD";
const CYAN   = "#4DB9CA";

// ── Word spring reveal ────────────────────────────────────────────────────────

interface WordProps { text: string; color: string; delay: number; fps: number }

function SpringWord({ text, color, delay, fps }: WordProps) {
  const frame = useCurrentFrame();
  const s = spring({ frame: frame - delay, fps, config: { damping: 13, stiffness: 200, mass: 0.7 } });
  const op = interpolate(frame - delay, [0, 8], [0, 1], clamp);
  return (
    <span style={{
      display: "inline-block",
      color,
      scale: String(0.55 + 0.45 * s),
      opacity: op,
      transformOrigin: "bottom center",
    }}>
      {text}
    </span>
  );
}

// ── Floating particle ─────────────────────────────────────────────────────────

function FloatParticle({ i }: { i: number }) {
  const frame = useCurrentFrame();
  const angle = (i / 12) * Math.PI * 2 + i * 0.7;
  const r     = 280 + (i % 5) * 60;
  const speed = 0.006 + (i % 4) * 0.002;
  const t     = frame * speed;
  const ox    = Math.cos(angle + t) * r;
  const oy    = Math.sin(angle + t) * r * 0.5;
  const sz    = 4 + (i % 3) * 3;
  const color = i % 2 === 0 ? PURPLE : CYAN;
  const op    = (0.15 + (i % 3) * 0.07) * (0.7 + 0.3 * Math.sin(frame * 0.05 + i));
  return (
    <div style={{
      position: "absolute", left: "50%", top: "50%",
      width: sz, height: sz, borderRadius: "50%", background: color,
      opacity: op, pointerEvents: "none",
      translate: `calc(${ox}px - ${sz / 2}px) calc(${oy}px - ${sz / 2}px)`,
    }} />
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Bridge() {
  const frame  = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rel    = frame - T.BRIDGE_IN;
  const opacity = fadeIn(rel, 0, 12) * fadeOut(frame, T.BRIDGE_OUT, 14);

  // Orb drifts
  const orb1X = interpolate(rel, [0, 187], [-180, -80], { easing: easeInOut, ...clamp });
  const orb1Y = interpolate(rel, [0, 187], [-180, -60], { easing: easeInOut, ...clamp });
  const orb2X = interpolate(rel, [0, 187], [1260, 1160], { easing: easeInOut, ...clamp });
  const orb2Y = interpolate(rel, [0, 187], [2100, 2000], { easing: easeInOut, ...clamp });

  // Words: "Dos" "flujos." | "Un" "ecosistema."
  const BASE = T.BRIDGE_IN;
  const words1 = [
    { text: "Dos ",    color: "#1E1E23", delay: BASE + 4  },
    { text: "flujos.",      color: "#1E1E23", delay: BASE + 14 },
  ];
  const words2 = [
    { text: "Un ",     color: "#1E1E23", delay: BASE + 28 },
    { text: "ecosistema.",  color: PURPLE,    delay: BASE + 38 },
  ];

  // Gradient beam grows from center → both ends simultaneously
  const beamStart = BASE + 54;
  const beamProg  = interpolate(frame, [beamStart, beamStart + 28], [0, 1], { easing: easeOut, ...clamp });
  const beamW     = beamProg * 480; // total half-width each side = 240px
  const beamOp    = fadeIn(frame, beamStart, 10);

  // Center sparkle
  const sparkS  = spring({ frame: frame - (beamStart + 4), fps, config: { damping: 10, stiffness: 220 } });
  const sparkOp = interpolate(frame - beamStart, [4, 16, 50, 70], [0, 1, 1, 0], clamp);

  // Pills slide in from sides
  const pill1X  = interpolate(frame, [BASE + 66, BASE + 88], [-160, 0], { easing: easeOut, ...clamp });
  const pill2X  = interpolate(frame, [BASE + 74, BASE + 96], [ 160, 0], { easing: easeOut, ...clamp });
  const pill1Op = fadeIn(frame, BASE + 66, 14);
  const pill2Op = fadeIn(frame, BASE + 74, 14);

  return (
    <div style={{ position: "absolute", inset: 0, background: "#FAFAFF", overflow: "hidden", opacity }}>
      {/* Floating particles */}
      {Array.from({ length: 12 }, (_, i) => <FloatParticle key={i} i={i} />)}

      {/* Orb 1 */}
      <div style={{
        position: "absolute", width: 760, height: 760, borderRadius: "50%",
        background: `radial-gradient(circle, ${PURPLE}1E 0%, ${PURPLE}08 50%, transparent 70%)`,
        left: orb1X, top: orb1Y, pointerEvents: "none",
      }} />
      {/* Orb 2 */}
      <div style={{
        position: "absolute", width: 680, height: 680, borderRadius: "50%",
        background: `radial-gradient(circle, ${CYAN}1E 0%, ${CYAN}08 50%, transparent 70%)`,
        left: orb2X, top: orb2Y, transform: "translate(-50%, -50%)", pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        {/* Line 1: "Dos flujos." */}
        <div style={{
          fontFamily: "'Cal Sans','Outfit',sans-serif", fontWeight: 700,
          fontSize: 96, lineHeight: 1.05, letterSpacing: "-0.02em",
          marginBottom: 4,
        }}>
          {words1.map(w => <SpringWord key={w.text} {...w} fps={fps} />)}
        </div>

        {/* Line 2: "Un ecosistema." */}
        <div style={{
          fontFamily: "'Cal Sans','Outfit',sans-serif", fontWeight: 700,
          fontSize: 96, lineHeight: 1.05, letterSpacing: "-0.02em",
          marginBottom: 64,
        }}>
          {words2.map(w => <SpringWord key={w.text} {...w} fps={fps} />)}
        </div>

        {/* Gradient beam (grows from center) */}
        <div style={{ position: "relative", width: 480, height: 3, marginBottom: 56, opacity: beamOp }}>
          {/* Left half */}
          <div style={{
            position: "absolute", right: "50%", top: 0, bottom: 0,
            width: beamW / 2,
            background: `linear-gradient(270deg, ${PURPLE}, ${CYAN})`,
            borderRadius: "999px 0 0 999px",
          }} />
          {/* Right half */}
          <div style={{
            position: "absolute", left: "50%", top: 0, bottom: 0,
            width: beamW / 2,
            background: `linear-gradient(90deg, ${PURPLE}, ${CYAN})`,
            borderRadius: "0 999px 999px 0",
          }} />
          {/* Center sparkle */}
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            width: 14, height: 14, borderRadius: "50%",
            background: `radial-gradient(circle, #fff 30%, ${PURPLE} 70%)`,
            transform: "translate(-50%, -50%)",
            scale: String(0.4 + 0.6 * sparkS),
            opacity: sparkOp,
            boxShadow: `0 0 16px 4px ${PURPLE}70`,
          }} />
        </div>

        {/* Pills */}
        <div style={{ display: "flex", gap: 36 }}>
          {/* Prestadores — slides in from LEFT */}
          <div style={{
            padding: "16px 44px", borderRadius: 999,
            background: `${PURPLE}14`, border: `2px solid ${PURPLE}40`,
            fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 32,
            color: PURPLE,
            display: "flex", alignItems: "center", gap: 14,
            opacity: pill1Op,
            translate: `${pill1X}px 0px`,
            boxShadow: `0 8px 32px ${PURPLE}18`,
          }}>
            <Building2 size={34} color={PURPLE} /> Prestadores
          </div>

          {/* Turistas — slides in from RIGHT */}
          <div style={{
            padding: "16px 44px", borderRadius: 999,
            background: `${CYAN}14`, border: `2px solid ${CYAN}40`,
            fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 32,
            color: "#2E8FA0",
            display: "flex", alignItems: "center", gap: 14,
            opacity: pill2Op,
            translate: `${pill2X}px 0px`,
            boxShadow: `0 8px 32px ${CYAN}18`,
          }}>
            <Compass size={34} color="#2E8FA0" /> Turistas
          </div>
        </div>
      </div>
    </div>
  );
}
