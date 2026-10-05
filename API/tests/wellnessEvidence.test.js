import { describe, expect, it } from 'vitest';
import { hasCompleteWellnessEvidence } from '../utils/wellnessEvidence.js';

const encode = (record) => `SMARTUR_WELLNESS_EVIDENCE_V1:${JSON.stringify(record)}`;

describe('structured wellness evidence', () => {
    it('accepts a source and rationale for every selected dimension', () => {
        expect(hasCompleteWellnessEvidence(encode({
            source: 'programa del prestador, consulta 05/10/2026',
            dimensions: { environmental: 'El recorrido guiado permite observar el entorno natural.' },
        }), ['environmental'])).toBe(true);
    });

    it('rejects missing or unrelated dimension evidence', () => {
        expect(hasCompleteWellnessEvidence(encode({
            source: 'programa del prestador, consulta 05/10/2026',
            dimensions: { environmental: 'El recorrido guiado permite observar el entorno natural.' },
        }), ['environmental', 'physical'])).toBe(false);
    });

    it('rejects malformed, legacy, and oversized evidence records', () => {
        expect(hasCompleteWellnessEvidence('Texto libre de una propuesta anterior con suficiente texto.', ['environmental'])).toBe(false);
        expect(hasCompleteWellnessEvidence('SMARTUR_WELLNESS_EVIDENCE_V1:{', ['environmental'])).toBe(false);
        expect(hasCompleteWellnessEvidence(encode({
            source: 's'.repeat(200),
            dimensions: { environmental: 'd'.repeat(800) },
        }), ['environmental'])).toBe(false);
    });
});
