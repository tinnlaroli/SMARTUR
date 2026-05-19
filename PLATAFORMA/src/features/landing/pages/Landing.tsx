import { useEffect, useState, useCallback /*, useMemo */ } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage, useUserPreferences } from '../../../contexts/LanguageContext';
import SmartURLoader from '../../auth/components/SmartURLoader';
import { FloatingNavbar } from '../../../components/layout/FloatingNavbar';
import { HeroSection } from '../components/HeroSection';
import { FlightDivider } from '../components/FlightDivider';
import { ActionBridge } from '../components/ActionBridge';
import { VideoSection } from '../components/VideoSection';
import { TechnologySection } from '../components/TechnologySection';
import { About } from '../components/About';
import { Testimonials } from '../components/Testimonials';
import { Statements } from '../components/Statements';
import { ImpactSection } from '../components/ImpactSection';
import { ContactForm } from '../components/ContactForm';
import { CordobaMap } from '../components/CordobaMap';
import { Faqs } from '../components/Faqs';
import { Footer } from '../../../components/layout/Footer';
// import { PwaHome } from '../../../components/layout/PwaHome';
import { useAuthModal } from '../../auth/context/AuthModalContext';
import { FormModal } from '../../form/components/FormModal';

import '../styles/Landing.css';
/* 
import bgPatron from '../../../assets/landing/bgPatron.png';
import logoArriba from '../../../assets/landing/logo.png';
*/

/*
interface InfoCard {
    id: string;
    title: string;
    highlight: string;
    description: string;
    badgeColor: string;
}
*/

interface NavbarUser {
    id?: string | number;
    name?: string;
    email?: string;
    role?: string;
    roleId?: number;
    role_id?: number;
}

export default function Landing() {
    const navigate = useNavigate();
    const location = useLocation();
    const { openModal } = useAuthModal();
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('inicio');
    // const [isStandalonePwa, setIsStandalonePwa] = useState(false);
    const isStandalonePwa = false; // Forzado a false para ver landing en móvil
    const [showCordobaMap, setShowCordobaMap] = useState(false);
    /* Comentado: State para PWA
    const [focusedCard, setFocusedCard] = useState<InfoCard | null>(null);
    const [showInfoCards, setShowInfoCards] = useState(false);
    */
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);

    const { user: sessionUser, clearUser } = useUserPreferences();
    const user: NavbarUser | null = sessionUser;
    useEffect(() => {
        if (location.state?.openForm) {
            setIsFormModalOpen(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, location.pathname, navigate]);

    const { t } = useLanguage();

    /* Comentado: infoCards para PWA
    const infoCards = useMemo<InfoCard[]>(
        () => [
            {
                id: 'company-values',
                title: t('pwa.info.company-values.title'),
                highlight: t('pwa.info.company-values.highlight'),
                description: t('pwa.info.company-values.description'),
                badgeColor: 'text-purple-600 bg-purple-100 border-purple-200',
            },
            {
                id: 'pymes',
                title: t('pwa.info.pymes.title'),
                highlight: t('pwa.info.pymes.highlight'),
                description: t('pwa.info.pymes.description'),
                badgeColor: 'text-pink-600 bg-pink-100 border-pink-200',
            },
            {
                id: 'ods',
                title: t('pwa.info.ods.title'),
                highlight: t('pwa.info.ods.highlight'),
                description: t('pwa.info.ods.description'),
                badgeColor: 'text-green-600 bg-green-100 border-green-200',
            },
        ],
        [t],
    );
    */

    const navLinks = [
        { label: t('nav.home'), target: 'inicio', external: false },
        { label: t('nav.howItWorks'), target: 'como-funciona', external: false },
        { label: t('nav.region'), target: 'region', external: false },
        { label: t('nav.technology'), target: 'tecnologia', external: false },
        { label: t('nav.about'), target: 'nosotros', external: false },
        { label: t('nav.impact'), target: 'impacto', external: false },
        { label: t('nav.testimonials'), target: 'testimonios', external: false },
        { label: t('nav.contact'), target: 'contacto', external: false },
        { label: t('nav.faqs'), target: 'faqs', external: false },
    ];

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActiveSection(entry.target.id);
                });
            },
            { threshold: 0.1, rootMargin: '-100px 0px -50% 0px' },
        );

        ['inicio', 'como-funciona', 'region', 'tecnologia', 'nosotros', 'impacto', 'testimonios', 'faqs', 'contacto'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => {
            observer.disconnect();
        };
    }, []);

    /* Comentado para obligar a ver la landing normal en móvil
    useEffect(() => {
        const updateStandalone = () => {
            const isMobileWidth = window.innerWidth <= 768;
            setIsStandalonePwa(isMobileWidth);
        };
        updateStandalone();
        window.addEventListener('resize', updateStandalone);
        return () => window.removeEventListener('resize', updateStandalone);
    }, []);
    */

    const scrollToSection = useCallback((sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 80,
                behavior: 'smooth',
            });
        }
    }, []);

    const handleStartExperience = useCallback(() => {
        if (sessionUser) {
            setIsFormModalOpen(true);
        } else {
            openModal('login');
        }
    }, [sessionUser, openModal]);

    const logout = () => {
        localStorage.removeItem('token');
        clearUser();
        navigate('/');
    };

    // const openInfoCards = () => setShowInfoCards(true);

    return (
        <div className="relative min-h-screen bg-[var(--color-bg)] font-sans text-[var(--color-text)]">
            {loading && <SmartURLoader onFinished={() => setLoading(false)} />}

            {!isStandalonePwa && (
                <div className="relative overflow-x-hidden">
                    <FloatingNavbar 
                        navLinks={navLinks} 
                        handleStartExperience={handleStartExperience} 
                        scrollToSection={scrollToSection} 
                        activeSection={activeSection} 
                        user={user} 
                        logout={logout} 
                    />

                    <main className="relative z-10 w-full">
                        <div id="inicio">
                            <HeroSection handleStartExperience={handleStartExperience} />
                        </div>

                        <FlightDivider handleStartExperience={handleStartExperience} />

                        <div id="como-funciona">
                            <ActionBridge handleStartExperience={handleStartExperience} />
                        </div>

                        <Statements handleStartExperience={handleStartExperience} />

                        <div id="region">
                            <VideoSection />
                        </div>

                        <div id="tecnologia">
                            <TechnologySection />
                        </div>

                        <div id="nosotros">
                            <About />
                        </div>

                        <div id="impacto">
                            <ImpactSection />
                        </div>

                        <Testimonials />

                        <div id="contacto">
                            <ContactForm />
                            <Faqs />
                        </div>

                        <Footer navLinks={navLinks} />
                    </main>
                </div>
            )}

            {showCordobaMap && (
                <div className="fixed inset-0 z-[1000] overflow-y-auto bg-[var(--color-bg)]">
                    <button
                        onClick={() => setShowCordobaMap(false)}
                        className="fixed top-6 right-6 z-[1001] rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4 shadow-2xl transition-colors hover:opacity-95 text-[var(--color-text)]"
                    >
                        <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <CordobaMap />
                </div>
            )}

            {/* Comentado: PWA Home y Modals de info PWA
            <PwaHome
                isStandalonePwa={isStandalonePwa}
                user={user}
                logout={logout}
                setShowLoginModal={() => openModal('login')}
                handleStartExperience={handleStartExperience}
                setShowCordobaMap={setShowCordobaMap}
                openInfoCards={openInfoCards}
                bgPatron={bgPatron}
                logoArriba={logoArriba}
            />

            {focusedCard && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-6 backdrop-blur-md">
                    <div className="relative w-full max-w-sm rounded-[40px] border border-[var(--color-border)] bg-[var(--color-bg)] p-8 text-[var(--color-text)] shadow-2xl">
                        <button onClick={() => setFocusedCard(null)} className="absolute top-6 right-6 text-2xl font-black text-[var(--color-text-alt)]">✕</button>
                        <span className={`mb-6 inline-flex rounded-full border px-4 py-1.5 text-[10px] font-black tracking-widest uppercase ${focusedCard.badgeColor}`}>{focusedCard.highlight}</span>
                        <h3 className="mb-4 text-2xl leading-tight font-black text-[var(--color-text)]">{focusedCard.title}</h3>
                        <p className="mb-8 leading-relaxed font-medium text-[var(--color-text-alt)]">{focusedCard.description}</p>
                        <button onClick={() => setFocusedCard(null)} className="w-full rounded-full bg-[var(--color-pink)] py-4 font-black text-[var(--color-text-on-vivid)] shadow-lg">{t('pwa.modal.understood')}</button>
                    </div>
                </div>
            )}

            {showInfoCards && (
                <div className="fixed inset-0 z-[9900] flex items-center justify-center bg-black/80 p-5 backdrop-blur-md">
                    <div className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-[40px] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] shadow-2xl">
                        <button onClick={() => setShowInfoCards(false)} className="absolute top-6 right-6 z-50 text-2xl font-black text-[var(--color-text-alt)]">✕</button>
                        <div className="border-b border-[var(--color-border)] p-8 pt-10">
                            <p className="mb-2 text-xs font-black tracking-[0.2em] text-[var(--color-pink)] uppercase">{t('pwa.modal.aboutLabel')}</p>
                            <h3 className="mb-2 text-3xl leading-none font-black text-[var(--color-text)]">{t('pwa.modal.title')}</h3>
                            <p className="text-sm font-medium text-[var(--color-text-alt)]">{t('pwa.modal.subtitle')}</p>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto p-6 pb-10">
                            {infoCards.map((card) => (
                                <div
                                    key={card.id}
                                    onClick={() => setFocusedCard(card)}
                                    className="cursor-pointer rounded-[32px] border-2 border-transparent bg-[var(--color-bg-alt)] p-6 transition-all hover:border-[rgba(var(--rgb-purple-accent),0.25)] active:scale-95"
                                >
                                    <span className={`mb-4 inline-flex rounded-full border px-3 py-1 text-[9px] font-black tracking-widest uppercase ${card.badgeColor}`}>{card.highlight}</span>
                                    <h4 className="mb-2 text-xl font-black text-[var(--color-text)]">{card.title}</h4>
                                    <p className="line-clamp-2 text-sm font-medium text-[var(--color-text-alt)]">{card.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            */}

            <FormModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} />
        </div>
    );
}
