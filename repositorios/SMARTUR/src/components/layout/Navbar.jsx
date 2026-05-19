import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import smarturLogo from "../../assets/logo.png";
import { useLanguage, languages } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
export default function Navbar({
  scrolled,
  navLinks,
  user,
  handleStartExperience, // Reemplazaremos este logic para redirigir si es necesario
  showLoginModal,
  showRegisterModal,
  mobileMenuOpen,
  setMobileMenuOpen,
  scrollToSection,
  logout,
  activeSection,
}) {
  const { theme, toggleTheme } = useTheme();
  const { lang, changeLanguage, t, isReady } = useLanguage();

  const [isNavSmall, setIsNavSmall] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const prevYRef = useRef(0);

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".language-switcher")) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    // Replica el comportamiento de scrollSpy / Hide & Small de Header.astro
    const handleScroll = () => {
      const currentY = window.scrollY;
      const isDown = currentY > prevYRef.current;
      prevYRef.current = currentY;

      // Small threshold
      if (currentY > 100) {
        setIsNavSmall(true);
      } else {
        setIsNavSmall(false);
      }

      // Hide threshold
      if (currentY > 200 && isDown) {
        setIsNavHidden(true);
      } else {
        setIsNavHidden(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Clases CSS base que copian a <sy-head> de Header.astro
  // Usamos utility classes en Tailwind para emular el SCSS de Astro donde sea posible,
  // y aplicamos estilos inline si necesitamos variables.

  const navContainerClass = `
    fixed top-3 left-0 right-0 z-[100] text-gray-900 dark:text-white mx-auto px-0 w-full max-w-full box-border
    transition-transform duration-300 ease-out 
    ${isNavHidden && !mobileMenuOpen ? "-translate-y-[calc(100%+0.75rem)]" : "translate-y-0"}
    ${isNavSmall ? "top-2 sm:top-2" : "top-3 sm:top-2"}
  `;

  return (
    <header className="relative z-[100]">
      <div
        className={navContainerClass}
        style={{
          // Evitar transforms si el menú está abierto
          transform: mobileMenuOpen ? "none" : undefined,
        }}
      >
        {/* Fondo desenfocado que se revela al hacer scroll */}
        <div
          className={`absolute inset-0 -z-10 origin-top bg-white/85 dark:bg-slate-950/85 backdrop-blur-[20px] transition-all duration-300 ease-out
          ${isNavSmall ? "scale-y-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.5)]" : "scale-y-0 shadow-none border-t border-transparent dark:border-slate-800"}
          `}
        />

        <div className="container mx-auto px-0 transition-padding duration-300 ease-out">
          <div className="relative flex justify-between items-center gap-1.5 sm:gap-6 lg:gap-9 px-4 sm:px-2 py-1.5 box-border w-full">
            {/* LOGO */}
            <a href="/" className="relative z-10 flex-shrink-0 hidden md:block">
              <img
                src={smarturLogo}
                alt="Logo SMARTUR"
                className="h-[3.2rem] w-auto object-contain"
              />
            </a>

            {/* MENÚ BÁSICO (Desktop) */}
            <div
              className={`
              ml-0 md:ml-8 w-auto flex
              ${mobileMenuOpen ? "fixed inset-0 z-[2] bg-white/98 dark:bg-slate-950/98 backdrop-blur-[20px] w-[100vw] h-[100vh]" : "hidden md:flex"}
              md:static md:bg-transparent md:backdrop-blur-none md:w-auto md:h-auto
            `}
            >
              <ul
                className={`
                flex list-none p-0 m-0 items-center justify-center
                ${mobileMenuOpen ? "flex-col text-[2rem] gap-4 w-full h-full text-gray-900 dark:text-white" : "flex-row gap-7 text-base text-gray-900 dark:text-slate-100"}
              `}
              >
                {navLinks.map((item, idx) => {
                  const isActive = activeSection === item.target;
                  return (
                    <li
                      key={idx}
                      className={`
                        flex items-center gap-5 relative
                        ${mobileMenuOpen ? "flex-col" : "after:content-[''] after:w-[2px] after:h-[2px] after:bg-gray-400 after:rounded-full last:after:hidden"}
                      `}
                    >
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          scrollToSection(item.target);
                          setMobileMenuOpen(false);
                        }}
                        className={`
                          relative text-gray-900 dark:text-slate-100 font-medium hover:text-purple-600 dark:hover:text-purple-400 transition-colors
                          ${isActive ? "text-purple-600 dark:text-purple-400" : ""}
                          group
                        `}
                      >
                        {item.label}
                        {/* Línea animada inferior estilo Astro */}
                        <span
                          className={`
                          absolute h-[2px] bg-current top-[115%] w-full left-0 pointer-events-none transition-transform duration-300 origin-right
                          ${isActive ? "scale-x-100 origin-left" : "scale-x-0 group-hover:scale-x-100 group-hover:origin-left"}
                        `}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* BOTONES SECUNDARIOS */}
            <div className="flex items-center gap-2 sm:gap-4 lg:gap-5 z-10 ml-auto md:relative">
              {/* Botón Acceder */}
              <a
                href="http://localhost:5173/"
                className="hidden md:inline-flex px-5 py-2 rounded-full text-sm font-semibold transition-colors
                           border-2 border-cyan-500 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500 hover:text-white"
                target="_blank"
                rel="noreferrer"
              >
                {t("button.access")}
              </a>

              {/* Botón Comenzar */}
              <button
                onClick={handleStartExperience}
                className="hidden md:inline-flex px-5 py-2 rounded-full text-sm font-semibold transition-colors 
                           bg-purple-600 text-white hover:bg-purple-700 hover:opacity-90"
              >
                {t("button.get-started")}
              </button>

              {/* Controles de Idioma/Tema */}
              <div className="hidden md:flex items-center pl-3 ml-3 border-l border-gray-200 gap-2 relative language-switcher">
                {/* Selector de idioma */}
                <button
                  className="flex items-center gap-1 font-semibold px-2 py-1 text-gray-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-xs tracking-wider"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLangDropdownOpen(!langDropdownOpen);
                  }}
                  aria-label={t("accessibility.changeLanguage")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                  <span>{lang.toUpperCase()}</span>
                  <svg
                    className={`w-3 h-3 transition-transform ${langDropdownOpen ? "rotate-180" : ""}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {/* Dropdown Idioma */}
                <AnimatePresence>
                  {langDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        y: -10,
                        transition: { duration: 0.2 },
                      }}
                      className="absolute top-[calc(100%+0.5rem)] right-0 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden min-w-[150px] z-50 text-gray-800 dark:text-slate-200"
                    >
                      {Object.entries(languages).map(([code, name]) => (
                        <button
                          key={code}
                          onClick={() => {
                            changeLanguage(code);
                            setLangDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors border-b last:border-0 border-gray-50 dark:border-slate-800
                            ${code === lang ? "bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 font-semibold" : "hover:bg-purple-50 dark:hover:bg-slate-800 hover:text-purple-600 dark:hover:text-purple-400"}
                          `}
                        >
                          <span className="text-xs font-bold text-gray-400">
                            {code.toUpperCase()}
                          </span>
                          <span>{name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center text-gray-700 dark:text-slate-300 transition-colors relative"
                  aria-label={t("accessibility.toggleTheme")}
                >
                  <svg
                    className={`w-4 h-4 absolute transition-all duration-300 ${theme === "dark" ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                  <svg
                    className={`w-4 h-4 absolute transition-all duration-300 ${theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                </button>
              </div>

              {/* Hamburger Toggle (Mobile/Tablet) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`
                  flex md:hidden relative z-[110] text-gray-900 dark:text-white border-none bg-transparent p-3 -m-3 cursor-pointer items-center justify-center w-[44px] h-[44px]
                  transition-colors duration-300
                  ${mobileMenuOpen || isNavSmall ? "text-purple-600 dark:text-purple-400" : ""}
                `}
                aria-label={t("accessibility.toggleMenu")}
              >
                <div className="flex flex-col justify-between h-5 w-7 relative overflow-hidden">
                  <span
                    className={`block w-full h-[3px] bg-current rounded-full transition-all duration-300 ${mobileMenuOpen ? "translate-y-[8.5px] rotate-45" : ""}`}
                  />
                  <span
                    className={`block w-full h-[3px] bg-current rounded-full transition-all duration-200 ${mobileMenuOpen ? "opacity-0" : ""}`}
                  />
                  <span
                    className={`block w-full h-[3px] bg-current rounded-full transition-all duration-300 ${mobileMenuOpen ? "-translate-y-[8.5px] -rotate-45" : ""}`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
