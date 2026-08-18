// Genereerib dist/sitemap.xml build'i järel (npm-i postbuild hook).
// Mängijate URL-id küsitakse API-st, sest need muutuvad koosseisu muutudes.
//
// Kui API ei vasta, EI kukuta see build'i läbi — sitemap kirjutatakse ainult
// staatiliste marsruutidega ja hoiatus läheb logisse.

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const SITE_URL = 'https://esthoop.ee'
const API = process.env.VITE_API_URL || 'https://esthoop-backend.onrender.com'
const OUT = resolve(process.cwd(), 'dist', 'sitemap.xml')

// Render tasuta plaan magab jõudeoleku järel — esimene päring võib võtta ~50 s
const FETCH_TIMEOUT_MS = 90_000

const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/koondis', changefreq: 'daily', priority: '0.9' },
  { path: '/mangijad', changefreq: 'weekly', priority: '0.9' },
  { path: '/statistika', changefreq: 'daily', priority: '0.8' },
  { path: '/klubikorvpall', changefreq: 'daily', priority: '0.7' },
  { path: '/piletid', changefreq: 'daily', priority: '0.7' },
  { path: '/privaatsus', changefreq: 'yearly', priority: '0.3' },
  { path: '/tingimused', changefreq: 'yearly', priority: '0.3' },
]

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function fetchPlayerSlugs() {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(`${API}/players`, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const players = await res.json()
    if (!Array.isArray(players)) throw new Error('ootamatu vastuse kuju (pole massiiv)')

    // Duplikaadid välja — sama slug kaks korda teeks sitemapi vigaseks
    const slugs = players
      .map(p => p?.slug)
      .filter(s => typeof s === 'string' && s.trim().length > 0)
    return [...new Set(slugs)]
  } finally {
    clearTimeout(timer)
  }
}

function buildXml(entries, lastmod) {
  const urls = entries
    .map(({ path, changefreq, priority }) => [
      '  <url>',
      `    <loc>${escapeXml(SITE_URL + path)}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      '  </url>',
    ].join('\n'))
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n')
}

async function main() {
  const entries = [...STATIC_ROUTES]

  try {
    const slugs = await fetchPlayerSlugs()
    for (const slug of slugs) {
      entries.push({ path: `/mangijad/${slug}`, changefreq: 'weekly', priority: '0.8' })
    }
    console.log(`[sitemap] ${slugs.length} mängija URL-i lisatud`)
  } catch (err) {
    console.warn(
      `[sitemap] HOIATUS: mängijate nimekirja ei saanud (${err.message}). ` +
      'Sitemap kirjutatakse ainult staatiliste marsruutidega.'
    )
  }

  const lastmod = new Date().toISOString().slice(0, 10)
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, buildXml(entries, lastmod), 'utf8')
  console.log(`[sitemap] ${entries.length} URL-i kirjutatud → ${OUT}`)
}

main().catch(err => {
  // Sitemapi puudumine ei tohi deploy'd blokeerida
  console.error(`[sitemap] Genereerimine ebaõnnestus: ${err.message}`)
})
