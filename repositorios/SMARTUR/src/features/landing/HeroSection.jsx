import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { initPhoneScene } from "../../assets/3D/phone";
import { ChevronDown } from "lucide-react";
import "./HeroSection.css"; // We will create this or use index.css

export default function HeroSection({ handleStartExperience }) {
  const heroRef = useRef(null);
  const phoneContainerRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);

  // Constants that were props in Astro
  const title = "IA que guía,<br/>turismo que une.";
  const subtitle =
    "Explora las Altas Montañas de Veracruz con rutas personalizadas por inteligencia artificial.";

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    let heroAnimated = false;

    const animateHero = () => {
      if (heroAnimated) return;
      heroAnimated = true;

      const titleEl = hero.querySelector(".hero-title");
      const subtitleEl = hero.querySelector(".hero-subtitle");
      const ctaEl = hero.querySelector(".hero-cta");
      const phoneContainer = phoneContainerRef.current;
      const shimmerEl = hero.querySelector(".hero-shimmer");
      const scrollIndicatorEl = hero.querySelector(".scroll-indicator");

      const isMobile = window.matchMedia("(max-width: 767px)").matches;

      // Initial states
      gsap.set([titleEl, subtitleEl, ctaEl], { opacity: 0 });
      if (phoneContainer) gsap.set(phoneContainer, { opacity: 0 });
      if (scrollIndicatorEl)
        gsap.set(scrollIndicatorEl, { opacity: 0, y: -20 });

      if (titleEl) gsap.set(titleEl, { y: 40 });
      if (subtitleEl) gsap.set(subtitleEl, { y: 30, filter: "blur(8px)" });
      if (ctaEl) gsap.set(ctaEl, { scale: 0.7 });

      if (phoneContainer) {
        if (!isMobile) {
          gsap.set(phoneContainer, { x: 80, scale: 0.92 });
        } else {
          gsap.set(phoneContainer, { y: 30 });
        }
      }

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => setIsRevealed(true),
      });

      // Background shimmer
      if (shimmerEl) {
        tl.to(
          shimmerEl,
          { opacity: 1, x: "200%", duration: 1.5, ease: "power2.inOut" },
          0,
        );
        tl.to(shimmerEl, { opacity: 0, duration: 0.5 }, 1.2);
      }

      // Title cascade
      if (titleEl) {
        if (isMobile) {
          tl.to(titleEl, { opacity: 1, y: 0, duration: 0.6 }, 0.1);
        } else {
          // Wrap words for cascade
          const text = titleEl.innerText;
          const wordsArr = text.split(/(\s+)/);
          titleEl.innerHTML = "";
          wordsArr.forEach((w) => {
            if (w.trim()) {
              const span = document.createElement("span");
              span.className = "hero-word inline-block";
              span.innerText = w;
              titleEl.appendChild(span);
            } else {
              titleEl.appendChild(document.createTextNode(w));
            }
          });

          const words = titleEl.querySelectorAll(".hero-word");
          gsap.set(words, { opacity: 0, y: 50, rotateX: 45 });
          tl.to(
            words,
            {
              opacity: 1,
              y: 0,
              rotateX: 0,
              duration: 0.8,
              stagger: 0.08,
              ease: "back.out(1.2)",
            },
            0.1,
          );
        }
      }

      // Subtitle
      if (subtitleEl) {
        tl.to(
          subtitleEl,
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 1 },
          0.5,
        );
      }

      // CTA
      if (ctaEl) {
        tl.to(
          ctaEl,
          { opacity: 1, scale: 1, duration: 1, ease: "elastic.out(1, 0.5)" },
          0.7,
        );
      }

      // 3D Phone
      if (phoneContainer) {
        tl.to(
          phoneContainer,
          {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: 1.2,
            ease: "back.out(1.5)",
          },
          0.3,
        );
      }

      // Scroll Indicator Fade In
      if (scrollIndicatorEl) {
        tl.to(
          scrollIndicatorEl,
          { opacity: 1, y: 0, duration: 1, ease: "power2.out" },
          1.5,
        );
      }
    };

    // Global listener for site load
    window.addEventListener("smartur:loaded", animateHero, { once: true });

    // Fallback if loader is bypassed
    if (!document.body.classList.contains("is-loading")) {
      setTimeout(animateHero, 1500); // 1.5s delay to simulate loading feel
    }

    // Initialize 3D on Desktop only
    if (
      window.matchMedia("(min-width: 768px)").matches &&
      phoneContainerRef.current
    ) {
      try {
        initPhoneScene(phoneContainerRef.current);
      } catch (e) {
        console.warn("3D Phone init failed:", e);
      }
    }

    return () => {
      window.removeEventListener("smartur:loaded", animateHero);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      id="hero"
      className={`sy-hero-home relative overflow-hidden bg-white min-h-[100dvh] flex flex-col justify-center ${isRevealed ? "hero-revealed" : ""}`}
    >
      {/* Background shimmer */}
      <div
        className="hero-shimmer absolute inset-0 z-0 pointer-events-none opacity-0 transform -translate-x-[100%]"
        style={{
          background:
            "linear-gradient(120deg, transparent 0%, rgba(152, 78, 253, 0.06) 30%, rgba(252, 71, 142, 0.08) 50%, rgba(77, 185, 202, 0.06) 70%, transparent 100%)",
        }}
      />

      <div className="u-container container mx-auto px-4 relative z-10 w-full">
        <div className="inner flex flex-col md:flex-row items-center justify-between gap-12 py-12 md:py-16">
          <div className="content flex-1 max-w-2xl z-20">
            <h1
              className="hero-title text-5xl md:text-7xl lg:text-8xl font-bold leading-tight text-gray-900 mb-6"
              dangerouslySetInnerHTML={{ __html: title }}
            />
            {subtitle && (
              <p className="hero-subtitle text-lg md:text-xl text-gray-600 max-w-lg mb-10 leading-relaxed">
                {subtitle}
              </p>
            )}

            <div className="hero-cta relative inline-block overflow-hidden">
              <button
                onClick={handleStartExperience}
                className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-[#ff4d8d] hover:bg-[#e03a75] text-white rounded-full font-bold text-xl transition-all duration-300 shadow-xl hover:scale-105 active:scale-95"
              >
                <span>Empezar aventura</span>
                <svg
                  className="w-5 h-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </button>
              <div className="cta-shimmer absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 pointer-events-none" />
            </div>
          </div>

          <div
            ref={phoneContainerRef}
            className="hero-video-wrap hidden md:flex flex-shrink-0 w-1/2 max-w-[700px] aspect-square relative z-0"
            style={{
              maskImage:
                "radial-gradient(ellipse 92% 92% at center, black 40%, rgba(0,0,0,0.95) 60%, rgba(0,0,0,0) 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 92% 92% at center, black 40%, rgba(0,0,0,0.95) 60%, rgba(0,0,0,0) 100%)",
            }}
          />
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        className="scroll-indicator absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer z-50"
        onClick={() => {
          const nextSection = document.getElementById("trustBar");
          if (nextSection) {
            nextSection.scrollIntoView({ behavior: "smooth" });
          }
        }}
      >
        <span className="font-['Outfit'] text-[11px] font-bold tracking-[0.2em] uppercase text-gray-400">
          Descubrir
        </span>
        <ChevronDown
          className="w-8 h-8 text-[#ff4d8d] animate-bounce"
          strokeWidth={2.5}
        />
      </div>
    </section>
  );
}
