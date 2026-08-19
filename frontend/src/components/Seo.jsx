import { useLocation } from 'react-router-dom'

// React 19 tõstab <title>, <meta> ja <link> komponendipuust automaatselt <head>-i,
// seega eraldi helmet-teeki pole vaja. Vastutasuks ei tohi neid tage index.html-is
// dubleerida — kaks <title>-t tähendaks, et brauser ja Google kasutavad esimest.

export const SITE_URL = 'https://esthoop.ee'
export const SITE_NAME = 'EstHoop'

// Facebook näitab alla 600x315 pilti väikese ruudukesena teksti kõrval, mitte
// suure kaardina. Vana vaikepilt oli logo/logo.png 300x250, seega jäid kõik
// ilma oma pildita lehed väikese pisipildi peale. Kaart tuleb skriptist
// scripts/generate-brand-assets.py.
export const DEFAULT_IMAGE = `${SITE_URL}/og/default.jpg`
// Eraldi arvudena, mitte objektina: react-refresh lubab komponendifailist
// eksportida ainult lihtväärtusi, objekt lõhuks Fast Refreshi.
const DEFAULT_IMAGE_WIDTH = 1200
const DEFAULT_IMAGE_HEIGHT = 630

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

// Breadcrumb annab otsitulemuses paljast URL-ist parema teeriba, näiteks
// "esthoop.ee › Mängijad › Sander Raieste". Avalehte ei lisata eraldi lülina,
// sest Google kuvab selle domeeninimena niikuinii.
function breadcrumbJsonLd(trail, currentUrl) {
  if (!trail?.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Avaleht', item: `${SITE_URL}/` },
      ...trail.map((step, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: step.name,
        item: step.path ? SITE_URL + step.path : currentUrl,
      })),
    ],
  }
}

export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image = DEFAULT_IMAGE,
  // Mõõdud peavad pildiga kaasa käima: nendega paigutab Facebook kaardi ära
  // juba enne, kui ta pildi ise alla on laadinud. Vale number on halvem kui
  // puuduv, seega kes annab oma pildi, annab ka oma mõõdud.
  imageWidth = DEFAULT_IMAGE_WIDTH,
  imageHeight = DEFAULT_IMAGE_HEIGHT,
  imageAlt = `${SITE_NAME}, Eesti korvpalli fännileht`,
  ogType = 'website',
  noindex = false,
  jsonLd = null,
  breadcrumbs = null,
}) {
  const location = useLocation()
  const url = canonicalUrl(path ?? location.pathname)
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE

  const crumbs = breadcrumbJsonLd(breadcrumbs, url)
  const structured = [
    ...(Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []),
    ...(crumbs ? [crumbs] : []),
  ]

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {/* noindex-lehel canonical'it pole: Google seda niikuinii ei arvesta ja
          404.html puhul osutaks see väljamõeldud teele, mida ei eksisteeri */}
      {noindex
        ? <meta name="robots" content="noindex, follow" />
        : <link rel="canonical" href={url} />}

      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="et_EE" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      {/* Kõik jagamispildid saidil on JPEG: og/default.jpg, og/players/*.jpg
          ja hero.jpg. Kui mõni neist kunagi PNG-ks läheb, tuleb see siit üle
          antavaks muuta. */}
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content={imageWidth} />
      <meta property="og:image:height" content={imageHeight} />
      <meta property="og:image:alt" content={imageAlt} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={imageAlt} />

      {structured.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(structured) }}
        />
      )}
    </>
  )
}
