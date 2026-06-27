/**
 * DashboardScene — muestra un screenshot real del dashboard con:
 *   - Zoom progresivo hacia el área de interés
 *   - Cursor animado que navega hasta el elemento clave
 *   - Click con ripple
 *   - HighlightRing sobre el elemento
 *   - Callout con label descriptivo
 *
 * Usado por B2BFlow / B2CFlow para reemplazar los replicas estáticos.
 */
import { interpolate, useCurrentFrame, Easing, AbsoluteFill } from "remotion";
import { ScreenShot } from "./ScreenShot";
import { MouseCursor } from "./MouseCursor";
import { HighlightRing } from "./HighlightRing";
import { Callout } from "./Callout";
import { ButtonPress } from "./ButtonPress";
import { fadeIn, fadeOut } from "../../helpers/animations";

export interface FeatureHighlight {
  /** Normalized 0–1 coords within the screenshot */
  nx: number;
  ny: number;
  /** Pixel size of the highlighted box (at 1× viewport, will be scaled) */
  w: number;
  h: number;
  label: string;
  sublabel?: string;
  labelSide?: "top" | "bottom" | "left" | "right";
  /** Frame (relative to scene start) when the highlight appears */
  relFrame: number;
  /** Whether to show a button press animation */
  buttonPress?: boolean;
  color?: string;
}

interface Props {
  screenshotId: string;
  fallback: React.ReactNode;
  frameIn: number;
  frameOut: number;
  /** Where to zoom (0–1 normalized, center of interest) */
  zoomTarget?: { nx: number; ny: number };
  zoomScale?: number;
  zoomInAt?: number;
  highlights?: FeatureHighlight[];
  /** Cursor path — frames relative to scene start; x/y in 1080×1920 space */
  cursorPath?: Array<{ rel: number; x: number; y: number }>;
  cursorClicks?: Array<{ rel: number }>;
}

const ease = Easing.bezier(0.4, 0, 0.2, 1);

/** Convert normalized coords to pixel coords in the 1080×1920 frame */
function n2px(nx: number, ny: number, W = 1080, H = 1920) {
  return { x: nx * W, y: ny * H };
}

export function DashboardScene({
  screenshotId,
  fallback,
  frameIn, frameOut,
  zoomTarget = { nx: 0.5, ny: 0.4 },
  zoomScale = 1.6,
  zoomInAt = 12,
  highlights = [],
  cursorPath = [],
  cursorClicks = [],
}: Props) {
  const frame = useCurrentFrame();
  const rel = frame - frameIn;
  const dur = frameOut - frameIn;

  // ── Zoom ───────────────────────────────────────────────────────────────────
  const zoomProgress = interpolate(rel, [zoomInAt, zoomInAt + 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const zoomBack = interpolate(rel, [dur - 20, dur - 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  const scale = 1 + (zoomScale - 1) * Math.max(0, zoomProgress - zoomBack);
  const { x: cx, y: cy } = n2px(zoomTarget.nx, zoomTarget.ny);
  const tx = (540 - cx) * (scale - 1) / scale;
  const ty = (960 - cy) * (scale - 1) / scale;

  // ── Fade ──────────────────────────────────────────────────────────────────
  const opacity = fadeIn(rel, 0, 14) * fadeOut(frame, frameOut, 14);

  // ── Cursor path (absolute frames) ─────────────────────────────────────────
  const cursorKeyframes = cursorPath.map((k) => ({ frame: frameIn + k.rel, x: k.x, y: k.y }));
  const cursorClicksAbs = cursorClicks.map((c) => ({ frame: frameIn + c.rel }));

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Zoomed container */}
      <div style={{
        position: "absolute", inset: 0, overflow: "hidden",
      }}>
        <div style={{
          width: "100%", height: "100%",
          transform: `scale(${scale}) translate(${tx}px, ${ty}px)`,
          transformOrigin: "center center",
        }}>
          <ScreenShot id={screenshotId} fallback={fallback} />
        </div>
      </div>

      {/* Highlights (in zoomed space) */}
      {highlights.map((h, i) => {
        const hRel = rel - h.relFrame;
        if (hRel < 0) return null;

        // Convert normalized to pixel, then account for zoom transform
        const rawX = h.nx * 1080;
        const rawY = h.ny * 1920;
        // After zoom, element appears at:
        const zx = (rawX - 540) * scale + 540 + tx * scale;
        const zy = (rawY - 960) * scale + 960 + ty * scale;

        const color = h.color ?? "#984EFD";

        return (
          <div key={i}>
            <HighlightRing
              frameIn={frameIn + h.relFrame}
              frameOut={frameOut - 8}
              x={zx - (h.w * scale) / 2}
              y={zy - (h.h * scale) / 2}
              width={h.w * scale}
              height={h.h * scale}
              color={color}
              label={h.label}
              labelSide={h.labelSide ?? "bottom"}
            />
            {h.buttonPress && (
              <ButtonPress
                pressFrame={frameIn + h.relFrame + 2}
                x={zx - (h.w * scale) / 2}
                y={zy - (h.h * scale) / 2}
                width={h.w * scale}
                height={h.h * scale}
                color={color}
                radius={10}
              />
            )}
            {h.sublabel && (
              <Callout
                frameIn={frameIn + h.relFrame + 8}
                frameOut={frameOut - 8}
                tipX={zx}
                tipY={zy - (h.h * scale) / 2}
                offsetX={h.nx > 0.5 ? -260 : 80}
                offsetY={-80}
                label={h.label}
                sublabel={h.sublabel}
                color={color}
              />
            )}
          </div>
        );
      })}

      {/* Cursor */}
      {cursorKeyframes.length >= 2 && (
        <MouseCursor
          keyframes={cursorKeyframes}
          clicks={cursorClicksAbs}
          scale={1.1}
        />
      )}
    </AbsoluteFill>
  );
}
