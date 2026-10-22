import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useLoading } from '../contexts/LoadingContext'
import Seo from '../components/Seo'
import PlayerAvatar from '../components/PlayerAvatar'
import Skeleton from '../components/Skeleton'
import useIsMobile from '../hooks/useIsMobile'
import useHydrated from '../hooks/useHydrated'
import scheduleData from '../data/klubide_graafikud_2026-27.json'
import { buildScheduleRows, upcomingRows, nextRowAfter, competitionLabel } from '../utils/clubSchedule'

const EASE = [0.22, 1, 0.36, 1]

const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"
const BLUE = '#0072ce'
const DARK = '#08060d'
const GRAY = '#9ca3af'
const MUTED = '#8a97ac'
const WIN = '#16a34a'
const LOSS = '#dc2626'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const TWO_WEEKS = 14 * 86400

// Mängijad, kelle mänge klubikorvpalli lehel ei näidata (tulemused ega ajakava).
// Henri Veesaar: vigastus, 2026-27 hooaeg. Naasmisel eemalda siit.
const HIDDEN_PLAYERS = new Set(['henri-veesaar'])

function tallinDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('sv-SE', { timeZone: 'Europe/Tallinn' })
}

function formatDateHeader(ts) {
  return new Date(ts * 1000).toLocaleDateString('et-EE', {
    weekday: 'long', day: 'numeric', month: 'long',
    timeZone: 'Europe/Tallinn',
  })
}

function formatShortDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('et-EE', {
    day: 'numeric', month: 'short',
    timeZone: 'Europe/Tallinn',
  })
}

function formatTime(ts) {
  return new Date(ts * 1000).toLocaleTimeString('et-EE', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Tallinn',
  })
}

function parseProballersDate(str) {
  if (!str) return null
  const t = new Date(str).getTime()
  return Number.isFinite(t) ? Math.floor(t / 1000) : null
}

function shortTournament(name) {
  if (!name) return ''
  if (name.includes('Champions League')) return 'BCL'
  if (name.includes('EuroLeague')) return 'EL'
  if (name.includes('EuroCup')) return 'EC'
  if (name.includes('Baltic Basketball League') || name.includes('BBL')) return 'BBL'
  if (name.includes('NBA')) return 'NBA'
  if (name.includes('Friendly')) return 'Sõprusmäng'
  return name.length > 20 ? name.slice(0, 18) + '…' : name
}

// ── Game row ──────────────────────────────────────────────────────────────────
// ProBallersi mängurea veerud tabloo ribal, vasakult paremale.
// `alt`: ProBallersi vana veerunimi, mis on alles DB-s olevatel vanematel ridadel.
const STAT_COLS = [
  { key: 'MIN', label: 'MIN' },
  { key: 'PTS', label: 'PTS' },
  { key: '2PM-2PA', alt: '2M-2A', label: '2P' },
  { key: '3PM-3PA', alt: '3M-3A', label: '3P' },
  { key: 'FTM-FTA', alt: '1M-1A', label: 'FT' },
  { key: 'FG%', label: 'FG%' },
  { key: 'REB', label: 'REB' },
  { key: 'AST', label: 'AST' },
  { key: 'STL', label: 'STL' },
  { key: 'BLK', label: 'BLK' },
  { key: 'TO', label: 'TO' },
  { key: 'FO', label: 'FO' },
  { key: 'EFF', label: 'EFF' },
  { key: '+/-', label: '+/-' },
]

function statValue(v) {
  if (v == null) return '–'
  const str = String(v).trim()
  return str === '' || str === '-' ? '–' : str
}

function GameRow({ player, event: ev, isPast, stats, result, playerIsHome, index }) {
  const isMobile = useIsMobile()
  const reduce = useReducedMotion()
  // Üks orkestreeritud sisenemine: esimesed read tulevad järjest, ülejäänud kohe.
  const enterDelay = index < 15 ? index * 0.04 : 0
  const profileHref = `/mangijad/${player.slug}`
  const home = ev.homeTeam?.name || '?'
  const away = ev.awayTeam?.name || '?'
  const tournament = shortTournament(ev.tournament?.name)
  const ts = ev.startTimestamp
  const hs = ev.homeScore?.current
  const as_ = ev.awayScore?.current
  const hasScore = isPast && hs != null && as_ != null

  // Võit/kaotus: esmalt ProBallersi W/L veerg, selle puudumisel skoorist.
  let won = null
  if (result === 'W') won = true
  else if (result === 'L') won = false
  else if (hasScore && hs !== as_) won = playerIsHome ? hs > as_ : as_ > hs

  const clubName = playerIsHome ? home : away
  const outcome = hasScore ? (won == null ? 'Lõpp' : won ? 'Võit' : 'Kaotus') : null
  const venue = playerIsHome ? 'kodus' : 'võõrsil'
  const scoreColor = won == null ? DARK : won ? WIN : LOSS

  const teamStyle = own => ({
    fontFamily: FONT_HEADING, fontSize: '1.15rem', letterSpacing: '0.5px', lineHeight: 1.1,
    color: own ? DARK : '#6b7280',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
  })
  const metaStyle = { fontFamily: FONT_BODY, fontSize: '0.8rem', color: GRAY, fontWeight: 600, lineHeight: 1.2 }

  const avatar = (
    <Link
      to={profileHref}
      aria-label={`${player.name} profiil`}
      className="shrink-0 self-start rounded-full transition-transform duration-300 ease-out hover:scale-[1.05] motion-reduce:hover:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0072ce] focus-visible:outline-offset-2"
    >
      <PlayerAvatar slug={player.slug} name={player.name} size={isMobile ? 'md' : 'lg'} />
    </Link>
  )

  const playerBlock = (
    <div className="min-w-0">
      <Link
        to={profileHref}
        className="inline-block text-[#08060d] hover:text-[#0072ce] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0072ce] focus-visible:outline-offset-2 rounded"
        style={{ fontFamily: FONT_HEADING, fontSize: '1.45rem', letterSpacing: '0.5px', lineHeight: 1 }}
      >
        {player.name}
      </Link>
      <div className="flex items-baseline gap-2 mt-1" style={metaStyle}>
        {player.position && <span style={{ letterSpacing: '0.1em' }}>{player.position}</span>}
        <span style={{ color: '#6b7280' }}>{clubName}</span>
      </div>
    </div>
  )

  const gameBlock = (
    <div className={isMobile ? 'min-w-0' : 'min-w-0 text-right'}>
      <div className="flex items-baseline gap-2" style={{ justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
        <span style={teamStyle(playerIsHome)}>{home}</span>
        {hasScore ? (
          ev.gameUrl ? (
            <a
              href={ev.gameUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Vaata mängu statistikat ProBallersis"
              style={{ fontFamily: FONT_HEADING, fontSize: '1.7rem', color: scoreColor, letterSpacing: '1px', lineHeight: 1, flexShrink: 0 }}
              className="rounded underline decoration-2 underline-offset-4 decoration-gray-300
                         transition-colors duration-150 hover:decoration-current
                         focus-visible:outline focus-visible:outline-2
                         focus-visible:outline-offset-2 focus-visible:outline-[#0072ce]"
            >
              {hs}:{as_}
            </a>
          ) : (
            <span style={{ fontFamily: FONT_HEADING, fontSize: '1.7rem', color: scoreColor, letterSpacing: '1px', lineHeight: 1, flexShrink: 0 }}>
              {hs}:{as_}
            </span>
          )
        ) : ts ? (
          <span style={{ fontFamily: FONT_HEADING, fontSize: '1.7rem', color: BLUE, letterSpacing: '1px', lineHeight: 1, flexShrink: 0 }}>
            {formatTime(ts)}
          </span>
        ) : (
          <span style={{ fontFamily: FONT_BODY, fontSize: '0.72rem', color: GRAY, fontWeight: 600 }}>vs</span>
        )}
        <span style={teamStyle(!playerIsHome)}>{away}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-1" style={{ ...metaStyle, justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
        <span style={outcome && won != null ? { color: scoreColor } : undefined}>
          {outcome ? `${outcome} ${venue}` : venue}
        </span>
        {tournament && (
          <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: '#f3f4f6', color: '#6b7280' }}>
            {tournament}
          </span>
        )}
      </div>
    </div>
  )

  // Tabloo riba: mängija boxscore
  const statsBar = stats && (
    <div className="overflow-x-auto rounded-lg" style={{ background: DARK }}>
      <div className="flex" style={{ minWidth: 'max-content' }}>
        {STAT_COLS.map((c, i) => {
          const isPts = c.key === 'PTS'
          return (
            <motion.div
              key={c.key}
              className="flex flex-col items-center px-2 py-1.5"
              style={{ flex: '1 0 auto', minWidth: 52, background: isPts ? BLUE : undefined }}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, delay: enterDelay + 0.15 + i * 0.025 }}
            >
              <span style={{ fontFamily: FONT_HEADING, fontSize: '1.35rem', color: '#fff', letterSpacing: '0.5px', lineHeight: 1, whiteSpace: 'nowrap' }}>
                {statValue(stats[c.key] ?? stats[c.alt])}
              </span>
              <span style={{ fontFamily: FONT_BODY, fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.08em', color: isPts ? '#dbeafe' : MUTED, marginTop: 2 }}>
                {c.label}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )

  const cardClass = 'px-4 py-4 rounded-2xl bg-white text-left border border-gray-200 transition-shadow duration-300 ease-out md:hover:shadow-[0_0_0_1px_#0072ce,0_8px_32px_rgba(0,114,206,0.22)]'
  const motionProps = {
    initial: reduce ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: EASE, delay: enterDelay },
    whileHover: reduce ? undefined : { scale: 1.015, transition: { duration: 0.25, ease: EASE } },
  }

  // Mobiilis kolm täislaiuses plokki: avatar + mängija, mäng kahe reana nagu
  // spordirakenduse tabelis (nimi vasakul, skoor paremal — pikad nimed ega
  // kolmetähelised lühendid ei riku rida), tabloo 7x2 ruudustikuna ilma kerimiseta.
  if (isMobile) {
    const ownScore = playerIsHome ? hs : as_
    const scoreStyle = own => ({
      fontFamily: FONT_HEADING, fontSize: '1.6rem', letterSpacing: '1px', lineHeight: 1, flexShrink: 0,
      color: own ? scoreColor : '#9ca3af',
    })
    const scoreLink = ev.gameUrl && (
      <a
        href={ev.gameUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Vaata mängu statistikat ProBallersis"
        style={scoreStyle(true)}
        className="rounded underline decoration-2 underline-offset-4 decoration-gray-300
                   transition-colors duration-150 hover:decoration-current
                   focus-visible:outline focus-visible:outline-2
                   focus-visible:outline-offset-2 focus-visible:outline-[#0072ce]"
      >
        {ownScore}
      </a>
    )
    const teamLine = (name, score, own) => (
      <div className="flex items-baseline justify-between gap-4">
        <span style={{
          fontFamily: FONT_HEADING, fontSize: '1.25rem', letterSpacing: '0.5px', lineHeight: 1.1,
          color: own ? DARK : '#6b7280', minWidth: 0, overflowWrap: 'anywhere',
        }}>
          {name}
        </span>
        {hasScore && (own && scoreLink ? scoreLink : <span style={scoreStyle(own)}>{score}</span>)}
      </div>
    )

    return (
      <motion.div className={`flex flex-col gap-3 ${cardClass}`} {...motionProps}>
        <div className="flex items-center gap-3 min-w-0">
          {avatar}
          {playerBlock}
        </div>

        <div className="flex flex-col gap-1.5">
          {teamLine(home, hs, playerIsHome)}
          {teamLine(away, as_, !playerIsHome)}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-1" style={metaStyle}>
            <span style={outcome && won != null ? { color: scoreColor } : undefined}>
              {outcome ? `${outcome} ${venue}` : ts ? `${formatTime(ts)} ${venue}` : venue}
            </span>
            {tournament && (
              <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                {tournament}
              </span>
            )}
          </div>
        </div>

        {stats && (
          <div className="rounded-lg overflow-hidden" style={{ background: DARK, display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {STAT_COLS.map((c, i) => {
              const isPts = c.key === 'PTS'
              return (
                <motion.div
                  key={c.key}
                  className="flex flex-col items-center py-2 px-0.5 min-w-0"
                  style={{
                    background: isPts ? BLUE : undefined,
                    borderTop: i >= 7 ? '1px solid rgba(255,255,255,0.08)' : undefined,
                  }}
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25, delay: enterDelay + 0.15 + i * 0.025 }}
                >
                  <span style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(0.95rem, 4.2vw, 1.3rem)', color: '#fff', lineHeight: 1, whiteSpace: 'nowrap' }}>
                    {statValue(stats[c.key] ?? stats[c.alt])}
                  </span>
                  <span style={{ fontFamily: FONT_BODY, fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.06em', color: isPts ? '#dbeafe' : MUTED, marginTop: 3 }}>
                    {c.label}
                  </span>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div className={`flex gap-4 ${cardClass}`} {...motionProps}>
      {avatar}
      <div className="min-w-0 flex-1 flex flex-col gap-3">
        {/* Ülemine rida: mängija ja mäng */}
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
          {playerBlock}
          {gameBlock}
        </div>
        {statsBar}
      </div>
    </motion.div>
  )
}

// ── Tulevase mängu kaart (ajakava) ────────────────────────────────────────────
// Erineb tulemuste kaardist tahtlikult: skoori asemel kellaaeg sinisel plaadil,
// tablood pole. Sama paigutus töölaual ja mobiilis — plaat on kitsas ja
// meeskonnanimed tohivad murduda.
function UpcomingGameRow({ row }) {
  const isMobile = useIsMobile()
  const { players, club, opponent, home, timeTBD, startTimestamp } = row
  const label = shortTournament(competitionLabel(row.competition))
  const teamStyle = own => ({
    fontFamily: FONT_HEADING, fontSize: '1.15rem', letterSpacing: '0.5px', lineHeight: 1.1,
    color: own ? DARK : '#6b7280', minWidth: 0, overflowWrap: 'anywhere',
  })

  return (
    <div className="flex flex-col gap-3 px-4 py-4 rounded-2xl bg-white text-left border border-gray-200">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex shrink-0">
          {players.map((p, i) => (
            <Link
              key={p.slug}
              to={`/mangijad/${p.slug}`}
              aria-label={`${p.name} profiil`}
              className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0072ce] focus-visible:outline-offset-2"
              style={{ marginLeft: i ? -14 : 0, zIndex: players.length - i, position: 'relative' }}
            >
              <PlayerAvatar slug={p.slug} name={p.name} size={isMobile ? 'md' : 'lg'} />
            </Link>
          ))}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap gap-x-2" style={{ fontFamily: FONT_HEADING, fontSize: '1.45rem', letterSpacing: '0.5px', lineHeight: 1 }}>
            {players.map((p, i) => (
              <Link
                key={p.slug}
                to={`/mangijad/${p.slug}`}
                className="text-[#08060d] hover:text-[#0072ce] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0072ce] focus-visible:outline-offset-2 rounded"
              >
                {p.name}{i < players.length - 1 ? ',' : ''}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2 mt-1" style={{ fontFamily: FONT_BODY, fontSize: '0.8rem', color: GRAY, fontWeight: 600, lineHeight: 1.2 }}>
            <span style={{ color: '#6b7280' }}>{club}</span>
            {label && <span>{label}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div
          className="shrink-0 flex items-center justify-center rounded-lg"
          style={{ minWidth: 84, padding: '10px 12px', background: '#e8f1fb' }}
        >
          {timeTBD ? (
            <span style={{ fontFamily: FONT_BODY, fontSize: '0.8rem', fontWeight: 700, color: BLUE, lineHeight: 1.1, textAlign: 'center' }}>
              aeg<br />selgub
            </span>
          ) : (
            <span style={{ fontFamily: FONT_HEADING, fontSize: '1.7rem', color: BLUE, letterSpacing: '1px', lineHeight: 1 }}>
              {formatTime(startTimestamp)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <span style={teamStyle(home)}>{home ? club : opponent}</span>
          <span style={teamStyle(!home)}>{home ? opponent : club}</span>
          <span style={{ fontFamily: FONT_BODY, fontSize: '0.8rem', color: GRAY, fontWeight: 600, lineHeight: 1.2 }}>
            {home ? 'Kodus' : 'Võõrsil'}{row.note ? `, ${row.note}` : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Parimad sooritused ────────────────────────────────────────────────────────
// Järjestus: EFF, siis punktid, siis uuem mäng. Igalt mängijalt üks (parim) mäng.
function compareStatlines(a, b) {
  return (b.eff - a.eff) || (b.pts - a.pts) || (b.ts - a.ts)
}

function pickTopPerformances(games, count = 3) {
  const bestByPlayer = new Map()
  for (const g of games) {
    const eff = parseFloat(g.stats?.EFF)
    if (!Number.isFinite(eff)) continue
    const entry = { game: g, eff, pts: parseFloat(g.stats.PTS) || 0, ts: g.event.startTimestamp || 0 }
    const current = bestByPlayer.get(g.player.slug)
    if (!current || compareStatlines(entry, current) < 0) bestByPlayer.set(g.player.slug, entry)
  }
  return [...bestByPlayer.values()].sort(compareStatlines).slice(0, count)
}

// Üks tabloo-paneel nagu mängurea statistikariba: esimene koht sinisel nagu
// PTS-lahter. Töölaual kolm veergu, mobiilis kolm kompaktset rida.
function TopPerformances({ entries, loading }) {
  const isMobile = useIsMobile()
  const reduce = useReducedMotion()
  const smallLabel = color => ({ fontFamily: FONT_BODY, fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.08em', color, marginTop: 2 })

  return (
    <section aria-labelledby="parimad-sooritused" className="mb-8 text-left">
      <h2 id="parimad-sooritused" style={{ fontFamily: FONT_HEADING, fontSize: '1.6rem', letterSpacing: '1px', lineHeight: 1, color: DARK }}>
        Parimad sooritused
      </h2>
      <p className="mt-1 mb-3" style={{ fontFamily: FONT_BODY, fontSize: '0.9rem', color: '#6b7280', fontWeight: 500 }}>
        Viimase kahe nädala kõrgeim efektiivsus (EFF), igalt mängijalt parim mäng
      </p>

      {loading ? (
        <Skeleton className={isMobile ? 'h-72' : 'h-52'} />
      ) : (
        <motion.ol
          role="list"
          className="rounded-2xl overflow-hidden"
          style={{ background: DARK, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : `repeat(${entries.length}, minmax(0, 1fr))` }}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          {entries.map(({ game }, i) => {
            const lead = i === 0
            const { player, event: ev, playerIsHome, stats } = game
            const ownScore = playerIsHome ? ev.homeScore?.current : ev.awayScore?.current
            const oppScore = playerIsHome ? ev.awayScore?.current : ev.homeScore?.current
            const club = playerIsHome ? ev.homeTeam?.name : ev.awayTeam?.name
            const opponent = playerIsHome ? ev.awayTeam?.name : ev.homeTeam?.name
            const won = game.result === 'W' ? true : game.result === 'L' ? false : ownScore !== oppScore ? ownScore > oppScore : null
            const outcome = won == null ? 'Lõpp' : won ? 'Võit' : 'Kaotus'
            const outcomeColor = lead ? '#fff' : won == null ? MUTED : won ? '#4ade80' : '#f87171'
            const muted = lead ? '#dbeafe' : MUTED
            const divider = '1px solid rgba(255,255,255,0.08)'

            return (
              <li
                key={player.slug}
                className="p-4"
                style={{
                  background: lead ? BLUE : undefined,
                  borderTop: i > 0 && isMobile ? divider : undefined,
                  borderLeft: i > 0 && !isMobile ? divider : undefined,
                  display: 'grid', columnGap: 12, rowGap: 14, alignItems: 'start',
                  gridTemplateColumns: isMobile ? 'auto auto minmax(0, 1fr) auto' : 'auto auto minmax(0, 1fr)',
                  gridTemplateAreas: isMobile ? '"rank avatar info eff"' : '"rank avatar eff" "info info info"',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ gridArea: 'rank', fontFamily: FONT_HEADING, fontSize: isMobile ? '1.9rem' : '2.6rem', lineHeight: 0.85, color: lead ? '#fff' : MUTED, minWidth: '1ch' }}
                >
                  {i + 1}
                </span>
                <div style={{ gridArea: 'avatar' }}>
                  <PlayerAvatar slug={player.slug} name={player.name} size={isMobile ? 'sm' : 'md'} />
                </div>
                <div className="flex flex-col items-end" style={{ gridArea: 'eff' }}>
                  <span style={{ fontFamily: FONT_HEADING, fontSize: isMobile ? '2.1rem' : '2.8rem', lineHeight: 0.9, color: '#fff', letterSpacing: '0.5px' }}>
                    {statValue(stats.EFF)}
                  </span>
                  <span style={smallLabel(muted)}>EFF</span>
                </div>

                <div className="min-w-0 flex flex-col gap-3" style={{ gridArea: 'info' }}>
                  <div className="min-w-0">
                    <Link
                      to={`/mangijad/${player.slug}`}
                      className="text-white rounded decoration-2 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                      style={{ fontFamily: FONT_HEADING, fontSize: isMobile ? '1.3rem' : '1.45rem', letterSpacing: '0.5px', lineHeight: 1, overflowWrap: 'anywhere' }}
                    >
                      {player.name}
                    </Link>
                    <div style={{ fontFamily: FONT_BODY, fontSize: '0.8rem', fontWeight: 600, color: muted, marginTop: 4, lineHeight: 1.2 }}>
                      {club}
                    </div>
                  </div>
                  <div className="flex gap-5">
                    {['PTS', 'REB', 'AST'].map(k => (
                      <div key={k} className="flex flex-col">
                        <span style={{ fontFamily: FONT_HEADING, fontSize: '1.35rem', color: '#fff', letterSpacing: '0.5px', lineHeight: 1 }}>
                          {statValue(stats[k])}
                        </span>
                        <span style={smallLabel(muted)}>{k}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: '0.8rem', fontWeight: 600, color: muted, lineHeight: 1.2 }}>
                    <span style={{ color: outcomeColor }}>{outcome} {ownScore}:{oppScore}</span>
                    {' '}vs {opponent}, {formatShortDate(ev.startTimestamp)}
                  </div>
                </div>
              </li>
            )
          })}
        </motion.ol>
      )}
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function KlubiKorvpallPage() {
  const [tab, setTab] = useState('tulemused')
  const [players, setPlayers] = useState([])
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadedCount, setLoadedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState(false)
  const { signalReady } = useLoading()

  // Ajakava sõltub kellast: arvutame alles pärast mount'i (eelrenderdus ja
  // klient peavad esimesel renderdusel kokku langema) ja uuendame iga minut,
  // et mäng kaoks nimekirjast täpselt algusajal ka ilma lehte värskendamata.
  const hydrated = useHydrated()
  const [now, setNow] = useState(null)
  useEffect(() => {
    if (!hydrated) return
    const tick = () => setNow(Math.floor(Date.now() / 1000))
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [hydrated])

  const scheduleRows = useMemo(() => buildScheduleRows(scheduleData, players), [players])
  const upcoming = useMemo(() => (now ? upcomingRows(scheduleRows, now) : []), [scheduleRows, now])
  const nextAfterWindow = useMemo(() => (now ? nextRowAfter(scheduleRows, now) : null), [scheduleRows, now])
  const topPerformances = useMemo(() => pickTopPerformances(games), [games])

  useEffect(() => {
    fetch(`${API}/players`)
      .then(r => r.json())
      .then(allPlayers => {
        const players = allPlayers.filter(p => !HIDDEN_PLAYERS.has(p.slug))
        setPlayers(players)
        const active = players.filter(p => p.proballers_id)
        setTotalCount(active.length)
        const cutoff = Date.now() / 1000 - TWO_WEEKS

        const promises = active.map(async player => {
          const rows = []

          const pbData = await fetch(`${API}/players/${player.slug}/stats`)
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
          const clubName = pbData?.seasons?.at(-1)?.TEAM || null
          for (const g of pbData?.clubGames || []) {
            const startTimestamp = parseProballersDate(g.DATE)
            if (!startTimestamp || startTimestamp < cutoff) continue
            const opponentField = (g.OPPONENT || '').trim()
            const isHome = opponentField.startsWith('vs')
            const opponentCode = opponentField.replace(/^(@|vs)\s*/, '') || '?'
            const [s1, s2] = (g.SCORE || '').split('-').map(n => parseInt(n, 10))
            if (!Number.isFinite(s1) || !Number.isFinite(s2)) continue
            rows.push({
              player,
              isPast: true,
              stats: g,
              result: (g.RESULT || '').trim().toUpperCase(),
              playerIsHome: isHome,
              event: {
                id: `pb-${player.slug}-${g.DATE}-${opponentField}`,
                startTimestamp,
                homeTeam: { name: isHome ? (clubName || 'Kodu') : opponentCode },
                awayTeam: { name: isHome ? opponentCode : (clubName || 'Võõrsil') },
                tournament: { name: g.LEAGUE },
                homeScore: { current: s1 },
                awayScore: { current: s2 },
                // Puudub vanematel ridadel, mis on juba DB-s ja ProBallersi
                // profiililt kadunud. Skoor renderdatakse siis lihtsalt lingita.
                gameUrl: g.GAME_URL || null,
              },
            })
          }

          setLoadedCount(c => c + 1)
          return rows
        })

        Promise.allSettled(promises).then(results => {
          const all = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
          all.sort((a, b) => (b.event.startTimestamp || 0) - (a.event.startTimestamp || 0))
          setGames(all)
          setLoading(false)
          signalReady()
        })
      })
      .catch(() => {
        setError(true)
        setLoading(false)
        signalReady()
      })
  }, [])

  // Group by Tallinn date
  const grouped = []
  const groupMap = {}
  for (const g of games) {
    const ts = g.event.startTimestamp
    if (!ts) continue
    const key = tallinDate(ts)
    if (!groupMap[key]) {
      const group = { dateKey: key, ts, rows: [] }
      groupMap[key] = group
      grouped.push(group)
    }
    groupMap[key].rows.push(g)
  }

  // Find today's date key to insert divider
  const todayKey = tallinDate(Date.now() / 1000)

  // Ajakava päevade kaupa (Eesti kuupäev), sama päisestiil mis tulemustel
  const scheduleGrouped = useMemo(() => {
    const groups = []
    const byKey = {}
    for (const row of upcoming) {
      const key = tallinDate(row.sortTimestamp)
      if (!byKey[key]) {
        byKey[key] = { dateKey: key, ts: row.sortTimestamp, rows: [] }
        groups.push(byKey[key])
      }
      byKey[key].rows.push(row)
    }
    return groups
  }, [upcoming])

  return (
    <div className="px-4 sm:px-6 pt-8 pb-12 max-w-5xl mx-auto text-center">
      <Seo
        title="Eesti korvpallurid klubides"
        path="/klubikorvpall"
        breadcrumbs={[{ name: 'Klubikorvpall' }]}
        description={
          'Eesti koondislaste mängud klubides üle maailma. Tulemused ja statistika ' +
          'päevade kaupa, kes kus ja kui hästi mängis.'
        }
      />

      {/* Header */}
      <div className="mb-8">
        <h1 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: DARK, letterSpacing: '2px', lineHeight: 1 }}>
          Klubikorvpall
        </h1>
        <p style={{ fontFamily: FONT_BODY, fontSize: '1.05rem', color: '#6b7280', fontWeight: 500, marginTop: 6 }}>
          Eesti koondislaste mängud klubides üle maailma
        </p>
      </div>

      {!error && (loading || topPerformances.length > 0) && (
        <TopPerformances entries={topPerformances} loading={loading} />
      )}

      {/* Vaate valik: kaks pealkirjasõna, aktiivsel sinine alajoon nagu navigatsioonil */}
      <div role="tablist" aria-label="Vaade" className="flex gap-6 mb-6 border-b border-gray-200 text-left">
        {[['tulemused', 'Tulemused'], ['ajakava', 'Ajakava']].map(([key, text]) => {
          const active = tab === key
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(key)}
              className="relative pb-2 cursor-pointer transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0072ce] focus-visible:outline-offset-2 rounded-sm"
              style={{ fontFamily: FONT_HEADING, fontSize: '1.6rem', letterSpacing: '1px', lineHeight: 1, color: active ? DARK : GRAY, background: 'none', border: 0, padding: '0 0 8px' }}
            >
              {text}
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 -bottom-px h-[3px] rounded-full transition-opacity duration-200"
                style={{ background: BLUE, opacity: active ? 1 : 0 }}
              />
            </button>
          )
        })}
      </div>

      {tab === 'ajakava' && (
        <>
          {error && !players.length && (
            <p className="text-center py-16" style={{ fontFamily: FONT_BODY, color: '#9ca3af' }}>
              Mängijate laadimine ebaõnnestus. Proovi hiljem uuesti.
            </p>
          )}

          {!error && (!hydrated || !now || (loading && !players.length)) && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          )}

          {now && players.length > 0 && upcoming.length === 0 && (
            <div className="text-center py-20 rounded-3xl" style={{ background: '#f8fafc' }}>
              <p style={{ fontFamily: FONT_HEADING, fontSize: '2rem', color: '#d1d5db', letterSpacing: '1px' }}>
                LÄHIAJAL MÄNGE EI OLE
              </p>
              <p className="mt-3" style={{ fontFamily: FONT_BODY, fontSize: '1rem', color: '#9ca3af' }}>
                {nextAfterWindow
                  ? `Järgmise kahe nädala jooksul mänge ei ole. Järgmine mäng on ${formatDateHeader(nextAfterWindow.sortTimestamp)}: ${nextAfterWindow.club} vs ${nextAfterWindow.opponent}.`
                  : 'Ajakavas pole ühtki tulevast mängu.'}
              </p>
            </div>
          )}

          {now && scheduleGrouped.map(group => (
            <div key={group.dateKey} className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold tracking-widest uppercase" style={{ fontFamily: FONT_BODY, color: group.dateKey === todayKey ? BLUE : '#9ca3af' }}>
                  {group.dateKey === todayKey ? 'Täna, ' : ''}{formatDateHeader(group.ts)}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="flex flex-col gap-2">
                {group.rows.map(row => <UpcomingGameRow key={row.id} row={row} />)}
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'tulemused' && (<>
      {/* Loading progress */}
      {loading && totalCount > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontFamily: FONT_BODY, fontSize: '0.8rem', color: '#9ca3af' }}>
              Laaditakse mängijate mänge...
            </span>
            <span style={{ fontFamily: FONT_BODY, fontSize: '0.8rem', color: '#9ca3af' }}>
              {loadedCount}/{totalCount}
            </span>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${totalCount > 0 ? (loadedCount / totalCount) * 100 : 0}%`, background: BLUE }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-center py-16" style={{ fontFamily: FONT_BODY, color: '#9ca3af' }}>
          Mängude laadimine ebaõnnestus. Proovi hiljem uuesti.
        </p>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      )}

      {/* No games */}
      {!loading && !error && games.length === 0 && (
        <div className="text-center py-20 rounded-3xl" style={{ background: '#f8fafc' }}>
          <p style={{ fontFamily: FONT_HEADING, fontSize: '2rem', color: '#d1d5db', letterSpacing: '1px' }}>
            MÄNGE EI LEITUD
          </p>
          <p className="mt-3" style={{ fontFamily: FONT_BODY, fontSize: '1rem', color: '#9ca3af' }}>
            Viimase kahe nädala jooksul mänge ei toimunud
          </p>
        </div>
      )}

      {/* Grouped timeline */}
      {!loading && grouped.map((group, gi) => {
        const rowOffset = grouped.slice(0, gi).reduce((n, g) => n + g.rows.length, 0)
        const isPastGroup = group.dateKey < todayKey
        const isTodayGroup = group.dateKey === todayKey
        // Show "TÄNA" divider before today's group or before first future group after past groups
        const prevGroup = grouped[gi - 1]
        const showDivider = isTodayGroup || (!isPastGroup && prevGroup && prevGroup.dateKey < todayKey)

        return (
          <div key={group.dateKey}>
            {showDivider && (
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase"
                  style={{ fontFamily: FONT_BODY, background: BLUE, color: '#fff' }}
                >
                  Täna
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ fontFamily: FONT_BODY, color: isPastGroup ? '#d1d5db' : '#9ca3af' }}
                >
                  {formatDateHeader(group.ts)}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="flex flex-col gap-2">
                {group.rows.map((g, i) => (
                  <GameRow
                    key={`${g.player.slug}-${g.event.id ?? i}`}
                    player={g.player} event={g.event} isPast={g.isPast}
                    stats={g.stats} result={g.result} playerIsHome={g.playerIsHome}
                    index={rowOffset + i}
                  />
                ))}
              </div>
            </div>
          </div>
        )
      })}
      </>)}
    </div>
  )
}
