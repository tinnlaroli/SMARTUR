/**
 * DynamicBrowserMockup — Enhanced browser scene with:
 *  - Multi-keyframe camera (smooth pan + zoom between UI elements)
 *  - Animated cursor at computed viewport position (camera follows cursor)
 *  - HighlightRing, ButtonPress, Callout in content-space coords (zoom with content)
 *
 * Content area: 980 × 573 px (CONTENT_W × CONTENT_H)
 * All coordinates (cursor, highlights, callouts) are in CONTENT pixels.
 */
import { interpolate, useCurrentFrame, Easing } from "remotion";
import { HighlightRing } from "./HighlightRing";
import { ButtonPress } from "./ButtonPress";
import { Callout } from "./Callout";
import { fadeIn } from "../../helpers/animations";

export const CONTENT_W = 980;
export const CHROME_H  = 44;
export const CONTENT_H = Math.round(CONTENT_W * 0.63) - CHROME_H; // 573

const EASE_CAM_IN   = Easing.bezier(0.16, 1, 0.3, 1);  // zoom in  — expo out
const EASE_CAM_PAN  = Easing.bezier(0.45, 0, 0.55, 1);  // pan      — smooth
const EASE_CAM_BACK = Easing.bezier(0.55, 0, 1, 0.45);  // pull back — ease-in
const EASE_CUR      = Easing.bezier(0.25, 0.46, 0.45, 0.94);
const clamp         = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

/**
 * Piecewise interpolation with per-segment easing.
 * Each keyframe can optionally specify the easing INTO it.
 */
function segInterp(
  t: number,
  kfs: { rel: number; val: number }[],
  defaultEasing: (t: number) => number = EASE_CAM_PAN,
): number {
  if (kfs.length === 0) return 0;
  if (t <= kfs[0].rel) return kfs[0].val;
  if (t >= kfs[kfs.length - 1].rel) return kfs[kfs.length - 1].val;
  for (let i = 1; i < kfs.length; i++) {
    if (t <= kfs[i].rel) {
      const a = kfs[i - 1], b = kfs[i];
      const raw = (t - a.rel) / (b.rel - a.rel);
      const eased = defaultEasing(raw);
      return a.val + (b.val - a.val) * eased;
    }
  }
  return kfs[kfs.length - 1].val;
}

// ── Types ────────────────────────────────────────────────────────────────────

/** Camera position keyframe. rel = relative frame from step frameIn. */
export interface CamKF {
  rel: number;
  /** Normalized 0–1 focus point within content area */
  focusX: number;
  focusY: number;
  scale: number;
}

/** Cursor path keyframe. Coords in CONTENT pixels (0–980, 0–573). */
export interface CurKF {
  rel: number;
  x: number;
  y: number;
}

/** A click event at relative frame rel. */
export interface ClickDef { rel: number }

/** A pulsing HighlightRing around a UI element (content-space pixels). */
export interface HighlightDef {
  relIn: number;
  relOut?: number;
  x: number; y: number; w: number; h: number;
  label?: string;
  labelSide?: "top" | "bottom" | "left" | "right";
  color?: string;
  radius?: number;
}

/** A Callout arrow label (tip in content-space pixels). */
export interface CalloutDef {
  relIn: number;
  relOut?: number;
  tipX: number;
  tipY: number;
  label: string;
  sublabel?: string;
  offsetX?: number;
  offsetY?: number;
  color?: string;
}

/** A ButtonPress ripple effect (content-space pixels). */
export interface BtnPressDef {
  rel: number;
  x: number; y: number; w: number; h: number;
  color?: string;
}

interface Props {
  frameIn: number;
  frameOut: number;
  url?: string;
  cameraKeyframes: CamKF[];
  cursorKeyframes: CurKF[];
  clicks?: ClickDef[];
  highlights?: HighlightDef[];
  callouts?: CalloutDef[];
  buttonPresses?: BtnPressDef[];
  /** Set false when child component renders its own InScreenCursor */
  showCursor?: boolean;
  children: React.ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DynamicBrowserMockup({
  frameIn, frameOut,
  url = "smartur.online",
  cameraKeyframes,
  cursorKeyframes,
  clicks = [], highlights = [], callouts = [], buttonPresses = [],
  showCursor = true,
  children,
}: Props) {
  const frame = useCurrentFrame();
  const rel   = frame - frameIn;

  // Entry animation — subtle 3D drop-in
  const entryOpacity  = fadeIn(frame, frameIn, 14);
  const entryScale    = interpolate(rel, [0, 24], [0.93, 1], { easing: EASE_CAM_IN, ...clamp });
  const entryRotateX  = interpolate(rel, [0, 20], [4, 0], { easing: EASE_CAM_IN, ...clamp });
  const entryTranslY  = interpolate(rel, [0, 20], [18, 0], { easing: EASE_CAM_IN, ...clamp });

  // ── Camera (piecewise per-segment easing) ────────────────────────────────
  const fxKFs = cameraKeyframes.map(k => ({ rel: k.rel, val: k.focusX }));
  const fyKFs = cameraKeyframes.map(k => ({ rel: k.rel, val: k.focusY }));
  const scKFs = cameraKeyframes.map(k => ({ rel: k.rel, val: k.scale  }));

  // Detect movement type between this and previous keyframe
  function pickEasing(kfs: typeof scKFs, idx: number) {
    if (idx === 0) return EASE_CAM_PAN;
    const prev = kfs[idx - 1].val;
    const curr = kfs[idx].val;
    if (curr > prev + 0.15) return EASE_CAM_IN;   // zoom in
    if (curr < prev - 0.15) return EASE_CAM_BACK; // pull back
    return EASE_CAM_PAN;                            // pan
  }

  // Per-segment interpolation for each dimension
  function evalCam(t: number, kfs: { rel: number; val: number }[]) {
    if (kfs.length === 0) return 0;
    if (t <= kfs[0].rel) return kfs[0].val;
    if (t >= kfs[kfs.length - 1].rel) return kfs[kfs.length - 1].val;
    for (let i = 1; i < kfs.length; i++) {
      if (t <= kfs[i].rel) {
        const a = kfs[i - 1], b = kfs[i];
        const raw = (t - a.rel) / (b.rel - a.rel);
        const eased = pickEasing(scKFs, i)(raw);
        return a.val + (b.val - a.val) * eased;
      }
    }
    return kfs[kfs.length - 1].val;
  }

  const focusX = evalCam(rel, fxKFs);
  const focusY = evalCam(rel, fyKFs);
  const camS   = evalCam(rel, scKFs);

  // Vignette on extreme zoom (needs camS)
  const vignetteOp = interpolate(camS, [1.5, 2.5], [0, 0.22], clamp);

  // Transform that centers the focal point in the viewport
  const tx = (0.5 - focusX) * CONTENT_W * (camS - 1) / camS;
  const ty = (0.5 - focusY) * CONTENT_H * (camS - 1) / camS;

  // ── Cursor ────────────────────────────────────────────────────────────────
  const curTs = cursorKeyframes.map(k => k.rel);
  const curFirst = curTs[0];
  const curLast  = curTs[curTs.length - 1];

  const curCX = segInterp(rel, cursorKeyframes.map(k => ({ rel: k.rel, val: k.x })), EASE_CUR);
  const curCY = segInterp(rel, cursorKeyframes.map(k => ({ rel: k.rel, val: k.y })), EASE_CUR);

  // Map cursor content-space coords → viewport coords through camera transform
  // Point (px, py) after scale(S) translate(tx, ty) on a center origin:
  //   vx = (px - focusX * W) * S + W/2
  const curVX = (curCX - focusX * CONTENT_W) * camS + CONTENT_W / 2;
  const curVY = (curCY - focusY * CONTENT_H) * camS + CONTENT_H / 2;

  const cursorOpacity = interpolate(
    rel,
    [curFirst, curFirst + 6, curLast, curLast + 14],
    [0, 1, 1, 0],
    clamp,
  );

  // Click animation
  const activeClick = clicks.find(c => rel >= c.rel && rel < c.rel + 22);
  const clickProg   = activeClick
    ? interpolate(rel, [activeClick.rel, activeClick.rel + 22], [0, 1], clamp)
    : 0;
  const cursorScaleFactor = activeClick
    ? interpolate(rel, [activeClick.rel, activeClick.rel + 6, activeClick.rel + 16], [1, 0.78, 1], clamp)
    : 1;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      width: CONTENT_W,
      borderRadius: 18,
      overflow: "hidden",
      boxShadow: [
        "0 32px 80px rgba(152,78,253,0.20)",
        "0 8px 24px rgba(0,0,0,0.12)",
        "inset 0 1px 0 rgba(255,255,255,0.9)",
      ].join(", "),
      scale: String(entryScale),
      opacity: entryOpacity,
      border: "1px solid rgba(232,227,255,0.8)",
      transform: `perspective(1200px) rotateX(${entryRotateX}deg) translateY(${entryTranslY}px)`,
    }}>

      {/* ── Browser chrome ── */}
      <div style={{
        height: CHROME_H, background: "#F0EEFF",
        padding: "0 16px", display: "flex", alignItems: "center", gap: 10,
        borderBottom: "1.5px solid #E8E3FF", flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
          {["#EF4444", "#F59E0B", "#10B981"].map(c => (
            <div key={c} style={{ width: 13, height: 13, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{
          flex: 1, background: "#fff", borderRadius: 8, padding: "5px 14px",
          fontFamily: "'Outfit',sans-serif", fontSize: 13, color: "#50505A",
          border: "1px solid rgba(0,0,0,0.06)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#9CA3AF" style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", marginRight: 4 }}><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>{url}
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#C4B5FD" }} />
          ))}
        </div>
      </div>

      {/* ── Content area ── */}
      <div style={{ height: CONTENT_H, overflow: "hidden", background: "#fff", position: "relative" }}>

        {/* Camera-transformed layer: content + overlays */}
        <div style={{
          width: "100%", height: "100%",
          transform: `scale(${camS}) translate(${tx}px, ${ty}px)`,
          transformOrigin: "center center",
        }}>
          {/* Base content (screenshot / video) */}
          {children}

          {/* HighlightRings in content space (zoom with content) */}
          {highlights.map((h, i) =>
            rel >= h.relIn && (h.relOut == null || rel < h.relOut + 15) ? (
              <HighlightRing
                key={i}
                frameIn={frameIn + h.relIn}
                frameOut={h.relOut != null ? frameIn + h.relOut : undefined}
                x={h.x} y={h.y}
                width={h.w} height={h.h}
                radius={h.radius}
                color={h.color}
                label={h.label}
                labelSide={h.labelSide}
              />
            ) : null
          )}

          {/* ButtonPress effects in content space */}
          {buttonPresses.map((bp, i) => (
            <ButtonPress
              key={i}
              pressFrame={frameIn + bp.rel}
              x={bp.x} y={bp.y}
              width={bp.w} height={bp.h}
              color={bp.color}
            />
          ))}

          {/* Callouts in content space (zoom with content for dramatic effect) */}
          {callouts.map((c, i) =>
            rel >= c.relIn && (c.relOut == null || rel < c.relOut + 15) ? (
              <Callout
                key={i}
                frameIn={frameIn + c.relIn}
                frameOut={c.relOut != null ? frameIn + c.relOut : undefined}
                tipX={c.tipX} tipY={c.tipY}
                label={c.label} sublabel={c.sublabel}
                offsetX={c.offsetX} offsetY={c.offsetY}
                color={c.color}
              />
            ) : null
          )}
        </div>

        {/* Vignette on extreme zoom */}
        {vignetteOp > 0 && (
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 50,
            background: "radial-gradient(ellipse 60% 60% at 50% 50%, transparent 55%, rgba(10,6,25,0.35) 100%)",
            opacity: vignetteOp,
          }} />
        )}

        {/* ── Cursor overlay (outside camera transform, at computed viewport pos) ── */}
        {showCursor && cursorOpacity > 0 && (
          <div style={{
            position: "absolute",
            left: curVX,
            top: curVY,
            transform: `translate(-3px, -2px) scale(${cursorScaleFactor * 1.6})`,
            transformOrigin: "3px 2px",
            pointerEvents: "none",
            opacity: cursorOpacity,
            zIndex: 999,
          }}>
            {/* Click ripple ring */}
            {activeClick && clickProg > 0 && (
              <div style={{
                position: "absolute",
                left: -18, top: -18,
                width: 36, height: 36,
                borderRadius: "50%",
                border: "2.5px solid rgba(152,78,253,0.75)",
                scale: String(1 + clickProg * 2),
                opacity: 1 - clickProg,
                pointerEvents: "none",
              }} />
            )}
            {/* Second ripple (delayed) */}
            {activeClick && clickProg > 0.2 && (
              <div style={{
                position: "absolute",
                left: -14, top: -14,
                width: 28, height: 28,
                borderRadius: "50%",
                border: "2px solid rgba(152,78,253,0.45)",
                scale: String(1 + (clickProg - 0.2) * 1.8),
                opacity: Math.max(0, 0.8 - (clickProg - 0.2) * 1.5),
                pointerEvents: "none",
              }} />
            )}
            {/* Cursor SVG */}
            <svg
              width="20" height="25" viewBox="0 0 20 25"
              style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))" }}
            >
              <path
                d="M3 1.5L3 19L7.5 14.5L11.5 23L14 22L10 13.5L16.5 13.5L3 1.5Z"
                fill="white" stroke="#1a1a1a" strokeWidth="1.2" strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
