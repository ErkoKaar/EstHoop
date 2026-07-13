import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLoading } from '../contexts/LoadingContext'
import { motion } from 'framer-motion'
import { Particles, ParticlesProvider } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import Panel from '../components/Panel'
import FlagDivider from '../components/FlagDivider'

const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"
const BLUE = '#0072ce'
const DARK = '#08060d'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
// timeTBD mängul on kellaaeg platshoidja (00:00 UTC) — loe möödunuks alles päeva lõpus
function isPastGame(ev, now) {
  const ms = ev.startTimestamp * 1000
  return ev.timeTBD ? ms + 86400000 < now : ms < now
}
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
function HeroBanner({ recent, loading, upcoming, standingsName }) {
  const nextEvent = upcoming[0] ?? null
  const form = loading ? [] : recent.slice(0, 5).reverse()
  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []
  )
  const initParticles = useCallback(async engine => {
    await loadSlim(engine)
  }, [])

  const tourneyName = nextEvent?.tournament?.name || recent[0]?.tournament?.name
  const tourneyLabel = !loading && tourneyName ? shortTournament(tourneyName) : null
  const groupLabel = !loading && standingsName ? standingsName.replace('Group ', 'Grupp ') : null
  const badgeText = [tourneyLabel, groupLabel].filter(Boolean).join(' · ')

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
            {loading ? '· · ·' : (badgeText || 'Eesti Korvpallikoondis')}
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
            fontFamily: FONT_BODY, color: 'rgba(255,255,255,0.6)',
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
      {!loading && upcoming.length > 0 && (
        <motion.div {...(reducedMotion ? {} : fadeUp(0.4))}>
          <HeroCountdown events={upcoming} />
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
function HeroCountdown({ events }) {
  const [target, setTarget] = useState(null)

  useEffect(() => {
    const tick = () => {
      // esimene tulevikus algav mäng — kui eesmine mäng algab, liigub taimer järgmisele
      const now = Date.now()
      const event = events.find(ev => ev.startTimestamp * 1000 > now)
      if (!event) { setTarget(null); return }
      const diff = event.startTimestamp * 1000 - now
      setTarget({
        event,
        time: {
          d: Math.floor(diff / 86400000),
          h: Math.floor((diff % 86400000) / 3600000),
          m: Math.floor((diff % 3600000) / 60000),
          s: Math.floor((diff % 60000) / 1000),
        },
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [events])

  if (!target) return null

  const { event, time } = target
  const ts = event.startTimestamp
  const home = isHome(event)
  const opponent = home ? event.awayTeam?.name : event.homeTeam?.name
  const venue = home ? 'kodu' : 'võõrsil'
  const units = [
    { v: time.d, l: 'päeva' },
    { v: event.timeTBD ? null : time.h, l: 'tundi' },
    { v: event.timeTBD ? null : time.m, l: 'min' },
    { v: event.timeTBD ? null : time.s, l: 'sek' },
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
        fontFamily: FONT_BODY, color: 'rgba(255,255,255,0.6)',
        fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8,
      }}>
        Järgmine mäng
      </div>

      {/* matchup */}
      <div style={{
        fontFamily: FONT_HEADING, color: 'rgba(255,255,255,0.85)',
        fontSize: 'clamp(0.85rem, 2vw, 1.05rem)', letterSpacing: '0.12em',
        textTransform: 'uppercase', marginBottom: 20,
      }}>
        Eesti&nbsp;
        <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 6px' }}>vs</span>
        &nbsp;{opponent}
        <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 10px' }}>·</span>
        {formatDate(ts)}
        {!event.timeTBD && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 8px' }}>·</span>
            {formatTime(ts)}
          </>
        )}
        <span style={{
          fontFamily: FONT_BODY, fontSize: '0.65rem', letterSpacing: '0.15em',
          color: 'rgba(255,255,255,0.55)', marginLeft: 8, textTransform: 'uppercase',
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
                  {v == null ? '--' : String(v).padStart(2, '0')}
                </span>
              </div>
              <div style={{
                fontFamily: FONT_BODY, color: 'rgba(255,255,255,0.55)',
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

// ── Upcoming Row ────────────────────────────────────────────────
function UpcomingRow({ event }) {
  const home = isHome(event)
  const opponent = home ? event.awayTeam?.name : event.homeTeam?.name
  const d = new Date(event.startTimestamp * 1000)
  const day = d.toLocaleDateString('et-EE', { day: '2-digit' })
  const month = d.toLocaleDateString('et-EE', { month: 'short' }).replace('.', '').toUpperCase()

  return (
    <div style={{ display: 'flex', alignItems: 'stretch' }}>
      <div style={{
        width: 56, flexShrink: 0, background: BLUE, color: 'white',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: FONT_HEADING, fontSize: '1.35rem', lineHeight: 1, letterSpacing: 0.5 }}>{day}</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: '0.58rem', letterSpacing: '0.1em', fontWeight: 700, marginTop: 2 }}>{month}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0, textAlign: 'left' }}>
          <div style={{ fontFamily: FONT_HEADING, fontSize: '1.3rem', color: DARK, letterSpacing: 0.5 }}>
            vs {opponent}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {shortTournament(event.tournament?.name)} · {home ? 'Kodu' : 'Võõrsil'}
          </div>
        </div>
        <span style={{
          fontFamily: FONT_BODY, fontWeight: 700, fontSize: event.timeTBD ? '0.7rem' : '0.9rem',
          color: event.timeTBD ? '#9ca3af' : '#4b5563',
          textTransform: event.timeTBD ? 'uppercase' : 'none', letterSpacing: event.timeTBD ? '0.06em' : 0,
          flexShrink: 0,
        }}>
          {event.timeTBD ? 'Aeg selgub' : formatTime(event.startTimestamp)}
        </span>
      </div>
    </div>
  )
}

// ── Result Row (expands to box score when stats are available) ─
function ResultRow({ event, stats, isOpen, onToggle }) {
  const home = isHome(event)
  const opponent = home ? event.awayTeam?.name : event.homeTeam?.name
  const estScore = home ? event.homeScore?.current : event.awayScore?.current
  const oppScore = home ? event.awayScore?.current : event.homeScore?.current
  const won = estScore > oppScore

  const rc = won ? '#16a34a' : '#dc2626'
  const clickable = !!stats

  return (
    <div>
      <div
        onClick={clickable ? onToggle : undefined}
        style={{ display: 'flex', alignItems: 'stretch', cursor: clickable ? 'pointer' : 'default', userSelect: 'none' }}
      >
        <div style={{
          width: 56, flexShrink: 0, background: rc, color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: FONT_HEADING, fontSize: '1.6rem', letterSpacing: 0.5 }}>{won ? 'V' : 'K'}</span>
        </div>
        <div
          style={{ flex: 1, minWidth: 0, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, transition: 'background 0.15s' }}
          onMouseEnter={e => { if (clickable) e.currentTarget.style.background = '#f9fafb' }}
          onMouseLeave={e => { if (clickable) e.currentTarget.style.background = 'transparent' }}
        >
          <div style={{ minWidth: 0, textAlign: 'left' }}>
            <div style={{ fontFamily: FONT_HEADING, fontSize: '1.3rem', color: DARK, letterSpacing: 0.5 }}>
              vs {opponent}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {shortTournament(event.tournament?.name)} · {formatDate(event.startTimestamp)}
              {!home && ' · võõrsil'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span style={{ fontFamily: FONT_HEADING, fontSize: '1.6rem', color: rc, letterSpacing: 1 }}>
              {estScore}–{oppScore}
            </span>
            <div style={{ width: 14, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
              {clickable && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"
                  style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>

      {clickable && isOpen && (
        <div style={{ overflowX: 'auto' }}>
          {stats.quarters?.length > 0 && (
            <div style={{ padding: '14px 16px', background: DARK, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, paddingLeft: 76 }}>
                {stats.quarters.map((q, qi) => (
                  <div key={qi} style={{ width: 34, textAlign: 'center', fontFamily: FONT_BODY, fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {q.label}
                  </div>
                ))}
              </div>
              {[
                { label: home ? 'Eesti' : opponent, key: 'home' },
                { label: home ? opponent : 'Eesti', key: 'away' },
              ].map(row => (
                <div key={row.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 68, flexShrink: 0, fontFamily: FONT_BODY, fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
                    {row.label}
                  </span>
                  {stats.quarters.map((q, qi) => (
                    <div key={qi} style={{
                      width: 34, textAlign: 'center', padding: '4px 0', borderRadius: 5,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    }}>
                      <span style={{ fontFamily: FONT_HEADING, fontSize: '1rem', color: 'white', letterSpacing: 0.5 }}>{q[row.key]}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          <PlayerStatsTable teamLabel={home ? 'Eesti' : opponent} players={stats.homePlayers} accent={home ? BLUE : '#d1d5db'} />
          <PlayerStatsTable teamLabel={home ? opponent : 'Eesti'} players={stats.awayPlayers} accent={home ? '#d1d5db' : BLUE} />
        </div>
      )}
    </div>
  )
}

// ── Player stats table (used per team in box score) ────────────
function PlayerStatsTable({ teamLabel, players, accent }) {
  if (!players?.length) return null
  return (
    <div>
      <div style={{ padding: '14px 16px 8px' }}>
        <span style={{
          fontFamily: FONT_BODY, fontWeight: 700, fontSize: '0.7rem', color: DARK,
          textTransform: 'uppercase', letterSpacing: '0.12em',
          borderBottom: `2px solid ${accent}`, paddingBottom: 4,
        }}>
          {teamLabel}
        </span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', fontFamily: FONT_BODY }}>
        <thead>
          <tr style={{ background: '#f9fafb' }}>
            {['Mängija', 'MIN', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'FG%', '+/-'].map(h => (
              <th key={h} style={{ padding: '6px 10px', textAlign: h === 'Mängija' ? 'left' : 'center', color: '#9ca3af', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((p, pi) => (
            <tr key={pi} style={{ borderTop: '1px solid #f9fafb' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '8px 10px', color: DARK, fontWeight: 600, whiteSpace: 'nowrap' }}>{p.name}</td>
              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#6b7280' }}>{p.min}</td>
              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: p.pts >= 10 ? 700 : 400, color: p.pts >= 10 ? DARK : '#6b7280' }}>{p.pts}</td>
              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#6b7280' }}>{p.reb}</td>
              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#6b7280' }}>{p.ast}</td>
              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#6b7280' }}>{p.stl}</td>
              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#6b7280' }}>{p.blk}</td>
              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#6b7280' }}>{p.fg}</td>
              <td style={{ padding: '8px 10px', textAlign: 'center', color: parseInt(p.pm) > 0 ? '#16a34a' : parseInt(p.pm) < 0 ? '#dc2626' : '#6b7280', fontWeight: 600 }}>{p.pm}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Recent Results list (rows expand inline into box score) ────
function RecentResultsSection({ recent, gameStats, loading }) {
  const [openId, setOpenId] = useState(null)
  const statsById = useMemo(
    () => Object.fromEntries(gameStats.map(g => [g.id, g])),
    [gameStats]
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[...Array(5)].map((_, i) => <Skeleton key={i} style={{ height: 64 }} />)}
      </div>
    )
  }
  if (!recent.length) {
    return <p style={{ fontFamily: FONT_BODY, color: '#9ca3af', fontWeight: 600 }}>Tulemused puuduvad.</p>
  }

  return (
    <Panel>
      {recent.map((ev, i) => (
        <div key={ev.id} style={{ borderBottom: i < recent.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
          <ResultRow
            event={ev}
            stats={statsById[ev.id]}
            isOpen={openId === ev.id}
            onToggle={() => setOpenId(openId === ev.id ? null : ev.id)}
          />
        </div>
      ))}
    </Panel>
  )
}

// ── Group Standings ────────────────────────────────────────────
function GroupStandings({ standings, loading }) {
  if (loading) return <Skeleton style={{ height: 180, marginTop: 32 }} />
  if (!standings.rows?.length) return null

  const COLS = ['#', 'Meeskond', 'V', 'K', 'Pts']
  const groupLabel = standings.name?.replace('Group ', 'Grupp ') ?? null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <h2 style={{ fontFamily: FONT_HEADING, fontSize: '1.75rem', color: DARK, letterSpacing: 1, margin: 0 }}>
          Grupi seis
        </h2>
        {groupLabel && (
          <span style={{
            fontFamily: FONT_BODY, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', background: '#f3f4f6', color: '#6b7280',
            borderRadius: 20, padding: '3px 10px',
          }}>
            {groupLabel}
          </span>
        )}
      </div>

      <Panel>
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
        {standings.rows.map((row, i) => {
          const est = row.team?.name === 'Estonia'
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '36px 1fr 44px 44px 56px',
              padding: '13px 16px',
              borderBottom: i < standings.rows.length - 1 ? '1px solid #f3f4f6' : 'none',
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
      </Panel>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function KoondisPage() {
  const [upcoming, setUpcoming] = useState([])
  const [recent, setRecent] = useState([])
  const [standings, setStandings] = useState({ name: null, rows: [] })
  const [gameStats, setGameStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error] = useState(null)
  const { signalReady } = useLoading()

  useEffect(() => {
    Promise.allSettled([
      fetch(`${API}/national-team/games`).then(r => r.json()),
      fetch(`${API}/national-team/standings`).then(r => r.json()),
      fetch(`${API}/national-team/game-stats`).then(r => r.json()),
    ]).then(([gamesRes, standingsRes, statsRes]) => {
      if (gamesRes.status === 'fulfilled') {
        // DB cache uueneb kord päevas — juba mängitud, aga veel "eelseisvad" mängud välja
        const now = Date.now()
        setUpcoming((gamesRes.value.upcoming || []).filter(ev => !isPastGame(ev, now)))
        setRecent(gamesRes.value.recent || [])
      }
      setStandings(standingsRes.status === 'fulfilled' ? standingsRes.value : { name: null, rows: [] })
      if (statsRes.status === 'fulfilled' && Array.isArray(statsRes.value)) {
        setGameStats(statsRes.value)
      }
      setLoading(false)
      signalReady()
    })
  }, [])

  return (
    <div style={{ width: '100%' }}>
      {/* Hero — full width */}
      <HeroBanner recent={recent} loading={loading} upcoming={upcoming} standingsName={standings.name} />

      {/* Content */}
      <div style={{ maxWidth: 1024, width: '100%', boxSizing: 'border-box', margin: '0 auto', padding: '40px 24px 56px' }}>

        {error && (
          <p style={{ fontFamily: FONT_BODY, color: '#dc2626', textAlign: 'center', padding: '40px 0' }}>
            {error}
          </p>
        )}

        {/* Eelseisvad mängud */}
        <section>
          <h2 style={{ fontFamily: FONT_HEADING, fontSize: '1.75rem', color: DARK, letterSpacing: 1, margin: '0 0 18px' }}>
            Eelseisvad mängud
          </h2>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton style={{ height: 64 }} />
              <Skeleton style={{ height: 64 }} />
            </div>
          ) : upcoming.length === 0 ? (
            <p style={{ fontFamily: FONT_BODY, color: '#9ca3af', fontWeight: 600 }}>Hetkel ühtegi planeeritud mängu.</p>
          ) : (
            <Panel>
              {upcoming.map((ev, i) => (
                <div key={ev.id} style={{ borderBottom: i < upcoming.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <UpcomingRow event={ev} />
                </div>
              ))}
            </Panel>
          )}
        </section>

        <FlagDivider />

        {/* Viimased tulemused (klõpsatavad read avavad mängu statistika) */}
        <section>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, margin: '0 0 18px' }}>
            <h2 style={{ fontFamily: FONT_HEADING, fontSize: '1.75rem', color: DARK, letterSpacing: 1, margin: 0 }}>
              Viimased tulemused
            </h2>
            <a
              href="https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-european-qualifiers/teams/estonia#games"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: FONT_BODY, fontSize: '0.875rem', fontWeight: 600, color: BLUE, textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
              onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
            >
              Vaata kõiki tulemusi →
            </a>
          </div>
          <RecentResultsSection recent={recent} gameStats={gameStats} loading={loading} />
        </section>

        <FlagDivider />

        <GroupStandings standings={standings} loading={loading} />
      </div>
    </div>
  )
}
