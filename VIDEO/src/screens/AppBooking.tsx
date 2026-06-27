import { Calendar, Clock, Users, CreditCard, Building2, ShieldCheck, MessageSquare, Check, Star, MapPin, ChevronLeft } from "lucide-react";
import { useCurrentFrame } from "remotion";
import { C, F } from "./tokens";
import { fadeIn, slideUp } from "../helpers/animations";

const BOOKING_DETAILS = [
  { Icon: Calendar,   label: "Fecha",     value: "Sáb 21 jun" },
  { Icon: Clock,      label: "Hora",      value: "09:00 am"   },
  { Icon: Users,      label: "Personas",  value: "1 adulto"   },
  { Icon: CreditCard, label: "Total",     value: "$350 MXN"   },
];

// Gradient "photo" of the mountain/trail — dark blue sky + snow caps
const HERO_GRADIENT = `
  linear-gradient(180deg, rgba(0,0,0,0) 10%, rgba(0,0,0,0.65) 85%),
  linear-gradient(155deg, #0f172a 0%, #1e3a5f 20%, #2563eb 40%, #7dd3fc 60%, #e2e8f0 80%, #f1f5f9 100%)
`;

export function AppBooking({ frameIn }: { frameIn: number }) {
  const frame = useCurrentFrame();
  const rel = frame - frameIn;

  const detailsSlideY  = slideUp(frame, frameIn + 10, 45, 20);
  const providerSlideY = slideUp(frame, frameIn + 22, 40, 18);
  const noteSlideY     = slideUp(frame, frameIn + 32, 35, 16);
  const ctaSlideY      = slideUp(frame, frameIn + 44, 30, 16);

  return (
    <div style={{ background: "#F7F2FF", height: "100%", fontFamily: F.body, display: "flex", flexDirection: "column" }}>
      {/* Hero — landscape gradient "photo" */}
      <div style={{
        height: 170,
        background: HERO_GRADIENT,
        position: "relative",
        flexShrink: 0,
        overflow: "hidden",
      }}>
        {/* Back button */}
        <div style={{
          position: "absolute",
          top: 14, left: 14,
          width: 32, height: 32,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid rgba(255,255,255,0.2)",
        }}>
          <ChevronLeft size={16} color="#fff" />
        </div>

        {/* Rating badge */}
        <div style={{
          position: "absolute",
          top: 14, right: 14,
          background: "rgba(255,255,255,0.18)",
          backdropFilter: "blur(8px)",
          borderRadius: 999,
          padding: "5px 10px",
          display: "flex", alignItems: "center", gap: 4,
          border: "1px solid rgba(255,255,255,0.25)",
        }}>
          <Star size={11} color="#fbbf24" fill="#fbbf24" />
          <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>5.0</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.75)" }}>(127)</span>
        </div>

        {/* Place info at bottom of hero */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 18px 14px" }}>
          <div style={{
            display: "inline-block",
            background: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 999,
            padding: "3px 10px",
            fontSize: 9,
            fontWeight: 700,
            color: "rgba(255,255,255,0.9)",
            marginBottom: 5,
            letterSpacing: "0.05em",
          }}>
            ECOTURISMO · AVENTURA
          </div>
          <div style={{ fontFamily: F.heading, fontSize: 19, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
            Pico de Orizaba
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <MapPin size={11} color="rgba(255,255,255,0.8)" />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)" }}>Orizaba, Veracruz</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, overflow: "hidden" }}>
        {/* Booking details card */}
        <div style={{
          background: "#fff",
          borderRadius: 18,
          border: `1.5px solid ${C.border}`,
          padding: "14px 16px",
          opacity: fadeIn(rel, 8, 12),
          transform: `translateY(${detailsSlideY}px)`,
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.text, marginBottom: 12, fontFamily: F.heading }}>
            Detalles de la reserva
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {BOOKING_DETAILS.map(({ Icon, label, value }) => (
              <div key={label} style={{
                background: "#F7F2FF",
                borderRadius: 12,
                padding: "9px 11px",
                display: "flex", gap: 8, alignItems: "center",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: `${C.purple}15`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon size={13} color={C.purple} />
                </div>
                <div>
                  <div style={{ fontSize: 9, color: C.textAlt, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Provider card */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          border: `1.5px solid ${C.border}`,
          padding: "12px 14px",
          display: "flex",
          gap: 12,
          alignItems: "center",
          opacity: fadeIn(rel, 24, 12),
          transform: `translateY(${providerSlideY}px)`,
          boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: `linear-gradient(135deg, ${C.purple} 0%, #6d28d9 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Building2 size={20} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.text, fontFamily: F.heading }}>Aventuras Veracruz</div>
            <div style={{ fontSize: 10, color: C.textAlt, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
              <ShieldCheck size={11} color="#10b981" />
              <span style={{ color: "#047857", fontWeight: 600 }}>Prestador verificado SMARTUR</span>
            </div>
          </div>
          <div style={{
            background: `${C.cyan}15`,
            color: C.cyan,
            borderRadius: 12,
            padding: "8px 12px",
            fontSize: 11,
            fontWeight: 700,
            display: "flex", alignItems: "center", gap: 5,
            border: `1.5px solid ${C.cyan}40`,
          }}>
            <MessageSquare size={12} /> Chat
          </div>
        </div>

        {/* Note */}
        <div style={{
          background: "#fffbeb",
          borderRadius: 14,
          border: "1.5px solid #fbbf24",
          padding: "10px 13px",
          opacity: fadeIn(rel, 36, 10),
          transform: `translateY(${noteSlideY}px)`,
        }}>
          <div style={{ fontSize: 9, color: "#92400e", fontWeight: 700, marginBottom: 3 }}>Nota para el prestador</div>
          <div style={{ fontSize: 10, color: "#78350f", fontStyle: "italic" }}>
            "Primera vez en hacer senderismo. ¿Qué equipo necesito llevar?"
          </div>
        </div>
      </div>

      {/* Confirm CTA */}
      <div style={{ padding: "0 16px 20px", opacity: fadeIn(rel, 48, 14), transform: `translateY(${ctaSlideY}px)`, flexShrink: 0 }}>
        <div style={{
          background: `linear-gradient(135deg, ${C.purple} 0%, #6d28d9 100%)`,
          color: "#fff",
          borderRadius: 18,
          padding: "16px",
          textAlign: "center",
          fontSize: 15,
          fontWeight: 800,
          fontFamily: F.heading,
          boxShadow: `0 10px 32px ${C.purple}50`,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
        }}>
          <Check size={17} /> Confirmar Reserva
        </div>
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 9, color: C.textAlt }}>
          Sin cargos adicionales · Cancelación hasta 24h antes
        </div>
      </div>
    </div>
  );
}
