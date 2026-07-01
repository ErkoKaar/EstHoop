import { useEffect, useState } from 'react'
import { useLoading } from '../contexts/LoadingContext'

const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"
const BLUE = '#0072ce'
const DARK = '#08060d'

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

// ── Skeleton ──────────────────────────────────────────────────────────────────
function HeroSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl mb-4" style={{ background: '#1a1a2e', minHeight: 260 }} />
  )
}
function RowSkeleton() {
  return (
    <div className="animate-pulse bg-gray-100 rounded-2xl h-20" />
  )
}

// ── Featured home game hero ───────────────────────────────────────────────────
function HeroGame({ ev }) {
  const opponent = getOpponent(ev)
  const tournament = shortTournament(ev.tournament?.name)
  const venue = ev.venue?.name || ev.venue?.city?.name

  return (
    <div
      style={{
        width: '100vw',
        marginLeft: 'calc(50% - 50vw)',
        background: [
          'linear-gradient(175deg, rgba(3,14,36,0.85) 0%, rgba(6,26,64,0.75) 45%, rgba(8,35,86,0.68) 100%)',
          "url('/pilet_hero.jpg') center 30% / cover no-repeat",
        ].join(', '),
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 32,
      }}
    >
      {/* Dot grid texture */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.05, zIndex: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
        backgroundSize: '26px 26px',
        pointerEvents: 'none',
      }} />
      {/* Radial glow */}
      <div style={{
        position: 'absolute', top: '-40%', left: '50%', transform: 'translateX(-50%)',
        width: '60%', height: '150%', opacity: 0.1, zIndex: 0,
        background: `radial-gradient(ellipse, ${BLUE}, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{ maxWidth: 1024, margin: '0 auto', padding: '52px 24px 44px', position: 'relative', zIndex: 1 }}>
        {/* Badge row */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,114,206,0.2)', border: '1px solid rgba(0,114,206,0.4)',
          borderRadius: 20, padding: '4px 14px', marginBottom: 24,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
          <span style={{ fontFamily: FONT_BODY, color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Kodumäng{tournament ? ` · ${tournament}` : ''}
          </span>
        </div>

        {/* Matchup */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <span style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(2.8rem, 6vw, 5rem)', color: '#fff', letterSpacing: '2px', lineHeight: 1 }}>
            Eesti
          </span>
          <span style={{ fontFamily: FONT_BODY, fontSize: '1.4rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
            vs
          </span>
          <span style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(2.8rem, 6vw, 5rem)', color: BLUE, letterSpacing: '2px', lineHeight: 1 }}>
            {opponent}
          </span>
        </div>

        {/* Date + venue */}
        {ev.startTimestamp && (
          <p style={{ fontFamily: FONT_BODY, color: 'rgba(255,255,255,0.55)', fontSize: '1.05rem', fontWeight: 500, marginBottom: 32, textTransform: 'capitalize' }}>
            {formatDateLong(ev.startTimestamp)} · {formatTime(ev.startTimestamp)}
            {venue && ` · ${venue}`}
          </p>
        )}

        {/* CTA */}
        <a
          href={TICKETS_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', borderRadius: 12,
            fontFamily: FONT_BODY, fontWeight: 700, fontSize: '1.1rem',
            background: BLUE, color: '#fff', textDecoration: 'none',
            transition: 'opacity 0.2s, transform 0.2s',
            letterSpacing: '0.5px',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
        >
          Osta pilet
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
            <polyline points="15,3 21,3 21,9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>

      {/* Estonian flag stripes */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ height: 7, background: BLUE }} />
        <div style={{ height: 7, background: '#0a0a1a' }} />
        <div style={{ height: 7, background: 'rgba(255,255,255,0.93)' }} />
      </div>
    </div>
  )
}

// ── Match row ─────────────────────────────────────────────────────────────────
function MatchRow({ ev }) {
  const home = isHome(ev)
  const opponent = getOpponent(ev)
  const tournament = shortTournament(ev.tournament?.name)
  const ts = ev.startTimestamp

  return (
    <div
      className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border bg-white transition-shadow duration-200 hover:shadow-md group"
      style={{ borderColor: home ? '#dbeafe' : '#f3f4f6', borderLeftWidth: 4, borderLeftColor: home ? BLUE : '#e5e7eb' }}
    >
      {/* Left: matchup */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Type dot */}
        <span
          className="shrink-0 w-2.5 h-2.5 rounded-full"
          style={{ background: home ? BLUE : '#d1d5db' }}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontFamily: FONT_HEADING, fontSize: '1.4rem', color: DARK, letterSpacing: '1px', lineHeight: 1.1 }}>
              Eesti
            </span>
            <span style={{ fontFamily: FONT_BODY, fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600 }}>vs</span>
            <span style={{ fontFamily: FONT_HEADING, fontSize: '1.4rem', color: DARK, letterSpacing: '1px', lineHeight: 1.1 }}>
              {opponent}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {ts && (
              <span className="text-xs font-semibold" style={{ fontFamily: FONT_BODY, color: '#6b7280' }}>
                {formatDateShort(ts)} · {formatTime(ts)}
              </span>
            )}
            {tournament && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ fontFamily: FONT_BODY, background: '#f3f4f6', color: '#9ca3af' }}>
                {tournament}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: CTA or label */}
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
            style={{ fontFamily: FONT_BODY, background: '#f3f4f6', color: '#9ca3af' }}
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

  // First upcoming home game gets the hero treatment
  const featuredHome = events.find(ev => isHome(ev))
  const remainingEvents = events.filter(ev => ev !== featuredHome)

  return (
    <div>
      {/* Loading hero skeleton (full-width) */}
      {loading && (
        <div style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)', marginBottom: 32 }}>
          <HeroSkeleton />
        </div>
      )}

      {/* Featured home game hero (full-width) */}
      {!loading && !error && featuredHome && <HeroGame ev={featuredHome} />}

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
          <p className="text-center py-16" style={{ fontFamily: FONT_BODY, color: '#9ca3af' }}>
            Mängude laadimine ebaõnnestus. Proovi hiljem uuesti.
          </p>
        )}

        {/* No events */}
        {!loading && !error && events.length === 0 && (
          <div className="text-center py-20 rounded-3xl" style={{ background: '#f8fafc' }}>
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

        {/* Remaining events */}
        {!loading && !error && remainingEvents.length > 0 && (
          <div>
            <p
              className="text-xs font-bold tracking-widest uppercase mb-3"
              style={{ fontFamily: FONT_BODY, color: '#9ca3af' }}
            >
              Kõik eelseisvad mängud
            </p>
            <div className="flex flex-col gap-2">
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
