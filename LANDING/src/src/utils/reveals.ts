import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Avoid noisy console warnings when a selector
// doesn't match any element (safe no-op in our case).
gsap.config({ nullTargetWarn: false });

/**
 * Global Reveal System
 * Handles elements with [data-sy-reveal] attribute by adding .is-in class
 * when they enter the viewport.
 */
const initReveals = () => {
    // Only run in client
    if (typeof window === "undefined") return;

    const reveals = document.querySelectorAll('[data-sy-reveal]');
    reveals.forEach((el) => {
        // Skip manually controlled reveals
        if (el.getAttribute("data-sy-reveal") === "manual") return;

        ScrollTrigger.create({
            trigger: el,
            start: "top 85%",
            onEnter: () => el.classList.add("is-in"),
            once: true,
        });
    });
};

/**
 * Manual Reveal 
 * Used by components like RectReveal to trigger specific animations
 */
export const manualRevealIn = (el: HTMLElement) => {
    // Default manual reveal animation (fade up)
    gsap.fromTo(
        el,
        { opacity: 0, y: 30 },
        {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: "power2.out",
            overwrite: "auto"
        }
    );
};

// Initialize on client side
if (typeof window !== "undefined") {
    // Run on load to ensure DOM is ready
    window.addEventListener("load", () => {
        initReveals();
        ScrollTrigger.refresh();
    });
    
    // Also try to run immediately in case we are already loaded or in SPA navigation
    initReveals();
}
