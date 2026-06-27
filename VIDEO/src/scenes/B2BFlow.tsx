/**
 * B2BFlow — 6 pasos del flujo Prestador de Servicio.
 * Cada paso usa DynamicBrowserMockup con:
 *  - cameraKeyframes: el caméraman sigue al cursor entre elementos de UI
 *  - cursorKeyframes: cursor que navega la interfaz mostrando la acción
 *  - clicks / highlights / callouts / buttonPresses: efectos interactivos
 *
 * Coordenadas en CONTENT pixels (980 × 573).
 * Los valores son aproximaciones visuales calibradas para los mocks CSS
 * y las grabaciones WebM. Ajustar en Studio si es necesario.
 */
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { StepCard } from "../components/StepCard";
import { StatusPill } from "../components/StatusPill";
import {
  DynamicBrowserMockup,
  type CamKF, type CurKF, type ClickDef,
  type HighlightDef, type CalloutDef, type BtnPressDef,
} from "../components/motion/DynamicBrowserMockup";
import { LandingEmpresa } from "../screens/LandingEmpresa";
import { OTPVerify } from "../screens/OTPVerify";
import { AdminAprobacion } from "../screens/AdminAprobacion";
import { PortalActivo } from "../screens/PortalActivo";
import { AgendaEmpresa } from "../screens/AgendaEmpresa";
import { T } from "../helpers/timing";

const PURPLE = "#984EFD";

// ── Per-step action scripts ───────────────────────────────────────────────────

interface StepData {
  frameIn: number;
  frameOut: number;
  stepNumber: number;
  title: string;
  description: string;
  url: string;
  pill?: "approved" | "blocked" | "visible";
  pillAt?: number;
  content: React.ReactNode;
  camera: CamKF[];
  cursor: CurKF[];
  clicks?: ClickDef[];
  highlights?: HighlightDef[];
  callouts?: CalloutDef[];
  buttonPresses?: BtnPressDef[];
  /** Suprimir cursor de DynamicBrowserMockup cuando el CSS child tiene el suyo */
  showCursor?: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// Paso 1 — Landing (LandingEmpresa CSS mock, 980×573)
//
//  Layout medido del CSS mock (navBar=46px, heroPadTop=26px):
//    Badge (Galardón):          y≈72–92      marginBottom 14
//    Heading (2 líneas 22px):   y≈106–159    marginBottom 10
//    Description (3 líneas):    y≈169–218    marginBottom 16
//    CTA "Registrar empresa":   x=24–154, y=234–267
//    Stats row:                 y≈287–330
//    Benefits section:          y≈346+
//
//  Usamos LandingEmpresa directamente (no ScreenShot) para que los overlays
//  cuadren exactamente con el CSS mock.
// ────────────────────────────────────────────────────────────────────────────
const step1: StepData = {
  frameIn: T.B2B_1_IN, frameOut: T.B2B_1_OUT,
  stepNumber: 1,
  title: "Tu negocio en el mapa",
  description: "Registro gratis. Sin comisiones.",
  url: "smartur.online",
  content: <LandingEmpresa />,
  camera: [
    { rel: 0,   focusX: 0.50, focusY: 0.40, scale: 1.0  },
    { rel: 26,  focusX: 0.16, focusY: 0.43, scale: 1.85 }, // zoom a CTA hero (x≈90, y≈250)
    { rel: 95,  focusX: 0.16, focusY: 0.43, scale: 1.85 }, // mantiene zoom
    { rel: 138, focusX: 0.40, focusY: 0.73, scale: 1.50 }, // pan a benefits
    { rel: 194, focusX: 0.40, focusY: 0.70, scale: 1.38 },
  ],
  cursor: [
    { rel: 8,   x: 870, y: 22  }, // navbar "Registra tu negocio" (far right)
    { rel: 32,  x: 89,  y: 250 }, // CTA hero "Registrar empresa" (x=24+w/2, y=234+h/2)
    { rel: 65,  x: 89,  y: 250 }, // hover sobre CTA
    { rel: 76,  x: 89,  y: 250 }, // click
    { rel: 122, x: 300, y: 420 }, // card benefits "Clientes IA"
    { rel: 160, x: 300, y: 450 }, // card benefits "Agenda integrada"
  ],
  clicks: [{ rel: 76 }],
  highlights: [
    // CTA principal: x=24, y=234, w=130, h=33
    { relIn: 32, relOut: 95, x: 24, y: 234, w: 130, h: 33, label: "Registrar empresa", labelSide: "right", color: PURPLE, radius: 8 },
    // Benefits cards area
    { relIn: 140, relOut: 190, x: 24, y: 346, w: 932, h: 110, label: "¿Qué obtienes?", labelSide: "top", color: PURPLE, radius: 12 },
  ],
  buttonPresses: [
    { rel: 76, x: 24, y: 234, w: 130, h: 33, color: PURPLE },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// Paso 2 — OTP Verify (CSS mock, 980×573)
//
//  Outer div: height=100%=573, padding=32, flex-column centered.
//  Logo: h=26 + marginBottom=28 → starts at y≈35, ends y=61.
//  Card: padding=28, maxWidth=380, centered (x=300-680).
//    Icon(56)+margin(16) + Heading(22)+margin(8) + Desc(50)+margin(24) → content-top y≈89+28=117
//    OTP boxes start: 117 + 72+30+60 = 279 → y≈279, h=52, y_end≈331
//    Timer: y≈355
//    "Verificar identidad" button: y≈395, h≈37
//
//  OTP boxes: x=(980-304)/2=338 → x=338, w=304 (6×44 + 5×8-gap)
//  Verificar button: full-width inside card content = card_x(300)+pad(28)=328, w=324
// ────────────────────────────────────────────────────────────────────────────
const step2: StepData = {
  frameIn: T.B2B_2_IN, frameOut: T.B2B_2_OUT,
  stepNumber: 2,
  title: "Identidad verificada",
  description: "Un código. Tu perfil en revisión.",
  url: "smartur.online/registro",
  pill: "blocked",
  pillAt: T.B2B_2_IN + 90,
  content: <OTPVerify frameIn={T.B2B_2_IN} />,
  camera: [
    { rel: 0,   focusX: 0.50, focusY: 0.50, scale: 1.0  },
    { rel: 18,  focusX: 0.50, focusY: 0.52, scale: 1.80 }, // zoom a OTP boxes (y=279-331)
    { rel: 112, focusX: 0.50, focusY: 0.70, scale: 1.55 }, // pan a botón Verificar (y≈395-432)
    { rel: 156, focusX: 0.50, focusY: 0.55, scale: 1.25 },
  ],
  cursor: [
    { rel: 5,   x: 820, y: 55  },
    // 6 OTP boxes: x start=338, each box 44px wide with 8px gap → centers: 360,412,464,516,568,620
    { rel: 22,  x: 360, y: 305 }, // box 1 center (x=338+44/2=360, y=279+52/2=305)
    { rel: 37,  x: 412, y: 305 }, // box 2
    { rel: 52,  x: 464, y: 305 }, // box 3
    { rel: 67,  x: 516, y: 305 }, // box 4
    { rel: 82,  x: 568, y: 305 }, // box 5
    { rel: 97,  x: 620, y: 305 }, // box 6
    { rel: 118, x: 490, y: 414 }, // "Verificar identidad" button center (x=490, y=395+19=414)
    { rel: 140, x: 490, y: 414 },
  ],
  clicks: [
    { rel: 25 }, { rel: 40 }, { rel: 55 }, { rel: 70 }, { rel: 85 }, { rel: 100 },
    { rel: 130 },
  ],
  highlights: [
    // 6 OTP boxes: x=338, y=279, w=304 (6×44+5×8), h=52
    { relIn: 22, relOut: 110, x: 338, y: 279, w: 304, h: 52, label: "Código de 6 dígitos", labelSide: "top", color: PURPLE, radius: 14 },
    // "Verificar identidad" button: x=328, y=395, w=324, h=37
    { relIn: 115, relOut: 148, x: 328, y: 395, w: 324, h: 37, label: "Verificar identidad", labelSide: "bottom", color: PURPLE, radius: 8 },
  ],
  buttonPresses: [
    { rel: 130, x: 328, y: 395, w: 324, h: 37, color: PURPLE },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// Paso 3 — Admin valida (AdminAprobacion CSS mock — servicios con datos reales)
//   AdminLayoutMock: sidebar x=0-220, header y=0-64. Content x=232+, y=76+.
//   Tabs: y≈76-105.  Row 1 (Tour Niebla, PENDING): y≈130-165.
//   "Aprobar" button row 1: x≈625-690, y≈138-158.  focusX≈0.65, focusY≈0.26
//   AdminAprobacion tiene InScreenCursor → showCursor=false
// ────────────────────────────────────────────────────────────────────────────
const step3: StepData = {
  frameIn: T.B2B_3_IN, frameOut: T.B2B_3_OUT,
  stepNumber: 3,
  title: "El equipo te respalda",
  description: "Portal activo en menos de 24h.",
  url: "app.smartur.online/dashboard/aprobacion",
  pill: "approved",
  pillAt: T.B2B_3_IN + 155,
  content: <AdminAprobacion frameIn={T.B2B_3_IN} />,
  showCursor: false,
  // AdminAprobacion InScreenHighlight real:
  //   Tab "Actividades": y≈116-144, center y=130 → focusY=0.23
  //   "Aprobar" button: x=610, y=142 → focusX=0.62, focusY=0.25
  //   Row 1 highlight: x=226, y=134, w=494, h=36
  camera: [
    { rel: 0,   focusX: 0.55, focusY: 0.36, scale: 1.0  },
    { rel: 20,  focusX: 0.40, focusY: 0.23, scale: 1.60 }, // zoom a tabs (x≈395, y=130)
    { rel: 72,  focusX: 0.62, focusY: 0.25, scale: 2.20 }, // zoom a botón Aprobar (x=610, y=142)
    { rel: 128, focusX: 0.48, focusY: 0.25, scale: 1.80 }, // pull back a fila completa (x≈473, y=143)
    { rel: 185, focusX: 0.48, focusY: 0.38, scale: 1.45 }, // pan a row 2 (y≈185)
    { rel: 219, focusX: 0.55, focusY: 0.36, scale: 1.20 }, // pull back final
  ],
  cursor: [
    { rel: 0,   x: -100, y: -100 },
    { rel: 219, x: -100, y: -100 },
  ],
  // AdminAprobacion tiene InScreenCursor + InScreenHighlight propios → sin overlays externos
  clicks: [],
  highlights: [],
  callouts: [],
  buttonPresses: [],
};

// ────────────────────────────────────────────────────────────────────────────
// Paso 4 — Portal activo (PortalActivo CSS mock — DB rica con CounterAnimation)
//   EmpresaLayoutMock: sidebar x=0-220, header y=0-64.
//   KPI grid: x=232-716, y=95-203.  KPI1 center=(289,149)  KPI3 center=(537,149)
//   PortalActivo tiene InScreenCursor y InScreenHighlight propios → showCursor=false
// ────────────────────────────────────────────────────────────────────────────
const step4: StepData = {
  frameIn: T.B2B_4_IN, frameOut: T.B2B_4_OUT,
  stepNumber: 4,
  title: "Dashboard en tiempo real",
  description: "Métricas IA · visitas · favoritos. Un vistazo.",
  url: "app.smartur.online/empresa/inicio",
  content: <PortalActivo frameIn={T.B2B_4_IN} />,
  showCursor: false,
  camera: [
    { rel: 0,   focusX: 0.58, focusY: 0.40, scale: 1.0  },
    { rel: 22,  focusX: 0.48, focusY: 0.26, scale: 1.75 }, // zoom a KPI grid
    { rel: 78,  focusX: 0.30, focusY: 0.26, scale: 2.40 }, // zoom KPI1 (247 Recomendaciones)
    { rel: 140, focusX: 0.55, focusY: 0.26, scale: 2.40 }, // pan a KPI3 (512 Visitas)
    { rel: 200, focusX: 0.58, focusY: 0.55, scale: 1.55 }, // pull back a tabla de servicios
    { rel: 250, focusX: 0.58, focusY: 0.48, scale: 1.30 },
  ],
  // Cursor suprimido (showCursor=false) — PortalActivo usa InScreenCursor propio.
  // Valores dummy necesarios por el prop tipado:
  cursor: [
    { rel: 0,   x: -100, y: -100 },
    { rel: 250, x: -100, y: -100 },
  ],
  clicks: [],
  highlights: [],
  callouts: [],
  buttonPresses: [],
};

// ────────────────────────────────────────────────────────────────────────────
// Paso 5 — Aprobación de servicios (AdminAprobacion CSS mock)
//
//  Mismo AdminLayoutMock que step 3. La pantalla muestra "Actividades" activa
//  con 3 servicios pendientes. Cursor propio de AdminAprobacion.
//  Coordenadas del CSS mock (medidas del cursor path interno):
//    "Aprobar" button row 1: x≈625, y≈152
//    Tab "Actividades" (badge 3): x≈232–330, y≈76–98
//    Row 1 (Tour Niebla): x≈232–967, y≈125–167
//
//  showCursor=false — AdminAprobacion maneja su propio InScreenCursor
// ────────────────────────────────────────────────────────────────────────────
const step5: StepData = {
  frameIn: T.B2B_5_IN, frameOut: T.B2B_5_OUT,
  stepNumber: 5,
  title: "Tus servicios, en vivo",
  description: "Un clic. Miles de turistas te encuentran.",
  url: "app.smartur.online/dashboard/aprobacion",
  pill: "visible",
  pillAt: T.B2B_5_IN + 115,
  content: <AdminAprobacion frameIn={T.B2B_5_IN} />,
  showCursor: false,
  // Mismas coords CSS mock que step3 — AdminAprobacion reutilizada como paso 5.
  camera: [
    { rel: 0,   focusX: 0.55, focusY: 0.36, scale: 1.0  },
    { rel: 20,  focusX: 0.40, focusY: 0.23, scale: 1.60 }, // zoom a tabs (y=130)
    { rel: 62,  focusX: 0.62, focusY: 0.25, scale: 2.20 }, // zoom a botón Aprobar (x=610, y=142)
    { rel: 115, focusX: 0.48, focusY: 0.25, scale: 1.75 }, // pull back a fila
    { rel: 163, focusX: 0.55, focusY: 0.36, scale: 1.25 }, // vista general
  ],
  cursor: [
    { rel: 0,   x: -100, y: -100 },
    { rel: 163, x: -100, y: -100 },
  ],
  // AdminAprobacion tiene InScreenCursor + InScreenHighlight → sin overlays externos
  clicks: [],
  highlights: [],
  callouts: [],
  buttonPresses: [],
};

// ────────────────────────────────────────────────────────────────────────────
// Paso 6 — Agenda (AgendaEmpresa CSS mock — 3 reservas reales: Ana, Carlos, Walk-in)
//   EmpresaLayoutMock: sidebar x=0-220, header y=0-64.
//   Table: x=232-680, y≈125-260.  Right panel (MiniCal): x=700-968, y≈76-330.
//   AgendaEmpresa tiene InScreenCursor y InScreenHighlight propios → showCursor=false
// ────────────────────────────────────────────────────────────────────────────
const step6: StepData = {
  frameIn: T.B2B_6_IN, frameOut: T.B2B_6_OUT,
  stepNumber: 6,
  title: "Reservas bajo control",
  description: "Turistas, agenda y semana. Un solo portal.",
  url: "app.smartur.online/empresa/calendario",
  content: <AgendaEmpresa frameIn={T.B2B_6_IN} />,
  showCursor: false,
  // AgendaEmpresa InScreenHighlight real:
  //   Row 1 Ana García: x=226, y=148, w=494, h=34 → center x=473, y=165
  //   Row 2+profile:    x=226, y=195, w=494, h=80 → center x=473, y=235
  //   MiniCalendario right panel: x=680-960 → center x=820
  //   focusX row table = 473/980 = 0.483, focusY row1 = 165/573 = 0.288
  camera: [
    { rel: 0,   focusX: 0.55, focusY: 0.42, scale: 1.0  },
    { rel: 22,  focusX: 0.46, focusY: 0.29, scale: 1.75 }, // zoom a tabla (x=473, y=165)
    { rel: 78,  focusX: 0.46, focusY: 0.29, scale: 2.25 }, // zoom a fila Ana García
    { rel: 140, focusX: 0.46, focusY: 0.41, scale: 2.25 }, // pan a row 2 + perfil turista (y=235)
    { rel: 190, focusX: 0.84, focusY: 0.28, scale: 1.82 }, // pan al MiniCalendario (x=820)
    { rel: 224, focusX: 0.55, focusY: 0.42, scale: 1.25 }, // pull back
  ],
  cursor: [
    { rel: 0,   x: -100, y: -100 },
    { rel: 224, x: -100, y: -100 },
  ],
  clicks: [],
  highlights: [],
  callouts: [],
  buttonPresses: [],
};

// ── Flash de transición entre pasos ──────────────────────────────────────────

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const easeFlash = Easing.bezier(0.4, 0, 0.6, 1);

function StepFlash({ at }: { at: number }) {
  const frame = useCurrentFrame();
  if (frame < at - 4 || frame > at + 12) return null;
  const opacity = frame <= at
    ? interpolate(frame, [at - 4, at], [0, 0.75], CLAMP)
    : interpolate(frame, [at, at + 12], [0.75, 0], { easing: easeFlash, ...CLAMP });
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 200, pointerEvents: "none",
      background: "linear-gradient(135deg, #EDE9FF 0%, #F7F5FF 50%, #EDE9FF 100%)",
      opacity,
    }} />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const STEPS: StepData[] = [step1, step2, step3, step4, step5, step6];
const TRANSITIONS = [T.B2B_1_OUT, T.B2B_2_OUT, T.B2B_3_OUT, T.B2B_4_OUT, T.B2B_5_OUT];

export function B2BFlow() {
  const frame = useCurrentFrame();

  return (
    <>
      {STEPS.map((step) => {
        if (frame < step.frameIn - 5 || frame > step.frameOut + 5) return null;

        return (
          <StepCard
            key={step.stepNumber}
            stepNumber={step.stepNumber}
            title={step.title}
            description={step.description}
            accentColor={PURPLE}
            frameIn={step.frameIn}
            frameOut={step.frameOut}
            bgColor={PURPLE}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, width: "100%" }}>
              <DynamicBrowserMockup
                frameIn={step.frameIn}
                frameOut={step.frameOut}
                url={step.url}
                cameraKeyframes={step.camera}
                cursorKeyframes={step.cursor}
                clicks={step.clicks}
                highlights={step.highlights}
                callouts={step.callouts}
                buttonPresses={step.buttonPresses}
                showCursor={step.showCursor ?? true}
              >
                {step.content}
              </DynamicBrowserMockup>

              {step.pill && step.pillAt != null && frame >= step.pillAt && (
                <StatusPill status={step.pill} frameIn={step.pillAt} />
              )}
            </div>
          </StepCard>
        );
      })}

      {/* Flash blanco-púrpura entre cada par de pasos B2B */}
      {TRANSITIONS.map((at) => <StepFlash key={at} at={at} />)}
    </>
  );
}
