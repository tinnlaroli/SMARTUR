import React, { useState, useEffect } from 'react';
import { Instagram, Mail, Phone, MapPin, Download } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

interface NavLink {
    label: string;
    target: string;
    external: boolean;
}

interface FooterProps {
    navLinks?: NavLink[];
}

export const Footer: React.FC<FooterProps> = ({ navLinks = [] }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [latestVersion, setLatestVersion] = useState('…');

    useEffect(() => {
        const controller = new AbortController();
        fetch('https://api.github.com/repos/tinnlaroli/smartur-movil/releases/latest', { signal: controller.signal })
            .then((res) => { if (res.ok) return res.json(); })
            .then((data) => { if (data?.tag_name) setLatestVersion(data.tag_name); })
            .catch(() => {});
        return () => controller.abort();
    }, []);

    const defaultLinks = [
        { label: t('nav.home'), target: 'inicio' },
        { label: t('nav.region'), target: 'region' },
        { label: t('nav.technology'), target: 'tecnologia' },
        { label: t('nav.about'), target: 'nosotros' },
    ];

    const links = navLinks.length > 0 ? navLinks : defaultLinks;

    const scrollTo = (target: string) => {
        const el = document.getElementById(target);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <footer
            className="relative w-full"
            style={{
                background: 'rgba(var(--rgb-bg), 0.96)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
            }}
        >
            <div className="landing-container mx-auto max-w-[1280px] px-4 pt-12 pb-8 sm:px-6 md:px-10 lg:px-16 lg:pt-16">
                {/* Main grid */}
                <div className="mb-14 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_2.5fr] lg:gap-12">

                    {/* Branding */}
                    <div className="flex flex-col gap-6">
                        <span className="block w-44">
                            <img
                                src={theme === 'welltur' ? '/wellturLogo.png' : '/smartur.png'}
                                alt={theme === 'welltur' ? 'WELLTUR' : 'SMARTUR'}
                                className="h-auto w-full object-contain"
                                style={{ filter: 'var(--logo-filter, none)' }}
                            />
                        </span>
                        <p className="text-base font-semibold italic" style={{ color: 'var(--color-purple)' }}>
                            {t('footer.slogan')}
                        </p>
                        <p className="max-w-xs text-sm leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                            {t('footer.description')}
                        </p>
                    </div>

                    {/* Columns */}
                    <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">

                        {/* Quick links */}
                        <div>
                            <h3
                                className="mb-5 text-xs font-bold tracking-widest uppercase"
                                style={{ color: 'var(--color-text)' }}
                            >
                                {t('footer.quickLinks')}
                            </h3>
                            <ul className="flex flex-col gap-4">
                                {links.map((link) => (
                                    <li key={link.target}>
                                        <button
                                            type="button"
                                            onClick={() => scrollTo(link.target)}
                                            className="text-sm font-medium transition-colors duration-200"
                                            style={{ color: 'var(--color-text-alt)' }}
                                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-cyan)')}
                                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-alt)')}
                                        >
                                            {link.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3
                                className="mb-5 text-xs font-bold tracking-widest uppercase"
                                style={{ color: 'var(--color-text)' }}
                            >
                                {t('footer.contact')}
                            </h3>
                            <ul className="flex flex-col gap-5">
                                <li className="flex items-start gap-3">
                                    <Mail className="mt-0.5 size-4 flex-shrink-0" style={{ color: 'var(--color-purple)' }} />
                                    <a
                                        href="mailto:wellturutcv@gmail.com"
                                        className="break-all text-sm font-medium transition-colors duration-200"
                                        style={{ color: 'var(--color-text-alt)' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-cyan)')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-alt)')}
                                    >
                                        wellturutcv@gmail.com
                                    </a>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Phone className="mt-0.5 size-4 flex-shrink-0" style={{ color: 'var(--color-purple)' }} />
                                    <a
                                        href="tel:+522711730136"
                                        className="text-sm font-medium transition-colors duration-200"
                                        style={{ color: 'var(--color-text-alt)' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-cyan)')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-alt)')}
                                    >
                                        271 173 0136
                                    </a>
                                </li>
                                <li className="flex items-start gap-3">
                                    <MapPin className="mt-0.5 size-4 flex-shrink-0" style={{ color: 'var(--color-purple)' }} />
                                    <span className="text-sm font-medium leading-snug" style={{ color: 'var(--color-text-alt)' }}>
                                        Av. Universidad 350,<br />94910 Cuitláhuac, Ver.
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* Social */}
                        <div className="lg:pl-8">
                            <h3
                                className="mb-5 text-xs font-bold tracking-widest uppercase"
                                style={{ color: 'var(--color-text)' }}
                            >
                                {t('footer.social')}
                            </h3>
                            <a
                                href="https://www.instagram.com/smar_tur"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 transition-all duration-300 hover:-translate-y-0.5"
                                style={{
                                    background: 'var(--color-bg-alt)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-text-alt)',
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-cyan)';
                                    (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-cyan)';
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-border)';
                                    (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-alt)';
                                }}
                            >
                                <Instagram className="size-6 flex-shrink-0" />
                                <span className="text-sm font-semibold">Instagram</span>
                            </a>
                        </div>

                        {/* App */}
                        <div className="lg:pl-8">
                            <h3
                                className="mb-5 text-xs font-bold tracking-widest uppercase"
                                style={{ color: 'var(--color-text)' }}
                            >
                                {t('footer.mobileApp')}
                            </h3>
                            <div className="flex flex-col gap-4">
                                <span className="text-xs font-medium" style={{ color: 'var(--color-text-alt)' }}>
                                    {t('footer.mobileApp.version')}: {latestVersion}
                                </span>
                                <a
                                    href="https://github.com/tinnlaroli/smartur-movil/releases/latest/download/app-release.apk"
                                    className="group inline-flex w-fit items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
                                    style={{
                                        background: 'var(--color-cyan)',
                                        boxShadow: '0 8px 20px rgba(var(--rgb-cyan-accent), 0.28)',
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLAnchorElement).style.opacity = '0.88';
                                        (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 12px 24px rgba(var(--rgb-cyan-accent), 0.38)';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLAnchorElement).style.opacity = '1';
                                        (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 20px rgba(var(--rgb-cyan-accent), 0.28)';
                                    }}
                                >
                                    <Download className="size-4" />
                                    {t('footer.mobileApp.download')}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div
                    className="flex flex-col items-center justify-center border-t pt-8 md:flex-row"
                    style={{ borderColor: 'var(--color-border)' }}
                >
                    <p className="text-xs font-medium" style={{ color: 'var(--color-text-alt)' }}>
                        © <span suppressHydrationWarning>{new Date().getFullYear()}</span> WELLTUR. {t('footer.copyright')}
                    </p>
                </div>
            </div>
        </footer>
    );
};
