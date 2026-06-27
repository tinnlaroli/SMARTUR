/**
 * Intro — Pantalla de apertura (0→T.INTRO_OUT)
 * Orbs de gradiente animados, texto por segmentos con slide-up escalonado,
 * partículas de stats flotantes y pill de marca.
 */
import { useCurrentFrame, Easing, interpolate, Img, staticFile } from "remotion";
import { fadeIn, fadeOut, slideUp } from "../helpers/animations";
import { T } from "../helpers/timing";

const easeOut  = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);
const clamp    = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// Segmentos del tagline animados individualmente
const TAGLINE_PARTS = [
  { text: "IA que guía,",   color: "#1E1E23", delay: 40 },
  { text: "turismo que une", color: "#984EFD", delay: 58 },
];

export function Intro() {
  const frame = useCurrentFrame();
  const exitOpacity = fadeOut(frame, T.INTRO_OUT, 18);

  // Logo entry
  const logoScale   = interpolate(frame, [0, 36], [0.60, 1.0], { easing: easeOut, ...clamp });
  const logoOpacity = fadeIn(frame, 5, 22);

  // Orb 1 (purple top-left)
  const orb1Scale  = interpolate(frame, [0, 120, 240], [0.8, 1.2, 1.0], { easing: easeInOut, ...clamp });
  const orb1X      = interpolate(frame, [0, 180], [-60, -20],            { easing: easeInOut, ...clamp });
  const orb1Y      = interpolate(frame, [0, 180], [-60, -20],            { easing: easeInOut, ...clamp });

  // Orb 2 (cyan bottom-right)
  const orb2Scale  = interpolate(frame, [30, 150, 270], [0.9, 1.15, 0.95], { easing: easeInOut, ...clamp });
  const orb2X      = interpolate(frame, [0, 180], [1140, 1100],            { easing: easeInOut, ...clamp });
  const orb2Y      = interpolate(frame, [0, 180], [1980, 1940],            { easing: easeInOut, ...clamp });

  // Orb 3 (pink center subtle)
  const orb3Opacity = interpolate(frame, [20, 60, 180, 240], [0, 0.6, 0.6, 0.4], { easing: easeInOut, ...clamp });

  // Subtitle
  const subOpacity = fadeIn(frame, 82, 20);
  const subY       = slideUp(frame, 82, 30, 20);

  // Badge
  const badgeOpacity = fadeIn(frame, 118, 20);
  const badgeScale   = interpolate(frame, [118, 138], [0.7, 1], { easing: easeOut, ...clamp });

  // Scanning line sweep on entry (frame 5→80)
  const scanX     = interpolate(frame, [5, 80], [-120, 1200], { easing: easeOut, ...clamp });
  const scanOp    = interpolate(frame, [5, 16, 68, 80], [0, 0.55, 0.55, 0], clamp);

  // Logo glow pulse
  const logoPulse = 0.20 + Math.sin(frame * 0.07) * 0.10;

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: "#F7F5FF",
      overflow: "hidden",
      opacity: exitOpacity,
    }}>
      {/* ── Dot grid ── */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "radial-gradient(circle, #984EFD18 1.5px, transparent 1.5px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
        opacity: 0.55,
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 80%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 80%)",
      }} />

      {/* ── Orb 1 — purple top-left ── */}
      <div style={{
        position: "absolute",
        width: 900, height: 900,
        borderRadius: "50%",
        background: "radial-gradient(circle, #984EFD22 0%, #984EFD08 50%, transparent 70%)",
        left: orb1X, top: orb1Y,
        scale: String(orb1Scale),
        pointerEvents: "none",
      }} />

      {/* ── Orb 2 — cyan bottom-right ── */}
      <div style={{
        position: "absolute",
        width: 800, height: 800,
        borderRadius: "50%",
        background: "radial-gradient(circle, #4DB9CA22 0%, #4DB9CA08 50%, transparent 70%)",
        left: orb2X, top: orb2Y,
        scale: String(orb2Scale),
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }} />

      {/* ── Orb 3 — pink center ── */}
      <div style={{
        position: "absolute",
        width: 600, height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, #FC478E12 0%, transparent 65%)",
        left: "50%", top: "55%",
        transform: "translate(-50%, -50%)",
        opacity: orb3Opacity,
        pointerEvents: "none",
      }} />

      {/* ── Scanning entry line ── */}
      {scanOp > 0 && (
        <div style={{
          position: "absolute",
          left: scanX, top: 0, bottom: 0,
          width: 120,
          background: "linear-gradient(90deg, transparent 0%, rgba(152,78,253,0.12) 40%, rgba(255,255,255,0.30) 50%, rgba(152,78,253,0.12) 60%, transparent 100%)",
          pointerEvents: "none",
          opacity: scanOp,
          zIndex: 2,
          transform: "skewX(-8deg)",
        }} />
      )}

      {/* ── Main content — centered ── */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 0,
      }}>
        {/* Logo with glow */}
        <div style={{ position: "relative", scale: String(logoScale), opacity: logoOpacity, marginBottom: 60 }}>
          {/* Glow ring behind logo */}
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            width: 340, height: 340, borderRadius: "50%",
            background: `radial-gradient(circle, rgba(152,78,253,${logoPulse}) 0%, transparent 65%)`,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }} />
          <Img src={staticFile("logo.png")} style={{ width: 300, height: "auto", position: "relative" }} />
        </div>

        {/* Tagline — segmento por segmento */}
        <div style={{
          textAlign: "center",
          lineHeight: 1.1,
          padding: "0 60px",
        }}>
          {TAGLINE_PARTS.map(({ text, color, delay }) => {
            const opacity   = fadeIn(frame, delay, 18);
            const translateY = slideUp(frame, delay, 38, 22);
            return (
              <div key={text} style={{
                display: "block",
                fontFamily: "'Cal Sans','Outfit',sans-serif",
                fontWeight: 700,
                fontSize: 76,
                color,
                opacity,
                translate: `0px ${translateY}px`,
              }}>
                {text}
              </div>
            );
          })}
        </div>

        {/* Subtitle */}
        <div style={{
          fontFamily: "'Outfit',sans-serif",
          fontSize: 34,
          fontWeight: 400,
          color: "#50505A",
          textAlign: "center",
          opacity: subOpacity,
          translate: `0px ${subY}px`,
          marginTop: 40,
          maxWidth: 820,
          lineHeight: 1.55,
          padding: "0 60px",
        }}>
          La plataforma que <strong style={{ color: "#984EFD", fontWeight: 700 }}>conecta</strong> prestadores turísticos
          con viajeros en las Altas Montañas de Veracruz.
        </div>

        {/* Badge pill */}
        <div style={{
          marginTop: 70,
          background: "#984EFD",
          color: "#fff",
          fontFamily: "'Outfit',sans-serif",
          fontWeight: 700,
          fontSize: 26,
          letterSpacing: "0.14em",
          padding: "12px 40px",
          borderRadius: 999,
          opacity: badgeOpacity,
          scale: String(badgeScale),
          boxShadow: "0 12px 40px rgba(152,78,253,0.35)",
          textTransform: "uppercase",
        }}>
          SMARTUR · VERACRUZ
        </div>
      </div>
    </div>
  );
}
