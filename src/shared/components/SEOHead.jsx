import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://footyarena.com';

function SEOHead({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogImage = '/social-preview.png',
  twitterTitle,
  twitterDescription,
  twitterImage = '/social-preview.png',
}) {
  const resolvedOgTitle = ogTitle || title;
  const resolvedOgDescription = ogDescription || description;
  const resolvedTwitterTitle = twitterTitle || title;
  const resolvedTwitterDescription = twitterDescription || description;
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : null;

  return (
    <Helmet>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      {resolvedOgTitle && <meta property="og:title" content={resolvedOgTitle} />}
      {resolvedOgDescription && <meta property="og:description" content={resolvedOgDescription} />}
      {ogImage && <meta property="og:image" content={`${BASE_URL}${ogImage}`} />}
      <meta property="og:type" content="website" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name" content="FootyArena" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      {resolvedTwitterTitle && <meta name="twitter:title" content={resolvedTwitterTitle} />}
      {resolvedTwitterDescription && <meta name="twitter:description" content={resolvedTwitterDescription} />}
      {twitterImage && <meta name="twitter:image" content={`${BASE_URL}${twitterImage}`} />}
    </Helmet>
  );
}

export default SEOHead;
