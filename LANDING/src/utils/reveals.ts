import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Avoid noisy console warnings when a selector
// doesn't match any element (safe no-op in our case).
gsap.config({ nullTargetWarn: false });

function prefersReducedMotion(): boolean {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Marks [data-sy-reveal] elements as visible when they enter the viewport.
 * Uses CSS transitions from reveals.css (fade / lines / words).
 */
const initReveals = () => {
    if (typeof window === "undefined") return;

    if (prefersReducedMotion()) {
        document.querySelectorAll("[data-sy-reveal]").forEach((el) => {
            if (el.getAttribute("data-sy-reveal") === "manual") return;
            el.classList.add("is-in");
        });
        return;
    }

    const reveals = document.querySelectorAll("[data-sy-reveal]");
    reveals.forEach((el) => {
        if (el.getAttribute("data-sy-reveal") === "manual") return;

        ScrollTrigger.create({
            trigger: el,
            start: "top 86%",
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
    if (typeof window !== "undefined" && prefersReducedMotion()) {
        gsap.set(el, { opacity: 1, y: 0 });
        return;
    }
    gsap.fromTo(
        el,
        { opacity: 0, y: 28 },
        {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: "power3.out",
            overwrite: "auto",
        },
    );
};

const runInit = () => {
    initReveals();
    ScrollTrigger.refresh();
};

// Initialize on client
if (typeof window !== "undefined") {
    window.addEventListener("load", runInit);
    // First paint (DOM ready)
    runInit();

    document.addEventListener("astro:page-load", runInit);
}
