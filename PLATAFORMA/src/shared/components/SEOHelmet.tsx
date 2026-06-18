import { useEffect } from 'react';

interface SEOHelmetProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
}

const SITE_URL = 'https://app.smartur.online';
const SITE_NAME = 'WELLTUR';

function setMeta(name: string, content: string, property = false) {
  const attr = property ? 'property' : 'name';
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export const SEOHelmet = ({
  title,
  description = 'WELLTUR: plataforma de turismo inteligente con IA para descubrir qué hacer en Veracruz y las Altas Montañas. Recomendaciones personalizadas para tu viaje.',
  keywords = 'qué hacer en Veracruz, turismo Veracruz, Altas Montañas, turismo Córdoba, recomendación turística Veracruz, WELLTUR, verachas, inteligencia artificial turismo, rutas personalizadas Veracruz',
  ogTitle,
  ogDescription,
  canonicalUrl,
  noindex,
  jsonLd,
}: SEOHelmetProps) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : 'WELLTUR | Turismo con IA en las Altas Montañas, Veracruz';
  const ogTitleFinal = ogTitle ?? fullTitle;
  const ogDescriptionFinal = ogDescription ?? description;
  const canonical = canonicalUrl ?? SITE_URL;

  useEffect(() => {
    document.title = fullTitle;

    setMeta('description', description);
    setMeta('keywords', keywords);
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');

    setLink('canonical', canonical);

    setMeta('og:type', 'website', true);
    setMeta('og:site_name', SITE_NAME, true);
    setMeta('og:title', ogTitleFinal, true);
    setMeta('og:description', ogDescriptionFinal, true);
    setMeta('og:url', canonical, true);
    setMeta('og:image', 'https://smartur.online/image-1.jpg', true);
    setMeta('og:image:width', '1200', true);
    setMeta('og:image:height', '630', true);
    setMeta('og:image:type', 'image/jpeg', true);

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', ogTitleFinal);
    setMeta('twitter:description', ogDescriptionFinal);
    setMeta('twitter:image', 'https://smartur.online/image-1.jpg');

    if (jsonLd) {
      let script = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"][data-seo]');
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo', '');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    }
  }, [fullTitle, description, keywords, ogTitleFinal, ogDescriptionFinal, canonical, noindex, jsonLd]);

  return null;
};
