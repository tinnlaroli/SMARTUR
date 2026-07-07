// Type augmentation for custom runtime properties attached to `window` by
// inline scripts (scroll-driven animation state shared across components
// like GL.astro, ImageMarquee.astro and TextMarquee.astro).
export {};

declare global {
  interface Window {
    scrollVelocity?: number;
    scrollDirection?: number;
    scrollCurrent?: number;
    scrollStickyOffsets?: Array<[number, number, number]>;
  }
}
