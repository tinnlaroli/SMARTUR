/**
 * MobileBooking — 100% faithful to detail_view_page.dart + booking flow
 * State 1 (rel < 80): DetailViewPage with hero image, service info, rating, CTA
 * State 2 (rel >= 78): Booking confirmation with checkmark + chat button
 * 460 × 942 content area.
 */
import React from "react";
import { interpolate, useCurrentFrame, Easing, spring, useVideoConfig } from "remotion";
import { fadeIn } from "../helpers/animations";
import { InScreenCursor } from "../components/motion/InScreenCursor";
import { InScreenHighlight } from "../components/motion/InScreenHighlight";

interface Props { frameIn: number }

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const clamp   = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const PURPLE  = "#984EFD";
const GREEN   = "#10B981";
const CYAN    = "#4DB9CA";

// ── StatusBar ────────────────────────────────────────────────────────────────

function StatusBar({ light }: { light?: boolean }) {
  const col = light ? "rgba(255,255,255,0.9)" : "#1F2937";
  return (
    <div style={{
      height: 32, display: "flex", alignItems: "center",
      justifyContent: "space-between", paddingLeft: 20, paddingRight: 20,
    }}>
      <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 700, color: col }}>9:41</span>
      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
          {[6, 9, 12, 14].map((h, i) => (
            <div key={i} style={{ width: 3, height: h, background: col, borderRadius: 1 }} />
          ))}
        </div>
        <svg width="16" height="12" viewBox="0 0 16 12">
          <path d="M8 10.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill={col} />
          <path d="M4.5 7.5a5 5 0 017 0" stroke={col} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M1.5 4.5a9 9 0 0113 0" stroke={col} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
        <div style={{ width: 22, height: 12, border: `1.5px solid ${col}`, borderRadius: 3, position: "relative" }}>
          <div style={{ position: "absolute", right: -4, top: 3, width: 3, height: 6, background: col, borderRadius: "0 2px 2px 0" }} />
          <div style={{ margin: 2, height: 6, width: "75%", background: col, borderRadius: 1.5 }} />
        </div>
      </div>
    </div>
  );
}

// ── Star rating row ───────────────────────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? "#F59E0B" : "none"}
          stroke="#F59E0B" strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
      <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#6B7280", marginLeft: 2 }}>
        {rating.toFixed(1)} ({count} reseñas)
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function MobileBooking({ frameIn }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rel   = frame - frameIn;

  // State transitions
  const state1Op = interpolate(rel, [72, 84], [1, 0], clamp);
  const state2Op = interpolate(rel, [78, 92], [0, 1], clamp);

  // State 1 animations (detail page)
  const heroOp    = fadeIn(frame, frameIn, 10);
  const infoOp    = fadeIn(frame, frameIn + 8, 14);
  const infoTY    = interpolate(rel, [8, 22], [16, 0], { easing: easeOut, ...clamp });
  const ratingOp  = fadeIn(frame, frameIn + 14, 14);
  const ratingTY  = interpolate(rel, [14, 28], [12, 0], { easing: easeOut, ...clamp });
  const hoursOp   = fadeIn(frame, frameIn + 20, 12);
  const ctaOp     = fadeIn(frame, frameIn + 26, 14);
  const ctaTY     = interpolate(rel, [26, 40], [14, 0], { easing: easeOut, ...clamp });

  // State 2 animations (confirmation)
  const checkRelStart = 84;
  const checkS = spring({ frame: rel - checkRelStart, fps, config: { damping: 14, stiffness: 180, mass: 0.8 } });
  const ringPulse = interpolate((rel - checkRelStart) % 40 / 40, [0, 0.5, 1], [1, 1.08, 1], clamp);

  // State 1 CTA layout: container border(1)+padding(12+24)+button(52)=89px from bottom.
  //   Inner button starts y=942-89+1+12=866, center y=892.
  //   Atrás: flex=1, x=20, w=204, center x=122.
  //   Reservar: flex=1, x=236, w=204, center x=338.
  // State 2 layout: content flexCol centered in (942-32=910)px.
  //   Checkmark circle (h=80, marginBottom=28): content start ≈ y=263, circle center y=303.
  //   Chat button center: y≈650.
  // Camera: hours at rel=12, CTAs at rel=48 (settled), checkmark at rel=96, chat at rel=168
  const cursorKeyframes = [
    { rel:   0, x: 230, y: 380 },  // idle on hero
    { rel:  16, x: 230, y: 459 },  // hover hours section (cam at hours from rel=12)
    { rel:  35, x: 122, y: 892 },  // hover "Agregar a ruta" (cam at CTAs from rel=48 — arrives early)
    { rel:  54, x: 338, y: 892 },  // hover "Reservar ahora" (cam settled at CTAs)
    { rel:  65, x: 338, y: 892 },  // tap Reservar
    { rel:  98, x: 230, y: 303 },  // confirmation checkmark (cam jumps at rel=96)
    { rel: 125, x: 230, y: 303 },  // linger on checkmark
    { rel: 150, x: 230, y: 650 },  // hover chat button (cam at chat from rel=168, slightly early)
    { rel: 168, x: 230, y: 650 },  // tap chat
    { rel: 195, x: 230, y: 500 },
  ];
  const clicks = [{ rel: 65 }, { rel: 168 }];

  // Highlights — camera must be at element before highlight fires
  const hlHours   = rel >= 16 && rel < 48;   // cam at hours from rel=12
  const hlReserva = rel >= 54 && rel < 72;   // cam at CTAs from rel=48

  // State 2 highlights
  const hlCheck = rel >= 98  && rel < 148;   // cam at checkmark from rel=96
  const hlChat  = rel >= 168 && rel < 195;   // cam at chat from rel=168

  return (
    <div style={{ position: "relative", width: 460, height: 942, background: "#F9FAFB", overflow: "hidden", fontFamily: "'Outfit',sans-serif" }}>

      {/* ═══════════════ STATE 1: Detail View Page ═══════════════ */}
      <div style={{
        position: "absolute", inset: 0,
        opacity: state1Op,
        background: "#fff",
      }}>
        {/* Hero image with gradient overlay (matches DetailViewPage hero) */}
        <div style={{
          height: 280, position: "relative",
          background: "linear-gradient(160deg, #0891b2 0%, #22d3ee 45%, #4ade80 100%)",
          opacity: heroOp,
        }}>
          {/* Status bar overlay (white on dark bg) */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
            <StatusBar light />
          </div>

          {/* Top buttons row */}
          <div style={{
            position: "absolute", top: 36, left: 0, right: 0,
            display: "flex", justifyContent: "space-between", padding: "0 8px",
          }}>
            {/* Back button */}
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(0,0,0,0.28)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </div>
            {/* Right buttons: share + like */}
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(0,0,0,0.28)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
              </div>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(0,0,0,0.28)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Category chip in hero */}
          <div style={{
            position: "absolute", bottom: 16, left: 16,
            background: "rgba(255,255,255,0.22)",
            borderRadius: 999, padding: "4px 12px",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2v-1l3 1z"/></svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>Ecoturismo · Naturaleza</span>
          </div>
        </div>

        {/* Service info section */}
        <div style={{ padding: "18px 20px 0 20px", opacity: infoOp, transform: `translateY(${infoTY}px)` }}>
          <div style={{ fontFamily: "'Cal Sans','Outfit',sans-serif", fontSize: 24, fontWeight: 700, color: "#1F2937", lineHeight: 1.2 }}>
            Cascada Texolo
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill={PURPLE}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            <span style={{ fontSize: 13, color: "#6B7280" }}>Xico, Veracruz · Altas Montañas</span>
          </div>
        </div>

        {/* Rating row */}
        <div style={{ padding: "12px 20px 0 20px", opacity: ratingOp, transform: `translateY(${ratingTY}px)` }}>
          <StarRating rating={4.9} count={312} />
        </div>

        {/* Operating hours */}
        <div style={{
          margin: "14px 20px 0 20px",
          padding: "12px 16px",
          background: "#F9FAFB",
          borderRadius: 14,
          border: "1px solid #E5E7EB",
          opacity: hoursOp,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1F2937" }}>Horarios de visita</span>
          </div>
          {[
            ["Lunes – Viernes", "08:00 – 17:00"],
            ["Sábado", "07:00 – 18:00"],
            ["Domingo", "07:00 – 16:00"],
          ].map(([day, hours]) => (
            <div key={day} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "#6B7280" }}>{day}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1F2937" }}>{hours}</span>
            </div>
          ))}
        </div>

        {/* Price range */}
        <div style={{ padding: "12px 20px 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ padding: "5px 14px", background: `${PURPLE}12`, borderRadius: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: PURPLE }}>$50 – $120 MXN</span>
          </div>
          <span style={{ fontSize: 12, color: "#6B7280" }}>por persona</span>
        </div>

        {/* CTAs: Agregar a ruta + Reservar ahora */}
        <div style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          padding: "12px 20px 24px 20px",
          background: "#fff",
          borderTop: "1px solid #F3F4F6",
          display: "flex",
          gap: 12,
          opacity: ctaOp,
          transform: `translateY(${ctaTY}px)`,
        }}>
          {/* Agregar a ruta — outlined */}
          <div style={{
            flex: 1, height: 52, borderRadius: 14,
            border: `1.5px solid ${PURPLE}`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <line x1="12" y1="7" x2="12" y2="13"/><line x1="9" y1="10" x2="15" y2="10"/>
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: PURPLE }}>Agregar a ruta</span>
          </div>
          {/* Reservar ahora — filled */}
          <div style={{
            flex: 1, height: 52, borderRadius: 14,
            background: PURPLE,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            boxShadow: "0 4px 16px rgba(152,78,253,0.30)",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
              <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
            </svg>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Reservar ahora</span>
          </div>
        </div>
      </div>

      {/* ═══════════════ STATE 2: Booking Confirmation ═══════════════ */}
      <div style={{
        position: "absolute", inset: 0,
        opacity: state2Op,
        background: "#fff",
        display: "flex", flexDirection: "column",
      }}>
        {/* Status bar */}
        <div style={{ flexShrink: 0 }}><StatusBar /></div>

        {/* Content centered */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "0 24px",
        }}>
          {/* Checkmark circle with pulse ring */}
          <div style={{ position: "relative", marginBottom: 28 }}>
            {/* Outer pulse */}
            <div style={{
              position: "absolute",
              top: -12, left: -12,
              width: 104, height: 104,
              borderRadius: "50%",
              border: `2px solid ${GREEN}40`,
              transform: `scale(${ringPulse})`,
            }} />
            {/* Green circle */}
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: GREEN,
              display: "flex", alignItems: "center", justifyContent: "center",
              transform: `scale(${checkS})`,
              boxShadow: `0 8px 32px ${GREEN}45`,
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>

          {/* Title */}
          <div style={{ fontFamily: "'Cal Sans','Outfit',sans-serif", fontSize: 26, fontWeight: 700, color: "#1F2937", textAlign: "center", marginBottom: 6 }}>
            ¡Reserva confirmada!
          </div>
          {/* Booking code */}
          <div style={{
            fontSize: 13, color: "#6B7280", marginBottom: 24,
            background: "#F9FAFB", borderRadius: 8, padding: "4px 14px",
            border: "1px solid #E5E7EB",
          }}>
            Folio #RV-4821
          </div>

          {/* Details card */}
          <div style={{
            width: "100%",
            border: "1px solid #E5E7EB",
            borderRadius: 18,
            overflow: "hidden",
            marginBottom: 24,
          }}>
            {[
              {
                svg: <svg width="18" height="18" viewBox="0 0 24 24" fill={PURPLE}><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>,
                text: "Sáb 28 Jun 2025 · 09:00 AM",
              },
              {
                svg: <svg width="18" height="18" viewBox="0 0 24 24" fill={PURPLE}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>,
                text: "Cascada Texolo · Xico, Veracruz",
              },
              {
                svg: <svg width="18" height="18" viewBox="0 0 24 24" fill={PURPLE}><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
                text: "2 personas · $100 MXN total",
              },
            ].map(({ svg, text }, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "13px 18px",
                borderBottom: i < 2 ? "1px solid #F3F4F6" : "none",
              }}>
                {svg}
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, color: "#1F2937" }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Chat with provider */}
          <div style={{
            width: "100%", height: 52, borderRadius: 14,
            background: PURPLE,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            marginBottom: 14,
            boxShadow: "0 4px 16px rgba(152,78,253,0.28)",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, color: "#fff" }}>
              Chatear con el prestador
            </span>
          </div>

          {/* Ver itinerario link */}
          <span style={{ fontSize: 14, color: CYAN, fontWeight: 600 }}>Ver en Mis Rutas</span>
        </div>
      </div>

      {/* ── Overlays ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* State 1 highlights */}
        {hlHours && (
          <InScreenHighlight
            frameIn={frameIn} relIn={16} relOut={48}
            x={20} y={404} width={420} height={110}
            color={CYAN} radius={14} label="Horarios de visita" labelSide="top"
          />
        )}
        {hlReserva && (
          <InScreenHighlight
            frameIn={frameIn} relIn={54} relOut={70}
            x={236} y={854} width={204} height={52}
            color={PURPLE} radius={14} label="Reservar ahora" labelSide="top"
          />
        )}
        {/* State 2 highlights */}
        {hlCheck && (
          <InScreenHighlight
            frameIn={frameIn} relIn={98} relOut={148}
            x={190} y={263} width={80} height={80}
            color={GREEN} radius={40} label="Reserva confirmada" labelSide="top"
          />
        )}
        {hlChat && (
          <InScreenHighlight
            frameIn={frameIn} relIn={168} relOut={192}
            x={20} y={624} width={420} height={52}
            color={PURPLE} radius={14} label="Chat con prestador" labelSide="top"
          />
        )}
        <InScreenCursor frameIn={frameIn} keyframes={cursorKeyframes} clicks={clicks} />
      </div>
    </div>
  );
}
