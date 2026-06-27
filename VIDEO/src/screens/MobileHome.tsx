/**
 * MobileHome — Home screen with AI recommendations.
 * 460 × 942 content area.
 */
import React from "react";
import { interpolate, useCurrentFrame, Easing } from "remotion";
import { fadeIn } from "../helpers/animations";
import { InScreenCursor } from "../components/motion/InScreenCursor";
import { InScreenHighlight } from "../components/motion/InScreenHighlight";

interface Props { frameIn: number }

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const clamp   = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// ── SVG Icons ────────────────────────────────────────────────────────────────

const IcoSearch  = ({ size = 16, color = "#9CA3AF" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcoHome = ({ color = "#9CA3AF" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={color}><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
);
const IcoExplore = ({ color = "#9CA3AF" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={color}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z"/></svg>
);
const IcoMap = ({ color = "#9CA3AF" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={color}><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>
);
const IcoChat = ({ color = "#9CA3AF" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={color}><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>
);
const IcoProfile = ({ color = "#9CA3AF" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={color}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
);
const IcoPin = ({ size = 10, color = "#984EFD" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
);
const IcoStar = ({ size = 12, filled = true }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#F59E0B" : "none"} stroke="#F59E0B" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IcoSparkle = ({ size = 14, color = "#984EFD" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 1l2.5 8.5L23 12l-8.5 2.5L12 23l-2.5-8.5L1 12l8.5-2.5z"/></svg>
);

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBar() {
  return (
    <div style={{
      height: 32, display: "flex", alignItems: "center",
      justifyContent: "space-between", paddingLeft: 20, paddingRight: 20,
      background: "#fff",
    }}>
      <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 700, color: "#1F2937" }}>9:41</span>
      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
          {[6, 9, 12, 14].map((h, i) => (
            <div key={i} style={{ width: 3, height: h, background: "#1F2937", borderRadius: 1 }} />
          ))}
        </div>
        <svg width="16" height="12" viewBox="0 0 16 12">
          <path d="M8 10.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="#1F2937" />
          <path d="M4.5 7.5a5 5 0 017 0" stroke="#1F2937" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M1.5 4.5a9 9 0 0113 0" stroke="#1F2937" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
        <div style={{ width: 22, height: 12, border: "1.5px solid #1F2937", borderRadius: 3, position: "relative" }}>
          <div style={{ position: "absolute", right: -4, top: 3, width: 3, height: 6, background: "#1F2937", borderRadius: "0 2px 2px 0" }} />
          <div style={{ margin: 2, height: 6, width: "80%", background: "#1F2937", borderRadius: 1.5 }} />
        </div>
      </div>
    </div>
  );
}

interface POICardProps {
  title: string;
  location: string;   // plain text, no emoji
  gradient: string;
  badge: string;
  tags: Array<{ label: string; color: string }>;
  heartActive?: boolean;
  opacity: number;
  translateY: number;
}

function POICard({ title, location, gradient, badge, tags, heartActive = false, opacity, translateY }: POICardProps) {
  return (
    <div style={{
      height: 200,
      borderRadius: 20,
      overflow: "hidden",
      background: "#fff",
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      border: "1px solid #F3F4F6",
      opacity,
      transform: `translateY(${translateY}px)`,
      flexShrink: 0,
    }}>
      {/* Image area */}
      <div style={{
        height: 130,
        background: gradient,
        position: "relative",
      }}>
        {/* Badge pill */}
        <div style={{
          position: "absolute", top: 10, left: 10,
          background: "rgba(16,185,129,0.92)",
          borderRadius: 999, padding: "3px 10px",
          backdropFilter: "blur(4px)",
        }}>
          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 700, color: "#fff" }}>{badge}</span>
        </div>
        {/* Heart icon */}
        <div style={{
          position: "absolute", top: 10, right: 10,
          width: 30, height: 30, borderRadius: "50%",
          background: "rgba(255,255,255,0.88)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={heartActive ? "#FC478E" : "none"} stroke={heartActive ? "#FC478E" : "#9CA3AF"} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
      </div>
      {/* Info area */}
      <div style={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "'Cal Sans','Outfit',sans-serif", fontSize: 15, fontWeight: 700, color: "#1F2937" }}>{title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
              <IcoPin size={10} color="#984EFD" />
              <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#6B7280" }}>{location}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IcoStar size={11} filled />
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 700, color: "#1F2937" }}>4.9</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {tags.map((tag, i) => (
            <div key={i} style={{
              padding: "2px 10px",
              borderRadius: 999,
              background: tag.color + "20",
              border: `1px solid ${tag.color}40`,
            }}>
              <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, fontWeight: 600, color: tag.color }}>{tag.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function MobileHome({ frameIn }: Props) {
  const frame = useCurrentFrame();
  const rel   = frame - frameIn;

  // Staggered animations
  const headerOp  = fadeIn(frame, frameIn + 0,  12);
  const greetOp   = fadeIn(frame, frameIn + 5,  12);
  const greetTY   = interpolate(rel, [5, 18],   [12, 0], { easing: easeOut, ...clamp });
  const searchOp  = fadeIn(frame, frameIn + 10, 12);
  const searchTY  = interpolate(rel, [10, 22],  [10, 0], { easing: easeOut, ...clamp });
  const chipsOp   = fadeIn(frame, frameIn + 15, 12);
  const chipsTY   = interpolate(rel, [15, 27],  [8, 0],  { easing: easeOut, ...clamp });
  const aiHdrOp   = fadeIn(frame, frameIn + 20, 12);
  const aiHdrTY   = interpolate(rel, [20, 32],  [8, 0],  { easing: easeOut, ...clamp });
  const card1Op   = fadeIn(frame, frameIn + 25, 14);
  const card1TY   = interpolate(rel, [25, 40],  [20, 0], { easing: easeOut, ...clamp });
  const card2Op   = fadeIn(frame, frameIn + 38, 14);
  const card2TY   = interpolate(rel, [38, 53],  [20, 0], { easing: easeOut, ...clamp });

  // Cursor keyframes — content-space (460×942)
  // AI badge (97% precisión): right side of AI header row, center ≈ x=386, y=284
  // Card 1 center: y=315+100=415; heart icon top-right: x=430, y=335 (card top=315+image-top=10)
  // Card 2 center: y=527+100=627
  const cursorKeyframes = [
    { rel:   0, x: 230, y: 420 },
    { rel:  22, x: 386, y: 284 },  // hover "97% precisión" badge (camera settled at rel=18)
    { rel:  40, x: 386, y: 284 },  // linger on badge
    { rel:  62, x: 230, y: 415 },  // move to Card 1 center (camera panning there from rel=65)
    { rel:  80, x: 430, y: 335 },  // hover heart icon on Card 1
    { rel:  92, x: 430, y: 335 },  // tap heart
    { rel: 118, x: 230, y: 415 },  // linger Card 1
    { rel: 140, x: 230, y: 627 },  // hover Card 2 (camera at Card 2 from rel=130)
  ];

  const clicks = [{ rel: 92 }];

  // Highlights — fire AFTER camera settles on that area
  const showBadge = rel >= 22 && rel < 62;
  const showCard1 = rel >= 70 && rel < 115;
  const showCard2 = rel >= 135 && rel < 168;

  return (
    <div style={{ position: "relative", width: 460, height: 942, background: "#F9FAFB", overflow: "hidden" }}>

      {/* Status bar */}
      <StatusBar />

      {/* App header */}
      <div style={{
        height: 64,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        borderBottom: "1px solid #F3F4F6",
        opacity: headerOp,
      }}>
        <span style={{ fontFamily: "'Cal Sans','Outfit',sans-serif", fontSize: 20, fontWeight: 700, color: "#984EFD" }}>SMARTUR</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Bell icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "#984EFD",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700, color: "#fff" }}>S</span>
          </div>
        </div>
      </div>

      {/* Greeting */}
      <div style={{
        padding: "16px 20px 0 20px",
        opacity: greetOp,
        transform: `translateY(${greetTY}px)`,
      }}>
        <div style={{ fontFamily: "'Cal Sans','Outfit',sans-serif", fontSize: 22, fontWeight: 700, color: "#1F2937" }}>
          ¡Hola, Sofía!
        </div>
        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: "#6B7280", marginTop: 3 }}>
          Tus recomendaciones de hoy
        </div>
      </div>

      {/* Search bar */}
      <div style={{
        margin: "14px 20px 0 20px",
        opacity: searchOp,
        transform: `translateY(${searchTY}px)`,
      }}>
        <div style={{
          height: 44,
          borderRadius: 14,
          background: "#F3F4F6",
          border: "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          gap: 8,
        }}>
          <IcoSearch size={16} color="#9CA3AF" />
          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, color: "#9CA3AF" }}>
            Buscar en Altas Montañas...
          </span>
        </div>
      </div>

      {/* City chips */}
      <div style={{
        display: "flex",
        gap: 8,
        padding: "12px 20px 0 20px",
        overflow: "hidden",
        opacity: chipsOp,
        transform: `translateY(${chipsTY}px)`,
      }}>
        {[
          { label: "Orizaba ✓", selected: true  },
          { label: "Fortín",    selected: false },
          { label: "Córdoba",   selected: false },
          { label: "Zongolica", selected: false },
        ].map((c, i) => (
          <div key={i} style={{
            padding: "0 14px",
            height: 34,
            borderRadius: 999,
            background: c.selected ? "#984EFD" : "#F3F4F6",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: "'Outfit',sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: c.selected ? "#fff" : "#6B7280",
            }}>{c.label}</span>
          </div>
        ))}
      </div>

      {/* AI section header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px 8px 20px",
        opacity: aiHdrOp,
        transform: `translateY(${aiHdrTY}px)`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <IcoSparkle size={14} color="#984EFD" />
          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 700, color: "#1F2937" }}>Para ti · IA</span>
        </div>
        <div style={{
          padding: "3px 10px",
          borderRadius: 999,
          background: "rgba(156,204,68,0.15)",
          border: "1px solid rgba(156,204,68,0.4)",
        }}>
          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 700, color: "#4a7c14" }}>97% precisión</span>
        </div>
      </div>

      {/* Cards */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        <POICard
          title="Cascada Texolo"
          location="Xico, Veracruz"
          gradient="linear-gradient(155deg, #0891b2, #22d3ee, #67e8f9)"
          badge="98% match"
          tags={[
            { label: "Naturaleza", color: "#9CCC44" },
            { label: "Ecoturismo", color: "#4DB9CA" },
          ]}
          heartActive={rel >= 92}
          opacity={card1Op}
          translateY={card1TY}
        />
        <POICard
          title="Café Cencalli"
          location="Córdoba, Veracruz"
          gradient="linear-gradient(155deg, #78350f, #a16207, #fbbf24)"
          badge="95% match"
          tags={[
            { label: "Gastronomía", color: "#FF7D1F" },
            { label: "Café",        color: "#92400e" },
          ]}
          opacity={card2Op}
          translateY={card2TY}
        />
      </div>

      {/* Bottom tab bar */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        height: 64,
        background: "#fff",
        borderTop: "1px solid #E5E7EB",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        paddingBottom: 8,
      }}>
        {([
          { icon: (c: string) => <IcoHome color={c} />,    label: "Inicio",   active: true  },
          { icon: (c: string) => <IcoExplore color={c} />, label: "Explorar", active: false },
          { icon: (c: string) => <IcoMap color={c} />,     label: "Rutas",    active: false },
          { icon: (c: string) => <IcoChat color={c} />,    label: "Chats",    active: false },
          { icon: (c: string) => <IcoProfile color={c} />, label: "Perfil",   active: false },
        ] as { icon: (c: string) => React.ReactNode; label: string; active: boolean }[]).map((tab, i) => {
          const col = tab.active ? "#984EFD" : "#9CA3AF";
          return (
            <div key={i} style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              flex: 1,
            }}>
              {tab.icon(col)}
              <span style={{
                fontFamily: "'Outfit',sans-serif",
                fontSize: 10,
                fontWeight: 600,
                color: col,
              }}>{tab.label}</span>
            </div>
          );
        })}
      </div>

      {/* Overlays: highlights + cursor */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* Badge "97% precisión" — right side of AI header, highlight after camera settles */}
        {showBadge && (
          <InScreenHighlight
            frameIn={frameIn}
            relIn={22} relOut={62}
            x={340} y={268} width={102} height={30}
            color="#9CCC44"
            radius={999}
            label="97% precisión IA"
            labelSide="top"
          />
        )}
        {/* Card 1 — camera pans there at rel=65, highlight at rel=70 */}
        {showCard1 && (
          <InScreenHighlight
            frameIn={frameIn}
            relIn={70} relOut={112}
            x={16} y={315} width={428} height={200}
            color="#4DB9CA"
            radius={20}
            label="98% match · Texolo"
            labelSide="top"
          />
        )}
        {/* Card 2 — camera pans there at rel=130, highlight at rel=135 */}
        {showCard2 && (
          <InScreenHighlight
            frameIn={frameIn}
            relIn={135} relOut={165}
            x={16} y={527} width={428} height={200}
            color="#984EFD"
            radius={20}
            label="95% match · Cencalli"
            labelSide="top"
          />
        )}
        <InScreenCursor
          frameIn={frameIn}
          keyframes={cursorKeyframes}
          clicks={clicks}
        />
      </div>
    </div>
  );
}
