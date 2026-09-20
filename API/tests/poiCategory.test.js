import { describe, it, expect } from 'vitest';
import { deriveTourismTypeId } from '../utils/poiCategory.js';

describe('deriveTourismTypeId', () => {
    it('mapea POIs de naturaleza (1)', () => {
        expect(
            deriveTourismTypeId({ categories_raw: 'park, viewpoint, hiking' })
        ).toBe(1);
        expect(
            deriveTourismTypeId({ categories_raw: 'waterfall, nature, hiking', categories_mapped: '["nature"]' })
        ).toBe(1);
        expect(
            deriveTourismTypeId({ categories_raw: 'botanical garden, nature, science' })
        ).toBe(1);
    });

    it('mapea POIs de cultura (2)', () => {
        expect(
            deriveTourismTypeId({ categories_raw: 'museum, history, culture', categories_mapped: '["culture"]' })
        ).toBe(2);
        expect(
            deriveTourismTypeId({ categories_raw: 'hacienda, history, park' })
        ).toBe(2);
        expect(
            deriveTourismTypeId({ categories_raw: 'culture, art, music' })
        ).toBe(2);
    });

    it('un POI con museo + gastronomía es cultura (2)', () => {
        expect(
            deriveTourismTypeId({ categories_raw: 'museum, coffee, gastronomy, history' })
        ).toBe(2);
    });

    it('un POI de parque con mención gastronómica sigue siendo naturaleza (1)', () => {
        expect(
            deriveTourismTypeId({ categories_raw: 'park, town square, outdoor, gastronomy' })
        ).toBe(1);
    });

    it('mapea los presets del dashboard PLATAFORMA (3)', () => {
        expect(
            deriveTourismTypeId({ categories_raw: 'gastronomy, food, restaurant, cafe' })
        ).toBe(3);
    });

    it('mapea categories_mapped tipo Yelp', () => {
        expect(deriveTourismTypeId({ categories_mapped: ['Restaurants', 'Food'] })).toBe(3);
        expect(
            deriveTourismTypeId({ categories_mapped: ['Museums', 'Arts & Entertainment'] })
        ).toBe(2);
        expect(deriveTourismTypeId({ categories_mapped: ['Parks', 'Active Life'] })).toBe(1);
    });

    it('fallback a cultura (2) cuando no hay categorías', () => {
        expect(deriveTourismTypeId({})).toBe(2);
        expect(deriveTourismTypeId({ categories_raw: '', categories_mapped: [] })).toBe(2);
        expect(deriveTourismTypeId()).toBe(2);
    });
});