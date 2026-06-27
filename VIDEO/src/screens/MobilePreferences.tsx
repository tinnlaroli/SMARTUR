/**
 * MobilePreferences — 100% faithful to step2_interests_screen.dart
 * 4 sections: Intereses (10 chips, purple), Actividad (4 chips, orange),
 *             Viaje (6 chips, cyan), Lugar (6 chips, green)
 * Bottom: Atrás + Siguiente buttons (side by side)
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
          <div style={{ margin: 2, height: 6, width: "75%", background: "#1F2937", borderRadius: 1.5 }} />
        </div>
      </div>
    </div>
  );
}

// ── Section label (icon + text) ───────────────────────────────────────────────

function SectionLabel({ icon, text, color }: { icon: React.ReactNode; text: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10, marginTop: 18 }}>
      <div style={{ color, lineHeight: 0 }}>{icon}</div>
      <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 600, color: "#1F2937" }}>{text}</span>
    </div>
  );
}

// ── Chip (inline, matching Flutter FilterChip / ChoiceChip) ──────────────────

interface ChipProps {
  label: string;
  selected: boolean;
  color: string;     // accent color
  icon: React.ReactNode;
}

function FilterChipItem({ label, selected, color, icon }: ChipProps) {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      height: 34,
      padding: "0 12px",
      borderRadius: 20,
      border: `1px solid ${selected ? color : color + "38"}`,
      background: selected ? color : color + "18",
      flexShrink: 0,
    }}>
      <div style={{ color: selected ? "#fff" : color, lineHeight: 0, opacity: 0.95 }}>{icon}</div>
      <span style={{
        fontFamily: "'Outfit',sans-serif",
        fontSize: 13,
        fontWeight: 500,
        color: selected ? "#fff" : "#1F2937",
      }}>{label}</span>
    </div>
  );
}

// ── SVG icons matching Material Icons ─────────────────────────────────────────

const ICON_SIZE = 14;

const IcoMuseum   = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7v2h20V7zm1 4H11V5h2zM4 10v9H2v2h20v-2h-2v-9h-2v9h-2v-9h-2v9H10v-9H8v9H6v-9z"/></svg>;
const IcoRestaurant = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>;
const IcoTerrain   = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor"><path d="M14 6l-1-2H5v17h2v-7h5l1 2h7V6zm4 8h-4l-1-2H7V6h5l1 2h5z"/></svg>;
const IcoPark      = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5V7h5zm-7 0H5V7h5zm7 5h-5v-4h5zm-7 0H5v-4h5zm-3-9L3 2h18l-4 6zm10 12H4l2-4h12z" opacity=".3"/><path d="M12 2L2 8l2 3h16l2-3zM5 17l-2 4h18l-2-4zm7-10H8v5h4zm1 0v5h4v-5z"/></svg>;
const IcoBalance   = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 9l11 7 9-5.93V17h2V9zm6.5 12.4l-6.5 4.22L5.5 14.4 12 10.37zm-11 4.1l1 1.75L12 22l3.5-1.75 1-1.75L12 20.5z"/></svg>;
const IcoCamera    = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor"><path d="M12 15.2A3.2 3.2 0 0 1 8.8 12 3.2 3.2 0 0 1 12 8.8 3.2 3.2 0 0 1 15.2 12 3.2 3.2 0 0 1 12 15.2M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2z"/></svg>;
const IcoSports    = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>;
const IcoSpa       = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9zm-9-9c0 4.97 4.03 9 9 9 0-4.97-4.03-9-9-9zm9-9c-4.97 0-9 4.03-9 9 4.97 0 9-4.03 9-9zm9 9c0-4.97-4.03-9-9-9 0 4.97 4.03 9 9 9z"/></svg>;
const IcoPalette   = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>;
const IcoNightlife = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor"><path d="M10 2v2.26l2 1.33V4h5v2l-5.26 8H17v-2h2v4H7v-2l5.26-8H7V8H5V2zm7 17v3h-2v-3h-3l3.5-4 3.5 4z"/></svg>;

const IcoBolt   = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>;
const IcoHeart  = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const IcoLuggage = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-2.18c.07-.44.18-.86.18-1.3C18 2.99 15.01 1 12 1S6 2.99 6 4.7c0 .44.1.86.18 1.3H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1h10a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-7 12H11V8h2zm4 0h-2V8h2zm-9 0H6V8h2zm2-14.7c0-.73 1.35-1.3 2-1.3s2 .57 2 1.3c0 .44-.1.86-.18 1.3H10.18c-.08-.44-.18-.86-.18-1.3z"/></svg>;
const IcoPlace   = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>;

// ── Walk / Run / Fitness / Bolt (activity) ────────────────────────────────────
const IcoWalk      = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor"><circle cx="13" cy="4" r="2"/><path d="M13.5 21.5l-2-4.5-3-3.5v-5l-1-1.5 2.5-3.5s1 2 3 3l3 1 2.5-2.5 1 1-3 4-2-1v3l2 4.5z"/></svg>;
const IcoRun       = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor"><circle cx="13.5" cy="5.5" r="2.5"/><path d="M17.5 10.8l-3.9-1.3L12 6.6l-3.6 2.4 1.6 2.8-2.4 2.6L9 15.9l2.7-2.9 2.3.8.4 5.5-1.5.7.5 1 2.1-1 1.7.7.4-1-1.3-.5-.5-5.4 2.8-1.2-1.6-3.8h-.01z"/></svg>;
const IcoFitness   = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor"><path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/></svg>;
const IcoBoltAct   = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>;

// ── Travel type icons ──────────────────────────────────────────────────────────
const IcoBackpack  = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor"><path d="M9 4c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2h1c1.66 0 3 1.34 3 3v12c0 1.66-1.34 3-3 3H8c-1.66 0-3-1.34-3-3V7c0-1.66 1.34-3 3-3h1zm3 0h-2v1h2V4zm-4 3H7v2h2V7zm8 0h-2v2h2V7zm-4 2H10v2h2V9zm0 4h-2v4h2v-4z"/></svg>;
const IcoFamily    = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>;
const IcoStar      = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IcoFavorite  = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const IcoBusiness  = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor"><path d="M10 16v-1H3.01L3 19c0 1.11.89 2 2 2h14c1.11 0 2-.89 2-2v-4h-7v1h-4zm10-9h-4.01V5l-2-2h-4l-2 2v2H4c-1.1 0-2 .9-2 2v3c0 1.11.89 2 2 2h6v-2h4v2h6c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-6 0h-4V5h4v2z"/></svg>;

// ── Place type icons ───────────────────────────────────────────────────────────
const IcoBeach     = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor"><path d="M13.127 14.56l1.43-1.43 6.44 6.443L19.57 21zm4.293-5.73l2.86-2.86c-3.95-3.95-10.35-3.96-14.3-.02 3.93-1.3 8.31-.25 11.44 2.88zM5.95 5.98c-3.94 3.95-3.93 10.35.02 14.3l2.86-2.86C5.7 14.29 4.65 9.91 5.95 5.98zm.02-.02l-.01.01c-.38 3.01 1.17 6.88 4.3 10.02l5.73-5.73c-3.13-3.13-7.01-4.7-10.02-4.3z"/></svg>;
const IcoLandscape = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor"><path d="M14 6l-1-2H5v17h2v-7h5l1 2h7V6z" opacity=".3"/><path d="M14 6l-1-2H5v17h2v-7h5l1 2h7V6zm4 8h-4l-1-2H7V6h5l1 2h5v6z"/></svg>;
const IcoCity      = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor"><path d="M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5v-2h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z"/></svg>;
const IcoAgriculture = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor"><path d="M19.5 12c.93 0 1.78.28 2.5.76V8c0-.55-.45-1-1-1h-6v2.09C14.72 8.42 13.37 8 12 8c-2.8 0-5.2 1.64-6.35 4H5c-.55 0-1 .45-1 1v4c0 1.1.9 2 2 2h.09C6.46 20.84 8.07 22 10 22c1.86 0 3.43-1.08 4.23-2.66.42.42.92.73 1.47.91.49.15 1.01.24 1.56.24 2.76.01 5.02-2.25 5.02-5.01h.01c0-1.65-.81-3.1-2.05-4z"/></svg>;
const IcoForest    = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5V7h5zm-7 0H5V7h5zm7 5h-5v-4h5zm-7 0H5v-4h5zm10 4H4l3-4h10zm-10-9L3 2h18z"/></svg>;
const IcoSunny     = () => <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;

// ── Main Component ────────────────────────────────────────────────────────────

export function MobilePreferences({ frameIn }: Props) {
  const frame = useCurrentFrame();
  const rel   = frame - frameIn;

  // Progress bar grows 0→66% (step 2 of 3)
  const progressW = interpolate(rel, [0, 22], [0, 66], { easing: easeOut, ...clamp });

  // Section fade-in stagger
  const headerOp   = fadeIn(frame, frameIn, 10);
  const section1Op = fadeIn(frame, frameIn + 5,  12);  // Intereses
  const section2Op = fadeIn(frame, frameIn + 22, 12);  // Actividad
  const section3Op = fadeIn(frame, frameIn + 36, 12);  // Viaje
  const section4Op = fadeIn(frame, frameIn + 50, 12);  // Lugar
  const ctaOp      = fadeIn(frame, frameIn + 55, 14);

  const section1TY = interpolate(rel, [5,  20], [10, 0], { easing: easeOut, ...clamp });
  const section2TY = interpolate(rel, [22, 36], [10, 0], { easing: easeOut, ...clamp });
  const section3TY = interpolate(rel, [36, 50], [10, 0], { easing: easeOut, ...clamp });
  const section4TY = interpolate(rel, [50, 64], [10, 0], { easing: easeOut, ...clamp });
  const ctaTY      = interpolate(rel, [55, 70], [14, 0], { easing: easeOut, ...clamp });

  // Cursor — coordinates in 460×942 content-space
  const cursorKeyframes = [
    { rel:   0, x: 230, y: 350 },  // idle in middle
    { rel:  25, x: 298, y: 211 },  // hover Aventura (section 1, row 1, 3rd chip)
    { rel:  45, x: 298, y: 211 },  // tap Aventura
    { rel:  68, x: 145, y: 377 },  // hover Moderado (section 2)
    { rel:  88, x: 145, y: 377 },  // tap Moderado
    { rel: 112, x: 184, y: 459 },  // hover Familiar (section 3)
    { rel: 132, x: 184, y: 459 },  // tap Familiar
    { rel: 158, x: 338, y: 892 },  // move to Siguiente button
    { rel: 174, x: 338, y: 892 },  // tap Siguiente
  ];
  const clicks = [{ rel: 45 }, { rel: 88 }, { rel: 132 }, { rel: 174 }];

  // Highlights
  const hlAventura  = rel >= 25  && rel < 68;
  const hlModerado  = rel >= 68  && rel < 112;
  const hlFamiliar  = rel >= 112 && rel < 158;
  const hlSiguiente = rel >= 158 && rel < 180;

  const PURPLE = "#984EFD";
  const ORANGE = "#FF7D1F";  // altAccent
  const CYAN   = "#4DB9CA";  // sea
  const GREEN  = "#9CCC44";  // leaf

  return (
    <div style={{ position: "relative", width: 460, height: 942, background: "#fff", overflow: "hidden", fontFamily: "'Outfit',sans-serif" }}>

      {/* Status bar */}
      <StatusBar />

      {/* Header */}
      <div style={{ opacity: headerOp }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: "#F3F4F6" }}>
          <div style={{
            height: 3,
            width: `${progressW}%`,
            background: `linear-gradient(90deg, ${PURPLE}, ${CYAN})`,
            borderRadius: 2,
          }} />
        </div>

        {/* Navigation row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px 0 20px", height: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            <span style={{ fontSize: 13, color: "#6B7280" }}>Paso 2 de 3</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[true, true, false].map((active, i) => (
              <div key={i} style={{
                width: 28, height: 4, borderRadius: 2,
                background: active ? PURPLE : "#E5E7EB",
              }} />
            ))}
          </div>
        </div>

        {/* Title */}
        <div style={{ padding: "8px 20px 0 20px" }}>
          <div style={{ fontFamily: "'Cal Sans','Outfit',sans-serif", fontSize: 26, fontWeight: 700, color: "#1F2937", lineHeight: 1.2 }}>
            Mis preferencias
          </div>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4, fontStyle: "italic" }}>
            Elige una opción o más opciones por categoría
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div style={{ padding: "4px 20px 100px 20px", overflow: "hidden" }}>

        {/* ── Sección 1: Tus intereses ── */}
        <div style={{ opacity: section1Op, transform: `translateY(${section1TY}px)` }}>
          <SectionLabel
            color={PURPLE}
            icon={<IcoHeart />}
            text="Tus intereses"
          />
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
            {[
              { key: "Cultura",     label: "Cultura",     sel: false,        icon: <IcoMuseum /> },
              { key: "Gastronomía", label: "Gastronomía", sel: true,         icon: <IcoRestaurant /> },
              { key: "Aventura",    label: "Aventura",    sel: rel >= 46,    icon: <IcoTerrain /> },
              { key: "Naturaleza",  label: "Naturaleza",  sel: true,         icon: <IcoPark /> },
              { key: "Historia",    label: "Historia",    sel: false,        icon: <IcoBalance /> },
              { key: "Fotografía",  label: "Fotografía",  sel: true,         icon: <IcoCamera /> },
              { key: "Deportes",    label: "Deportes",    sel: false,        icon: <IcoSports /> },
              { key: "Bienestar",   label: "Bienestar",   sel: false,        icon: <IcoSpa /> },
              { key: "Arte",        label: "Arte",        sel: false,        icon: <IcoPalette /> },
              { key: "Nightlife",   label: "Nightlife",   sel: false,        icon: <IcoNightlife /> },
            ].map(chip => (
              <FilterChipItem key={chip.key} label={chip.label} selected={chip.sel} color={PURPLE} icon={chip.icon} />
            ))}
          </div>
        </div>

        {/* ── Sección 2: Nivel de actividad ── */}
        <div style={{ opacity: section2Op, transform: `translateY(${section2TY}px)` }}>
          <SectionLabel
            color={ORANGE}
            icon={<IcoBolt />}
            text="Nivel de actividad"
          />
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
            {[
              { label: "Bajo",     sel: false,       icon: <IcoWalk /> },
              { label: "Moderado", sel: rel >= 89,   icon: <IcoRun /> },
              { label: "Alto",     sel: false,       icon: <IcoFitness /> },
              { label: "Extremo",  sel: false,       icon: <IcoBoltAct /> },
            ].map(chip => (
              <FilterChipItem key={chip.label} label={chip.label} selected={chip.sel} color={ORANGE} icon={chip.icon} />
            ))}
          </div>
        </div>

        {/* ── Sección 3: Tipo de viaje ── */}
        <div style={{ opacity: section3Op, transform: `translateY(${section3TY}px)` }}>
          <SectionLabel
            color={CYAN}
            icon={<IcoLuggage />}
            text="Tipo de viaje"
          />
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
            {[
              { label: "Mochilero",    sel: false,        icon: <IcoBackpack /> },
              { label: "Familiar",     sel: rel >= 133,   icon: <IcoFamily /> },
              { label: "Lujo",         sel: false,        icon: <IcoStar /> },
              { label: "Aventura",     sel: false,        icon: <IcoTerrain /> },
              { label: "Romántico",    sel: false,        icon: <IcoFavorite /> },
              { label: "De negocios",  sel: false,        icon: <IcoBusiness /> },
            ].map(chip => (
              <FilterChipItem key={chip.label} label={chip.label} selected={chip.sel} color={CYAN} icon={chip.icon} />
            ))}
          </div>
        </div>

        {/* ── Sección 4: Lugar preferido ── */}
        <div style={{ opacity: section4Op, transform: `translateY(${section4TY}px)` }}>
          <SectionLabel
            color={GREEN}
            icon={<IcoPlace />}
            text="Lugar preferido"
          />
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
            {[
              { label: "Playa",   sel: false, icon: <IcoBeach /> },
              { label: "Montaña", sel: true,  icon: <IcoLandscape /> },
              { label: "Ciudad",  sel: false, icon: <IcoCity /> },
              { label: "Campo",   sel: false, icon: <IcoAgriculture /> },
              { label: "Bosque",  sel: false, icon: <IcoForest /> },
              { label: "Desierto",sel: false, icon: <IcoSunny /> },
            ].map(chip => (
              <FilterChipItem key={chip.label} label={chip.label} selected={chip.sel} color={GREEN} icon={chip.icon} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom buttons: Atrás + Siguiente ── */}
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
        {/* Atrás — outlined */}
        <div style={{
          flex: 1, height: 52, borderRadius: 12,
          border: `1.5px solid ${PURPLE}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: PURPLE }}>Atrás</span>
        </div>
        {/* Siguiente — filled */}
        <div style={{
          flex: 1, height: 52, borderRadius: 12,
          background: PURPLE,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(152,78,253,0.30)",
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Siguiente</span>
        </div>
      </div>

      {/* ── Overlays ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {hlAventura && (
          <InScreenHighlight
            frameIn={frameIn} relIn={25} relOut={68}
            x={248} y={194} width={99} height={34}
            color={PURPLE} radius={20}
            label="Aventura" labelSide="top"
          />
        )}
        {hlModerado && (
          <InScreenHighlight
            frameIn={frameIn} relIn={68} relOut={112}
            x={99} y={360} width={92} height={34}
            color={ORANGE} radius={20}
            label="Moderado" labelSide="top"
          />
        )}
        {hlFamiliar && (
          <InScreenHighlight
            frameIn={frameIn} relIn={112} relOut={158}
            x={134} y={442} width={99} height={34}
            color={CYAN} radius={20}
            label="Familiar" labelSide="top"
          />
        )}
        {hlSiguiente && (
          <InScreenHighlight
            frameIn={frameIn} relIn={158} relOut={178}
            x={236} y={854} width={204} height={52}
            color={PURPLE} radius={12}
            label="Siguiente →" labelSide="top"
          />
        )}
        <InScreenCursor frameIn={frameIn} keyframes={cursorKeyframes} clicks={clicks} />
      </div>
    </div>
  );
}
