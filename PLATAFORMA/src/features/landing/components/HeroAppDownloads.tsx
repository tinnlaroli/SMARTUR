import { Download } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

export const APK_DOWNLOAD_URL =
    'https://github.com/tinnlaroli/smartur-movil/releases/latest/download/app-release.apk';

function GooglePlayIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
        >
            <path d="M3.6 1.8c-.4.2-.6.6-.6 1.1v18.2c0 .5.2.9.6 1.1l.1.1 10.2-10.2v-.2L3.7 1.7l-.1.1zm12.4 8.5-2.5-2.5-2.1 2.1 2.1 2.1 2.5-2.5 3.4 3.4c.6-.3 1-.9 1-1.6 0-.7-.4-1.3-1-1.6l-3.4 3.4zM5.3 3.3l9.2 9.2 2.5-2.5L7.8 1.8 5.3 3.3zm13.7 6.9-3.4 3.4 2.5 2.5 4.6-2.6c.6-.3 1-.9 1-1.6s-.4-1.3-1-1.6l-4.6-2.6-2.5 2.5zM5.3 20.7l7.2-7.2-2.5-2.5L5.3 20.7z" />
        </svg>
    );
}

export function HeroAppDownloads() {
    const { t } = useLanguage();

    return (
        <div className="hero-app-downloads">
            <p className="hero-app-downloads__hint">{t('heroSection.appHint')}</p>
            <div className="hero-app-downloads__actions">
                <a
                    href={APK_DOWNLOAD_URL}
                    className="hero-app-downloads__btn hero-app-downloads__btn--apk group"
                    rel="noopener noreferrer"
                    download
                >
                    <Download className="size-4 shrink-0" aria-hidden />
                    <span>{t('footer.mobileApp.download')}</span>
                </a>
                <span
                    className="hero-app-downloads__btn hero-app-downloads__btn--play"
                    role="img"
                    aria-label={`${t('heroSection.playStore')} — ${t('heroSection.playStoreSoon')}`}
                >
                    <GooglePlayIcon className="size-5 shrink-0 opacity-70" />
                    <span className="hero-app-downloads__play-text">
                        <span className="hero-app-downloads__play-label">{t('heroSection.playStore')}</span>
                        <span className="hero-app-downloads__play-soon">{t('heroSection.playStoreSoon')}</span>
                    </span>
                </span>
            </div>
        </div>
    );
}
