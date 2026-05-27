import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export const NotFound = () => {
    const { lang } = useLanguage();

    const copy = {
        es: {
            title: 'Esta página no existe',
            sub: 'El destino que buscas no está en nuestro mapa. Quizás la URL cambió o fue eliminada.',
            back: 'Volver atrás',
            home: 'Ir al inicio',
        },
        en: {
            title: 'This page does not exist',
            sub: "The destination you're looking for isn't on our map. The URL may have changed or been removed.",
            back: 'Go back',
            home: 'Go to home',
        },
        fr: {
            title: "Cette page n'existe pas",
            sub: "La destination que vous cherchez n'est pas sur notre carte. L'URL a peut-être changé ou été supprimée.",
            back: 'Retour',
            home: "Aller à l'accueil",
        },
        pt: {
            title: 'Esta página não existe',
            sub: 'O destino que procura não está no nosso mapa. O URL pode ter mudado ou sido removido.',
            back: 'Voltar',
            home: 'Ir para o início',
        },
    } as const;

    const t = copy[lang as keyof typeof copy] ?? copy.es;

    useEffect(() => {
        document.title = '404 — SMARTUR';
    }, []);

    return (
        <div
            className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
            style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}
        >
            {/* Big gradient number */}
            <p
                className="font-black leading-none"
                style={{
                    fontSize: 'clamp(7rem, 20vw, 13rem)',
                    background: 'linear-gradient(135deg, var(--color-purple) 0%, #FC478E 55%, #4DB9CA 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-4px',
                    marginBottom: '0.5rem',
                }}
            >
                404
            </p>

            {/* Pin icon */}
            <MapPin
                className="mb-5"
                style={{ color: 'var(--color-purple)', width: 40, height: 40 }}
            />

            <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>
                {t.title}
            </h1>

            <p
                className="mb-8 max-w-sm text-sm leading-relaxed"
                style={{ color: 'var(--color-text-alt)' }}
            >
                {t.sub}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
                <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
                    style={{
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-alt)',
                        color: 'var(--color-text)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                    <ArrowLeft className="size-4" />
                    {t.back}
                </button>

                <Link
                    to="/"
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors"
                    style={{ background: 'var(--color-purple)' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                    Smartur
                </Link>
            </div>
        </div>
    );
};
