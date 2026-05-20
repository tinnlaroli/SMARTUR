interface CardSkeletonProps {
    count?: number;
    gridClassName?: string;
}

export const CardSkeleton = ({
    count = 6,
    gridClassName = 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3',
}: CardSkeletonProps) => (
    <div className={gridClassName}>
        {Array.from({ length: count }, (_, i) => (
            <div
                key={i}
                className="relative overflow-hidden rounded-2xl border p-5 animate-pulse shadow-sm"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
            >
                {/* accent strip */}
                <div
                    className="absolute left-0 top-0 h-full w-1 rounded-l-2xl"
                    style={{ background: 'var(--color-border)' }}
                />

                <div className="mb-4 flex items-start justify-between pl-2">
                    <div className="size-10 rounded-xl" style={{ background: 'var(--color-bg-alt)' }} />
                    <div className="h-5 w-16 rounded-full" style={{ background: 'var(--color-bg-alt)' }} />
                </div>

                <div className="pl-2 space-y-2">
                    <div className="h-4 w-3/4 rounded-md" style={{ background: 'var(--color-bg-alt)' }} />
                    <div className="h-3 w-1/2 rounded-md" style={{ background: 'var(--color-bg-alt)' }} />
                    <div className="h-3 w-2/3 rounded-md" style={{ background: 'var(--color-bg-alt)' }} />
                </div>

                <div
                    className="mt-4 flex items-center gap-2 border-t pt-4 pl-2"
                    style={{ borderColor: 'var(--color-border)' }}
                >
                    <div className="h-7 flex-1 rounded-xl" style={{ background: 'var(--color-bg-alt)' }} />
                </div>
            </div>
        ))}
    </div>
);
