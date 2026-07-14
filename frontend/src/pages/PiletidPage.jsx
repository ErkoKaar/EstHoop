import { useEffect, useMemo, useState } from 'react'
import { useLoading } from '../contexts/LoadingContext'
import { motion } from 'framer-motion'
import TeamFlag from '../components/TeamFlag'

const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"

// "Mängupäeva" palett — sama mis koondise lehel
const BLUE = '#0072ce'
const ICE = '#7fc4ff'
const TEXT = '#f0f4fa'
const MUTED = '#8a97ac'
const DARK = '#08060d'
const GRAY = '#9ca3af'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const TICKETS_URL = 'https://www.piletitasku.ee/et/search?category=193'

function formatDateLong(ts) {
  return new Date(ts * 1000).toLocaleDateString('et-EE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}
function formatDateShort(ts) {
  return new Date(ts * 1000).toLocaleDateString('et-EE', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}
function formatTime(ts) {
  return new Date(ts * 1000).toLocaleTimeString('et-EE', {
    hour: '2-digit', minute: '2-digit',
  })
}
function isHome(ev) {
  return ev.homeTeam?.name === 'Estonia'
}
function shortTournament(name) {
  if (!name) return ''
  if (name.includes('World Cup') && name.includes('Qualifiers')) return 'FIBA MM Kval.'
  if (name.includes('EuroBasket') && name.includes('Qualifiers')) return 'EuroBasket Kval.'
  if (name.includes('EuroBasket')) return 'EuroBasket'
  if (name.includes('Friendly')) return 'Sõprusmäng'
  if (name.includes('Olympic')) return 'Olümpia Kval.'
  return name.length > 35 ? name.slice(0, 33) + '…' : name
}
function getOpponent(ev) {
  return isHome(ev) ? ev.awayTeam?.name : ev.homeTeam?.name
}

function useIsMobile(bp = 900) {
  const [mobile, setMobile] = useState(() => window.matchMedia(`(max-width: ${bp - 1}px)`).matches)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`)
    const onChange = e => setMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [bp])
  return mobile
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
})

// ── Skeletonid ────────────────────────────────────────────────────────────────
function HeroSkeleton() {
  return (
    <div className="animate-pulse" style={{ background: '#0a1122', minHeight: 320 }} />
  )
}
function RowSkeleton() {
  return (
    <div className="animate-pulse bg-gray-200 rounded-2xl h-20" />
  )
}

// ── Esimese kodumängu hero — "Mängupäeva" vastasseis ──────────────────────────
function HeroGame({ ev, reducedMotion, isMobile }) {
  const opponent = getOpponent(ev)
  const tournament = shortTournament(ev.tournament?.name)
  const venue = ev.venue?.name || ev.venue?.city?.name
  const daysTo = Math.max(0, Math.ceil((ev.startTimestamp * 1000 - Date.now()) / 86400000))

  // pikk vastasenimi peab mahtuma — skaleeri fonti nime pikkuse järgi
  const longName = (opponent?.length ?? 0) > 12
  const nameStyle = {
    fontFamily: FONT_HEADING, lineHeight: 0.95, letterSpacing: 2,
    fontSize: longName ? 'clamp(1.9rem, 5vw, 3.2rem)' : 'clamp(2.4rem, 7vw, 5rem)',
    textTransform: 'uppercase', whiteSpace: 'nowrap',
  }
  const heroFlagStyle = {
    display: 'block', margin: '0 auto 12px',
    border: '1px solid rgba(255,255,255,0.25)',
    boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
  }

  return (
    <div style={{
      width: '100vw', marginLeft: 'calc(50% - 50vw)',
      background: [
        'linear-gradient(178deg, rgba(4,9,22,0.92) 0%, rgba(5,16,40,0.55) 50%, rgba(6,11,26,0.94) 100%)',
        "url('/pilet_hero.jpg') center 30% / cover no-repeat",
      ].join(', '),
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', minHeight: 'min(60vh, 560px)',
      marginBottom: 40,
    }}>
      {/* Valgusvihk väljaku kohal */}
      <div style={{
        position: 'absolute', top: '-55%', left: '50%', transform: 'translateX(-50%)',
        width: '75%', height: '170%', opacity: 0.16, zIndex: 0,
        background: `radial-gradient(ellipse, ${BLUE}, transparent 68%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: 1120, width: '100%', boxSizing: 'border-box', margin: '0 auto',
        padding: '56px 24px 48px', textAlign: 'center', position: 'relative', zIndex: 1,
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        {/* Eyebrow */}
        <motion.div {...(reducedMotion ? {} : fadeUp(0))} style={{
          fontFamily: FONT_BODY, fontSize: '0.7rem', fontWeight: 700,
          letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 32,
        }}>
          <span style={{ color: ICE }}>Kodumäng</span>
          {tournament && <span style={{ color: MUTED }}> · {tournament}</span>}
        </motion.div>

        {/* Vastasseis */}
        <div style={{
          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center', justifyContent: 'center',
          gap: isMobile ? 10 : 'clamp(28px, 5vw, 72px)',
          marginBottom: 32,
        }}>
          <motion.div
            {...(reducedMotion ? {} : {
              initial: { opacity: 0, x: -48 },
              animate: { opacity: 1, x: 0 },
              transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.12 },
            })}
          >
            <TeamFlag name="Estonia" style={heroFlagStyle} />
            <div style={{ ...nameStyle, color: TEXT, textShadow: '0 0 42px rgba(0,114,206,0.55)' }}>
              Eesti
            </div>
          </motion.div>

          <motion.div {...(reducedMotion ? {} : fadeUp(0.3))} style={{
            flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <div style={{ width: 1, height: 26, background: 'linear-gradient(180deg, transparent, rgba(127,196,255,0.55))' }} />
            <span style={{
              fontFamily: FONT_HEADING, fontSize: 'clamp(1.4rem, 2.8vw, 2.2rem)',
              color: 'rgba(240,244,250,0.6)', letterSpacing: 2, lineHeight: 1,
              textShadow: '0 0 20px rgba(0,114,206,0.55)',
            }}>
              VS
            </span>
            <div style={{ width: 1, height: 26, background: 'linear-gradient(0deg, transparent, rgba(127,196,255,0.55))' }} />
          </motion.div>

          <motion.div
            {...(reducedMotion ? {} : {
              initial: { opacity: 0, x: 48 },
              animate: { opacity: 1, x: 0 },
              transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.12 },
            })}
          >
            <TeamFlag name={opponent} style={heroFlagStyle} />
            <div style={{
              ...nameStyle,
              color: 'rgba(240,244,250,0.08)',
              WebkitTextStroke: '1.5px rgba(240,244,250,0.55)',
            }}>
              {opponent}
            </div>
          </motion.div>
        </div>

        {/* Mängu info */}
        {ev.startTimestamp && (
          <motion.div {...(reducedMotion ? {} : fadeUp(0.5))} style={{
            fontFamily: FONT_BODY, color: TEXT, fontWeight: 600,
            fontSize: '0.95rem', letterSpacing: '0.08em', textTransform: 'uppercase',
            marginBottom: 32,
          }}>
            {formatDateLong(ev.startTimestamp)}
            <span style={{ color: MUTED }}> · {ev.timeTBD ? 'aeg selgub' : formatTime(ev.startTimestamp)}</span>
            {venue && <span style={{ color: MUTED }}> · {venue}</span>}
          </motion.div>
        )}

        {/* CTA — selle lehe fookuspunkt */}
        <motion.div {...(reducedMotion ? {} : fadeUp(0.6))}>
          <a
            href={TICKETS_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 40px', borderRadius: 12,
              fontFamily: FONT_BODY, fontWeight: 700, fontSize: '1.15rem',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              background: BLUE, color: '#fff', textDecoration: 'none',
              boxShadow: '0 0 32px rgba(0,114,206,0.55)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 44px rgba(0,114,206,0.75)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 32px rgba(0,114,206,0.55)' }}
          >
            Osta pilet
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15,3 21,3 21,9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
          <div style={{
            fontFamily: FONT_BODY, color: MUTED, fontWeight: 600,
            fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 14,
          }}>
            {daysTo === 0 ? 'Mäng täna!' : `${daysTo} päeva pärast`}
          </div>
        </motion.div>
      </div>

      {/* Eesti lipu triibud — üleminek valgele sisualale */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ height: 7, background: BLUE }} />
        <div style={{ height: 7, background: '#0a0a1a' }} />
        <div style={{ height: 7, background: 'rgba(255,255,255,0.93)' }} />
      </div>
    </div>
  )
}

// ── Mängu rida — koondise lehe kaardikeel ─────────────────────────────────────
function MatchRow({ ev }) {
  const home = isHome(ev)
  const opponent = getOpponent(ev)
  const tournament = shortTournament(ev.tournament?.name)
  const ts = ev.startTimestamp

  return (
    <div
      className="flex items-center justify-between gap-4 px-5 py-4 transition-shadow duration-200 hover:shadow-md"
      style={{
        background: 'white', borderRadius: 14,
        border: '1px solid #e5e7eb', borderLeft: `4px solid ${home ? BLUE : '#e5e7eb'}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div className="min-w-0 text-left">
        <div style={{ fontFamily: FONT_HEADING, fontSize: '1.3rem', color: DARK, letterSpacing: 0.5 }}>
          vs <TeamFlag name={opponent} size={22} style={{ verticalAlign: -2, margin: '0 3px', border: '1px solid rgba(8,6,13,0.12)' }} />
          {opponent}
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: '0.7rem', color: GRAY, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {ts && <>{formatDateShort(ts)} · {ev.timeTBD ? 'aeg selgub' : formatTime(ts)}</>}
          {tournament && <> · {tournament}</>}
          {' · '}{home ? 'Kodus' : 'Võõrsil'}
        </div>
      </div>

      <div className="shrink-0">
        {home ? (
          <a
            href={TICKETS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-white cursor-pointer transition-all duration-200 hover:opacity-90 hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0072ce]"
            style={{ fontFamily: FONT_BODY, background: BLUE, fontSize: '0.9rem' }}
          >
            Piletid
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15,3 21,3 21,9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        ) : (
          <span
            className="text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-xl"
            style={{ fontFamily: FONT_BODY, background: '#f3f4f6', color: GRAY }}
          >
            Välismäng
          </span>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PiletidPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { signalReady } = useLoading()
  const isMobile = useIsMobile()
  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []
  )

  useEffect(() => {
    fetch(`${API}/national-team/games`)
      .then(r => r.json())
      .then(data => {
        setEvents(data.upcoming || [])
        setLoading(false)
        signalReady()
      })
      .catch(() => {
        setEvents([])
        setLoading(false)
        signalReady()
      })
  }, [])

  // Esimene eelseisev kodumäng saab hero
  const featuredHome = events.find(ev => isHome(ev))
  const remainingEvents = events.filter(ev => ev !== featuredHome)

  return (
    <div>
      {/* Loading hero skeleton (full-width) */}
      {loading && (
        <div style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)', marginBottom: 40 }}>
          <HeroSkeleton />
        </div>
      )}

      {/* Esimese kodumängu hero (full-width) */}
      {!loading && !error && featuredHome && (
        <HeroGame ev={featuredHome} reducedMotion={reducedMotion} isMobile={isMobile} />
      )}

      {/* Page content */}
      <div className="px-4 max-w-4xl mx-auto pb-12">
        {/* Header */}
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <h1 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(2rem, 4vw, 3rem)', color: DARK, letterSpacing: '1px', lineHeight: 1 }}>
            Piletid
          </h1>
          <a
            href={TICKETS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold hover:underline underline-offset-2 transition-colors cursor-pointer"
            style={{ fontFamily: FONT_BODY, color: BLUE }}
          >
            Kõik korvpallipiletid Piletitaskus →
          </a>
        </div>

        {/* Error */}
        {error && (
          <p className="text-center py-16" style={{ fontFamily: FONT_BODY, color: GRAY }}>
            Mängude laadimine ebaõnnestus. Proovi hiljem uuesti.
          </p>
        )}

        {/* No events */}
        {!loading && !error && events.length === 0 && (
          <div className="text-center py-20" style={{ background: '#f8fafc', borderRadius: 14, border: '1px solid #e5e7eb' }}>
            <p style={{ fontFamily: FONT_HEADING, fontSize: '2rem', color: '#d1d5db', letterSpacing: '1px' }}>
              EELSEISVAID MÄNGE EI LEITUD
            </p>
            <a
              href={TICKETS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-6 px-7 py-3 rounded-xl font-bold text-white cursor-pointer hover:opacity-90 transition-opacity"
              style={{ fontFamily: FONT_BODY, background: BLUE }}
            >
              Vaata Piletitaskust
            </a>
          </div>
        )}

        {/* Loading row skeletons */}
        {loading && (
          <div className="flex flex-col gap-2 mt-2">
            <RowSkeleton />
            <RowSkeleton />
          </div>
        )}

        {/* Ülejäänud mängud */}
        {!loading && !error && remainingEvents.length > 0 && (
          <div>
            <p
              className="text-xs font-bold tracking-widest uppercase mb-3"
              style={{ fontFamily: FONT_BODY, color: GRAY }}
            >
              Kõik eelseisvad mängud
            </p>
            <div className="flex flex-col gap-2.5">
              {remainingEvents.map(ev => (
                <MatchRow key={ev.id} ev={ev} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
