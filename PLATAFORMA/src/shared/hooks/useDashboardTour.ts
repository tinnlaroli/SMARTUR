import { useCallback, useEffect, useRef } from 'react';
import type { LanguageCode } from '../../contexts/LanguageContext';

const TOUR_KEY = 'smartur_dashboard_tour_v2';

const kw = (text: string) =>
    `<strong style="color:var(--color-purple)">${text}</strong>`;

const dim = (text: string) =>
    `<span style="opacity:0.65;font-size:0.8rem">${text}</span>`;

type StepText = { title: string; description: string };

const STEPS_BY_LANG: Record<LanguageCode, StepText[]> = {
    es: [
        {
            title: '✦ Bienvenido a SMARTUR Admin',
            description: `Este tour rápido te guiará por los módulos del panel. Usa ${kw('→ / ←')} para avanzar o retroceder, ${kw('Esc')} para salir. ${dim('El tour navega automáticamente a cada módulo.')}`,
        },
        {
            title: 'Panel',
            description: `Tu panel central. Ve ${kw('KPIs de calidad')}, gráfica de actividad mensual, distribución de usuarios y el ranking de servicios mejor evaluados. ${dim('Se actualiza en tiempo real.')}`,
        },
        {
            title: 'Usuarios',
            description: `Gestiona cuentas de ${kw('turistas registrados')}: crea, edita, desactiva o consulta historial de actividad. ${dim('Incluye filtros por rol y búsqueda por nombre.')}`,
        },
        {
            title: 'Compañías',
            description: `Administra las ${kw('empresas turísticas')} del sistema. Cada compañía puede tener múltiples servicios y actividades asociadas. ${dim('Primer paso antes de crear servicios.')}`,
        },
        {
            title: 'Servicios Turísticos',
            description: `Ofertas concretas de una empresa: ${kw('hoteles, restaurantes, tours, transporte')}. Se evalúan con rúbricas y su score alimenta el motor de recomendaciones de la app. ${dim('Los servicios con score ≥ 50 reciben prioridad en IA.')}`,
        },
        {
            title: 'Ubicaciones',
            description: `Define las ${kw('zonas geográficas')} donde operan servicios y puntos de interés. ${dim('Las ubicaciones son la base para el filtrado por distancia en la app móvil.')}`,
        },
        {
            title: 'Puntos de Interés',
            description: `Atracciones, monumentos o sitios naturales ${kw('sin empresa propietaria')} (cascadas, volcanes, zonas arqueológicas). El turista los descubre en el mapa y los guarda como favoritos. ${dim('Son candidatos directos en el motor de recomendaciones.')}`,
        },
        {
            title: 'Actividades',
            description: `Registra la ${kw('actividad productiva')} de cada empresa: valor de producción, impacto ambiental y social. ${dim('Datos para reportes de sostenibilidad turística.')}`,
        },
        {
            title: 'Comunidad',
            description: `Publicaciones creadas por usuarios desde la app móvil. Puedes ${kw('moderar y eliminar')} contenido inapropiado. ${dim('Solo aparece contenido publicado por turistas reales.')}`,
        },
        {
            title: 'Contactos y Suscripciones',
            description: `Correos capturados desde formularios de contacto del landing. ${dim('Útil para campañas de email y seguimiento B2B con potenciales socios.')}`,
        },
        {
            title: 'Estadísticas',
            description: `Registra indicadores de ${kw('sostenibilidad turística')}: gasto por turista, empleos generados por empresa, y huella de carbono. ${dim('3 tabs: Gasto · Empleo · Carbono.')}`,
        },
        {
            title: 'ML / Observabilidad IA',
            description: `Monitorea el ${kw('motor de recomendaciones')}: RMSE, latencia, sesiones y CTR 30d. Entrena el modelo con un clic y controla el reentrenamiento automático nocturno. ${dim('LightFM WARP + CF Pearson + Random Forest + TF-IDF.')}`,
        },
        {
            title: 'Instrumentos de Evaluación',
            description: `Crea y edita ${kw('rúbricas de evaluación')} para servicios. Define criterios, pesos y niveles de calificación. ${dim('Las plantillas se aplican cuando un evaluador califica un servicio.')}`,
        },
        {
            title: 'Notificaciones Push',
            description: `Envía ${kw('notificaciones push')} a turistas, empresas o todos los usuarios a la vez. Incluye vista previa en tiempo real del mensaje. ${dim('Requiere Firebase configurado en el servidor.')}`,
        },
        {
            title: 'Verificación de Empresas',
            description: `Revisa las ${kw('solicitudes KYC')} de empresas: INE, comprobante de domicilio, CURP y RFC del propietario. Aprueba o rechaza con motivo. ${dim('Las empresas aprobadas acceden al portal B2B completo.')}`,
        },
        {
            title: 'Servicios Pendientes',
            description: `Aprueba o rechaza ${kw('servicios turísticos')} enviados por empresas antes de que sean visibles en la app. ${dim('Solo los servicios aprobados aparecen en recomendaciones.')}`,
        },
        {
            title: 'Rutas Certificadas',
            description: `Gestiona itinerarios públicos y otorga el ${kw('sello SMARTUR')} a las mejores rutas de la comunidad. Las rutas certificadas tienen prioridad en el explorador. ${dim('Selección masiva disponible con checkboxes.')}`,
        },
        {
            title: 'Configuración',
            description: `Ajusta el ${kw('idioma')}, tema visual (claro/oscuro), alertas del panel y detalles de tu cuenta. ${dim('Los cambios se guardan automáticamente en este navegador.')}`,
        },
    ],
    en: [
        {
            title: '✦ Welcome to SMARTUR Admin',
            description: `This quick tour walks you through the main modules. Use ${kw('→ / ←')} to navigate or ${kw('Esc')} to exit. ${dim('The tour automatically navigates to each module.')}`,
        },
        {
            title: 'Dashboard',
            description: `Your central control panel. View ${kw('quality KPIs')}, monthly activity charts, user distribution and the top-rated services ranking. ${dim('Updates in real time.')}`,
        },
        {
            title: 'Users',
            description: `Manage ${kw('registered tourist')} accounts — create, edit, deactivate or review activity history. ${dim('Includes role filters and name search.')}`,
        },
        {
            title: 'Companies',
            description: `Manage registered ${kw('tourism businesses')}. Each company can have multiple associated services and activities. ${dim('First step before creating services.')}`,
        },
        {
            title: 'Tourist Services',
            description: `Concrete offerings: ${kw('hotels, restaurants, tours, transport')}. Evaluated with rubrics — scores feed the app recommendation engine. ${dim('Services scoring ≥ 50 get priority in AI rankings.')}`,
        },
        {
            title: 'Locations',
            description: `Define the ${kw('geographic zones')} where services and POIs operate. ${dim('Used for distance-based filtering in the mobile app.')}`,
        },
        {
            title: 'Points of Interest',
            description: `Attractions, monuments or natural sites ${kw('without a business owner')} (waterfalls, volcanoes, ruins). Tourists discover and save them as favorites. ${dim('Direct candidates in the recommendation engine.')}`,
        },
        {
            title: 'Activities',
            description: `Records the ${kw('productive activity')} of each company: production value, environmental and social impact. ${dim('Data for tourism sustainability reporting.')}`,
        },
        {
            title: 'Community',
            description: `Posts created by users from the mobile app. You can ${kw('moderate and remove')} inappropriate content. ${dim('Only content published by real tourists appears here.')}`,
        },
        {
            title: 'Contacts & Subscriptions',
            description: `Emails captured from landing page contact forms. ${dim('Useful for email campaigns and B2B follow-up with potential partners.')}`,
        },
        {
            title: 'Statistics',
            description: `Records ${kw('tourism sustainability indicators')}: tourist spending, jobs generated per company, and carbon footprint. ${dim('3 tabs: Spending · Employment · Carbon.')}`,
        },
        {
            title: 'ML / AI Observability',
            description: `Monitor the ${kw('recommendation engine')}: RMSE, latency, sessions and 30d CTR. Train the model with one click and control the nightly auto-retraining schedule. ${dim('LightFM WARP + CF Pearson + Random Forest + TF-IDF.')}`,
        },
        {
            title: 'Evaluation Instruments',
            description: `Create and edit ${kw('evaluation rubrics')} for services. Define criteria, weights and scoring levels. ${dim('Templates are applied when an evaluator rates a service.')}`,
        },
        {
            title: 'Push Notifications',
            description: `Send ${kw('push notifications')} to tourists, businesses or all users at once. Includes live message preview. ${dim('Requires Firebase configured on the server.')}`,
        },
        {
            title: 'Company Verification',
            description: `Review ${kw('KYC requests')} from businesses: owner ID, proof of address, CURP and RFC. Approve or reject with a reason. ${dim('Approved companies get full access to the B2B portal.')}`,
        },
        {
            title: 'Pending Services',
            description: `Approve or reject ${kw('tourist services')} submitted by companies before they appear in the app. ${dim('Only approved services appear in recommendations.')}`,
        },
        {
            title: 'Certified Routes',
            description: `Manage public itineraries and award the ${kw('SMARTUR badge')} to the best community routes. Certified routes get priority in the explorer. ${dim('Bulk selection available with checkboxes.')}`,
        },
        {
            title: 'Settings',
            description: `Adjust ${kw('language')}, visual theme (light/dark), panel alerts and account details. ${dim('Changes are saved automatically in this browser.')}`,
        },
    ],
    fr: [
        {
            title: '✦ Bienvenue sur SMARTUR Admin',
            description: `Cette visite rapide vous guide à travers les modules. Utilisez ${kw('→ / ←')} pour naviguer ou ${kw('Échap')} pour quitter. ${dim('Le tour navigue automatiquement vers chaque module.')}`,
        },
        {
            title: 'Tableau de Bord',
            description: `Votre panneau central. Consultez les ${kw('KPIs de qualité')}, graphiques d'activité, distribution des utilisateurs et classement des services. ${dim('Se met à jour en temps réel.')}`,
        },
        {
            title: 'Utilisateurs',
            description: `Gérez les comptes des ${kw('touristes inscrits')} — créez, modifiez, désactivez ou consultez l'historique. ${dim('Filtres par rôle et recherche par nom inclus.')}`,
        },
        {
            title: 'Entreprises',
            description: `Gérez les ${kw('entreprises touristiques')} enregistrées. Chaque entreprise peut avoir plusieurs services et activités. ${dim('Première étape avant de créer des services.')}`,
        },
        {
            title: 'Services Touristiques',
            description: `Offres concrètes: ${kw('hôtels, restaurants, circuits, transport')}. Évalués par rubriques — les scores alimentent le moteur de recommandations. ${dim('Les services avec score ≥ 50 ont priorité en IA.')}`,
        },
        {
            title: 'Lieux',
            description: `Définissez les ${kw('zones géographiques')} où opèrent services et POIs. ${dim('Utilisé pour le filtrage par distance dans l\'app mobile.')}`,
        },
        {
            title: "Points d'Intérêt",
            description: `Sites naturels, monuments ou attractions ${kw('sans entreprise propriétaire')} (cascades, volcans, ruines). Les touristes les découvrent et les sauvegardent. ${dim('Candidats directs dans le moteur de recommandations.')}`,
        },
        {
            title: 'Activités',
            description: `Enregistre l'${kw('activité productive')} de chaque entreprise: valeur de production, impact environnemental et social. ${dim('Données pour les rapports de durabilité touristique.')}`,
        },
        {
            title: 'Communauté',
            description: `Publications créées depuis l'app mobile. Vous pouvez ${kw('modérer et supprimer')} le contenu inapproprié. ${dim('Uniquement le contenu publié par de vrais touristes.')}`,
        },
        {
            title: 'Contacts & Abonnements',
            description: `Emails saisis via les formulaires du landing. ${dim('Utile pour les campagnes email et le suivi B2B avec des partenaires potentiels.')}`,
        },
        {
            title: 'Statistiques',
            description: `Enregistre les ${kw('indicateurs de durabilité')}: dépenses touristiques, emplois par entreprise, empreinte carbone. ${dim('3 onglets: Dépenses · Emploi · Carbone.')}`,
        },
        {
            title: 'ML / Observabilité IA',
            description: `Surveillez le ${kw('moteur de recommandations')}: RMSE, latence, sessions et CTR 30j. Entraînez d'un clic et gérez le calendrier de réentraînement nocturne. ${dim('LightFM WARP + CF Pearson + Random Forest + TF-IDF.')}`,
        },
        {
            title: "Instruments d'Évaluation",
            description: `Créez et éditez des ${kw('grilles d\'évaluation')} pour les services. Définissez critères, poids et niveaux. ${dim('Les modèles sont appliqués quand un évaluateur note un service.')}`,
        },
        {
            title: 'Notifications Push',
            description: `Envoyez des ${kw('notifications push')} aux touristes, aux entreprises ou à tous les utilisateurs. Aperçu du message en temps réel. ${dim('Nécessite Firebase configuré sur le serveur.')}`,
        },
        {
            title: 'Vérification des Entreprises',
            description: `Examinez les ${kw('demandes KYC')} des entreprises : CNI, justificatif de domicile, CURP et RFC du propriétaire. Approuvez ou refusez avec un motif. ${dim('Les entreprises approuvées accèdent au portail B2B complet.')}`,
        },
        {
            title: 'Services en Attente',
            description: `Approuvez ou refusez les ${kw('services touristiques')} soumis par les entreprises avant leur publication. ${dim('Seuls les services approuvés apparaissent dans les recommandations.')}`,
        },
        {
            title: 'Itinéraires Certifiés',
            description: `Gérez les itinéraires publics et attribuez le ${kw('label SMARTUR')} aux meilleures routes communautaires. Les routes certifiées sont prioritaires dans l'explorateur. ${dim('Sélection multiple disponible avec les cases à cocher.')}`,
        },
        {
            title: 'Paramètres',
            description: `Ajustez la ${kw('langue')}, le thème visuel, les alertes et les détails du compte. ${dim('Les modifications sont enregistrées automatiquement dans ce navigateur.')}`,
        },
    ],
} as unknown as Record<LanguageCode, StepText[]>;

// Português usa español como fallback hasta tener traducción completa
STEPS_BY_LANG.pt = STEPS_BY_LANG.es;

/** Sidebar element IDs — must match the data-id attributes on SidebarItem */
const STEP_ELEMENTS: (string | undefined)[] = [
    undefined,                       // 0 intro — centered card
    '#sidebar-item-home',            // 1 Dashboard
    '#sidebar-item-users',           // 2 Users
    '#sidebar-item-companies',       // 3 Companies
    '#sidebar-item-services',        // 4 Services
    '#sidebar-item-locations',       // 5 Locations
    '#sidebar-item-poi',             // 6 POI
    '#sidebar-item-activities',      // 7 Activities
    '#sidebar-item-community',       // 8 Community
    '#sidebar-item-contacts',        // 9 Contacts
    '#sidebar-item-stats',           // 10 Statistics
    '#sidebar-item-ml',              // 11 ML
    '#sidebar-item-instruments',          // 12 Instruments
    '#sidebar-item-notifications',        // 13 Notifications
    '#sidebar-item-company-verification', // 14 Company verification
    '#sidebar-item-services-approval',    // 15 Services approval
    '#sidebar-item-itineraries',          // 16 Certified routes
    '#sidebar-item-settings',             // 17 Settings
];

/** Route to navigate to when each step highlights */
const STEP_ROUTES: (string | undefined)[] = [
    undefined,
    '/dashboard',
    '/dashboard/usuarios',
    '/dashboard/companias',
    '/dashboard/servicios',
    '/dashboard/ubicaciones',
    '/dashboard/poi',
    '/dashboard/actividades',
    '/dashboard/comunidad',
    '/dashboard/contactos',
    '/dashboard/estadisticas',
    '/dashboard/ml',
    '/dashboard/instrumentos',
    '/dashboard/notificaciones',
    '/dashboard/verificacion-empresas',
    '/dashboard/servicios-pendientes',
    '/dashboard/itinerarios',
    '/dashboard/configuracion',
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
  /* Highlighted element — subtle glow ring instead of hard cutout */
  .driver-active-element {
    border-radius: 12px !important;
    transition: box-shadow 0.2s ease !important;
  }
`;

// Module-level promise cache — shared across all hook instances
let _driverPreload: Promise<typeof import('driver.js')> | null = null;

function preloadDriver() {
    if (!_driverPreload) {
        _driverPreload = import('driver.js');
        import('driver.js/dist/driver.css').catch(() => {/* ignore */});
    }
    return _driverPreload;
}

export function useDashboardTour(
    lang: LanguageCode = 'es',
    navigate?: (path: string) => void,
) {
    const hasSeenTour  = () => localStorage.getItem(TOUR_KEY) === 'done';
    const markTourDone = () => localStorage.setItem(TOUR_KEY, 'done');

    // Inject CSS once
    const cssInjected = useRef(false);

    // Start preloading driver.js immediately — before the tour fires
    useEffect(() => {
        preloadDriver();
    }, []);

    const startTour = useCallback(async () => {
        try {
            // CSS injection (once)
            if (!cssInjected.current && !document.getElementById('smartur-tour-css')) {
                const style = document.createElement('style');
                style.id = 'smartur-tour-css';
                style.textContent = TOUR_CSS;
                document.head.appendChild(style);
                cssInjected.current = true;
            }

            // driver.js should already be cached from the preload
            const { driver } = await preloadDriver();

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
                smoothScroll: true,
                steps,
                onHighlightStarted: (_el, _step, opts) => {
                    // Navigate to the corresponding route so the main content updates
                    const idx = (opts as { state?: { activeIndex?: number } }).state?.activeIndex ?? 0;
                    const route = STEP_ROUTES[idx];
                    if (route && navigate) {
                        navigate(route);
                    }
                },
                onDestroyStarted: () => {
                    markTourDone();
                    driverObj.destroy();
                },
            });

            driverObj.drive();
        } catch (e) {
            console.warn('[tour] no disponible:', e);
        }
    }, [lang, navigate]);

    useEffect(() => {
        if (!hasSeenTour()) {
            // Reduced to 800 ms — driver.js is already preloading in background
            const timer = setTimeout(startTour, 800);
            return () => clearTimeout(timer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startTour]);

    return { startTour, hasSeenTour };
}
