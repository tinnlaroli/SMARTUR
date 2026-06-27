/**
 * BeatCard — full-screen typographic punch between major steps.
 * Used as status reveals between B2B steps and motivational beats in B2C.
 * Max 2 lines, each pops in with spring scale 0.6→1.0 staggered 8 frames apart.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { fadeIn, fadeOut } from "../../helpers/animations";

export interface BeatCardProps {
  frameIn:     number;
  frameOut:    number;
  lines:       string[];   // max 2 lines
  accentColor: string;
  bgColor?:    string;
  icon?:       string;     // emoji or symbol displayed above text
}

const clamp     = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const easeSmooth = Easing.bezier(0.16, 1, 0.3, 1);

// Animated ambient dot — simple orbiting spark
function Spark({ index, color, totalCount }: { index: number; color: string; totalCount: number }) {
  const frame = useCurrentFrame();
  const angle  = (index / totalCount) * Math.PI * 2 + index * 0.41;
  const speed  = 0.007 + (index % 5) * 0.002;
  const r      = 180 + (index % 6) * 40;
  const t      = frame * speed;
  const ox     = Math.cos(angle + t) * r;
  const oy     = Math.sin(angle + t) * r * 0.55; // elliptical orbit
  const size   = 3 + (index % 4) * 2;
  const opBase = 0.18 + (index % 3) * 0.08;
  const op     = opBase * (0.7 + 0.3 * Math.sin(frame * 0.06 + index));

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

export function BeatCard({
  frameIn, frameOut,
  lines,
  accentColor,
  bgColor = "#FAFAF9",
  icon,
}: BeatCardProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rel = frame - frameIn;

  if (frame < frameIn || frame > frameOut + 12) return null;

  const cardOpacity = fadeIn(frame, frameIn, 8) * fadeOut(frame, frameOut, 10);

  // Accent line grows in after last line
  const lineEndRel = (lines.length - 1) * 8;
  const lineW = interpolate(rel - lineEndRel - 4, [0, 20], [0, 140], {
    easing: easeSmooth, ...clamp,
  });

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: bgColor,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 300,
      opacity: cardOpacity,
      overflow: "hidden",
    }}>

      {/* Ambient sparks */}
      {Array.from({ length: 20 }, (_, i) => (
        <Spark key={i} index={i} color={accentColor} totalCount={20} />
      ))}

      {/* Icon */}
      {icon && (
        <div style={{
          fontSize: 80,
          marginBottom: 24,
          opacity: interpolate(rel, [0, 10], [0, 1], clamp),
          scale: String(interpolate(rel, [0, 14], [0.5, 1], { easing: easeSmooth, ...clamp })),
        }}>
          {icon}
        </div>
      )}

      {/* Text lines — each springs in with 8-frame stagger + gradient sweep */}
      {lines.map((line, i) => {
        const lineRel = rel - i * 8;
        const s = spring({
          frame: lineRel,
          fps,
          config: { damping: 13, stiffness: 190, mass: 0.7 },
        });
        const lineScale   = 0.55 + 0.45 * s;
        const lineOpacity = interpolate(lineRel, [0, 8], [0, 1], clamp);

        // Gradient sweep: shine slides across the text from left to right
        const sweepX = interpolate(lineRel, [8, 48], [-100, 120], { easing: easeSmooth, ...clamp });

        return (
          <div
            key={i}
            style={{
              position: "relative",
              fontFamily:    "'Cal Sans','Outfit',sans-serif",
              fontSize:      72,
              fontWeight:    700,
              color:         accentColor,
              textAlign:     "center",
              lineHeight:    1.1,
              letterSpacing: "-0.01em",
              scale:         String(lineScale),
              opacity:       lineOpacity,
              whiteSpace:    "nowrap",
              // Gradient text via background-clip trick
              background:    `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}CC 40%, #ffffff 50%, ${accentColor}CC 60%, ${accentColor} 100%)`,
              backgroundSize: "300% 100%",
              backgroundPosition: `${100 - sweepX}% 0`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {line}
          </div>
        );
      })}

      {/* Thin accent line */}
      <div style={{
        height:       3,
        width:        lineW,
        background:   accentColor,
        borderRadius: 999,
        marginTop:    28,
        boxShadow:    `0 0 12px ${accentColor}60`,
      }} />
    </div>
  );
}
