/**
 * LaptopMockup — carcasa estilo MacBook para mostrar grabaciones reales.
 * Entrada con spring suave desde abajo.
 */
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { SPRING_SMOOTH } from "../helpers/animations";

interface Props {
  children: React.ReactNode;
  /** Frame global (relativo al Sequence padre) desde el que arranca la animación de entrada */
  frameIn?: number;
  /** Ancho del área de pantalla en px (alto = screenWidth × 9/16) */
  screenWidth?: number;
}

export function LaptopMockup({ children, frameIn = 0, screenWidth = 840 }: Props) {
  const frame       = useCurrentFrame();
  const { fps }     = useVideoConfig();

  const SCREEN_W    = screenWidth;
  const SCREEN_H    = Math.round(SCREEN_W * 9 / 16);

  const CAM         = 10;    // px — camera dot diameter
  const BZ_TOP      = 24;    // bezel arriba (incluye espacio para la cámara)
  const BZ_SIDE     = 18;    // bezel lateral
  const BZ_BOTTOM   = 22;    // bezel abajo
  const LID_W       = SCREEN_W + BZ_SIDE * 2;
  const LID_H       = SCREEN_H + BZ_TOP + BZ_BOTTOM;
  const BASE_W      = LID_W + 32;
  const BASE_H      = 62;
  const HINGE_H     = 3;

  // ── entrada ──────────────────────────────────────────────────────
  const s       = spring({ frame: frame - frameIn, fps, config: SPRING_SMOOTH });
  const scale   = 0.88 + 0.12 * s;
  const opacity = Math.min(1, s * 1.8);
  const ty      = (1 - s) * 52;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity,
        transform: `scale(${scale}) translateY(${ty}px)`,
        transformOrigin: "center 68%",
        filter: [
          "drop-shadow(0 40px 80px rgba(0,0,0,0.38))",
          "drop-shadow(0 8px 20px rgba(152,78,253,0.14))",
        ].join(" "),
      }}
    >
      {/* ── TAPA / PANTALLA ─────────────────────────────────────── */}
      <div
        style={{
          width: LID_W,
          height: LID_H,
          background: "linear-gradient(150deg, #2F2F32 0%, #1A1A1C 100%)",
          borderRadius: 14,
          padding: `${BZ_TOP}px ${BZ_SIDE}px ${BZ_BOTTOM}px`,
          boxSizing: "border-box",
          position: "relative",
          border: "1.5px solid rgba(255,255,255,0.08)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Cámara */}
        <div
          style={{
            position: "absolute",
            top: (BZ_TOP - CAM) / 2,
            left: "50%",
            transform: "translateX(-50%)",
            width: CAM,
            height: CAM,
            borderRadius: "50%",
            background: "#2A2A2D",
            border: "1.5px solid rgba(255,255,255,0.14)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 2,
              left: 2,
              width: 3,
              height: 3,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.28)",
            }}
          />
        </div>

        {/* Pantalla */}
        <div
          style={{
            width: SCREEN_W,
            height: SCREEN_H,
            borderRadius: 4,
            overflow: "hidden",
            background: "#000",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.55), 0 0 28px rgba(152,78,253,0.10)",
          }}
        >
          {children}
        </div>
      </div>

      {/* ── BISAGRA ─────────────────────────────────────────────── */}
      <div
        style={{
          width: LID_W - 24,
          height: HINGE_H,
          background: "linear-gradient(90deg, #0F0F10, #1E1E20, #0F0F10)",
          borderRadius: "0 0 2px 2px",
        }}
      />

      {/* ── BASE / TECLADO ──────────────────────────────────────── */}
      <div
        style={{
          width: BASE_W,
          height: BASE_H,
          background: "linear-gradient(175deg, #2A2A2C 0%, #1A1A1C 100%)",
          borderRadius: "0 0 10px 10px",
          border: "1.5px solid rgba(255,255,255,0.06)",
          borderTop: "none",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingBottom: 10,
        }}
      >
        {/* Trackpad */}
        <div
          style={{
            width: 148,
            height: 28,
            background: "rgba(255,255,255,0.035)",
            borderRadius: 5,
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        />
      </div>
    </div>
  );
}
