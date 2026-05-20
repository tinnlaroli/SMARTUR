/**
 * EvaluationsPage — Gestión de evaluaciones de servicios turísticos.
 */
export function EvaluationsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    Evaluaciones
                </h1>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Gestiona las evaluaciones y reseñas de los servicios turísticos.
                </p>
            </div>

            <div className="flex items-center justify-center h-64 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                <div className="text-center">
                    <p className="text-zinc-400 dark:text-zinc-600 text-sm font-medium">
                        Módulo en construcción
                    </p>
                    <p className="text-zinc-300 dark:text-zinc-700 text-xs mt-1">
                        Las evaluaciones estarán disponibles próximamente.
                    </p>
                </div>
            </div>
        </div>
    );
}
