import type { LanguageCode } from '../../contexts/LanguageContext';
import type { DashboardModalsLocale } from './dashboardModalsLocale';
import { dashboardModalsByLang } from './dashboardModalsLocale';

export type DashboardModules = {
    common: {
        retry: string;
        delete: string;
        deleteCount: (n: number) => string;
        confirmDeleteUsers: (n: number) => string;
        confirmDeleteUsersMsg: (n: number) => string;
        confirmDeleteCompanies: (n: number) => string;
        confirmDeleteCompaniesMsg: (n: number) => string;
        confirmDeleteLocations: (n: number) => string;
        confirmDeleteLocationsMsg: (n: number) => string;
        confirmDeleteServices: (n: number) => string;
        confirmDeleteServicesMsg: (n: number) => string;
        confirmDeleteActivities: (n: number) => string;
        confirmDeleteActivitiesMsg: (n: number) => string;
        confirmDeleteContacts: (n: number) => string;
        confirmDeleteContactsMsg: (n: number) => string;
        confirmDeleteInstrument: string;
    };
    pagination: {
        firstPage: string;
        prevPage: string;
        nextPage: string;
        lastPage: string;
        goToPage: (p: number) => string;
        show: string;
        perPage: string;
        of: string;
        range: (from: number, to: number, total: number) => string;
    };
    users: {
        title: string;
        subtitle: string;
        add: string;
        searchPlaceholder: string;
        bannerTitle: string;
        bannerDescription: string;
    };
    companies: {
        title: string;
        subtitle: string;
        add: string;
        searchPlaceholder: string;
        bannerTitle: string;
        bannerDescription: string;
    };
    locations: {
        title: string;
        subtitle: string;
        add: string;
        searchPlaceholder: string;
        bannerTitle: string;
        bannerDescription: string;
    };
    touristServices: {
        title: string;
        subtitle: string;
        add: string;
        evaluate: string;
        searchPlaceholder: string;
    };
    profiles: {
        title: string;
        subtitle: string;
        empty: string;
        colOrder: string;
        colUser: string;
        colTravelType: string;
        colInterests: string;
        colPreferences: string;
        colAccessibility: string;
        userFallback: (id: number) => string;
        years: (age: number) => string;
        travelTypes: Record<'solo' | 'pareja' | 'familia' | 'amigos', string>;
        placeTypes: Record<'aire' | 'cerrado' | 'indiferente', string>;
        profileRegistered: string;
        visitedBefore: string;
        firstVisit: string;
        prioritizesSustainability: string;
        noSustainablePriority: string;
        activityLevel: (level: string | number) => string;
        requiresAccessibility: string;
        noSpecialRequirements: string;
        restrictionsPrefix: string;
        notAvailable: string;
        bannerTitle: string;
        bannerDescription: string;
        // Detail modal
        tabProfile: string;
        tabSessions: string;
        tabRecommendations: string;
        demographics: string;
        noSessions: string;
        unknownDevice: string;
        lastActivity: string;
        sessionActive: string;
        sessionExpired: string;
        sessionRevoked: string;
        noRecommendations: string;
        recoDestinations: (total: number, clicked: number) => string;
        clickedLabel: string;
    };
    activities: {
        title: string;
        subtitle: string;
        empty: string;
        searchPlaceholder: string;
        colOrder: string;
        colCompany: string;
        colProduction: string;
        colEnvImpact: string;
        colSocialImpact: string;
        impactLowEnv: string;
        impactLowSocial: string;
        bannerTitle: string;
        bannerDescription: string;
    };
    certifications: {
        title: string;
        subtitle: string;
        empty: string;
        org: string;
        expires: string;
        noDate: string;
        activate: string;
        deactivate: string;
        evidence: string;
        bannerTitle: string;
        bannerDescription: string;
    };
    poi: {
        title: string;
        subtitle: string;
        empty: string;
        searchPlaceholder: string;
        colName: string;
        colDescription: string;
        colType: string;
        colSustainable: string;
        noDescription: string;
        badgeSustainable: string;
        badgeStandard: string;
    };
    statistics: {
        title: string;
        subtitle: string;
        tabExpenditure: string;
        tabEmployment: string;
        tabCarbon: string;
        panelExpenditure: string;
        panelEmployment: string;
        panelCarbon: string;
        formHint: string;
        saving: string;
        btnSaveExpense: string;
        btnRegisterEmployee: string;
        btnSaveIndicators: string;
        expType: string;
        expTypePh: string;
        amount: string;
        amountPh: string;
        destination: string;
        destinationPh: string;
        position: string;
        positionPh: string;
        contractType: string;
        contractFull: string;
        contractHalf: string;
        contractTemporal: string;
        gender: string;
        genderMale: string;
        genderFemale: string;
        genderNb: string;
        genderPreferNot: string;
        salary: string;
        salaryPh: string;
        inputType: string;
        inputElectric: string;
        inputWater: string;
        inputGas: string;
        consumption: string;
        consumptionPh: string;
        carbon: string;
        carbonPh: string;
        cost: string;
        costPh: string;
        // KPI labels
        kpiRecords: string;
        kpiTotalAmount: string;
        kpiAvgPerRecord: string;
        kpiMostFrequentType: string;
        kpiRegisteredJobs: string;
        kpiAvgSalary: string;
        kpiTotalPayroll: string;
        kpiFullTime: string;
        kpiTotalCO2: string;
        kpiTotalCost: string;
        kpiFrequentInput: string;
        // Table headers
        tableTourist: string;
        tableExpType: string;
        tableAmount: string;
        tableDestination: string;
        tableDate: string;
        tableCompany: string;
        tablePosition: string;
        tableContract: string;
        tableGender: string;
        tableSalary: string;
        tableInput: string;
        tableConsumption: string;
        tableCO2: string;
        tableCost: string;
        // Select placeholders
        selectType: string;
        selectDestination: string;
        selectCompany: string;
        loadingLocations: string;
        loadingCompanies: string;
        company: string;
        co2kg: string;
        noProfiles: string;
        inputSolidWaste: string;
        inputOther: string;
    };
    modals: DashboardModalsLocale;
    templates: {
        title: string;
        subtitle: string;
        new: string;
        empty: string;
        edit: string;
    };
    form: {
        step1: {
            title: string;
            subtitle: string;
            ageRange: {
                label: string;
                ages_18_24: string;
                ages_25_34: string;
                ages_35_44: string;
                ages_45_54: string;
                ages_55_plus: string;
            };
            budgetLabel: string;
            budgetOptions: {
                economic: string;
                economicRange: string;
                moderate: string;
                moderateRange: string;
                premium: string;
                premiumRange: string;
            };
            durationLabel: string;
            durationOptions: {
                days_1_2: string;
                days_3_5: string;
                days_6_10: string;
                days_10_plus: string;
            };
            cta: string;
        };
        step2: {
            title: string;
            subtitle: string;
            tourismTypesLabel: string;
            activityLevelLabel: string;
            placePreferenceLabel: string;
            optional: string;
            back: string;
            next: string;
            tourismTypes: {
                nature: string;
                adventure: string;
                gastronomy: string;
                cultural: string;
                rural: string;
            };
            activityLevels: {
                veryRelaxed: string;
                relaxed: string;
                moderate: string;
                active: string;
                veryActive: string;
            };
            placePreferences: {
                outdoor: string;
                indoor: string;
                indifferent: string;
            };
        };
        step3: {
            title: string;
            subtitle: string;
            groupLabel: string;
            servicesLabel: string;
            back: string;
            next: string;
            groupOptions: {
                solo: string;
                couple: string;
                family: string;
                friends: string;
            };
            serviceOptions: {
                lodging: string;
                transport: string;
                food: string;
                tours: string;
            };
        };
        step4: {
            loadingTitle: string;
            loadingSubtitle: string;
            errorTitle: string;
            retry: string;
            title: string;
            subtitle: string;
            accessibilityLabel: string;
            accessibilityPlaceholder: string;
            visitedLabel: string;
            back: string;
            finish: string;
            yes: string;
            no: string;
            loginRequired: string;
            noRecommendations: string;
        };
        results: {
            shareSuccessTitle: string;
            shareSuccessBody: string;
            copySuccessTitle: string;
            copySuccessBody: string;
            shareUnavailableTitle: string;
            shareUnavailableBody: string;
            shareErrorTitle: string;
            shareErrorBody: string;
            headerTitle: string;
            headerSubtitle: string;
            recommendedPlacesBadge: (count: number) => string;
            locatedPlacesBadge: (count: number, total: number) => string;
            selectedBadge: (title: string) => string;
            mapHint: string;
            mapReset: string;
            popupTitleFallback: string;
            popupScoreLabel: (score: string) => string;
            mapPanelTitle: string;
            mapPanelLoading: string;
            mapPanelStats: (visible: number, total: number) => string;
            mapPanelFocus: (rank: number) => string;
            mapPanelActive: (title: string) => string;
            mapPanelEmpty: string;
            mapStatusTitle: string;
            mapStatusLoading: string;
            mapStatusError: string;
            mapStatusReady: string;
            listTitle: string;
            listSubtitle: string;
            imageAlt: string;
            recommendationLabel: (rank: number) => string;
            recommendationFallback: string;
            mapVisible: string;
            mapUnavailable: string;
            descriptionFallback: string;
            locationFallback: string;
            focusLabel: string;
            selectedLabel: string;
            viewOnMapLabel: string;
            download: string;
            share: string;
            finish: string;
            shareServiceLabel: string;
            sharePoiLabel: string;
        };
    };
    contacts: {
        title: string;
        subtitle: string;
        bannerTitle: string;
        bannerDescription: string;
        emptyTitle: string;
        recordsLabel: (n: number) => string;
        tableEmail: string;
        tableReason: string;
        tableMessage: string;
        tableSource: string;
        tableStatus: string;
        tableDate: string;
        statusLabels: Record<'pending' | 'in_progress' | 'done' | 'dismissed', string>;
        sourceLabels: Record<string, string>;
        reasonLabels: Record<string, string>;
        statusUpdateErrorTitle: string;
        statusUpdateErrorBody: string;
        deleteSuccessTitle: string;
        deleteSuccessBody: (n: number) => string;
        detailMessageLabel: string;
        detailNoMessage: string;
        detailStatusLabel: string;
        detailClose: string;
    };
    instruments: {
        builderTitle: string;
        builderSubtitle: string;
        newButton: string;
        loadError: string;
        createError: string;
        toggleError: string;
        deleteError: string;
        searchPlaceholder: string;
        empty: string;
        colName: string;
        colService: string;
        colVersion: string;
        colStatus: string;
        colActions: string;
        active: string;
        inactive: string;
        edit: string;
        delete: string;
        emptyNoResults: string;
        emptyHintNoResults: string;
        emptyDefaultTitle: string;
        emptyDefaultHint: string;
        toggleActivate: string;
        toggleDeactivate: string;
        createdPrefix: string;
        modalNewTitle: string;
        modalNewSubtitle: string;
        fieldName: string;
        fieldVersion: string;
        fieldService: string;
        selectPlaceholder: string;
        checkboxActive: string;
        cancel: string;
        create: string;
        closeAria: string;
    };
};

const es: DashboardModules = {
    common: {
        retry: 'Reintentar',
        delete: 'Eliminar',
        deleteCount: (n) => `Eliminar (${n})`,
        confirmDeleteUsers: (n) => `¿Eliminar ${n} usuario(s)?`,
        confirmDeleteUsersMsg: (n) => `Se eliminarán ${n} usuario(s) de forma permanente.`,
        confirmDeleteCompanies: (n) => `¿Eliminar ${n} compañía(s)?`,
        confirmDeleteCompaniesMsg: (n) => `Se eliminarán ${n} compañía(s) de forma permanente.`,
        confirmDeleteLocations: (n) => `¿Eliminar ${n} ubicación(es)?`,
        confirmDeleteLocationsMsg: (n) => `Se eliminarán ${n} ubicación(es) de forma permanente.`,
        confirmDeleteServices: (n) => `¿Eliminar ${n} servicio(s)?`,
        confirmDeleteServicesMsg: (n) => `Se eliminarán ${n} servicio(s) de forma permanente.`,
        confirmDeleteActivities: (n) => `¿Eliminar ${n} actividad(es)?`,
        confirmDeleteActivitiesMsg: (n) => `Se eliminarán ${n} actividad(es) de forma permanente.`,
        confirmDeleteContacts: (n) => `¿Eliminar ${n} contacto(s)?`,
        confirmDeleteContactsMsg: (n) => `Se eliminarán ${n} contacto(s) de forma permanente.`,
        confirmDeleteInstrument: '¿Eliminar este instrumento?',
    },
    pagination: {
        firstPage: 'Primera página',
        prevPage: 'Página anterior',
        nextPage: 'Página siguiente',
        lastPage: 'Última página',
        goToPage: (p) => `Ir a página ${p}`,
        show: 'Mostrar',
        perPage: 'por página',
        of: 'de',
        range: (from, to, total) => `${from} - ${to} de ${total}`,
    },
    users: {
        title: 'Usuarios',
        subtitle: 'Gestión de cuentas y permisos',
        add: 'Agregar usuario',
        searchPlaceholder: 'Buscar por nombre o correo…',
        bannerTitle: 'Gestión de usuarios',
        bannerDescription: 'Administra las cuentas registradas en la plataforma. Puedes crear, editar, activar o desactivar usuarios y asignar roles de acceso.',
    },
    companies: {
        title: 'Compañías',
        subtitle: 'Directorio de establecimientos turísticos',
        add: 'Agregar compañía',
        searchPlaceholder: 'Buscar compañía…',
        bannerTitle: 'Gestión de compañías',
        bannerDescription: 'Registra y administra las empresas turísticas de la región. Cada compañía puede tener múltiples servicios asociados visibles en la app móvil.',
    },
    locations: {
        title: 'Ubicaciones',
        subtitle: 'Lugares y destinos turísticos registrados',
        add: 'Agregar ubicación',
        searchPlaceholder: 'Buscar ubicación…',
        bannerTitle: 'Ubicaciones',
        bannerDescription: 'Define los municipios y zonas geográficas de la región. Las ubicaciones agrupan los servicios y POIs para que el motor de recomendaciones los contextualice correctamente.',
    },
    touristServices: {
        title: 'Servicios turísticos',
        subtitle: 'Hoteles, restaurantes, tours y más',
        add: 'Agregar servicio',
        evaluate: 'Evaluar servicio',
        searchPlaceholder: 'Buscar servicio…',
    },
    profiles: {
        title: 'Perfiles de viajero',
        subtitle: 'Intereses y preferencias de los usuarios',
        empty: 'No hay perfiles registrados',
        colOrder: 'Orden',
        colUser: 'Usuario',
        colTravelType: 'Tipo de viaje',
        colInterests: 'Intereses',
        colPreferences: 'Preferencias',
        colAccessibility: 'Accesibilidad',
        userFallback: (id) => `Usuario #${id}`,
        years: (age) => `${age} años`,
        travelTypes: {
            solo: 'Solo',
            pareja: 'Pareja',
            familia: 'Familia',
            amigos: 'Amigos',
        },
        placeTypes: {
            aire: 'Al aire libre',
            cerrado: 'Espacios cerrados',
            indiferente: 'Sin preferencia',
        },
        profileRegistered: 'Perfil registrado',
        visitedBefore: 'Ya visitó la región',
        firstVisit: 'Primera visita',
        prioritizesSustainability: 'Prioriza sostenibilidad',
        noSustainablePriority: 'Sin prioridad sostenible',
        activityLevel: (level) => `Actividad ${level}/5`,
        requiresAccessibility: 'Requiere accesibilidad',
        noSpecialRequirements: 'Sin requerimientos especiales',
        restrictionsPrefix: 'Restricciones:',
        notAvailable: 'N/D',
        bannerTitle: 'Perfiles de viajero',
        bannerDescription: 'Los perfiles agrupan preferencias de viaje recopiladas mediante el formulario inteligente. Se usan para personalizar las recomendaciones del motor de IA.',
        tabProfile: 'Perfil',
        tabSessions: 'Sesiones',
        tabRecommendations: 'Recomendaciones',
        demographics: 'Datos demográficos',
        noSessions: 'Sin sesiones registradas',
        unknownDevice: 'Dispositivo desconocido',
        lastActivity: 'Última actividad:',
        sessionActive: 'Activa',
        sessionExpired: 'Expirada',
        sessionRevoked: 'Revocada',
        noRecommendations: 'Sin sesiones de recomendación',
        recoDestinations: (total, clicked) => `${total} destinos · ${clicked} clic${clicked !== 1 ? 's' : ''}`,
        clickedLabel: '✓ clic',
    },
    activities: {
        title: 'Actividades turísticas',
        subtitle: 'Impacto social y ambiental por actividad económica',
        empty: 'No hay actividades registradas',
        searchPlaceholder: 'Buscar por empresa…',
        colOrder: 'Orden',
        colCompany: 'Empresa',
        colProduction: 'Producción',
        colEnvImpact: 'Impacto ambiental',
        colSocialImpact: 'Impacto social',
        impactLowEnv: 'Bajo',
        impactLowSocial: 'Positivo',
        bannerTitle: 'Actividades',
        bannerDescription: 'Registro de actividades y experiencias disponibles en la región. Se asocian a servicios y POIs para enriquecer las rutas personalizadas generadas por la IA.',
    },
    certifications: {
        title: 'Certificaciones',
        subtitle: 'Sellos de calidad y sostenibilidad',
        empty: 'No hay certificaciones registradas',
        org: 'Org:',
        expires: 'Expira:',
        noDate: 'Sin fecha',
        activate: 'Activar',
        deactivate: 'Desactivar',
        evidence: 'Evidencia',
        bannerTitle: 'Certificaciones',
        bannerDescription: 'Gestiona los certificados de calidad asignados a servicios turísticos. Las certificaciones aumentan la visibilidad y confianza de los negocios en la app móvil.',
    },
    poi: {
        title: 'Puntos de interés',
        subtitle: 'Lugares turísticos y su nivel de sostenibilidad',
        empty: 'No hay POI registrados',
        searchPlaceholder: 'Buscar POI…',
        colName: 'Nombre',
        colDescription: 'Descripción',
        colType: 'Tipo',
        colSustainable: 'Sostenible',
        noDescription: 'Sin descripción',
        badgeSustainable: 'Sostenible',
        badgeStandard: 'Estándar',
    },
    statistics: {
        title: 'Estadísticas y finanzas',
        subtitle: 'KPIs turísticos, laborales y ambientales',
        tabExpenditure: 'Gasto turístico',
        tabEmployment: 'Empleo',
        tabCarbon: 'Huella de carbono',
        panelExpenditure: 'Registrar gasto turístico',
        panelEmployment: 'Registrar empleado',
        panelCarbon: 'Registrar insumo / huella',
        formHint: 'Completa los campos y guarda el registro',
        saving: 'Guardando…',
        btnSaveExpense: 'Guardar gasto',
        btnRegisterEmployee: 'Registrar empleado',
        btnSaveIndicators: 'Guardar indicadores',
        expType: 'Tipo de gasto',
        expTypePh: 'Alojamiento, comida, transporte…',
        amount: 'Monto ($)',
        amountPh: '0.00',
        destination: 'Destino / establecimiento',
        destinationPh: 'Nombre del lugar o establecimiento',
        position: 'Cargo / puesto',
        positionPh: 'Ej.: recepcionista, guía turístico…',
        contractType: 'Tipo de contrato',
        contractFull: 'Tiempo completo',
        contractHalf: 'Medio tiempo',
        contractTemporal: 'Temporal',
        gender: 'Género',
        genderMale: 'Masculino',
        genderFemale: 'Femenino',
        genderNb: 'No binario',
        genderPreferNot: 'Prefiero no decir',
        salary: 'Salario mensual ($)',
        salaryPh: '0.00',
        inputType: 'Tipo de insumo',
        inputElectric: 'Energía eléctrica',
        inputWater: 'Agua',
        inputGas: 'Gas / combustible',
        consumption: 'Consumo (kWh / m³)',
        consumptionPh: '0',
        carbon: 'Huella CO₂ (kg)',
        carbonPh: '0.00',
        cost: 'Costo asociado ($)',
        costPh: '0.00',
        kpiRecords: 'Registros',
        kpiTotalAmount: 'Monto total',
        kpiAvgPerRecord: 'Promedio / registro',
        kpiMostFrequentType: 'Tipo más frecuente',
        kpiRegisteredJobs: 'Empleos registrados',
        kpiAvgSalary: 'Salario promedio',
        kpiTotalPayroll: 'Nómina total',
        kpiFullTime: 'Tiempo completo',
        kpiTotalCO2: 'CO₂ total (kg)',
        kpiTotalCost: 'Costo total',
        kpiFrequentInput: 'Insumo frecuente',
        tableTourist: 'Turista',
        tableExpType: 'Tipo de gasto',
        tableAmount: 'Monto',
        tableDestination: 'Destino',
        tableDate: 'Fecha',
        tableCompany: 'Empresa',
        tablePosition: 'Puesto',
        tableContract: 'Contrato',
        tableGender: 'Género',
        tableSalary: 'Salario',
        tableInput: 'Insumo',
        tableConsumption: 'Consumo',
        tableCO2: 'CO₂ (kg)',
        tableCost: 'Costo',
        selectType: 'Seleccionar tipo…',
        selectDestination: 'Seleccionar destino…',
        selectCompany: 'Seleccionar empresa…',
        loadingLocations: 'Cargando ubicaciones…',
        loadingCompanies: 'Cargando…',
        company: 'Empresa',
        co2kg: 'CO₂ (kg)',
        noProfiles: 'Sin perfiles registrados aún',
        inputSolidWaste: 'Residuos sólidos',
        inputOther: 'Otros insumos',
    },
    modals: dashboardModalsByLang.es,
    templates: {
        title: 'Plantillas de evaluación',
        subtitle: 'Administración de rúbricas para auditorías de sostenibilidad',
        new: 'Nueva plantilla',
        empty: 'No hay plantillas configuradas',
        edit: 'Editar',
    },
    form: {
        step1: {
            title: '¿Qué te interesa?',
            subtitle: 'Selecciona tus preferencias de viaje',
            ageRange: {
                label: 'Rango de edad',
                ages_18_24: '18-24',
                ages_25_34: '25-34',
                ages_35_44: '35-44',
                ages_45_54: '45-54',
                ages_55_plus: '55+',
            },
            budgetLabel: 'Presupuesto diario',
            budgetOptions: {
                economic: 'Económico',
                economicRange: '< $700/día',
                moderate: 'Moderado',
                moderateRange: '$700 - $2,000/día',
                premium: 'Premium',
                premiumRange: '> $2,000/día',
            },
            durationLabel: 'Duración del viaje',
            durationOptions: {
                days_1_2: '1-2 días',
                days_3_5: '3-5 días',
                days_6_10: '6-10 días',
                days_10_plus: '10+ días',
            },
            cta: 'Continuar',
        },
        step2: {
            title: 'Preferencias',
            subtitle: 'Selecciona tus intereses para personalizar las recomendaciones',
            tourismTypesLabel: 'Tipos de turismo',
            activityLevelLabel: 'Nivel de actividad',
            placePreferenceLabel: 'Preferencia de lugar',
            optional: '(opcional)',
            back: 'Atrás',
            next: 'Continuar',
            tourismTypes: {
                nature: 'Naturaleza',
                adventure: 'Aventura',
                gastronomy: 'Gastronómico',
                cultural: 'Cultural',
                rural: 'Rural',
            },
            activityLevels: {
                veryRelaxed: 'Muy relajado',
                relaxed: 'Relajado',
                moderate: 'Moderado',
                active: 'Activo',
                veryActive: 'Muy activo',
            },
            placePreferences: {
                outdoor: 'Aire libre',
                indoor: 'Cerrado',
                indifferent: 'Indiferente',
            },
        },
        step3: {
            title: 'Contexto del Viaje',
            subtitle: 'Cuéntanos sobre tu compañía y servicios preferidos',
            groupLabel: 'Viajas con',
            servicesLabel: 'Servicios que quieres incluir',
            back: 'Atrás',
            next: 'Continuar',
            groupOptions: {
                solo: 'Solo',
                couple: 'Pareja',
                family: 'Familia',
                friends: 'Amigos',
            },
            serviceOptions: {
                lodging: 'Hospedaje',
                transport: 'Transporte',
                food: 'Alimentos',
                tours: 'Tours',
            },
        },
        step4: {
            loadingTitle: 'Analizando tus preferencias…',
            loadingSubtitle: 'Generando recomendaciones personalizadas para tu próximo viaje',
            errorTitle: 'Error al generar recomendaciones',
            retry: 'Reintentar',
            title: 'Condiciones Especiales',
            subtitle: 'Ayúdanos a personalizar aún más tu experiencia',
            accessibilityLabel: '¿Necesitas accesibilidad?',
            accessibilityPlaceholder: 'Describe tu requerimiento de accesibilidad…',
            visitedLabel: '¿Has visitado la región antes?',
            back: 'Atrás',
            finish: 'Finalizar',
            yes: 'Sí',
            no: 'No',
            loginRequired: 'Debes iniciar sesión.',
            noRecommendations: 'No se encontraron recomendaciones.',
        },
        results: {
            shareSuccessTitle: 'Compartido',
            shareSuccessBody: 'Se envió el resumen de recomendaciones',
            copySuccessTitle: 'Copiado',
            copySuccessBody: 'Se copió el resumen al portapapeles',
            shareUnavailableTitle: 'No disponible',
            shareUnavailableBody: 'Tu navegador no permite compartir ni copiar',
            shareErrorTitle: 'No se pudo compartir',
            shareErrorBody: 'Intenta nuevamente o descarga el archivo',
            headerTitle: 'Tus recomendaciones',
            headerSubtitle: 'Explora el mapa y selecciona cada lugar desde la lista lateral.',
            recommendedPlacesBadge: (count) => `${count} lugares recomendados`,
            locatedPlacesBadge: (count, _total) => `${count} con ubicación en mapa`,
            selectedBadge: (title) => `Selección actual: ${title || 'Destino Turístico'}`,
            mapHint: 'Selecciona un card para centrarlo en el mapa. Al pasar el cursor, el punto correspondiente se ilumina.',
            mapReset: 'Ver todos',
            popupTitleFallback: 'Destino Turístico',
            popupScoreLabel: (score) => `Score ${score}`,
            mapPanelTitle: 'Visualización',
            mapPanelLoading: 'Ubicando puntos...',
            mapPanelStats: (visible, total) => `${visible}/${total} visibles`,
            mapPanelFocus: (rank) => `Foco: #${rank}`,
            mapPanelActive: (title) => `Actualmente enfocado: ${title}.`,
            mapPanelEmpty: 'Explora los puntos y usa la lista lateral para comparar recomendaciones.',
            mapStatusTitle: 'Estado del mapa',
            mapStatusLoading: 'Buscando las ubicaciones de los lugares recomendados...',
            mapStatusError: 'No fue posible ubicar todos los lugares, pero la lista sigue disponible.',
            mapStatusReady: 'El estilo del mapa cambia automáticamente entre modo claro y oscuro.',
            listTitle: 'Lugares recomendados',
            listSubtitle: 'Esta sección tiene su propio scroll para que el mapa permanezca siempre visible.',
            imageAlt: 'Imagen del lugar',
            recommendationLabel: (rank) => `Recomendación #${rank}`,
            recommendationFallback: 'Destino Turístico',
            mapVisible: 'Visible en mapa',
            mapUnavailable: 'Sin punto disponible',
            descriptionFallback: 'Una experiencia única te espera en este destino seleccionado por WELLTUR.',
            locationFallback: 'No se encontró una ubicación exacta en el catálogo',
            focusLabel: 'En foco',
            selectedLabel: 'Seleccionado',
            viewOnMapLabel: 'Ver en mapa',
            download: 'Descargar',
            share: 'Compartir',
            finish: 'Finalizar',
            shareServiceLabel: 'Servicio turístico',
            sharePoiLabel: 'Punto de interés',
        },
    },
    contacts: {
        title: 'Contactos & Suscripciones',
        subtitle: 'Mensajes capturados desde los formularios de contacto',
        bannerTitle: '¿Qué son los contactos?',
        bannerDescription: 'Mensajes enviados por visitantes y empresas a través de los formularios de contacto de la plataforma y la landing page. Haz clic en el correo o el mensaje para ver los detalles y cambiar el estado de atención.',
        emptyTitle: 'Sin contactos todavía',
        recordsLabel: (n) => `${n} registros`,
        tableEmail: 'Correo',
        tableReason: 'Motivo',
        tableMessage: 'Mensaje',
        tableSource: 'Fuente',
        tableStatus: 'Estado',
        tableDate: 'Fecha',
        statusLabels: {
            pending: 'Pendiente',
            in_progress: 'En atención',
            done: 'Resuelto',
            dismissed: 'Descartado',
        },
        sourceLabels: {
            landing_b2b: 'Landing B2B',
            landing_turista: 'Landing Turista',
            plataforma_contact: 'Plataforma',
            dashboard: 'Dashboard',
        },
        reasonLabels: {
            download: 'Descarga del app',
            join: 'Unirme como servicio',
            tourist: 'Turista interesado',
            pricing: 'Precios y planes',
            evaluation: 'Solicitar evaluación',
            suggestion: 'Sugerencia',
            other: 'Otro',
        },
        statusUpdateErrorTitle: 'Error',
        statusUpdateErrorBody: 'No se pudo actualizar el estado.',
        deleteSuccessTitle: 'Contactos eliminados',
        deleteSuccessBody: (n) => `${n} contacto(s) eliminados.`,
        detailMessageLabel: 'Mensaje',
        detailNoMessage: 'Sin mensaje adjunto.',
        detailStatusLabel: 'Estado de atención',
        detailClose: 'Cerrar',
    },
    instruments: {
        builderTitle: 'Constructor de instrumentos',
        builderSubtitle: 'Crea y administra instrumentos de evaluación tipo formulario',
        newButton: 'Nuevo instrumento',
        loadError: 'No se pudieron cargar los instrumentos',
        createError: 'Error al crear el instrumento',
        toggleError: 'Error al cambiar estado',
        deleteError: 'Error al eliminar',
        searchPlaceholder: 'Buscar instrumento…',
        empty: 'Sin instrumentos',
        colName: 'Nombre',
        colService: 'Servicio',
        colVersion: 'Versión',
        colStatus: 'Estado',
        colActions: 'Acciones',
        active: 'Activo',
        inactive: 'Inactivo',
        edit: 'Editar',
        delete: 'Eliminar',
        emptyNoResults: 'Sin resultados',
        emptyHintNoResults: 'Intenta con otra búsqueda',
        emptyDefaultTitle: 'No hay instrumentos',
        emptyDefaultHint: 'Crea tu primer instrumento de evaluación',
        toggleActivate: 'Activar',
        toggleDeactivate: 'Desactivar',
        createdPrefix: 'Creado:',
        modalNewTitle: 'Nuevo instrumento',
        modalNewSubtitle: 'Define las propiedades básicas',
        fieldName: 'Nombre',
        fieldVersion: 'Versión',
        fieldService: 'Tipo de servicio',
        selectPlaceholder: 'Seleccionar…',
        checkboxActive: 'Activo',
        cancel: 'Cancelar',
        create: 'Crear',
        closeAria: 'Cerrar',
    },
};

const en: DashboardModules = {
    common: {
        retry: 'Try again',
        delete: 'Delete',
        deleteCount: (n) => `Delete (${n})`,
        confirmDeleteUsers: (n) => `Delete ${n} user(s)?`,
        confirmDeleteUsersMsg: (n) => `${n} user(s) will be deleted permanently.`,
        confirmDeleteCompanies: (n) => `Delete ${n} compan(y/ies)?`,
        confirmDeleteCompaniesMsg: (n) => `${n} compan(y/ies) will be deleted permanently.`,
        confirmDeleteLocations: (n) => `Delete ${n} location(s)?`,
        confirmDeleteLocationsMsg: (n) => `${n} location(s) will be deleted permanently.`,
        confirmDeleteServices: (n) => `Delete ${n} service(s)?`,
        confirmDeleteServicesMsg: (n) => `${n} service(s) will be deleted permanently.`,
        confirmDeleteActivities: (n) => `Delete ${n} activity(ies)?`,
        confirmDeleteActivitiesMsg: (n) => `${n} activity(ies) will be deleted permanently.`,
        confirmDeleteContacts: (n) => `Delete ${n} contact(s)?`,
        confirmDeleteContactsMsg: (n) => `${n} contact(s) will be deleted permanently.`,
        confirmDeleteInstrument: 'Delete this instrument?',
    },
    pagination: {
        firstPage: 'First page',
        prevPage: 'Previous page',
        nextPage: 'Next page',
        lastPage: 'Last page',
        goToPage: (p) => `Go to page ${p}`,
        show: 'Show',
        perPage: 'per page',
        of: 'of',
        range: (from, to, total) => `${from} - ${to} of ${total}`,
    },
    users: {
        title: 'Users',
        subtitle: 'Account and permission management',
        add: 'Add user',
        searchPlaceholder: 'Search by name or email…',
        bannerTitle: 'User management',
        bannerDescription: 'Manage registered accounts in the platform. You can create, edit, activate, or deactivate users and assign access roles.',
    },
    companies: {
        title: 'Companies',
        subtitle: 'Directory of tourism businesses',
        add: 'Add company',
        searchPlaceholder: 'Search company…',
        bannerTitle: 'Company management',
        bannerDescription: 'Register and manage tourism businesses in the region. Each company can have multiple associated services visible in the mobile app.',
    },
    locations: {
        title: 'Locations',
        subtitle: 'Registered places and destinations',
        add: 'Add location',
        searchPlaceholder: 'Search location…',
        bannerTitle: 'Locations',
        bannerDescription: 'Define the municipalities and geographic zones of the region. Locations group services and POIs so the recommendation engine can contextualize them correctly.',
    },
    touristServices: {
        title: 'Tourist services',
        subtitle: 'Hotels, restaurants, tours, and more',
        add: 'Add service',
        evaluate: 'Evaluate service',
        searchPlaceholder: 'Search service…',
    },
    profiles: {
        title: 'Traveler profiles',
        subtitle: 'User interests and preferences',
        empty: 'No profiles registered',
        colOrder: 'Order',
        colUser: 'User',
        colTravelType: 'Travel type',
        colInterests: 'Interests',
        colPreferences: 'Preferences',
        colAccessibility: 'Accessibility',
        userFallback: (id) => `User #${id}`,
        years: (age) => `${age} years`,
        travelTypes: {
            solo: 'Solo',
            pareja: 'Couple',
            familia: 'Family',
            amigos: 'Friends',
        },
        placeTypes: {
            aire: 'Outdoors',
            cerrado: 'Indoor spaces',
            indiferente: 'No preference',
        },
        profileRegistered: 'Profile on file',
        visitedBefore: 'Has visited the region',
        firstVisit: 'First visit',
        prioritizesSustainability: 'Prioritizes sustainability',
        noSustainablePriority: 'No sustainability priority',
        activityLevel: (level) => `Activity ${level}/5`,
        requiresAccessibility: 'Requires accessibility',
        noSpecialRequirements: 'No special requirements',
        restrictionsPrefix: 'Restrictions:',
        notAvailable: 'N/A',
        bannerTitle: 'Traveler profiles',
        bannerDescription: 'Profiles group travel preferences captured through the smart form. They are used to personalize AI recommendations.',
        tabProfile: 'Profile',
        tabSessions: 'Sessions',
        tabRecommendations: 'Recommendations',
        demographics: 'Demographics',
        noSessions: 'No sessions on record',
        unknownDevice: 'Unknown device',
        lastActivity: 'Last activity:',
        sessionActive: 'Active',
        sessionExpired: 'Expired',
        sessionRevoked: 'Revoked',
        noRecommendations: 'No recommendation sessions',
        recoDestinations: (total, clicked) => `${total} destinations · ${clicked} click${clicked !== 1 ? 's' : ''}`,
        clickedLabel: '✓ clicked',
    },
    activities: {
        title: 'Tourism activities',
        subtitle: 'Social and environmental impact by economic activity',
        empty: 'No activities registered',
        searchPlaceholder: 'Search by company…',
        colOrder: 'Order',
        colCompany: 'Company',
        colProduction: 'Production',
        colEnvImpact: 'Environmental impact',
        colSocialImpact: 'Social impact',
        impactLowEnv: 'Low',
        impactLowSocial: 'Positive',
        bannerTitle: 'Activities',
        bannerDescription: 'Registry of activities and experiences available in the region. They link to services and POIs to enrich AI-generated personalized routes.',
    },
    certifications: {
        title: 'Certifications',
        subtitle: 'Quality and sustainability seals',
        empty: 'No certifications registered',
        org: 'Org:',
        expires: 'Expires:',
        noDate: 'No date',
        activate: 'Activate',
        deactivate: 'Deactivate',
        evidence: 'Evidence',
        bannerTitle: 'Certifications',
        bannerDescription: 'Manage quality certificates assigned to tourism services. Certifications increase business visibility and trust in the mobile app.',
    },
    poi: {
        title: 'Points of interest',
        subtitle: 'Tourist sites and sustainability level',
        empty: 'No POIs registered',
        searchPlaceholder: 'Search POI…',
        colName: 'Name',
        colDescription: 'Description',
        colType: 'Type',
        colSustainable: 'Sustainable',
        noDescription: 'No description',
        badgeSustainable: 'Sustainable',
        badgeStandard: 'Standard',
    },
    statistics: {
        title: 'Statistics and finance',
        subtitle: 'Tourism, employment, and environmental KPIs',
        tabExpenditure: 'Tourist spending',
        tabEmployment: 'Employment',
        tabCarbon: 'Carbon footprint',
        panelExpenditure: 'Record tourist spending',
        panelEmployment: 'Record employee',
        panelCarbon: 'Record input / footprint',
        formHint: 'Fill in the fields and save the record',
        saving: 'Saving…',
        btnSaveExpense: 'Save expense',
        btnRegisterEmployee: 'Register employee',
        btnSaveIndicators: 'Save indicators',
        expType: 'Expense type',
        expTypePh: 'Lodging, food, transport…',
        amount: 'Amount ($)',
        amountPh: '0.00',
        destination: 'Destination / venue',
        destinationPh: 'Place or business name',
        position: 'Role / position',
        positionPh: 'e.g. receptionist, tour guide…',
        contractType: 'Contract type',
        contractFull: 'Full time',
        contractHalf: 'Part time',
        contractTemporal: 'Temporary',
        gender: 'Gender',
        genderMale: 'Male',
        genderFemale: 'Female',
        genderNb: 'Non-binary',
        genderPreferNot: 'Prefer not to say',
        salary: 'Monthly salary ($)',
        salaryPh: '0.00',
        inputType: 'Input type',
        inputElectric: 'Electricity',
        inputWater: 'Water',
        inputGas: 'Gas / fuel',
        consumption: 'Consumption (kWh / m³)',
        consumptionPh: '0',
        carbon: 'CO₂ footprint (kg)',
        carbonPh: '0.00',
        cost: 'Associated cost ($)',
        costPh: '0.00',
        kpiRecords: 'Records',
        kpiTotalAmount: 'Total amount',
        kpiAvgPerRecord: 'Avg / record',
        kpiMostFrequentType: 'Most frequent type',
        kpiRegisteredJobs: 'Registered jobs',
        kpiAvgSalary: 'Average salary',
        kpiTotalPayroll: 'Total payroll',
        kpiFullTime: 'Full time',
        kpiTotalCO2: 'Total CO₂ (kg)',
        kpiTotalCost: 'Total cost',
        kpiFrequentInput: 'Frequent input',
        tableTourist: 'Tourist',
        tableExpType: 'Expense type',
        tableAmount: 'Amount',
        tableDestination: 'Destination',
        tableDate: 'Date',
        tableCompany: 'Company',
        tablePosition: 'Position',
        tableContract: 'Contract',
        tableGender: 'Gender',
        tableSalary: 'Salary',
        tableInput: 'Input',
        tableConsumption: 'Consumption',
        tableCO2: 'CO₂ (kg)',
        tableCost: 'Cost',
        selectType: 'Select type…',
        selectDestination: 'Select destination…',
        selectCompany: 'Select company…',
        loadingLocations: 'Loading locations…',
        loadingCompanies: 'Loading…',
        company: 'Company',
        co2kg: 'CO₂ (kg)',
        noProfiles: 'No profiles registered yet',
        inputSolidWaste: 'Solid waste',
        inputOther: 'Other inputs',
    },
    modals: dashboardModalsByLang.en,
    templates: {
        title: 'Evaluation templates',
        subtitle: 'Rubric management for sustainability audits',
        new: 'New template',
        empty: 'No templates configured',
        edit: 'Edit',
    },
    form: {
        step1: {
            title: 'What are you interested in?',
            subtitle: 'Select your travel preferences',
            ageRange: {
                label: 'Age range',
                ages_18_24: '18-24',
                ages_25_34: '25-34',
                ages_35_44: '35-44',
                ages_45_54: '45-54',
                ages_55_plus: '55+',
            },
            budgetLabel: 'Daily budget',
            budgetOptions: {
                economic: 'Economy',
                economicRange: '< $700/day',
                moderate: 'Moderate',
                moderateRange: '$700 - $2,000/day',
                premium: 'Premium',
                premiumRange: '> $2,000/day',
            },
            durationLabel: 'Trip duration',
            durationOptions: {
                days_1_2: '1-2 days',
                days_3_5: '3-5 days',
                days_6_10: '6-10 days',
                days_10_plus: '10+ days',
            },
            cta: 'Continue',
        },
        step2: {
            title: 'Preferences',
            subtitle: 'Select your interests to personalize recommendations',
            tourismTypesLabel: 'Tourism types',
            activityLevelLabel: 'Activity level',
            placePreferenceLabel: 'Place preference',
            optional: '(optional)',
            back: 'Back',
            next: 'Continue',
            tourismTypes: {
                nature: 'Nature',
                adventure: 'Adventure',
                gastronomy: 'Gastronomy',
                cultural: 'Cultural',
                rural: 'Rural',
            },
            activityLevels: {
                veryRelaxed: 'Very relaxed',
                relaxed: 'Relaxed',
                moderate: 'Moderate',
                active: 'Active',
                veryActive: 'Very active',
            },
            placePreferences: {
                outdoor: 'Outdoor',
                indoor: 'Indoor',
                indifferent: 'No preference',
            },
        },
        step3: {
            title: 'Trip context',
            subtitle: 'Tell us about your company and preferred services',
            groupLabel: 'You travel with',
            servicesLabel: 'Services you want to include',
            back: 'Back',
            next: 'Continue',
            groupOptions: {
                solo: 'Solo',
                couple: 'Couple',
                family: 'Family',
                friends: 'Friends',
            },
            serviceOptions: {
                lodging: 'Lodging',
                transport: 'Transport',
                food: 'Food',
                tours: 'Tours',
            },
        },
        step4: {
            loadingTitle: 'Analyzing your preferences…',
            loadingSubtitle: 'Generating personalized recommendations for your next trip',
            errorTitle: 'Error generating recommendations',
            retry: 'Try again',
            title: 'Special Conditions',
            subtitle: 'Help us personalize your experience even more',
            accessibilityLabel: 'Do you need accessibility?',
            accessibilityPlaceholder: 'Describe your accessibility requirements…',
            visitedLabel: 'Have you visited the region before?',
            back: 'Back',
            finish: 'Finish',
            yes: 'Yes',
            no: 'No',
            loginRequired: 'You must sign in.',
            noRecommendations: 'No recommendations found.',
        },
        results: {
            shareSuccessTitle: 'Shared',
            shareSuccessBody: 'Recommendation summary sent',
            copySuccessTitle: 'Copied',
            copySuccessBody: 'Summary copied to clipboard',
            shareUnavailableTitle: 'Unavailable',
            shareUnavailableBody: 'Your browser cannot share or copy',
            shareErrorTitle: 'Could not share',
            shareErrorBody: 'Try again or download the file',
            headerTitle: 'Your recommendations',
            headerSubtitle: 'Explore the map and select each place from the side list.',
            recommendedPlacesBadge: (count) => `${count} recommended places`,
            locatedPlacesBadge: (count, _total) => `${count} with map location`,
            selectedBadge: (title) => `Current selection: ${title || 'Tourist Destination'}`,
            mapHint: 'Select a card to center it on the map. On hover, the corresponding point highlights.',
            mapReset: 'View all',
            popupTitleFallback: 'Tourist Destination',
            popupScoreLabel: (score) => `Score ${score}`,
            mapPanelTitle: 'Visualization',
            mapPanelLoading: 'Locating points...',
            mapPanelStats: (visible, total) => `${visible}/${total} visible`,
            mapPanelFocus: (rank) => `Focus: #${rank}`,
            mapPanelActive: (title) => `Currently focused: ${title}.`,
            mapPanelEmpty: 'Explore the points and use the side list to compare recommendations.',
            mapStatusTitle: 'Map status',
            mapStatusLoading: 'Searching for recommended place locations...',
            mapStatusError: 'Some places could not be located, but the list is still available.',
            mapStatusReady: 'The map style switches automatically between light and dark mode.',
            listTitle: 'Recommended places',
            listSubtitle: 'This section has its own scroll so the map stays visible.',
            imageAlt: 'Place image',
            recommendationLabel: (rank) => `Recommendation #${rank}`,
            recommendationFallback: 'Tourist Destination',
            mapVisible: 'Visible on map',
            mapUnavailable: 'No point available',
            descriptionFallback: 'A unique experience awaits at this destination selected by WELLTUR.',
            locationFallback: 'No exact location found in the catalog',
            focusLabel: 'Focused',
            selectedLabel: 'Selected',
            viewOnMapLabel: 'View on map',
            download: 'Download',
            share: 'Share',
            finish: 'Finish',
            shareServiceLabel: 'Tourist service',
            sharePoiLabel: 'Point of interest',
        },
    },
    contacts: {
        title: 'Contacts & Subscriptions',
        subtitle: 'Messages captured from contact forms',
        bannerTitle: 'What are contacts?',
        bannerDescription: 'Messages sent by visitors and companies through the platform and landing page contact forms. Click the email or message to view details and update the status.',
        emptyTitle: 'No contacts yet',
        recordsLabel: (n) => `${n} records`,
        tableEmail: 'Email',
        tableReason: 'Reason',
        tableMessage: 'Message',
        tableSource: 'Source',
        tableStatus: 'Status',
        tableDate: 'Date',
        statusLabels: {
            pending: 'Pending',
            in_progress: 'In progress',
            done: 'Resolved',
            dismissed: 'Dismissed',
        },
        sourceLabels: {
            landing_b2b: 'Landing B2B',
            landing_turista: 'Landing Tourist',
            plataforma_contact: 'Platform',
            dashboard: 'Dashboard',
        },
        reasonLabels: {
            download: 'App download',
            join: 'Join as service',
            tourist: 'Interested tourist',
            pricing: 'Pricing and plans',
            evaluation: 'Request evaluation',
            suggestion: 'Suggestion',
            other: 'Other',
        },
        statusUpdateErrorTitle: 'Error',
        statusUpdateErrorBody: 'Status could not be updated.',
        deleteSuccessTitle: 'Contacts deleted',
        deleteSuccessBody: (n) => `${n} contact(s) deleted.`,
        detailMessageLabel: 'Message',
        detailNoMessage: 'No message attached.',
        detailStatusLabel: 'Attention status',
        detailClose: 'Close',
    },
    instruments: {
        builderTitle: 'Instrument builder',
        builderSubtitle: 'Create and manage evaluation instruments (form-style)',
        newButton: 'New instrument',
        loadError: 'Could not load instruments',
        createError: 'Could not create instrument',
        toggleError: 'Could not change status',
        deleteError: 'Could not delete',
        searchPlaceholder: 'Search instrument…',
        empty: 'No instruments',
        colName: 'Name',
        colService: 'Service',
        colVersion: 'Version',
        colStatus: 'Status',
        colActions: 'Actions',
        active: 'Active',
        inactive: 'Inactive',
        edit: 'Edit',
        delete: 'Delete',
        emptyNoResults: 'No results',
        emptyHintNoResults: 'Try a different search',
        emptyDefaultTitle: 'No instruments',
        emptyDefaultHint: 'Create your first evaluation instrument',
        toggleActivate: 'Activate',
        toggleDeactivate: 'Deactivate',
        createdPrefix: 'Created:',
        modalNewTitle: 'New instrument',
        modalNewSubtitle: 'Define the basic properties',
        fieldName: 'Name',
        fieldVersion: 'Version',
        fieldService: 'Service type',
        selectPlaceholder: 'Select…',
        checkboxActive: 'Active',
        cancel: 'Cancel',
        create: 'Create',
        closeAria: 'Close',
    },
};

const fr: DashboardModules = {
    common: {
        retry: 'Réessayer',
        delete: 'Supprimer',
        deleteCount: (n) => `Supprimer (${n})`,
        confirmDeleteUsers: (n) => `Supprimer ${n} utilisateur(s) ?`,
        confirmDeleteUsersMsg: (n) => `${n} utilisateur(s) seront supprimés définitivement.`,
        confirmDeleteCompanies: (n) => `Supprimer ${n} entreprise(s) ?`,
        confirmDeleteCompaniesMsg: (n) => `${n} entreprise(s) seront supprimées définitivement.`,
        confirmDeleteLocations: (n) => `Supprimer ${n} lieu(x) ?`,
        confirmDeleteLocationsMsg: (n) => `${n} lieu(x) seront supprimés définitivement.`,
        confirmDeleteServices: (n) => `Supprimer ${n} service(s) ?`,
        confirmDeleteServicesMsg: (n) => `${n} service(s) seront supprimés définitivement.`,
        confirmDeleteActivities: (n) => `Supprimer ${n} activité(s) ?`,
        confirmDeleteActivitiesMsg: (n) => `${n} activité(s) seront supprimées définitivement.`,
        confirmDeleteContacts: (n) => `Supprimer ${n} contact(s) ?`,
        confirmDeleteContactsMsg: (n) => `${n} contact(s) seront supprimés définitivement.`,
        confirmDeleteInstrument: 'Supprimer cet instrument ?',
    },
    pagination: {
        firstPage: 'Première page',
        prevPage: 'Page précédente',
        nextPage: 'Page suivante',
        lastPage: 'Dernière page',
        goToPage: (p) => `Aller à la page ${p}`,
        show: 'Afficher',
        perPage: 'par page',
        of: 'sur',
        range: (from, to, total) => `${from} - ${to} sur ${total}`,
    },
    users: {
        title: 'Utilisateurs',
        subtitle: 'Gestion des comptes et des droits',
        add: 'Ajouter un utilisateur',
        searchPlaceholder: 'Rechercher par nom ou e-mail…',
        bannerTitle: 'Gestion des utilisateurs',
        bannerDescription: 'Gérez les comptes enregistrés sur la plateforme. Vous pouvez créer, modifier, activer ou désactiver des utilisateurs et attribuer des rôles.',
    },
    companies: {
        title: 'Entreprises',
        subtitle: 'Annuaire des établissements touristiques',
        add: 'Ajouter une entreprise',
        searchPlaceholder: 'Rechercher une entreprise…',
        bannerTitle: 'Gestion des entreprises',
        bannerDescription: 'Enregistrez et gérez les entreprises touristiques de la région. Chaque entreprise peut avoir plusieurs services associés visibles dans l’app mobile.',
    },
    locations: {
        title: 'Lieux',
        subtitle: 'Lieux et destinations enregistrés',
        add: 'Ajouter un lieu',
        searchPlaceholder: 'Rechercher un lieu…',
        bannerTitle: 'Lieux',
        bannerDescription: 'Définissez les municipalités et zones géographiques de la région. Les lieux regroupent services et POI pour contextualiser les recommandations.',
    },
    touristServices: {
        title: 'Services touristiques',
        subtitle: 'Hôtels, restaurants, circuits et plus',
        add: 'Ajouter un service',
        evaluate: 'Évaluer le service',
        searchPlaceholder: 'Rechercher un service…',
    },
    profiles: {
        title: 'Profils voyageurs',
        subtitle: 'Intérêts et préférences des utilisateurs',
        empty: 'Aucun profil enregistré',
        colOrder: 'Ordre',
        colUser: 'Utilisateur',
        colTravelType: 'Type de voyage',
        colInterests: 'Intérêts',
        colPreferences: 'Préférences',
        colAccessibility: 'Accessibilité',
        userFallback: (id) => `Utilisateur #${id}`,
        years: (age) => `${age} ans`,
        travelTypes: {
            solo: 'Seul',
            pareja: 'Couple',
            familia: 'Famille',
            amigos: 'Amis',
        },
        placeTypes: {
            aire: 'Plein air',
            cerrado: 'Espaces fermés',
            indiferente: 'Sans préférence',
        },
        profileRegistered: 'Profil enregistré',
        visitedBefore: 'A déjà visité la région',
        firstVisit: 'Première visite',
        prioritizesSustainability: 'Priorise la durabilité',
        noSustainablePriority: 'Sans priorité durable',
        activityLevel: (level) => `Activité ${level}/5`,
        requiresAccessibility: 'Accessibilité requise',
        noSpecialRequirements: 'Sans exigences particulières',
        restrictionsPrefix: 'Restrictions :',
        notAvailable: 'N/D',
        bannerTitle: 'Profils voyageurs',
        bannerDescription: 'Les profils regroupent les préférences de voyage collectées via le formulaire intelligent. Ils servent à personnaliser les recommandations IA.',
        tabProfile: 'Profil',
        tabSessions: 'Sessions',
        tabRecommendations: 'Recommandations',
        demographics: 'Données démographiques',
        noSessions: 'Aucune session enregistrée',
        unknownDevice: 'Appareil inconnu',
        lastActivity: 'Dernière activité :',
        sessionActive: 'Active',
        sessionExpired: 'Expirée',
        sessionRevoked: 'Révoquée',
        noRecommendations: 'Aucune session de recommandation',
        recoDestinations: (total, clicked) => `${total} destinations · ${clicked} clic${clicked !== 1 ? 's' : ''}`,
        clickedLabel: '✓ cliqué',
    },
    activities: {
        title: 'Activités touristiques',
        subtitle: 'Impact social et environnemental par activité',
        empty: 'Aucune activité enregistrée',
        searchPlaceholder: 'Rechercher par entreprise…',
        colOrder: 'Ordre',
        colCompany: 'Entreprise',
        colProduction: 'Production',
        colEnvImpact: 'Impact environnemental',
        colSocialImpact: 'Impact social',
        impactLowEnv: 'Faible',
        impactLowSocial: 'Positif',
        bannerTitle: 'Activités',
        bannerDescription: 'Registre des activités et expériences disponibles dans la région. Elles sont associées aux services et POI pour enrichir les itinéraires personnalisés.',
    },
    certifications: {
        title: 'Certifications',
        subtitle: 'Labels qualité et durabilité',
        empty: 'Aucune certification enregistrée',
        org: 'Org :',
        expires: 'Expire :',
        noDate: 'Sans date',
        activate: 'Activer',
        deactivate: 'Désactiver',
        evidence: 'Preuve',
        bannerTitle: 'Certifications',
        bannerDescription: 'Gérez les certificats de qualité attribués aux services touristiques. Ils augmentent la visibilité et la confiance dans l’app mobile.',
    },
    poi: {
        title: 'Points d’intérêt',
        subtitle: 'Sites touristiques et niveau de durabilité',
        empty: 'Aucun POI enregistré',
        searchPlaceholder: 'Rechercher un POI…',
        colName: 'Nom',
        colDescription: 'Description',
        colType: 'Type',
        colSustainable: 'Durable',
        noDescription: 'Sans description',
        badgeSustainable: 'Durable',
        badgeStandard: 'Standard',
    },
    statistics: {
        title: 'Statistiques et finances',
        subtitle: 'KPI touristiques, emploi et environnement',
        tabExpenditure: 'Dépenses touristiques',
        tabEmployment: 'Emploi',
        tabCarbon: 'Empreinte carbone',
        panelExpenditure: 'Enregistrer des dépenses touristiques',
        panelEmployment: 'Enregistrer un employé',
        panelCarbon: 'Enregistrer une entrée / empreinte',
        formHint: 'Remplissez les champs et enregistrez',
        saving: 'Enregistrement…',
        btnSaveExpense: 'Enregistrer la dépense',
        btnRegisterEmployee: 'Enregistrer l’employé',
        btnSaveIndicators: 'Enregistrer les indicateurs',
        expType: 'Type de dépense',
        expTypePh: 'Hébergement, repas, transport…',
        amount: 'Montant ($)',
        amountPh: '0.00',
        destination: 'Destination / établissement',
        destinationPh: 'Nom du lieu ou de l’établissement',
        position: 'Poste / fonction',
        positionPh: 'Ex. : réceptionniste, guide touristique…',
        contractType: 'Type de contrat',
        contractFull: 'Temps plein',
        contractHalf: 'Temps partiel',
        contractTemporal: 'Temporaire',
        gender: 'Genre',
        genderMale: 'Masculin',
        genderFemale: 'Féminin',
        genderNb: 'Non binaire',
        genderPreferNot: 'Je préfère ne pas répondre',
        salary: 'Salaire mensuel ($)',
        salaryPh: '0.00',
        inputType: 'Type d’intrant',
        inputElectric: 'Électricité',
        inputWater: 'Eau',
        inputGas: 'Gaz / carburant',
        consumption: 'Consommation (kWh / m³)',
        consumptionPh: '0',
        carbon: 'Empreinte CO₂ (kg)',
        carbonPh: '0.00',
        cost: 'Coût associé ($)',
        costPh: '0.00',
        kpiRecords: 'Enregistrements',
        kpiTotalAmount: 'Montant total',
        kpiAvgPerRecord: 'Moyenne / enregistrement',
        kpiMostFrequentType: 'Type le plus fréquent',
        kpiRegisteredJobs: 'Emplois enregistrés',
        kpiAvgSalary: 'Salaire moyen',
        kpiTotalPayroll: 'Masse salariale',
        kpiFullTime: 'Temps plein',
        kpiTotalCO2: 'CO₂ total (kg)',
        kpiTotalCost: 'Coût total',
        kpiFrequentInput: 'Intrant fréquent',
        tableTourist: 'Touriste',
        tableExpType: 'Type de dépense',
        tableAmount: 'Montant',
        tableDestination: 'Destination',
        tableDate: 'Date',
        tableCompany: 'Entreprise',
        tablePosition: 'Poste',
        tableContract: 'Contrat',
        tableGender: 'Genre',
        tableSalary: 'Salaire',
        tableInput: 'Intrant',
        tableConsumption: 'Consommation',
        tableCO2: 'CO₂ (kg)',
        tableCost: 'Coût',
        selectType: 'Sélectionner le type…',
        selectDestination: 'Sélectionner la destination…',
        selectCompany: 'Sélectionner l’entreprise…',
        loadingLocations: 'Chargement des lieux…',
        loadingCompanies: 'Chargement…',
        company: 'Entreprise',
        co2kg: 'CO₂ (kg)',
        noProfiles: 'Aucun profil enregistré',
        inputSolidWaste: 'Déchets solides',
        inputOther: 'Autres intrants',
    },
    modals: dashboardModalsByLang.fr,
    templates: {
        title: 'Modèles d’évaluation',
        subtitle: 'Gestion des rubriques pour audits de durabilité',
        new: 'Nouveau modèle',
        empty: 'Aucun modèle configuré',
        edit: 'Modifier',
    },
    form: {
        step1: {
            title: 'Qu’est-ce qui vous intéresse ?',
            subtitle: 'Sélectionnez vos préférences de voyage',
            ageRange: {
                label: 'Tranche d’âge',
                ages_18_24: '18-24',
                ages_25_34: '25-34',
                ages_35_44: '35-44',
                ages_45_54: '45-54',
                ages_55_plus: '55+',
            },
            budgetLabel: 'Budget quotidien',
            budgetOptions: {
                economic: 'Économique',
                economicRange: '< $700/jour',
                moderate: 'Modéré',
                moderateRange: '$700 - $2,000/jour',
                premium: 'Premium',
                premiumRange: '> $2,000/jour',
            },
            durationLabel: 'Durée du voyage',
            durationOptions: {
                days_1_2: '1-2 jours',
                days_3_5: '3-5 jours',
                days_6_10: '6-10 jours',
                days_10_plus: '10+ jours',
            },
            cta: 'Continuer',
        },
        step2: {
            title: 'Préférences',
            subtitle: 'Sélectionnez vos intérêts pour personnaliser les recommandations',
            tourismTypesLabel: 'Types de tourisme',
            activityLevelLabel: 'Niveau d’activité',
            placePreferenceLabel: 'Préférence de lieu',
            optional: '(optionnel)',
            back: 'Retour',
            next: 'Continuer',
            tourismTypes: {
                nature: 'Nature',
                adventure: 'Aventure',
                gastronomy: 'Gastronomique',
                cultural: 'Culturel',
                rural: 'Rural',
            },
            activityLevels: {
                veryRelaxed: 'Très détendu',
                relaxed: 'Détendu',
                moderate: 'Modéré',
                active: 'Actif',
                veryActive: 'Très actif',
            },
            placePreferences: {
                outdoor: 'Plein air',
                indoor: 'Intérieur',
                indifferent: 'Indifférent',
            },
        },
        step3: {
            title: 'Contexte du voyage',
            subtitle: 'Parlez-nous de votre compagnie et des services préférés',
            groupLabel: 'Vous voyagez avec',
            servicesLabel: 'Services à inclure',
            back: 'Retour',
            next: 'Continuer',
            groupOptions: {
                solo: 'Seul',
                couple: 'Couple',
                family: 'Famille',
                friends: 'Amis',
            },
            serviceOptions: {
                lodging: 'Hébergement',
                transport: 'Transport',
                food: 'Alimentation',
                tours: 'Circuits',
            },
        },
        step4: {
            loadingTitle: 'Analyse de vos préférences…',
            loadingSubtitle: 'Génération de recommandations personnalisées pour votre prochain voyage',
            errorTitle: 'Erreur lors de la génération des recommandations',
            retry: 'Réessayer',
            title: 'Conditions particulières',
            subtitle: 'Aidez-nous à personnaliser encore plus votre expérience',
            accessibilityLabel: 'Avez-vous besoin d’accessibilité ?',
            accessibilityPlaceholder: 'Décrivez vos besoins en accessibilité…',
            visitedLabel: 'Avez-vous déjà visité la région ?',
            back: 'Retour',
            finish: 'Terminer',
            yes: 'Oui',
            no: 'Non',
            loginRequired: 'Vous devez vous connecter.',
            noRecommendations: 'Aucune recommandation trouvée.',
        },
        results: {
            shareSuccessTitle: 'Partagé',
            shareSuccessBody: 'Résumé des recommandations envoyé',
            copySuccessTitle: 'Copié',
            copySuccessBody: 'Résumé copié dans le presse-papiers',
            shareUnavailableTitle: 'Indisponible',
            shareUnavailableBody: 'Votre navigateur ne permet pas de partager ni de copier',
            shareErrorTitle: 'Impossible de partager',
            shareErrorBody: 'Réessayez ou téléchargez le fichier',
            headerTitle: 'Vos recommandations',
            headerSubtitle: 'Explorez la carte et sélectionnez chaque lieu depuis la liste latérale.',
            recommendedPlacesBadge: (count) => `${count} lieux recommandés`,
            locatedPlacesBadge: (count, _total) => `${count} avec localisation sur la carte`,
            selectedBadge: (title) => `Sélection actuelle : ${title || 'Destination touristique'}`,
            mapHint: 'Sélectionnez une carte pour la centrer. Au survol, le point correspondant s’illumine.',
            mapReset: 'Voir tout',
            popupTitleFallback: 'Destination touristique',
            popupScoreLabel: (score) => `Score ${score}`,
            mapPanelTitle: 'Visualisation',
            mapPanelLoading: 'Localisation des points...',
            mapPanelStats: (visible, total) => `${visible}/${total} visibles`,
            mapPanelFocus: (rank) => `Focus : #${rank}`,
            mapPanelActive: (title) => `Actuellement ciblé : ${title}.`,
            mapPanelEmpty: 'Explorez les points et utilisez la liste latérale pour comparer les recommandations.',
            mapStatusTitle: 'État de la carte',
            mapStatusLoading: 'Recherche des emplacements recommandés...',
            mapStatusError: 'Certains lieux n’ont pas pu être localisés, mais la liste reste disponible.',
            mapStatusReady: 'Le style de la carte bascule automatiquement entre les modes clair et sombre.',
            listTitle: 'Lieux recommandés',
            listSubtitle: 'Cette section a son propre scroll pour que la carte reste visible.',
            imageAlt: 'Image du lieu',
            recommendationLabel: (rank) => `Recommandation #${rank}`,
            recommendationFallback: 'Destination touristique',
            mapVisible: 'Visible sur la carte',
            mapUnavailable: 'Aucun point disponible',
            descriptionFallback: 'Une expérience unique vous attend dans cette destination sélectionnée par WELLTUR.',
            locationFallback: 'Aucune localisation exacte trouvée dans le catalogue',
            focusLabel: 'Ciblé',
            selectedLabel: 'Sélectionné',
            viewOnMapLabel: 'Voir sur la carte',
            download: 'Télécharger',
            share: 'Partager',
            finish: 'Terminer',
            shareServiceLabel: 'Service touristique',
            sharePoiLabel: 'Point d’intérêt',
        },
    },
    contacts: {
        title: 'Contacts & Abonnements',
        subtitle: 'Messages récupérés depuis les formulaires de contact',
        bannerTitle: 'Que sont les contacts ?',
        bannerDescription: 'Messages envoyés par visiteurs et entreprises via les formulaires de contact de la plateforme et de la landing. Cliquez sur l’email ou le message pour voir les détails et changer le statut.',
        emptyTitle: 'Aucun contact pour le moment',
        recordsLabel: (n) => `${n} enregistrements`,
        tableEmail: 'E-mail',
        tableReason: 'Motif',
        tableMessage: 'Message',
        tableSource: 'Source',
        tableStatus: 'Statut',
        tableDate: 'Date',
        statusLabels: {
            pending: 'En attente',
            in_progress: 'En cours',
            done: 'Résolu',
            dismissed: 'Écarté',
        },
        sourceLabels: {
            landing_b2b: 'Landing B2B',
            landing_turista: 'Landing Touriste',
            plataforma_contact: 'Plateforme',
            dashboard: 'Dashboard',
        },
        reasonLabels: {
            download: 'Téléchargement app',
            join: 'Rejoindre comme service',
            tourist: 'Touriste intéressé',
            pricing: 'Tarifs et plans',
            evaluation: 'Demander une évaluation',
            suggestion: 'Suggestion',
            other: 'Autre',
        },
        statusUpdateErrorTitle: 'Erreur',
        statusUpdateErrorBody: 'Impossible de mettre à jour le statut.',
        deleteSuccessTitle: 'Contacts supprimés',
        deleteSuccessBody: (n) => `${n} contact(s) supprimé(s).`,
        detailMessageLabel: 'Message',
        detailNoMessage: 'Aucun message joint.',
        detailStatusLabel: 'Statut de suivi',
        detailClose: 'Fermer',
    },
    instruments: {
        builderTitle: 'Constructeur d’instruments',
        builderSubtitle: 'Créez et gérez des instruments d’évaluation (type formulaire)',
        newButton: 'Nouvel instrument',
        loadError: 'Impossible de charger les instruments',
        createError: 'Impossible de créer l’instrument',
        toggleError: 'Impossible de changer le statut',
        deleteError: 'Impossible de supprimer',
        searchPlaceholder: 'Rechercher un instrument…',
        empty: 'Aucun instrument',
        colName: 'Nom',
        colService: 'Service',
        colVersion: 'Version',
        colStatus: 'État',
        colActions: 'Actions',
        active: 'Actif',
        inactive: 'Inactif',
        edit: 'Modifier',
        delete: 'Supprimer',
        emptyNoResults: 'Aucun résultat',
        emptyHintNoResults: 'Essayez une autre recherche',
        emptyDefaultTitle: 'Aucun instrument',
        emptyDefaultHint: 'Créez votre premier instrument d’évaluation',
        toggleActivate: 'Activer',
        toggleDeactivate: 'Désactiver',
        createdPrefix: 'Créé :',
        modalNewTitle: 'Nouvel instrument',
        modalNewSubtitle: 'Définissez les propriétés de base',
        fieldName: 'Nom',
        fieldVersion: 'Version',
        fieldService: 'Type de service',
        selectPlaceholder: 'Sélectionner…',
        checkboxActive: 'Actif',
        cancel: 'Annuler',
        create: 'Créer',
        closeAria: 'Fermer',
    },
};

export const dashboardModulesByLang: Record<LanguageCode, DashboardModules> = {
    es,
    en,
    fr,
    pt: es,
};
