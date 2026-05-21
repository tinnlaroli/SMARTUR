import { useCallback, useEffect } from 'react';

const TOUR_KEY = 'smartur_dashboard_tour_v1';

const STEPS = [
    {
        element: '#sidebar-item-home',
        popover: {
            title: '👋 Bienvenido al Dashboard',
            description: 'Este es tu panel de control central. Desde aquí puedes ver KPIs, gráficas de actividad y el estado general del sistema en tiempo real.',
            side: 'right' as const,
            align: 'start' as const,
        },
    },
    {
        element: '#sidebar-item-users',
        popover: {
            title: '👥 Usuarios',
            description: 'Gestiona las cuentas de los turistas registrados en la app móvil — crea, edita, desactiva o consulta historial de actividad.',
            side: 'right' as const,
            align: 'start' as const,
        },
    },
    {
        element: '#sidebar-item-companies',
        popover: {
            title: '🏢 Compañías',
            description: 'Administra las empresas turísticas registradas. Una compañía puede tener varios servicios asociados.',
            side: 'right' as const,
            align: 'start' as const,
        },
    },
    {
        element: '#sidebar-item-services',
        popover: {
            title: '🛎 Servicios Turísticos',
            description: 'Los servicios son ofertas concretas de una compañía: hoteles, restaurantes, tours, transporte. Son lo que el turista puede reservar o evaluar.',
            side: 'right' as const,
            align: 'start' as const,
        },
    },
    {
        element: '#sidebar-item-poi',
        popover: {
            title: '📍 Puntos de Interés (POI)',
            description: 'Los POIs son atracciones, monumentos o lugares naturales que no pertenecen a una empresa. El turista los descubre y los guarda como favoritos.',
            side: 'right' as const,
            align: 'start' as const,
        },
    },
    {
        element: '#sidebar-item-community',
        popover: {
            title: '💬 Comunidad Mobile',
            description: 'Aquí aparecen las publicaciones que los usuarios crean desde la app móvil. Puedes moderar y eliminar contenido inapropiado.',
            side: 'right' as const,
            align: 'start' as const,
        },
    },
    {
        element: '#sidebar-item-contacts',
        popover: {
            title: '✉️ Contactos & Suscripciones',
            description: 'Correos capturados desde los formularios de contacto de las landing pages. Útil para campañas de email y seguimiento B2B.',
            side: 'right' as const,
            align: 'start' as const,
        },
    },
    {
        element: '#sidebar-item-stats',
        popover: {
            title: '📊 Estadísticas',
            description: 'Reportes detallados: visitas por lugar, evaluaciones promedio, actividad de usuarios y tendencias por período.',
            side: 'right' as const,
            align: 'start' as const,
        },
    },
    {
        element: '#sidebar-item-ml',
        popover: {
            title: '🤖 ML / Observabilidad IA',
            description: 'Monitorea la salud del motor de recomendaciones: RMSE, latencia de inferencia y tasa de clicks sobre sugerencias.',
            side: 'right' as const,
            align: 'start' as const,
        },
    },
    {
        element: '#sidebar-item-instruments',
        popover: {
            title: '📋 Instrumentos de Evaluación',
            description: 'Crea y edita las plantillas (rúbricas) que se usan para evaluar los servicios turísticos. Define criterios, pesos y niveles de calificación.',
            side: 'right' as const,
            align: 'start' as const,
        },
    },
    {
        element: '#sidebar-item-settings',
        popover: {
            title: '⚙️ Configuración',
            description: 'Ajusta el idioma, tema visual, preferencias de alertas y detalles de tu cuenta.',
            side: 'right' as const,
            align: 'start' as const,
        },
    },
];

export function useDashboardTour() {
    const hasSeenTour = () => localStorage.getItem(TOUR_KEY) === 'done';
    const markTourDone = () => localStorage.setItem(TOUR_KEY, 'done');

    const startTour = useCallback(async () => {
        try {
            const { driver } = await import('driver.js');
            await import('driver.js/dist/driver.css');

            const driverObj = driver({
                showProgress: true,
                showButtons: ['next', 'previous', 'close'],
                nextBtnText: 'Siguiente →',
                prevBtnText: '← Atrás',
                doneBtnText: '¡Listo! 🎉',
                progressText: '{{current}} de {{total}}',
                steps: STEPS,
                onDestroyStarted: () => {
                    markTourDone();
                    driverObj.destroy();
                },
            });

            driverObj.drive();
        } catch (e) {
            console.warn('Tour no disponible:', e);
        }
    }, []);

    useEffect(() => {
        if (!hasSeenTour()) {
            const timer = setTimeout(startTour, 1200);
            return () => clearTimeout(timer);
        }
    }, [startTour]);

    return { startTour, hasSeenTour };
}
