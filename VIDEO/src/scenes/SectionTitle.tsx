/**
 * SectionTitle — Pantalla divisora entre B2B y B2C.
 * Entrada dramática con scale spring + rotación leve, texto letra por letra,
 * partícula burst al entrar, partículas ambientales persistentes y fondo gradiente animado.
 */
import { type LucideIcon } from "lucide-react";
import { useCurrentFrame, Easing, interpolate } from "remotion";
import { fadeIn, fadeOut } from "../helpers/animations";

const easeSpring = Easing.bezier(0.34, 1.56, 0.64, 1);
const easeSmooth = Easing.bezier(0.16, 1, 0.3, 1);
const clamp      = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// Burst particles on entry
const BURST_COUNT = 18;

interface ParticleProps { index: number; color: string; frameIn: number }

function BurstParticle({ index, color, frameIn }: ParticleProps) {
  const frame = useCurrentFrame();
  const rel   = frame - frameIn;
  const angle = (index / BURST_COUNT) * Math.PI * 2;
  const prog  = interpolate(rel, [0, 40], [0, 1], { easing: easeSmooth, ...clamp });
  const r     = prog * (140 + (index % 6) * 32);
  const ox    = Math.cos(angle) * r;
  const oy    = Math.sin(angle) * r;
  const op    = interpolate(rel, [0, 10, 38, 55], [0, 0.95, 0.75, 0], clamp);
  const size  = 6 + (index % 5) * 4;

  return (
    <div style={{
      position: "absolute",
      left: "50%", top: "50%",
      width: size, height: size,
      borderRadius: "50%",
      background: color,
      opacity: op,
      translate: `calc(${ox}px - ${size / 2}px) calc(${oy}px - ${size / 2}px)`,
      pointerEvents: "none",
    }} />
  );
}

// Persistent ambient spark particles (slow orbit)
const SPARK_COUNT = 24;

function AmbientSpark({ index, color }: { index: number; color: string }) {
  const frame = useCurrentFrame();
  const angle  = (index / SPARK_COUNT) * Math.PI * 2 + index * 0.53;
  const speed  = 0.005 + (index % 7) * 0.002;
  const rx     = 380 + (index % 8) * 48;
  const ry     = 200 + (index % 5) * 30;
  const t      = frame * speed;
  const ox     = Math.cos(angle + t) * rx;
  const oy     = Math.sin(angle + t) * ry;
  const size   = 2 + (index % 4) * 1.5;
  const op     = (0.12 + (index % 4) * 0.06) * (0.7 + 0.3 * Math.sin(frame * 0.04 + index));

  return (
    <div style={{
      position: "absolute",
      left: "50%", top: "50%",
      width: size, height: size,
      borderRadius: "50%",
      background: color,
      opacity: op,
      pointerEvents: "none",
      translate: `calc(${ox}px - ${size / 2}px) calc(${oy}px - ${size / 2}px)`,
    }} />
  );
}

export function SectionTitle({
  label,
  sublabel,
  Icon,
  color,
  frameIn,
  frameOut,
}: {
  label: string;
  sublabel?: string;
  Icon: LucideIcon;
  color: string;
  frameIn: number;
  frameOut: number;
}) {
  const frame   = useCurrentFrame();
  const relFrame = frame - frameIn;

  // ── Card entry (more dramatic: 0.7→1.0 with overshoot spring) ───────────────
  const cardScale  = interpolate(relFrame, [0, 38], [0.7, 1], { easing: easeSpring, ...clamp });
  const cardRot    = interpolate(relFrame, [0, 38], [-5, 0],  { easing: easeSpring, ...clamp });
  const opacity    = fadeIn(relFrame, 0, 12) * fadeOut(frame, frameOut, 14);

  // ── Animated gradient background ──────────────────────────────────────────
  const bgHue = interpolate(relFrame, [0, 60, 120], [0, 8, 0], clamp);

  // ── Icon pulse ────────────────────────────────────────────────────────────
  const iconScale  = interpolate(relFrame, [12, 40], [0, 1], { easing: easeSpring, ...clamp });

  // ── Label stagger ─────────────────────────────────────────────────────────
  const labelOpacity = fadeIn(relFrame, 20, 15);
  const labelY       = interpolate(relFrame, [20, 38], [24, 0], { easing: easeSmooth, ...clamp });
  const subOpacity   = fadeIn(relFrame, 38, 12);
  const subY         = interpolate(relFrame, [38, 52], [16, 0], { easing: easeSmooth, ...clamp });

  // ── Shine sweep ───────────────────────────────────────────────────────────
  const shineX = interpolate(relFrame, [8, 50], [-100, 160], { easing: easeSmooth, ...clamp });

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: `${color}0E`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      opacity,
      overflow: "hidden",
    }}>
      {/* ── Animated background ring ── */}
      <div style={{
        position: "absolute",
        width: 1400, height: 1400,
        borderRadius: "50%",
        border: `80px solid ${color}08`,
        left: "50%", top: "50%",
        transform: "translate(-50%, -50%)",
        scale: String(0.6 + relFrame * 0.004),
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        width: 1000, height: 1000,
        borderRadius: "50%",
        border: `50px solid ${color}0C`,
        left: "50%", top: "50%",
        transform: "translate(-50%, -50%)",
        scale: String(0.5 + relFrame * 0.003),
        pointerEvents: "none",
      }} />

      {/* ── Ambient spark particles ── */}
      {Array.from({ length: SPARK_COUNT }, (_, i) => (
        <AmbientSpark key={`spark-${i}`} index={i} color={color} />
      ))}

      {/* ── Burst particles on entry ── */}
      {relFrame >= 0 && relFrame <= 65 && Array.from({ length: BURST_COUNT }, (_, i) => (
        <BurstParticle key={`burst-${i}`} index={i} color={color} frameIn={frameIn} />
      ))}

      {/* ── Main card ── */}
      <div style={{
        background: color,
        borderRadius: 40,
        padding: "72px 120px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 28,
        boxShadow: `0 40px 100px ${color}50, 0 0 0 1px ${color}30`,
        scale: String(cardScale),
        rotate: `${cardRot}deg`,
        position: "relative",
        overflow: "hidden",
        minWidth: 680,
      }}>
        {/* Shine sweep */}
        <div style={{
          position: "absolute", top: 0, bottom: 0,
          width: 80,
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
          left: `${shineX}%`,
          pointerEvents: "none",
          transform: "skewX(-12deg)",
        }} />

        {/* Icon */}
        <div style={{ scale: String(iconScale) }}>
          <Icon size={110} color="#fff" strokeWidth={1.5} />
        </div>

        {/* Label */}
        <div style={{
          fontFamily: "'Cal Sans','Outfit',sans-serif",
          fontWeight: 700,
          fontSize: 96,
          color: "#fff",
          textAlign: "center",
          lineHeight: 1.0,
          opacity: labelOpacity,
          translate: `0px ${labelY}px`,
          letterSpacing: "-0.02em",
        }}>
          {label}
        </div>

        {/* Thin accent line under label */}
        <div style={{
          height: 3,
          width: interpolate(relFrame, [30, 55], [0, 220], { easing: easeSmooth, ...clamp }),
          background: "rgba(255,255,255,0.55)",
          borderRadius: 999,
          opacity: subOpacity,
          marginTop: -4,
        }} />

        {/* Sublabel */}
        {sublabel && (
          <div style={{
            fontFamily: "'Outfit',sans-serif",
            fontSize: 30,
            fontWeight: 500,
            color: "rgba(255,255,255,0.85)",
            textAlign: "center",
            opacity: subOpacity,
            translate: `0px ${subY}px`,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
          }}>
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}
