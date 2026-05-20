import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLanguage } from "../../contexts/LanguageContext";
import "./AboutSection.css";

gsap.registerPlugin(ScrollTrigger);

export default function AboutSection() {
  const sectionRef = useRef(null);
  const carouselRef = useRef(null);
  const { t } = useLanguage();

  const title = t("about.title");
  const sectionLabel = t("about.label");

  const award = t("about.award");
  const awardBadge = t("about.awardBadge");
  const awardYear = t("about.awardYear");

  const slides = [
    {
      id: "vision",
      label: t("about.slides.vision.label"),
      text: t("about.slides.vision.text"),
    },
    {
      id: "mission",
      label: t("about.slides.mission.label"),
      text: t("about.slides.mission.text"),
    },
    {
      id: "values",
      label: t("about.slides.values.label"),
      text: t("about.slides.values.text"),
    },
  ];

  const description = t("about.subtitle");

  const timelineItems = [
    {
      title: t("about.timeline.1.title"),
      text: t("about.timeline.1.text"),
    },
    {
      title: t("about.timeline.2.title"),
      text: t("about.timeline.2.text"),
    },
    {
      title: t("about.timeline.3.title"),
      text: t("about.timeline.3.text"),
    },
    {
      title: t("about.timeline.4.title"),
      text: t("about.timeline.4.text"),
    },
  ];

  useEffect(() => {
    let ctx = gsap.context(() => {
      // Intervalo del carrusel Mision/Vision/Valores
      const carousel = carouselRef.current;
      let intervalId;
      if (carousel) {
        const slideEls = carousel.querySelectorAll(".mission-slide");
        let current = 0;
        intervalId = setInterval(() => {
          if (!slideEls.length) return;
          slideEls[current].classList.remove("active");
          current = (current + 1) % slideEls.length;
          slideEls[current].classList.add("active");
        }, 5000);
      }

      // Lógica de ScrollTrigger para el stepper
      const items = gsap.utils.toArray(".step-item");
      if (items.length > 0) {
        let mm = gsap.matchMedia();

        // En pantallas grandes pineamos y el porcentaje de scroll determina qué step está activo
        mm.add("(min-width: 768px)", () => {
          ScrollTrigger.create({
            trigger: sectionRef.current,
            start: "top top",
            end: () =>
              `+=${window.innerHeight * (window.innerWidth < 1024 ? 2.5 : 3)}`,
            pin: true,
            scrub: true,
            onUpdate: (self) => {
              const total = items.length;
              const index = Math.min(
                Math.floor(self.progress * total),
                total - 1,
              );
              items.forEach((item, i) => {
                item.classList.toggle("is-active", i === index);
              });
            },
          });
        });

        // En responsive móvil no se hace pin
        mm.add("(max-width: 767px)", () => {
          ScrollTrigger.create({
            trigger: sectionRef.current,
            start: "top center",
            end: "bottom center",
            pin: false,
            scrub: true,
            onUpdate: (self) => {
              const total = items.length;
              const index = Math.min(
                Math.floor(self.progress * total),
                total - 1,
              );
              items.forEach((item, i) => {
                item.classList.toggle("is-active", i === index);
              });
            },
          });
        });
      }

      return () => {
        clearInterval(intervalId);
      };
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      className="sy-about dark:bg-slate-950 dark:text-gray-100 transition-colors duration-300"
      id="companyValues"
      ref={sectionRef}
    >
      <div className="sy-about-container">
        <div className="editorial-grid">
          {/* Columna Izquierda: Información Editorial */}
          <div className="content-column">
            <div className="section-label">
              <span className="label-line"></span>
              <span className="label-text">{sectionLabel}</span>
            </div>

            <h2
              className="editorial-title font-sans"
              dangerouslySetInnerHTML={{ __html: title }}
            />

            {description && (
              <p
                className="editorial-subtitle font-sans"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}

            {/* Sello de reconocimiento */}
            <div className="award-seal">
              <div className="seal-badge">
                <svg
                  className="seal-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
                </svg>
                <span className="seal-text">{awardBadge}</span>
              </div>
              <div className="award-info">
                <h3
                  className="award-name"
                  dangerouslySetInnerHTML={{ __html: award }}
                />
                <span className="award-year font-sans">{awardYear}</span>
              </div>
            </div>

            {/* Carrusel cíclico */}
            <div
              className="mission-carousel"
              id="mission-carousel"
              ref={carouselRef}
            >
              {slides.map((slide, i) => (
                <div
                  key={slide.id}
                  className={`mission-slide ${i === 0 ? "active" : ""}`}
                  data-slide={slide.id}
                >
                  <h3 className="mission-label">{slide.label}</h3>
                  <p className="mission-text">{slide.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Columna Derecha: Línea de tiempo / Stepper animado al scroll */}
          <div className="stepper-column">
            <div className="stepper-wrapper">
              <div className="items-wrapper">
                <div className="items">
                  {timelineItems.map((item, i) => (
                    <div
                      key={i}
                      className={`step-item ${i === 0 ? "is-active" : ""}`}
                    >
                      <div className="item-inner">
                        <h3 className="step-title font-sans">{item.title}</h3>
                        <p className="step-text font-sans">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
