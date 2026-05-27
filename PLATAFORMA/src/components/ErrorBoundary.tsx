import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    /** Título mostrado en el fallback. Default: "Algo salió mal" */
    title?: string;
    /** Fallback personalizado. Si se omite se muestra el panel por defecto. */
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * ErrorBoundary — captura errores de renderizado en React y muestra un panel
 * de recuperación en lugar de romper toda la UI.
 *
 * Uso:
 * ```tsx
 * <ErrorBoundary title="Error cargando módulo">
 *   <MiComponente />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        // En producción Sentry captura esto automáticamente.
        // En desarrollo imprimimos el stack completo.
        if (import.meta.env.DEV) {
            console.error('[ErrorBoundary]', error, info.componentStack);
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (!this.state.hasError) return this.props.children;

        if (this.props.fallback) return this.props.fallback;

        const title = this.props.title ?? 'Algo salió mal';
        const message =
            import.meta.env.DEV && this.state.error
                ? this.state.error.message
                : 'Ha ocurrido un error inesperado. Intenta recargar el módulo.';

        return (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-4 rounded-xl border border-rose-200 bg-rose-50 p-8 dark:border-rose-900/40 dark:bg-rose-950/20">
                <div className="flex size-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                    <AlertTriangle className="size-6 text-rose-500" />
                </div>
                <div className="text-center">
                    <p className="text-base font-semibold text-rose-700 dark:text-rose-400">{title}</p>
                    <p className="mt-1 max-w-sm text-sm text-rose-600 dark:text-rose-500">{message}</p>
                </div>
                <button
                    onClick={this.handleReset}
                    className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-95"
                >
                    <RefreshCw className="size-4" />
                    Reintentar
                </button>
            </div>
        );
    }
}

export default ErrorBoundary;
