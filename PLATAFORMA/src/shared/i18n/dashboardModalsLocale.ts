import type { LanguageCode } from '../../contexts/LanguageContext';

export type SectorId = 1 | 2 | 3 | 4 | 5;

export type DashboardModalsLocale = {
    common: {
        cancel: string;
        save: string;
        saveChanges: string;
        closeSr: string;
        notApplicable: string;
    };
    users: {
        createTitle: string;
        createSubmit: string;
        profilePhoto: string;
        fullName: string;
        namePlaceholder: string;
        email: string;
        emailPlaceholder: string;
        password: string;
        passwordPlaceholder: string;
        role: string;
        roleAdmin: string;
        roleUser: string;
        editTitle: string;
        name: string;
        namePlaceholderShort: string;
        newPassword: string;
        optionalHint: string;
        passwordLeaveBlank: string;
        status: string;
        statusActive: string;
        statusInactive: string;
        detailTitle: string;
        platformAdmin: string;
        registeredUser: string;
        emailLabel: string;
        roleLabel: string;
        statusLabel: string;
        admin: string;
        user: string;
        empresa: string;
        active: string;
        inactive: string;
        created: string;
        updated: string;
        editUser: string;
        roleEmpresa: string;
        companyLinked: string;
        companySelect: string;
        loadingCompanies: string;
        noCompanies: string;
        noCompaniesHint: string;
        colPhoto: string;
        colName: string;
        colEmail: string;
        colRole: string;
        colStatus: string;
        colRegistered: string;
        filterAll: string;
    };
    companies: {
        createTitle: string;
        companyName: string;
        companyNamePh: string;
        address: string;
        addressPh: string;
        phone: string;
        phonePh: string;
        sector: string;
        location: string;
        loadingLocations: string;
        noLocations: string;
        createSubmit: string;
        editTitle: string;
        name: string;
        detailTitle: string;
        activeRegistry: string;
        addressLabel: string;
        phoneLabel: string;
        sectorLabel: string;
        registrationDate: string;
        sectorUndefined: string;
        editCompany: string;
        sectorNames: Record<SectorId, string>;
    };
    locations: {
        createTitle: string;
        locationName: string;
        locationNamePh: string;
        state: string;
        statePh: string;
        municipality: string;
        municipalityPh: string;
        mapSection: string;
        mapHint: string;
        latitude: string;
        longitude: string;
        mapClickHint: string;
        createSubmit: string;
        editTitle: string;
        name: string;
        saveChanges: string;
        detailTitle: string;
        map: string;
        editLocation: string;
    };
    touristServices: {
        createTitle: string;
        serviceName: string;
        serviceNamePh: string;
        description: string;
        descriptionPh: string;
        serviceImage: string;
        uploadImage: string;
        imageFormats: string;
        serviceType: string;
        company: string;
        location: string;
        loadingCompanies: string;
        loadingLocations: string;
        noCompanies: string;
        noLocations: string;
        createSubmit: string;
        editTitle: string;
        type: string;
        changeImage: string;
        detailTitle: string;
        scorePrefix: string;
        descriptionLabel: string;
        noDescription: string;
        statusBadgeActive: string;
        statusBadgeInactive: string;
        companyLabel: string;
        locationLabel: string;
        linkedCompany: string;
        linkedLocation: string;
        loadingCompany: string;
        loadingLocation: string;
        viewEvaluationResults: string;
        editService: string;
        serviceTypeLabels: Record<'tour' | 'hotel' | 'restaurant' | 'transporte' | 'spa', string>;
    };
    evaluations: {
        wizard: {
            title: string;
            evaluating: string;
            loadingTemplates: string;
            loadingRubric: string;
            selectTitle: string;
            selectHintPart1: string;
            selectHintPart2: string;
            fallbackTypeLabel: string;
            noTemplatesForType: (displayType: string) => string;
            templatesFetchFailed: string;
            scoreLabel: string;
            textPlaceholder: string;
            summaryTitle: string;
            generalObservations: string;
            generalObservationsPh: string;
            photoEvidence: string;
            photoEvidenceHint: string;
            photoEvidenceAlt: string;
            verificationTitle: string;
            verificationBody: string;
            back: string;
            next: string;
            finish: string;
            close: string;
            wizardSteps: readonly [
                { title: string; description: string },
                { title: string; description: string },
                { title: string; description: string },
                { title: string; description: string },
            ];
        };
        result: {
            title: string;
            loading: string;
            totalScore: string;
            ofMax: string;
            minSuffix: string;
            evaluator: (id: number) => string;
            criteriaHeading: string;
            noObservations: string;
            detailsUnavailable: string;
            generalHeading: string;
            noGeneralObservations: string;
            notFound: string;
            close: string;
        };
        toastErrorTitle: string;
        toastIncompleteBody: string;
        toastSuccessTitle: string;
        toastSuccessBody: string;
        toastRegisterErrorTitle: string;
        toastRegisterErrorBody: string;
    };
    instrumentEditor: {
        titlePrefix: string;
        unnamed: string;
        questions: (n: number) => string;
        addQuestion: string;
        saveAll: string;
        previewMode: string;
        editMode: string;
        previewSection: string;
        noActiveQuestions: string;
        metaName: string;
        metaVersion: string;
        metaServiceType: string;
        active: string;
        inactive: string;
        saveMetadata: string;
        textAnswerPlaceholder: string;
        scaleHint: string;
        noOptionsConfigured: string;
        stepInfra: string;
        stepHigiene: string;
        stepServicio: string;
        fieldTypeText: string;
        fieldTypeMultiple: string;
        fieldTypeScale: string;
        fieldTypeCheckbox: string;
        fieldTypeSelect: string;
        serviceOtro: string;
        loadFailed: string;
        retryLoad: string;
        toastMetaSavedTitle: string;
        toastMetaSavedBody: string;
        toastMetaErrorTitle: string;
        toastMetaErrorBody: string;
        toastCriteriaSavedTitle: string;
        toastCriteriaSavedBody: string;
        toastCriteriaErrorTitle: string;
        toastCriteriaErrorBody: string;
        typeColon: string;
        questionNamePlaceholder: string;
        criterionInstructionPlaceholder: string;
        levelDescriptionPlaceholder: string;
        pointsShort: string;
        weightLabel: string;
        selectPlaceholder: string;
        emptyQuestionsHint: string;
        noLevelsShort: string;
        noLevelsTooltip: string;
        moveUpTitle: string;
        moveDownTitle: string;
        fieldTypeColumn: string;
        evaluationStepColumn: string;
        stepUnassigned: string;
        requiredFieldLabel: string;
        optionalDescriptionLabel: string;
        optionsLevelsLabel: string;
        addOption: string;
        ptsWord: string;
    };
};

const es: DashboardModalsLocale = {
    common: {
        cancel: 'Cancelar',
        save: 'Guardar',
        saveChanges: 'Guardar cambios',
        closeSr: 'Cerrar',
        notApplicable: 'N/D',
    },
    users: {
        createTitle: 'Crear usuario',
        createSubmit: 'Crear usuario',
        profilePhoto: 'Foto de perfil',
        fullName: 'Nombre completo',
        namePlaceholder: 'Ej. Juan Pérez',
        email: 'Correo electrónico',
        emailPlaceholder: 'user@ejemplo.com',
        password: 'Contraseña',
        passwordPlaceholder: '••••••••',
        role: 'Rol',
        roleAdmin: 'Administrador',
        roleUser: 'Usuario',
        editTitle: 'Editar usuario',
        name: 'Nombre',
        namePlaceholderShort: 'Nombre completo',
        newPassword: 'Nueva contraseña',
        optionalHint: '(opcional)',
        passwordLeaveBlank: 'Dejar vacío para no cambiar',
        status: 'Estado',
        statusActive: 'Activo',
        statusInactive: 'Inactivo',
        detailTitle: 'Detalle del usuario',
        platformAdmin: 'Administrador de la plataforma',
        registeredUser: 'Usuario registrado',
        emailLabel: 'Correo electrónico',
        roleLabel: 'Rol',
        statusLabel: 'Estado',
        admin: 'Administrador',
        user: 'Usuario',
        empresa: 'Empresa',
        active: 'Activo',
        inactive: 'Inactivo',
        created: 'Creado',
        updated: 'Actualizado',
        editUser: 'Editar usuario',
        roleEmpresa: 'Empresa turística',
        companyLinked: 'Empresa vinculada',
        companySelect: 'Selecciona una empresa…',
        loadingCompanies: 'Cargando empresas…',
        noCompanies: 'Sin empresas registradas.',
        noCompaniesHint: 'Crea una primero en Compañías.',
        colPhoto: 'Foto',
        colName: 'Nombre',
        colEmail: 'Email',
        colRole: 'Rol',
        colStatus: 'Estado',
        colRegistered: 'Registrado',
        filterAll: 'Todos',
    },
    companies: {
        createTitle: 'Crear nueva compañía',
        companyName: 'Nombre de la compañía',
        companyNamePh: 'Ej. Hotel Sierra Verde',
        address: 'Dirección',
        addressPh: 'Av. Principal #123',
        phone: 'Teléfono',
        phonePh: '+52 …',
        sector: 'Sector turístico',
        location: 'Ubicación',
        loadingLocations: 'Cargando ubicaciones…',
        noLocations: 'No hay ubicaciones registradas.',
        createSubmit: 'Crear compañía',
        editTitle: 'Editar compañía',
        name: 'Nombre',
        detailTitle: 'Detalle de la compañía',
        activeRegistry: 'Registro activo en el sistema',
        addressLabel: 'Dirección',
        phoneLabel: 'Teléfono',
        sectorLabel: 'Sector',
        registrationDate: 'Fecha de registro',
        sectorUndefined: 'Sector no definido',
        editCompany: 'Editar compañía',
        sectorNames: {
            1: 'Alojamiento',
            2: 'Alimentos y bebidas',
            3: 'Transporte turístico',
            4: 'Agencias de viaje',
            5: 'Entretenimiento y cultura',
        },
    },
    locations: {
        createTitle: 'Crear nueva ubicación',
        locationName: 'Nombre de la ubicación',
        locationNamePh: 'Ej. Parque central',
        state: 'Estado',
        statePh: 'Ej. Chiapas',
        municipality: 'Municipio',
        municipalityPh: 'Ej. Tuxtla Gtz',
        mapSection: 'Ubicación en el mapa',
        mapHint: 'Haz clic o arrastra el marcador',
        latitude: 'Latitud',
        longitude: 'Longitud',
        mapClickHint: 'Haz clic en el mapa para seleccionar la posición exacta',
        createSubmit: 'Crear ubicación',
        editTitle: 'Editar ubicación',
        name: 'Nombre',
        saveChanges: 'Guardar cambios',
        detailTitle: 'Detalle de ubicación',
        map: 'Mapa',
        editLocation: 'Editar ubicación',
    },
    touristServices: {
        createTitle: 'Crear nuevo servicio',
        serviceName: 'Nombre del servicio',
        serviceNamePh: 'Ej. Tour por la ciudad',
        description: 'Descripción',
        descriptionPh: 'Describe el servicio…',
        serviceImage: 'Imagen del servicio',
        uploadImage: 'Subir imagen',
        imageFormats: 'JPG, PNG o WebP',
        serviceType: 'Tipo de servicio',
        company: 'Compañía',
        location: 'Ubicación',
        loadingCompanies: 'Cargando compañías…',
        loadingLocations: 'Cargando ubicaciones…',
        noCompanies: 'No hay compañías registradas.',
        noLocations: 'No hay ubicaciones registradas.',
        createSubmit: 'Crear servicio',
        editTitle: 'Editar servicio',
        type: 'Tipo',
        changeImage: 'Cambiar imagen',
        detailTitle: 'Detalle del servicio',
        scorePrefix: 'Puntaje:',
        descriptionLabel: 'Descripción',
        noDescription: 'Sin descripción disponible',
        statusBadgeActive: 'ACTIVO',
        statusBadgeInactive: 'INACTIVO',
        companyLabel: 'Compañía',
        locationLabel: 'Ubicación',
        linkedCompany: 'Compañía vinculada',
        linkedLocation: 'Ubicación vinculada',
        loadingCompany: 'Cargando compañía…',
        loadingLocation: 'Cargando ubicación…',
        viewEvaluationResults: 'Ver resultados de evaluación',
        editService: 'Editar servicio',
        serviceTypeLabels: {
            tour: 'Tour',
            hotel: 'Hotel',
            restaurant: 'Restaurante',
            transporte: 'Transporte',
            spa: 'Spa',
        },
    },
    evaluations: {
        wizard: {
            title: 'Evaluación de servicio',
            evaluating: 'Evaluando:',
            loadingTemplates: 'Buscando instrumento de evaluación…',
            loadingRubric: 'Cargando rúbrica de evaluación…',
            selectTitle: 'Selecciona el instrumento',
            selectHintPart1: 'Hay varios instrumentos para',
            selectHintPart2: '. Elige el que deseas aplicar.',
            fallbackTypeLabel: 'este servicio',
            noTemplatesForType: (displayType: string) =>
                `No hay instrumentos de evaluación activos para el tipo "${displayType}". Crea uno en Constructor de instrumentos.`,
            templatesFetchFailed: 'No se pudieron cargar los instrumentos de evaluación.',
            scoreLabel: 'Puntaje:',
            textPlaceholder: 'Escribe tu respuesta aquí…',
            summaryTitle: 'Resumen y evidencias',
            generalObservations: 'Observaciones generales',
            generalObservationsPh: 'Escribe aquí las observaciones generales de la evaluación…',
            photoEvidence: 'Evidencias fotográficas',
            photoEvidenceHint: 'Haz clic para subir fotos o arrastra los archivos aquí',
            photoEvidenceAlt: 'Evidencia',
            verificationTitle: 'Verificación de datos',
            verificationBody:
                'Al finalizar la evaluación, el puntaje se calculará automáticamente y los resultados quedarán vinculados a este servicio.',
            back: 'Atrás',
            next: 'Siguiente',
            finish: 'Finalizar evaluación',
            close: 'Cerrar',
            wizardSteps: [
                { title: 'Infraestructura', description: 'Espacio y accesibilidad' },
                { title: 'Higiene y limpieza', description: 'NOM-251 / Distintivo H' },
                { title: 'Servicio y calidad', description: 'Atención y experiencia' },
                { title: 'Resumen', description: 'Evidencia final' },
            ] as const,
        },
        result: {
            title: 'Resultados de evaluación',
            loading: 'Recuperando detalles de la evaluación…',
            totalScore: 'Puntaje total',
            ofMax: '/ 4.0',
            minSuffix: 'min',
            evaluator: (id: number) => `Evaluador #${id}`,
            criteriaHeading: 'Detalle por criterios',
            noObservations: 'Sin observaciones',
            detailsUnavailable:
                'Los detalles específicos por criterio no están disponibles en esta vista.',
            generalHeading: 'Observaciones generales',
            noGeneralObservations: 'No se registraron observaciones generales.',
            notFound: 'No se encontró la información de la evaluación.',
            close: 'Cerrar',
        },
        toastErrorTitle: 'Error',
        toastIncompleteBody: 'Por favor responde todos los criterios antes de finalizar.',
        toastSuccessTitle: 'Evaluación registrada',
        toastSuccessBody: '¡Gracias por completar la evaluación!',
        toastRegisterErrorTitle: 'Error',
        toastRegisterErrorBody: 'Ocurrió un error al registrar la evaluación',
    },
    instrumentEditor: {
        titlePrefix: 'Editor:',
        unnamed: 'Sin nombre',
        questions: (n: number) => `Preguntas (${n})`,
        addQuestion: 'Agregar pregunta',
        saveAll: 'Guardar todo',
        previewMode: 'Vista previa',
        editMode: 'Editar',
        previewSection: 'Vista previa',
        noActiveQuestions: 'Sin preguntas activas',
        metaName: 'Nombre',
        metaVersion: 'Versión',
        metaServiceType: 'Tipo servicio',
        active: 'Activo',
        inactive: 'Inactivo',
        saveMetadata: 'Guardar',
        textAnswerPlaceholder: 'Respuesta de texto…',
        scaleHint: '1=Malo, 5=Excelente',
        noOptionsConfigured: 'Sin opciones configuradas',
        stepInfra: 'Infraestructura',
        stepHigiene: 'Higiene y limpieza',
        stepServicio: 'Servicio y calidad',
        fieldTypeText: 'Texto',
        fieldTypeMultiple: 'Opción múltiple',
        fieldTypeScale: 'Escala / rating',
        fieldTypeCheckbox: 'Casillas',
        fieldTypeSelect: 'Lista',
        serviceOtro: 'Otro',
        loadFailed: 'No se pudo cargar el instrumento',
        retryLoad: 'Reintentar',
        toastMetaSavedTitle: 'Instrumento guardado',
        toastMetaSavedBody: 'Cambios aplicados correctamente',
        toastMetaErrorTitle: 'Error al guardar',
        toastMetaErrorBody: 'No se pudieron guardar los cambios',
        toastCriteriaSavedTitle: 'Criterios guardados',
        toastCriteriaSavedBody: 'Todas las preguntas se guardaron correctamente',
        toastCriteriaErrorTitle: 'Error al guardar',
        toastCriteriaErrorBody: 'No se pudieron guardar todos los criterios',
        typeColon: 'Tipo:',
        questionNamePlaceholder: 'Escribe la pregunta…',
        criterionInstructionPlaceholder: 'Instrucciones o ayuda para esta pregunta',
        levelDescriptionPlaceholder: 'Descripción',
        pointsShort: 'Pts',
        weightLabel: 'Peso',
        selectPlaceholder: 'Seleccionar…',
        emptyQuestionsHint: 'No hay preguntas. Haz clic en «Agregar pregunta».',
        noLevelsShort: 'Sin niveles',
        noLevelsTooltip: 'Sin niveles definidos',
        moveUpTitle: 'Mover arriba',
        moveDownTitle: 'Mover abajo',
        fieldTypeColumn: 'Tipo de campo',
        evaluationStepColumn: 'Etapa de evaluación',
        stepUnassigned: 'Sin asignar',
        requiredFieldLabel: 'Campo requerido',
        optionalDescriptionLabel: 'Descripción (opcional)',
        optionsLevelsLabel: 'Opciones / niveles',
        addOption: 'Agregar opción',
        ptsWord: 'pts',
    },
};

const en: DashboardModalsLocale = {
    common: {
        cancel: 'Cancel',
        save: 'Save',
        saveChanges: 'Save changes',
        closeSr: 'Close',
        notApplicable: 'N/A',
    },
    users: {
        createTitle: 'Create user',
        createSubmit: 'Create user',
        profilePhoto: 'Profile photo',
        fullName: 'Full name',
        namePlaceholder: 'e.g. Jane Doe',
        email: 'Email',
        emailPlaceholder: 'user@example.com',
        password: 'Password',
        passwordPlaceholder: '••••••••',
        role: 'Role',
        roleAdmin: 'Administrator',
        roleUser: 'User',
        editTitle: 'Edit user',
        name: 'Name',
        namePlaceholderShort: 'Full name',
        newPassword: 'New password',
        optionalHint: '(optional)',
        passwordLeaveBlank: 'Leave blank to keep current password',
        status: 'Status',
        statusActive: 'Active',
        statusInactive: 'Inactive',
        detailTitle: 'User details',
        platformAdmin: 'Platform administrator',
        registeredUser: 'Registered user',
        emailLabel: 'Email',
        roleLabel: 'Role',
        statusLabel: 'Status',
        admin: 'Administrator',
        user: 'User',
        empresa: 'Company',
        active: 'Active',
        inactive: 'Inactive',
        created: 'Created',
        updated: 'Updated',
        editUser: 'Edit user',
        roleEmpresa: 'Tourism company',
        companyLinked: 'Linked company',
        companySelect: 'Select a company…',
        loadingCompanies: 'Loading companies…',
        noCompanies: 'No companies registered.',
        noCompaniesHint: 'Create one first under Companies.',
        colPhoto: 'Photo',
        colName: 'Name',
        colEmail: 'Email',
        colRole: 'Role',
        colStatus: 'Status',
        colRegistered: 'Registered',
        filterAll: 'All',
    },
    companies: {
        createTitle: 'Create new company',
        companyName: 'Company name',
        companyNamePh: 'e.g. Sierra Verde Hotel',
        address: 'Address',
        addressPh: '123 Main Ave',
        phone: 'Phone',
        phonePh: '+1 …',
        sector: 'Tourism sector',
        location: 'Location',
        loadingLocations: 'Loading locations…',
        noLocations: 'No locations registered.',
        createSubmit: 'Create company',
        editTitle: 'Edit company',
        name: 'Name',
        detailTitle: 'Company details',
        activeRegistry: 'Active record in the system',
        addressLabel: 'Address',
        phoneLabel: 'Phone',
        sectorLabel: 'Sector',
        registrationDate: 'Registration date',
        sectorUndefined: 'Sector not defined',
        editCompany: 'Edit company',
        sectorNames: {
            1: 'Lodging',
            2: 'Food and beverage',
            3: 'Tourist transport',
            4: 'Travel agencies',
            5: 'Entertainment and culture',
        },
    },
    locations: {
        createTitle: 'Create new location',
        locationName: 'Location name',
        locationNamePh: 'e.g. Central Park',
        state: 'State / region',
        statePh: 'e.g. Chiapas',
        municipality: 'Municipality',
        municipalityPh: 'e.g. Tuxtla Gutiérrez',
        mapSection: 'Location on map',
        mapHint: 'Click or drag the marker',
        latitude: 'Latitude',
        longitude: 'Longitude',
        mapClickHint: 'Click the map to pick the exact position',
        createSubmit: 'Create location',
        editTitle: 'Edit location',
        name: 'Name',
        saveChanges: 'Save changes',
        detailTitle: 'Location details',
        map: 'Map',
        editLocation: 'Edit location',
    },
    touristServices: {
        createTitle: 'Create new service',
        serviceName: 'Service name',
        serviceNamePh: 'e.g. City tour',
        description: 'Description',
        descriptionPh: 'Describe the service…',
        serviceImage: 'Service image',
        uploadImage: 'Upload image',
        imageFormats: 'JPG, PNG, or WebP',
        serviceType: 'Service type',
        company: 'Company',
        location: 'Location',
        loadingCompanies: 'Loading companies…',
        loadingLocations: 'Loading locations…',
        noCompanies: 'No companies registered.',
        noLocations: 'No locations registered.',
        createSubmit: 'Create service',
        editTitle: 'Edit service',
        type: 'Type',
        changeImage: 'Change image',
        detailTitle: 'Service details',
        scorePrefix: 'Score:',
        descriptionLabel: 'Description',
        noDescription: 'No description available',
        statusBadgeActive: 'ACTIVE',
        statusBadgeInactive: 'INACTIVE',
        companyLabel: 'Company',
        locationLabel: 'Location',
        linkedCompany: 'Linked company',
        linkedLocation: 'Linked location',
        loadingCompany: 'Loading company…',
        loadingLocation: 'Loading location…',
        viewEvaluationResults: 'View evaluation results',
        editService: 'Edit service',
        serviceTypeLabels: {
            tour: 'Tour',
            hotel: 'Hotel',
            restaurant: 'Restaurant',
            transporte: 'Transport',
            spa: 'Spa',
        },
    },
    evaluations: {
        wizard: {
            title: 'Service evaluation',
            evaluating: 'Evaluating:',
            loadingTemplates: 'Finding evaluation instrument…',
            loadingRubric: 'Loading evaluation rubric…',
            selectTitle: 'Select instrument',
            selectHintPart1: 'There are several instruments for',
            selectHintPart2: '. Choose which one to apply.',
            fallbackTypeLabel: 'this service',
            noTemplatesForType: (displayType: string) =>
                `No active evaluation instruments for type "${displayType}". Create one in the Instrument Builder.`,
            templatesFetchFailed: 'Could not load evaluation instruments.',
            scoreLabel: 'Score:',
            textPlaceholder: 'Write your answer here…',
            summaryTitle: 'Summary and evidence',
            generalObservations: 'General observations',
            generalObservationsPh: 'Write general observations for this evaluation…',
            photoEvidence: 'Photo evidence',
            photoEvidenceHint: 'Click to upload photos or drag files here',
            photoEvidenceAlt: 'Evidence',
            verificationTitle: 'Data verification',
            verificationBody:
                'When you finish, the score will be calculated automatically and results will be linked to this service.',
            back: 'Back',
            next: 'Next',
            finish: 'Submit evaluation',
            close: 'Close',
            wizardSteps: [
                { title: 'Infrastructure', description: 'Space and accessibility' },
                { title: 'Hygiene and cleaning', description: 'NOM-251 / H badge' },
                { title: 'Service and quality', description: 'Attention and experience' },
                { title: 'Summary', description: 'Final evidence' },
            ] as const,
        },
        result: {
            title: 'Evaluation results',
            loading: 'Loading evaluation details…',
            totalScore: 'Total score',
            ofMax: '/ 4.0',
            minSuffix: 'min',
            evaluator: (id: number) => `Evaluator #${id}`,
            criteriaHeading: 'Criteria breakdown',
            noObservations: 'No observations',
            detailsUnavailable: 'Per-criterion details are not available in this view.',
            generalHeading: 'General observations',
            noGeneralObservations: 'No general observations were recorded.',
            notFound: 'Evaluation information could not be found.',
            close: 'Close',
        },
        toastErrorTitle: 'Error',
        toastIncompleteBody: 'Please answer all criteria before finishing.',
        toastSuccessTitle: 'Evaluation saved',
        toastSuccessBody: 'Thank you for completing the evaluation!',
        toastRegisterErrorTitle: 'Error',
        toastRegisterErrorBody: 'Could not register the evaluation',
    },
    instrumentEditor: {
        titlePrefix: 'Editor:',
        unnamed: 'Untitled',
        questions: (n: number) => `Questions (${n})`,
        addQuestion: 'Add question',
        saveAll: 'Save all',
        previewMode: 'Preview',
        editMode: 'Edit',
        previewSection: 'Preview',
        noActiveQuestions: 'No active questions',
        metaName: 'Name',
        metaVersion: 'Version',
        metaServiceType: 'Service type',
        active: 'Active',
        inactive: 'Inactive',
        saveMetadata: 'Save',
        textAnswerPlaceholder: 'Text answer…',
        scaleHint: '1=Poor, 5=Excellent',
        noOptionsConfigured: 'No options configured',
        stepInfra: 'Infrastructure',
        stepHigiene: 'Hygiene and cleaning',
        stepServicio: 'Service and quality',
        fieldTypeText: 'Text',
        fieldTypeMultiple: 'Multiple choice',
        fieldTypeScale: 'Scale / rating',
        fieldTypeCheckbox: 'Checkboxes',
        fieldTypeSelect: 'Dropdown',
        serviceOtro: 'Other',
        loadFailed: 'Could not load instrument',
        retryLoad: 'Retry',
        toastMetaSavedTitle: 'Instrument saved',
        toastMetaSavedBody: 'Changes applied successfully',
        toastMetaErrorTitle: 'Save failed',
        toastMetaErrorBody: 'Could not save changes',
        toastCriteriaSavedTitle: 'Criteria saved',
        toastCriteriaSavedBody: 'All questions were saved successfully',
        toastCriteriaErrorTitle: 'Save failed',
        toastCriteriaErrorBody: 'Could not save all criteria',
        typeColon: 'Type:',
        questionNamePlaceholder: 'Enter the question…',
        criterionInstructionPlaceholder: 'Instructions or help for this question',
        levelDescriptionPlaceholder: 'Description',
        pointsShort: 'Pts',
        weightLabel: 'Weight',
        selectPlaceholder: 'Select…',
        emptyQuestionsHint: 'No questions yet. Click «Add question».',
        noLevelsShort: 'No levels',
        noLevelsTooltip: 'No levels defined',
        moveUpTitle: 'Move up',
        moveDownTitle: 'Move down',
        fieldTypeColumn: 'Field type',
        evaluationStepColumn: 'Evaluation step',
        stepUnassigned: 'Unassigned',
        requiredFieldLabel: 'Required field',
        optionalDescriptionLabel: 'Description (optional)',
        optionsLevelsLabel: 'Options / levels',
        addOption: 'Add option',
        ptsWord: 'pts',
    },
};

const fr: DashboardModalsLocale = {
    common: {
        cancel: ‘Annuler’,
        save: ‘Enregistrer’,
        saveChanges: ‘Enregistrer les modifications’,
        closeSr: ‘Fermer’,
        notApplicable: ‘N/D’,
    },
    users: {
        createTitle: ‘Créer un utilisateur’,
        createSubmit: "Créer l’utilisateur",
        profilePhoto: ‘Photo de profil’,
        fullName: ‘Nom complet’,
        namePlaceholder: ‘Ex. Marie Dupont’,
        email: ‘Adresse e-mail’,
        emailPlaceholder: ‘utilisateur@exemple.com’,
        password: ‘Mot de passe’,
        passwordPlaceholder: ‘••••••••’,
        role: ‘Rôle’,
        roleAdmin: ‘Administrateur’,
        roleUser: ‘Utilisateur’,
        editTitle: "Modifier l’utilisateur",
        name: ‘Nom’,
        namePlaceholderShort: ‘Nom complet’,
        newPassword: ‘Nouveau mot de passe’,
        optionalHint: ‘(facultatif)’,
        passwordLeaveBlank: ‘Laisser vide pour ne pas modifier’,
        status: ‘État’,
        statusActive: ‘Actif’,
        statusInactive: ‘Inactif’,
        detailTitle: "Détails de l’utilisateur",
        platformAdmin: ‘Administrateur de la plateforme’,
        registeredUser: ‘Utilisateur enregistré’,
        emailLabel: ‘Adresse e-mail’,
        roleLabel: ‘Rôle’,
        statusLabel: ‘État’,
        admin: ‘Administrateur’,
        user: ‘Utilisateur’,
        empresa: ‘Entreprise’,
        active: ‘Actif’,
        inactive: ‘Inactif’,
        created: ‘Créé’,
        updated: ‘Mis à jour’,
        editUser: "Modifier l’utilisateur",
        roleEmpresa: ‘Entreprise touristique’,
        companyLinked: ‘Entreprise liée’,
        companySelect: ‘Sélectionnez une entreprise…’,
        loadingCompanies: ‘Chargement des entreprises…’,
        noCompanies: ‘Aucune entreprise enregistrée.’,
        noCompaniesHint: ‘Créez-en une dans Entreprises.’,
        colPhoto: ‘Photo’,
        colName: ‘Nom’,
        colEmail: ‘E-mail’,
        colRole: ‘Rôle’,
        colStatus: ‘État’,
        colRegistered: ‘Inscrit’,
        filterAll: ‘Tous’,
    },
    companies: {
        createTitle: ‘Créer une entreprise’,
        companyName: "Nom de l’entreprise",
        companyNamePh: ‘Ex. Hôtel Sierra Verde’,
        address: ‘Adresse’,
        addressPh: ‘Av. Principale 123’,
        phone: ‘Téléphone’,
        phonePh: ‘+33 …’,
        sector: ‘Secteur touristique’,
        location: ‘Lieu’,
        loadingLocations: ‘Chargement des lieux…’,
        noLocations: ‘Aucun lieu enregistré.’,
        createSubmit: "Créer l’entreprise",
        editTitle: "Modifier l’entreprise",
        name: ‘Nom’,
        detailTitle: "Détails de l’entreprise",
        activeRegistry: ‘Enregistrement actif dans le système’,
        addressLabel: ‘Adresse’,
        phoneLabel: ‘Téléphone’,
        sectorLabel: ‘Secteur’,
        registrationDate: "Date d’enregistrement",
        sectorUndefined: ‘Secteur non défini’,
        editCompany: "Modifier l’entreprise",
        sectorNames: {
            1: ‘Hébergement’,
            2: ‘Restauration et boissons’,
            3: ‘Transport touristique’,
            4: ‘Agences de voyage’,
            5: ‘Divertissement et culture’,
        },
    },
    locations: {
        createTitle: ‘Créer un nouveau lieu’,
        locationName: ‘Nom du lieu’,
        locationNamePh: ‘Ex. Parc central’,
        state: ‘État / région’,
        statePh: ‘Ex. Chiapas’,
        municipality: ‘Commune’,
        municipalityPh: ‘Ex. Tuxtla Gutiérrez’,
        mapSection: ‘Emplacement sur la carte’,
        mapHint: ‘Cliquez ou faites glisser le marqueur’,
        latitude: ‘Latitude’,
        longitude: ‘Longitude’,
        mapClickHint: ‘Cliquez sur la carte pour choisir la position exacte’,
        createSubmit: ‘Créer le lieu’,
        editTitle: ‘Modifier le lieu’,
        name: ‘Nom’,
        saveChanges: ‘Enregistrer les modifications’,
        detailTitle: ‘Détails du lieu’,
        map: ‘Carte’,
        editLocation: ‘Modifier le lieu’,
    },
    touristServices: {
        createTitle: ‘Créer un nouveau service’,
        serviceName: ‘Nom du service’,
        serviceNamePh: ‘Ex. Visite de la ville’,
        description: ‘Description’,
        descriptionPh: ‘Décrivez le service…’,
        serviceImage: ‘Image du service’,
        uploadImage: ‘Téléverser une image’,
        imageFormats: ‘JPG, PNG ou WebP’,
        serviceType: ‘Type de service’,
        company: ‘Entreprise’,
        location: ‘Lieu’,
        loadingCompanies: ‘Chargement des entreprises…’,
        loadingLocations: ‘Chargement des lieux…’,
        noCompanies: ‘Aucune entreprise enregistrée.’,
        noLocations: ‘Aucun lieu enregistré.’,
        createSubmit: ‘Créer le service’,
        editTitle: ‘Modifier le service’,
        type: ‘Type’,
        changeImage: "Changer l’image",
        detailTitle: ‘Détails du service’,
        scorePrefix: ‘Score :’,
        descriptionLabel: ‘Description’,
        noDescription: ‘Aucune description disponible’,
        statusBadgeActive: ‘ACTIF’,
        statusBadgeInactive: ‘INACTIF’,
        companyLabel: ‘Entreprise’,
        locationLabel: ‘Lieu’,
        linkedCompany: ‘Entreprise liée’,
        linkedLocation: ‘Lieu lié’,
        loadingCompany: "Chargement de l’entreprise…",
        loadingLocation: ‘Chargement du lieu…’,
        viewEvaluationResults: "Voir les résultats d’évaluation",
        editService: ‘Modifier le service’,
        serviceTypeLabels: {
            tour: ‘Circuit’,
            hotel: ‘Hôtel’,
            restaurant: ‘Restaurant’,
            transporte: ‘Transport’,
            spa: ‘Spa’,
        },
    },
    evaluations: {
        wizard: {
            title: ‘Évaluation du service’,
            evaluating: ‘Évaluation :’,
            loadingTemplates: "Recherche de l’instrument d’évaluation…",
            loadingRubric: "Chargement de la grille d’évaluation…",
            selectTitle: "Sélectionnez l’instrument",
            selectHintPart1: ‘Plusieurs instruments existent pour’,
            selectHintPart2: ‘. Choisissez celui à appliquer.’,
            fallbackTypeLabel: ‘ce service’,
            noTemplatesForType: (displayType: string) =>
                `Aucun instrument d’évaluation actif pour le type « ${displayType} ». Créez-en un dans le constructeur d’instruments.`,
            templatesFetchFailed: "Impossible de charger les instruments d’évaluation.",
            scoreLabel: ‘Score :’,
            textPlaceholder: ‘Saisissez votre réponse ici…’,
            summaryTitle: ‘Résumé et preuves’,
            generalObservations: ‘Observations générales’,
            generalObservationsPh: ‘Observations générales sur cette évaluation…’,
            photoEvidence: ‘Preuves photographiques’,
            photoEvidenceHint: ‘Cliquez pour importer des photos ou déposez les fichiers ici’,
            photoEvidenceAlt: ‘Preuve’,
            verificationTitle: ‘Vérification des données’,
            verificationBody:
                ‘À la fin, le score sera calculé automatiquement et les résultats seront liés à ce service.’,
            back: ‘Retour’,
            next: ‘Suivant’,
            finish: "Terminer l’évaluation",
            close: ‘Fermer’,
            wizardSteps: [
                { title: ‘Infrastructure’, description: ‘Espace et accessibilité’ },
                { title: ‘Hygiène et nettoyage’, description: ‘NOM-251 / Distinctif H’ },
                { title: ‘Service et qualité’, description: ‘Accueil et expérience’ },
                { title: ‘Résumé’, description: ‘Preuve finale’ },
            ] as const,
        },
        result: {
            title: "Résultats de l’évaluation",
            loading: "Chargement des détails de l’évaluation…",
            totalScore: ‘Score total’,
            ofMax: ‘/ 4,0’,
            minSuffix: ‘min’,
            evaluator: (id: number) => `Évaluateur #${id}`,
            criteriaHeading: ‘Détail par critères’,
            noObservations: ‘Sans observations’,
            detailsUnavailable:
                "Le détail par critère n’est pas disponible dans cette vue.",
            generalHeading: ‘Observations générales’,
            noGeneralObservations: ‘Aucune observation générale enregistrée.’,
            notFound: "Informations d’évaluation introuvables.",
            close: ‘Fermer’,
        },
        toastErrorTitle: ‘Erreur’,
        toastIncompleteBody: ‘Veuillez répondre à tous les critères avant de terminer.’,
        toastSuccessTitle: ‘Évaluation enregistrée’,
        toastSuccessBody: "Merci d’avoir complété l’évaluation !",
        toastRegisterErrorTitle: ‘Erreur’,
        toastRegisterErrorBody: "Impossible d’enregistrer l’évaluation",
    },
    instrumentEditor: {
        titlePrefix: ‘Éditeur :’,
        unnamed: ‘Sans nom’,
        questions: (n: number) => `Questions (${n})`,
        addQuestion: ‘Ajouter une question’,
        saveAll: ‘Tout enregistrer’,
        previewMode: ‘Aperçu’,
        editMode: ‘Modifier’,
        previewSection: ‘Aperçu’,
        noActiveQuestions: ‘Aucune question active’,
        metaName: ‘Nom’,
        metaVersion: ‘Version’,
        metaServiceType: ‘Type de service’,
        active: ‘Actif’,
        inactive: ‘Inactif’,
        saveMetadata: ‘Enregistrer’,
        textAnswerPlaceholder: ‘Réponse texte…’,
        scaleHint: ‘1=Mauvais, 5=Excellent’,
        noOptionsConfigured: ‘Aucune option configurée’,
        stepInfra: ‘Infrastructure’,
        stepHigiene: ‘Hygiène et nettoyage’,
        stepServicio: ‘Service et qualité’,
        fieldTypeText: ‘Texte’,
        fieldTypeMultiple: ‘Choix multiples’,
        fieldTypeScale: ‘Échelle / notation’,
        fieldTypeCheckbox: ‘Cases à cocher’,
        fieldTypeSelect: ‘Liste’,
        serviceOtro: ‘Autre’,
        loadFailed: "Impossible de charger l’instrument",
        retryLoad: ‘Réessayer’,
        toastMetaSavedTitle: ‘Instrument enregistré’,
        toastMetaSavedBody: ‘Modifications appliquées’,
        toastMetaErrorTitle: "Erreur d’enregistrement",
        toastMetaErrorBody: "Impossible d’enregistrer les modifications",
        toastCriteriaSavedTitle: ‘Critères enregistrés’,
        toastCriteriaSavedBody: ‘Toutes les questions ont été enregistrées’,
        toastCriteriaErrorTitle: "Erreur d’enregistrement",
        toastCriteriaErrorBody: "Impossible d’enregistrer tous les critères",
        typeColon: ‘Type :’,
        questionNamePlaceholder: ‘Saisissez la question…’,
        criterionInstructionPlaceholder: ‘Consignes ou aide pour cette question’,
        levelDescriptionPlaceholder: ‘Description’,
        pointsShort: ‘Pts’,
        weightLabel: ‘Poids’,
        selectPlaceholder: ‘Sélectionner…’,
        emptyQuestionsHint: ‘Aucune question. Cliquez sur « Ajouter une question ».’,
        noLevelsShort: ‘Sans niveaux’,
        noLevelsTooltip: ‘Aucun niveau défini’,
        moveUpTitle: ‘Monter’,
        moveDownTitle: ‘Descendre’,
        fieldTypeColumn: ‘Type de champ’,
        evaluationStepColumn: "Étape d’évaluation",
        stepUnassigned: ‘Non attribué’,
        requiredFieldLabel: ‘Champ obligatoire’,
        optionalDescriptionLabel: ‘Description (facultatif)’,
        optionsLevelsLabel: ‘Options / niveaux’,
        addOption: ‘Ajouter une option’,
        ptsWord: ‘pts’,
    },
};

export const dashboardModalsByLang: Record<LanguageCode, DashboardModalsLocale> = {
    es,
    en,
    fr,
};
