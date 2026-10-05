import { describe, expect, it } from 'vitest';
import { isWellnessEvidenceComplete, parseWellnessEvidence, serializeWellnessEvidence } from '../wellnessEvidence';

describe('wellness evidence form record', () => {
    it('round-trips the source and rationale for selected dimensions', () => {
        const encoded = serializeWellnessEvidence({
            source: 'Programa público consultado el 05/10/2026',
            dimensions: { environmental: 'Recorrido guiado de observación de aves en el bosque.' },
        });

        expect(parseWellnessEvidence(encoded)).toEqual({
            source: 'Programa público consultado el 05/10/2026',
            dimensions: { environmental: 'Recorrido guiado de observación de aves en el bosque.' },
        });
        expect(isWellnessEvidenceComplete(encoded, ['environmental'])).toBe(true);
    });

    it('rejects incomplete sources, missing dimension evidence, and stale evidence for removed dimensions', () => {
        const encoded = serializeWellnessEvidence({
            source: 'Programa público consultado el 05/10/2026',
            dimensions: { environmental: 'Recorrido guiado de observación de aves en el bosque.' },
        });
        expect(isWellnessEvidenceComplete(encoded, ['environmental', 'physical'])).toBe(false);
        expect(isWellnessEvidenceComplete(encoded, [])).toBe(false);
        expect(isWellnessEvidenceComplete(serializeWellnessEvidence({ source: 'breve', dimensions: { environmental: 'Recorrido guiado de observación de aves en el bosque.' } }), ['environmental'])).toBe(false);
    });

    it('keeps older free-text evidence visible as a source but requires structured completion', () => {
        const parsed = parseWellnessEvidence('Descripción antigua del lugar que el equipo puede revisar.');
        expect(parsed.source).toBe('Descripción antigua del lugar que el equipo puede revisar.');
        expect(parsed.dimensions).toEqual({});
        expect(isWellnessEvidenceComplete('Descripción antigua del lugar que el equipo puede revisar.', ['environmental'])).toBe(false);
    });
});
