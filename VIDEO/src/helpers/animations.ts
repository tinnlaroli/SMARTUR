import { interpolate, spring } from "remotion";

export const SPRING_BOUNCE = { damping: 12, stiffness: 200, mass: 0.8 };
export const SPRING_SMOOTH = { damping: 22, stiffness: 150 };
export const SPRING_SNAPPY = { damping: 14, stiffness: 220 };

export const slideUp = (frame: number, start: number, dist = 60, dur = 20) =>
  interpolate(frame, [start, start + dur], [dist, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const slideDown = (frame: number, start: number, dist = 60, dur = 20) =>
  interpolate(frame, [start, start + dur], [-dist, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const fadeIn = (frame: number, start: number, dur = 15) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const fadeOut = (frame: number, end: number, dur = 10) =>
  interpolate(frame, [end - dur, end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const scaleSpring = (
  frame: number,
  start: number,
  fps: number,
  from = 0.85
) => {
  const s = spring({ frame: frame - start, fps, config: SPRING_BOUNCE });
  return from + (1 - from) * s;
};
