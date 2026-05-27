export function PageSpinner() {
    return (
        <div
            className="flex h-full min-h-[200px] w-full items-center justify-center"
            aria-label="Cargando…"
        >
            <span
                className="block size-8 animate-spin rounded-full border-2 border-current border-t-transparent"
                style={{ color: 'var(--color-purple)' }}
            />
        </div>
    );
}
