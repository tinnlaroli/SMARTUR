/**
 * MobilePlanner — 100% faithful to planner_screen.dart
 * Shows: AppBar, date range, public toggle, ReorderableList of stops, Optimize button
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

const PURPLE = "#984EFD";

// ── StatusBar ────────────────────────────────────────────────────────────────

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
          <div style={{ margin: 2, height: 6, width: "72%", background: "#1F2937", borderRadius: 1.5 }} />
        </div>
      </div>
    </div>
  );
}

// ── StopCard (matches _StopCard in planner_screen.dart) ──────────────────────

interface StopCardProps {
  index: number;
  placeName: string;
  city: string;
  visitTime: string;
  duration: string;
  opacity: number;
  translateY: number;
  isLast?: boolean;
}

function StopCard({ index, placeName, city, visitTime, duration, opacity, translateY, isLast }: StopCardProps) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      opacity,
      transform: `translateY(${translateY}px)`,
    }}>
      {/* Left: number badge + vertical connector */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 2, flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: PURPLE,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 700, color: "#fff" }}>{index + 1}</span>
        </div>
        {!isLast && (
          <div style={{
            width: 2, height: 52,
            background: `${PURPLE}28`,
            borderRadius: 1, marginTop: 4,
          }} />
        )}
      </div>

      {/* Card */}
      <div style={{
        flex: 1,
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #F3F4F6",
        padding: "12px 14px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        marginBottom: 12,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "'Cal Sans','Outfit',sans-serif", fontSize: 15, fontWeight: 700, color: "#1F2937" }}>{placeName}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill={PURPLE}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#6B7280" }}>{city}</span>
            </div>
          </div>
          {/* Delete button */}
          <div style={{ padding: 4, opacity: 0.45 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </div>
        </div>

        {/* Time + duration pills */}
        <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            background: `${PURPLE}12`, borderRadius: 8, padding: "4px 10px",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600, color: PURPLE }}>{visitTime}</span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "#F9FAFB", borderRadius: 8, padding: "4px 10px",
            border: "1px solid #E5E7EB",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#6B7280" }}>{duration}</span>
          </div>
          {/* Drag handle */}
          <div style={{ marginLeft: "auto", opacity: 0.3 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#6B7280">
              <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
              <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
              <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function MobilePlanner({ frameIn }: Props) {
  const frame = useCurrentFrame();
  const rel   = frame - frameIn;

  const headerOp = fadeIn(frame, frameIn,      10);
  const metaOp   = fadeIn(frame, frameIn + 8,  12);
  const stop1Op  = fadeIn(frame, frameIn + 14, 14);
  const stop1TY  = interpolate(rel, [14, 28], [14, 0], { easing: easeOut, ...clamp });
  const stop2Op  = fadeIn(frame, frameIn + 22, 14);
  const stop2TY  = interpolate(rel, [22, 36], [14, 0], { easing: easeOut, ...clamp });
  const stop3Op  = fadeIn(frame, frameIn + 30, 14);
  const stop3TY  = interpolate(rel, [30, 44], [14, 0], { easing: easeOut, ...clamp });
  const btnOp    = fadeIn(frame, frameIn + 38, 14);
  const btnTY    = interpolate(rel, [38, 52], [10, 0], { easing: easeOut, ...clamp });

  // Switch turns on mid-way
  const switchOn = rel >= 55;

  // Layout (460×942):
  //   StatusBar=32, AppBar=56 → y=88
  //   Meta: DateRow(33)+ToggleRow(44)+divider(1)=78 → meta ends y=166
  //   Stops: padding-top=14 → label at y=180(18px)+marginBottom=14 → cards start y=212
  //   StopCard height: card(104)+marginBottom(12)=116 (each)
  //   Stop1: y=212-328, card center y=264
  //   Stop2: y=328-444, card center y=380
  //   Stop3: y=444-560, card center y=496
  //   Toggle (center): x=422, y=140  (paddingRight=16 → right edge=444, switch w=44)
  //   Optimize button: position:absolute bottom=0, padding=8+52+24=84 → inner y=866, center y=892
  // Camera in B2CFlow step 10: Stop1 zoom at rel=18, Stop3 at rel=130, Optimize at rel=160
  // Cursor arrives AFTER camera settles: Stop1 at rel=20 (OK), Stop3 at rel=138, Optimize at rel=162
  const cursorKeyframes = [
    { rel:   0, x: 230, y: 300 },
    { rel:  20, x: 230, y: 264 },  // hover Stop 1 (camera settled at rel=18)
    { rel:  50, x: 422, y: 140 },  // hover toggle
    { rel:  68, x: 422, y: 140 },  // tap toggle
    { rel: 138, x: 230, y: 496 },  // hover Stop 3 (camera settled at rel=130)
    { rel: 162, x: 230, y: 892 },  // hover Optimizar (camera settled at rel=160)
    { rel: 176, x: 230, y: 892 },  // tap Optimizar
    { rel: 200, x: 230, y: 450 },
  ];
  const clicks = [{ rel: 68 }, { rel: 176 }];

  const hlStop1    = rel >= 20  && rel < 52;
  const hlStop3    = rel >= 138 && rel < 162;
  const hlOptimize = rel >= 162 && rel < 184;

  // Optimization result overlay — appears 8 frames after tap
  const optimized = rel >= 184;

  return (
    <div style={{ position: "relative", width: 460, height: 942, background: "#F9FAFB", overflow: "hidden", fontFamily: "'Outfit',sans-serif" }}>

      {/* Status bar */}
      <StatusBar />

      {/* AppBar */}
      <div style={{
        height: 56, background: "#fff",
        display: "flex", alignItems: "center",
        padding: "0 8px 0 4px",
        borderBottom: "1px solid #F3F4F6",
        opacity: headerOp,
      }}>
        <div style={{ padding: "8px 12px" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Cal Sans','Outfit',sans-serif", fontSize: 17, fontWeight: 700, color: "#1F2937" }}>
            Ruta Altas Montañas
          </div>
          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>3 paradas · Borrador</div>
        </div>
        <div style={{ padding: "8px 14px", display: "flex", gap: 14, alignItems: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#6B7280">
            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
          </svg>
        </div>
      </div>

      {/* Meta section */}
      <div style={{ background: "#fff", opacity: metaOp }}>
        {/* Date row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px 8px 16px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: PURPLE }}>28 jun – 28 jun</span>
          <div style={{ marginLeft: "auto", padding: 2, opacity: 0.4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>
        </div>

        {/* Public toggle row */}
        <div style={{ display: "flex", alignItems: "center", padding: "6px 16px 12px 16px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span style={{ fontSize: 13, color: "#6B7280", marginLeft: 8, flex: 1 }}>Ruta pública</span>
          <div style={{
            width: 44, height: 26, borderRadius: 13,
            background: switchOn ? PURPLE : "#E5E7EB",
            position: "relative",
          }}>
            <div style={{
              position: "absolute",
              top: 3,
              left: switchOn ? 21 : 3,
              width: 20, height: 20, borderRadius: "50%",
              background: "#fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }} />
          </div>
        </div>
        <div style={{ height: 1, background: "#F3F4F6" }} />
      </div>

      {/* Stops list */}
      <div style={{ padding: "14px 16px 0 16px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", marginBottom: 14, textTransform: "uppercase" as const, letterSpacing: 0.6 }}>
          Paradas del día
        </div>

        <StopCard
          index={0} placeName="Cascada Texolo" city="Xico, Veracruz"
          visitTime="09:00" duration="2h visita"
          opacity={stop1Op} translateY={stop1TY}
        />
        <StopCard
          index={1} placeName="Café Cencalli" city="Córdoba, Veracruz"
          visitTime="11:45" duration="1.5h"
          opacity={stop2Op} translateY={stop2TY}
        />
        <StopCard
          index={2} placeName="Pico de Orizaba" city="Orizaba, Veracruz"
          visitTime="13:30" duration="2h"
          opacity={stop3Op} translateY={stop3TY} isLast
        />
      </div>

      {/* Optimize button */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        padding: "8px 16px 24px 16px",
        background: "#fff",
        borderTop: "1px solid #F3F4F6",
        opacity: btnOp,
        transform: `translateY(${btnTY}px)`,
      }}>
        {/* Optimization result — appears after tap */}
        {optimized && (
          <div style={{
            marginBottom: 10,
            background: "rgba(156,204,68,0.10)",
            border: "1px solid #9CCC44",
            borderRadius: 14,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            opacity: interpolate(rel, [184, 196], [0, 1], clamp),
            transform: `translateY(${interpolate(rel, [184, 196], [12, 0], clamp)}px)`,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: "#9CCC44",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 700, color: "#4a7c14" }}>
                Ruta optimizada por IA
              </div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#6B7280", marginTop: 1 }}>
                42 km · 4h 30 min estimadas
              </div>
            </div>
          </div>
        )}
        <div style={{
          height: 52, borderRadius: 16,
          background: optimized ? "#9CCC4418" : `${PURPLE}18`,
          border: optimized ? "1px solid #9CCC44" : "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={optimized ? "#9CCC44" : PURPLE}><path d="M13 3L4 14h7l-1 7 9-11h-7z"/></svg>
          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, color: optimized ? "#4a7c14" : PURPLE }}>
            {optimized ? "Ruta optimizada" : "Optimizar ruta"}
          </span>
        </div>
      </div>

      {/* ── Overlays ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {hlStop1 && (
          <InScreenHighlight
            frameIn={frameIn} relIn={20} relOut={55}
            x={40} y={212} width={400} height={106}
            color={PURPLE} radius={16} label="Cascada Texolo · 09:00" labelSide="top"
          />
        )}
        {hlStop3 && (
          <InScreenHighlight
            frameIn={frameIn} relIn={100} relOut={135}
            x={40} y={444} width={400} height={106}
            color="#9CCC44" radius={16} label="Pico de Orizaba · 3ª parada" labelSide="top"
          />
        )}
        {hlOptimize && (
          <InScreenHighlight
            frameIn={frameIn} relIn={135} relOut={172}
            x={16} y={866} width={428} height={52}
            color={PURPLE} radius={16} label="Optimizar ruta con IA" labelSide="top"
          />
        )}
        <InScreenCursor frameIn={frameIn} keyframes={cursorKeyframes} clicks={clicks} />
      </div>
    </div>
  );
}
