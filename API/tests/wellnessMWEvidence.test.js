import { describe, expect, it } from 'vitest';
import { hasCompleteWellnessMWEvidence } from '../utils/wellnessMWEvidence.js';

describe('hasCompleteWellnessMWEvidence', () => {
    it('requires one evidence note per selected tag, with no inferred M/W crosswalk', () => {
        expect(hasCompleteWellnessMWEvidence(
            ['M1'], ['W2'], { M1: 'Pausa libre descrita en fuente oficial.', W2: 'Actividad exterior descrita en ficha.' },
        )).toBe(true);
        expect(hasCompleteWellnessMWEvidence(
            ['M1'], ['W2'], { M1: 'Pausa libre descrita en fuente oficial.' },
        )).toBe(false);
    });

    it('rejects malformed, duplicate, unsupported, or empty labels', () => {
        expect(hasCompleteWellnessMWEvidence(['M1', 'M1'], [], { M1: 'Evidencia válida pero duplicada.' })).toBe(false);
        expect(hasCompleteWellnessMWEvidence(['M10'], [], { M10: 'Código que no está en el instrumento.' })).toBe(false);
        expect(hasCompleteWellnessMWEvidence([], ['W8'], { W8: 'Código que no está en el instrumento.' })).toBe(false);
        expect(hasCompleteWellnessMWEvidence([], [], {})).toBe(false);
        expect(hasCompleteWellnessMWEvidence(['M1'], [], { M1: 'corto' })).toBe(false);
    });
});
