import React, { useEffect, useRef, useState } from "react";
import { useLanguage, languages } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import smarturLogo from "../../assets/logo.png";
import gsap from "gsap";
import {
  ExternalLink,
  Globe,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";

export default function FloatingNavbar({
  scrolled,
  navLinks,
  handleStartExperience,
  scrollToSection,
  activeSection,
  user,
  logout,
}) {
  const { theme, toggleTheme } = useTheme();
  const { lang, changeLanguage, t } = useLanguage();

  const navRef = useRef(null);
  const bgRef = useRef(null);

  const [isNavSmall, setIsNavSmall] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

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
    const handleScroll = () => {
      const currentY = window.scrollY;

      if (currentY > 50 && !isNavSmall) {
        setIsNavSmall(true);
        gsap.to(navRef.current, {
          scale: 0.95,
          duration: 0.3,
          ease: "power2.out",
        });
        gsap.to(bgRef.current, {
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          duration: 0.3,
        });
      } else if (currentY <= 50 && isNavSmall) {
        setIsNavSmall(false);
        gsap.to(navRef.current, {
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
        });
        gsap.to(bgRef.current, {
          backgroundColor: "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          duration: 0.3,
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isNavSmall]);

  return (
    <div className="fixed top-[20px] left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
      <div
        ref={navRef}
        className="relative w-full max-w-[1100px] rounded-[50px] overflow-visible pointer-events-auto"
        style={{
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.5)",
        }}
      >
        {/* Glassmorphism Background */}
        <div
          ref={bgRef}
          className="absolute inset-0 -z-10 rounded-[50px]"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.4)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        />

        <div className="flex items-center justify-between px-6 py-3">
          {/* LOGO */}
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("hero");
            }}
            className="flex-shrink-0 relative group"
          >
            <img
              src={smarturLogo}
              alt="SMARTUR"
              className="h-10 w-auto object-contain transition-all duration-300 group-hover:drop-shadow-[0_0_8px_#914ef5]"
            />
          </a>

          {/* LINKS (Center) - Hidden on very small screens, shown otherwise */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((item, idx) => {
              const isActive = activeSection === item.target;

              if (item.external) {
                return (
                  <a
                    key={idx}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                      relative font-['Outfit'] text-[15px] font-medium tracking-wide transition-colors duration-300
                      ${isActive ? "text-[#914ef5]" : "text-gray-800 hover:text-[#914ef5]"}
                      group
                    `}
                  >
                    {item.label}
                    {/* Underline effect */}
                    <span
                      className={`
                        absolute -bottom-1 left-0 w-full h-[2px] bg-[#914ef5] transition-transform duration-300 origin-right
                        scale-x-0 group-hover:scale-x-100 group-hover:origin-left
                      `}
                    />
                  </a>
                );
              }

              return (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(item.target);
                  }}
                  className={`
                    relative font-['Outfit'] text-[15px] font-medium tracking-wide transition-colors duration-300
                    ${isActive ? "text-[#914ef5]" : "text-gray-800 hover:text-[#914ef5]"}
                    group
                  `}
                >
                  {item.label}
                  {/* Underline effect */}
                  <span
                    className={`
                      absolute -bottom-1 left-0 w-full h-[2px] bg-[#914ef5] transition-transform duration-300 origin-right
                      ${isActive ? "scale-x-100 origin-left" : "scale-x-0 group-hover:scale-x-100 group-hover:origin-left"}
                    `}
                  />
                </button>
              );
            })}
          </nav>

          {/* ACTIONS (Right) */}
          <div className="flex items-center gap-3 sm:gap-4 relative">
            {/* Tengo un servicio (Cyan Text with External Link Icon) */}
            <a
              href="http://localhost:5173/business"
              className="hidden sm:flex items-center gap-1.5 text-[#2bb8d6] hover:text-[#1e9cb8] transition-colors font-bold text-[15px] tracking-wide"
              target="_blank"
              rel="noreferrer"
            >
              Tengo un servicio
              <ExternalLink className="w-5 h-5 mb-0.5" strokeWidth={2.5} />
            </a>

            {/* Comenzar Button (Orange) — si hay usuario logueado muestra su nombre + logout */}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:block text-sm font-semibold text-gray-700">
                  {user.name || user.email || "Hola"}
                </span>
                {user.role === "admin" ||
                user.roleId === 1 ||
                user.role_id === 1 ? (
                  <a
                    href={`${import.meta.env.VITE_DASHBOARD_URL ?? "http://localhost:5174"}/dashboard`}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 py-2 transition-all duration-300 font-bold tracking-wide text-[14px] shadow-sm hover:shadow-md"
                  >
                    Dashboard
                  </a>
                ) : null}
                <button
                  onClick={logout}
                  title="Cerrar sesión"
                  className="flex items-center justify-center w-9 h-9 bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-full transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleStartExperience}
                className="bg-[#ff7d1f] hover:bg-[#eb6a0c] text-white rounded-full px-6 py-2 transition-all duration-300 font-bold tracking-wide text-[16px] shadow-sm hover:shadow-md"
              >
                Comenzar
              </button>
            )}

            {/* Divider */}
            <div className="hidden sm:block w-[1px] h-6 bg-slate-300/60 mx-1"></div>

            {/* Language Toggle */}
            <div className="relative language-switcher hidden sm:block">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLangDropdownOpen(!langDropdownOpen);
                }}
                className="flex items-center gap-2 bg-slate-100/80 hover:bg-slate-200/80 text-gray-800 px-3 py-2 rounded-xl transition-colors font-bold text-[14px]"
                aria-label={t("accessibility.changeLanguage")}
              >
                <Globe className="w-4 h-4" />
                <span>{lang.toUpperCase()}</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${langDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {langDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-[calc(100%+0.5rem)] right-0 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden min-w-[140px] z-50 py-1"
                  >
                    {Object.entries(languages).map(([code, name]) => (
                      <button
                        key={code}
                        onClick={() => {
                          changeLanguage(code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors
                          ${code === lang ? "bg-slate-50 text-[#914ef5] font-bold" : "text-gray-700 hover:bg-slate-50 hover:text-[#914ef5]"}
                        `}
                      >
                        <span className="text-[11px] font-bold text-gray-400 uppercase">
                          {code}
                        </span>
                        <span className="font-medium">{name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="hidden sm:flex items-center justify-center w-9 h-9 bg-slate-100/80 hover:bg-slate-200/80 text-gray-800 rounded-xl transition-colors"
              aria-label={t("accessibility.toggleTheme")}
            >
              {theme === "dark" ? (
                <Moon className="w-[18px] h-[18px]" strokeWidth={2} />
              ) : (
                <Sun className="w-[18px] h-[18px]" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
