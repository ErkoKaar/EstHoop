import { useEffect, useMemo, useState } from 'react'
import { useLoading } from '../contexts/LoadingContext'
import { motion } from 'framer-motion'
import TeamFlag from '../components/TeamFlag'

const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"

// "Mängupäeva" palett — tume areeni-hero, valge sisuala
const BLUE = '#0072ce'
const ICE = '#7fc4ff'  // hero aktsent
const TEXT = '#f0f4fa' // hero tekst (ja tumedad ribad sisualal)
const MUTED = '#8a97ac' // hero meta
const DARK = '#08060d' // sisuala tekst
const GRAY = '#9ca3af' // sisuala meta
const WIN = '#16a34a'
const LOSS = '#dc2626'
const DRAW = '#6b7280'
const CARD_BG = 'white'
const CARD_BORDER = '1px solid #e5e7eb'
const CARD_SHADOW = '0 1px 3px rgba(0,0,0,0.06)'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function formatDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('et-EE', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}
function formatShortDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('et-EE', {
    day: 'numeric', month: 'short',
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
// W/L/V(viik) → eestikeelne täht ja värv
function resultBadge(r) {
  if (r === 'W') return { label: 'V', color: WIN }
  if (r === 'L') return { label: 'K', color: LOSS }
  return { label: '–', color: DRAW }
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

// ── Skeleton (tume variant) ───────────────────────────────────
function Skeleton({ style, dark = false }) {
  return <div className="animate-pulse" style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#e5e7eb', borderRadius: 14, ...style }} />
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
})

// ── Countdown (hero keskel) ────────────────────────────────────
function Countdown({ events }) {
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
  const units = [
    { v: time.d, l: 'päeva' },
    { v: event.timeTBD ? null : time.h, l: 'tundi' },
    { v: event.timeTBD ? null : time.m, l: 'min' },
    { v: event.timeTBD ? null : time.s, l: 'sek' },
  ]

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
      {units.map(({ v, l }) => (
        <div key={l} style={{ textAlign: 'center' }}>
          <div style={{
            background: 'rgba(4,9,22,0.45)',
            border: '1px solid rgba(127,196,255,0.35)',
            borderRadius: 12,
            padding: '12px 16px',
            minWidth: 76,
            backdropFilter: 'blur(8px)',
          }}>
            <span style={{
              fontFamily: FONT_HEADING, color: ICE,
              fontSize: 'clamp(2rem, 4.5vw, 3rem)', lineHeight: 1, letterSpacing: 2,
              textShadow: '0 0 28px rgba(0,114,206,0.85)',
            }}>
              {v == null ? '--' : String(v).padStart(2, '0')}
            </span>
          </div>
          <div style={{
            fontFamily: FONT_BODY, color: MUTED,
            fontSize: '0.62rem', letterSpacing: '0.18em',
            textTransform: 'uppercase', marginTop: 7,
          }}>
            {l}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Matchup Hero — järgmine mäng suure vastasseisuna ───────────
function MatchupHero({ upcoming, recent, standings, loading, reducedMotion, isMobile }) {
  const nextEvent = upcoming[0] ?? null
  const lastEvent = recent[0] ?? null
  const ev = nextEvent ?? lastEvent
  const showNext = !!nextEvent

  const form = loading ? [] : recent.slice(0, 5).reverse()
  const estPosition = standings.rows?.find(r => r.team?.name === 'Estonia')?.position ?? null
  const groupLabel = standings.name?.replace('Group ', 'Grupp ') ?? null

  const home = ev ? isHome(ev) : true
  const opponent = ev ? (home ? ev.awayTeam?.name : ev.homeTeam?.name) : null
  const estScore = ev && (home ? ev.homeScore?.current : ev.awayScore?.current)
  const oppScore = ev && (home ? ev.awayScore?.current : ev.homeScore?.current)

  const eyebrow = ev
    ? [shortTournament(ev.tournament?.name), groupLabel].filter(Boolean).join(' · ')
    : 'Eesti Korvpallikoondis'

  // pikk vastasenimi (nt "North Macedonia") peab mahtuma — skaleeri fonti nime pikkuse järgi
  const longName = (opponent?.length ?? 0) > 12
  const nameStyle = {
    fontFamily: FONT_HEADING, lineHeight: 0.95, letterSpacing: 2,
    fontSize: longName ? 'clamp(1.9rem, 5vw, 3.4rem)' : 'clamp(2.6rem, 8vw, 5.5rem)',
    textTransform: 'uppercase', whiteSpace: 'nowrap',
  }
  const heroFlagStyle = {
    display: 'block', margin: '0 auto 12px',
    border: '1px solid rgba(255,255,255,0.25)',
    boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
  }

  return (
    <div style={{
      background: [
        'linear-gradient(178deg, rgba(4,9,22,0.92) 0%, rgba(5,16,40,0.55) 50%, rgba(6,11,26,0.94) 100%)',
        "url('/hero.jpg') center 20% / cover no-repeat",
      ].join(', '),
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', minHeight: 'min(72vh, 680px)',
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
        padding: '72px 24px 64px', textAlign: 'center', position: 'relative', zIndex: 1,
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>

        {/* Eyebrow */}
        <motion.div {...(reducedMotion ? {} : fadeUp(0))} style={{
          fontFamily: FONT_BODY, color: MUTED, fontSize: '0.7rem', fontWeight: 700,
          letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 6,
        }}>
          {loading ? '· · ·' : eyebrow}
        </motion.div>
        <motion.div {...(reducedMotion ? {} : fadeUp(0.08))} style={{
          fontFamily: FONT_BODY, color: ICE, fontSize: '0.66rem', fontWeight: 700,
          letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 36,
        }}>
          {loading ? '' : (showNext ? 'Järgmine mäng' : 'Viimane mäng')}
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 32 }}>
            <Skeleton dark style={{ width: 220, height: 84 }} />
            <Skeleton dark style={{ width: 220, height: 84 }} />
          </div>
        ) : ev ? (
          <>
            {/* Vastasseis */}
            <div style={{
              display: 'flex', flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center', justifyContent: 'center',
              gap: isMobile ? 10 : 'clamp(28px, 5vw, 72px)',
              marginBottom: 36,
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
                  fontFamily: FONT_HEADING, fontSize: 'clamp(1.6rem, 3.2vw, 2.5rem)',
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

            {/* Countdown / viimase mängu skoor */}
            <motion.div {...(reducedMotion ? {} : fadeUp(0.45))} style={{ marginBottom: 24 }}>
              {showNext ? (
                <Countdown events={upcoming} />
              ) : (
                <div style={{
                  fontFamily: FONT_HEADING, letterSpacing: 3, lineHeight: 1,
                  fontSize: 'clamp(2.4rem, 7vw, 4.5rem)',
                  color: getResult(ev) === 'W' ? WIN : getResult(ev) === 'L' ? LOSS : DRAW,
                  textShadow: '0 0 32px rgba(0,0,0,0.6)',
                }}>
                  {estScore}–{oppScore}
                </div>
              )}
            </motion.div>

            {/* Mängu info */}
            <motion.div {...(reducedMotion ? {} : fadeUp(0.55))} style={{
              fontFamily: FONT_BODY, color: TEXT, fontWeight: 600,
              fontSize: '0.95rem', letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: 28,
            }}>
              {formatDate(ev.startTimestamp)}
              {showNext && !ev.timeTBD && <span style={{ color: MUTED }}> · {formatTime(ev.startTimestamp)}</span>}
              {showNext && ev.timeTBD && <span style={{ color: MUTED }}> · aeg selgub</span>}
              <span style={{ color: MUTED }}> · {home ? 'Kodus' : 'Võõrsil'}</span>
            </motion.div>
          </>
        ) : (
          <p style={{ fontFamily: FONT_BODY, color: MUTED, fontWeight: 600, marginBottom: 28 }}>
            Mängude info puudub.
          </p>
        )}

        {/* Vorm + koht grupis */}
        <motion.div {...(reducedMotion ? {} : fadeUp(0.65))}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{
            fontFamily: FONT_BODY, color: MUTED,
            fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', marginRight: 2,
          }}>
            Viimane 5
          </span>
          {loading
            ? [...Array(5)].map((_, i) => (
                <div key={i} style={{ width: 27, height: 27, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              ))
            : form.map((g, i) => {
                const b = resultBadge(getResult(g))
                return (
                  <div key={i} style={{
                    width: 27, height: 27, borderRadius: '50%', background: b.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: FONT_BODY, color: '#fff', fontWeight: 700, fontSize: '0.68rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  }}>
                    {b.label}
                  </div>
                )
              })
          }
          {!loading && estPosition != null && (
            <span style={{
              fontFamily: FONT_BODY, color: ICE, fontWeight: 700,
              fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase',
              borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: 14, marginLeft: 6,
            }}>
              Grupis {estPosition}. koht
            </span>
          )}
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

// ── Teekonna sõlm (ring lipujoonel) ────────────────────────────
function TimelineNode({ type, result, reducedMotion }) {
  if (type === 'now') {
    return (
      <div style={{ position: 'relative', width: 28, height: 28, flexShrink: 0 }}>
        {!reducedMotion && (
          <motion.div
            animate={{ scale: [1, 1.9], opacity: [0.55, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: BLUE }}
          />
        )}
        <div style={{
          position: 'absolute', inset: 5, borderRadius: '50%',
          background: BLUE, boxShadow: '0 0 14px rgba(0,114,206,0.55)',
        }} />
      </div>
    )
  }
  if (type === 'past') {
    const b = resultBadge(result)
    return (
      <div style={{
        width: 28, height: 28, borderRadius: '50%', background: b.color, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT_BODY, color: '#fff', fontWeight: 700, fontSize: '0.7rem',
        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
      }}>
        {b.label}
      </div>
    )
  }
  // tulevane mäng — kontuur
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
      background: 'white', border: '2px solid #d1d5db', boxSizing: 'border-box',
    }} />
  )
}

// ── Mängitud mängu kaart (avaneb boxscore'iks) ─────────────────
function PastGameCard({ event, stats, isOpen, onToggle }) {
  const home = isHome(event)
  const opponent = home ? event.awayTeam?.name : event.homeTeam?.name
  const estScore = home ? event.homeScore?.current : event.awayScore?.current
  const oppScore = home ? event.awayScore?.current : event.homeScore?.current
  const b = resultBadge(getResult(event))
  const clickable = !!stats

  return (
    <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 14, boxShadow: CARD_SHADOW, overflow: 'hidden' }}>
      <div
        onClick={clickable ? onToggle : undefined}
        style={{
          padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, cursor: clickable ? 'pointer' : 'default', userSelect: 'none', transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (clickable) e.currentTarget.style.background = '#f9fafb' }}
        onMouseLeave={e => { if (clickable) e.currentTarget.style.background = 'transparent' }}
      >
        <div style={{ minWidth: 0, textAlign: 'left' }}>
          <div style={{ fontFamily: FONT_HEADING, fontSize: '1.3rem', color: DARK, letterSpacing: 0.5 }}>
            vs <TeamFlag name={opponent} size={22} style={{ verticalAlign: -2, margin: '0 3px', border: '1px solid rgba(8,6,13,0.12)' }} />
            {opponent}
            <span style={{ fontSize: '1.55rem', color: b.color, letterSpacing: 1, marginLeft: 12 }}>
              {estScore}–{oppScore}
            </span>
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: '0.7rem', color: GRAY, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {shortTournament(event.tournament?.name)} · {formatDate(event.startTimestamp)}
            {!home && ' · võõrsil'}
          </div>
        </div>
        <div style={{ width: 14, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
          {clickable && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GRAY} strokeWidth="2.5"
              style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </div>
      </div>

      {clickable && isOpen && (
        <div style={{ overflowX: 'auto', borderTop: '1px solid #f3f4f6' }}>
          {stats.quarters?.length > 0 && (
            <div style={{ padding: '14px 18px', background: DARK, display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                      <span style={{ fontFamily: FONT_HEADING, fontSize: '1rem', color: TEXT, letterSpacing: 0.5 }}>{q[row.key]}</span>
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

// ── Tulevase mängu kaart ───────────────────────────────────────
function FutureGameCard({ event }) {
  const home = isHome(event)
  const opponent = home ? event.awayTeam?.name : event.homeTeam?.name

  return (
    <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 14, boxShadow: CARD_SHADOW, padding: '14px 18px', textAlign: 'left' }}>
      <div style={{ fontFamily: FONT_HEADING, fontSize: '1.3rem', color: DARK, letterSpacing: 0.5 }}>
        vs <TeamFlag name={opponent} size={22} style={{ verticalAlign: -2, margin: '0 3px', border: '1px solid rgba(8,6,13,0.12)' }} />
        {opponent}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: '0.7rem', color: GRAY, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {formatShortDate(event.startTimestamp)}
        {event.timeTBD ? ' · aeg selgub' : ` · ${formatTime(event.startTimestamp)}`}
        {' · '}{shortTournament(event.tournament?.name)} · {home ? 'Kodus' : 'Võõrsil'}
      </div>
    </div>
  )
}

// ── Mängija statistika tabel (boxscore'i osa, tume) ────────────
function PlayerStatsTable({ teamLabel, players, accent }) {
  if (!players?.length) return null
  return (
    <div>
      <div style={{ padding: '14px 18px 8px' }}>
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
              <th key={h} style={{ padding: '6px 10px', textAlign: h === 'Mängija' ? 'left' : 'center', color: GRAY, fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((p, pi) => (
            <tr key={pi} style={{ borderTop: '1px solid #f3f4f6' }}
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
              <td style={{ padding: '8px 10px', textAlign: 'center', color: parseInt(p.pm) > 0 ? WIN : parseInt(p.pm) < 0 ? LOSS : '#6b7280', fontWeight: 600 }}>{p.pm}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Teekond — mängitud ja tulevased mängud ühel lipujoonel ─────
function TimelineSection({ recent, upcoming, gameStats, loading, reducedMotion }) {
  const [openId, setOpenId] = useState(null)
  const statsById = useMemo(
    () => Object.fromEntries(gameStats.map(g => [g.id, g])),
    [gameStats]
  )
  // aeg voolab mööda lippu ülevalt alla: vanimad üleval, tulevased all
  const past = useMemo(
    () => [...recent].sort((a, b) => a.startTimestamp - b.startTimestamp),
    [recent]
  )
  const future = useMemo(
    () => [...upcoming].sort((a, b) => a.startTimestamp - b.startTimestamp),
    [upcoming]
  )

  const reveal = reducedMotion ? {} : {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' },
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[...Array(5)].map((_, i) => <Skeleton key={i} style={{ height: 68 }} />)}
      </div>
    )
  }
  if (!past.length && !future.length) {
    return <p style={{ fontFamily: FONT_BODY, color: GRAY, fontWeight: 600 }}>Mängude info puudub.</p>
  }

  const nextGame = future[0]
  const daysToNext = nextGame
    ? Math.max(0, Math.ceil((nextGame.startTimestamp * 1000 - Date.now()) / 86400000))
    : null

  const rowStyle = { display: 'flex', alignItems: 'flex-start', gap: 16 }

  return (
    <div style={{ position: 'relative' }}>
      {/* Lipujoon — Eesti lipp voolab ajas ülevalt alla */}
      <div style={{
        position: 'absolute', left: 12, top: 14, bottom: 14, width: 4, borderRadius: 2,
        background: `linear-gradient(180deg, ${BLUE} 0%, #0a0a1a 55%, #ffffff 100%)`,
        boxShadow: '0 0 0 1px rgba(8,6,13,0.08)',
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
        {past.map(ev => (
          <motion.div key={ev.id} {...reveal} style={rowStyle}>
            <TimelineNode type="past" result={getResult(ev)} reducedMotion={reducedMotion} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <PastGameCard
                event={ev}
                stats={statsById[ev.id]}
                isOpen={openId === ev.id}
                onToggle={() => setOpenId(openId === ev.id ? null : ev.id)}
              />
            </div>
          </motion.div>
        ))}

        {/* PRAEGU */}
        <motion.div {...reveal} style={{ ...rowStyle, alignItems: 'center', padding: '6px 0' }}>
          <TimelineNode type="now" reducedMotion={reducedMotion} />
          <div style={{ textAlign: 'left' }}>
            <span style={{
              fontFamily: FONT_BODY, color: BLUE, fontWeight: 700,
              fontSize: '0.72rem', letterSpacing: '0.22em', textTransform: 'uppercase',
            }}>
              Praegu
            </span>
            <span style={{ fontFamily: FONT_BODY, color: GRAY, fontWeight: 600, fontSize: '0.8rem', marginLeft: 12 }}>
              {nextGame
                ? (daysToNext === 0 ? 'Mängupäev!' : `Järgmine mäng ${daysToNext} päeva pärast`)
                : 'Järgmist mängu pole veel kinnitatud'}
            </span>
          </div>
        </motion.div>

        {future.map(ev => (
          <motion.div key={ev.id} {...reveal} style={rowStyle}>
            <TimelineNode type="future" reducedMotion={reducedMotion} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <FutureGameCard event={ev} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ── Grupiseis (sticky parem veerg) ─────────────────────────────
function GroupStandings({ standings, loading, isMobile }) {
  if (loading) return <Skeleton style={{ height: 220 }} />
  if (!standings.rows?.length) return null

  const COLS = ['#', 'Meeskond', 'V', 'K', 'Pts']
  const groupLabel = standings.name?.replace('Group ', 'Grupp ') ?? null

  return (
    <div style={{ position: isMobile ? 'static' : 'sticky', top: 96 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <h2 style={{ fontFamily: FONT_HEADING, fontSize: '1.6rem', color: DARK, letterSpacing: 1, margin: 0 }}>
          Grupi seis
        </h2>
        {groupLabel && (
          <span style={{
            fontFamily: FONT_BODY, fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', background: '#f3f4f6', color: '#6b7280',
            borderRadius: 20, padding: '3px 10px',
          }}>
            {groupLabel}
          </span>
        )}
      </div>

      <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 14, boxShadow: CARD_SHADOW, overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '30px 1fr 34px 34px 44px',
          padding: '8px 14px', background: '#f9fafb', borderBottom: '1px solid #f3f4f6',
        }}>
          {COLS.map(h => (
            <span key={h} style={{
              fontFamily: FONT_BODY, fontSize: '0.64rem', fontWeight: 700,
              color: GRAY, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              {h}
            </span>
          ))}
        </div>

        {standings.rows.map((row, i) => {
          const est = row.team?.name === 'Estonia'
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '30px 1fr 34px 34px 44px', alignItems: 'center',
              padding: '11px 14px',
              borderBottom: i < standings.rows.length - 1 ? '1px solid #f3f4f6' : 'none',
              background: est ? 'rgba(0,114,206,0.05)' : 'transparent',
            }}>
              <span style={{ fontFamily: FONT_BODY, fontWeight: 700, color: est ? BLUE : GRAY, fontSize: '0.875rem' }}>
                {row.position}
              </span>
              <span style={{
                fontFamily: FONT_BODY, fontWeight: est ? 700 : 600,
                color: est ? BLUE : DARK, fontSize: '0.875rem',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {est ? 'Eesti' : row.team?.name}
              </span>
              <span style={{ fontFamily: FONT_BODY, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                {row.wins}
              </span>
              <span style={{ fontFamily: FONT_BODY, fontWeight: 600, color: GRAY, fontSize: '0.875rem' }}>
                {row.losses}
              </span>
              <span style={{ fontFamily: FONT_HEADING, fontSize: '1.15rem', color: est ? BLUE : '#374151' }}>
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
  const [standings, setStandings] = useState({ name: null, rows: [] })
  const [gameStats, setGameStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error] = useState(null)
  const { signalReady } = useLoading()
  const isMobile = useIsMobile()
  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []
  )

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
    <div style={{
      width: '100vw', marginLeft: 'calc(50% - 50vw)',
      background: 'white', minHeight: '100vh',
    }}>
      <MatchupHero
        upcoming={upcoming} recent={recent} standings={standings}
        loading={loading} reducedMotion={reducedMotion} isMobile={isMobile}
      />

      <div style={{ maxWidth: 1120, width: '100%', boxSizing: 'border-box', margin: '0 auto', padding: '48px 24px 72px' }}>

        {error && (
          <p style={{ fontFamily: FONT_BODY, color: LOSS, textAlign: 'center', padding: '40px 0' }}>
            {error}
          </p>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 320px',
          gap: 48,
          alignItems: 'start',
        }}>
          <section>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, margin: '0 0 20px' }}>
              <h2 style={{ fontFamily: FONT_HEADING, fontSize: '1.6rem', color: DARK, letterSpacing: 1, margin: 0 }}>
                Teekond
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
            <TimelineSection
              recent={recent} upcoming={upcoming} gameStats={gameStats}
              loading={loading} reducedMotion={reducedMotion}
            />
          </section>

          <GroupStandings standings={standings} loading={loading} isMobile={isMobile} />
        </div>
      </div>
    </div>
  )
}
