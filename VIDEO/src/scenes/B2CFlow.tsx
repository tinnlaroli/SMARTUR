/**
 * B2CFlow — 5 pasos del flujo Turista.
 * Paso 7 (web): DynamicBrowserMockup con LandingTurista + cursor.
 * Pasos 8-11 (móvil): DynamicPhoneMockupCSS con pantallas CSS precisas.
 */
import { useCurrentFrame, Img, staticFile, interpolate, Easing } from "remotion";
import { BrainCircuit, Mountain, Coffee, Waves, UtensilsCrossed, ArrowRight } from "lucide-react";
import { StepCard } from "../components/StepCard";
import { DynamicBrowserMockup } from "../components/motion/DynamicBrowserMockup";
import { DynamicPhoneMockupCSS } from "../components/motion/DynamicPhoneMockupCSS";
import { MobilePreferences } from "../screens/MobilePreferences";
import { MobileHome } from "../screens/MobileHome";
import { MobilePlanner } from "../screens/MobilePlanner";
import { MobileBooking } from "../screens/MobileBooking";
import { T } from "../helpers/timing";

const CYAN   = "#4DB9CA";
const PURPLE = "#984EFD";

// Tap keyframes off-screen: disabled tap cursor (CSS screens use InScreenCursor internally)
const NO_TAP: [{ rel: number; x: number; y: number }, { rel: number; x: number; y: number }] = [
  { rel: 9999, x: 230, y: 470 },
  { rel: 10000, x: 230, y: 470 },
];

// ── Landing B2C (web) ──────────────────────────────────────────────────────────
const CAT_PILLS = [
  { Icon: Mountain,        label: "Ecoturismo" },
  { Icon: Coffee,          label: "Café" },
  { Icon: Waves,           label: "Naturaleza" },
  { Icon: UtensilsCrossed, label: "Gastronomía" },
];

function LandingTurista() {
  return (
    <div style={{ background: "#fff", height: "100%", fontFamily: "'Outfit',sans-serif", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <Img src={staticFile("logo.png")} style={{ height: 22, width: "auto" }} />
        <div style={{ background: PURPLE, color: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700 }}>
          Descargar app
        </div>
      </div>
      <div style={{ background: "linear-gradient(135deg, #F7F2FF 0%, #EEF9FF 100%)", padding: "24px 24px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: PURPLE, fontWeight: 600, marginBottom: 10 }}>
          <BrainCircuit size={13} color={PURPLE} /> IA que guía, turismo que une
        </div>
        <div style={{ fontFamily: "'Cal Sans','Outfit',sans-serif", fontSize: 22, fontWeight: 700, color: "#1E1E23", lineHeight: 1.2, marginBottom: 12, maxWidth: 320 }}>
          Descubre Veracruz según <span style={{ color: PURPLE }}>tus gustos</span>
        </div>
        <div style={{ fontSize: 12, color: "#50505A", marginBottom: 16, lineHeight: 1.6 }}>
          Recomendaciones personalizadas de lugares, rutas y experiencias en las Altas Montañas de Veracruz.
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 16 }}>
          {CAT_PILLS.map(({ Icon, label }) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: 4, background: `${PURPLE}15`, color: PURPLE, fontSize: 11, fontWeight: 600, borderRadius: 999, padding: "4px 11px" }}>
              <Icon size={10} /> {label}
            </span>
          ))}
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: PURPLE, color: "#fff", borderRadius: 12, padding: "12px 22px", fontSize: 14, fontWeight: 700 }}>
          Ver mis recomendaciones <ArrowRight size={14} />
        </div>
      </div>
      <div style={{ padding: "16px 24px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1E1E23", marginBottom: 10 }}>
          Cerca de ti · Orizaba
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { name: "Cascada Texolo", score: "98%", bg: "linear-gradient(155deg, #0891b2, #22d3ee, #4ade80)" },
            { name: "Pico de Orizaba", score: "95%", bg: "linear-gradient(155deg, #1e3a5f, #2563eb, #e2e8f0)" },
            { name: "Café Cencalli", score: "93%", bg: "linear-gradient(155deg, #78350f, #a16207, #fbbf24)" },
          ].map(({ name, score, bg }) => (
            <div key={name} style={{ flex: 1, background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <div style={{ height: 64, background: bg }} />
              <div style={{ padding: "8px 10px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1E1E23" }}>{name}</div>
                <div style={{ fontSize: 10, color: PURPLE, fontWeight: 600, marginTop: 2 }}>IA {score} match</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Cinematic diagonal wipe between B2C steps ────────────────────────────────

const CLAMP     = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const easeWipe  = Easing.bezier(0.76, 0, 0.24, 1);

function StepFlash({ at, color = "#E8F9FB" }: { at: number; color?: string }) {
  const frame = useCurrentFrame();
  const TOTAL = 22;
  if (frame < at - 2 || frame > at + TOTAL) return null;

  // Wipe in: clip-path diagonal sweeps left→right
  const wipeProg = frame <= at
    ? interpolate(frame, [at - 2, at], [0, 1], CLAMP)
    : interpolate(frame, [at, at + TOTAL], [1, 0], { easing: easeWipe, ...CLAMP });

  // X position of wipe edge (0=left, 1200=right)
  const wipeX = wipeProg * 1180;

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 200, pointerEvents: "none",
      background: `linear-gradient(135deg, ${color} 0%, #F7F5FF 60%, white 100%)`,
      clipPath: `polygon(0 0, ${wipeX}px 0, ${wipeX + 160}px 100%, 0 100%)`,
      opacity: 0.92,
    }} />
  );
}

const B2C_TRANSITIONS = [T.B2C_1_OUT, T.B2C_2_OUT, T.B2C_3_OUT, T.B2C_4_OUT];

// ── Component ──────────────────────────────────────────────────────────────────

export function B2CFlow() {
  const frame = useCurrentFrame();

  return (
    <>
      {/* ── Paso 7: Landing web (BrowserMockup) ── */}
      {frame >= T.B2C_1_IN - 5 && frame <= T.B2C_1_OUT + 5 && (
        <StepCard
          stepNumber={7}
          title="Encuentra tu aventura"
          description="Destinos Veracruz · recomendados por IA."
          accentColor={CYAN}
          frameIn={T.B2C_1_IN}
          frameOut={T.B2C_1_OUT}
          bgColor={CYAN}
        >
          <DynamicBrowserMockup
            frameIn={T.B2C_1_IN}
            frameOut={T.B2C_1_OUT}
            url="smartur.online"
            cameraKeyframes={[
              { rel: 0,   focusX: 0.50, focusY: 0.40, scale: 1.0  },
              // CTA a x=24+108=132, y=281 → focusX=132/980=0.135, focusY=281/573=0.490
              { rel: 26,  focusX: 0.14, focusY: 0.49, scale: 1.72 }, // zoom a CTA
              { rel: 88,  focusX: 0.14, focusY: 0.49, scale: 1.72 },
              // place cards: ~y=440, x=490 → focusX=0.50, focusY=0.77
              { rel: 125, focusX: 0.50, focusY: 0.77, scale: 1.50 }, // pan a place cards
              { rel: 201, focusX: 0.50, focusY: 0.72, scale: 1.38 },
            ]}
            cursorKeyframes={[
              { rel: 8,   x: 750, y: 34  }, // "Descargar app" botón navbar
              { rel: 35,  x: 132, y: 281 }, // CTA "Ver mis recomendaciones" center (x=24+w/2=132, y=262+19=281)
              { rel: 65,  x: 132, y: 281 }, // hover
              { rel: 75,  x: 132, y: 281 }, // click
              { rel: 120, x: 200, y: 460 }, // place card Texolo
              { rel: 160, x: 400, y: 460 }, // card Orizaba
              { rel: 190, x: 590, y: 460 }, // card Cencalli
            ]}
            clicks={[{ rel: 75 }]}
            highlights={[
              // CTA "Ver mis recomendaciones": y≈262 (después de nav=46+hero_pad=24+badge=30+h2=64+desc=54+pills=44)
              { relIn: 35, relOut: 90, x: 24, y: 262, w: 215, h: 38, label: "Ver recomendaciones IA", labelSide: "right", color: PURPLE, radius: 10 },
            ]}
            buttonPresses={[
              { rel: 75, x: 24, y: 262, w: 215, h: 38, color: PURPLE },
            ]}
          >
            <LandingTurista />
          </DynamicBrowserMockup>
        </StepCard>
      )}

      {/* ── Paso 8: Configura preferencias (móvil CSS) ── */}
      {frame >= T.B2C_2_IN - 5 && frame <= T.B2C_2_OUT + 5 && (
        <StepCard
          stepNumber={8}
          title="La IA te conoce"
          description="60 segundos. Sin formularios."
          accentColor={CYAN}
          frameIn={T.B2C_2_IN}
          frameOut={T.B2C_2_OUT}
          bgColor={CYAN}
        >
          <DynamicPhoneMockupCSS
            frameIn={T.B2C_2_IN}
            frameOut={T.B2C_2_OUT}
            cameraKeyframes={[
              // Coordinates from MobilePreferences layout (460×942):
              //   Aventura chip: y=211/942=0.224  Moderado: y=377/942=0.400
              //   Familiar: y=459/942=0.487  Siguiente btn center: y=892/942=0.947
              { rel:   0, focusX: 0.50, focusY: 0.28, scale: 1.00 }, // full view — header + intereses
              { rel:  18, focusX: 0.50, focusY: 0.24, scale: 1.48 }, // zoom to intereses chips
              { rel:  60, focusX: 0.50, focusY: 0.40, scale: 1.45 }, // pan to actividad (y=377/942)
              { rel: 105, focusX: 0.50, focusY: 0.49, scale: 1.42 }, // pan to viaje (y=459/942)
              { rel: 150, focusX: 0.50, focusY: 0.95, scale: 1.38 }, // pan to Siguiente btn
              { rel: 176, focusX: 0.50, focusY: 0.70, scale: 1.12 }, // pull back
            ]}
            tapKeyframes={NO_TAP}
          >
            <MobilePreferences frameIn={T.B2C_2_IN} />
          </DynamicPhoneMockupCSS>
        </StepCard>
      )}

      {/* ── Paso 9: Recomendaciones IA (móvil CSS) ── */}
      {frame >= T.B2C_3_IN - 5 && frame <= T.B2C_3_OUT + 5 && (
        <StepCard
          stepNumber={9}
          title="Tu match perfecto"
          description="98% precisión · recomendaciones en tiempo real."
          accentColor={CYAN}
          frameIn={T.B2C_3_IN}
          frameOut={T.B2C_3_OUT}
          bgColor={CYAN}
        >
          <DynamicPhoneMockupCSS
            frameIn={T.B2C_3_IN}
            frameOut={T.B2C_3_OUT}
            cameraKeyframes={[
              // MobileHome layout: AI header center y=287/942=0.305
              //   Card 1 center: y=(315+100)/942=0.440  Card 2 center: y=(527+100)/942=0.666
              { rel:   0, focusX: 0.50, focusY: 0.30, scale: 1.00 }, // full view
              { rel:  18, focusX: 0.50, focusY: 0.30, scale: 1.42 }, // zoom to AI header+badge
              { rel:  65, focusX: 0.50, focusY: 0.44, scale: 1.44 }, // pan to Card 1 center
              { rel: 130, focusX: 0.50, focusY: 0.66, scale: 1.38 }, // pan to Card 2 center
              { rel: 179, focusX: 0.50, focusY: 0.50, scale: 1.12 }, // pull back
            ]}
            tapKeyframes={NO_TAP}
          >
            <MobileHome frameIn={T.B2C_3_IN} />
          </DynamicPhoneMockupCSS>
        </StepCard>
      )}

      {/* ── Paso 10: Ruta optimizada (móvil CSS) ── */}
      {frame >= T.B2C_4_IN - 5 && frame <= T.B2C_4_OUT + 5 && (
        <StepCard
          stepNumber={10}
          title="Ruta en un toque"
          description="IA organiza el día por ti. Sin planear."
          accentColor={CYAN}
          frameIn={T.B2C_4_IN}
          frameOut={T.B2C_4_OUT}
          bgColor={CYAN}
        >
          <DynamicPhoneMockupCSS
            frameIn={T.B2C_4_IN}
            frameOut={T.B2C_4_OUT}
            cameraKeyframes={[
              // MobilePlanner layout: Stop1 center y=264/942=0.280
              //   Stop3 center: y=496/942=0.527  Optimize center: y=892/942=0.947
              //   Toggle center: y=140/942=0.149
              { rel:   0, focusX: 0.50, focusY: 0.28, scale: 1.00 }, // full view — AppBar + stop 1
              { rel:  18, focusX: 0.50, focusY: 0.28, scale: 1.38 }, // zoom to Stop 1
              { rel:  80, focusX: 0.50, focusY: 0.40, scale: 1.40 }, // pan toward Stop 2
              { rel: 130, focusX: 0.50, focusY: 0.53, scale: 1.42 }, // pan to Stop 3
              { rel: 160, focusX: 0.50, focusY: 0.95, scale: 1.38 }, // pan to Optimize button
              { rel: 185, focusX: 0.50, focusY: 0.50, scale: 1.15 }, // pull back
            ]}
            tapKeyframes={NO_TAP}
          >
            <MobilePlanner frameIn={T.B2C_4_IN} />
          </DynamicPhoneMockupCSS>
        </StepCard>
      )}

      {/* ── Paso 11: Reserva sin llamadas (móvil CSS) ── */}
      {frame >= T.B2C_5_IN - 5 && frame <= T.B2C_5_OUT + 5 && (
        <StepCard
          stepNumber={11}
          title="Reserva sin llamadas"
          description="Confirmación al instante."
          accentColor={CYAN}
          frameIn={T.B2C_5_IN}
          frameOut={T.B2C_5_OUT}
          bgColor={CYAN}
        >
          <DynamicPhoneMockupCSS
            frameIn={T.B2C_5_IN}
            frameOut={T.B2C_5_OUT}
            cameraKeyframes={[
              // MobileBooking: state1 cursor taps at rel=65, state2 starts rel=78-92
              // Camera MUST settle on CTAs before cursor tap (rel=52), on checkmark after state2 (rel=94)
              { rel:   0, focusX: 0.50, focusY: 0.18, scale: 1.00 }, // hero overview
              { rel:  12, focusX: 0.50, focusY: 0.47, scale: 1.35 }, // pan to hours (y=447/942=0.474)
              { rel:  48, focusX: 0.50, focusY: 0.94, scale: 1.46 }, // pan to CTAs — settle before cursor arrives at rel=62
              { rel:  82, focusX: 0.50, focusY: 0.94, scale: 1.46 }, // hold — state change rel=72-92
              { rel:  96, focusX: 0.50, focusY: 0.32, scale: 1.52 }, // jump to checkmark (state2 visible at rel=92)
              { rel: 148, focusX: 0.50, focusY: 0.32, scale: 1.52 }, // hold on checkmark
              { rel: 168, focusX: 0.50, focusY: 0.69, scale: 1.42 }, // pan to chat button (y=650/942=0.690)
              { rel: 228, focusX: 0.50, focusY: 0.52, scale: 1.15 }, // pull back
            ]}
            tapKeyframes={NO_TAP}
          >
            <MobileBooking frameIn={T.B2C_5_IN} />
          </DynamicPhoneMockupCSS>
        </StepCard>
      )}

      {/* Flash cian-blanco entre cada par de pasos B2C */}
      {B2C_TRANSITIONS.map((at) => <StepFlash key={at} at={at} />)}
    </>
  );
}
