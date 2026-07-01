import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLoading } from '../contexts/LoadingContext'
import { motion } from 'framer-motion'
import { Particles, ParticlesProvider } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'

const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"
const BLUE = '#0072ce'
const DARK = '#08060d'

const NEXT_URL = 'https://api.sofascore.com/api/v1/team/25373/events/next/0'
const LAST_URL = 'https://api.sofascore.com/api/v1/team/25373/events/last/0'
const STANDINGS_URL = 'https://api.sofascore.com/api/v1/unique-tournament/10437/season/54504/standings/total'

function formatDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('et-EE', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}
function formatTime(ts) {
  return new Date(ts * 1000).toLocaleTimeString('et-EE', {
    hour: '2-digit', minute: '2-digit',
  })
}
function isHome(ev) { return ev.homeTeam?.name === 'Estonia' }
function getResult(ev) {
  const h = isHome(ev)
  const est = h ? ev.homeScore?.current : ev.awayScore?.current
  const opp = h ? ev.awayScore?.current : ev.homeScore?.current
  if (est == null || opp == null) return null
  return est > opp ? 'W' : est < opp ? 'L' : 'V'
}
function shortTournament(name) {
  if (!name) return ''
  if (name.includes('World Cup') && name.includes('Qualifiers')) return 'FIBA MM Kval.'
  if (name.includes('EuroBasket') && name.includes('Qualifiers')) return 'EuroBasket Kval.'
  if (name.includes('EuroBasket')) return 'EuroBasket'
  if (name.includes('Friendly')) return 'Sõprusmäng'
  if (name.includes('Olympic')) return 'Olümpia Kval.'
  return name.length > 30 ? name.slice(0, 28) + '…' : name
}


const PARTICLES_OPTIONS = {
  background: { color: { value: 'transparent' } },
  fpsLimit: 50,
  particles: {
    number: { value: 55, density: { enable: true, area: 900 } },
    color: { value: ['#ffffff', '#4da6ff', '#0072ce'] },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.04, max: 0.28 },
      animation: { enable: true, speed: 0.6, sync: false },
    },
    size: { value: { min: 1, max: 2.5 } },
    move: {
      enable: true, speed: 0.5,
      direction: 'top', random: true, straight: false,
      outModes: { default: 'out' },
    },
  },
  detectRetina: true,
}

// ── Skeleton ──────────────────────────────────────────────────
function Skeleton({ style }) {
  return <div className="animate-pulse bg-gray-200 rounded-xl" style={style} />
}

// fade-up variant for Framer Motion
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
})

// ── Hero Banner ───────────────────────────────────────────────
function HeroBanner({ recent, loading, nextEvent }) {
  const form = loading ? [] : [...recent].reverse()
  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []
  )
  const initParticles = useCallback(async engine => {
    await loadSlim(engine)
  }, [])

  return (
    <div style={{
      width: '100vw',
      marginLeft: 'calc(50% - 50vw)',
      background: [
        'linear-gradient(175deg, rgba(3,14,36,0.88) 0%, rgba(6,26,64,0.78) 45%, rgba(8,35,86,0.72) 100%)',
        "url('/hero.jpg') center 20% / cover no-repeat",
      ].join(', '),
      position: 'relative', overflow: 'hidden',
    }}>
      {/* tsParticles background */}
      {!reducedMotion && (
        <ParticlesProvider init={initParticles}>
          <Particles
            id="hero-particles"
            options={PARTICLES_OPTIONS}
            style={{ position: 'absolute', inset: 0, zIndex: 0 }}
          />
        </ParticlesProvider>
      )}

      {/* Dot grid (static fallback / texture) */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.05, zIndex: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
        backgroundSize: '26px 26px',
        pointerEvents: 'none',
      }} />
      {/* Radial glow */}
      <div style={{
        position: 'absolute', top: '-40%', left: '50%', transform: 'translateX(-50%)',
        width: '60%', height: '150%', opacity: 0.12, zIndex: 0,
        background: `radial-gradient(ellipse, ${BLUE}, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{ maxWidth: 1024, margin: '0 auto', padding: '48px 24px 36px', textAlign: 'center', position: 'relative', zIndex: 1 }}>

        {/* Badge */}
        <motion.div {...(reducedMotion ? {} : fadeUp(0))} style={{ display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'rgba(0,114,206,0.2)', border: '1px solid rgba(0,114,206,0.35)',
          borderRadius: 20, padding: '4px 14px', marginBottom: 18,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
          <span style={{ fontFamily: FONT_BODY, color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            FIBA MM Kval. · Grupp H
          </span>
        </motion.div>

        <motion.h1 {...(reducedMotion ? {} : fadeUp(0.12))} style={{
          fontFamily: FONT_HEADING, color: 'white', margin: '0 0 32px',
          lineHeight: 1, letterSpacing: 2,
          fontSize: 'clamp(2.25rem, 5.5vw, 3.75rem)',
        }}>
          Eesti Korvpallikoondis
        </motion.h1>

        {/* Form guide */}
        <motion.div {...(reducedMotion ? {} : fadeUp(0.26))}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{
            fontFamily: FONT_BODY, color: 'rgba(255,255,255,0.35)',
            fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', marginRight: 4,
          }}>
            Viimane 5
          </span>
          {loading
            ? [...Array(5)].map((_, i) => (
                <div key={i} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              ))
            : form.map((ev, i) => {
                const r = getResult(ev)
                const bg = r === 'W' ? '#16a34a' : r === 'L' ? '#dc2626' : '#6b7280'
                return (
                  <div key={i} style={{
                    width: 30, height: 30, borderRadius: '50%', background: bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: FONT_BODY, color: 'white', fontWeight: 700, fontSize: '0.7rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
                  }}>
                    {r}
                  </div>
                )
              })
          }
        </motion.div>
      </div>

      {/* Countdown inside hero */}
      {!loading && nextEvent && (
        <motion.div {...(reducedMotion ? {} : fadeUp(0.4))}>
          <HeroCountdown event={nextEvent} />
        </motion.div>
      )}

      {/* Estonia flag stripes */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ height: 7, background: BLUE }} />
        <div style={{ height: 7, background: '#0a0a1a' }} />
        <div style={{ height: 7, background: 'rgba(255,255,255,0.93)' }} />
      </div>
    </div>
  )
}

// ── Hero Countdown (inside hero banner) ───────────────────────
function HeroCountdown({ event }) {
  const [time, setTime] = useState(null)
  const ts = event.startTimestamp

  useEffect(() => {
    const tick = () => {
      const diff = ts * 1000 - Date.now()
      if (diff <= 0) { setTime(null); return }
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [ts])

  if (!time) return null

  const home = isHome(event)
  const opponent = home ? event.awayTeam?.name : event.homeTeam?.name
  const venue = home ? 'kodu' : 'võõrsil'
  const units = [
    { v: time.d, l: 'päeva' },
    { v: time.h, l: 'tundi' },
    { v: time.m, l: 'min' },
    { v: time.s, l: 'sek' },
  ]

  return (
    <div style={{ textAlign: 'center', padding: '28px 24px 4px', position: 'relative' }}>
      {/* divider */}
      <div style={{
        width: 48, height: 1, background: 'rgba(255,255,255,0.12)',
        margin: '0 auto 20px',
      }} />

      {/* label */}
      <div style={{
        fontFamily: FONT_BODY, color: 'rgba(255,255,255,0.4)',
        fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8,
      }}>
        Järgmine mäng
      </div>

      {/* matchup */}
      <div style={{
        fontFamily: FONT_HEADING, color: 'rgba(255,255,255,0.7)',
        fontSize: 'clamp(0.85rem, 2vw, 1.05rem)', letterSpacing: '0.12em',
        textTransform: 'uppercase', marginBottom: 20,
      }}>
        Eesti&nbsp;
        <span style={{ color: 'rgba(255,255,255,0.25)', margin: '0 6px' }}>vs</span>
        &nbsp;{opponent}
        <span style={{ color: 'rgba(255,255,255,0.25)', margin: '0 10px' }}>·</span>
        {formatDate(ts)}
        <span style={{ color: 'rgba(255,255,255,0.25)', margin: '0 8px' }}>·</span>
        {formatTime(ts)}
        <span style={{
          fontFamily: FONT_BODY, fontSize: '0.65rem', letterSpacing: '0.15em',
          color: 'rgba(255,255,255,0.3)', marginLeft: 8, textTransform: 'uppercase',
        }}>
          {venue}
        </span>
      </div>

      {/* digit blocks */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
        {units.map(({ v, l }, i) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                background: 'rgba(0,0,0,0.38)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10,
                padding: '10px 18px',
                minWidth: 68,
                backdropFilter: 'blur(14px)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 20px rgba(0,0,0,0.45)',
              }}>
                <span style={{
                  fontFamily: FONT_HEADING, color: 'white',
                  fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', lineHeight: 1,
                  letterSpacing: 2,
                  textShadow: `0 0 20px rgba(0,114,206,0.6)`,
                }}>
                  {String(v).padStart(2, '0')}
                </span>
              </div>
              <div style={{
                fontFamily: FONT_BODY, color: 'rgba(255,255,255,0.3)',
                fontSize: '0.6rem', letterSpacing: '0.18em',
                textTransform: 'uppercase', marginTop: 7,
              }}>
                {l}
              </div>
            </div>
            {i < units.length - 1 && (
              <span style={{
                fontFamily: FONT_HEADING, color: 'rgba(255,255,255,0.2)',
                fontSize: '1.8rem', lineHeight: 1, marginTop: -14,
              }}>:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Upcoming Card ─────────────────────────────────────────────
function UpcomingCard({ event }) {
  const home = isHome(event)
  const opponent = home ? event.awayTeam?.name : event.homeTeam?.name

  return (
    <div style={{
      background: 'white', border: '1px solid #f3f4f6',
      borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ height: 3, background: BLUE }} />
      <div style={{ padding: '16px 20px' }}>
        <p style={{
          fontFamily: FONT_BODY, fontSize: '0.65rem', fontWeight: 700,
          letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 14,
        }}>
          {shortTournament(event.tournament?.name)}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: FONT_HEADING, fontSize: '1.875rem', color: BLUE, letterSpacing: 1 }}>Eesti</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {home ? 'Kodu' : 'Võõrsil'}
            </div>
          </div>
          <span style={{ fontFamily: FONT_HEADING, fontSize: '1.25rem', color: '#d1d5db', flexShrink: 0 }}>VS</span>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: FONT_HEADING, fontSize: '1.875rem', color: DARK, letterSpacing: 1 }}>{opponent}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {home ? 'Võõrsil' : 'Kodu'}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span style={{ fontFamily: FONT_BODY, fontSize: '0.875rem', fontWeight: 600, color: '#4b5563' }}>
            {formatDate(event.startTimestamp)}
          </span>
          <span style={{ color: '#e5e7eb' }}>·</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span style={{ fontFamily: FONT_BODY, fontSize: '0.875rem', fontWeight: 600, color: '#4b5563' }}>
            {formatTime(event.startTimestamp)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Result Row with score bar ──────────────────────────────────
function ResultRow({ event }) {
  const result = getResult(event)
  const home = isHome(event)
  const opponent = home ? event.awayTeam?.name : event.homeTeam?.name

  const rc = result === 'W' ? '#16a34a' : result === 'L' ? '#dc2626' : '#6b7280'
  const rb = result === 'W' ? '#dcfce7' : result === 'L' ? '#fee2e2' : '#f3f4f6'

  return (
    <div
      style={{ padding: '12px 12px', borderRadius: 12, transition: 'background 0.15s', cursor: 'default' }}
      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Top: badge + opponent + meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          background: rb, color: rc,
          fontFamily: FONT_BODY, fontWeight: 700, fontSize: '0.7rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {result ?? '?'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: '0.9375rem', color: DARK }}>
            vs {opponent}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: '0.7rem', color: '#9ca3af' }}>
            {shortTournament(event.tournament?.name)} · {formatDate(event.startTimestamp)}
            {!home && ' · võõrsil'}
          </div>
        </div>
      </div>

    </div>
  )
}

// ── Group Standings ────────────────────────────────────────────
function GroupStandings({ standings, loading }) {
  if (loading) return <Skeleton style={{ height: 180, marginTop: 32 }} />
  if (!standings.length) return null

  const COLS = ['#', 'Meeskond', 'V', 'K', 'Pts']

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <h2 style={{ fontFamily: FONT_HEADING, fontSize: '1.75rem', color: DARK, letterSpacing: 1, margin: 0 }}>
          Grupi seis
        </h2>
        <span style={{
          fontFamily: FONT_BODY, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', background: '#f3f4f6', color: '#6b7280',
          borderRadius: 20, padding: '3px 10px',
        }}>
          Grupp H
        </span>
      </div>

      <div style={{
        background: 'white', borderRadius: 16, border: '1px solid #f3f4f6',
        overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '36px 1fr 44px 44px 56px',
          padding: '8px 16px', background: '#f9fafb', borderBottom: '1px solid #f3f4f6',
        }}>
          {COLS.map(h => (
            <span key={h} style={{
              fontFamily: FONT_BODY, fontSize: '0.68rem', fontWeight: 700,
              color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {standings.map((row, i) => {
          const est = row.team?.name === 'Estonia'
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '36px 1fr 44px 44px 56px',
              padding: '13px 16px',
              borderBottom: i < standings.length - 1 ? '1px solid #f9fafb' : 'none',
              background: est ? 'rgba(0,114,206,0.05)' : 'white',
            }}>
              <span style={{ fontFamily: FONT_BODY, fontWeight: 700, color: est ? BLUE : '#9ca3af', fontSize: '0.9375rem' }}>
                {row.position}
              </span>
              <span style={{
                fontFamily: FONT_BODY, fontWeight: est ? 700 : 600,
                color: est ? BLUE : DARK, fontSize: '0.9375rem',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {est && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill={BLUE} style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                )}
                {est ? 'Eesti' : row.team?.name}
              </span>
              <span style={{ fontFamily: FONT_BODY, fontWeight: 600, color: '#374151', fontSize: '0.9375rem' }}>
                {row.wins}
              </span>
              <span style={{ fontFamily: FONT_BODY, fontWeight: 600, color: '#9ca3af', fontSize: '0.9375rem' }}>
                {row.losses}
              </span>
              <span style={{ fontFamily: FONT_HEADING, fontSize: '1.25rem', color: est ? BLUE : '#374151' }}>
                {row.points}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function KoondisPage() {
  const [upcoming, setUpcoming] = useState([])
  const [recent, setRecent] = useState([])
  const [standings, setStandings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error] = useState(null)
  const { signalReady } = useLoading()

  useEffect(() => {
    Promise.allSettled([
      fetch(NEXT_URL).then(r => r.json()),
      fetch(LAST_URL).then(r => r.json()),
      fetch(STANDINGS_URL).then(r => r.json()),
    ]).then(([nextRes, lastRes, standingsRes]) => {
      setUpcoming(nextRes.status === 'fulfilled' ? nextRes.value.events || [] : [])
      setRecent(lastRes.status === 'fulfilled' ? [...(lastRes.value.events || [])].reverse().slice(0, 5) : [])
      if (standingsRes.status === 'fulfilled') {
        const groupH = standingsRes.value.standings?.find(g => g.name?.includes('Group H'))
        setStandings(groupH?.rows || [])
      }
      setLoading(false)
      signalReady()
    })
  }, [])

  return (
    <div style={{ width: '100%' }}>
      {/* Hero — full width */}
      <HeroBanner recent={recent} loading={loading} nextEvent={upcoming[0] ?? null} />

      {/* Content */}
      <div style={{ maxWidth: 1024, width: '100%', boxSizing: 'border-box', margin: '0 auto', padding: '40px 24px 56px' }}>

        {error && (
          <p style={{ fontFamily: FONT_BODY, color: '#dc2626', textAlign: 'center', padding: '40px 0' }}>
            {error}
          </p>
        )}

        {/* 2-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 36, alignItems: 'start' }}>

          {/* Eelseisvad mängud */}
          <section>
            <h2 style={{ fontFamily: FONT_HEADING, fontSize: '1.75rem', color: DARK, letterSpacing: 1, margin: '0 0 18px', paddingLeft: 12, borderLeft: `3px solid ${BLUE}` }}>
              Eelseisvad mängud
            </h2>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Skeleton style={{ height: 128 }} />
                <Skeleton style={{ height: 128 }} />
              </div>
            ) : upcoming.length === 0 ? (
              <p style={{ fontFamily: FONT_BODY, color: '#9ca3af', fontWeight: 600 }}>Hetkel ühtegi planeeritud mängu.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {upcoming.map(ev => <UpcomingCard key={ev.id} event={ev} />)}
              </div>
            )}
          </section>

          {/* Viimased tulemused */}
          <section>
            <h2 style={{ fontFamily: FONT_HEADING, fontSize: '1.75rem', color: DARK, letterSpacing: 1, margin: '0 0 10px', paddingLeft: 12, borderLeft: `3px solid ${BLUE}` }}>
              Viimased tulemused
            </h2>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...Array(5)].map((_, i) => <Skeleton key={i} style={{ height: 74 }} />)}
              </div>
            ) : recent.length === 0 ? (
              <p style={{ fontFamily: FONT_BODY, color: '#9ca3af', fontWeight: 600 }}>Tulemused puuduvad.</p>
            ) : (
              <div style={{
                background: 'white', border: '1px solid #f3f4f6',
                borderRadius: 16, overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}>
                {recent.map((ev, i) => (
                  <div key={ev.id} style={{ borderBottom: i < recent.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                    <ResultRow event={ev} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Divider + Group standings */}
        <div style={{ borderTop: '1px solid #f3f4f6', marginTop: 28 }} />
        <GroupStandings standings={standings} loading={loading} />
      </div>
    </div>
  )
}
