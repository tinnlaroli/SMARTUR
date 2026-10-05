export interface WellnessEvidenceRecord {
    source: string;
    dimensions: Record<string, string>;
}

const PREFIX = 'SMARTUR_WELLNESS_EVIDENCE_V1:';

export function parseWellnessEvidence(raw: string | undefined): WellnessEvidenceRecord {
    const value = String(raw ?? '');
    if (!value.startsWith(PREFIX)) return { source: value, dimensions: {} };

    try {
        const parsed = JSON.parse(value.slice(PREFIX.length)) as Partial<WellnessEvidenceRecord>;
        return {
            source: typeof parsed.source === 'string' ? parsed.source : '',
            dimensions: parsed.dimensions && typeof parsed.dimensions === 'object'
                ? Object.fromEntries(Object.entries(parsed.dimensions).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
                : {},
        };
    } catch {
        return { source: '', dimensions: {} };
    }
}

export function serializeWellnessEvidence(record: WellnessEvidenceRecord): string {
    return `${PREFIX}${JSON.stringify({ source: record.source.trim(), dimensions: record.dimensions })}`;
}

export function isWellnessEvidenceComplete(raw: string, selectedDimensions: string[]): boolean {
    if (!raw.startsWith(PREFIX) || raw.length > 1000) return false;
    const evidence = parseWellnessEvidence(raw);
    const selected = [...selectedDimensions].sort();
    const documented = Object.keys(evidence.dimensions).sort();
    return evidence.source.trim().length >= 10 && selectedDimensions.length > 0 &&
        documented.length === selected.length && documented.every((dimension, index) => dimension === selected[index]) &&
        selectedDimensions.every((dimension) => (evidence.dimensions[dimension] ?? '').trim().length >= 12);
}

export const WELLNESS_EVIDENCE_PREFIX = PREFIX;
