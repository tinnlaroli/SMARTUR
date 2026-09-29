// Deriva el tourism_type id (1=Naturaleza, 2=Cultura, 3=Gastronomía) de un POI.
// Se usa en /explore/home para que la app móvil pueda clasificar cada POI por categoría
// (la columna id_type fue removida del schema y reemplazada por categories_raw/categories_mapped).

const normalize = (value) =>
    String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

const CULTURE_TERMS = [
    'museo', 'museum', 'cultura', 'culture', 'histor', 'history', 'arte', 'art',
    'iglesia', 'templo', 'cultural', 'galeria', 'gallery', 'landmark', 'hacienda',
    'music', 'musica', 'patrimon', 'teatro', 'theater', 'arqueo', 'archae',
];

const NATURE_TERMS = [
    'naturaleza', 'nature', 'parque', 'park', 'viewpoint', 'mirador', 'hiking',
    'senderismo', 'outdoor', 'lago', 'laguna', 'cascada', 'waterfall', 'jardin',
    'garden', 'botanical', 'botanico', 'montana', 'mountain', 'bosque', 'forest',
    'rio', 'river', 'playa', 'beach', 'cerro', 'volcan', 'selva', 'reserva',
    'ecolog', 'sendero',
];

const GASTRONOMY_TERMS = [
    'comida', 'food', 'restaurant', 'restaurante', 'cafe', 'coffee', 'gastronom',
    'bar', 'cocina', 'bebida', 'tasting', 'degustacion', 'desayuno', 'almuerzo', 'cenar',
];

function matches(hay, terms) {
    return terms.some((term) => hay.includes(term));
}

/**
 * @param {object} input
 * @param {string} [input.categories_raw] Texto libre de categorías del POI.
 * @param {string|string[]} [input.categories_mapped] JSONB (array o texto) mapeado.
 * @returns {number} 1 = Naturaleza, 2 = Cultura, 3 = Gastronomía (fallback 2 = Cultura).
 */
export function deriveTourismTypeId({ categories_raw = '', categories_mapped = [] } = {}) {
    const raw = normalize(categories_raw);

    let mappedPrimary = '';
    let mapped;
    try {
        const arr = Array.isArray(categories_mapped)
            ? categories_mapped
            : JSON.parse(categories_mapped || '[]');
        if (Array.isArray(arr) && arr.length > 0) {
            mappedPrimary = normalize(arr[0]);
        }
        mapped = normalize(Array.isArray(arr) ? arr.join(' ') : arr);
    } catch {
        mapped = normalize(categories_mapped);
        mappedPrimary = mapped.split(/[\s,]+/)[0] ?? '';
    }

    const hay = `${raw} ${mapped}`.trim();

    // Los POIs gastronómicos suelen tener categories_mapped = ["gastronomy","culture"]
    // (trueque, cafetalera, etc. también son culturales). Como la cultura matchea primero,
    // el móvil los abría como "Museos" aunque el panel los muestra como Gastronomía.
    // Corregimos usando el primer mapeo como fuente principal, sin convertir museos/parques
    // con menciones gastronómicas secundarias en gastronomía.
    if (mappedPrimary.includes('gastronom')) return 3;
    if (matches(hay, CULTURE_TERMS)) return 2;
    if (matches(hay, NATURE_TERMS)) return 1;
    if (matches(hay, GASTRONOMY_TERMS)) return 3;
    return 2;
}
