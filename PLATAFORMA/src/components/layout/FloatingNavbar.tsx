import React, { useEffect, useRef, useState } from 'react';
import { useLanguage, languages } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Globe, Sun, Moon, LogOut, Menu, X, ExternalLink } from 'lucide-react';
import logoSrc from '../../assets/landing/logo.png';
import gsap from 'gsap';

interface NavLink {
    label: string;
    target: string;
    href?: string;
    external: boolean;
}

interface User {
    id?: string;
    name?: string;
    email?: string;
}

interface FloatingNavbarProps {
    navLinks: NavLink[];
    handleStartExperience: () => void;
    scrollToSection: (sectionId: string) => void;
    activeSection: string;
    user: User | null;
    logout: () => void;
}

const PremiumButton: React.FC<{
    onClick: (e: React.MouseEvent) => void;
    children: React.ReactNode;
    color?: string;
    className?: string;
}> = ({ onClick, children, color = 'var(--color-pink)', className = "" }) => (
    <button
        onClick={onClick}
        className={`btn-premium group ${className}`}
        style={{ '--bg-color': color, '--hover-text': color } as React.CSSProperties}
    >
        <span>
            <span className="btn-base whitespace-nowrap">{children}</span>
            <span className="btn-hover whitespace-nowrap" aria-hidden="true">{children}</span>
        </span>
    </button>
);

export const FloatingNavbar: React.FC<FloatingNavbarProps> = ({ navLinks, handleStartExperience, scrollToSection, activeSection, user, logout }) => {
    const { theme, toggleTheme } = useTheme();
    const { lang, changeLanguage, t } = useLanguage();

    const [isNavSmall, setIsNavSmall] = useState(false);
    const [isNavHidden, setIsNavHidden] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);
    
    const lastScrollY = useRef(0);
    const navRef = useRef<HTMLDivElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const langDropdownRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        const currentY = window.scrollY;

        if (currentY > 100) {
            setIsNavSmall(true);
        } else {
            setIsNavSmall(false);
        }

        if (currentY > 200) {
            if (currentY > lastScrollY.current) {
                setIsNavHidden(true);
            } else {
                setIsNavHidden(false);
            }
        } else {
            setIsNavHidden(false);
        }

        lastScrollY.current = currentY;
    };

    const handlerRef = useRef(handleScroll);
    handlerRef.current = handleScroll;

    useEffect(() => {
        const listener = (...args: Parameters<typeof handlerRef.current>) => handlerRef.current(...args);
        window.addEventListener('scroll', listener, { passive: true });
        return () => window.removeEventListener('scroll', listener);
    }, []);

    useEffect(() => {
        if (navRef.current) {
            gsap.to(navRef.current, { 
                y: isNavHidden ? -150 : 0,
                opacity: isNavHidden ? 0 : 1,
                duration: 0.3,
                ease: 'power3.out'
            });
        }
    }, [isNavHidden]);

    useEffect(() => {
        if (bgRef.current) {
            gsap.to(bgRef.current, {
                boxShadow: isNavSmall
                    ? '0 2px 12px rgba(0,0,0,0.10)'
                    : '0 2px 20px rgba(0,0,0,0.08)',
                duration: 0.3,
                ease: 'power3.out',
            });
        }
    }, [isNavSmall]);

    useEffect(() => {
        if (mobileMenuRef.current) {
            const links = mobileMenuRef.current.querySelectorAll('button');
            if (isMobileMenuOpen) {
                gsap.to(mobileMenuRef.current, {
                    clipPath: 'inset(0% 0% 0% 0%)',
                    duration: 0.5,
                    ease: 'power4.out'
                });
                gsap.fromTo(links, 
                    { opacity: 0, y: 30 },
                    { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power4.out', delay: 0.2 }
                );
            } else {
                gsap.to(mobileMenuRef.current, {
                    clipPath: 'inset(0% 0% 100% 0%)',
                    duration: 0.5,
                    ease: 'power4.inOut'
                });
            }
        }
    }, [isMobileMenuOpen]);

    useEffect(() => {
        if (langDropdownRef.current) {
            if (langDropdownOpen) {
                gsap.fromTo(langDropdownRef.current,
                    { opacity: 0, y: -8, scale: 0.97 },
                    { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'power3.out' }
                );
            } else {
                gsap.to(langDropdownRef.current, {
                    opacity: 0,
                    y: -8,
                    duration: 0.18,
                    ease: 'power3.in'
                });
            }
        }
    }, [langDropdownOpen]);

    // Close lang dropdown on outside click
    useEffect(() => {
        if (!langDropdownOpen) return;
        const handler = (e: MouseEvent) => {
            const switcher = document.querySelector('.language-switcher');
            if (switcher && !switcher.contains(e.target as Node)) {
                setLangDropdownOpen(false);
            }
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [langDropdownOpen]);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
        if (!isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    };

    const handleMobileLinkClick = (target: string) => {
        scrollToSection(target);
        setIsMobileMenuOpen(false);
        document.body.style.overflow = '';
    };

    return (
        <>
            <div ref={navRef} className="fixed top-0 left-0 right-0 z-[100] pt-3">

                    <div className="mx-auto px-4 max-w-[1400px]">
                        <div
                            ref={bgRef}
                            className="relative flex items-center justify-between gap-9 px-7 py-2 rounded-[50px]"
                            style={{
                                background: 'rgba(var(--rgb-bg), 0.88)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
                                border: '1px solid var(--color-border)',
                                maxWidth: '1360px',
                                margin: '0 auto',
                            }}
                        >

                            {/* Logo */}
                            <a
                                href="#inicio"
                                onClick={(e) => {
                                    e.preventDefault();
                                    scrollToSection('inicio');
                                }}
                                className="flex-shrink-0"
                                >
                                    <img src={logoSrc} alt="SMARTUR" className="h-9 w-auto transition-all duration-300" />
                                </a>

                            {/* Desktop Menu */}
                            <nav className="hidden items-center gap-[1.75em] lg:flex">
                                {navLinks.map((item) => {
                                                const isActive = activeSection === item.target;
                                                return (
                                                    <button
                                                        key={item.target}
                                                        onClick={() => scrollToSection(item.target)}
                                                        className={`relative text-[15px] font-bold transition-colors duration-300 group whitespace-nowrap`}
                                                        style={{ color: isActive ? 'var(--color-pink)' : 'var(--color-text)' }}
                                                    >
                                                        {item.label}
                                                        <span className={`absolute -bottom-1 left-0 h-[2px] w-full transition-transform duration-300 origin-right ${isActive ? 'scale-x-100 origin-left' : 'scale-x-0 group-hover:scale-x-100 group-hover:origin-left'}`} style={{ background: 'var(--color-pink)' }} />
                                                    </button>
                                                );
                                            })}
                                        </nav>

                                        {/* Actions */}
                                        <div className="flex items-center gap-5 ml-auto z-[110]">
                                            {/* "Negocios" — external link, btn-cyan style */}
                                            <a
                                                href={import.meta.env.VITE_BUSINESS_URL ?? 'https://smartur.online:4321/'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="nav-business-btn hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 hover:-translate-y-px lg:flex whitespace-nowrap"
                                                style={{ color: 'var(--color-cyan)' }}
                                                onMouseEnter={e => {
                                                    (e.currentTarget as HTMLAnchorElement).style.background = 'var(--color-cyan)';
                                                    (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff';
                                                }}
                                                onMouseLeave={e => {
                                                    (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                                                    (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-cyan)';
                                                }}
                                            >
                                                {t('nav.business')}
                                                <ExternalLink size={14} className="flex-shrink-0" />
                                            </a>

                                            {user ? (
                                                <button onClick={logout} className="p-2 rounded-full transition-colors" style={{ background: 'rgba(255,71,142,0.1)', color: 'var(--color-pink)' }}>
                                                    <LogOut size={18} />
                                                </button>
                                            ) : (
                                                <PremiumButton onClick={handleStartExperience} className="hidden lg:block">
                                                    {t('nav.start')}
                                                </PremiumButton>
                                            )}

                                            {/* Controls — separator + theme + language, same layout as LANDING */}
                                            <div
                                                className="hidden items-center gap-2 pl-4 ml-4 lg:flex"
                                                style={{ borderLeft: '1px solid rgba(var(--rgb-text), 0.1)' }}
                                            >
                                                <button onClick={toggleTheme} className="control-btn p-2">
                                                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                                                </button>
                                                <div className="language-switcher relative">
                                                    <button
                                                        onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                                                        className="control-btn flex items-center gap-[0.3rem] px-[0.5rem] py-[0.4rem] text-[0.7rem] font-semibold"
                                                    >
                                                        <Globe className="size-[18px]" />
                                                        <span className="tracking-[0.05em]">{lang.toUpperCase()}</span>
                                                        <svg
                                                            className={`size-[12px] transition-transform duration-300 ${langDropdownOpen ? 'rotate-180' : ''}`}
                                                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                                        >
                                                            <polyline points="6 9 12 15 18 9" />
                                                        </svg>
                                                    </button>
                                                    {langDropdownOpen && (
                                                        <div
                                                            ref={langDropdownRef}
                                                            className="absolute top-[calc(100%+0.5rem)] right-0 rounded-lg overflow-hidden min-w-[140px] z-[200]"
                                                            style={{ background: 'var(--color-bg)', border: '1px solid rgba(var(--rgb-text), 0.1)', boxShadow: '0 4px 20px rgba(var(--rgb-text), 0.15)' }}
                                                        >
                                                            {Object.entries(languages).map(([code, name]) => (
                                                                <button
                                                                    key={code}
                                                                    onClick={() => { changeLanguage(code); setLangDropdownOpen(false); }}
                                                                    className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors"
                                                                    style={{
                                                                        background: lang === code ? 'rgba(var(--rgb-purple-accent), 0.12)' : 'transparent',
                                                                        color: lang === code ? 'var(--color-purple)' : 'var(--color-text)',
                                                                        borderBottom: '1px solid rgba(var(--rgb-text), 0.05)',
                                                                    }}
                                                                    onMouseEnter={e => {
                                                                        if (lang !== code) {
                                                                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(var(--rgb-purple-accent), 0.08)';
                                                                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-purple)';
                                                                        }
                                                                    }}
                                                                    onMouseLeave={e => {
                                                                        if (lang !== code) {
                                                                            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                                                                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text)';
                                                                        }
                                                                    }}
                                                                >
                                                                    <span className="text-[0.875rem]">{name}</span>
                                                                    <span className="text-[0.7rem] font-bold tracking-[0.05em] opacity-60">{code.toUpperCase()}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Mobile Toggle */}
                                            <button
                                                onClick={toggleMobileMenu}
                                                className="lg:hidden p-2"
                                                style={{ color: 'var(--color-text)' }}
                                                aria-label={t('accessibility.toggleMenu')}
                                            >
                                                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                                            </button>
                                        </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <div ref={mobileMenuRef} className={`mobile-menu-overlay fixed inset-0 z-[90] flex flex-col items-center justify-center`}>
                    <nav className="flex flex-col items-center gap-7">
                        {navLinks.map((item, idx) => (
                            <button
                                key={item.target}
                                onClick={() => handleMobileLinkClick(item.target)}
                                className="text-2xl font-black tracking-tighter transition-colors sm:text-4xl"
                                style={{
                                    transitionDelay: `${idx * 0.1}s`,
                                    color: activeSection === item.target ? 'var(--color-pink)' : 'var(--color-text)'
                                }}
                            >
                                {item.label}
                            </button>
                        ))}
                        {!user && (
                            <button
                                onClick={() => { handleStartExperience(); setIsMobileMenuOpen(false); document.body.style.overflow = ''; }}
                                className="mt-2 text-2xl font-bold"
                                style={{ color: 'var(--color-pink)' }}
                            >
                                {t('nav.start')}
                            </button>
                        )}

                        {/* Theme + Language controls — inline with nav, below links */}
                        <div
                            className="mt-4 flex items-center gap-3 rounded-2xl px-5 py-3"
                            style={{ background: 'rgba(var(--rgb-text), 0.05)', border: '1px solid rgba(var(--rgb-text), 0.08)' }}
                        >
                            <button
                                onClick={toggleTheme}
                                className="control-btn p-2.5 rounded-xl"
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <div
                                className="h-5 w-px"
                                style={{ background: 'rgba(var(--rgb-text), 0.15)' }}
                            />
                            <div className="flex items-center gap-1.5">
                                {Object.entries(languages).map(([code]) => (
                                    <button
                                        key={code}
                                        onClick={() => changeLanguage(code)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-colors"
                                        style={{
                                            background: lang === code ? 'rgba(var(--rgb-purple-accent), 0.18)' : 'transparent',
                                            color: lang === code ? 'var(--color-purple)' : 'var(--color-text-alt)',
                                        }}
                                    >
                                        {code.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </nav>
                </div>
        </>
    );
};
