import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
// @ts-ignore
import * as flubber from "flubber";
import smarturLogo from "../../../assets/landing/logo.png";
import "./SmartURLoader.css";
import { useLanguage } from "../../../contexts/LanguageContext";

interface SmartURLoaderProps {
  onFinished?: () => void;
  isReady?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * CONSTANTES GLOBALES
 * ═══════════════════════════════════════════════════════════════════════════
 * CX, CY  → Centro de rotación de los arcos dentro del SVG (viewBox 169.42×218.53).
 * SWEEP   → Barrido angular (grados) que cubre cada arco.
 * THICKNESS → Grosor del trazo de cada arco (usado en la función ringPath).
 * ═══════════════════════════════════════════════════════════════════════════ */
const CX = 50; // Centro X de rotación de los arcos (px dentro del viewBox)

/* ═══════════════════════════════════════════════════════════════════════════
 * ARCOS DE COLOR
 * ═══════════════════════════════════════════════════════════════════════════
 * Cada arco orbita alrededor de su centro de rotación (ox, oy).
 * - r        → Radio de la animación de entrada (offset desde el centro).
 * - color    → Color del trazo del arco mientras gira (fase de spinner).
 * - fill     → Color de relleno final del ícono tras el morph.
 * - startDeg → Ángulo inicial (grados) desde donde arranca el arco.
 * - ox, oy   → Centro de rotación del spinner (por defecto CX, CY).
 *              Si un arco está muy lejos del centro global, se le asigna
 *              su propio centro para que la órbita sea visible.
 * ═══════════════════════════════════════════════════════════════════════════ */
// @ts-ignore
const { interpolate: flubberInterpolate, separate } = flubber;

const ARCS = [
  { r: 29, color: "#f58220", fill: "#ff7d1f", startDeg: -180, ox: CX, oy: -10 }, // Naranja – órbita ~81px
  {
    r: 43,
    color: "#ff4d8d",
    fill: "#fc478e",
    startDeg: 120.5,
    ox: CX,
    oy: -10,
  }, // Rosa – órbita ~107px
  {
    r: 79,
    color: "#a3d14f",
    fill: "#9ccc44",
    startDeg: -209.7,
    ox: CX,
    oy: -20,
  }, // Verde – órbita ~135px
  { r: 90, color: "#914ef5", fill: "#984efd", startDeg: 82.9, ox: -50, oy: 10 }, // Púrpura – órbita ~195px
];

/* ═══════════════════════════════════════════════════════════════════════════
 * PATHS SVG DE ICONOS DESTINO (para el morph de aviones → iconos)
 * ═══════════════════════════════════════════════════════════════════════════
 * Cada grupo de paths corresponde a un ARCO (por índice):
 *   [0] MOUNTAIN  → Montaña (1 path)     – Representa turismo de naturaleza
 *   [1] PERSON    → Personas (5 paths)   – Representa usuarios/turistas
 *   [2] LEAF      → Hoja (1 path)         – Representa ecología/sustentabilidad
 *   [3] CIRCUIT   → Circuitos (3 paths)   – Representa tecnología/innovación
 *
 * Estos paths son las formas FINALES a las que se transforman los aviones
 * de papel mediante la librería Flubber.
 * ═══════════════════════════════════════════════════════════════════════════ */

// Montaña: silueta triangular con pico
// viewBox relativo: ≈ x:31–108, y:40–86
const MOUNTAIN_PATHS = [
  "M106.07,66.25a15.43,15.43,0,0,1,2.1-7.78l-19-17.91a6.92,6.92,0,0,0-9.49,0L58,60.93,31.58,85.77H96.7a16,16,0,0,1,14.07-8.38A15.51,15.51,0,0,1,106.07,66.25Z",
];

// Personas: grupo de 5 formas (2 cuerpos + 3 cabezas circulares)
// viewBox relativo: ≈ x:99–149, y:55–147
const PERSON_PATHS = [
  // Cuerpo pequeño (parte superior)
  "M133.31,97h2.19a13.63,13.63,0,0,1,13.63,13.63V129a0,0,0,0,1,0,0H119.68a0,0,0,0,1,0,0V110.61A13.63,13.63,0,0,1,133.31,97Z",
  // Cuerpo grande (parte inferior)
  "M109.31,103.8h1.48a17.75,17.75,0,0,1,17.75,17.75v25.53a0,0,0,0,1,0,0h-37a0,0,0,0,1,0,0V121.55A17.75,17.75,0,0,1,109.31,103.8Z",
  // Cabeza derecha-superior (círculo r≈10.82)
  "M110.59,66.03a10.82,10.82,0,1,1,21.64,0a10.82,10.82,0,1,1,-21.64,0Z",
  // Cabeza izquierda-inferior (círculo r≈11.41)
  "M99.18,93.22a11.41,11.41,0,1,1,22.82,0a11.41,11.41,0,1,1,-22.82,0Z",
  // Cabeza derecha-media (círculo r≈10.03)
  "M124.38,88.7a10.03,10.03,0,1,1,20.06,0a10.03,10.03,0,1,1,-20.06,0Z",
];

// Hoja: forma orgánica representando sustentabilidad
// viewBox relativo: ≈ x:10–43, y:39–80
const LEAF_PATHS = [
  "M28.68,39.1c12.59,7.5,18,20.51,14.43,30.06-2.35,6.22-8,9.47-10.63,10.78a17.43,17.43,0,0,1-12-.28c-7-3-11.39-11.56-10.31-21a20.92,20.92,0,0,1,6.41,1.26,25.89,25.89,0,0,1,6,3.34,63.78,63.78,0,0,1,7,5.44c-1.4-1.53-4.1-3.91-5.61-7.69a21.24,21.24,0,0,1-.8-13.22A17.82,17.82,0,0,1,28.68,39.1Z",
];

// Circuitos: 3 formas tipo chip/nodo con líneas verticales
// viewBox relativo: ≈ x:17–63, y:94–172
const CIRCUIT_PATHS = [
  // Nodo derecho: círculo con línea vertical + terminación en ángulo
  "M59.34,110.48a8.82,8.82,0,1,0-4.91,0v26.22l4.07,2.83V156.3L44.2,169l3.09,3.82,16.12-14.67V136.25l-4.07-3.34Zm-2.51-4.65a3.8,3.8,0,1,1,3.8-3.8A3.8,3.8,0,0,1,56.83,105.83Z",
  // Nodo izquierdo: círculo con línea vertical corta
  "M28.73,94.48a8.82,8.82,0,0,0-2.23,17.35v13.93l-9.87,8.9,2.73,3.73,12.05-10.7v-16a8.82,8.82,0,0,0-2.68-17.22Zm0,12.62a3.8,3.8,0,1,1,3.8-3.8A3.8,3.8,0,0,1,28.73,107.1Z",
  // Nodo central: círculo más pequeño con línea vertical
  "M43.13,117.51a7.58,7.58,0,0,0-2.46,14.75v13.07l-9.31,7.52,3,3.89,11.21-9.57V132.26a7.58,7.58,0,0,0-2.45-14.75Zm0,10.84a3.27,3.27,0,1,1,3.26-3.26A3.26,3.26,0,0,1,43.13,128.35Z",
];

// Arreglo maestro que agrupa todos los iconos por índice de arco
const ALL_ICON_PATHS = [
  MOUNTAIN_PATHS, // [0] → arco naranja
  PERSON_PATHS, // [1] → arco rosa
  LEAF_PATHS, // [2] → arco verde
  CIRCUIT_PATHS, // [3] → arco púrpura
];

/* ═══════════════════════════════════════════════════════════════════════════
 * PATHS DEL PIN / MARCADOR (carcasa del logo)
 * ═══════════════════════════════════════════════════════════════════════════
 * Estos definen las piezas del marcador de mapa de SMARTUR.
 * Se dibujan con un efecto "stroke-draw" (trazo progresivo) y después
 * se rellenan con su color final.
 *
 * Colores usados:
 *   #4db9ca → Cyan/turquesa (piezas principales del marcador)
 *   #984efd → Púrpura (laterales del marcador y detalle de hoja/tallo)
 *   #fc478e → Rosa (cuerpo inferior / cola del marcador)
 * ═══════════════════════════════════════════════════════════════════════════ */
const PIN_PATHS = [
  {
    // Corona superior del pin (arco de arriba)
    d: "M84.71,0h-.18A84.48,84.48,0,0,0,30,20L45.41,35.58a63.3,63.3,0,0,1,39-13.39h0c14.69,0,29.14,5.73,39.91,14.1l15.68-15.77C125.33,8.19,105.44,0,84.71,0Z",
    color: "#4db9ca",
  },
  {
    // Lateral izquierdo superior del pin
    d: "M45.41,35.58,30,20A84.17,84.17,0,0,0,0,84.48c0,.45,0,.89,0,1.33H20.83A63.49,63.49,0,0,1,45.41,35.58Z",
    color: "#984efd",
  },
  {
    // Lateral derecho superior del pin
    d: "M140.05,20.52,124.37,36.29A63.5,63.5,0,0,1,148,84.93h21.38v-.45A84.18,84.18,0,0,0,140.05,20.52Z",
    color: "#984efd",
  },
  {
    // Lateral izquierdo medio del pin
    d: "M20.83,85.81H0c.33,21.86,8.91,39.75,23.11,56.69l22.47,29,13.89-14V137.36C37.15,129.31,20.83,111.23,20.83,85.81Z",
    color: "#4db9ca",
  },
  {
    // Cuerpo interior izquierdo del pin
    d: "M87.58,120.88a21.77,21.77,0,0,1,10-18.33,16.08,16.08,0,0,1-.9-16.78H20.78c0,.08,0,.17,0,.25a63.61,63.61,0,0,0,63.61,63.62c1.08,0,2.14,0,3.2-.09Z",
    color: "#4db9ca",
  },
  {
    // Cuerpo derecho + cola inferior del pin (pieza más grande)
    d: "M148,84.93c0,.29,0,.58,0,.88a58.17,58.17,0,0,1-6,26.69C132.41,131.34,112.14,142,87.12,142a81.82,81.82,0,0,1-27.63-4.68V157.5l-13.89,14L52.94,181l27.4,35.39a5.52,5.52,0,0,0,8.74,0L116.48,181l29.81-38.5c3.56-4.88,6.94-9.81,10-14.88,7.7-12.91,13.06-26.7,13.16-42.69Z",
    color: "#fc478e",
  },
  {
    // Detalle decorativo: tallo de la hoja (forma de enredadera)
    d: "M30.13,61.83c-.76,1.17-1.41,2.2-1.92,3a.54.54,0,0,1-.81.12,14.8,14.8,0,0,1-4.91-12.5L13.87,59.1a15.13,15.13,0,0,1,5.75,2.72,15.87,15.87,0,0,1,5.54,8.73c.45,1.78.44,3.62.42,7.32,0,3.22-.29,6.09-.45,7.9h3.92a36.37,36.37,0,0,1,0-7.07,38,38,0,0,1,1.58-7.82A31.52,31.52,0,0,1,33,64.64c1.23-2.33,2.41-3.6,1.88-4.6a2.21,2.21,0,0,0-2.3-.83C31.73,59.38,31.31,60,30.13,61.83Z",
    color: "#984efd",
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
 * AVIONES DE PAPEL PRE-CALCULADOS
 * ═══════════════════════════════════════════════════════════════════════════
 * Cada string es el path SVG de un avión de papel colocado en la posición
 * orbital correspondiente a su arco. Estos son las formas INICIALES que
 * se morphean (vía Flubber) hacia los iconos destino.
 *
 *   [0] → Avión naranja  (centro ≈ 46,67)  – Se transforma en la montaña
 *   [1] → Avión rosa     (centro ≈ 123,70) – Se transforma en las personas
 *   [2] → Avión verde    (centro ≈ 30,112) – Se transforma en la hoja
 *   [3] → Avión púrpura  (centro ≈ 93,158) – Se transforma en los circuitos
 *
 * Cada avión tiene forma de origami con "cola" y "alas" definidas
 * por curvas Bézier y líneas rectas:
 *   M = mover a, L = línea a, C = curva Bézier cúbica, Z = cerrar path.
 * ═══════════════════════════════════════════════════════════════════════════ */
const PRECALCULATED_PLANES = [
  // Avión 0 (naranja): escalado ×0.75, centro ≈ (46,71)
  "M56.69,60.06 L35.69,74.51 C35.30,74.77,35.38,75.37,35.82,75.53 L39.90,76.99 L53.47,64.58 L42.75,78.01 L42.75,78.01 L43.80,82.03 C43.88,82.30,44.22,82.39,44.42,82.18 L46.84,79.47 L50.25,80.68 C50.56,80.80,50.90,80.62,51.00,80.30 L56.97,60.27 C57.02,60.11,56.83,59.97,56.69,60.06 Z",
  // Avión 1 (rosa): escalado ×0.75, centro ≈ (119,72)
  "M121.87,85.05 L110.55,62.23 C110.34,61.80,110.70,61.32,111.16,61.39 L115.44,62.11 L121.26,79.55 L118.42,62.60 L121.30,59.59 C121.50,59.39,121.84,59.49,121.91,59.76 L122.71,63.31 L126.28,63.91 C126.60,63.96,126.82,64.27,126.75,64.60 L122.22,85.01 C122.18,85.18,121.95,85.21,121.87,85.05 Z",
  // Avión 2 (verde): escalado ×0.75, centro ≈ (30,112)
  "M26.97,99.42 L22.90,124.57 C22.83,125.04,23.32,125.40,23.74,125.19 L27.61,123.24 L28.01,104.86 L30.31,121.89 L33.95,123.91 C34.20,124.05,34.51,123.85,34.49,123.57 L34.20,119.94 L37.43,118.32 C37.73,118.17,37.83,117.81,37.67,117.51 L27.31,99.36 C27.22,99.20,27.00,99.25,26.97,99.42 Z",
  // Avión 3 (púrpura): escalado ×0.75, centro ≈ (96,156)
  "M83.05,150.96 L104.71,164.38 C105.12,164.63,105.63,164.32,105.60,163.86 L105.29,159.53 L88.48,152.10 L105.08,156.52 L108.34,153.93 C108.57,153.75,108.51,153.40,108.24,153.31 L104.78,152.18 L104.52,148.57 C104.49,148.24,104.20,148.00,103.87,148.04 L83.12,150.63 C82.96,150.65,82.91,150.87,83.05,150.96 Z",
];

/* ═══════════════════════════════════════════════════════════════════════════
 * COMPONENTE PRINCIPAL: SmartURLoader
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Loader animado de la marca SMARTUR. Secuencia de animación:
 *
 *   1. ENTRADA (0s–1.2s):
 *      Cuatro aviones de papel aparecen desde el centro, cada uno en su
 *      órbita (definida por ARCS[i].r) y empiezan a girar infinitamente.
 *
 *   2. CARGA (0s–2.5s):
 *      Se muestra un porcentaje simulado 0%→85% con ease "power2.out".
 *      Si la página aún no ha cargado al llegar a 85%, avanza lentamente
 *      hasta 99% esperando el evento `window.load`.
 *
 *   3. SECUENCIA DE SALIDA (cuando la página está lista):
 *      a. ESTACIONAR (0s–1s):    Los spinners se detienen suavemente.
 *      b. MORPH (1s–1.8s):       Aviones → iconos (Flubber).
 *      c. PIN DRAW (1.5s–2.2s):  Se dibuja el marcador de mapa con
 *                                 efecto stroke-draw + relleno.
 *      d. ENSAMBLE (~2.2s):      El porcentaje llega a 100%, el SVG
 *                                 desaparece y el logo oficial aparece
 *                                 con efecto "flash-bang" (scale 2.5→1).
 *      e. FADE OUT (~3.4s):      El logo se reduce (scale 0.8) y se
 *                                 desvanece; se ejecuta onFinished().
 *
 * Props:
 *   onFinished → Callback que se ejecuta al terminar toda la secuencia.
 *   isReady    → Señal externa para terminar la carga.
 * ═══════════════════════════════════════════════════════════════════════════ */
export default function SmartURLoader({ onFinished, isReady = false }: SmartURLoaderProps = {}) {
  const { t } = useLanguage();
  // Referencias DOM para animaciones GSAP
  const containerRef = useRef<HTMLDivElement>(null); // Contenedor principal (overlay)
  const percentRef = useRef<HTMLDivElement>(null); // Elemento del porcentaje de carga
  const logoRef = useRef<HTMLImageElement>(null); // Imagen del logo oficial
  const svgRef = useRef<SVGSVGElement>(null); // SVG que contiene los arcos y el pin
  const isReadyRef = useRef(isReady);
  const exitTriggered = useRef(false);
  const onFinishedRef = useRef(onFinished);

  // Sincronizar el ref con el prop para que el closure de useGSAP lo vea
  isReadyRef.current = isReady;
  onFinishedRef.current = onFinished;

  useGSAP(
    () => {
      const root = containerRef.current;
      if (!root) return;

      // Inicializa posición del logo centrado con GSAP para evitar saltos
      if (logoRef.current) {
        gsap.set(logoRef.current, { xPercent: -50, yPercent: -50 });
      }

      // Seleccionar elementos del DOM para animar
      const morphEls = root.querySelectorAll(".morph-path");
      const spinnerGs = root.querySelectorAll(".arc-spinner");
      const pinEls = root.querySelectorAll(".pin-path");

      /* ─── Rastreo del progreso de carga ──────────────────────────── */
      const progressObj = { value: 0 };
      let pageLoaded = false;

      if (document.readyState === "complete") {
        pageLoaded = true;
      } else {
        const onLoad = () => {
          pageLoaded = true;
        };
        window.addEventListener("load", onLoad, { once: true });
      }

      /* ─── Animación de entrada + spinners ─── */
      const spinTweens: gsap.core.Tween[] = [];

      spinnerGs.forEach((spinner, i) => {
        const el = spinner as SVGGElement | HTMLElement;
        const rad = (ARCS[i].startDeg * Math.PI) / 180;
        const dx = ARCS[i].r * Math.cos(rad);
        const dy = ARCS[i].r * Math.sin(rad);

        gsap.from(el, {
          x: -dx,
          y: -dy,
          scale: 0,
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
          delay: i * 0.06,
        });

        const dir = i % 2 === 0 ? 1 : -1;
        const speed = 1.4 + i * 0.15;

        const tween = gsap.to(el, {
          rotation: dir * 360,
          duration: speed,
          repeat: -1,
          ease: "none",
        });
        spinTweens.push(tween);
      });

      /* ─── Porcentaje simulado + lógica de espera ──────────────── */
      gsap.to(progressObj, {
        value: 85,
        duration: 1.8,
        ease: "power2.out",
        onUpdate: () => {
          if (percentRef.current)
            (percentRef.current as HTMLElement).innerText = `${Math.floor(progressObj.value)}%`;
          
          // Si ya estamos listos y el progreso es razonable, aceleramos
          if (isReadyRef.current && progressObj.value > 60 && !exitTriggered.current) {
              checkLoadState();
          }
        },
        onComplete: checkLoadState,
      });

      function checkLoadState() {
        if (exitTriggered.current) return;

        if (pageLoaded || isReadyRef.current) {
          triggerExitSequence();
        } else {
          gsap.to(progressObj, {
            value: 99,
            duration: 10,
            ease: "none",
            onUpdate: () => {
              if (percentRef.current)
                (percentRef.current as HTMLElement).innerText = `${Math.floor(progressObj.value)}%`;
              if ((pageLoaded || isReadyRef.current) && !exitTriggered.current) triggerExitSequence();
            },
          });
        }
      }

      function triggerExitSequence() {
        if (exitTriggered.current) return;
        exitTriggered.current = true;
        
        gsap.killTweensOf(progressObj);

        /* Preparar interpoladores flubber */
        const interpolators: ((t: number) => string)[] = [];
        ARCS.forEach((_, i) => {
          const srcD = PRECALCULATED_PLANES[i];
          const targets = ALL_ICON_PATHS[i];
          if (targets.length === 1) {
            const fn = flubberInterpolate(srcD, targets[0], { maxSegmentLength: 2 });
            interpolators.push((t: number) => fn(t));
          } else {
            const fns = separate(srcD, targets, { maxSegmentLength: 2 });
            interpolators.push((t: number) => fns.map((fn: (t: number) => string) => fn(t)).join(" "));
          }
        });

        pinEls.forEach((p) => {
          const el = p as SVGPathElement;
          const len = el.getTotalLength();
          gsap.set(el, {
            strokeDasharray: len,
            strokeDashoffset: len,
            fill: "none",
            stroke: el.dataset.color,
            strokeWidth: 1.2,
            opacity: 0,
          });
        });

        const tl = gsap.timeline();
        const parkDuration = 1.0;

        morphEls.forEach((_, i) => {
          const spinner = spinnerGs[i];
          spinTweens[i].kill();

          const currentRot = gsap.getProperty(spinner, "rotation") as number;
          const dir = i % 2 === 0 ? 1 : -1;
          const targetRot = dir > 0
              ? Math.ceil(currentRot / 360) * 360 + 360
              : Math.floor(currentRot / 360) * 360 - 360;

          tl.to(spinner, {
              rotation: targetRot,
              duration: parkDuration,
              ease: "power2.inOut",
              x: 0,
              y: 0,
            }, 0);
        });

        const morphStart = parkDuration;
        morphEls.forEach((pathEl, i) => {
          const proxy = { t: 0 };
          tl.to(proxy, {
              t: 1,
              duration: 0.8,
              ease: "expo.out",
              onUpdate: () => {
                pathEl.setAttribute("d", interpolators[i](proxy.t));
              },
              onComplete: () => {
                pathEl.setAttribute("d", ALL_ICON_PATHS[i].join(" "));
              },
            }, morphStart);

          tl.to(pathEl, { fill: ARCS[i].fill, duration: 0.4, ease: "power1.in" }, morphStart + 0.3);
        });

        const pinStart = morphStart + 0.5;
        pinEls.forEach((p, j) => {
          const el = p as SVGPathElement;
          tl.to(el, {
              strokeDashoffset: 0,
              opacity: 1,
              duration: 0.6,
              ease: "power2.inOut",
            }, pinStart + j * 0.08);

          tl.to(el, {
              fill: el.dataset.color,
              strokeWidth: 0,
              duration: 0.35,
            }, pinStart + 0.3 + j * 0.08);
        });

        const assembleStart = pinStart + 1.6;

        tl.to(progressObj, {
            value: 100,
            duration: assembleStart,
            ease: "power2.inOut",
            onUpdate: () => {
              if (percentRef.current)
                (percentRef.current as HTMLElement).innerText = `${Math.floor(progressObj.value)}%`;
            },
          }, 0);

        tl.to(percentRef.current, { opacity: 0, duration: 0.3 }, assembleStart);
        tl.to(".smartur-loader-overlay", {
            opacity: 0,
            duration: 0.8,
            ease: "power2.inOut",
          }, assembleStart + 0.3);

        tl.to(svgRef.current, {
            scale: 0.8,
            opacity: 0,
            duration: 1.0,
            ease: "power2.inOut",
            onComplete: () => {
              if (containerRef.current) {
                Object.assign(containerRef.current.style, {
                  opacity: "0",
                  pointerEvents: "none",
                  display: "none",
                });
              }
              try { window.dispatchEvent(new CustomEvent("smartur:loaded")); } catch {}
              try { document.body.classList.remove("is-loading"); } catch {}
              onFinishedRef.current?.();
            },
          }, assembleStart + 0.3);
      }
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="smartur-loader-overlay">
      <div className="smartur-loader-content">
        <svg
          ref={svgRef}
          viewBox="0 0 169.42 218.53"
          className="smartur-loader-svg"
          aria-label={t('auth.loader.ariaLabel')}
        >
          <g>
            {PIN_PATHS.map((p, i) => (
              <path
                key={`pin-${i}`}
                className="pin-path"
                d={p.d}
                data-color={p.color}
              />
            ))}
            {ARCS.map((a, i) => (
              <g
                key={`arc-${i}`}
                className={`arc-spinner arc-spin-${i}`}
                style={{ transformOrigin: `${a.ox}px ${a.oy}px` }}
              >
                <path
                  className="morph-path"
                  d={PRECALCULATED_PLANES[i]}
                  fill={a.color}
                  fillRule={i === 3 ? "evenodd" : "nonzero"}
                />
              </g>
            ))}
          </g>
        </svg>

        <img
          ref={logoRef}
          src={smarturLogo}
          alt="SMARTUR"
          className="loader-full-logo"
          style={{
            position: "absolute",
            width: "clamp(160px, 35vw, 320px)",
            opacity: 0,
            top: "45%",
            left: "50%",
          }}
        />

        <div className="loader-percentage" ref={percentRef}>
          0%
        </div>
      </div>
    </div>
  );
}
