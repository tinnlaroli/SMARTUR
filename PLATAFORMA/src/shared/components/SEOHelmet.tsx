import { Helmet } from 'react-helmet-async';

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
const SITE_NAME = 'SMARTUR';

export const SEOHelmet = ({
  title,
  description = 'SMARTUR: plataforma de turismo inteligente con IA para descubrir qué hacer en Veracruz y las Altas Montañas. Recomendaciones personalizadas para tu viaje.',
  keywords = 'qué hacer en Veracruz, turismo Veracruz, Altas Montañas, turismo Córdoba, recomendación turística Veracruz, SMARTUR, verachas, inteligencia artificial turismo, rutas personalizadas Veracruz',
  ogTitle,
  ogDescription,
  canonicalUrl,
  noindex,
  jsonLd,
}: SEOHelmetProps) => {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : 'SMARTUR | Turismo con IA en las Altas Montañas, Veracruz';

  const ogTitleFinal = ogTitle ?? fullTitle;
  const ogDescriptionFinal = ogDescription ?? description;
  const canonical = canonicalUrl ?? SITE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large" />
      )}

      <link rel="canonical" href={canonical} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={ogTitleFinal} />
      <meta property="og:description" content={ogDescriptionFinal} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content="https://smartur.online/image-1.jpg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/jpeg" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitleFinal} />
      <meta name="twitter:description" content={ogDescriptionFinal} />
      <meta name="twitter:image" content="https://smartur.online/image-1.jpg" />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};
