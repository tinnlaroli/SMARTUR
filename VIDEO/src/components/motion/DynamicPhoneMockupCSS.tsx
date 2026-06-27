/**
 * DynamicPhoneMockupCSS — Phone shell identical to DynamicPhoneMockup
 * but renders React children instead of OffthreadVideo.
 *
 * Content area: PHONE_W × PHONE_CONTENT_H = 460 × 942 px
 * Piecewise easing: zoom-in → expo-out, pull-back → ease-in, pan → smooth.
 * 3D entry animation: perspective rotateX(4deg) → 0.
 */
import React from "react";
import { interpolate, useCurrentFrame, Easing } from "remotion";
import { HighlightRing } from "./HighlightRing";
import { Callout } from "./Callout";
import { fadeIn } from "../../helpers/animations";

export const PHONE_W         = 460;
const PHONE_RATIO             = 2.16;
export const PHONE_H          = Math.round(PHONE_W * PHONE_RATIO); // 994
const PADDING_T               = 52;
export const PHONE_CONTENT_H  = PHONE_H - PADDING_T;               // 942

const RADIUS   = 48;
const BORDER   = 5;
const NOTCH_W  = 100;
const NOTCH_H  = 24;

// ── Easings ──────────────────────────────────────────────────────────────────
const EASE_CAM_IN   = Easing.bezier(0.16, 1, 0.3, 1);   // zoom in  → expo-out
const EASE_CAM_PAN  = Easing.bezier(0.45, 0, 0.55, 1);  // pan      → smooth
const EASE_CAM_BACK = Easing.bezier(0.55, 0, 1, 0.45);  // pull-back → ease-in
const EASE_CUR      = Easing.bezier(0.4, 0, 0.2, 1);
const clamp         = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// ── Types (re-exported so callers don't need DynamicPhoneMockup) ─────────────

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
  cameraKeyframes: PhoneCamKF[];
  tapKeyframes: PhoneTapKF[];
  taps?: PhoneTapDef[];
  highlights?: PhoneHighlightDef[];
  callouts?: PhoneCalloutDef[];
  children: React.ReactNode;
}

// ── Piecewise camera interpolation ───────────────────────────────────────────

function pickEasing(scKFs: { rel: number; val: number }[], idx: number) {
  if (idx === 0) return EASE_CAM_PAN;
  const prev = scKFs[idx - 1].val;
  const curr = scKFs[idx].val;
  if (curr > prev + 0.15) return EASE_CAM_IN;
  if (curr < prev - 0.15) return EASE_CAM_BACK;
  return EASE_CAM_PAN;
}

function evalCam(
  t: number,
  kfs: { rel: number; val: number }[],
  scKFs: { rel: number; val: number }[],
): number {
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

// ── Component ─────────────────────────────────────────────────────────────────

export function DynamicPhoneMockupCSS({
  frameIn,
  cameraKeyframes,
  tapKeyframes,
  taps = [],
  highlights = [],
  callouts = [],
  children,
}: Props) {
  const frame = useCurrentFrame();
  const rel   = frame - frameIn;

  // Entry animation — dramatic 3D drop-in
  const entryOpacity = fadeIn(frame, frameIn, 16);
  const entryScale   = interpolate(rel, [0, 28], [0.88, 1], { easing: EASE_CAM_IN, ...clamp });
  const entryRotateX = interpolate(rel, [0, 24], [10, 0], { easing: EASE_CAM_IN, ...clamp });
  const entryRotateY = interpolate(rel, [0, 22], [-4, 0],  { easing: EASE_CAM_IN, ...clamp });

  // Gentle float breathing (sin wave, ±5px, 100-frame cycle)
  const floatY = rel > 28 ? Math.sin(rel * 0.063) * 5 : 0;

  // ── Camera (piecewise per-segment) ────────────────────────────────────────
  const fxKFs = cameraKeyframes.map(k => ({ rel: k.rel, val: k.focusX }));
  const fyKFs = cameraKeyframes.map(k => ({ rel: k.rel, val: k.focusY }));
  const scKFs = cameraKeyframes.map(k => ({ rel: k.rel, val: k.scale  }));

  const focusX = evalCam(rel, fxKFs, scKFs);
  const focusY = evalCam(rel, fyKFs, scKFs);
  const camS   = evalCam(rel, scKFs, scKFs);

  const tx = (0.5 - focusX) * PHONE_W         * (camS - 1) / camS;
  const ty = (0.5 - focusY) * PHONE_CONTENT_H  * (camS - 1) / camS;

  // ── Tap cursor ────────────────────────────────────────────────────────────
  const tapTs    = tapKeyframes.map(k => k.rel);
  const tapFirst = tapTs[0];
  const tapLast  = tapTs[tapTs.length - 1];

  const tapCX = interpolate(rel, tapTs, tapKeyframes.map(k => k.x), { easing: EASE_CUR, ...clamp });
  const tapCY = interpolate(rel, tapTs, tapKeyframes.map(k => k.y), { easing: EASE_CUR, ...clamp });

  // Viewport position of tap cursor (outside camera transform)
  const tapVX = (tapCX - focusX * PHONE_W)         * camS + PHONE_W         / 2;
  const tapVY = (tapCY - focusY * PHONE_CONTENT_H)  * camS + PHONE_CONTENT_H / 2;

  // Guard: only show tap cursor when keyframe range is long enough to be meaningful
  const tapOpacity = (tapLast - tapFirst) > 20
    ? interpolate(
        rel,
        [tapFirst, tapFirst + 8, tapLast, tapLast + 16],
        [0, 1, 1, 0],
        clamp,
      )
    : 0;

  // Ripple on each tap
  const activeTap = taps.find(t => rel >= t.rel && rel < t.rel + 28);
  const tapProg   = activeTap
    ? interpolate(rel, [activeTap.rel, activeTap.rel + 28], [0, 1], clamp)
    : 0;
  const tapScaleFactor = activeTap
    ? interpolate(rel, [activeTap.rel, activeTap.rel + 8, activeTap.rel + 20], [1, 0.70, 1], clamp)
    : 1;

  // Idle breathing pulse
  const idlePulse = activeTap ? 1 : interpolate(
    rel % 40,
    [0, 20, 40],
    [1, 1.12, 1],
    { easing: EASE_CAM_PAN, ...clamp },
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
      transform: `perspective(1200px) rotateX(${entryRotateX}deg) rotateY(${entryRotateY}deg) translateY(${floatY}px)`,
    }}>

      {/* ── Ambient glow pulse (exterior, doesn't clip) ── */}
      <div style={{
        position: "absolute",
        inset: -2 - Math.sin(rel * 0.055) * 3,
        borderRadius: RADIUS + 4,
        border: `1px solid rgba(152,78,253,${0.18 + Math.sin(rel * 0.055) * 0.08})`,
        pointerEvents: "none",
        zIndex: 0,
      }} />

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
        background: "#F9FAFB",
      }}>
        {/* Camera-transformed layer (children zoom with camera) */}
        <div style={{
          width: "100%", height: "100%",
          transform: `scale(${camS}) translate(${tx}px, ${ty}px)`,
          transformOrigin: "center center",
        }}>
          {children}

          {/* Highlights in content space (zoom with content) */}
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
            ) : null,
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
            ) : null,
          )}
        </div>

        {/* ── Tap cursor (OUTSIDE camera transform, at computed viewport pos) ── */}
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
                opacity: 0.6 - tapProg * 0.6,
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
        background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)",
        pointerEvents: "none",
        borderRadius: `${RADIUS}px ${RADIUS}px 0 0`,
        zIndex: 15,
      }} />

      {/* ── Home bar ── */}
      <div style={{
        position: "absolute", bottom: 12, left: "50%",
        transform: "translateX(-50%)",
        width: 130, height: 5,
        background: "rgba(0,0,0,0.18)",
        borderRadius: 999, zIndex: 20,
      }} />
    </div>
  );
}
