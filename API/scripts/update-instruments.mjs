/**
 * Actualiza los instrumentos de evaluación en la BD con rúbricas completas y profesionales.
 * Restaurante: 18 criterios basados en SECTUR/NOM-251-SSA1/Distintivo H/Michelin.
 * Hotel: 15 criterios basados en NOM-010-TUR-2001 y estándares SECTUR.
 *
 * Uso:  node scripts/update-instruments.mjs
 * Desde la carpeta API con el .env cargado (o DATABASE_URL definida).
 */
import 'dotenv/config';
import pg from 'pg';

// ─── Conexión ────────────────────────────────────────────────────────────────
const { Client } = pg;
const client = new Client(
    process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL }
        : {
              host:     process.env.DB_HOST     || 'localhost',
              port:     parseInt(process.env.DB_PORT || '5432'),
              database: process.env.DB_NAME,
              user:     process.env.DB_USER,
              password: process.env.DB_PASSWORD,
          }
);

// ─── Datos: Restaurante ───────────────────────────────────────────────────────
const RESTAURANT_TEMPLATE = {
    name:         'Instrumento de Evaluación Restaurantera SMARTUR',
    version:      '2.0',
    service_type: 'restaurante',
};

const RESTAURANT_CRITERIA = [
    // ── INFRAESTRUCTURA ──────────────────────────────────────────────────────
    {
        name:  'Área del Cliente',
        step:  'infraestructura',
        desc:  'Evalúa el espacio destinado a los comensales: distribución, mobiliario, comodidad, iluminación y cumplimiento de normas de aforo (mín. 1.5 m² por comensal, normativa local).',
        levels: [
            { score: 0, text: 'Instalaciones limitadas, mobiliario básico o deteriorado; espacios inferiores a 1.5 m² por comensal.' },
            { score: 1, text: 'Instalaciones funcionales, mobiliario cómodo, cumplimiento mínimo de 1.5 m² por comensal.' },
            { score: 2, text: 'Ambientes confortables con decoración básica, mobiliario en buen estado y cumplimiento de 1.5 m²/comensal.' },
            { score: 3, text: 'Diseño planificado y decoración coherente; áreas funcionales y espaciosas (>1.5 m²/comensal).' },
            { score: 4, text: 'Diseño de autor, materiales premium, confort total, innovación arquitectónica y amplios espacios (>1.5 m²/comensal).' },
        ],
    },
    {
        name:  'Sanitarios para Clientes',
        step:  'infraestructura',
        desc:  'Estado general, limpieza continua, equipamiento, mantenimiento y ventilación de los sanitarios destinados al público.',
        levels: [
            { score: 0, text: 'Sanitarios sucios, sin insumos y en malas condiciones de mantenimiento.' },
            { score: 1, text: 'Limpios pero básicos, mantenimiento limitado y suministros escasos.' },
            { score: 2, text: 'Sanitarios adecuados y limpios con los artículos necesarios de higiene.' },
            { score: 3, text: 'Sanitarios decorados, mantenimiento constante, buena ventilación y suministros siempre completos.' },
            { score: 4, text: 'Sanitarios de lujo o con diseño diferenciado; automatizados, con fragancia de ambiente, toallas de tela u otros servicios adicionales.' },
        ],
    },
    {
        name:  'Área de Producción (Cocina)',
        step:  'infraestructura',
        desc:  'Condiciones del área de producción culinaria: cumplimiento de NOM-251-SSA1-2009 y NOM-093-SSA1-1994, organización de estaciones, inocuidad alimentaria y eficiencia operativa.',
        levels: [
            { score: 0, text: 'Sin control ni cumplimiento de normativa; calidad muy baja y errores constantes en producción.' },
            { score: 1, text: 'Medidas básicas aplicadas con fallas frecuentes; organización limitada y resultados poco confiables.' },
            { score: 2, text: 'Cumplimiento parcial de normas y procedimientos; procesos aceptables con áreas de mejora evidentes.' },
            { score: 3, text: 'Control adecuado de la producción, cumplimiento de protocolos NOM y calidad consistente.' },
            { score: 4, text: 'Gestión profesional con altos estándares NOM; procesos eficientes, calidad destacada y cultura de mejora continua.' },
        ],
    },
    {
        name:  'Infraestructura Complementaria',
        step:  'infraestructura',
        desc:  'Disponibilidad y calidad de instalaciones adicionales de valor: estacionamiento, iluminación exterior, señalética, área de bar, terraza, área infantil u otros espacios diferenciadores.',
        levels: [
            { score: 0, text: 'Sin infraestructura complementaria; sin estacionamiento, iluminación exterior ni señalética.' },
            { score: 1, text: 'Infraestructura mínima; al menos un elemento adicional presente pero en condiciones básicas.' },
            { score: 2, text: 'Dos o más elementos complementarios funcionales (p. ej. señalética e iluminación exterior).' },
            { score: 3, text: 'Infraestructura complementaria completa y en buen estado: estacionamiento, señalética y accesos bien acondicionados.' },
            { score: 4, text: 'Infraestructura de alto nivel: terraza, valet parking, área de bar diferenciada, señalética digital o elemento arquitectónico innovador.' },
        ],
    },
    {
        name:  'Área del Personal',
        step:  'infraestructura',
        desc:  'Condiciones del espacio de trabajo para colaboradores: vestidores, sanitarios exclusivos, comedor y áreas de descanso conforme a normativa laboral y de inocuidad.',
        levels: [
            { score: 0, text: 'Sin áreas de descanso, sanitarios ni comedor para personal; incumplimiento de normativa laboral.' },
            { score: 1, text: 'Medidas mínimas; solo cuenta con sanitarios básicos para el personal.' },
            { score: 2, text: 'Cumplimiento parcial; sanitarios y comedor con limitaciones de espacio o equipo.' },
            { score: 3, text: 'Áreas de personal en buenas condiciones: sanitarios, comedor y zona de descanso con acceso regulado.' },
            { score: 4, text: 'Infraestructura óptima para el personal: comedor, sanitarios y área de descanso que garantizan confort, higiene y seguridad laboral.' },
        ],
    },
    {
        name:  'Accesibilidad Universal',
        step:  'infraestructura',
        desc:  'Cumplimiento de la normativa de accesibilidad para personas con discapacidad (NOM-030-TUR, Ley General para la Inclusión de las Personas con Discapacidad y NOM-233-SE-2012).',
        levels: [
            { score: 0, text: 'Sin instalaciones para personas con discapacidad; sin rampas, cajones especiales ni sanitarios adaptados.' },
            { score: 1, text: 'Rampas improvisadas, acceso parcial; pavimento antiderrapante y ancho libre ≥1.2 m; sin cajones ni sanitarios adaptados.' },
            { score: 2, text: 'Sanitarios adaptados (mín. 2.89 m², WC a 45-50 cm, lavabo a 76-80 cm, barras a 0.80 m, puerta con 0.90 m libre); pavimento antiderrapante; al menos un cajón para discapacitados (3.8 × 5.0 m).' },
            { score: 3, text: 'Acceso adecuado con señalética clara, adaptaciones completas en sanitarios y múltiples cajones para discapacitados (3.8 × 5.0 m).' },
            { score: 4, text: 'Diseño universal completo: señalética en Braille, menús en formato accesible, personal capacitado en LSM, accesos integrales y cajones ADA múltiples.' },
        ],
    },
    // ── SERVICIO ─────────────────────────────────────────────────────────────
    {
        name:  'Servicio al Cliente',
        step:  'servicio',
        desc:  'Calidad de la atención al comensal: capacitación del personal de piso, tiempos de espera, cordialidad, manejo de quejas y enfoque en la experiencia.',
        levels: [
            { score: 0, text: 'Personal no capacitado, trato indiferente o descortés, tiempos de espera excesivos e incidencias sin resolver.' },
            { score: 1, text: 'Trato cortés pero con tiempos de espera largos y resolución básica de dudas.' },
            { score: 2, text: 'Personal capacitado, tiempos razonables, trato profesional y resolución efectiva de incidencias.' },
            { score: 3, text: 'Atención personalizada con seguimiento al comensal, enfoque en la experiencia y anticipación de necesidades.' },
            { score: 4, text: 'Servicio de excelencia: proactivo, anticipa necesidades, maneja quejas de forma sobresaliente y fideliza activamente al cliente.' },
        ],
    },
    {
        name:  'Menú',
        step:  'servicio',
        desc:  'Evaluación integral del menú: variedad, claridad, información de alérgenos, opciones para restricciones dietéticas y presentación visual del documento.',
        levels: [
            { score: 0, text: 'Menú limitado, sin descripciones ni precios visibles.' },
            { score: 1, text: 'Variedad básica, sin información detallada de ingredientes ni alérgenos.' },
            { score: 2, text: 'Menú estructurado con ingredientes señalados, precios claros y diseño simple.' },
            { score: 3, text: 'Menú extenso con alérgenos identificados, opciones vegetarianas/veganas/sin gluten y diseño atractivo.' },
            { score: 4, text: 'Menú de autor con maridajes sugeridos, menú degustación, propuesta de temporada y presentación visual premium.' },
        ],
    },
    // ── CALIDAD ───────────────────────────────────────────────────────────────
    {
        name:  'Técnicas de Preparación',
        step:  'calidad',
        desc:  'Dominio culinario del equipo de cocina: uso de técnicas profesionales, selección y frescura de ingredientes, consistencia en la ejecución y nivel de creatividad gastronómica.',
        levels: [
            { score: 0, text: 'Preparación básica sin técnica definida; sabor inconsistente y presentación deficiente.' },
            { score: 1, text: 'Platillos tradicionales con ejecución regular; sabor aceptable pero sin refinamiento técnico.' },
            { score: 2, text: 'Buen sabor, técnicas adecuadas y presentación básica; ingredientes frescos de calidad estándar.' },
            { score: 3, text: 'Alta calidad técnica, ingredientes frescos y seleccionados, presentación cuidada y consistente.' },
            { score: 4, text: 'Alta cocina: ingredientes premium, creatividad culinaria, técnicas complejas (sous-vide, fermentación, etc.) y emplatado artístico.' },
        ],
    },
    {
        name:  'Limpieza e Higiene',
        step:  'calidad',
        desc:  'Cumplimiento de normas de higiene y control sanitario: NOM-251-SSA1-2009, NOM-093-SSA1-1994 y criterios del Distintivo H de SECTUR.',
        levels: [
            { score: 0, text: 'Higiene deficiente; suciedad visible, sin prácticas claras de control sanitario.' },
            { score: 1, text: 'Limpieza en áreas visibles con cumplimiento parcial; no aplica normas de forma completa.' },
            { score: 2, text: 'Higiene aceptable; aplicación básica de normas NOM con áreas de oportunidad identificadas.' },
            { score: 3, text: 'Cumplimiento de NOM-251 y NOM-093, buenas prácticas de manufactura y monitoreo periódico.' },
            { score: 4, text: 'Higiene impecable: auditorías internas, Distintivo H (NMX-F-605-NORMEX-2018) o certificación equivalente; cero tolerancia a contaminación cruzada.' },
        ],
    },
    // ── AMBIENTE ─────────────────────────────────────────────────────────────
    {
        name:  'Ambiente Físico',
        step:  'ambiente',
        desc:  'Condición del espacio: limpieza, orden, iluminación adecuada al concepto, ventilación, temperatura confortable y mobiliario en buen estado.',
        levels: [
            { score: 0, text: 'Espacios desorganizados, sucios o deteriorados; iluminación y ventilación inadecuadas, mobiliario inseguro o en mal estado.' },
            { score: 1, text: 'Mantenimiento mínimo; problemas de limpieza, ventilación o iluminación; mobiliario básico y limitado.' },
            { score: 2, text: 'Espacios adecuados con limpieza aceptable, ventilación e iluminación funcionales y mobiliario suficiente.' },
            { score: 3, text: 'Ambiente confortable, limpio y ordenado; buena ventilación e iluminación; mobiliario funcional y seguro.' },
            { score: 4, text: 'Ambiente atractivo, moderno y acogedor; ventilación e iluminación óptimas; mobiliario de diseño con distribución estratégica que contribuye al confort.' },
        ],
    },
    {
        name:  'Ambiente Sensorial',
        step:  'ambiente',
        desc:  'Experiencia sensorial del establecimiento: selección musical, nivel sonoro, aromatización y coherencia de todos los elementos con el concepto del restaurante.',
        levels: [
            { score: 0, text: 'Sin música o música inapropiada al concepto; ausencia total de gestión sensorial.' },
            { score: 1, text: 'Música de fondo descuidada o volumen inadecuado; sin coherencia con el concepto del lugar.' },
            { score: 2, text: 'Música ambiental alineada al concepto, volumen moderado y agradable.' },
            { score: 3, text: 'Selección musical profesional, coherencia de estilo, gestión del ambiente sonoro y aromatización cuidada.' },
            { score: 4, text: 'Experiencia sensorial integral: curación musical (en vivo o DJ), ambientación envolvente y diseño sensorial completo que refuerza la identidad del concepto.' },
        ],
    },
    {
        name:  'Ambiente Emocional y Clima Laboral',
        step:  'ambiente',
        desc:  'Clima laboral y su impacto percibido por el comensal: comunicación interna, actitud del equipo, trabajo colaborativo y satisfacción general del cliente.',
        levels: [
            { score: 0, text: 'Conflictos evidentes entre personal, estrés generalizado y comunicación deficiente; impacto negativo visible en la experiencia del cliente.' },
            { score: 1, text: 'Actitudes negativas frecuentes, baja empatía, comunicación limitada; ambiente desmotivador.' },
            { score: 2, text: 'Clima aceptable con conflictos u tensiones ocasionales; comunicación funcional pero mejorable.' },
            { score: 3, text: 'Buen ambiente laboral, colaboración entre áreas, comunicación clara y clientes generalmente satisfechos.' },
            { score: 4, text: 'Ambiente positivo y motivador: excelente trabajo en equipo, comunicación efectiva, personal comprometido y clientes altamente satisfechos.' },
        ],
    },
    // ── ADMINISTRACIÓN ────────────────────────────────────────────────────────
    {
        name:  'Gestión Administrativa',
        step:  'administracion',
        desc:  'Capacidad de gestión del negocio: control de inventarios, costos, liderazgo, uso de herramientas administrativas y planeación estratégica.',
        levels: [
            { score: 0, text: 'Sin control de inventarios ni gestión adecuada de recursos; operación caótica sin registros.' },
            { score: 1, text: 'Gestión básica con errores frecuentes; sin sistemas formales ni procesos definidos.' },
            { score: 2, text: 'Gestión organizada con control parcial de procesos; identificación de áreas de mejora.' },
            { score: 3, text: 'Uso de sistemas administrativos, control de costos y márgenes, liderazgo efectivo y seguimiento de indicadores clave.' },
            { score: 4, text: 'Gestión profesional con software especializado (ERP/POS), KPIs definidos, análisis FODA, organigrama claro y misión/visión establecidas.' },
        ],
    },
    {
        name:  'Gestión del Personal',
        step:  'administracion',
        desc:  'Procesos de reclutamiento, capacitación formal, motivación y retención del talento; cumplimiento de NOMs laborales y programas de certificación SECTUR/CONOCER.',
        levels: [
            { score: 0, text: 'Alta rotación, sin procesos de contratación formales ni plan de capacitación al personal.' },
            { score: 1, text: 'Contratación informal, capacitación escasa; personal con funciones poco claras.' },
            { score: 2, text: 'Personal con capacitación básica, funciones definidas y proceso básico de inducción.' },
            { score: 3, text: 'Procesos de capacitación continua, evaluaciones de desempeño periódicas y programa de motivación activo.' },
            { score: 4, text: 'Clima laboral positivo, capacitación certificada (SECTUR/CONOCER/CANIRAC), planes de carrera y programa formal de reconocimiento al personal.' },
        ],
    },
    // ── SOSTENIBILIDAD ────────────────────────────────────────────────────────
    {
        name:  'Buenas Prácticas Ambientales',
        step:  'sostenibilidad',
        desc:  'Gestión de residuos sólidos, eficiencia en el consumo de energía y agua, y adopción de prácticas operativas responsables con el medio ambiente.',
        levels: [
            { score: 0, text: 'Sin separación de residuos ni gestión ambiental; operación sin conciencia ecológica.' },
            { score: 1, text: 'Separación básica de residuos sin control ni seguimiento sistemático.' },
            { score: 2, text: 'Separación y disposición correcta de residuos comunes; algunas medidas de ahorro de energía o agua.' },
            { score: 3, text: 'Gestión responsable de residuos, reciclaje activo, reducción de plásticos de un solo uso y seguimiento de consumos.' },
            { score: 4, text: 'Política de sustentabilidad integral: compostaje, meta de cero residuos, certificación ambiental (SEMARNAT, EarthCheck o equivalente).' },
        ],
    },
    {
        name:  'Sostenibilidad — Consumo Local',
        step:  'sostenibilidad',
        desc:  'Integración de insumos y proveedores locales en la propuesta gastronómica; apoyo a la economía regional y aplicación de principios de cocina de kilómetro cero.',
        levels: [
            { score: 0, text: 'No utiliza productos locales ni establece vínculos con proveedores regionales.' },
            { score: 1, text: 'Uso ocasional de ingredientes locales sin política definida de abastecimiento.' },
            { score: 2, text: 'Integración parcial de insumos regionales; relación incipiente con productores locales.' },
            { score: 3, text: 'Predominio de productos locales en la carta; alianzas activas con productores y mercados regionales.' },
            { score: 4, text: 'Cocina kilómetro cero: uso exclusivo de insumos locales y sustentables; identidad gastronómica regional y reconocimiento como promotor del territorio.' },
        ],
    },
    {
        name:  'Distintivos y Reconocimientos',
        step:  'sostenibilidad',
        desc:  'Reputación del establecimiento, reconocimientos oficiales o internacionales, posicionamiento en medios y presencia en guías gastronómicas especializadas.',
        levels: [
            { score: 0, text: 'Sin opiniones relevantes ni reconocimiento en medios o guías especializadas.' },
            { score: 1, text: 'Opiniones mixtas y clientela local; sin presencia en medios o publicaciones especializadas.' },
            { score: 2, text: 'Reputación sólida a nivel local; presencia en medios regionales y clientela constante.' },
            { score: 3, text: 'Reconocimiento estatal o de asociaciones del sector (CANIRAC, Cámara de Restauranteros, Guía Michelin Recomendado).' },
            { score: 4, text: 'Premio nacional o internacional: Guía Michelin (estrella o Bib Gourmand), Latin America\'s 50 Best, Guía Repsol u equivalente de reconocimiento internacional.' },
        ],
    },
];

// ─── Datos: Hotel ─────────────────────────────────────────────────────────────
const HOTEL_TEMPLATE = {
    name:         'Instrumento de Evaluación Hotelera SMARTUR',
    version:      '2.0',
    service_type: 'hotel',
};

const HOTEL_CRITERIA = [
    // ── HABITACIONES ──────────────────────────────────────────────────────────
    {
        name:  'Habitaciones — Confort y Equipamiento',
        step:  'habitaciones',
        desc:  'Calidad del cuarto de huéspedes: tamaño, tipo de cama, colchón, ropa de cama, mobiliario, iluminación, ventilación y estado general de la habitación. Base: NOM-010-TUR-2001.',
        levels: [
            { score: 0, text: 'Habitación deteriorada, equipamiento obsoleto o incompleto; colchón en mal estado, mala ventilación o iluminación.' },
            { score: 1, text: 'Habitación básica funcional; equipamiento mínimo (cama, clóset), sin amenidades adicionales.' },
            { score: 2, text: 'Habitación limpia con equipamiento estándar (TV, teléfono, escritorio); buen estado general.' },
            { score: 3, text: 'Habitación cómoda, bien equipada (minibar, caja fuerte, iluminación variable, buena insonorización).' },
            { score: 4, text: 'Habitación de diseño premium: materiales de alta gama, ropa de cama de lujo, control domótico, vistas cuidadas y amenidades superiores.' },
        ],
    },
    {
        name:  'Baño Privado',
        step:  'habitaciones',
        desc:  'Estado, limpieza, equipamiento y nivel de amenidades del baño privado de cada habitación.',
        levels: [
            { score: 0, text: 'Baño en mal estado, sin suministro constante de agua caliente, sin amenidades.' },
            { score: 1, text: 'Baño funcional con agua caliente; amenidades básicas (jabón, shampoo) en presentación mínima.' },
            { score: 2, text: 'Baño limpio y en buen estado; amenidades estándar de marca, secador de cabello.' },
            { score: 3, text: 'Baño moderno con acabados de calidad, amenidades completas, toallas de buena calidad y suficiente espacio.' },
            { score: 4, text: 'Baño premium: tina separada, regadera tipo lluvia, amenidades de lujo (aromaterapia, albornoces, pantuflas), diseño cuidado.' },
        ],
    },
    {
        name:  'Climatización de Habitación',
        step:  'habitaciones',
        desc:  'Eficiencia y control del sistema de climatización (A/C, calefacción) y ventilación natural de las habitaciones.',
        levels: [
            { score: 0, text: 'Sin sistema de climatización o equipo disfuncional; temperatura no controlable por el huésped.' },
            { score: 1, text: 'Climatización básica disponible pero de baja eficiencia o con ruido excesivo.' },
            { score: 2, text: 'A/C y/o calefacción funcional, controlable por el huésped con temperatura adecuada.' },
            { score: 3, text: 'Sistema eficiente y silencioso, con control digital y ventilación natural complementaria.' },
            { score: 4, text: 'Sistema de climatización inteligente (domótica), altamente eficiente, silencioso y con modalidades de ahorro energético.' },
        ],
    },
    // ── INSTALACIONES ─────────────────────────────────────────────────────────
    {
        name:  'Lobby, Recepción y Áreas Comunes',
        step:  'instalaciones',
        desc:  'Diseño, limpieza, señalética, iluminación y confort del lobby, pasillos, elevadores y demás áreas de uso común del hotel.',
        levels: [
            { score: 0, text: 'Áreas comunes descuidadas, sucias o sin señalética; lobby sin imagen de marca.' },
            { score: 1, text: 'Lobby funcional pero básico; señalética mínima y áreas comunes con mantenimiento irregular.' },
            { score: 2, text: 'Áreas comunes limpias y ordenadas con señalética adecuada y diseño estándar.' },
            { score: 3, text: 'Lobby atractivo con identidad de marca clara, áreas comunes bien mantenidas, iluminación cuidada y ambiente acogedor.' },
            { score: 4, text: 'Lobby y áreas comunes de diseño arquitectónico destacado; arte, iluminación de diseño, wifi en todos los espacios, señalética digital.' },
        ],
    },
    {
        name:  'Servicio de Recepción y Conserjería',
        step:  'instalaciones',
        desc:  'Eficiencia y calidad del servicio en front desk: tiempos de check-in/check-out, atención multilingüe, manejo de quejas, conserjería y disponibilidad 24/7.',
        levels: [
            { score: 0, text: 'Recepción con tiempos excesivos, personal no capacitado y sin manejo de quejas.' },
            { score: 1, text: 'Atención básica; check-in/out lento, solo en español y sin servicio de conserjería.' },
            { score: 2, text: 'Recepción eficiente en horario amplio, atención profesional y manejo básico de peticiones.' },
            { score: 3, text: 'Servicio 24/7, atención en al menos dos idiomas, conserjería activa y resolución efectiva de quejas.' },
            { score: 4, text: 'Recepción de excelencia: check-in express, concierge especializado, atención personalizada, multilingüe y anticipación de necesidades.' },
        ],
    },
    {
        name:  'Instalaciones Recreativas y de Bienestar',
        step:  'instalaciones',
        desc:  'Disponibilidad, calidad y mantenimiento de instalaciones orientadas al bienestar y esparcimiento del huésped: alberca, gimnasio, spa, salas de eventos, etc.',
        levels: [
            { score: 0, text: 'Sin instalaciones recreativas ni de bienestar.' },
            { score: 1, text: 'Al menos una instalación básica (p. ej. alberca) en condiciones mínimas.' },
            { score: 2, text: 'Alberca y/o gimnasio funcionales en buen estado, con horarios definidos.' },
            { score: 3, text: 'Gimnasio equipado, alberca con área de descanso y/o spa básico; instalaciones bien mantenidas.' },
            { score: 4, text: 'Spa completo, alberca climatizada, gimnasio de alto rendimiento, canchas o actividades recreativas organizadas.' },
        ],
    },
    // ── SERVICIO ─────────────────────────────────────────────────────────────
    {
        name:  'Servicio de Alimentos y Bebidas',
        step:  'servicio',
        desc:  'Calidad del servicio de A&B del hotel: desayuno incluido (si aplica), restaurante propio, room service, variedad del menú y estándares de servicio.',
        levels: [
            { score: 0, text: 'Sin servicio de A&B propio o de muy baja calidad; sin desayuno incluido.' },
            { score: 1, text: 'Desayuno continental básico o servicio de cafetería limitado.' },
            { score: 2, text: 'Restaurante funcional con menú variado; desayuno buffet o americano incluido.' },
            { score: 3, text: 'Restaurante de buena calidad, room service, bar y variedad de opciones dietéticas.' },
            { score: 4, text: 'Propuesta gastronómica de alto nivel: chef reconocido, menú de autor, bar premium, cava de vinos y room service 24/7.' },
        ],
    },
    {
        name:  'Servicios de Apoyo al Huésped',
        step:  'servicio',
        desc:  'Disponibilidad de servicios complementarios: lavandería, transporte al aeropuerto, tours, renta de autos, guardaequipaje y atención especial a grupos o eventos.',
        levels: [
            { score: 0, text: 'Sin servicios adicionales de apoyo al huésped.' },
            { score: 1, text: 'Servicio básico de guardaequipaje; sin otros servicios de apoyo.' },
            { score: 2, text: 'Lavandería, información turística y coordinación básica de traslados.' },
            { score: 3, text: 'Transporte al aeropuerto, lavandería express, tours coordinados y salones de eventos.' },
            { score: 4, text: 'Portería y concierge 24/7, helipuerto, capilla, business center avanzado, coordinación de bodas y eventos, asistente de viaje personalizado.' },
        ],
    },
    // ── CALIDAD ───────────────────────────────────────────────────────────────
    {
        name:  'Accesibilidad Universal',
        step:  'calidad',
        desc:  'Cumplimiento de la normativa de accesibilidad (NOM-030-TUR-2017, Ley General para la Inclusión de las Personas con Discapacidad) en habitaciones, accesos y áreas comunes.',
        levels: [
            { score: 0, text: 'Sin habitaciones ni instalaciones adaptadas; sin rampas, ascensores o señalética accesible.' },
            { score: 1, text: 'Rampas de acceso básicas; sin habitaciones adaptadas ni sanitarios para personas con discapacidad.' },
            { score: 2, text: 'Al menos una habitación accesible (barras, puerta amplia, baño adaptado); ascensor funcional y rampas en accesos.' },
            { score: 3, text: 'Múltiples habitaciones accesibles certificadas; señalética inclusiva, recorridos libres de barreras y estacionamiento adaptado.' },
            { score: 4, text: 'Diseño universal integral: señalética Braille, habitaciones de lujo accesibles, personal en LSM, menús accesibles, app o sistema para huéspedes con discapacidad.' },
        ],
    },
    {
        name:  'Seguridad Integral',
        step:  'calidad',
        desc:  'Sistemas y protocolos de seguridad del hotel: CCTV, personal de vigilancia, iluminación perimetral, cajas fuertes, protocolos de emergencia y certificaciones NOM-002.',
        levels: [
            { score: 0, text: 'Sin sistemas de seguridad ni protocolos de emergencia visibles; sin personal de vigilancia.' },
            { score: 1, text: 'Personal de vigilancia básico; sin CCTV completo ni protocolos documentados.' },
            { score: 2, text: 'CCTV en accesos principales, cajas fuertes en habitaciones, iluminación perimetral y rutas de evacuación señalizadas.' },
            { score: 3, text: 'Vigilancia 24/7 con CCTV integral, protocolos de emergencia documentados y personal capacitado en primeros auxilios.' },
            { score: 4, text: 'Sistema de seguridad de alto nivel: control de acceso digital, CCTV con analítica, brigada de emergencias certificada, simulacros periódicos y cumplimiento NOM-002-STPS.' },
        ],
    },
    {
        name:  'Limpieza e Higiene',
        step:  'calidad',
        desc:  'Estándares de limpieza en habitaciones, áreas comunes y cocina: protocolos de sanitización, frecuencia de limpieza, control de plagas y cumplimiento NOM-251-SSA1.',
        levels: [
            { score: 0, text: 'Higiene deficiente en habitaciones y áreas comunes; sin protocolos de limpieza documentados.' },
            { score: 1, text: 'Limpieza básica con inconsistencias; limpieza de habitación solo al cambio de huésped.' },
            { score: 2, text: 'Limpieza diaria de habitaciones, cambio regular de ropa de cama y toallas, sanitización de áreas comunes.' },
            { score: 3, text: 'Protocolos de higiene documentados, control de plagas profesional, cambio de ropa de cama a petición y supervisión de calidad.' },
            { score: 4, text: 'Estándares internacionales de higiene y sanitización (Green Key, AHLA Stay Clean o equivalente); auditorías periódicas y retroalimentación del huésped.' },
        ],
    },
    {
        name:  'Tecnología y Conectividad',
        step:  'calidad',
        desc:  'Disponibilidad y calidad de infraestructura tecnológica para el huésped: WiFi, Smart TV, aplicación del hotel, conectividad USB/enchufes y sistemas de reserva digital.',
        levels: [
            { score: 0, text: 'Sin WiFi o conexión muy deficiente; tecnología en habitaciones obsoleta.' },
            { score: 1, text: 'WiFi básico disponible (velocidad limitada); TV convencional y enchufes estándar.' },
            { score: 2, text: 'WiFi estable en todo el hotel, Smart TV con streaming, enchufes USB en habitación.' },
            { score: 3, text: 'WiFi de alta velocidad, Smart TV con Chromecast, app del hotel, check-in digital y llaves electrónicas.' },
            { score: 4, text: 'Tecnología de vanguardia: domótica en habitaciones, app con control total, business center equipado, carga inalámbrica y conectividad 5G.' },
        ],
    },
    // ── SOSTENIBILIDAD ────────────────────────────────────────────────────────
    {
        name:  'Sostenibilidad Ambiental',
        step:  'sostenibilidad',
        desc:  'Iniciativas de eficiencia energética, gestión de agua, reducción de plásticos y certificaciones ambientales del hotel.',
        levels: [
            { score: 0, text: 'Sin iniciativas ambientales ni gestión de residuos; operación sin conciencia ecológica.' },
            { score: 1, text: 'Medidas básicas: reciclaje de papel o cambio voluntario de toallas.' },
            { score: 2, text: 'Programa de reciclaje activo, reducción de plásticos de un solo uso y ahorro básico de energía/agua.' },
            { score: 3, text: 'Paneles solares o energías renovables, programa de eficiencia hídrica, proveedores locales y política de residuos documentada.' },
            { score: 4, text: 'Certificación ambiental reconocida (EarthCheck, Green Globe, Rainforest Alliance, LEED); meta de carbono neutro y programa integral de sustentabilidad.' },
        ],
    },
    {
        name:  'Gestión del Personal',
        step:  'sostenibilidad',
        desc:  'Programas de capacitación formal, certificaciones NOM/SECTUR, clima laboral, rotación del personal y responsabilidad social con la comunidad local.',
        levels: [
            { score: 0, text: 'Alta rotación, sin capacitación formal ni procesos de inducción.' },
            { score: 1, text: 'Capacitación mínima y contratación informal; personal sin funciones claramente definidas.' },
            { score: 2, text: 'Personal capacitado en áreas clave, funciones definidas y proceso de inducción documentado.' },
            { score: 3, text: 'Capacitación continua (SECTUR/CONOCER), evaluaciones periódicas de desempeño y programas de motivación.' },
            { score: 4, text: 'Clima laboral certificado, planes de carrera, contratación de comunidad local, reconocimientos laborales y programa de bienestar del colaborador.' },
        ],
    },
    {
        name:  'Gestión Administrativa y Reputación Digital',
        step:  'sostenibilidad',
        desc:  'Eficiencia operativa del hotel: sistemas de gestión (PMS), control financiero, indicadores de desempeño (RevPAR, ocupación) y reputación en plataformas digitales.',
        levels: [
            { score: 0, text: 'Sin sistema de gestión hotelera (PMS); administración manual con errores frecuentes; sin presencia online.' },
            { score: 1, text: 'Gestión básica con registros manuales; perfil mínimo en una OTA; sin respuesta a reseñas.' },
            { score: 2, text: 'PMS básico, presencia en OTAs principales (Booking, Airbnb) y respuesta ocasional a reseñas.' },
            { score: 3, text: 'PMS integrado con channel manager; KPIs de ocupación y RevPAR; gestión activa de reputación online (>4.0 stars promedio).' },
            { score: 4, text: 'Revenue management profesional, PMS con CRM integrado, estrategia digital omnicanal, rating ≥4.5 en plataformas principales y programa de lealtad activo.' },
        ],
    },
];

// ─── Función principal ────────────────────────────────────────────────────────
async function updateTemplate(templateDef, criteriaList) {
    const { name, version, service_type } = templateDef;

    // 1. Busca o crea el template
    let templateId;
    const existing = await client.query(
        `SELECT id_template FROM evaluation_template WHERE service_type = $1 LIMIT 1`,
        [service_type]
    );

    if (existing.rows.length > 0) {
        templateId = existing.rows[0].id_template;
        await client.query(
            `UPDATE evaluation_template SET name=$1, version=$2, active=true WHERE id_template=$3`,
            [name, version, templateId]
        );
        console.log(`  ✓ Template actualizado: "${name}" (id=${templateId})`);
    } else {
        const ins = await client.query(
            `INSERT INTO evaluation_template (name, version, service_type, active, creation_date)
             VALUES ($1, $2, $3, true, NOW()) RETURNING id_template`,
            [name, version, service_type]
        );
        templateId = ins.rows[0].id_template;
        console.log(`  ✓ Template creado: "${name}" (id=${templateId})`);
    }

    // 2. Borra criterios existentes (subcriteria en cascada)
    const deleted = await client.query(
        `DELETE FROM evaluation_criterion WHERE id_template = $1`,
        [templateId]
    );
    console.log(`  ✓ ${deleted.rowCount} criterios anteriores eliminados`);

    // 3. Inserta nuevos criterios y sus niveles
    for (let i = 0; i < criteriaList.length; i++) {
        const c = criteriaList[i];
        const descFull = `[STEP:${c.step}] ${c.desc}`;

        const cr = await client.query(
            `INSERT INTO evaluation_criterion
             (id_template, name, description, weight, order_index, active, field_type, is_required)
             VALUES ($1, $2, $3, $4, $5, true, 'scale', true)
             RETURNING id_criterion`,
            [templateId, c.name, descFull, 1.0, i]
        );
        const criterionId = cr.rows[0].id_criterion;

        for (let j = 0; j < c.levels.length; j++) {
            const lvl = c.levels[j];
            await client.query(
                `INSERT INTO evaluation_subcriterion
                 (id_criterion, description, score, order_index)
                 VALUES ($1, $2, $3, $4)`,
                [criterionId, lvl.text, lvl.score, j]
            );
        }
        process.stdout.write(`    [${i + 1}/${criteriaList.length}] ${c.name}\n`);
    }

    console.log(`  ✓ ${criteriaList.length} criterios insertados con ${criteriaList[0].levels.length} niveles cada uno\n`);
}

// ─── Entry point ─────────────────────────────────────────────────────────────
try {
    await client.connect();
    console.log('\n🔌 Conectado a la base de datos\n');

    console.log('━━━ Restaurante ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await updateTemplate(RESTAURANT_TEMPLATE, RESTAURANT_CRITERIA);

    console.log('━━━ Hotel ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await updateTemplate(HOTEL_TEMPLATE, HOTEL_CRITERIA);

    console.log('✅  Instrumentos actualizados correctamente.\n');
} catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
} finally {
    await client.end();
}
