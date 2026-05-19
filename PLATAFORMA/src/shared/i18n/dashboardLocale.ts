import type { LanguageCode } from '../../contexts/LanguageContext';
import type { DashboardModules } from './dashboardModules';
import { dashboardModulesByLang } from './dashboardModules';

type DashboardLocale = {
    locale: string;
    layout: {
        routes: Record<string, string>;
        notificationTitle: string;
        notificationEmpty: string;
        notificationEmptyHint: string;
        markAllRead: string;
        clearAll: string;
        clearToLight: string;
        clearToDark: string;
        justNow: string;
        recentLabel: string;
    };
    settings: {
        title: string;
        subtitle: string;
        languageTitle: string;
        languageDescription: string;
        languageCodeLabel: string;
        appearanceTitle: string;
        appearanceDescription: string;
        lightLabel: string;
        lightDescription: string;
        darkLabel: string;
        darkDescription: string;
        alertsTitle: string;
        alertsDescription: string;
        evaluationAlertsLabel: string;
        evaluationAlertsDescription: string;
        registrationAlertsLabel: string;
        registrationAlertsDescription: string;
        weeklySummaryLabel: string;
        weeklySummaryDescription: string;
        savePreferences: string;
        accountTitle: string;
        accountDescription: string;
        userLabel: string;
        noActiveUser: string;
        unavailable: string;
        roleLabel: string;
        adminRole: string;
        userRole: string;
        summaryTitle: string;
        activeLanguageLabel: string;
        activeThemeLabel: string;
        savedAlertsLabel: string;
        activeAlertsCount: (count: number) => string;
        preferencesSavedTitle: string;
        preferencesSavedDescription: string;
    };
    home: {
        loadingLabel: string;
        loadingRefreshLabel: string;
        dashboardError: string;
        retry: string;
        closePreferences: string;
        hiddenWidgetsTitle: string;
        hiddenWidgetsDescription: string;
    };
    widgets: {
        metricEyebrows: Record<'averageScore' | 'evaluations' | 'activeUsers' | 'services', string>;
        widgetOptions: Record<'showTopServices' | 'showUserDistribution' | 'showRecentActivity', { label: string; description: string }>;
        headerTitle: string;
        headerSubtitle: string;
        personalize: string;
        refresh: string;
        preferencesTitle: string;
        preferencesSubtitle: string;
        reset: string;
        mainView: string;
        mixed: string;
        volume: string;
        score: string;
        visualDensity: string;
        comfortable: string;
        compact: string;
        sideWidgets: string;
        operationalCoverageTitle: string;
        monthlyPerformanceTitle: string;
        evaluationsLegend: string;
        averageScoreLegend: string;
        mainChartEmpty: string;
        userDistributionTitle: string;
        userDistributionEmpty: string;
        totalLabel: string;
        usersLabel: (count: number) => string;
        topServicesTitle: string;
        topServicesEmpty: string;
        evaluationsShort: string;
        recentActivityTitle: string;
        recentActivityEmpty: string;
    };
    viewModel: {
        roleLabels: Record<number, string>;
        roleFallback: (roleId: number) => string;
        relativeMinutes: (value: number) => string;
        relativeHours: (value: number) => string;
        scoreOutstanding: string;
        scoreGood: string;
        scoreAttention: string;
        scoreImprove: string;
        noHistoryTrend: string;
        zeroTrend: string;
        peakAndBestTrend: (peakMonth: string, bestMonth: string) => string;
        insightCoverageLabel: string;
        insightQualityLabel: string;
        insightNoMonthlyHistory: string;
        insightWaitingEvaluations: string;
        insightZeroBase: string;
        insightNoEvaluationsYet: string;
        insightLatestCutLabel: string;
        insightMonthlyPeakLabel: string;
        latestCutWithDelta: (month: string, count: string, delta: string) => string;
        latestCutWithoutDelta: (month: string, count: string) => string;
        averageScoreLabel: string;
        averageScoreHelper: (scoreLabel: string, totalEvaluations: string) => string;
        evaluationsLabel: string;
        evaluationsHelper: (perService: string) => string;
        activeUsersLabel: string;
        activeUsersHelper: (activeRate: string, totalUsers: string) => string;
        servicesLabel: string;
        servicesHelper: (perCompany: string) => string;
        operationalNames: {
            locations: string;
            services: string;
            companies: string;
            poi: string;
        };
        distributionSummary: (count: number) => string;
        distributionSummaryEmpty: string;
        operationalSummary: string;
        operationalSummaryEmpty: string;
        topServicesSummary: (name: string) => string;
        topServicesSummaryEmpty: string;
        activitySummary: (count: string) => string;
        activitySummaryEmpty: string;
        newDelta: string;
    };
    modules: DashboardModules;
};

const es: DashboardLocale = {
    locale: 'es-MX',
    layout: {
        routes: {
            '/dashboard': 'Inicio',
            '/dashboard/usuarios': 'Usuarios',
            '/dashboard/companias': 'Companias',
            '/dashboard/servicios': 'Servicios',
            '/dashboard/ubicaciones': 'Ubicaciones',
            '/dashboard/perfiles': 'Perfiles',
            '/dashboard/actividades': 'Actividades',
            '/dashboard/certificaciones': 'Certificaciones',
            '/dashboard/poi': 'Puntos de interes',
            '/dashboard/estadisticas': 'Estadisticas',
            '/dashboard/instrumentos': 'Instrumentos',
            '/dashboard/configuracion': 'Configuracion',
        },
        notificationTitle: 'Notificaciones',
        notificationEmpty: 'Sin notificaciones recientes',
        notificationEmptyHint: 'Las acciones del panel apareceran aqui en cuanto generen avisos.',
        markAllRead: 'Marcar todo como leido',
        clearAll: 'Limpiar',
        clearToLight: 'Modo claro',
        clearToDark: 'Modo oscuro',
        justNow: 'Ahora',
        recentLabel: 'Reciente',
    },
    settings: {
        title: 'Configuracion',
        subtitle: 'Preferencias activas del panel, idioma y alertas internas.',
        languageTitle: 'Idioma de la interfaz',
        languageDescription: 'El cambio se aplica inmediatamente en las vistas del dashboard y configuracion.',
        languageCodeLabel: 'Codigo',
        appearanceTitle: 'Apariencia',
        appearanceDescription: 'Selecciona el modo visual del dashboard.',
        lightLabel: 'Claro',
        lightDescription: 'Ideal para espacios con mucha luz o sesiones de revision rapida.',
        darkLabel: 'Oscuro',
        darkDescription: 'Reduce el brillo y mantiene mejor contraste en jornadas largas.',
        alertsTitle: 'Alertas del panel',
        alertsDescription: 'Guarda que avisos quieres mantener activos en esta sesion administrativa.',
        evaluationAlertsLabel: 'Resultados de evaluacion',
        evaluationAlertsDescription: 'Mantiene visibles las alertas relacionadas con evaluaciones y seguimiento de servicios.',
        registrationAlertsLabel: 'Altas y registros nuevos',
        registrationAlertsDescription: 'Activa avisos rapidos cuando se agregan usuarios, companias o ubicaciones.',
        weeklySummaryLabel: 'Resumen semanal',
        weeklySummaryDescription: 'Guarda la preferencia para mostrar resumenes operativos del panel.',
        savePreferences: 'Guardar preferencias',
        accountTitle: 'Cuenta activa',
        accountDescription: 'Resumen de la sesion actual en el dashboard.',
        userLabel: 'Usuario',
        noActiveUser: 'Sin usuario activo',
        unavailable: 'No disponible',
        roleLabel: 'Rol',
        adminRole: 'Administrador',
        userRole: 'Usuario',
        summaryTitle: 'Resumen actual',
        activeLanguageLabel: 'Idioma activo',
        activeThemeLabel: 'Tema activo',
        savedAlertsLabel: 'Alertas guardadas',
        activeAlertsCount: (count) => `${count} activas`,
        preferencesSavedTitle: 'Preferencias guardadas',
        preferencesSavedDescription: 'La configuracion del panel fue actualizada.',
    },
    home: {
        loadingLabel: 'Cargando KPIs y graficas...',
        loadingRefreshLabel: 'Actualizando indicadores...',
        dashboardError: 'No se pudieron cargar las estadisticas del dashboard.',
        retry: 'Reintentar',
        closePreferences: 'Cerrar ajustes del dashboard',
        hiddenWidgetsTitle: 'Widgets ocultos',
        hiddenWidgetsDescription: 'Activa de nuevo al menos un widget desde el panel de personalizacion para recuperar el contexto lateral del dashboard.',
    },
    widgets: {
        metricEyebrows: {
            averageScore: 'Calidad',
            evaluations: 'Actividad',
            activeUsers: 'Adopcion',
            services: 'Oferta',
        },
        widgetOptions: {
            showTopServices: {
                label: 'Top servicios',
                description: 'Mantiene visible el ranking de desempeno.',
            },
            showUserDistribution: {
                label: 'Cobertura operativa',
                description: 'Compara lugares, servicios, empresas y POI.',
            },
            showRecentActivity: {
                label: 'Actividad reciente',
                description: 'Resume las evaluaciones mas nuevas sin scroll.',
            },
        },
        headerTitle: 'Dashboard de Inicio',
        headerSubtitle: 'KPIs de calidad, actividad y adopcion disenados para leerse rapido, sin depender de scroll ni indicadores artificiales.',
        personalize: 'Personalizar',
        refresh: 'Actualizar',
        preferencesTitle: 'Ajustes del dashboard',
        preferencesSubtitle: 'Se guardan automaticamente en este navegador.',
        reset: 'Restablecer',
        mainView: 'Vista principal',
        mixed: 'Mixta',
        volume: 'Volumen',
        score: 'Score',
        visualDensity: 'Densidad visual',
        comfortable: 'Comoda',
        compact: 'Compacta',
        sideWidgets: 'Widgets laterales',
        operationalCoverageTitle: 'Cobertura operativa',
        monthlyPerformanceTitle: 'Rendimiento mensual',
        evaluationsLegend: 'Evaluaciones',
        averageScoreLegend: 'Score promedio',
        mainChartEmpty: 'Aun no hay suficiente historico para construir la grafica principal.',
        userDistributionTitle: 'Distribucion de usuarios',
        userDistributionEmpty: 'No hay usuarios con roles disponibles para mostrar la distribucion.',
        totalLabel: 'Total',
        usersLabel: (count) => `${count.toLocaleString('es-MX')} usuarios`,
        topServicesTitle: 'Top servicios',
        topServicesEmpty: 'Cuando existan evaluaciones visibles, el ranking aparecera aqui.',
        evaluationsShort: 'eval.',
        recentActivityTitle: 'Actividad reciente',
        recentActivityEmpty: 'Aun no hay evaluaciones recientes para resumir actividad.',
    },
    viewModel: {
        roleLabels: {
            1: 'Administracion',
            2: 'Evaluadores',
            3: 'Empresas',
            4: 'Turistas',
        },
        roleFallback: (roleId) => `Rol ${roleId}`,
        relativeMinutes: (value) => `${value} min`,
        relativeHours: (value) => `${value} h`,
        scoreOutstanding: 'Experiencia sobresaliente',
        scoreGood: 'Buen nivel general',
        scoreAttention: 'Zona de atencion',
        scoreImprove: 'Prioridad de mejora',
        noHistoryTrend: 'Aun no hay suficiente historial para mostrar una tendencia confiable.',
        zeroTrend: 'Sin historial mensual cargado; se muestra una linea base en cero para conservar la referencia visual.',
        peakAndBestTrend: (peakMonth, bestMonth) => `Pico de actividad en ${peakMonth} y mejor score en ${bestMonth}.`,
        insightCoverageLabel: 'Cobertura',
        insightQualityLabel: 'Calidad',
        insightNoMonthlyHistory: 'Sin historial mensual',
        insightWaitingEvaluations: 'Esperando primeras evaluaciones',
        insightZeroBase: 'Base mensual en cero',
        insightNoEvaluationsYet: 'Sin evaluaciones registradas todavia',
        insightLatestCutLabel: 'Ultimo corte',
        insightMonthlyPeakLabel: 'Pico mensual',
        latestCutWithDelta: (month, count, delta) => `${month}: ${count} (${delta})`,
        latestCutWithoutDelta: (month, count) => `${month}: ${count} evaluaciones`,
        averageScoreLabel: 'Score promedio',
        averageScoreHelper: (scoreLabel, totalEvaluations) => `${scoreLabel} con ${totalEvaluations} evaluaciones`,
        evaluationsLabel: 'Evaluaciones',
        evaluationsHelper: (perService) => `${perService} por servicio publicado`,
        activeUsersLabel: 'Usuarios activos',
        activeUsersHelper: (activeRate, totalUsers) => `${activeRate} de ${totalUsers} registrados`,
        servicesLabel: 'Servicios',
        servicesHelper: (perCompany) => `${perCompany} por empresa`,
        operationalNames: {
            locations: 'Lugares',
            services: 'Servicios',
            companies: 'Empresas',
            poi: 'POI',
        },
        distributionSummary: (count) => `${count} perfiles con actividad registrada.`,
        distributionSummaryEmpty: 'No hay usuarios clasificados por rol.',
        operationalSummary: 'Mide la cobertura estructural del ecosistema entre lugares, servicios, empresas y puntos de interes.',
        operationalSummaryEmpty: 'Sin inventario cargado; la grafica se mantiene en cero para dar contexto base.',
        topServicesSummary: (name) => `${name} lidera por desempeno y volumen visible.`,
        topServicesSummaryEmpty: 'Aun no hay servicios destacados para mostrar.',
        activitySummary: (count) => `Mostrando las ${count} actividades mas recientes disponibles.`,
        activitySummaryEmpty: 'Sin actividad reciente registrada.',
        newDelta: 'nuevo',
    },
    modules: dashboardModulesByLang.es,
};

const en: DashboardLocale = {
    locale: 'en-US',
    layout: {
        routes: {
            '/dashboard': 'Home',
            '/dashboard/usuarios': 'Users',
            '/dashboard/companias': 'Companies',
            '/dashboard/servicios': 'Services',
            '/dashboard/ubicaciones': 'Locations',
            '/dashboard/perfiles': 'Profiles',
            '/dashboard/actividades': 'Activities',
            '/dashboard/certificaciones': 'Certifications',
            '/dashboard/poi': 'Points of interest',
            '/dashboard/estadisticas': 'Statistics',
            '/dashboard/instrumentos': 'Instruments',
            '/dashboard/configuracion': 'Settings',
        },
        notificationTitle: 'Notifications',
        notificationEmpty: 'No recent notifications',
        notificationEmptyHint: 'Panel actions will appear here as soon as they generate alerts.',
        markAllRead: 'Mark all as read',
        clearAll: 'Clear',
        clearToLight: 'Light mode',
        clearToDark: 'Dark mode',
        justNow: 'Now',
        recentLabel: 'Recent',
    },
    settings: {
        title: 'Settings',
        subtitle: 'Active panel preferences, language, and internal alerts.',
        languageTitle: 'Interface language',
        languageDescription: 'The change is applied immediately across dashboard and settings views.',
        languageCodeLabel: 'Code',
        appearanceTitle: 'Appearance',
        appearanceDescription: 'Choose the dashboard visual mode.',
        lightLabel: 'Light',
        lightDescription: 'Best for bright environments or quick review sessions.',
        darkLabel: 'Dark',
        darkDescription: 'Reduces glare and keeps contrast stronger during long sessions.',
        alertsTitle: 'Panel alerts',
        alertsDescription: 'Save which alerts you want to keep active in this admin session.',
        evaluationAlertsLabel: 'Evaluation results',
        evaluationAlertsDescription: 'Keeps alerts related to evaluations and service follow-up visible.',
        registrationAlertsLabel: 'New registrations',
        registrationAlertsDescription: 'Enables quick alerts when users, companies, or locations are added.',
        weeklySummaryLabel: 'Weekly summary',
        weeklySummaryDescription: 'Stores the preference to show operational summaries in the panel.',
        savePreferences: 'Save preferences',
        accountTitle: 'Active account',
        accountDescription: 'Summary of the current dashboard session.',
        userLabel: 'User',
        noActiveUser: 'No active user',
        unavailable: 'Unavailable',
        roleLabel: 'Role',
        adminRole: 'Administrator',
        userRole: 'User',
        summaryTitle: 'Current summary',
        activeLanguageLabel: 'Active language',
        activeThemeLabel: 'Active theme',
        savedAlertsLabel: 'Saved alerts',
        activeAlertsCount: (count) => `${count} active`,
        preferencesSavedTitle: 'Preferences saved',
        preferencesSavedDescription: 'The panel settings were updated.',
    },
    home: {
        loadingLabel: 'Loading KPIs and charts...',
        loadingRefreshLabel: 'Refreshing indicators...',
        dashboardError: 'Dashboard statistics could not be loaded.',
        retry: 'Try again',
        closePreferences: 'Close dashboard settings',
        hiddenWidgetsTitle: 'Hidden widgets',
        hiddenWidgetsDescription: 'Re-enable at least one widget from the customization panel to restore the dashboard side context.',
    },
    widgets: {
        metricEyebrows: {
            averageScore: 'Quality',
            evaluations: 'Activity',
            activeUsers: 'Adoption',
            services: 'Supply',
        },
        widgetOptions: {
            showTopServices: {
                label: 'Top services',
                description: 'Keeps the performance ranking visible.',
            },
            showUserDistribution: {
                label: 'Operational coverage',
                description: 'Compares locations, services, companies, and POI.',
            },
            showRecentActivity: {
                label: 'Recent activity',
                description: 'Summarizes the newest evaluations without extra scroll.',
            },
        },
        headerTitle: 'Home Dashboard',
        headerSubtitle: 'Quality, activity, and adoption KPIs designed for quick reading without relying on scroll or artificial indicators.',
        personalize: 'Customize',
        refresh: 'Refresh',
        preferencesTitle: 'Dashboard settings',
        preferencesSubtitle: 'They are saved automatically in this browser.',
        reset: 'Reset',
        mainView: 'Main view',
        mixed: 'Mixed',
        volume: 'Volume',
        score: 'Score',
        visualDensity: 'Visual density',
        comfortable: 'Comfortable',
        compact: 'Compact',
        sideWidgets: 'Side widgets',
        operationalCoverageTitle: 'Operational coverage',
        monthlyPerformanceTitle: 'Monthly performance',
        evaluationsLegend: 'Evaluations',
        averageScoreLegend: 'Average score',
        mainChartEmpty: 'There is not enough history yet to build the main chart.',
        userDistributionTitle: 'User distribution',
        userDistributionEmpty: 'There are no users with available roles to show the distribution.',
        totalLabel: 'Total',
        usersLabel: (count) => `${count.toLocaleString('en-US')} users`,
        topServicesTitle: 'Top services',
        topServicesEmpty: 'When visible evaluations exist, the ranking will appear here.',
        evaluationsShort: 'eval.',
        recentActivityTitle: 'Recent activity',
        recentActivityEmpty: 'There are no recent evaluations to summarize activity yet.',
    },
    viewModel: {
        roleLabels: {
            1: 'Administration',
            2: 'Evaluators',
            3: 'Companies',
            4: 'Tourists',
        },
        roleFallback: (roleId) => `Role ${roleId}`,
        relativeMinutes: (value) => `${value} min`,
        relativeHours: (value) => `${value} h`,
        scoreOutstanding: 'Outstanding experience',
        scoreGood: 'Strong overall quality',
        scoreAttention: 'Attention zone',
        scoreImprove: 'Improvement priority',
        noHistoryTrend: 'There is not enough history yet to show a reliable trend.',
        zeroTrend: 'No monthly history has been loaded; a zero baseline is shown to preserve visual reference.',
        peakAndBestTrend: (peakMonth, bestMonth) => `Peak activity in ${peakMonth} and best score in ${bestMonth}.`,
        insightCoverageLabel: 'Coverage',
        insightQualityLabel: 'Quality',
        insightNoMonthlyHistory: 'No monthly history',
        insightWaitingEvaluations: 'Waiting for first evaluations',
        insightZeroBase: 'Monthly zero baseline',
        insightNoEvaluationsYet: 'No evaluations recorded yet',
        insightLatestCutLabel: 'Latest cut',
        insightMonthlyPeakLabel: 'Monthly peak',
        latestCutWithDelta: (month, count, delta) => `${month}: ${count} (${delta})`,
        latestCutWithoutDelta: (month, count) => `${month}: ${count} evaluations`,
        averageScoreLabel: 'Average score',
        averageScoreHelper: (scoreLabel, totalEvaluations) => `${scoreLabel} across ${totalEvaluations} evaluations`,
        evaluationsLabel: 'Evaluations',
        evaluationsHelper: (perService) => `${perService} per published service`,
        activeUsersLabel: 'Active users',
        activeUsersHelper: (activeRate, totalUsers) => `${activeRate} of ${totalUsers} registered`,
        servicesLabel: 'Services',
        servicesHelper: (perCompany) => `${perCompany} per company`,
        operationalNames: {
            locations: 'Locations',
            services: 'Services',
            companies: 'Companies',
            poi: 'POI',
        },
        distributionSummary: (count) => `${count} active profiles recorded.`,
        distributionSummaryEmpty: 'There are no users grouped by role.',
        operationalSummary: 'Measures structural coverage across locations, services, companies, and points of interest.',
        operationalSummaryEmpty: 'No inventory loaded yet; the chart stays at zero to provide baseline context.',
        topServicesSummary: (name) => `${name} leads by visible performance and volume.`,
        topServicesSummaryEmpty: 'There are no highlighted services to show yet.',
        activitySummary: (count) => `Showing the ${count} most recent available activities.`,
        activitySummaryEmpty: 'No recent activity recorded.',
        newDelta: 'new',
    },
    modules: dashboardModulesByLang.en,
};

const fr: DashboardLocale = {
    locale: 'fr-FR',
    layout: {
        routes: {
            '/dashboard': 'Accueil',
            '/dashboard/usuarios': 'Utilisateurs',
            '/dashboard/companias': 'Entreprises',
            '/dashboard/servicios': 'Services',
            '/dashboard/ubicaciones': 'Lieux',
            '/dashboard/perfiles': 'Profils',
            '/dashboard/actividades': 'Activites',
            '/dashboard/certificaciones': 'Certifications',
            '/dashboard/poi': 'Points d interet',
            '/dashboard/estadisticas': 'Statistiques',
            '/dashboard/instrumentos': 'Instruments',
            '/dashboard/configuracion': 'Configuration',
        },
        notificationTitle: 'Notifications',
        notificationEmpty: 'Aucune notification recente',
        notificationEmptyHint: 'Les actions du panneau apparaitront ici des qu elles genereront des alertes.',
        markAllRead: 'Tout marquer comme lu',
        clearAll: 'Vider',
        clearToLight: 'Mode clair',
        clearToDark: 'Mode sombre',
        justNow: 'Maintenant',
        recentLabel: 'Recent',
    },
    settings: {
        title: 'Configuration',
        subtitle: 'Preferences actives du panneau, langue et alertes internes.',
        languageTitle: 'Langue de l interface',
        languageDescription: 'Le changement est applique immediatement dans le dashboard et les parametres.',
        languageCodeLabel: 'Code',
        appearanceTitle: 'Apparence',
        appearanceDescription: 'Choisissez le mode visuel du dashboard.',
        lightLabel: 'Clair',
        lightDescription: 'Ideal pour les environnements lumineux ou les revisions rapides.',
        darkLabel: 'Sombre',
        darkDescription: 'Reduit l eblouissement et maintient un meilleur contraste pendant les longues sessions.',
        alertsTitle: 'Alertes du panneau',
        alertsDescription: 'Enregistrez les alertes que vous souhaitez garder actives dans cette session admin.',
        evaluationAlertsLabel: 'Resultats des evaluations',
        evaluationAlertsDescription: 'Garde visibles les alertes liees aux evaluations et au suivi des services.',
        registrationAlertsLabel: 'Nouveaux enregistrements',
        registrationAlertsDescription: 'Active des alertes rapides quand des utilisateurs, entreprises ou lieux sont ajoutes.',
        weeklySummaryLabel: 'Resume hebdomadaire',
        weeklySummaryDescription: 'Enregistre la preference pour afficher des resumes operationnels dans le panneau.',
        savePreferences: 'Enregistrer les preferences',
        accountTitle: 'Compte actif',
        accountDescription: 'Resume de la session actuelle du dashboard.',
        userLabel: 'Utilisateur',
        noActiveUser: 'Aucun utilisateur actif',
        unavailable: 'Indisponible',
        roleLabel: 'Role',
        adminRole: 'Administrateur',
        userRole: 'Utilisateur',
        summaryTitle: 'Resume actuel',
        activeLanguageLabel: 'Langue active',
        activeThemeLabel: 'Theme actif',
        savedAlertsLabel: 'Alertes enregistrees',
        activeAlertsCount: (count) => `${count} actives`,
        preferencesSavedTitle: 'Preferences enregistrees',
        preferencesSavedDescription: 'La configuration du panneau a ete mise a jour.',
    },
    home: {
        loadingLabel: 'Chargement des KPI et graphiques...',
        loadingRefreshLabel: 'Mise a jour des indicateurs...',
        dashboardError: 'Impossible de charger les statistiques du dashboard.',
        retry: 'Reessayer',
        closePreferences: 'Fermer les reglages du dashboard',
        hiddenWidgetsTitle: 'Widgets masques',
        hiddenWidgetsDescription: 'Reactivez au moins un widget depuis le panneau de personnalisation pour retrouver le contexte lateral du dashboard.',
    },
    widgets: {
        metricEyebrows: {
            averageScore: 'Qualite',
            evaluations: 'Activite',
            activeUsers: 'Adoption',
            services: 'Offre',
        },
        widgetOptions: {
            showTopServices: {
                label: 'Top services',
                description: 'Maintient visible le classement de performance.',
            },
            showUserDistribution: {
                label: 'Couverture operationnelle',
                description: 'Compare lieux, services, entreprises et POI.',
            },
            showRecentActivity: {
                label: 'Activite recente',
                description: 'Resume les evaluations les plus recentes sans scroll supplementaire.',
            },
        },
        headerTitle: 'Dashboard d accueil',
        headerSubtitle: 'Des KPI de qualite, d activite et d adoption concus pour etre lus rapidement sans dependre du scroll ni d indicateurs artificiels.',
        personalize: 'Personnaliser',
        refresh: 'Actualiser',
        preferencesTitle: 'Reglages du dashboard',
        preferencesSubtitle: 'Ils sont enregistres automatiquement dans ce navigateur.',
        reset: 'Reinitialiser',
        mainView: 'Vue principale',
        mixed: 'Mixte',
        volume: 'Volume',
        score: 'Score',
        visualDensity: 'Densite visuelle',
        comfortable: 'Confortable',
        compact: 'Compacte',
        sideWidgets: 'Widgets lateraux',
        operationalCoverageTitle: 'Couverture operationnelle',
        monthlyPerformanceTitle: 'Performance mensuelle',
        evaluationsLegend: 'Evaluations',
        averageScoreLegend: 'Score moyen',
        mainChartEmpty: 'Il n y a pas encore assez d historique pour construire le graphique principal.',
        userDistributionTitle: 'Repartition des utilisateurs',
        userDistributionEmpty: 'Aucun utilisateur avec roles disponibles pour afficher la repartition.',
        totalLabel: 'Total',
        usersLabel: (count) => `${count.toLocaleString('fr-FR')} utilisateurs`,
        topServicesTitle: 'Top services',
        topServicesEmpty: 'Lorsque des evaluations visibles existeront, le classement apparaitra ici.',
        evaluationsShort: 'eval.',
        recentActivityTitle: 'Activite recente',
        recentActivityEmpty: 'Il n y a pas encore d evaluations recentes a resumer.',
    },
    viewModel: {
        roleLabels: {
            1: 'Administration',
            2: 'Evaluateurs',
            3: 'Entreprises',
            4: 'Touristes',
        },
        roleFallback: (roleId) => `Role ${roleId}`,
        relativeMinutes: (value) => `${value} min`,
        relativeHours: (value) => `${value} h`,
        scoreOutstanding: 'Experience remarquable',
        scoreGood: 'Bon niveau general',
        scoreAttention: 'Zone d attention',
        scoreImprove: 'Priorite d amelioration',
        noHistoryTrend: 'Il n y a pas encore assez d historique pour afficher une tendance fiable.',
        zeroTrend: 'Aucun historique mensuel charge ; une base zero est affichee pour conserver la reference visuelle.',
        peakAndBestTrend: (peakMonth, bestMonth) => `Pic d activite en ${peakMonth} et meilleur score en ${bestMonth}.`,
        insightCoverageLabel: 'Couverture',
        insightQualityLabel: 'Qualite',
        insightNoMonthlyHistory: 'Pas d historique mensuel',
        insightWaitingEvaluations: 'En attente des premieres evaluations',
        insightZeroBase: 'Base mensuelle a zero',
        insightNoEvaluationsYet: 'Aucune evaluation enregistree pour le moment',
        insightLatestCutLabel: 'Dernier releve',
        insightMonthlyPeakLabel: 'Pic mensuel',
        latestCutWithDelta: (month, count, delta) => `${month}: ${count} (${delta})`,
        latestCutWithoutDelta: (month, count) => `${month}: ${count} evaluations`,
        averageScoreLabel: 'Score moyen',
        averageScoreHelper: (scoreLabel, totalEvaluations) => `${scoreLabel} sur ${totalEvaluations} evaluations`,
        evaluationsLabel: 'Evaluations',
        evaluationsHelper: (perService) => `${perService} par service publie`,
        activeUsersLabel: 'Utilisateurs actifs',
        activeUsersHelper: (activeRate, totalUsers) => `${activeRate} sur ${totalUsers} enregistres`,
        servicesLabel: 'Services',
        servicesHelper: (perCompany) => `${perCompany} par entreprise`,
        operationalNames: {
            locations: 'Lieux',
            services: 'Services',
            companies: 'Entreprises',
            poi: 'POI',
        },
        distributionSummary: (count) => `${count} profils actifs enregistres.`,
        distributionSummaryEmpty: 'Aucun utilisateur classe par role.',
        operationalSummary: 'Mesure la couverture structurelle entre lieux, services, entreprises et points d interet.',
        operationalSummaryEmpty: 'Aucun inventaire charge ; le graphique reste a zero pour fournir un contexte de base.',
        topServicesSummary: (name) => `${name} mene par performance et volume visible.`,
        topServicesSummaryEmpty: 'Aucun service mis en avant a afficher pour le moment.',
        activitySummary: (count) => `Affichage des ${count} activites les plus recentes disponibles.`,
        activitySummaryEmpty: 'Aucune activite recente enregistree.',
        newDelta: 'nouveau',
    },
    modules: dashboardModulesByLang.fr,
};

const DASHBOARD_TEXT: Record<LanguageCode, DashboardLocale> = { es, en, fr };

export const getDashboardText = (lang: LanguageCode) => DASHBOARD_TEXT[lang] ?? DASHBOARD_TEXT.es;
