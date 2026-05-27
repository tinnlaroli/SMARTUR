export const EMPRESA_SERVICE_TYPE_OPTIONS = [
    { value: 'restaurant', label: 'Restaurante' },
    { value: 'hotel', label: 'Hotel' },
    { value: 'tour', label: 'Tour / Ecoturismo' },
    { value: 'transporte', label: 'Transporte' },
    { value: 'spa', label: 'Spa / Bienestar' },
] as const;

export const EMPRESA_SERVICE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
    EMPRESA_SERVICE_TYPE_OPTIONS.map(({ value, label }) => [value, label]),
);

export function getEmpresaServiceTypeLabel(type: string | null | undefined): string {
    if (!type) return '—';
    return EMPRESA_SERVICE_TYPE_LABELS[type] ?? type;
}
