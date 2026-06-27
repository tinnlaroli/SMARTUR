/**
 * Outro — Cierre del video.
 * Gradiente animado, logo con glow, URL en grande, CTA y badge de app.
 */
import { Smartphone, Award, ArrowRight } from "lucide-react";
import { useCurrentFrame, Easing, interpolate, Img, staticFile } from "remotion";
import { fadeIn, slideUp } from "../helpers/animations";
import { T } from "../helpers/timing";

const easeOut     = Easing.bezier(0.16, 1, 0.3, 1);
const easeSpring  = Easing.bezier(0.34, 1.56, 0.64, 1);
const easeInOut   = Easing.bezier(0.45, 0, 0.55, 1);
const clamp       = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const STATS_OUTRO = [
  { label: "✓ 100% gratuito",      color: "#10B981" },
  { label: "✓ Sin comisión",       color: "#984EFD" },
  { label: "✓ Turistas reales",    color: "#4DB9CA" },
  { label: "✓ IA que aprende",     color: "#F59E0B" },
];

export function Outro() {
  const frame    = useCurrentFrame();
  const rel      = frame - T.OUTRO_IN;

  // ── Orbs ──────────────────────────────────────────────────────────────────
  const orb1 = interpolate(rel, [0, 120], [0.7, 1.1], { easing: easeInOut, ...clamp });
  const orb2 = interpolate(rel, [0, 100], [0.8, 1.0], { easing: easeInOut, ...clamp });

  // ── Logo ──────────────────────────────────────────────────────────────────
  const logoScale   = interpolate(rel, [0, 36], [0.6, 1], { easing: easeSpring, ...clamp });
  const logoOpacity = fadeIn(rel, 0, 20);
  const glowOpacity = interpolate(rel, [20, 60, 120, 200], [0, 0.7, 0.9, 0.6], clamp);

  // ── URL ───────────────────────────────────────────────────────────────────
  const urlOpacity  = fadeIn(rel, 28, 20);
  const urlY        = slideUp(rel, 28, 32, 20);

  // ── Tagline ───────────────────────────────────────────────────────────────
  const tagOpacity  = fadeIn(rel, 46, 18);
  const tagY        = slideUp(rel, 46, 24, 18);

  // ── CTA button ────────────────────────────────────────────────────────────
  const ctaScale    = interpolate(rel, [54, 72], [0.82, 1], { easing: easeSpring, ...clamp });
  const ctaOpacity  = fadeIn(rel, 54, 18);

  // ── Stat pills ────────────────────────────────────────────────────────────
  const pillBase = 78;

  // ── App badge ─────────────────────────────────────────────────────────────
  const badgeOpacity = fadeIn(rel, 100, 18);
  const badgeY       = slideUp(rel, 100, 26, 18);

  // ── Award ─────────────────────────────────────────────────────────────────
  const awardOpacity = fadeIn(rel, 120, 18);

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: "linear-gradient(165deg, #F7F5FF 0%, #EDE9FF 50%, #EDF9FF 100%)",
      overflow: "hidden",
    }}>
      {/* ── Orbs ── */}
      <div style={{
        position: "absolute",
        width: 900, height: 900,
        borderRadius: "50%",
        background: "radial-gradient(circle, #984EFD1E 0%, transparent 65%)",
        top: -200, left: -100,
        scale: String(orb1),
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        width: 700, height: 700,
        borderRadius: "50%",
        background: "radial-gradient(circle, #4DB9CA18 0%, transparent 65%)",
        bottom: -150, right: -80,
        scale: String(orb2),
        pointerEvents: "none",
      }} />

      {/* ── Content ── */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 0,
      }}>
        {/* Logo + glow */}
        <div style={{ position: "relative", marginBottom: 56 }}>
          <div style={{
            position: "absolute",
            width: 500, height: 300,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, #984EFD30 0%, transparent 65%)",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            opacity: glowOpacity,
            pointerEvents: "none",
          }} />
          <div style={{ scale: String(logoScale), opacity: logoOpacity, position: "relative" }}>
            <Img src={staticFile("logo.png")} style={{ width: 280, height: "auto" }} />
          </div>
        </div>

        {/* URL */}
        <div style={{
          fontFamily: "'Cal Sans','Outfit',sans-serif",
          fontWeight: 700, fontSize: 66, color: "#984EFD",
          opacity: urlOpacity,
          translate: `0px ${urlY}px`,
          letterSpacing: "-0.01em",
        }}>
          smartur.online
        </div>

        {/* Tagline */}
        <div style={{
          fontFamily: "'Outfit',sans-serif",
          fontSize: 30, fontWeight: 500, color: "#50505A",
          textAlign: "center",
          opacity: tagOpacity,
          translate: `0px ${tagY}px`,
          marginTop: 12, marginBottom: 52,
          maxWidth: 760,
          lineHeight: 1.5,
        }}>
          La plataforma que <strong style={{ color: "#984EFD" }}>conecta</strong> prestadores
          {" "}con turistas · Altas Montañas de Veracruz
        </div>

        {/* CTA */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 18,
          padding: "28px 72px",
          background: "linear-gradient(135deg, #984EFD 0%, #7C3BDB 100%)",
          borderRadius: 999,
          fontFamily: "'Outfit',sans-serif",
          fontWeight: 800, fontSize: 40, color: "#fff",
          opacity: ctaOpacity,
          scale: String(ctaScale),
          boxShadow: "0 24px 70px rgba(152,78,253,0.50), 0 4px 20px rgba(0,0,0,0.12)",
          letterSpacing: "-0.01em",
        }}>
          Regístrate gratis <ArrowRight size={36} />
        </div>

        {/* Stat pills */}
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 16, justifyContent: "center", marginTop: 52 }}>
          {STATS_OUTRO.map(({ label, color }, i) => {
            const pOp = fadeIn(rel, pillBase + i * 10, 14);
            const pS  = interpolate(rel, [pillBase + i * 10, pillBase + i * 10 + 20], [0.7, 1], { easing: easeSpring, ...clamp });
            return (
              <div key={label} style={{
                padding: "10px 28px",
                background: `${color}12`,
                border: `2px solid ${color}30`,
                borderRadius: 999,
                fontFamily: "'Outfit',sans-serif",
                fontWeight: 700, fontSize: 26, color,
                opacity: pOp,
                scale: String(pS),
              }}>
                {label}
              </div>
            );
          })}
        </div>

        {/* App badge */}
        <div style={{
          marginTop: 56,
          display: "flex", alignItems: "center", gap: 18,
          background: "#1E1E23",
          borderRadius: 24, padding: "18px 44px",
          opacity: badgeOpacity,
          translate: `0px ${badgeY}px`,
          boxShadow: "0 10px 40px rgba(0,0,0,0.14)",
        }}>
          <Smartphone size={42} color="#A0A0AA" />
          <div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, color: "#A0A0AA", lineHeight: 1 }}>
              Disponible en
            </div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 30, color: "#fff", lineHeight: 1.3, marginTop: 4 }}>
              Android · APK Directa
            </div>
          </div>
        </div>

        {/* Award */}
        <div style={{
          position: "absolute", bottom: 72,
          display: "flex", alignItems: "center", gap: 12,
          fontFamily: "'Outfit',sans-serif", fontWeight: 500, fontSize: 22,
          color: "#50505A",
          opacity: awardOpacity,
        }}>
          <Award size={24} color="#F59E0B" />
          Galardón Turístico Mi Veracruz 2024
        </div>
      </div>
    </div>
  );
}
