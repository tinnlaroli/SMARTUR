import { useCallback, useEffect, useRef } from 'react';

const TOUR_KEY = 'smartur_empresa_tour_v1';

const kw = (text: string) =>
    `<strong style="color:var(--color-purple)">${text}</strong>`;

const dim = (text: string) =>
    `<span style="opacity:0.65;font-size:0.8rem">${text}</span>`;

type StepText = { title: string; description: string };

const STEPS: StepText[] = [
    {
        title: '✦ Bienvenido a tu Portal Empresa',
        description: `Este tour rápido te explica cada sección de tu panel. Usa ${kw('→ / ←')} para avanzar o ${kw('Esc')} para salir. ${dim('El tour navega automáticamente a cada módulo.')}`,
    },
    {
        title: 'Inicio',
        description: `Tu panel central. Ve ${kw('KPIs de engagement')} (recomendaciones, favoritos, visitas), la gráfica de actividad de los últimos 30 días y el ranking de tus servicios más populares. ${dim('Se actualiza cada vez que refrescas.')}`,
    },
    {
        title: 'Mis Servicios',
        description: `Gestiona los ${kw('servicios turísticos')} de tu empresa: hoteles, restaurantes, tours. Aquí puedes agregar nuevos servicios, editar información y activar o desactivar cada uno. ${dim('Los servicios activos aparecen en la app móvil de SMARTUR.')}`,
    },
    {
        title: 'Analíticas',
        description: `Ve el ${kw('rendimiento detallado')} de tu empresa: interacciones diarias, favoritos y visitas por servicio, y tu score de calidad basado en evaluaciones. ${dim('Los datos son en tiempo real y se calculan desde la app móvil.')}`,
    },
    {
        title: 'Perfil',
        description: `Consulta y edita la ${kw('información de tu empresa')}: nombre, dirección, teléfono, sector y ubicación. También puedes ver aquí el estado de tu cuenta (activa, en revisión o suspendida). ${dim('Los cambios los valida el equipo SMARTUR antes de publicarse.')}`,
    },
    {
        title: 'Configuración',
        description: `Ajusta el ${kw('idioma')}, tema visual (claro/oscuro) y detalles de tu cuenta. ${dim('Los cambios se guardan automáticamente en este navegador.')}`,
    },
];

const STEP_ELEMENTS: (string | undefined)[] = [
    undefined,
    '#sidebar-item-home',
    '#sidebar-item-services',
    '#sidebar-item-analytics',
    '#sidebar-item-profile',
    '#sidebar-item-settings',
];

const STEP_ROUTES: (string | undefined)[] = [
    undefined,
    '/empresa/dashboard',
    '/empresa/servicios',
    '/empresa/analytics',
    '/empresa/perfil',
    '/empresa/configuracion',
];

const TOUR_CSS = `
  .driver-popover {
    border-radius: 20px !important;
    background: var(--color-bg) !important;
    border: 1px solid var(--color-border) !important;
    box-shadow:
      0 0 0 1px rgba(var(--rgb-purple-accent), 0.15),
      0 24px 64px rgba(0,0,0,0.18),
      0 4px 16px rgba(var(--rgb-purple-accent), 0.12) !important;
    animation: smarturTourIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    max-width: 380px !important;
  }
  @keyframes smarturTourIn {
    from { opacity: 0; transform: scale(0.94) translateY(6px); }
    to   { opacity: 1; transform: scale(1)    translateY(0); }
  }
  .driver-popover-title {
    color: var(--color-text) !important;
    font-weight: 800 !important;
    font-size: 1rem !important;
    letter-spacing: -0.02em !important;
    line-height: 1.3 !important;
  }
  .driver-popover-description {
    color: var(--color-text-alt) !important;
    font-size: 0.875rem !important;
    line-height: 1.7 !important;
    margin-top: 6px !important;
  }
  .driver-popover-footer {
    margin-top: 14px !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
  }
  .driver-popover-footer button {
    border-radius: 10px !important;
    font-weight: 600 !important;
    font-size: 0.8rem !important;
    transition: opacity 0.15s ease, transform 0.1s ease !important;
    padding: 6px 14px !important;
  }
  .driver-popover-footer button:active {
    transform: scale(0.97) !important;
  }
  .driver-popover-footer .driver-popover-next-btn {
    background: var(--color-purple) !important;
    color: #fff !important;
    border-color: transparent !important;
    box-shadow: 0 2px 8px rgba(var(--rgb-purple-accent), 0.35) !important;
  }
  .driver-popover-footer .driver-popover-next-btn:hover,
  .driver-popover-footer .driver-popover-next-btn:focus {
    opacity: 0.88 !important;
  }
  .driver-popover-progress-text {
    color: var(--color-text-alt) !important;
    font-size: 0.73rem !important;
    font-variant-numeric: tabular-nums !important;
    flex: 1 !important;
    text-align: center !important;
  }
  .driver-overlay {
    background: rgba(0,0,0,0.45) !important;
    backdrop-filter: blur(3px) !important;
    transition: opacity 0.25s ease !important;
  }
  .driver-active-element {
    border-radius: 12px !important;
    transition: box-shadow 0.2s ease !important;
  }
`;

let _driverPreload: Promise<typeof import('driver.js')> | null = null;

function preloadDriver() {
    if (!_driverPreload) {
        _driverPreload = import('driver.js');
        import('driver.js/dist/driver.css').catch(() => {/* ignore */});
    }
    return _driverPreload;
}

export function useEmpresaTour(navigate?: (path: string) => void) {
    const hasSeenTour  = () => localStorage.getItem(TOUR_KEY) === 'done';
    const markTourDone = () => localStorage.setItem(TOUR_KEY, 'done');

    const cssInjected = useRef(false);

    useEffect(() => {
        preloadDriver();
    }, []);

    const startTour = useCallback(async () => {
        try {
            if (!cssInjected.current && !document.getElementById('smartur-empresa-tour-css')) {
                const style = document.createElement('style');
                style.id = 'smartur-empresa-tour-css';
                style.textContent = TOUR_CSS;
                document.head.appendChild(style);
                cssInjected.current = true;
            }

            const { driver } = await preloadDriver();

            const steps = STEP_ELEMENTS.map((element, i) => {
                const step: Record<string, unknown> = {
                    popover: {
                        title: STEPS[i]?.title ?? '',
                        description: STEPS[i]?.description ?? '',
                        side: element ? 'right' : 'bottom',
                        align: element ? 'start' : 'center',
                    },
                };
                if (element) step.element = element;
                return step;
            });

            const driverObj = driver({
                showProgress: true,
                showButtons: ['next', 'previous', 'close'],
                nextBtnText: 'Siguiente →',
                prevBtnText: '← Atrás',
                doneBtnText: 'Listo',
                progressText: '{{current}} / {{total}}',
                smoothScroll: true,
                steps,
                onHighlightStarted: (_el, _step, opts) => {
                    const idx = (opts as { state?: { activeIndex?: number } }).state?.activeIndex ?? 0;
                    const route = STEP_ROUTES[idx];
                    if (route && navigate) navigate(route);
                },
                onDestroyStarted: () => {
                    markTourDone();
                    driverObj.destroy();
                },
            });

            driverObj.drive();
        } catch (e) {
            console.warn('[empresa-tour] no disponible:', e);
        }
    }, [navigate]);

    useEffect(() => {
        if (!hasSeenTour()) {
            const timer = setTimeout(startTour, 800);
            return () => clearTimeout(timer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startTour]);

    return { startTour, hasSeenTour };
}
