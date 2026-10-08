const MOTIVES = new Set(['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9']);
const MODALITIES = new Set(['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7']);

/** Evidence must point from each selected M/W tag to an observable offering. */
export function hasCompleteWellnessMWEvidence(motives, modalities, evidence) {
    if (!Array.isArray(motives) || !Array.isArray(modalities) ||
        motives.length > 9 || modalities.length > 7 ||
        new Set(motives).size !== motives.length || new Set(modalities).size !== modalities.length ||
        motives.some((code) => !MOTIVES.has(code)) || modalities.some((code) => !MODALITIES.has(code)) ||
        (motives.length === 0 && modalities.length === 0) ||
        !evidence || typeof evidence !== 'object' || Array.isArray(evidence)) return false;

    const selected = [...motives, ...modalities];
    const keys = Object.keys(evidence);
    return keys.length === selected.length &&
        keys.every((key) => selected.includes(key)) &&
        selected.every((code) => typeof evidence[code] === 'string' &&
            evidence[code].trim().length >= 10 && evidence[code].trim().length <= 180);
}

export const WELLTUR_MW_MOTIVES = Object.freeze([...MOTIVES]);
export const WELLTUR_MW_MODALITIES = Object.freeze([...MODALITIES]);
