import { useCallback, useEffect } from 'react';
import type { LanguageCode } from '../../contexts/LanguageContext';

const TOUR_KEY = 'smartur_dashboard_tour_v2';

const kw = (text: string) =>
    `<strong style="color:var(--color-purple)">${text}</strong>`;

type StepText = { title: string; description: string };

const STEPS_BY_LANG: Record<LanguageCode, StepText[]> = {
    es: [
        {
            title: '✦ Bienvenido a SMARTUR Admin',
            description: `Este tour rápido te guiará por los módulos del panel de administración. Usa ${kw('→ / ←')} para navegar entre pasos o ${kw('Esc')} para salir en cualquier momento.`,
        },
        {
            title: 'Dashboard',
            description: `Tu panel de control central. Ve ${kw('KPIs')}, gráficas de actividad y el estado del sistema en tiempo real.`,
        },
        {
            title: 'Usuarios',
            description: `Gestiona cuentas de ${kw('turistas registrados')}: crea, edita, desactiva o consulta historial de actividad.`,
        },
        {
            title: 'Compañías',
            description: `Administra las ${kw('empresas turísticas')} registradas. Cada compañía puede tener múltiples servicios asociados.`,
        },
        {
            title: 'Servicios Turísticos',
            description: `Ofertas concretas de una compañía: ${kw('hoteles')}, restaurantes, tours, transporte. Lo que el turista puede reservar o evaluar.`,
        },
        {
            title: 'Ubicaciones',
            description: `Define las ${kw('zonas geográficas')} donde operan los servicios y puntos de interés de la región.`,
        },
        {
            title: 'Puntos de Interés',
            description: `Atracciones, monumentos o lugares naturales que no pertenecen a una empresa. El turista los ${kw('descubre y guarda como favoritos')}.`,
        },
        {
            title: 'Actividades',
            description: `Experiencias disponibles en la región. Se asocian a servicios y POIs para ${kw('enriquecer las rutas')} generadas por la IA.`,
        },
        {
            title: 'Comunidad',
            description: `Publicaciones creadas por usuarios desde la app móvil. Puedes ${kw('moderar y eliminar')} contenido inapropiado.`,
        },
        {
            title: 'Contactos y Suscripciones',
            description: `Correos capturados desde los ${kw('formularios de contacto')}. Útil para campañas de email y seguimiento B2B.`,
        },
        {
            title: 'Estadísticas',
            description: `Reportes detallados: ${kw('visitas por lugar')}, evaluaciones promedio, actividad de usuarios y tendencias por período.`,
        },
        {
            title: 'ML / Observabilidad IA',
            description: `Monitorea la salud del ${kw('motor de recomendaciones')}: RMSE, latencia de inferencia y tasa de clicks sobre sugerencias.`,
        },
        {
            title: 'Instrumentos de Evaluación',
            description: `Crea y edita ${kw('plantillas de rúbricas')} para evaluar servicios. Define criterios, pesos y niveles de calificación.`,
        },
        {
            title: 'Configuración',
            description: `Ajusta el ${kw('idioma')}, tema visual, preferencias de alertas y detalles de tu cuenta.`,
        },
    ],
    en: [
        {
            title: '✦ Welcome to SMARTUR Admin',
            description: `This quick tour walks you through the main modules of the admin panel. Use ${kw('→ / ←')} to navigate or ${kw('Esc')} to exit at any time.`,
        },
        {
            title: 'Dashboard',
            description: `Your central control panel. View ${kw('KPIs')}, activity charts and system status in real time.`,
        },
        {
            title: 'Users',
            description: `Manage ${kw('registered tourist')} accounts — create, edit, deactivate or review activity history.`,
        },
        {
            title: 'Companies',
            description: `Manage registered ${kw('tourism businesses')}. Each company can have multiple associated services.`,
        },
        {
            title: 'Tourist Services',
            description: `Concrete offers from a company: ${kw('hotels')}, restaurants, tours, transport. What tourists can book or evaluate.`,
        },
        {
            title: 'Locations',
            description: `Define the ${kw('geographic zones')} where services and points of interest operate.`,
        },
        {
            title: 'Points of Interest',
            description: `Attractions, monuments or natural sites that don't belong to a company. Tourists ${kw('discover and save them as favorites')}.`,
        },
        {
            title: 'Activities',
            description: `Experiences available in the region. Linked to services and POIs to ${kw('enrich AI-generated routes')}.`,
        },
        {
            title: 'Community',
            description: `Posts created by users from the mobile app. You can ${kw('moderate and remove')} inappropriate content.`,
        },
        {
            title: 'Contacts & Subscriptions',
            description: `Emails captured from ${kw('contact forms')}. Useful for email campaigns and B2B follow-up.`,
        },
        {
            title: 'Statistics',
            description: `Detailed reports: ${kw('visits per location')}, average evaluations, user activity and period trends.`,
        },
        {
            title: 'ML / AI Observability',
            description: `Monitor the health of the ${kw('recommendation engine')}: RMSE, inference latency and click-through rate.`,
        },
        {
            title: 'Evaluation Instruments',
            description: `Create and edit ${kw('rubric templates')} for service evaluation. Define criteria, weights and scoring levels.`,
        },
        {
            title: 'Settings',
            description: `Adjust ${kw('language')}, visual theme, alert preferences and account details.`,
        },
    ],
    fr: [
        {
            title: '✦ Bienvenue sur SMARTUR Admin',
            description: `Cette visite rapide vous guide à travers les modules du panneau d'administration. Utilisez ${kw('→ / ←')} pour naviguer ou ${kw('Échap')} pour quitter à tout moment.`,
        },
        {
            title: 'Tableau de Bord',
            description: `Votre panneau de contrôle central. Consultez les ${kw('KPIs')}, graphiques d'activité et l'état du système en temps réel.`,
        },
        {
            title: 'Utilisateurs',
            description: `Gérez les comptes des ${kw('touristes inscrits')}: créez, modifiez, désactivez ou consultez l'historique.`,
        },
        {
            title: 'Entreprises',
            description: `Administrez les ${kw('entreprises touristiques')} enregistrées. Chaque entreprise peut avoir plusieurs services associés.`,
        },
        {
            title: 'Services Touristiques',
            description: `Offres concrètes: ${kw('hôtels')}, restaurants, circuits, transport. Ce que le touriste peut réserver ou évaluer.`,
        },
        {
            title: 'Lieux',
            description: `Définissez les ${kw('zones géographiques')} où opèrent les services et points d'intérêt.`,
        },
        {
            title: "Points d'Intérêt",
            description: `Sites naturels, monuments ou attractions sans entreprise propriétaire. Les touristes les ${kw('découvrent et les sauvegardent')}.`,
        },
        {
            title: 'Activités',
            description: `Expériences disponibles dans la région. Associées aux services et POIs pour ${kw('enrichir les itinéraires IA')}.`,
        },
        {
            title: 'Communauté',
            description: `Publications créées depuis l'app mobile. Vous pouvez ${kw('modérer et supprimer')} le contenu inapproprié.`,
        },
        {
            title: 'Contacts & Abonnements',
            description: `Emails saisis via les ${kw('formulaires de contact')}. Utile pour les campagnes email et le suivi B2B.`,
        },
        {
            title: 'Statistiques',
            description: `Rapports détaillés: ${kw('visites par lieu')}, évaluations moyennes, activité des utilisateurs et tendances.`,
        },
        {
            title: 'ML / Observabilité IA',
            description: `Surveillez la santé du ${kw("moteur de recommandations")}: RMSE, latence d'inférence et taux de clics.`,
        },
        {
            title: "Instruments d'Évaluation",
            description: `Créez et éditez des ${kw('modèles de grilles')} pour évaluer les services. Définissez critères, poids et niveaux.`,
        },
        {
            title: 'Paramètres',
            description: `Ajustez la ${kw('langue')}, le thème visuel, les préférences d'alertes et les détails du compte.`,
        },
    ],
};

const STEP_ELEMENTS: (string | undefined)[] = [
    undefined,                    // intro — centered welcome card
    '#sidebar-item-home',
    '#sidebar-item-users',
    '#sidebar-item-companies',
    '#sidebar-item-services',
    '#sidebar-item-locations',
    '#sidebar-item-poi',
    '#sidebar-item-activities',
    '#sidebar-item-community',
    '#sidebar-item-contacts',
    '#sidebar-item-stats',
    '#sidebar-item-ml',
    '#sidebar-item-instruments',
    '#sidebar-item-settings',
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
    animation: smarturTourIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
  }
  @keyframes smarturTourIn {
    from { opacity: 0; transform: scale(0.93) translateY(8px); }
    to   { opacity: 1; transform: scale(1)    translateY(0); }
  }
  .driver-popover-title {
    color: var(--color-text) !important;
    font-weight: 800 !important;
    font-size: 1.05rem !important;
    letter-spacing: -0.02em !important;
    line-height: 1.3 !important;
  }
  .driver-popover-description {
    color: var(--color-text-alt) !important;
    font-size: 0.875rem !important;
    line-height: 1.65 !important;
    margin-top: 5px !important;
  }
  .driver-popover-footer {
    margin-top: 14px !important;
  }
  .driver-popover-footer button {
    border-radius: 10px !important;
    font-weight: 600 !important;
    font-size: 0.8rem !important;
    transition: opacity 0.15s ease !important;
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
  }
  .driver-overlay {
    background: rgba(0,0,0,0.55) !important;
    backdrop-filter: blur(4px) !important;
  }
`;

export function useDashboardTour(lang: LanguageCode = 'es') {
    const hasSeenTour = () => localStorage.getItem(TOUR_KEY) === 'done';
    const markTourDone = () => localStorage.setItem(TOUR_KEY, 'done');

    const startTour = useCallback(async () => {
        try {
            const { driver } = await import('driver.js');
            await import('driver.js/dist/driver.css');

            // Inject dark-mode aware styles
            if (!document.getElementById('smartur-tour-css')) {
                const style = document.createElement('style');
                style.id = 'smartur-tour-css';
                style.textContent = TOUR_CSS;
                document.head.appendChild(style);
            }

            const texts = STEPS_BY_LANG[lang] ?? STEPS_BY_LANG.es;
            const steps = STEP_ELEMENTS.map((element, i) => {
                const step: Record<string, unknown> = {
                    popover: {
                        title: texts[i]?.title ?? '',
                        description: texts[i]?.description ?? '',
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
                nextBtnText: lang === 'fr' ? 'Suivant →' : lang === 'en' ? 'Next →' : 'Siguiente →',
                prevBtnText: lang === 'fr' ? '← Précédent' : lang === 'en' ? '← Back' : '← Atrás',
                doneBtnText: lang === 'fr' ? 'Terminé' : lang === 'en' ? 'Done' : 'Listo',
                progressText: '{{current}} / {{total}}',
                allowHTML: true,
                steps,
                onDestroyStarted: () => {
                    markTourDone();
                    driverObj.destroy();
                },
            });

            driverObj.drive();
        } catch (e) {
            console.warn('Tour no disponible:', e);
        }
    }, [lang]);

    useEffect(() => {
        if (!hasSeenTour()) {
            const timer = setTimeout(startTour, 1200);
            return () => clearTimeout(timer);
        }
    }, [startTour]);

    return { startTour, hasSeenTour };
}
