// Eelrenderdus. Käib pärast kliendi ja serveri build'i.
//
// Iga marsruut renderdatakse HTML-stringiks ja kirjutatakse dist/<tee>/index.html.
// Vercel kontrollib staatilist failisüsteemi enne vercel.json rewrite'i, seega
// /koondis serveeritakse dist/koondis/index.html-ist ja SPA rewrite ei sekku.
//
// Andmed tulevad lehtedel useEffect'ist, mis siin ei käivitu. Eelrenderdatud HTML
// sisaldab seetõttu tiitleid, meta-tage, JSON-LD-d, pealkirju ja sisuteksti, aga
// mitte statistikatabeleid. Need laeb klient nagu varemgi.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { PRELOAD_KEY } from '../src/preload.js'

const DIST = resolve(process.cwd(), 'dist')
const SSR_ENTRY = resolve(process.cwd(), 'dist-ssr/entry-server.js')
const API = process.env.VITE_API_URL || 'https://esthoop-backend.onrender.com'

// Render tasuta plaan magab jõudeoleku järel, esimene päring võib võtta ~50 s
const FETCH_TIMEOUT_MS = 90_000

const STATIC_ROUTES = [
  '/', '/koondis', '/mangijad', '/statistika',
  '/klubikorvpall', '/piletid', '/privaatsus', '/tingimused',
]

// React 19 tõstab <title>, <meta> ja <link> <head>-i ainult siis, kui ta renderdab
// terve dokumendi. renderToString annab ainult juurkonteineri sisu, seega need tagid
// tulevad välja body sees ja tuleb siit käsitsi <head>-i tõsta. Ilma selleta ei näeks
// crawler, mis JS-i ei käivita, ühtegi meta-tagi.
const HEAD_TAGS = new RegExp(
  [
    '<title>[\\s\\S]*?<\\/title>',
    '<meta\\b[^>]*?\\/?>',
    '<link\\b[^>]*?\\/?>',
    '<script type="application\\/ld\\+json">[\\s\\S]*?<\\/script>',
  ].join('|'),
  'gi'
)

function splitHeadTags(html) {
  const head = []
  const body = html.replace(HEAD_TAGS, tag => {
    head.push(tag)
    return ''
  })
  return { head, body }
}

async function getJson(path) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(`${API}${path}`, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

async function fetchPlayers() {
  const players = await getJson('/players')
  if (!Array.isArray(players)) throw new Error('ootamatu vastuse kuju (pole massiiv)')
  return players.filter(p => typeof p?.slug === 'string' && p.slug.trim())
}

// Piiratud paralleelsus: Render tasuta plaan ei taha 44 samaaegset päringut,
// aga ükshaaval oleks build asjatult aeglane.
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++
        try {
          results[i] = await fn(items[i])
        } catch {
          results[i] = null
        }
      }
    })
  )
  return results
}

// Statistika on see, mille pärast inimene mängija lehele tuleb. Ilma selleta
// oleks HTML-is ainult nimi ja Google ei näeks ühtegi numbrit.
async function fetchPlayerStats(players) {
  const rows = await mapLimit(players, 6, async p => {
    const [stats, fiba] = await Promise.all([
      getJson(`/players/${p.slug}/stats`).catch(() => null),
      getJson(`/players/${p.slug}/fiba-stats`).catch(() => null),
    ])
    return { slug: p.slug, stats, fibaStats: fiba?.national_team ?? null }
  })
  const byslug = {}
  for (const row of rows) {
    if (row?.stats || row?.fibaStats) byslug[row.slug] = row
  }
  return byslug
}

// Iga leht saab ainult need andmed, mida ta ise vajab. Kogu statistika igale
// lehele paisutaks HTML-i mitmesaja kilobaidini ilma igasuguse kasuta.
function preloadFor(route, players, statsBySlug) {
  const match = route.match(/^\/mangijad\/([^/]+)$/)
  if (match) {
    return { players, playerStats: statsBySlug[match[1]] ?? null }
  }
  if (route === '/mangijad') return { players }
  return null
}

// Sama väärtus, mida render() Node'is kasutas, peab jõudma ka brauserisse enne
// rakenduse käivitumist, muidu renderdaks klient esimesel korral tühja lehe ja
// hydration läheks rikki. </script> lekke vastu on kaitse odav.
function preloadScript(data) {
  if (!data) return ''
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return `<script>globalThis.${PRELOAD_KEY}=${json}</script>`
}

function outputPath(route) {
  return route === '/'
    ? join(DIST, 'index.html')
    : join(DIST, route.replace(/^\/+|\/+$/g, ''), 'index.html')
}

async function main() {
  const template = readFileSync(join(DIST, 'index.html'), 'utf8')

  const rootTag = template.match(/<div id="root">\s*<\/div>/)
  if (!rootTag) {
    throw new Error('dist/index.html-ist ei leitud tühja <div id="root"></div> konteinerit')
  }
  if (!template.includes('</head>')) {
    throw new Error('dist/index.html-ist ei leitud </head> tagi')
  }

  const { render } = await import(pathToFileURL(SSR_ENTRY).href)

  const routes = [...STATIC_ROUTES]
  let players = null
  try {
    players = await fetchPlayers()
    routes.push(...players.map(p => `/mangijad/${p.slug}`))
    console.log(`[prerender] ${players.length} mängija lehte lisatud`)
  } catch (err) {
    console.warn(
      `[prerender] HOIATUS: mängijate nimekirja ei saanud (${err.message}). ` +
      'Mängijate lehed jäävad kliendipoolseks.'
    )
  }

  let statsBySlug = {}
  if (players?.length) {
    statsBySlug = await fetchPlayerStats(players)
    console.log(`[prerender] statistika saadud ${Object.keys(statsBySlug).length}/${players.length} mängijale`)
  }

  let ok = 0
  const failed = []

  for (const route of routes) {
    try {
      const data = preloadFor(route, players, statsBySlug)
      const preload = preloadScript(data)
      const { head, body } = splitHeadTags(render(route, data))
      const html = template
        .replace('</head>', `${head.map(t => `    ${t}`).join('\n')}\n${preload ? `    ${preload}\n` : ''}  </head>`)
        .replace(rootTag[0], `<div id="root">${body}</div>`)

      const file = outputPath(route)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, html, 'utf8')
      ok++
    } catch (err) {
      failed.push(`${route}: ${err.message}`)
    }
  }

  console.log(`[prerender] ${ok}/${routes.length} lehte kirjutatud`)

  if (failed.length) {
    // Ebaõnnestunud tee jääb SPA rewrite'i peale ehk töötab endiselt, aga ilma
    // eelrenderduseta. Katkestame siiski, et viga ei jääks vaikselt märkamata.
    console.error('[prerender] Ebaõnnestusid:')
    failed.forEach(f => console.error(`  ${f}`))
    process.exit(1)
  }
}

main().catch(err => {
  console.error(`[prerender] Katkes: ${err.message}`)
  process.exit(1)
})
