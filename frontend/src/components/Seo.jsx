import { useLocation } from 'react-router-dom'

// React 19 tõstab <title>, <meta> ja <link> komponendipuust automaatselt <head>-i,
// seega eraldi helmet-teeki pole vaja. Vastutasuks ei tohi neid tage index.html-is
// dubleerida — kaks <title>-t tähendaks, et brauser ja Google kasutavad esimest.

export const SITE_URL = 'https://esthoop.ee'
export const SITE_NAME = 'EstHoop'
export const DEFAULT_IMAGE = `${SITE_URL}/logo/logo.png`

const DEFAULT_TITLE = 'Eesti korvpallikoondis, mängijad ja statistika | EstHoop'
const DEFAULT_DESCRIPTION =
  'Eesti korvpallikoondise mängud, mängijate profiilid ja statistika ühes kohas. ' +
  'Vaata rahvuskoondise tulemusi, alagrupi seisu ja koondislaste pingeridu.'

function canonicalUrl(pathname) {
  if (!pathname || pathname === '/') return `${SITE_URL}/`
  return SITE_URL + pathname.replace(/\/+$/, '')
}

// JSON-LD tuleb meie oma API-st, aga </script> lekke vastu on kaitse odav
function serializeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image = DEFAULT_IMAGE,
  ogType = 'website',
  noindex = false,
  jsonLd = null,
}) {
  const location = useLocation()
  const url = canonicalUrl(path ?? location.pathname)
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, follow" />}

      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="et_EE" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      )}
    </>
  )
}
