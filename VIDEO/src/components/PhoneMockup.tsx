/**
 * PhoneMockup — marco de teléfono moderno para formato vertical 9:16.
 * A 440px de ancho ocupa el 41% del canvas (1080px) — mucho más impactante.
 */
import { useCurrentFrame, useVideoConfig, spring, interpolate, Easing } from "remotion";
import { SPRING_SMOOTH } from "../helpers/animations";

interface Props {
  children: React.ReactNode;
  frameIn: number;
  width?: number;
  /** Ken Burns zoom dentro de la pantalla */
  zoomAt?: number;
  zoomScale?: number;
  zoomFocusY?: number;
}

export function PhoneMockup({
  children,
  frameIn,
  width = 440,
  zoomAt,
  zoomScale = 1.2,
  zoomFocusY = 0.35,
}: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const RATIO     = 2.16;
  const height    = width * RATIO;
  const RADIUS    = 52;
  const BORDER    = 5;
  const NOTCH_W   = 100;
  const NOTCH_H   = 24;
  const PADDING_T = 52;

  const s = spring({ frame: frame - frameIn, fps, config: SPRING_SMOOTH });
  const scale   = 0.90 + 0.10 * s;
  const opacity = Math.min(1, s * 2.2);

  // Ken Burns dentro de la pantalla
  const ease = Easing.bezier(0.4, 0, 0.2, 1);
  const contentZoom = zoomAt != null
    ? interpolate(frame, [zoomAt, zoomAt + 35], [1, zoomScale], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: ease,
      })
    : 1;
  const contentH   = height - PADDING_T;
  const ty = (0.5 - zoomFocusY) * contentH * (contentZoom - 1) / contentZoom;

  return (
    <div
      style={{
        width,
        height,
        borderRadius: RADIUS,
        border: `${BORDER}px solid rgba(196,181,253,0.7)`,
        background: "#F7F5FF",
        boxShadow: [
          `0 40px 100px rgba(152,78,253,0.22)`,
          `0 12px 32px rgba(0,0,0,0.12)`,
          `inset 0 1px 0 rgba(255,255,255,0.8)`,
        ].join(", "),
        overflow: "hidden",
        position: "relative",
        transform: `scale(${scale})`,
        opacity,
        transformOrigin: "center bottom",
      }}
    >
      {/* Side buttons */}
      <div style={{ position: "absolute", right: -BORDER - 3, top: 120, width: 4, height: 60, background: "rgba(196,181,253,0.5)", borderRadius: "0 3px 3px 0" }} />
      <div style={{ position: "absolute", left: -BORDER - 3, top: 100, width: 4, height: 40, background: "rgba(196,181,253,0.5)", borderRadius: "3px 0 0 3px" }} />
      <div style={{ position: "absolute", left: -BORDER - 3, top: 155, width: 4, height: 40, background: "rgba(196,181,253,0.5)", borderRadius: "3px 0 0 3px" }} />

      {/* Dynamic island / notch */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          width: NOTCH_W,
          height: NOTCH_H,
          background: "#1a1a1a",
          borderRadius: 999,
          zIndex: 20,
        }}
      />

      {/* Screen content with optional zoom */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          paddingTop: PADDING_T,
          overflow: "hidden",
        }}
      >
        <div style={{
          width: "100%",
          height: "100%",
          transform: contentZoom !== 1
            ? `scale(${contentZoom}) translateY(${ty}px)`
            : undefined,
          transformOrigin: "center top",
        }}>
          {children}
        </div>
      </div>

      {/* Glare overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "40%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)",
          pointerEvents: "none",
          borderRadius: `${RADIUS}px ${RADIUS}px 0 0`,
          zIndex: 15,
        }}
      />

      {/* Bottom home bar */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          width: 120,
          height: 5,
          background: "#1a1a1a",
          borderRadius: 999,
          opacity: 0.25,
          zIndex: 20,
        }}
      />
    </div>
  );
}
