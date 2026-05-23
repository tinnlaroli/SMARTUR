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
        widgetOptions: Record<'showTopServices' | 'showUserDistribution' | 'showRecentActivity' | 'showOperationalMix' | 'showScoreDistribution' | 'showTopCompanies', { label: string; description: string }>;
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
        scoreDistributionTitle: string;
        scoreDistributionEmpty: string;
        topCompaniesTitle: string;
        topCompaniesEmpty: string;
        servicesShort: string;
        timeRangeLabel: string;
        timeRange3m: string;
        timeRange6m: string;
        timeRange12m: string;
        timeRangeAll: string;
        /* ── Widget catalog ────────────────────────────────────────── */
        catalogTitle: string;
        catalogClose: string;
        catalogAvailable: (count: number) => string;
        catalogAllAdded: string;
        catalogAllAddedHint: string;
        catalogNewBadge: string;
        catalogSizeHint: (cols: number, rows: number) => string;
        catalogAddWidget: (label: string) => string;
        catalogCategories: Record<'analytics' | 'operations' | 'tools', string>;
        /* ── Per-widget translated labels & descriptions ───────────── */
        widgetLabels: Record<string, string>;
        widgetDescriptions: Record<string, string>;
        /* ── Edit-mode toolbar ─────────────────────────────────────── */
        editAdd: string;
        editRestore: string;
        editDone: string;
        /* ── ML Telemetry widget ───────────────────────────────────── */
        mlTelemetryTitle: string;
        mlTelemetrySubtitle: string;
        mlTelemetryLoading: string;
        mlTelemetryNoData: string;
        mlTelemetryRmse: string;
        mlTelemetryCtr: string;
        mlTelemetryLatency: string;
        mlTelemetrySessions: string;
        /* ── Coverage widget ───────────────────────────────────────── */
        coverageTitle: string;
        coverageSubtitle: string;
        coverageLocations: string;
        coverageCompanies: string;
        coverageServices: string;
        coveragePoi: string;
        /* ── B2B Funnel widget ─────────────────────────────────────── */
        b2bTitle: string;
        b2bSubtitle: string;
        b2bCompanies: string;
        b2bCompaniesLabel: string;
        b2bServices: string;
        b2bServicesLabel: string;
        b2bEvals: string;
        b2bEvalsLabel: string;
        /* ── LangSwitch widget ─────────────────────────────────────── */
        langSwitchTitle: string;
        langSwitchToDark: string;
        langSwitchToLight: string;
        /* ── WidgetShell (edit-mode overlays) ──────────────────────── */
        shellDragHintCol: string;
        shellDragHintRow: string;
        shellDragHintBoth: string;
        shellRemoveLabel: (label: string) => string;
    };
    mlObservability: {
        title: string;
        subtitle: string;
        trainBtn: string;
        trainingLabel: string;
        refreshBtn: string;
        bannerTitle: string;
        bannerDesc: string;
        errorRetry: string;
        kpiRmse: string;
        kpiRmseSub: string;
        kpiLatency: string;
        kpiLatencySub: string;
        kpiSessions: string;
        kpiSessionsSub: string;
        kpiCtr: string;
        kpiCtrSub: (clicked: number, total: number) => string;
        kpiCtrEmpty: string;
        chartTitle: string;
        chartSessionsName: string;
        tableTitle: string;
        tableSubtitle: (best: string, alpha: number, n?: number) => string;
        tableColAlgo: string;
        tableColRmse: string;
        tableColMae: string;
        tableColStatus: string;
        tagActive: string;
        tagProduction: string;
        tagReference: string;
        emptyTitle: string;
        emptyHint: string;
        emptyTrainBtn: string;
        toastTrainTitle: string;
        toastTrainDesc: string;
        toastErrorTitle: string;
        toastErrorDesc: string;
        algoLabels: Record<string, string>;
        trainTooltipActive: string;
        trainTooltipIdle: string;
        rankingTitle: string;
        rankingNdcg: string;
        rankingNdcgSub: string;
        rankingPrecision: string;
        rankingPrecisionSub: string;
        rankingHitRate: string;
        rankingHitRateSub: string;
        tableEmptyAlgosHint: string;
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
        scoreRangeSummary: (topBand: string, count: number) => string;
        scoreRangeSummaryEmpty: string;
        topCompaniesSummary: (name: string) => string;
        topCompaniesSummaryEmpty: string;
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
            '/dashboard/ml': 'ML / IA',
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
                label: 'Distribucion de usuarios',
                description: 'Muestra el desglose por rol activo en la plataforma.',
            },
            showRecentActivity: {
                label: 'Actividad reciente',
                description: 'Resume las evaluaciones mas nuevas sin scroll.',
            },
            showOperationalMix: {
                label: 'Cobertura operativa',
                description: 'Compara lugares, servicios, empresas y POI.',
            },
            showScoreDistribution: {
                label: 'Distribucion de scores',
                description: 'Clasifica los servicios por banda de calidad.',
            },
            showTopCompanies: {
                label: 'Top empresas',
                description: 'Ranking de empresas por desempeno acumulado.',
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
        scoreDistributionTitle: 'Distribucion de scores',
        scoreDistributionEmpty: 'No hay servicios con evaluaciones para mostrar distribucion.',
        topCompaniesTitle: 'Top empresas',
        topCompaniesEmpty: 'No hay empresas con evaluaciones disponibles aun.',
        servicesShort: 'serv.',
        timeRangeLabel: 'Periodo de la grafica',
        timeRange3m: '3 meses',
        timeRange6m: '6 meses',
        timeRange12m: '12 meses',
        timeRangeAll: 'Historico',
        /* ── Widget catalog ── */
        catalogTitle: 'Agregar Widget',
        catalogClose: 'Cerrar catalogo',
        catalogAvailable: (count) => `${count} disponible${count !== 1 ? 's' : ''}`,
        catalogAllAdded: 'Todos los widgets estan en el dashboard',
        catalogAllAddedHint: 'Elimina alguno desde el modo de edicion para poder volver a agregarlo.',
        catalogNewBadge: 'Nuevo',
        catalogSizeHint: (cols, rows) => `${cols} col x ${rows} fila${rows !== 1 ? 's' : ''}`,
        catalogAddWidget: (label) => `Agregar widget ${label}`,
        catalogCategories: { analytics: 'Analitica', operations: 'Operaciones', tools: 'Herramientas' },
        widgetLabels: {
            'kpi-strip':          'KPI Strip',
            'trend-chart':        'Tendencia de Actividad',
            'top-services':       'Top Servicios',
            'user-distribution':  'Distribucion de Usuarios',
            'recent-activity':    'Actividad Reciente',
            'score-distribution': 'Distribucion de Puntajes',
            'top-companies':      'Top Companias',
            'b2b-funnel':         'Embudo B2B',
            'operational-mix':    'Mix Operacional',
            'ml-telemetry':       'Telemetria IA',
            'coverage':           'Cobertura del Sistema',
            'lang-switch':        'Idioma & Tema',
        },
        widgetDescriptions: {
            'kpi-strip':          'Metricas clave del sistema: score promedio, evaluaciones, usuarios activos y servicios.',
            'trend-chart':        'Grafica mensual de evaluaciones y puntuaciones promedio con multiples modos de vista.',
            'top-services':       'Los servicios mejor evaluados, con barra de progreso de puntuacion.',
            'user-distribution':  'Proporcion de turistas, guias y administradores registrados en el sistema.',
            'recent-activity':    'Ultimas evaluaciones realizadas en el sistema con detalle de servicios y evaluadores.',
            'score-distribution': 'Histograma de rangos de calificacion para todas las evaluaciones registradas.',
            'top-companies':      'Ranking de empresas turisticas con mejor desempeno en evaluaciones.',
            'b2b-funnel':         'Conversion del pipeline empresarial: companias → servicios → evaluaciones.',
            'operational-mix':    'Distribucion de tipos de servicios: hoteles, restaurantes, tours y transporte.',
            'ml-telemetry':       'Estado del motor de recomendaciones: algoritmo activo, RMSE, CTR 30d y latencia.',
            'coverage':           'Totales de ubicaciones, servicios, empresas y puntos de interes registrados.',
            'lang-switch':        'Cambia rapidamente el idioma de la interfaz y el tema visual (claro/oscuro).',
        },
        /* ── Edit-mode toolbar ── */
        editAdd: 'Agregar',
        editRestore: 'Restaurar',
        editDone: 'Listo',
        /* ── ML Telemetry widget ── */
        mlTelemetryTitle: 'Telemetria IA',
        mlTelemetrySubtitle: 'Motor de recomendaciones',
        mlTelemetryLoading: 'cargando...',
        mlTelemetryNoData: 'sin datos',
        mlTelemetryRmse: 'RMSE',
        mlTelemetryCtr: 'CTR 30d',
        mlTelemetryLatency: 'Latencia',
        mlTelemetrySessions: 'Sesiones',
        /* ── Coverage widget ── */
        coverageTitle: 'Cobertura del Sistema',
        coverageSubtitle: 'Geografia & servicios registrados',
        coverageLocations: 'Ubicaciones',
        coverageCompanies: 'Companias',
        coverageServices: 'Servicios',
        coveragePoi: 'Puntos de Interes',
        /* ── B2B Funnel ── */
        b2bTitle: 'Embudo B2B',
        b2bSubtitle: 'Conversion del pipeline empresarial',
        b2bCompanies: 'Companias',
        b2bCompaniesLabel: 'empresas registradas',
        b2bServices: 'Servicios',
        b2bServicesLabel: 'ofertas turisticas',
        b2bEvals: 'Evaluaciones',
        b2bEvalsLabel: 'calificaciones registradas',
        /* ── LangSwitch ── */
        langSwitchTitle: 'Idioma & Tema',
        langSwitchToDark: 'Cambiar a oscuro',
        langSwitchToLight: 'Cambiar a claro',
        /* ── WidgetShell ── */
        shellDragHintCol: 'Arrastra para cambiar ancho',
        shellDragHintRow: 'Arrastra para cambiar alto',
        shellDragHintBoth: 'Arrastra para cambiar tamano',
        shellRemoveLabel: (label) => `Eliminar widget ${label}`,
    },
    mlObservability: {
        title: 'ML / Observabilidad IA',
        subtitle: 'Estado del motor de recomendaciones hibrido (CF + RF)',
        trainBtn: 'Entrenar modelo',
        trainingLabel: 'Entrenando en segundo plano...',
        refreshBtn: 'Actualizar',
        bannerTitle: 'Recoleccion de datos activa',
        bannerDesc: 'La app movil envia senales implicitas (tiempo en pantalla, favoritos, filtros seleccionados) y calificaciones explicitas (1-5 estrellas). Estos datos alimentan el motor de Collaborative Filtering. El modelo se retroalimenta automaticamente al re-entrenarse con las tablas user_interaction y user_rating.',
        errorRetry: 'Reintentar',
        kpiRmse: 'Mejor RMSE almacenado',
        kpiRmseSub: 'Menor = mejor prediccion',
        kpiLatency: 'Latencia promedio (30d)',
        kpiLatencySub: 'Por solicitud de recomendacion',
        kpiSessions: 'Sesiones totales (30d)',
        kpiSessionsSub: 'Solicitudes de recomendacion',
        kpiCtr: 'Click-through rate (30d)',
        kpiCtrSub: (clicked, total) => `${clicked} clicks / ${total} recomendaciones`,
        kpiCtrEmpty: 'Sin datos aun',
        chartTitle: 'Sesiones de recomendacion — ultimos 30 dias',
        chartSessionsName: 'Sesiones',
        tableTitle: 'Comparacion de algoritmos',
        tableSubtitle: (best, alpha, n) =>
            `En produccion: ${best} · α = ${alpha}${n != null ? ` · n = ${n.toLocaleString('es-MX')}` : ''}`,
        tableColAlgo: 'Algoritmo',
        tableColRmse: 'RMSE ↓',
        tableColMae: 'MAE ↓',
        tableColStatus: 'Estado',
        tagActive: 'ACTIVO',
        tagProduction: 'En produccion',
        tagReference: 'Referencia',
        emptyTitle: 'Sin metricas almacenadas',
        emptyHint: 'Las metricas apareceran la primera vez que el MODELO entrene y persista su estado en la base de datos.',
        emptyTrainBtn: 'Iniciar primer entrenamiento',
        toastTrainTitle: 'Entrenamiento iniciado',
        toastTrainDesc: 'El modelo esta re-entrenando en segundo plano. Los resultados se actualizaran automaticamente en ~3 minutos.',
        toastErrorTitle: 'Error',
        toastErrorDesc: 'No se pudo iniciar el entrenamiento.',
        algoLabels: {
            baseline:          'Baseline (media global)',
            cf_knn_pearson:    'CF Pearson KNN',
            random_forest:     'Random Forest',
            gradient_boosting: 'Gradient Boosting',
            hybrid_cf_rf:      'Hibrido CF + RF',
            hybrid_triple:     'Hibrido Triple',
        },
        trainTooltipActive: 'Entrenamiento en curso — espera ~3 minutos antes de volver a entrenar',
        trainTooltipIdle: 'Entrenar modelo',
        rankingTitle: 'Metricas de ranking (test set)',
        rankingNdcg: 'NDCG@5',
        rankingNdcgSub: 'Calidad del orden de recomendaciones',
        rankingPrecision: 'Precision@5',
        rankingPrecisionSub: 'Relevantes en el top-5',
        rankingHitRate: 'Hit Rate@10',
        rankingHitRateSub: 'Usuarios con al menos 1 acierto en top-10',
        tableEmptyAlgosHint: 'El modelo entrenó pero no hubo datos suficientes para calcular métricas. Vuelve a entrenar cuando haya más interacciones.',
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
        scoreRangeSummary: (topBand, count) => `${count} servicio(s) en la banda "${topBand}".`,
        scoreRangeSummaryEmpty: 'Sin servicios evaluados para clasificar.',
        topCompaniesSummary: (name) => `${name} lidera el ranking por calidad acumulada.`,
        topCompaniesSummaryEmpty: 'Aun no hay empresas con evaluaciones visibles.',
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
            '/dashboard/ml': 'ML / AI',
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
                label: 'User distribution',
                description: 'Shows the active user breakdown by role.',
            },
            showRecentActivity: {
                label: 'Recent activity',
                description: 'Summarizes the newest evaluations without extra scroll.',
            },
            showOperationalMix: {
                label: 'Operational coverage',
                description: 'Compares locations, services, companies, and POI.',
            },
            showScoreDistribution: {
                label: 'Score distribution',
                description: 'Classifies services by quality band.',
            },
            showTopCompanies: {
                label: 'Top companies',
                description: 'Company ranking by cumulative performance.',
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
        scoreDistributionTitle: 'Score distribution',
        scoreDistributionEmpty: 'No evaluated services to display distribution.',
        topCompaniesTitle: 'Top companies',
        topCompaniesEmpty: 'No companies with visible evaluations yet.',
        servicesShort: 'serv.',
        timeRangeLabel: 'Chart period',
        timeRange3m: '3 months',
        timeRange6m: '6 months',
        timeRange12m: '12 months',
        timeRangeAll: 'All time',
        /* ── Widget catalog ── */
        catalogTitle: 'Add Widget',
        catalogClose: 'Close catalog',
        catalogAvailable: (count) => `${count} available`,
        catalogAllAdded: 'All widgets are on the dashboard',
        catalogAllAddedHint: 'Remove one in edit mode to add it back.',
        catalogNewBadge: 'New',
        catalogSizeHint: (cols, rows) => `${cols} col x ${rows} row${rows !== 1 ? 's' : ''}`,
        catalogAddWidget: (label) => `Add ${label} widget`,
        catalogCategories: { analytics: 'Analytics', operations: 'Operations', tools: 'Tools' },
        widgetLabels: {
            'kpi-strip':          'KPI Strip',
            'trend-chart':        'Activity Trend',
            'top-services':       'Top Services',
            'user-distribution':  'User Distribution',
            'recent-activity':    'Recent Activity',
            'score-distribution': 'Score Distribution',
            'top-companies':      'Top Companies',
            'b2b-funnel':         'B2B Funnel',
            'operational-mix':    'Operational Mix',
            'ml-telemetry':       'AI Telemetry',
            'coverage':           'System Coverage',
            'lang-switch':        'Language & Theme',
        },
        widgetDescriptions: {
            'kpi-strip':          'Key system metrics: average score, evaluations, active users, and services.',
            'trend-chart':        'Monthly evaluations and average score chart with multiple view modes.',
            'top-services':       'Top-rated services with score progress bars.',
            'user-distribution':  'Proportion of tourists, guides, and administrators in the system.',
            'recent-activity':    'Latest evaluations with service and reviewer details.',
            'score-distribution': 'Histogram of rating ranges for all recorded evaluations.',
            'top-companies':      'Tourism companies ranked by evaluation performance.',
            'b2b-funnel':         'Business pipeline conversion: companies to services to evaluations.',
            'operational-mix':    'Breakdown of service types: hotels, restaurants, tours, and transport.',
            'ml-telemetry':       'Recommendation engine status: active algorithm, RMSE, 30d CTR, and latency.',
            'coverage':           'Total locations, services, companies, and points of interest.',
            'lang-switch':        'Quickly switch the interface language and visual theme (light/dark).',
        },
        /* ── Edit-mode toolbar ── */
        editAdd: 'Add',
        editRestore: 'Reset layout',
        editDone: 'Done',
        /* ── ML Telemetry widget ── */
        mlTelemetryTitle: 'AI Telemetry',
        mlTelemetrySubtitle: 'Recommendation engine',
        mlTelemetryLoading: 'loading...',
        mlTelemetryNoData: 'no data',
        mlTelemetryRmse: 'RMSE',
        mlTelemetryCtr: 'CTR 30d',
        mlTelemetryLatency: 'Latency',
        mlTelemetrySessions: 'Sessions',
        /* ── Coverage widget ── */
        coverageTitle: 'System Coverage',
        coverageSubtitle: 'Geography & registered services',
        coverageLocations: 'Locations',
        coverageCompanies: 'Companies',
        coverageServices: 'Services',
        coveragePoi: 'Points of Interest',
        /* ── B2B Funnel ── */
        b2bTitle: 'B2B Funnel',
        b2bSubtitle: 'Business pipeline conversion',
        b2bCompanies: 'Companies',
        b2bCompaniesLabel: 'registered companies',
        b2bServices: 'Services',
        b2bServicesLabel: 'tourism offerings',
        b2bEvals: 'Evaluations',
        b2bEvalsLabel: 'recorded ratings',
        /* ── LangSwitch ── */
        langSwitchTitle: 'Language & Theme',
        langSwitchToDark: 'Switch to dark',
        langSwitchToLight: 'Switch to light',
        /* ── WidgetShell ── */
        shellDragHintCol: 'Drag to resize width',
        shellDragHintRow: 'Drag to resize height',
        shellDragHintBoth: 'Drag to resize',
        shellRemoveLabel: (label) => `Remove ${label} widget`,
    },
    mlObservability: {
        title: 'ML / AI Observability',
        subtitle: 'Hybrid recommendation engine status (CF + RF)',
        trainBtn: 'Train model',
        trainingLabel: 'Training in background...',
        refreshBtn: 'Refresh',
        bannerTitle: 'Active data collection',
        bannerDesc: 'The mobile app sends implicit signals (screen time, favorites, selected filters) and explicit ratings (1-5 stars). This data feeds the Collaborative Filtering engine. The model self-improves when retrained with the user_interaction and user_rating tables.',
        errorRetry: 'Try again',
        kpiRmse: 'Best stored RMSE',
        kpiRmseSub: 'Lower = better prediction',
        kpiLatency: 'Avg latency (30d)',
        kpiLatencySub: 'Per recommendation request',
        kpiSessions: 'Total sessions (30d)',
        kpiSessionsSub: 'Recommendation requests',
        kpiCtr: 'Click-through rate (30d)',
        kpiCtrSub: (clicked, total) => `${clicked} clicks / ${total} recommendations`,
        kpiCtrEmpty: 'No data yet',
        chartTitle: 'Recommendation sessions — last 30 days',
        chartSessionsName: 'Sessions',
        tableTitle: 'Algorithm comparison',
        tableSubtitle: (best, alpha, n) =>
            `In production: ${best} · α = ${alpha}${n != null ? ` · n = ${n.toLocaleString('en-US')}` : ''}`,
        tableColAlgo: 'Algorithm',
        tableColRmse: 'RMSE ↓',
        tableColMae: 'MAE ↓',
        tableColStatus: 'Status',
        tagActive: 'ACTIVE',
        tagProduction: 'In production',
        tagReference: 'Reference',
        emptyTitle: 'No stored metrics',
        emptyHint: 'Metrics will appear the first time the MODEL trains and persists its state to the database.',
        emptyTrainBtn: 'Start first training',
        toastTrainTitle: 'Training started',
        toastTrainDesc: 'The model is retraining in the background. Results will auto-update in ~3 minutes.',
        toastErrorTitle: 'Error',
        toastErrorDesc: 'Could not start training.',
        algoLabels: {
            baseline:          'Baseline (global mean)',
            cf_knn_pearson:    'CF Pearson KNN',
            random_forest:     'Random Forest',
            gradient_boosting: 'Gradient Boosting',
            hybrid_cf_rf:      'Hybrid CF + RF',
            hybrid_triple:     'Triple Hybrid',
        },
        trainTooltipActive: 'Training in progress — wait ~3 minutes before retraining',
        trainTooltipIdle: 'Train model',
        rankingTitle: 'Ranking metrics (test set)',
        rankingNdcg: 'NDCG@5',
        rankingNdcgSub: 'Quality of recommendation ordering',
        rankingPrecision: 'Precision@5',
        rankingPrecisionSub: 'Relevant items in top-5',
        rankingHitRate: 'Hit Rate@10',
        rankingHitRateSub: 'Users with at least 1 hit in top-10',
        tableEmptyAlgosHint: 'The model trained but there was not enough data to compute metrics. Retrain once more interactions have accumulated.',
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
        scoreRangeSummary: (topBand, count) => `${count} service(s) in the "${topBand}" band.`,
        scoreRangeSummaryEmpty: 'No evaluated services to classify.',
        topCompaniesSummary: (name) => `${name} leads the ranking by cumulative quality.`,
        topCompaniesSummaryEmpty: 'No companies with visible evaluations yet.',
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
            '/dashboard/ml': 'ML / IA',
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
                label: 'Repartition utilisateurs',
                description: 'Affiche la repartition des utilisateurs actifs par role.',
            },
            showRecentActivity: {
                label: 'Activite recente',
                description: 'Resume les evaluations les plus recentes sans scroll supplementaire.',
            },
            showOperationalMix: {
                label: 'Couverture operationnelle',
                description: 'Compare lieux, services, entreprises et POI.',
            },
            showScoreDistribution: {
                label: 'Distribution des scores',
                description: 'Classe les services par bande de qualite.',
            },
            showTopCompanies: {
                label: 'Top entreprises',
                description: 'Classement des entreprises par performance cumulee.',
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
        scoreDistributionTitle: 'Distribution des scores',
        scoreDistributionEmpty: 'Aucun service evalue pour afficher la distribution.',
        topCompaniesTitle: 'Top entreprises',
        topCompaniesEmpty: 'Aucune entreprise avec des evaluations visibles pour le moment.',
        servicesShort: 'serv.',
        timeRangeLabel: 'Periode du graphique',
        timeRange3m: '3 mois',
        timeRange6m: '6 mois',
        timeRange12m: '12 mois',
        timeRangeAll: 'Historique',
        /* ── Widget catalog ── */
        catalogTitle: 'Ajouter un widget',
        catalogClose: 'Fermer le catalogue',
        catalogAvailable: (count) => `${count} disponible${count !== 1 ? 's' : ''}`,
        catalogAllAdded: 'Tous les widgets sont sur le tableau de bord',
        catalogAllAddedHint: 'Supprimez-en un en mode edition pour le rajouter.',
        catalogNewBadge: 'Nouveau',
        catalogSizeHint: (cols, rows) => `${cols} col x ${rows} ligne${rows !== 1 ? 's' : ''}`,
        catalogAddWidget: (label) => `Ajouter le widget ${label}`,
        catalogCategories: { analytics: 'Analytique', operations: 'Operations', tools: 'Outils' },
        widgetLabels: {
            'kpi-strip':          'KPI Strip',
            'trend-chart':        'Tendance d activite',
            'top-services':       'Top services',
            'user-distribution':  'Repartition des utilisateurs',
            'recent-activity':    'Activite recente',
            'score-distribution': 'Distribution des scores',
            'top-companies':      'Top entreprises',
            'b2b-funnel':         'Entonnoir B2B',
            'operational-mix':    'Mix operationnel',
            'ml-telemetry':       'Telemetrie IA',
            'coverage':           'Couverture du systeme',
            'lang-switch':        'Langue & Theme',
        },
        widgetDescriptions: {
            'kpi-strip':          'Indicateurs cles : score moyen, evaluations, utilisateurs actifs et services.',
            'trend-chart':        'Graphique mensuel des evaluations et scores avec plusieurs modes d affichage.',
            'top-services':       'Services les mieux evalues avec barres de progression.',
            'user-distribution':  'Proportion de touristes, guides et administrateurs enregistres.',
            'recent-activity':    'Dernieres evaluations avec details des services et evaluateurs.',
            'score-distribution': 'Histogramme des plages de notes pour toutes les evaluations.',
            'top-companies':      'Classement des entreprises touristiques par performance.',
            'b2b-funnel':         'Conversion du pipeline : entreprises vers services vers evaluations.',
            'operational-mix':    'Repartition des types de services : hotels, restaurants, circuits et transport.',
            'ml-telemetry':       'Etat du moteur de recommandations : algorithme actif, RMSE, CTR 30j et latence.',
            'coverage':           'Total des lieux, services, entreprises et points d interet enregistres.',
            'lang-switch':        'Changer rapidement la langue et le theme visuel (clair/sombre).',
        },
        /* ── Edit-mode toolbar ── */
        editAdd: 'Ajouter',
        editRestore: 'Reinitialiser',
        editDone: 'Terminer',
        /* ── ML Telemetry widget ── */
        mlTelemetryTitle: 'Telemetrie IA',
        mlTelemetrySubtitle: 'Moteur de recommandations',
        mlTelemetryLoading: 'chargement...',
        mlTelemetryNoData: 'sans donnees',
        mlTelemetryRmse: 'RMSE',
        mlTelemetryCtr: 'CTR 30j',
        mlTelemetryLatency: 'Latence',
        mlTelemetrySessions: 'Sessions',
        /* ── Coverage widget ── */
        coverageTitle: 'Couverture du systeme',
        coverageSubtitle: 'Geographie & services enregistres',
        coverageLocations: 'Lieux',
        coverageCompanies: 'Entreprises',
        coverageServices: 'Services',
        coveragePoi: 'Points d interet',
        /* ── B2B Funnel ── */
        b2bTitle: 'Entonnoir B2B',
        b2bSubtitle: 'Conversion du pipeline entreprise',
        b2bCompanies: 'Entreprises',
        b2bCompaniesLabel: 'entreprises enregistrees',
        b2bServices: 'Services',
        b2bServicesLabel: 'offres touristiques',
        b2bEvals: 'Evaluations',
        b2bEvalsLabel: 'evaluations enregistrees',
        /* ── LangSwitch ── */
        langSwitchTitle: 'Langue & Theme',
        langSwitchToDark: 'Passer en sombre',
        langSwitchToLight: 'Passer en clair',
        /* ── WidgetShell ── */
        shellDragHintCol: 'Glisser pour changer la largeur',
        shellDragHintRow: 'Glisser pour changer la hauteur',
        shellDragHintBoth: 'Glisser pour redimensionner',
        shellRemoveLabel: (label) => `Supprimer le widget ${label}`,
    },
    mlObservability: {
        title: 'ML / Observabilite IA',
        subtitle: 'Etat du moteur de recommandations hybride (CF + RF)',
        trainBtn: 'Entrainer le modele',
        trainingLabel: 'Entrainement en arriere-plan...',
        refreshBtn: 'Actualiser',
        bannerTitle: 'Collecte de donnees active',
        bannerDesc: 'L application mobile envoie des signaux implicites (temps d ecran, favoris, filtres selectionnes) et des notes explicites (1 a 5 etoiles). Ces donnees alimentent le moteur de Filtrage Collaboratif. Le modele se retro-alimente automatiquement lors du reentrainement avec les tables user_interaction et user_rating.',
        errorRetry: 'Reessayer',
        kpiRmse: 'Meilleur RMSE stocke',
        kpiRmseSub: 'Plus bas = meilleure prediction',
        kpiLatency: 'Latence moyenne (30j)',
        kpiLatencySub: 'Par requete de recommandation',
        kpiSessions: 'Sessions totales (30j)',
        kpiSessionsSub: 'Requetes de recommandation',
        kpiCtr: 'Taux de clics (30j)',
        kpiCtrSub: (clicked, total) => `${clicked} clics / ${total} recommandations`,
        kpiCtrEmpty: 'Aucune donnee',
        chartTitle: 'Sessions de recommandation — 30 derniers jours',
        chartSessionsName: 'Sessions',
        tableTitle: 'Comparaison des algorithmes',
        tableSubtitle: (best, alpha, n) =>
            `En production : ${best} · α = ${alpha}${n != null ? ` · n = ${n.toLocaleString('fr-FR')}` : ''}`,
        tableColAlgo: 'Algorithme',
        tableColRmse: 'RMSE ↓',
        tableColMae: 'MAE ↓',
        tableColStatus: 'Statut',
        tagActive: 'ACTIF',
        tagProduction: 'En production',
        tagReference: 'Reference',
        emptyTitle: 'Aucune metrique stockee',
        emptyHint: 'Les metriques apparaitront la premiere fois que le MODELE s entrainera et persistera son etat en base de donnees.',
        emptyTrainBtn: 'Demarrer le premier entrainement',
        toastTrainTitle: 'Entrainement demarre',
        toastTrainDesc: 'Le modele se reentrainement en arriere-plan. Les resultats se mettront a jour automatiquement en ~3 minutes.',
        toastErrorTitle: 'Erreur',
        toastErrorDesc: 'Impossible de demarrer l entrainement.',
        algoLabels: {
            baseline:          'Ligne de base (moyenne globale)',
            cf_knn_pearson:    'CF Pearson KNN',
            random_forest:     'Foret aleatoire',
            gradient_boosting: 'Gradient Boosting',
            hybrid_cf_rf:      'Hybride CF + RF',
            hybrid_triple:     'Hybride triple',
        },
        trainTooltipActive: 'Entrainement en cours — attendez ~3 minutes avant de reentrainer',
        trainTooltipIdle: 'Entrainer le modele',
        rankingTitle: 'Metriques de classement (jeu de test)',
        rankingNdcg: 'NDCG@5',
        rankingNdcgSub: 'Qualite de l ordre des recommandations',
        rankingPrecision: 'Precision@5',
        rankingPrecisionSub: 'Elements pertinents dans le top-5',
        rankingHitRate: 'Taux de succes@10',
        rankingHitRateSub: 'Utilisateurs avec au moins 1 succes dans le top-10',
        tableEmptyAlgosHint: 'Le modele a ete entraine mais les donnees etaient insuffisantes pour calculer les metriques. Reentrainez quand plus d interactions seront disponibles.',
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
        scoreRangeSummary: (topBand, count) => `${count} service(s) dans la bande "${topBand}".`,
        scoreRangeSummaryEmpty: 'Aucun service evalue a classifier.',
        topCompaniesSummary: (name) => `${name} mene le classement par qualite cumulee.`,
        topCompaniesSummaryEmpty: 'Aucune entreprise avec des evaluations visibles.',
    },
    modules: dashboardModulesByLang.fr,
};

const DASHBOARD_TEXT: Record<LanguageCode, DashboardLocale> = { es, en, fr };

export const getDashboardText = (lang: LanguageCode) => DASHBOARD_TEXT[lang] ?? DASHBOARD_TEXT.es;
