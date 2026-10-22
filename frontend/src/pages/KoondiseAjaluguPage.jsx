import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { useLoading } from '../contexts/LoadingContext'
import Seo, { SITE_URL } from '../components/Seo'
import Skeleton from '../components/Skeleton'
import { getPreloadedPlayers, getPreloadedRecords } from '../preload'
import {
  ATTENDANCE, CHAPTERS, EUROBASKETS, FEATURE_1993, FIRST_GAME, HERO_PHOTO,
  PHOTO_CREDITS, SOURCES, STATIC_RECORDS,
} from '../data/koondiseAjalugu'

const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"

// Sama "mängupäeva" palett nagu koondise lehel: tume hero, valge sisuala
const BLUE = '#0072ce'
const ICE = '#7fc4ff'
const TEXT = '#f0f4fa'
const MUTED = '#8a97ac'
const DARK = '#08060d'
const BODY = '#4b5563'
const GRAY = '#6b7280'
const LINE = '#e5e7eb'
const WIN = '#16a34a'
const LOSS = '#dc2626'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const EASE = [0.22, 1, 0.36, 1]
// Ekraanil liikumiseks (peatüki indikaator); sisenemised kasutavad EASE-i
const EASE_MOVE = [0.77, 0, 0.175, 1]

const NAV_ITEMS = [
  ...CHAPTERS.map(c => ({ id: c.id, nav: c.nav, years: c.years })),
  { id: 'rekordid', nav: 'Rekordid', years: 'Ametlikud mängud' },
]
const NAV_IDS = NAV_ITEMS.map(i => i.id)

// Medali värv on alati koos sõnaga, värv üksi tähendust ei kanna
const MEDAL_STYLE = {
  kuld: { background: '#fdf3d1', color: '#7a5a00' },
  hõbe: { background: '#eef0f3', color: '#4b5563' },
  pronks: { background: '#f8e6d8', color: '#8a4b1f' },
}

// API ja sport24 kirjutavad "Kullamäe", FIBA-st tulnud nimed võivad olla "Kullamae"
function nameKey(name) {
  return name.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/-/g, ' ')
    .toLowerCase().split(/\s+/).filter(Boolean).join(' ')
}

// ISO kuupäev tekstina, ilma Date'ita: ajavöönd ei saa päeva nihutada
function formatDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

function getJson(path) {
  return fetch(`${API}${path}`).then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
}

// Saidi navbar kahaneb kerimisel; peatükiriba peab jääma täpselt selle alla
function useNavbarHeight(fallback) {
  const [height, setHeight] = useState(fallback)
  useEffect(() => {
    const nav = document.querySelector('nav.sticky')
    if (!nav) return
    const ro = new ResizeObserver(() => setHeight(nav.getBoundingClientRect().height))
    ro.observe(nav)
    return () => ro.disconnect()
  }, [])
  return height
}

// Aktiivne on peatükk, mis katab ekraani keskosa
function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
    }, { rootMargin: '-45% 0px -50% 0px' })
    ids.forEach(id => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [ids])
  return active
}

// Sinimustvalge duotoon nagu klubikorvpalli plakatitel: heledus DARK -> BLUE
const DUOTONE_ID = 'ajalugu-duotoon'

function DuotoneFilter() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      <filter id={DUOTONE_ID} colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0" />
        <feComponentTransfer>
          <feFuncR type="table" tableValues="0.031 0" />
          <feFuncG type="table" tableValues="0.024 0.447" />
          <feFuncB type="table" tableValues="0.051 0.808" />
        </feComponentTransfer>
      </filter>
    </svg>
  )
}

// Tabloo number jookseb nullist, aga alles siis, kui laadimisekraan on eest läinud.
// Eelrenderdatud HTML ja vähendatud liikumine näitavad kohe lõppväärtust.
function TabloNumber({ value, start, delay, style }) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(value)
  const text = useTransform(mv, v => String(Math.round(v)))

  useEffect(() => {
    if (!start || reduce) return
    const controls = animate(mv, value, { from: 0, duration: 0.9, delay, ease: EASE })
    return () => controls.stop()
  }, [start, reduce, mv, value, delay])

  return (
    <motion.span style={{ display: 'inline-block', minWidth: `${String(value).length}ch`, fontVariantNumeric: 'tabular-nums', ...style }}>
      {text}
    </motion.span>
  )
}

// ── Hero: esimese maavõistluse tabloo ─────────────────────────────────────────
function Hero({ start }) {
  const [home, away] = FIRST_GAME.score
  const digits = { fontFamily: FONT_HEADING, fontSize: 'clamp(3.4rem, 9vw, 5.5rem)', lineHeight: 0.9 }
  const team = { fontFamily: FONT_HEADING, fontSize: '1.15rem', letterSpacing: '0.08em', color: MUTED }

  return (
    <header className="relative overflow-hidden" style={{ background: DARK, color: TEXT }}>
      {/* EM 1937, Leedu-Eesti: originaal on 706 px lai, seega töölaual ainult paremal pool */}
      <img
        src={HERO_PHOTO.src}
        alt=""
        aria-hidden="true"
        width={HERO_PHOTO.width}
        height={HERO_PHOTO.height}
        fetchPriority="high"
        className="absolute inset-y-0 right-0 h-full w-full object-cover md:w-[62%]"
        style={{ objectPosition: '50% 30%', filter: `url(#${DUOTONE_ID})`, opacity: 0.75 }}
      />
      <div aria-hidden="true" className="absolute inset-0 md:hidden"
        style={{ background: 'linear-gradient(180deg, rgba(8,6,13,0.35) 0%, rgba(8,6,13,0.88) 55%, #08060d 100%)' }} />
      <div aria-hidden="true" className="absolute inset-0 hidden md:block"
        style={{ background: 'linear-gradient(90deg, #08060d 0%, #08060d 36%, rgba(8,6,13,0.55) 62%, rgba(8,6,13,0.15) 100%)' }} />

      <div
        className="relative mx-auto flex max-w-[1120px] flex-col justify-end px-6 pt-48 pb-12 md:justify-center md:pt-20 md:pb-20"
        style={{ minHeight: 'min(82svh, 700px)' }}
      >
        <div style={{ maxWidth: 560 }}>
          <h1 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(3rem, 7vw, 5.25rem)', lineHeight: 0.92, letterSpacing: '1px', margin: 0, color: TEXT }}>
            Koondise ajalugu ja rekordid
          </h1>
          <p style={{ fontFamily: FONT_BODY, fontSize: '1.2rem', fontWeight: 500, lineHeight: 1.45, color: '#c9d3e1', margin: '14px 0 0', maxWidth: '38ch' }}>
            Esimesest maavõistlusest 1924. aastal tänaseni: ajastud, suured mängud ja ametlike mängude rekordid.
          </p>

          <figure style={{ margin: '32px 0 0' }}>
            <div
              role="img"
              aria-label={`${FIRST_GAME.home} ${home}, ${FIRST_GAME.away} ${away}`}
              className="grid grid-cols-[1fr_auto_1fr] items-end"
              style={{
                maxWidth: 420, padding: '14px 22px', borderRadius: 12,
                background: 'rgba(4,9,22,0.6)', border: '1px solid rgba(127,196,255,0.35)', backdropFilter: 'blur(8px)',
              }}
            >
              <div aria-hidden="true">
                <div style={team}>{FIRST_GAME.home}</div>
                <TabloNumber value={home} start={start} delay={0.15}
                  style={{ ...digits, color: ICE, textShadow: '0 0 28px rgba(0,114,206,0.85)' }} />
              </div>
              <span aria-hidden="true" style={{ ...digits, color: MUTED, padding: '0 12px' }}>:</span>
              <div aria-hidden="true" style={{ textAlign: 'right' }}>
                <div style={team}>{FIRST_GAME.away}</div>
                <TabloNumber value={away} start={start} delay={0.15} style={{ ...digits, color: TEXT }} />
              </div>
            </div>
            <figcaption style={{ fontFamily: FONT_BODY, fontSize: '0.95rem', fontWeight: 600, color: MUTED, marginTop: 10 }}>
              {FIRST_GAME.caption}
            </figcaption>
          </figure>
        </div>
      </div>
    </header>
  )
}

// ── Peatükiriba ───────────────────────────────────────────────────────────────
function ChapterNav({ active, top }) {
  const reduce = useReducedMotion()

  function jump(e, id) {
    const el = document.getElementById(id)
    if (!el) return
    e.preventDefault()
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    history.replaceState(null, '', `#${id}`)
  }

  return (
    <nav
      aria-label="Peatükid"
      className="sticky z-30 w-full"
      style={{ top, background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(8px)', borderBottom: `1px solid ${LINE}` }}
    >
      <ul role="list" className="mx-auto grid max-w-[1120px] grid-cols-4 px-2 md:flex md:gap-2 md:px-4">
        {NAV_ITEMS.map(item => {
          const current = active === item.id
          return (
            <li key={item.id} className="relative">
              <a
                href={`#${item.id}`}
                onClick={e => jump(e, item.id)}
                aria-current={current ? 'location' : undefined}
                className="flex min-h-[48px] flex-col items-center justify-center px-2 text-center transition-colors duration-150 md:items-start md:px-3 md:text-left
                           focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0072ce] focus-visible:-outline-offset-2 rounded"
                style={{ color: current ? BLUE : DARK }}
              >
                <span style={{ fontFamily: FONT_HEADING, fontSize: '1.2rem', letterSpacing: '0.5px', lineHeight: 1 }}>{item.nav}</span>
                <span className="hidden md:block" style={{ fontFamily: FONT_BODY, fontSize: '0.8rem', fontWeight: 600, color: GRAY, lineHeight: 1.2 }}>
                  {item.years}
                </span>
              </a>
              {current && (
                <motion.span
                  layoutId="ajalugu-peatukk"
                  aria-hidden="true"
                  className="absolute bottom-0 left-2 right-2 md:left-3 md:right-3"
                  style={{ height: 3, borderRadius: 2, background: BLUE }}
                  transition={reduce ? { duration: 0 } : { duration: 0.25, ease: EASE_MOVE }}
                />
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// ── Peatükkide ehitusplokid ───────────────────────────────────────────────────
function ChapterHeader({ years, title, lead }) {
  return (
    <header style={{ marginBottom: 36 }}>
      {/* Aastad kontuurina taustal, sama võte nagu kohanumbril plakatitel */}
      <span
        aria-hidden="true"
        className="block select-none"
        style={{
          fontFamily: FONT_HEADING, fontSize: 'clamp(4rem, 13vw, 9rem)', lineHeight: 0.8, letterSpacing: '2px',
          color: 'transparent', WebkitTextStroke: '2px rgba(0,114,206,0.28)', whiteSpace: 'nowrap',
        }}
      >
        {years}
      </span>
      {/* Pealkiri aastaarvu all, mitte peal: kontuur ja täidetud kiri kattudes lugesid kui viga */}
      <h2 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(2.3rem, 5vw, 3.5rem)', lineHeight: 1, letterSpacing: '1px', color: DARK, margin: '12px 0 0' }}>
        <span className="sr-only">{years}: </span>{title}
      </h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: '1.15rem', fontWeight: 500, lineHeight: 1.5, color: BODY, margin: '12px 0 0', maxWidth: '62ch' }}>
        {lead}
      </p>
    </header>
  )
}

function ResultBadge({ result }) {
  const win = result === 'V'
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{ width: 22, height: 22, borderRadius: 4, background: win ? WIN : LOSS, color: '#fff', fontFamily: FONT_BODY, fontWeight: 700, fontSize: '0.8rem' }}
    >
      <span aria-hidden="true">{win ? 'V' : 'K'}</span>
      <span className="sr-only">{win ? 'võit' : 'kaotus'}</span>
    </span>
  )
}

function Milestones({ items }) {
  return (
    <ol role="list" className="m-0 p-0">
      {items.map(m => (
        <li
          key={m.year}
          className="grid grid-cols-[3.4rem_minmax(0,1fr)] gap-x-4 gap-y-1 py-5 md:grid-cols-[3.6rem_9rem_minmax(0,1fr)] md:gap-x-5"
          style={{ borderTop: `1px solid ${LINE}` }}
        >
          <span style={{ fontFamily: FONT_HEADING, fontSize: '1.4rem', lineHeight: 1.7, color: GRAY }}>{m.year}</span>
          <div className="flex items-center gap-2">
            {m.score ? (
              <>
                <span style={{ fontFamily: FONT_HEADING, fontSize: '2.5rem', lineHeight: 1, color: DARK, fontVariantNumeric: 'tabular-nums' }}>
                  {m.score[0]}:{m.score[1]}
                </span>
                <ResultBadge result={m.result} />
              </>
            ) : (
              <span style={{ fontFamily: FONT_HEADING, fontSize: '1.9rem', lineHeight: 1, color: DARK }}>{m.title}</span>
            )}
          </div>
          <div className="col-start-2 md:col-start-3">
            {m.opponent && (
              <p style={{ fontFamily: FONT_BODY, fontSize: '1.05rem', fontWeight: 700, color: DARK, margin: 0 }}>
                vs {m.opponent}
              </p>
            )}
            <p style={{ fontFamily: FONT_BODY, fontSize: '1.02rem', fontWeight: 500, lineHeight: 1.5, color: BODY, margin: '2px 0 0', maxWidth: '58ch' }}>
              {m.text}
            </p>
            {m.photo && (
              <img
                src={m.photo.src}
                alt={m.photo.alt}
                width={m.photo.width}
                height={m.photo.height}
                loading="lazy"
                decoding="async"
                className="mt-3 h-auto w-full max-w-[280px] rounded-lg"
                style={{ filter: 'grayscale(1)' }}
              />
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

function Photo({ photo, className = '', imgClassName = '' }) {
  return (
    <figure className={className} style={{ margin: 0 }}>
      <img
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        loading="lazy"
        decoding="async"
        className={`block w-full rounded-2xl object-cover ${imgClassName}`}
        style={{ objectPosition: photo.position ?? '50% 50%', background: '#eef2f7' }}
      />
      <figcaption style={{ fontFamily: FONT_BODY, fontSize: '0.92rem', fontWeight: 600, lineHeight: 1.4, color: GRAY, marginTop: 8 }}>
        {photo.caption}
      </figcaption>
    </figure>
  )
}

// Arhiivifotod on väikesed (200 px ümber), seega portree on nime kõrval, mitte kaardi laiune.
// Pildita inimene saab sinise initsiaalidega ruudu.
function SmallPortrait({ name, src, width, height }) {
  const size = { width, height }
  if (!src) {
    return (
      <div aria-hidden="true" className="flex items-center justify-center rounded-lg" style={{ ...size, background: BLUE }}>
        <span style={{ fontFamily: FONT_HEADING, fontSize: width > 60 ? '1.6rem' : '1.3rem', color: '#fff', letterSpacing: '1px' }}>
          {name.split(' ').map(w => w[0]).join('')}
        </span>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={name}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className="rounded-lg object-cover object-top"
      style={{ ...size, filter: 'grayscale(1) contrast(1.05)', background: '#eef2f7' }}
    />
  )
}

function SubHeading({ id, children }) {
  return (
    <h3 id={id} style={{ fontFamily: FONT_HEADING, fontSize: '1.8rem', letterSpacing: '0.5px', lineHeight: 1, color: DARK, margin: '0 0 16px' }}>
      {children}
    </h3>
  )
}

function Section({ id, top, children, tint = false }) {
  return (
    <section
      id={id}
      className="px-6 py-16 md:py-24"
      style={{ scrollMarginTop: top + 56, background: tint ? '#f5f8fc' : 'white' }}
    >
      <div className="mx-auto max-w-[1120px]">{children}</div>
    </section>
  )
}

// ── 1924-1940 ─────────────────────────────────────────────────────────────────
function ChapterStart({ chapter, top }) {
  return (
    <Section id={chapter.id} top={top}>
      <ChapterHeader years={chapter.years} title={chapter.title} lead={chapter.lead} />
      <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:gap-12">
        <Milestones items={chapter.milestones} />
        <div className="md:sticky md:self-start" style={{ top: top + 80 }}>
          <Photo photo={chapter.photo} imgClassName="aspect-[4/3]" />
        </div>
      </div>

      <div className="mt-16">
        <SubHeading>Teerajajad</SubHeading>
        <ul role="list" className="m-0 grid grid-cols-1 gap-x-6 gap-y-8 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {chapter.legends.map(l => (
            <li key={l.name} className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-4" style={{ borderTop: `3px solid ${BLUE}`, paddingTop: 14 }}>
              <SmallPortrait name={l.name} src={l.photo?.src} width={72} height={90} />
              <div className="min-w-0">
                <p style={{ fontFamily: FONT_HEADING, fontSize: '1.7rem', lineHeight: 1, color: DARK, margin: 0 }}>{l.name}</p>
                <p style={{ fontFamily: FONT_BODY, fontSize: '0.95rem', fontWeight: 700, color: BLUE, margin: '4px 0 0' }}>{l.role}</p>
                <p style={{ fontFamily: FONT_BODY, fontSize: '1rem', fontWeight: 500, lineHeight: 1.45, color: BODY, margin: '6px 0 0' }}>{l.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}

// ── 1940-1991 ─────────────────────────────────────────────────────────────────
function ChapterSoviet({ chapter, top }) {
  return (
    <Section id={chapter.id} top={top} tint>
      <ChapterHeader years={chapter.years} title={chapter.title} lead={chapter.lead} />
      <Photo photo={chapter.photo} imgClassName="aspect-[4/3] md:aspect-[21/9]" />

      <div className="mt-14">
        <SubHeading>Medalid NSV Liidu koondisega</SubHeading>
        <ul role="list" className="m-0 grid grid-cols-1 gap-x-10 p-0 md:grid-cols-2">
          {chapter.medalists.map(p => (
            <li key={p.name} className="grid grid-cols-[56px_minmax(0,1fr)] gap-x-4 py-4" style={{ borderTop: `1px solid ${LINE}` }}>
              <SmallPortrait name={p.name} src={p.photo} width={56} height={70} />
              <div className="min-w-0">
                <p style={{ fontFamily: FONT_HEADING, fontSize: '1.55rem', lineHeight: 1, color: DARK, margin: 0 }}>{p.name}</p>
                <ul role="list" className="m-0 mt-2 flex flex-wrap gap-1.5 p-0">
                  {p.medals.map(([comp, medal, year]) => (
                    <li
                      key={`${comp}-${year}`}
                      style={{ ...MEDAL_STYLE[medal], fontFamily: FONT_BODY, fontSize: '0.88rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}
                    >
                      {comp} {medal} {year}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
        <p style={{ fontFamily: FONT_BODY, fontSize: '0.9rem', fontWeight: 500, color: GRAY, margin: '12px 0 0' }}>
          OM olümpiamängud, MM maailmameistrivõistlused, EM Euroopa meistrivõistlused.
        </p>
      </div>

      <div className="mt-14">
        <SubHeading>Klubid NSV Liidu meistrivõistlustel</SubHeading>
        <Milestones items={chapter.milestones} />
      </div>
    </Section>
  )
}

// ── 1992-täna ─────────────────────────────────────────────────────────────────
function EuroBasketStrip() {
  return (
    <div>
      <SubHeading id="em-turniirid">Kõik EM-i finaalturniirid</SubHeading>
      <ol
        role="list"
        aria-labelledby="em-turniirid"
        className="m-0 grid grid-cols-4 gap-px overflow-hidden rounded-2xl p-0 md:grid-cols-8"
        style={{ background: 'rgba(127,196,255,0.22)' }}
      >
        {EUROBASKETS.map(e => {
          const upcoming = e.place == null
          return (
            <li key={e.year} className="flex flex-col" style={{ background: upcoming ? BLUE : DARK, color: TEXT, padding: '14px 12px 16px' }}>
              <span style={{ fontFamily: FONT_HEADING, fontSize: '1.15rem', color: upcoming ? '#dbeafe' : MUTED, lineHeight: 1 }}>{e.year}</span>
              <span style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', lineHeight: 0.95, color: upcoming ? '#fff' : ICE, marginTop: 6 }}>
                {upcoming ? 'Kodus' : `${e.place}.`}
                {!upcoming && <span className="sr-only"> koht</span>}
              </span>
              <span style={{ fontFamily: FONT_BODY, fontSize: '0.95rem', fontWeight: 700, marginTop: 4, overflowWrap: 'anywhere' }}>{e.host}</span>
              {e.record && (
                <span style={{ fontFamily: FONT_BODY, fontSize: '0.85rem', fontWeight: 600, color: MUTED }}>
                  <span className="sr-only">võidud ja kaotused </span>{e.record}
                </span>
              )}
              <span className="mt-1 hidden md:block" style={{ fontFamily: FONT_BODY, fontSize: '0.82rem', fontWeight: 500, lineHeight: 1.3, color: upcoming ? '#dbeafe' : '#b8c3d3' }}>
                {e.note}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function ChapterModern({ chapter, top }) {
  const [est, opp] = FEATURE_1993.score
  return (
    <Section id={chapter.id} top={top}>
      <ChapterHeader years={chapter.years} title={chapter.title} lead={chapter.lead} />
      <EuroBasketStrip />

      {/* 1993: lehe suurim skoor, ülejäänud verstapostid on selle all tavalises reas */}
      <div className="mt-16 grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-end md:gap-10">
        <p
          role="img"
          aria-label={`Eesti ${est}, ${FEATURE_1993.opponent} ${opp}`}
          style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(5rem, 18vw, 11rem)', lineHeight: 0.8, color: BLUE, margin: 0, fontVariantNumeric: 'tabular-nums' }}
        >
          <span aria-hidden="true">{est}:{opp}</span>
        </p>
        <div>
          <p style={{ fontFamily: FONT_HEADING, fontSize: '2rem', lineHeight: 1, color: DARK, margin: 0 }}>
            vs {FEATURE_1993.opponent}
          </p>
          <p style={{ fontFamily: FONT_BODY, fontSize: '0.95rem', fontWeight: 700, color: GRAY, margin: '4px 0 0' }}>{FEATURE_1993.date}</p>
          <p style={{ fontFamily: FONT_BODY, fontSize: '1.05rem', fontWeight: 500, lineHeight: 1.5, color: BODY, margin: '8px 0 0', maxWidth: '52ch' }}>
            {FEATURE_1993.text}
          </p>
        </div>
      </div>

      <div className="mt-12">
        <Milestones items={chapter.milestones} />
      </div>

      <div className="mt-16">
        <SubHeading>Taasiseseisvusaja liidrid</SubHeading>
        <ul role="list" className="m-0 grid grid-cols-2 gap-x-4 gap-y-8 p-0 md:grid-cols-4 md:gap-x-6">
          {chapter.portraits.map(p => (
            <li key={p.name}>
              <div className="aspect-[4/5] overflow-hidden rounded-2xl" style={{ background: BLUE }}>
                <img
                  src={p.src}
                  alt={p.alt ?? `${p.name}, ${p.year}`}
                  width={p.width}
                  height={p.height}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover object-top"
                  style={{ filter: `url(#${DUOTONE_ID})` }}
                />
              </div>
              <p style={{ fontFamily: FONT_HEADING, fontSize: '1.5rem', lineHeight: 1, color: DARK, margin: '10px 0 0' }}>{p.name}</p>
              <p style={{ fontFamily: FONT_BODY, fontSize: '0.98rem', fontWeight: 500, lineHeight: 1.4, color: BODY, margin: '4px 0 0' }}>{p.text}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-16">
        <Photo photo={chapter.closingPhoto} imgClassName="aspect-[4/3] md:aspect-[21/9]" />
        <Link
          to="/koondis"
          className="mt-6 inline-flex min-h-[48px] items-center rounded-lg px-5 text-white transition-[background-color,transform] duration-150 hover:bg-[#005fae] active:scale-[0.98]
                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0072ce]"
          style={{ background: BLUE, fontFamily: FONT_BODY, fontSize: '1.05rem', fontWeight: 700 }}
        >
          Vaata MM 2027 valiksarja seisu
        </Link>
      </div>
    </Section>
  )
}

// ── Rekordid ──────────────────────────────────────────────────────────────────
function Leaderboard({ title, rows, slugByName }) {
  const reduce = useReducedMotion()
  const max = rows[0]?.value || 1

  return (
    <div>
      <SubHeading>{title}</SubHeading>
      <ol role="list" className="m-0 p-0">
        {rows.map((r, i) => {
          const slug = slugByName.get(nameKey(r.name))
          return (
            <li key={`${r.name}-${i}`} className="grid grid-cols-[2.2rem_minmax(0,1fr)_3.6rem] items-center gap-x-3 py-2">
              <span style={{ fontFamily: FONT_HEADING, fontSize: '1.35rem', color: GRAY, fontVariantNumeric: 'tabular-nums' }}>{r.rank}.</span>
              <div className="min-w-0">
                {slug ? (
                  <Link
                    to={`/mangijad/${slug}`}
                    className="underline decoration-[#0072ce]/30 decoration-2 underline-offset-4 transition-colors duration-150 hover:decoration-[#0072ce]
                               focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0072ce] rounded"
                    style={{ fontFamily: FONT_BODY, fontSize: '1.05rem', fontWeight: 700, color: BLUE }}
                  >
                    {r.name}
                  </Link>
                ) : (
                  <span style={{ fontFamily: FONT_BODY, fontSize: '1.05rem', fontWeight: 600, color: DARK }}>{r.name}</span>
                )}
                {r.detail && (
                  <span style={{ fontFamily: FONT_BODY, fontSize: '0.9rem', fontWeight: 500, color: GRAY, marginLeft: 8 }}>{r.detail}</span>
                )}
                {/* Riba kasvab ühe korra nähtavale tulles; number kõrval kannab väärtust ise */}
                <motion.div
                  aria-hidden="true"
                  style={{ height: 6, borderRadius: 3, marginTop: 5, width: `${(r.value / max) * 100}%`, background: slug ? BLUE : '#b9c6d6', transformOrigin: 'left center' }}
                  initial={reduce ? false : { transform: 'scaleX(0)' }}
                  whileInView={{ transform: 'scaleX(1)' }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, ease: EASE, delay: i * 0.04 }}
                />
              </div>
              <span style={{ fontFamily: FONT_HEADING, fontSize: '1.6rem', color: DARK, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.value}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function Tile({ label, value, who, detail, className = '' }) {
  return (
    <div className={`flex flex-col rounded-2xl ${className}`} style={{ border: `1px solid ${LINE}`, background: 'white', padding: 18 }}>
      <span style={{ fontFamily: FONT_BODY, fontSize: '0.92rem', fontWeight: 700, color: GRAY }}>{label}</span>
      <span style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(2.4rem, 5vw, 3.2rem)', lineHeight: 0.95, color: DARK, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      <span style={{ fontFamily: FONT_BODY, fontSize: '1rem', fontWeight: 700, color: DARK, marginTop: 4 }}>{who}</span>
      {detail && <span style={{ fontFamily: FONT_BODY, fontSize: '0.92rem', fontWeight: 500, lineHeight: 1.35, color: BODY, marginTop: 2 }}>{detail}</span>}
    </div>
  )
}

function gameScore(g) {
  return `${g.score[0]}:${g.score[1]}`
}

function RecordTiles({ records }) {
  const [top, ...rest] = records.single_game_points
  const win = records.biggest_wins[0]
  const loss = records.biggest_losses[0]
  const scored = records.most_points[0]
  const margin = g => g.score[0] - g.score[1]
  // Alates 1992 on sama vahega võite olnud mitu, need kõik kirja
  const modernWins = records.biggest_wins.filter(g => g.date >= '1992')
  const modernBest = modernWins.filter(g => modernWins.length && margin(g) === margin(modernWins[0]))

  return (
    <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4">
      {top && (
        <div className="col-span-2 flex flex-col rounded-2xl text-white md:row-span-2" style={{ background: BLUE, padding: 22 }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: '0.95rem', fontWeight: 700, color: '#dbeafe' }}>Enim punkte ühes mängus</span>
          <span style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(5rem, 12vw, 8rem)', lineHeight: 0.85, marginTop: 8 }}>{top.points}</span>
          <span style={{ fontFamily: FONT_HEADING, fontSize: '1.8rem', lineHeight: 1, marginTop: 6 }}>{top.name}</span>
          <span style={{ fontFamily: FONT_BODY, fontSize: '1rem', fontWeight: 600, color: '#dbeafe', marginTop: 4 }}>
            vs {top.opponent}, {formatDate(top.date)}
          </span>
          <ol role="list" className="m-0 mt-auto p-0 pt-6">
            {rest.slice(0, 4).map(s => (
              <li key={`${s.name}-${s.date}`} className="grid grid-cols-[2.4rem_minmax(0,1fr)] items-baseline gap-x-2 py-1" style={{ borderTop: '1px solid rgba(255,255,255,0.22)' }}>
                <span style={{ fontFamily: FONT_HEADING, fontSize: '1.5rem', fontVariantNumeric: 'tabular-nums' }}>{s.points}</span>
                <span style={{ fontFamily: FONT_BODY, fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.3 }}>
                  {s.name}, vs {s.opponent} {s.date.slice(0, 4)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {win && <Tile label="Suurim võit" value={gameScore(win)} who={`vs ${win.opponent}`} detail={formatDate(win.date)} />}
      {loss && <Tile label="Suurim kaotus" value={gameScore(loss)} who={`vs ${loss.opponent}`} detail={formatDate(loss.date)} />}
      {modernBest[0] && (
        <Tile
          label="Suurim võit alates 1992"
          value={gameScore(modernBest[0])}
          who={`vs ${modernBest[0].opponent}, ${modernBest[0].date.slice(0, 4)}`}
          detail={modernBest.length > 1
            ? `Sama vahega: ${modernBest.slice(1).map(g => `${g.opponent} ${gameScore(g)}, ${g.date.slice(0, 4)}`).join('; ')}`
            : null}
        />
      )}
      {scored && <Tile label="Enim visatud punkte" value={scored.score[0]} who={`vs ${scored.opponent}`} detail={`${gameScore(scored)}, ${formatDate(scored.date)}`} />}

      <div className="relative flex min-h-[200px] flex-col justify-end overflow-hidden rounded-2xl text-white" style={{ padding: 18, background: DARK }}>
        <img
          src={ATTENDANCE.photo.src}
          alt={ATTENDANCE.photo.alt}
          width={ATTENDANCE.photo.width}
          height={ATTENDANCE.photo.height}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: `url(#${DUOTONE_ID})` }}
        />
        <div aria-hidden="true" className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,6,13,0.92) 0%, rgba(8,6,13,0.35) 100%)' }} />
        <span className="relative" style={{ fontFamily: FONT_BODY, fontSize: '0.92rem', fontWeight: 700, color: '#dbeafe' }}>Publikurekord kodus</span>
        <span className="relative" style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(2.4rem, 5vw, 3.2rem)', lineHeight: 0.95, marginTop: 6 }}>{ATTENDANCE.value}</span>
        <span className="relative" style={{ fontFamily: FONT_BODY, fontSize: '0.92rem', fontWeight: 600, lineHeight: 1.35, marginTop: 4 }}>{ATTENDANCE.text}</span>
      </div>
      {STATIC_RECORDS.map(r => <Tile key={r.label} {...r} />)}
    </div>
  )
}

// Ühe mängu tulemused edetabeli kujul: jagatud kohad, vastane ja aasta nime kõrval
function singleGameRows(list) {
  let rank = 0
  return list.map((s, i) => {
    if (i === 0 || list[i - 1].points !== s.points) rank = i + 1
    return { rank, name: s.name, value: s.points, detail: `vs ${s.opponent}, ${s.date.slice(0, 4)}` }
  })
}

const RECORD_VIEWS = [
  ['ametlik', 'Ametlikud mängud'],
  ['koik', 'Kõik mängud'],
]

function Records({ records, failed, slugByName, top }) {
  const [view, setView] = useState('ametlik')
  // Vanem API vastus ilma "koik" osata: siis ainult ametlik vaade
  const hasAll = !!records?.koik?.games?.length
  const showAll = hasAll && view === 'koik'
  const boards = !records ? [] : showAll
    ? [
        { title: 'Enim mänge', rows: records.koik.games },
        { title: 'Enim punkte ühes mängus', rows: singleGameRows(records.koik.single_game_points) },
      ]
    : [
        { title: 'Enim mänge', rows: records.games },
        { title: 'Enim punkte', rows: records.points },
      ]
  const linked = boards.some(b => b.rows.some(r => slugByName.has(nameKey(r.name))))

  return (
    <Section id="rekordid" top={top} tint>
      <header style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(2.3rem, 5vw, 3.5rem)', lineHeight: 1, letterSpacing: '1px', color: DARK, margin: 0 }}>
          Rekordid
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: '1.15rem', fontWeight: 500, lineHeight: 1.5, color: BODY, margin: '10px 0 0', maxWidth: '62ch' }}>
          Edetabelid uuenevad pärast iga koondise mängu.
          {records && ` Seis ${formatDate(records.seisuga)}.`}
        </p>
      </header>

      {records ? (
        <>
          {hasAll && (
            <div role="tablist" aria-label="Rekordite vaade" className="mb-3 flex gap-6 border-b border-gray-200">
              {RECORD_VIEWS.map(([key, text]) => {
                const active = view === key
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setView(key)}
                    className="relative min-h-11 cursor-pointer pb-2 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0072ce] focus-visible:outline-offset-2 rounded-sm"
                    style={{ fontFamily: FONT_HEADING, fontSize: '1.4rem', letterSpacing: '0.5px', color: active ? BLUE : GRAY }}
                  >
                    {text}
                    {active && (
                      <motion.span
                        layoutId="rekordite-vaade"
                        aria-hidden="true"
                        className="absolute -bottom-px left-0 right-0"
                        style={{ height: 3, borderRadius: 2, background: BLUE }}
                        transition={{ duration: 0.25, ease: EASE_MOVE }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          )}
          <p style={{ fontFamily: FONT_BODY, fontSize: '0.98rem', fontWeight: 500, lineHeight: 1.5, color: GRAY, margin: '0 0 24px', maxWidth: '70ch' }}>
            {showAll
              ? 'Kõik mängud sport24.ee andmebaasi järgi: ka sõprusmängud ja Eesti NSV koondise mängud. Uued ametlikud mängud lisanduvad automaatselt, sõprusmängud on seisuga 30.08.2026. Karjääri punkte peetakse ainult ametlike mängude kohta.'
              : 'Ametlikud mängud ehk olümpia-, EM- ja MM-valikturniirid ning finaalturniirid.'}
          </p>
          <div className="grid gap-10 md:grid-cols-2 md:gap-14">
            {boards.map(b => (
              <Leaderboard key={`${view}-${b.title}`} title={b.title} rows={b.rows} slugByName={slugByName} />
            ))}
          </div>
          {linked && (
            <p style={{ fontFamily: FONT_BODY, fontSize: '0.92rem', fontWeight: 500, color: GRAY, margin: '14px 0 0' }}>
              Sinised nimed on praegused koondislased, nimi viib mängija profiilile.
            </p>
          )}
          <RecordTiles records={records} />
        </>
      ) : failed ? (
        <p role="alert" style={{ fontFamily: FONT_BODY, fontSize: '1.05rem', fontWeight: 600, color: LOSS }}>
          Rekordeid ei õnnestunud laadida. Uuenda lehte mõne hetke pärast.
        </p>
      ) : (
        <div className="grid gap-10 md:grid-cols-2 md:gap-14" aria-busy="true">
          <Skeleton className="h-[26rem]" />
          <Skeleton className="h-[26rem]" />
        </div>
      )}
    </Section>
  )
}

// ── Allikad ───────────────────────────────────────────────────────────────────
function Credits({ top }) {
  const link = 'underline decoration-[#0072ce]/30 underline-offset-2 hover:decoration-[#0072ce] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0072ce] rounded'
  const text = { fontFamily: FONT_BODY, fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.45, color: BODY }

  return (
    <Section id="allikad" top={top}>
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <SubHeading>Allikad</SubHeading>
          <ul role="list" className="m-0 space-y-1.5 p-0" style={text}>
            {SOURCES.map(s => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className={link} style={{ color: BLUE, fontWeight: 600 }}>{s.name}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SubHeading>Fotod</SubHeading>
          <ul role="list" className="m-0 space-y-1.5 p-0" style={text}>
            {PHOTO_CREDITS.map(c => (
              <li key={c.what}>
                {c.what}: {c.author},{' '}
                <a href={c.url} target="_blank" rel="noopener noreferrer" className={link} style={{ color: BLUE, fontWeight: 600 }}>{c.license}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}

// ── Leht ──────────────────────────────────────────────────────────────────────
export default function KoondiseAjaluguPage() {
  // Eelrenderdusel on rekordid ja mängijad HTML-i süstitud; klient laeb need effectis üle
  const [records, setRecords] = useState(() => getPreloadedRecords())
  const [players, setPlayers] = useState(() => getPreloadedPlayers() ?? [])
  const [failed, setFailed] = useState(false)
  const { isLoading, signalReady } = useLoading()
  const navTop = useNavbarHeight(52)
  const active = useActiveSection(NAV_IDS)

  useEffect(() => {
    // Leht on enamjaolt staatiline: laadimisekraan ei oota aeglast API-t (Render ärkab kuni ~50 s)
    signalReady()
    let cancelled = false
    Promise.allSettled([getJson('/national-team/records'), getJson('/players')]).then(([rec, pl]) => {
      if (cancelled) return
      if (rec.status === 'fulfilled' && Array.isArray(rec.value?.games) && Array.isArray(rec.value?.points)) {
        setRecords(rec.value)
      } else {
        setFailed(true)
      }
      if (pl.status === 'fulfilled' && Array.isArray(pl.value)) setPlayers(pl.value)
    })
    return () => { cancelled = true }
  }, [])

  const slugByName = useMemo(
    () => new Map(players.filter(p => p?.name && p?.slug).map(p => [nameKey(p.name), p.slug])),
    [players],
  )

  const [early, soviet, modern] = CHAPTERS

  return (
    <div style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)', background: 'white', textAlign: 'left' }}>
      <Seo
        title="Eesti korvpallikoondise ajalugu ja rekordid"
        path="/koondis/ajalugu"
        breadcrumbs={[{ name: 'Koondis', path: '/koondis' }, { name: 'Ajalugu ja rekordid' }]}
        description={
          'Eesti korvpallikoondise ajalugu aastast 1924: Berliini olümpiamängud, EM-id, eestlased ' +
          'NSV Liidu koondises ning ametlike mängude rekordid ja edetabelid.'
        }
        image={`${SITE_URL}/hero.jpg`}
        imageWidth={2400}
        imageHeight={1600}
        imageAlt="Eesti korvpallikoondis mängus"
      />
      <DuotoneFilter />

      <Hero start={!isLoading} />
      <ChapterNav active={active} top={navTop} />

      <ChapterStart chapter={early} top={navTop} />
      <ChapterSoviet chapter={soviet} top={navTop} />
      <ChapterModern chapter={modern} top={navTop} />
      {/* Ajutine viga ei peida eelrenderdatud rekordeid: failed loeb ainult siis, kui andmeid pole */}
      <Records records={records} failed={failed && !records} slugByName={slugByName} top={navTop} />
      <Credits top={navTop} />
    </div>
  )
}
