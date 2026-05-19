import type { LanguageCode } from '../../contexts/LanguageContext';
import type { DashboardModalsLocale } from './dashboardModalsLocale';
import { dashboardModalsByLang } from './dashboardModalsLocale';

export type DashboardModules = {
    common: {
        retry: string;
        delete: string;
        deleteCount: (n: number) => string;
        confirmDeleteUsers: (n: number) => string;
        confirmDeleteCompanies: (n: number) => string;
        confirmDeleteLocations: (n: number) => string;
        confirmDeleteServices: (n: number) => string;
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
    };
    companies: {
        title: string;
        subtitle: string;
        add: string;
        searchPlaceholder: string;
    };
    locations: {
        title: string;
        subtitle: string;
        add: string;
        searchPlaceholder: string;
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
    };
    activities: {
        title: string;
        subtitle: string;
        empty: string;
        colOrder: string;
        colCompany: string;
        colProduction: string;
        colEnvImpact: string;
        colSocialImpact: string;
        impactLowEnv: string;
        impactLowSocial: string;
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
    };
    poi: {
        title: string;
        subtitle: string;
        empty: string;
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
    };
    modals: DashboardModalsLocale;
    templates: {
        title: string;
        subtitle: string;
        new: string;
        empty: string;
        edit: string;
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
        confirmDeleteCompanies: (n) => `¿Eliminar ${n} compañía(s)?`,
        confirmDeleteLocations: (n) => `¿Eliminar ${n} ubicación(es)?`,
        confirmDeleteServices: (n) => `¿Eliminar ${n} servicio(s)?`,
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
    },
    companies: {
        title: 'Compañías',
        subtitle: 'Directorio de establecimientos turísticos',
        add: 'Agregar compañía',
        searchPlaceholder: 'Buscar compañía…',
    },
    locations: {
        title: 'Ubicaciones',
        subtitle: 'Lugares y destinos turísticos registrados',
        add: 'Agregar ubicación',
        searchPlaceholder: 'Buscar ubicación…',
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
    },
    activities: {
        title: 'Actividades turísticas',
        subtitle: 'Impacto social y ambiental por actividad económica',
        empty: 'No hay actividades registradas',
        colOrder: 'Orden',
        colCompany: 'Empresa',
        colProduction: 'Producción',
        colEnvImpact: 'Impacto ambiental',
        colSocialImpact: 'Impacto social',
        impactLowEnv: 'Bajo',
        impactLowSocial: 'Positivo',
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
    },
    poi: {
        title: 'Puntos de interés',
        subtitle: 'Lugares turísticos y su nivel de sostenibilidad',
        empty: 'No hay POI registrados',
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
    },
    modals: dashboardModalsByLang.es,
    templates: {
        title: 'Plantillas de evaluación',
        subtitle: 'Administración de rúbricas para auditorías de sostenibilidad',
        new: 'Nueva plantilla',
        empty: 'No hay plantillas configuradas',
        edit: 'Editar',
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
        confirmDeleteCompanies: (n) => `Delete ${n} compan(y/ies)?`,
        confirmDeleteLocations: (n) => `Delete ${n} location(s)?`,
        confirmDeleteServices: (n) => `Delete ${n} service(s)?`,
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
    },
    companies: {
        title: 'Companies',
        subtitle: 'Directory of tourism businesses',
        add: 'Add company',
        searchPlaceholder: 'Search company…',
    },
    locations: {
        title: 'Locations',
        subtitle: 'Registered places and destinations',
        add: 'Add location',
        searchPlaceholder: 'Search location…',
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
    },
    activities: {
        title: 'Tourism activities',
        subtitle: 'Social and environmental impact by economic activity',
        empty: 'No activities registered',
        colOrder: 'Order',
        colCompany: 'Company',
        colProduction: 'Production',
        colEnvImpact: 'Environmental impact',
        colSocialImpact: 'Social impact',
        impactLowEnv: 'Low',
        impactLowSocial: 'Positive',
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
    },
    poi: {
        title: 'Points of interest',
        subtitle: 'Tourist sites and sustainability level',
        empty: 'No POIs registered',
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
    },
    modals: dashboardModalsByLang.en,
    templates: {
        title: 'Evaluation templates',
        subtitle: 'Rubric management for sustainability audits',
        new: 'New template',
        empty: 'No templates configured',
        edit: 'Edit',
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
        confirmDeleteCompanies: (n) => `Supprimer ${n} entreprise(s) ?`,
        confirmDeleteLocations: (n) => `Supprimer ${n} lieu(x) ?`,
        confirmDeleteServices: (n) => `Supprimer ${n} service(s) ?`,
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
    },
    companies: {
        title: 'Entreprises',
        subtitle: 'Annuaire des établissements touristiques',
        add: 'Ajouter une entreprise',
        searchPlaceholder: 'Rechercher une entreprise…',
    },
    locations: {
        title: 'Lieux',
        subtitle: 'Lieux et destinations enregistrés',
        add: 'Ajouter un lieu',
        searchPlaceholder: 'Rechercher un lieu…',
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
    },
    activities: {
        title: 'Activités touristiques',
        subtitle: 'Impact social et environnemental par activité',
        empty: 'Aucune activité enregistrée',
        colOrder: 'Ordre',
        colCompany: 'Entreprise',
        colProduction: 'Production',
        colEnvImpact: 'Impact environnemental',
        colSocialImpact: 'Impact social',
        impactLowEnv: 'Faible',
        impactLowSocial: 'Positif',
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
    },
    poi: {
        title: 'Points d’intérêt',
        subtitle: 'Sites touristiques et niveau de durabilité',
        empty: 'Aucun POI enregistré',
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
    },
    modals: dashboardModalsByLang.fr,
    templates: {
        title: 'Modèles d’évaluation',
        subtitle: 'Gestion des rubriques pour audits de durabilité',
        new: 'Nouveau modèle',
        empty: 'Aucun modèle configuré',
        edit: 'Modifier',
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
};
