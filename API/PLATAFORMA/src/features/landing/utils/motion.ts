/** True when the user prefers reduced UI motion (WCAG / OS setting). */
export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Snappy “premium” easing — Apple/Stripe-ish */
export const easeOutExpo = 'expo.out';
export const easeOutSoft = 'power3.out';
