import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export const NotFound = () => {
    useEffect(() => {
        document.title = '404 - Página no encontrada';
    }, []);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">

            <div className="relative">
                <h1 className="animate-pulse text-8xl font-black text-zinc-200">404</h1>
                <div className="absolute -top-3 -right-3">
                    <span className="relative flex size-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex size-3 rounded-full bg-red-500"></span>
                    </span>
                </div>
            </div>
            <p className="mt-4 text-xl text-zinc-300">¡Ups! Página no encontrada</p>

            <p className="mt-2 max-w-md text-zinc-400">La página que estás buscando no existe o ha sido movida a otra ubicación.</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
                >
                    <ArrowLeft className="size-4" />
                    Volver atrás
                </button>

                <Link to="/" className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-600">
                    <Home className="size-4" />
                    Ir al inicio
                </Link>
            </div>

            <div className="mt-8 text-sm text-zinc-500">
                <p>
                    ¿Necesitas ayuda?{' '}
                    <Link to="/" className="text-zinc-400 underline hover:text-zinc-300">
                        Contacta con soporte
                    </Link>
                </p>
            </div>
        </div>
    );
};
