const PREFIX = 'SMARTUR_WELLNESS_EVIDENCE_V1:';
const ALLOWED_DIMENSIONS = new Set(['physical', 'mental', 'emotional', 'spiritual', 'social', 'environmental']);

/** Require an auditable source and a concrete rationale for each approved dimension. */
export function hasCompleteWellnessEvidence(value, selectedDimensions) {
    if (typeof value !== 'string' || value.length > 1000 || !value.startsWith(PREFIX)) return false;
    if (!Array.isArray(selectedDimensions) || selectedDimensions.length === 0 ||
        selectedDimensions.some((dimension) => !ALLOWED_DIMENSIONS.has(dimension))) return false;

    try {
        const record = JSON.parse(value.slice(PREFIX.length));
        if (!record || typeof record !== 'object' || Array.isArray(record) ||
            typeof record.source !== 'string' || record.source.trim().length < 10 ||
            !record.dimensions || typeof record.dimensions !== 'object' || Array.isArray(record.dimensions)) return false;
        const evidenceDimensions = Object.keys(record.dimensions);
        if (evidenceDimensions.length !== selectedDimensions.length ||
            evidenceDimensions.some((dimension) => !selectedDimensions.includes(dimension))) return false;
        return selectedDimensions.every((dimension) =>
            typeof record.dimensions[dimension] === 'string' && record.dimensions[dimension].trim().length >= 12);
    } catch {
        return false;
    }
}
