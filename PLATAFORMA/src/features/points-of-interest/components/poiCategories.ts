export interface PoiCategoryPreset {
    id: number;
    label: string;
    raw: string;
}

// Categorías visibles en la app móvil (id_type: 1=Naturaleza, 2=Cultura, 3=Gastronomía).
// categories_raw alimenta el mapeo interno del API (categories_mapped) y la derivación
// de la categoría de la app. El formulario NO guarda la keyword suelta: envía un preset
// reconocible por el backend.
export const POI_CATEGORY_PRESETS: PoiCategoryPreset[] = [
    { id: 1, label: 'Naturaleza', raw: 'nature, park, outdoor, hiking, viewpoint' },
    { id: 2, label: 'Cultura', raw: 'culture, museum, history, art, heritage' },
    { id: 3, label: 'Gastronomía', raw: 'gastronomy, food, restaurant, cafe' },
];

/// Deriva el preset desde categories_raw guardado (para el formulario de edición).
export function categoryIdFromRaw(raw?: string | null): number {
    const text = (raw ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/restaur|food|gastro|cafe|comida/.test(text)) return 3;
    if (/museum|museo|cultur|histor|history|art|galer|iglesia|landmark/.test(text)) return 2;
    if (/natur|parque|park|hiking|outdoor|viewpoint/.test(text)) return 1;
    return 2;
}