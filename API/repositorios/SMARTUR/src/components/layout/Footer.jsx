import React, { useEffect, useRef } from "react";
import { FaInstagram } from "react-icons/fa";
import { useLanguage } from "../../contexts/LanguageContext";
import smarturLogo from "../../assets/smartur_logo.png";
import logoCostado from "../../assets/logo_costado.png";

export default function Footer({ navLinks = [] }) {
  const footerRef = useRef(null);
  const { t } = useLanguage();

  useEffect(() => {
    // Replicate Astro's sy-footer logic if needed
    const handleResize = () => {
      if (!footerRef.current) return;
      const bcr = footerRef.current.getBoundingClientRect();
      if (bcr.height + 100 > window.innerHeight) {
        footerRef.current.style.height = "";
      } else {
        // Unpin or adjust if very short, but usually we just let it flow natively
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="w-full relative overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* ---------------------- CONTACT SECTION ---------------------- */}
      <section className="relative px-6 md:px-12 lg:px-24 py-16 md:py-24 bg-white dark:bg-slate-950 z-10 transition-colors duration-300">
        <div className="max-w-[85rem] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-start">
          <div className="max-w-xl">
            <span className="block text-sm font-bold tracking-[0.15em] uppercase text-purple-600 dark:text-purple-400 mb-6">
              {t("footer.contactUs.label")}
            </span>
            <h2
              className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 dark:text-white leading-[1.05]"
              dangerouslySetInnerHTML={{ __html: t("footer.contactUs.title") }}
            />
          </div>

          <div className="flex flex-col gap-8 max-w-lg mt-2 md:mt-4">
            <p className="text-lg md:text-xl text-gray-600 dark:text-slate-300 leading-relaxed">
              {t("footer.contactUs.text")}
            </p>
            <div className="flex w-full">
              <button
                type="button"
                className="px-8 py-4 bg-purple-500 text-white rounded-full font-bold text-lg hover:bg-purple-600 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 w-full"
                onClick={() => window.open("http://localhost:4321/", "_blank")}
              >
                <span>{t("footer.contactUs.button")}</span>
                <svg
                  className="w-5 h-5 mb-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------- MAIN FOOTER (Replicated from Astro) ---------------------- */}
      <footer
        ref={footerRef}
        className="relative w-full border-t border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl pt-16 pb-8 md:pt-20 md:pb-10 transition-colors duration-300"
      >
        <div className="max-w-[85rem] mx-auto px-6 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-12 lg:gap-16 mb-12">
            {/* BRANDING */}
            <div className="flex flex-col gap-6">
              <a href="#" className="w-48 md:w-56 block">
                <img
                  src={logoCostado}
                  alt="Logotipo horizontal de SMARTUR"
                  className="w-full h-auto object-contain dark:contrast-150"
                  loading="lazy"
                />
              </a>
              <p className="text-lg font-semibold italic text-purple-600 dark:text-purple-400 m-0">
                {t("footer.slogan")}
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-[32em] m-0">
                {t("footer.description")}
              </p>
            </div>

            {/* COLUMNS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-8">
              {/* ACCESOS RÁPIDOS */}
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-6">
                  {t("footer.quicklinks")}
                </h3>
                <ul className="flex flex-col gap-4">
                  {navLinks && navLinks.length > 0 ? (
                    navLinks.map((link, idx) => (
                      <li key={idx}>
                        <a
                          href={link.url || `#${link.id}`}
                          className="text-sm text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        >
                          {link.title}
                        </a>
                      </li>
                    ))
                  ) : (
                    <>
                      <li>
                        <a
                          href="#hero"
                          className="text-sm text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        >
                          {t("nav.home")}
                        </a>
                      </li>
                      <li>
                        <a
                          href="#about"
                          className="text-sm text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        >
                          {t("nav.about")}
                        </a>
                      </li>
                      <li>
                        <a
                          href="#steps"
                          className="text-sm text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        >
                          {t("nav.technology")}
                        </a>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* CONTACTO */}
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-6">
                  {t("footer.contact")}
                </h3>
                <ul className="flex flex-col gap-5">
                  <li className="flex items-start gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-purple-500 mt-0.5 flex-shrink-0"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <a
                      href="mailto:smarturutcv@gmail.com"
                      className="text-sm text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      smarturutcv@gmail.com
                    </a>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-purple-500 mt-0.5 flex-shrink-0"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <a
                      href="tel:+522711730136"
                      className="text-sm text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      271 173 0136
                    </a>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-purple-500 mt-0.5 flex-shrink-0"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span className="text-sm text-gray-500 dark:text-slate-400">
                      {t("footer.address")}
                    </span>
                  </li>
                </ul>
              </div>

              {/* SOCIAL */}
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-6">
                  {t("footer.social")}
                </h3>
                <ul className="flex flex-col gap-3">
                  <li>
                    <a
                      href="https://www.instagram.com/smar_tur?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:-translate-y-1 hover:shadow-md hover:border-pink-200 dark:hover:border-purple-500 hover:bg-pink-50 dark:hover:bg-slate-800 transition-all duration-300"
                    >
                      <FaInstagram className="text-xl text-gray-400 dark:text-slate-400 group-hover:text-pink-500 dark:group-hover:text-purple-400 transition-colors" />
                      <span className="font-semibold text-sm text-gray-700 dark:text-slate-300 group-hover:text-pink-600 dark:group-hover:text-white transition-colors">
                        Instagram
                      </span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-100 dark:border-slate-800">
            <p className="text-center md:text-left text-xs text-gray-500 dark:text-slate-400 mb-4 md:mb-0">
              © {new Date().getFullYear()} SMARTUR. {t("footer.copyright")}
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400 tracking-wider">
              <span className="opacity-75 relative top-px">
                Desarrollado en la
              </span>
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-purple-600 dark:text-purple-400 font-bold tracking-widest border border-slate-200 dark:border-slate-700 shadow-sm">
                UTCV
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
