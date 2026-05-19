import React, { createContext, useContext, useState, useEffect } from "react";

// Minimal reproduction of ui.ts (just mapping languages to translations)
export const languages = {
  es: "Español",
  en: "English",
  fr: "Français",
};

export const defaultLang = "es";

export const ui = {
  es: {
    "hero.title1": "IA que ",
    "hero.title2": "guía",
    "hero.title3": ",",
    "hero.title4": "turismo",
    "hero.title5": " que une.",
    "hero.subtitle1": "La plataforma para experiencias ",
    "hero.subtitle2": "reales.",
    "hero.cta": "¿A dónde vamos?",
    "hero.feature1.line1": "Apoyo a",
    "hero.feature1.line2": "MiPyMES",
    "hero.feature2.line1": "Alineados",
    "hero.feature2.line2": "con las ODS",
    "hero.feature3.line1": "Modelo",
    "hero.feature3.line2": "innovador",
    "hero.feature4.line1": "Impulsando",
    "hero.feature4.line2": "turismo local",
    "values.title1": "Nuestros ",
    "values.title2": "Valores",
    "values.subtitle":
      "En SMARTUR, creemos en un turismo que beneficia a todos, conectando tecnología y cultura para un desarrollo sostenible.",
    "values.mission.title": "MISIÓN",
    "values.mission.text":
      "Conectamos a turistas con experiencias auténticas y personalizadas de la región de Las Altas Montañas. Usamos inteligencia artificial para promover un turismo local y responsable, impulsando la economía y brindando información útil.",
    "values.vision.title": "VISIÓN",
    "values.vision.text":
      "Plataforma líder en recomendaciones turísticas de Las Altas Montañas, reconocido por nuestra innovación tecnológica, el impacto positivo en las economías locales y un turismo sostenible e inclusivo.",
    "values.commitment.title": "COMPROMISO",
    "values.commitment.text":
      "En SMARTUR, creemos en un turismo que beneficia a todos. Nuestro proyecto está directamente alineado con las Objetivas de Desarrollo Sostenible (ODS) de la ONU.",
    "values.history.title": "HISTORIA",
    "values.history.text":
      "En 2024, el manual de procedimientos de SMARTUR ganó el 'Galardón Turístico Mi Veracruz'. Inspirados por este premio, creamos SMARTUR para conectar la tecnología y la cultura, beneficiando a las comunidades locales. Nuestro objetivo es impulsar el turismo y el desarrollo sostenible en la región de Las Altas Montañas.",
    "values.guide.title": "Valores que nos Guían",
    "values.list.imparcialidad": "Imparcialidad",
    "values.list.seguridad": "Seguridad",
    "values.list.equidad": "Equidad",
    "values.list.honestidad": "Honestidad",
    "values.list.respeto": "Respeto",
    "values.list.responsabilidad": "Responsabilidad",
    "values.list.inclusion": "Inclusión",
    "values.list.empatia": "Empatía",
    "values.list.fidelidad": "Fidelidad",
    "values.list.etica": "Ética",
    "about.title": "Quiénes<br><span class='text-pink'>Somos</span>",
    "about.label": "Nuestra Historia",
    "about.subtitle":
      "Innovación <span class='text-purple'>tecnológica</span> al servicio del <span class='text-blue'>turismo</span> regional",
    "about.award":
      "Galardón <span class='text-green'>Turístico</span><br> Mi Veracruz",
    "about.awardBadge": "Galardonado",
    "about.awardYear": "2024",
    "about.slides.vision.label": "Visión",
    "about.slides.vision.text":
      "Consolidarnos como la plataforma digital líder en recomendaciones turísticas dentro de la región de Las Altas Montañas. Buscamos ser referentes en innovación tecnológica y sostenibilidad, generando un impacto social positivo a través de un modelo de turismo inclusivo, moderno y ético.",
    "about.slides.mission.label": "Misión",
    "about.slides.mission.text":
      "Conectamos a turistas con experiencias auténticas y personalizadas de la región de Las Altas Montañas. Usamos inteligencia artificial para promover un turismo local y responsable, impulsando la economía y brindando información útil.",
    "about.slides.values.label": "Valores",
    "about.slides.values.text":
      "En SMARTUR, creemos en un turismo que beneficia a todos, conectando tecnología y cultura para un desarrollo sostenible. Nuestros valores nos guían: Imparcialidad, Seguridad, Equidad, Honestidad, Respeto, Responsabilidad, Inclusión y Empatía.",
    "about.timeline.1.title": "Galardón Turístico Mi Veracruz 2024",
    "about.timeline.1.text":
      "SMARTUR nace del manual de procedimientos galardonado, reconocido por su innovación en la promoción del turismo regional.",
    "about.timeline.2.title": "Desarrollo de algoritmos de IA",
    "about.timeline.2.text":
      "Creación de un sistema de recomendaciones inteligente basado en Machine Learning, diseñado específicamente para el contexto turístico de Las Altas Montañas.",
    "about.timeline.3.title": "Implementación regional",
    "about.timeline.3.text":
      "Despliegue de la plataforma en colaboración con hoteles, restaurantes y comercios locales, generando impacto real en la economía turística.",
    "about.timeline.4.title": "Impulso Universitario UTCV",
    "about.timeline.4.text":
      "Iniciativa desarrollada en la Universidad Tecnológica del Centro de Veracruz, integrando talento estudiantil y tecnología para el desarrollo regional.",
    "steps.1.title": "Accede",
    "steps.1.subtitle": "a nuestra plataforma",
    "steps.1.desc":
      "Descarga la app y regístrate para empezar a explorar los tesoros escondidos de Las Altas Montañas.",
    "steps.2.title": "Responde",
    "steps.2.subtitle": "sencillas preguntas",
    "steps.2.desc":
      "Comparte tus gustos y te recomendaremos lo mejor de la comunidad.",
    "steps.3.title": "Vive",
    "steps.3.subtitle": "experiencias auténticas",
    "steps.3.desc":
      "Conéctate con la cultura local y vive aventuras inolvidables y personalizadas.",
    "nav.home": "Inicio",
    "nav.destination": "Destino",
    "nav.technology": "Beneficios",
    "nav.about": "Nosotros",
    "nav.howItWorks": "¿Cómo funciona?",
    "nav.validation": "Validación",
    "nav.pricing": "Precios",
    "nav.contact": "Contacto",
    "steps.stepLabel": "Paso",
    "button.login": "Soy Turista",
    "button.get-started": "Comenzar",
    "button.access": "Acceder",
    "accessibility.toggleMenu": "Alternar menú móvil",
    "accessibility.changeLanguage": "Cambiar idioma",
    "accessibility.toggleTheme": "Alternar tema oscuro/claro",
    "footer.slogan": "IA que guía, turismo que une",
    "footer.description":
      "SMARTUR conecta a los viajeros con la esencia de Las Altas Montañas a través de tecnología innovadora y experiencias auténticas, impulsando el desarrollo local y sostenible.",
    "footer.quicklinks": "Accesos Rápidos",
    "footer.contact": "Contacto",
    "footer.social": "Síguenos",
    "footer.copyright": "Todos los derechos reservados.",
    "footer.address": "Avenida Universidad 350, 94910 Cuitláhuac, Ver.",
    "footer.contactUs.label": "CONTÁCTANOS",
    "footer.contactUs.title":
      "Solicita una <br class='hidden sm:block' /> evaluación",
    "footer.contactUs.text":
      "Descubre cómo nuestra tecnología puede transformar tu destino o negocio. Déjanos tu correo y te contactaremos para una asesoría personalizada.",
    "footer.contactUs.button": "Formar parte",
  },
  en: {
    "hero.title1": "AI that ",
    "hero.title2": "guides",
    "hero.title3": ",",
    "hero.title4": "tourism",
    "hero.title5": " that unites.",
    "hero.subtitle1": "The platform for ",
    "hero.subtitle2": "real experiences.",
    "hero.cta": "Where are we going?",
    "hero.feature1.line1": "Support for",
    "hero.feature1.line2": "SMEs",
    "hero.feature2.line1": "Aligned",
    "hero.feature2.line2": "with SDGs",
    "hero.feature3.line1": "Innovative",
    "hero.feature3.line2": "model",
    "hero.feature4.line1": "Boosting",
    "hero.feature4.line2": "local tourism",
    "values.title1": "Our ",
    "values.title2": "Values",
    "values.subtitle":
      "At SMARTUR, we believe in tourism that benefits everyone, connecting technology and culture for sustainable development.",
    "values.mission.title": "MISSION",
    "values.mission.text":
      "We connect tourists with authentic and personalized experiences in the High Mountains region. We use artificial intelligence to promote local and responsible tourism, boosting the economy and providing useful information.",
    "values.vision.title": "VISION",
    "values.vision.text":
      "Leading platform in tourist recommendations for the High Mountains, recognized for our technological innovation, positive impact on local economies, and sustainable and inclusive tourism.",
    "values.commitment.title": "COMMITMENT",
    "values.commitment.text":
      "At SMARTUR, we believe in tourism that benefits everyone. Our project is directly aligned with the UN Sustainable Development Goals (SDGs).",
    "values.history.title": "HISTORY",
    "values.history.text":
      "In 2024, the SMARTUR procedures manual won the 'Mi Veracruz Tourism Award'. Inspired by this award, we created SMARTUR to connect technology and culture, benefiting local communities. Our goal is to boost tourism and sustainable development in the High Mountains region.",
    "values.guide.title": "Values that Guide Us",
    "values.list.imparcialidad": "Impartiality",
    "values.list.seguridad": "Security",
    "values.list.equidad": "Equity",
    "values.list.honestidad": "Honesty",
    "values.list.respeto": "Respect",
    "values.list.responsabilidad": "Responsibility",
    "values.list.inclusion": "Inclusion",
    "values.list.empatia": "Empathy",
    "values.list.fidelidad": "Fidelity",
    "values.list.etica": "Ethics",
    "about.title": "Who<br><span class='text-pink'>We Are</span>",
    "about.label": "Our History",
    "about.subtitle":
      "<span class='text-purple'>Technological</span> innovation serving regional <span class='text-blue'>tourism</span>",
    "about.award":
      "Mi Veracruz<br><span class='text-green'>Tourism</span> Award",
    "about.awardBadge": "Awarded",
    "about.awardYear": "2024",
    "about.slides.vision.label": "Vision",
    "about.slides.vision.text":
      "To establish ourselves as the leading digital platform in tourist recommendations within the High Mountains region. We seek to be benchmarks in technological innovation and sustainability, generating a positive social impact through an inclusive, modern, and ethical tourism model.",
    "about.slides.mission.label": "Mission",
    "about.slides.mission.text":
      "We connect tourists with authentic and personalized experiences in the High Mountains region. We use artificial intelligence to promote local and responsible tourism, boosting the economy and providing useful information.",
    "about.slides.values.label": "Values",
    "about.slides.values.text":
      "At SMARTUR, we believe in tourism that benefits everyone, connecting technology and culture for sustainable development. Our values guide us: Impartiality, Security, Equity, Honesty, Respect, Responsibility, Inclusion, and Empathy.",
    "about.timeline.1.title": "Mi Veracruz Tourism Award 2024",
    "about.timeline.1.text":
      "SMARTUR was born from the award-winning procedures manual, recognized for its innovation in promoting regional tourism.",
    "about.timeline.2.title": "Development of AI algorithms",
    "about.timeline.2.text":
      "Creation of an intelligent recommendation system based on Machine Learning, designed specifically for the tourism context of the High Mountains.",
    "about.timeline.3.title": "Regional implementation",
    "about.timeline.3.text":
      "Deployment of the platform in collaboration with local hotels, restaurants, and businesses, generating a real impact on the tourism economy.",
    "about.timeline.4.title": "UTCV University Boost",
    "about.timeline.4.text":
      "Initiative developed at the Technological University of the Center of Veracruz, integrating student talent and technology for regional development.",
    "steps.1.title": "Access",
    "steps.1.subtitle": "our platform",
    "steps.1.desc":
      "Download the app and sign up to start exploring the hidden treasures of the High Mountains.",
    "steps.2.title": "Answer",
    "steps.2.subtitle": "simple questions",
    "steps.2.desc":
      "Share your preferences and we'll recommend the best from the community.",
    "steps.3.title": "Live",
    "steps.3.subtitle": "authentic experiences",
    "steps.3.desc":
      "Connect with local culture and live unforgettable, personalized adventures.",
    "nav.home": "Home",
    "nav.destination": "Destination",
    "nav.technology": "Benefits",
    "nav.about": "About",
    "nav.howItWorks": "How it works",
    "nav.validation": "Validation",
    "nav.pricing": "Pricing",
    "nav.contact": "Contact",
    "steps.stepLabel": "Step",
    "button.login": "I'm a Tourist",
    "button.get-started": "Get Started",
    "button.access": "Access",
    "accessibility.toggleMenu": "Toggle mobile menu",
    "accessibility.changeLanguage": "Change language",
    "accessibility.toggleTheme": "Toggle dark/light theme",
    "footer.slogan": "AI that guides, tourism that unites",
    "footer.description":
      "SMARTUR connects travelers with the essence of the High Mountains through innovative technology and authentic experiences, driving local and sustainable development.",
    "footer.quicklinks": "Quick Links",
    "footer.contact": "Contact",
    "footer.social": "Follow Us",
    "footer.copyright": "All rights reserved.",
    "footer.address": "Avenida Universidad 350, 94910 Cuitláhuac, Ver.",
    "footer.contactUs.label": "CONTACT US",
    "footer.contactUs.title":
      "Request an <br class='hidden sm:block' /> evaluation",
    "footer.contactUs.text":
      "Discover how our technology can transform your destination or business. Leave us your email and we will contact you for personalized advice.",
    "footer.contactUs.button": "Join us",
  },
  fr: {
    "hero.title1": "L'IA qui ",
    "hero.title2": "guide",
    "hero.title3": ",",
    "hero.title4": "le tourisme",
    "hero.title5": " qui unit.",
    "hero.subtitle1": "La plateforme pour des expériences ",
    "hero.subtitle2": "réelles.",
    "hero.cta": "Où allons-nous ?",
    "hero.feature1.line1": "Soutien aux",
    "hero.feature1.line2": "PME",
    "hero.feature2.line1": "Aligné",
    "hero.feature2.line2": "sur les ODD",
    "hero.feature3.line1": "Modèle",
    "hero.feature3.line2": "innovant",
    "hero.feature4.line1": "Stimulant",
    "hero.feature4.line2": "le tourisme local",
    "values.title1": "Nos ",
    "values.title2": "Valeurs",
    "values.subtitle":
      "Chez SMARTUR, nous croyons en un tourisme qui profite à tous, reliant la technologie et la culture pour un développement durable.",
    "values.mission.title": "MISSION",
    "values.mission.text":
      "Nous connectons les touristes à des expériences authentiques et personnalisées dans la région des Hautes Montagnes. Nous utilisons l'intelligence artificielle pour promouvoir un tourisme local et responsable, stimulant l'économie et fournissant des informations utiles.",
    "values.vision.title": "VISION",
    "values.vision.text":
      "Plateforme leader de recommandations touristiques dans les Hautes Montagnes, reconnue pour notre innovation technologique, l'impact positif sur les économies locales et un tourisme durable et inclusif.",
    "values.commitment.title": "ENGAGEMENT",
    "values.commitment.text":
      "Chez SMARTUR, nous croyons en un tourisme qui profite à tous. Notre projet est directement aligné sur les Objectifs de Développement Durable (ODD) de l'ONU.",
    "values.history.title": "HISTOIRE",
    "values.history.text":
      "En 2024, le manuel de procédures de SMARTUR a remporté le 'Prix du Tourisme Mi Veracruz'. Inspirés par ce prix, nous avons créé SMARTUR pour relier la technologie et la culture, au profit des communautés locales. Notre objectif est de stimuler le tourisme et le développement durable dans la région des Hautes Montagnes.",
    "values.guide.title": "Valeurs qui nous Guident",
    "values.list.imparcialidad": "Impartialité",
    "values.list.seguridad": "Sécurité",
    "values.list.equidad": "Équité",
    "values.list.honestidad": "Honnêteté",
    "values.list.respeto": "Respect",
    "values.list.responsabilidad": "Responsabilité",
    "values.list.inclusion": "Inclusion",
    "values.list.empatia": "Empathie",
    "values.list.fidelidad": "Fidélité",
    "values.list.etica": "Éthique",
    "about.title": "Qui<br><span class='text-pink'>Nous Sommes</span>",
    "about.label": "Notre Histoire",
    "about.subtitle":
      "Innovation <span class='text-purple'>technologique</span> au service du <span class='text-blue'>tourisme</span> régional",
    "about.award":
      "Prix <span class='text-green'>du Tourisme</span><br> Mi Veracruz",
    "about.awardBadge": "Récompensé",
    "about.awardYear": "2024",
    "about.slides.vision.label": "Vision",
    "about.slides.vision.text":
      "Nous affirmer comme la plateforme numérique leader de recommandations touristiques dans la région des Hautes Montagnes. Nous cherchons à être des références en innovation technologique et durabilité, générant un impact social positif à travers un modèle de tourisme inclusif, moderne et éthique.",
    "about.slides.mission.label": "Mission",
    "about.slides.mission.text":
      "Nous connectons les touristes à des expériences authentiques et personnalisées dans la région des Hautes Montagnes. Nous utilisons l'intelligence artificielle pour promouvoir un tourisme local et responsable, stimulant l'économie et fournissant des informations utiles.",
    "about.slides.values.label": "Valeurs",
    "about.slides.values.text":
      "Chez SMARTUR, nous croyons en un tourisme qui profite à tous, reliant technologie et culture pour un développement durable. Nos valeurs nous guident : Impartialité, Sécurité, Équité, Honnêteté, Respect, Responsabilité, Inclusion et Empathie.",
    "about.timeline.1.title": "Prix du Tourisme Mi Veracruz 2024",
    "about.timeline.1.text":
      "SMARTUR est né du manuel de procédures primé, reconnu pour son innovation dans la promotion du tourisme régional.",
    "about.timeline.2.title": "Développement d'algorithmes d'IA",
    "about.timeline.2.text":
      "Création d'un système de recommandation intelligent basé sur le Machine Learning, conçu spécifiquement pour le contexte touristique des Hautes Montagnes.",
    "about.timeline.3.title": "Mise en œuvre régionale",
    "about.timeline.3.text":
      "Déploiement de la plateforme en collaboration avec des hôtels, restaurants et commerces locaux, générant un impact réel sur l'économie touristique.",
    "about.timeline.4.title": "Impulsion Universitaire UTCV",
    "about.timeline.4.text":
      "Initiative développée à l'Université Technologique du Centre de Veracruz, intégrant le talent étudiant et la technologie pour le développement régional.",
    "steps.1.title": "Accédez",
    "steps.1.subtitle": "à notre plateforme",
    "steps.1.desc":
      "Téléchargez l'application et inscrivez-vous pour commencer à explorer les trésors cachés des Hautes Montagnes.",
    "steps.2.title": "Répondez",
    "steps.2.subtitle": "à des questions simples",
    "steps.2.desc":
      "Partagez vos goûts et nous vous recommanderons le meilleur de la communauté.",
    "steps.3.title": "Vivez",
    "steps.3.subtitle": "des expériences authentiques",
    "steps.3.desc":
      "Connectez-vous à la culture locale et vivez des aventures inoubliables et personnalisées.",
    "nav.home": "Accueil",
    "nav.destination": "Destination",
    "nav.technology": "Bénéfices",
    "nav.about": "À propos",
    "nav.howItWorks": "Comment ça marche",
    "nav.validation": "Validation",
    "nav.pricing": "Tarifs",
    "nav.contact": "Contact",
    "steps.stepLabel": "Étape",
    "button.login": "Je suis Touriste",
    "button.get-started": "Commencer",
    "button.access": "Accès",
    "accessibility.toggleMenu": "Basculer le menu mobile",
    "accessibility.changeLanguage": "Changer de langue",
    "accessibility.toggleTheme": "Basculer le thème sombre/clair",
    "footer.slogan": "L'IA qui guide, le tourisme qui unit",
    "footer.description":
      "SMARTUR relie les voyageurs à l'essence des Hautes Montagnes grâce à une technologie innovante et des expériences authentiques, stimulant le développement local et durable.",
    "footer.quicklinks": "Liens Rapides",
    "footer.contact": "Contact",
    "footer.social": "Suivez-nous",
    "footer.copyright": "Tous droits réservés.",
    "footer.address": "Avenida Universidad 350, 94910 Cuitláhuac, Ver.",
    "footer.contactUs.label": "CONTACTEZ-NOUS",
    "footer.contactUs.title":
      "Demander une <br class='hidden sm:block' /> évaluation",
    "footer.contactUs.text":
      "Découvrez comment notre technologie peut transformer votre destination ou entreprise. Laissez-nous votre e-mail et nous vous contacterons pour des conseils personnalisés.",
    "footer.contactUs.button": "Rejoignez-nous",
  },
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(defaultLang);
  const [isReady, setIsReady] = useState(false); // To avoid hydration mismatches if possible

  useEffect(() => {
    const storedLang = localStorage.getItem("smartur-lang");
    if (storedLang && storedLang in languages) {
      setLang(storedLang);
    }
    setIsReady(true);
  }, []);

  const changeLanguage = (newLang) => {
    if (newLang in languages) {
      setLang(newLang);
      localStorage.setItem("smartur-lang", newLang);
      document.documentElement.lang = newLang;
    }
  };

  const t = (key) => ui[lang]?.[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t, isReady }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
