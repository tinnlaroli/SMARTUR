/**
 * DynamicPhoneMockup — Marco de teléfono con:
 *  - Video real (OffthreadVideo) con trim por startFrom
 *  - Cámara multi-keyframe (zoom + pan dentro de la pantalla)
 *  - Cursor de tap (círculo con ripple) en viewport calculado
 *  - HighlightRing, Callout en espacio de contenido (zoom con pantalla)
 *
 * Content area: PHONE_W × PHONE_CONTENT_H = 460 × 942 px
 */
import { interpolate, useCurrentFrame, Easing, OffthreadVideo, staticFile, Sequence } from "remotion";
import { HighlightRing } from "./HighlightRing";
import { Callout } from "./Callout";
import { fadeIn } from "../../helpers/animations";

export const PHONE_W        = 460;
const PHONE_RATIO    = 2.16;
export const PHONE_H        = Math.round(PHONE_W * PHONE_RATIO);  // 994
const PADDING_T      = 52;                                          // espacio para notch
export const PHONE_CONTENT_H = PHONE_H - PADDING_T;               // 942

const RADIUS  = 48;
const BORDER  = 5;
const NOTCH_W = 100;
const NOTCH_H = 24;

const EASE_CAM = Easing.bezier(0.45, 0, 0.55, 1);
const EASE_CUR = Easing.bezier(0.4, 0, 0.2, 1);
const clamp    = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// ── Types ────────────────────────────────────────────────────────────────────

export interface PhoneCamKF {
  rel: number;
  focusX: number;
  focusY: number;
  scale: number;
}

export interface PhoneTapKF {
  rel: number;
  /** Tap position in content pixels (0–460, 0–942) */
  x: number;
  y: number;
}

export interface PhoneTapDef { rel: number }

export interface PhoneHighlightDef {
  relIn: number;
  relOut?: number;
  x: number; y: number; w: number; h: number;
  label?: string;
  labelSide?: "top" | "bottom" | "left" | "right";
  color?: string;
  radius?: number;
}

export interface PhoneCalloutDef {
  relIn: number;
  relOut?: number;
  tipX: number; tipY: number;
  label: string;
  sublabel?: string;
  offsetX?: number;
  offsetY?: number;
  color?: string;
}

interface Props {
  frameIn: number;
  frameOut: number;
  videoSrc: string;
  /** Composición frames a saltar al inicio del video (30fps) */
  startFrom?: number;
  cameraKeyframes: PhoneCamKF[];
  tapKeyframes: PhoneTapKF[];
  taps?: PhoneTapDef[];
  highlights?: PhoneHighlightDef[];
  callouts?: PhoneCalloutDef[];
  playbackRate?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DynamicPhoneMockup({
  frameIn, frameOut,
  videoSrc,
  startFrom = 0,
  cameraKeyframes,
  tapKeyframes,
  taps = [], highlights = [], callouts = [],
  playbackRate = 1,
}: Props) {
  const frame = useCurrentFrame();
  const rel   = frame - frameIn;

  // Entry animation
  const entryOpacity = fadeIn(frame, frameIn, 16);
  const entryScale   = interpolate(rel, [0, 24], [0.92, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1), ...clamp,
  });

  // ── Camera ────────────────────────────────────────────────────────────────
  const camTs = cameraKeyframes.map(k => k.rel);
  const focusX = interpolate(rel, camTs, cameraKeyframes.map(k => k.focusX), { easing: EASE_CAM, ...clamp });
  const focusY = interpolate(rel, camTs, cameraKeyframes.map(k => k.focusY), { easing: EASE_CAM, ...clamp });
  const camS   = interpolate(rel, camTs, cameraKeyframes.map(k => k.scale),  { easing: EASE_CAM, ...clamp });

  const tx = (0.5 - focusX) * PHONE_W        * (camS - 1) / camS;
  const ty = (0.5 - focusY) * PHONE_CONTENT_H * (camS - 1) / camS;

  // ── Tap cursor ────────────────────────────────────────────────────────────
  const tapTs = tapKeyframes.map(k => k.rel);
  const tapFirst = tapTs[0];
  const tapLast  = tapTs[tapTs.length - 1];

  const tapCX = interpolate(rel, tapTs, tapKeyframes.map(k => k.x), { easing: EASE_CUR, ...clamp });
  const tapCY = interpolate(rel, tapTs, tapKeyframes.map(k => k.y), { easing: EASE_CUR, ...clamp });

  // Viewport position of tap cursor
  const tapVX = (tapCX - focusX * PHONE_W)        * camS + PHONE_W        / 2;
  const tapVY = (tapCY - focusY * PHONE_CONTENT_H) * camS + PHONE_CONTENT_H / 2;

  const tapOpacity = interpolate(
    rel,
    [tapFirst, tapFirst + 8, tapLast, tapLast + 16],
    [0, 1, 1, 0],
    clamp,
  );

  // Tap animation (ripple on each tap)
  const activeTap = taps.find(t => rel >= t.rel && rel < t.rel + 28);
  const tapProg   = activeTap ? interpolate(rel, [activeTap.rel, activeTap.rel + 28], [0, 1], clamp) : 0;
  const tapScaleFactor = activeTap
    ? interpolate(rel, [activeTap.rel, activeTap.rel + 8, activeTap.rel + 20], [1, 0.70, 1], clamp)
    : 1;

  // Pulse for idle (not tapping) — subtle breathing
  const idlePulse = activeTap ? 1 : interpolate(
    rel % 40,
    [0, 20, 40],
    [1, 1.12, 1],
    { easing: Easing.bezier(0.45, 0, 0.55, 1), ...clamp }
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      width: PHONE_W,
      height: PHONE_H,
      borderRadius: RADIUS,
      border: `${BORDER}px solid rgba(196,181,253,0.8)`,
      background: "#0E0B18",
      boxShadow: [
        "0 48px 120px rgba(152,78,253,0.28)",
        "0 16px 40px rgba(0,0,0,0.22)",
        "inset 0 1px 0 rgba(255,255,255,0.12)",
      ].join(", "),
      overflow: "hidden",
      position: "relative",
      scale: String(entryScale),
      opacity: entryOpacity,
      transformOrigin: "center bottom",
    }}>

      {/* ── Side buttons ── */}
      <div style={{ position: "absolute", right: -BORDER - 3, top: 130, width: 4, height: 72, background: "rgba(196,181,253,0.4)", borderRadius: "0 3px 3px 0" }} />
      <div style={{ position: "absolute", left: -BORDER - 3, top: 110, width: 4, height: 44, background: "rgba(196,181,253,0.4)", borderRadius: "3px 0 0 3px" }} />
      <div style={{ position: "absolute", left: -BORDER - 3, top: 166, width: 4, height: 44, background: "rgba(196,181,253,0.4)", borderRadius: "3px 0 0 3px" }} />

      {/* ── Dynamic island ── */}
      <div style={{
        position: "absolute", top: 16, left: "50%",
        transform: "translateX(-50%)",
        width: NOTCH_W, height: NOTCH_H,
        background: "#0a0a0a",
        borderRadius: 999, zIndex: 20,
        boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
      }} />

      {/* ── Screen content ── */}
      <div style={{
        position: "absolute", inset: 0,
        paddingTop: PADDING_T,
        overflow: "hidden",
        background: "#1a1a2e",
      }}>
        {/* Camera-transformed layer */}
        <div style={{
          width: "100%", height: "100%",
          transform: `scale(${camS}) translate(${tx}px, ${ty}px)`,
          transformOrigin: "center center",
        }}>
          {/* Video content */}
          <Sequence from={frameIn - startFrom} layout="none">
            <OffthreadVideo
              src={staticFile(videoSrc)}
              startFrom={startFrom}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
              playbackRate={playbackRate}
              muted
            />
          </Sequence>

          {/* Highlights in content space */}
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

          {/* Callouts in content space */}
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

        {/* ── Tap cursor (outside camera, at computed viewport pos) ── */}
        {tapOpacity > 0 && (
          <div style={{
            position: "absolute",
            left: tapVX,
            top: tapVY,
            transform: `translate(-14px, -14px) scale(${tapScaleFactor * idlePulse})`,
            transformOrigin: "14px 14px",
            pointerEvents: "none",
            opacity: tapOpacity,
            zIndex: 999,
          }}>
            {/* Outer ripple */}
            {activeTap && tapProg > 0 && (
              <div style={{
                position: "absolute",
                left: -14, top: -14,
                width: 56, height: 56,
                borderRadius: "50%",
                border: "2px solid rgba(152,78,253,0.6)",
                scale: String(1 + tapProg * 2.2),
                opacity: (1 - tapProg) * 0.8,
              }} />
            )}
            {/* Inner ripple */}
            {activeTap && tapProg > 0.15 && (
              <div style={{
                position: "absolute",
                left: -8, top: -8,
                width: 44, height: 44,
                borderRadius: "50%",
                border: "1.5px solid rgba(152,78,253,0.4)",
                scale: String(1 + (tapProg - 0.15) * 1.6),
                opacity: (0.6 - tapProg * 0.6),
              }} />
            )}
            {/* Tap indicator circle */}
            <div style={{
              width: 28, height: 28,
              borderRadius: "50%",
              background: "rgba(152,78,253,0.35)",
              border: "2px solid rgba(255,255,255,0.9)",
              boxShadow: "0 0 12px rgba(152,78,253,0.6), 0 2px 8px rgba(0,0,0,0.4)",
            }} />
          </div>
        )}
      </div>

      {/* ── Glare overlay ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: "35%",
        background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)",
        pointerEvents: "none",
        borderRadius: `${RADIUS}px ${RADIUS}px 0 0`,
        zIndex: 15,
      }} />

      {/* ── Home bar ── */}
      <div style={{
        position: "absolute", bottom: 12, left: "50%",
        transform: "translateX(-50%)",
        width: 130, height: 5,
        background: "rgba(255,255,255,0.3)",
        borderRadius: 999, zIndex: 20,
      }} />
    </div>
  );
}
