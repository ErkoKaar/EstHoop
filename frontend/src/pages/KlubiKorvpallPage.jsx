import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useLoading } from '../contexts/LoadingContext'
import Seo from '../components/Seo'
import PlayerAvatar from '../components/PlayerAvatar'
import Skeleton from '../components/Skeleton'
import useIsMobile from '../hooks/useIsMobile'

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

function tallinDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('sv-SE', { timeZone: 'Europe/Tallinn' })
}

function formatDateHeader(ts) {
  return new Date(ts * 1000).toLocaleDateString('et-EE', {
    weekday: 'long', day: 'numeric', month: 'long',
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
const STAT_COLS = [
  { key: 'MIN', label: 'MIN' },
  { key: 'PTS', label: 'PTS' },
  { key: '2M-2A', label: '2P' },
  { key: '3M-3A', label: '3P' },
  { key: '1M-1A', label: 'FT' },
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

  return (
    <motion.div
      className="flex gap-4 px-4 py-4 rounded-2xl bg-white text-left border border-gray-200 transition-shadow duration-300 ease-out hover:shadow-[0_0_0_1px_#0072ce,0_8px_32px_rgba(0,114,206,0.22)]"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE, delay: enterDelay }}
      whileHover={reduce ? undefined : { scale: 1.015, transition: { duration: 0.25, ease: EASE } }}
    >
      <Link
        to={profileHref}
        aria-label={`${player.name} profiil`}
        className="shrink-0 self-start rounded-full transition-transform duration-300 ease-out hover:scale-[1.05] motion-reduce:hover:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0072ce] focus-visible:outline-offset-2"
      >
        <PlayerAvatar slug={player.slug} name={player.name} size={isMobile ? 'md' : 'lg'} />
      </Link>

      <div className="min-w-0 flex-1 flex flex-col gap-3">
        {/* Ülemine rida: mängija ja mäng */}
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
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
            <div className="flex items-center gap-2 mt-1" style={{ ...metaStyle, justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
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
        </div>

        {/* Tabloo riba: mängija boxscore */}
        {stats && (
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
                      {statValue(stats[c.key])}
                    </span>
                    <span style={{ fontFamily: FONT_BODY, fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.08em', color: isPts ? '#dbeafe' : MUTED, marginTop: 2 }}>
                      {c.label}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function KlubiKorvpallPage() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadedCount, setLoadedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState(false)
  const { signalReady } = useLoading()

  useEffect(() => {
    fetch(`${API}/players`)
      .then(r => r.json())
      .then(players => {
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
          all.sort((a, b) => (a.event.startTimestamp || 0) - (b.event.startTimestamp || 0))
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

  return (
    <div className="pt-8 pb-12 text-center">
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
    </div>
  )
}
