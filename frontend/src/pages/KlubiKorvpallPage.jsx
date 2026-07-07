import { useEffect, useState } from 'react'
import { useLoading } from '../contexts/LoadingContext'
import PlayerAvatar from '../components/PlayerAvatar'
import Skeleton from '../components/Skeleton'

const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"
const BLUE = '#0072ce'
const DARK = '#08060d'

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
function GameRow({ player, event: ev, isPast, stats }) {
  const home = ev.homeTeam?.name || '?'
  const away = ev.awayTeam?.name || '?'
  const tournament = shortTournament(ev.tournament?.name)
  const ts = ev.startTimestamp
  const hs = ev.homeScore?.current
  const as_ = ev.awayScore?.current
  const hasScore = isPast && hs != null && as_ != null

  const teamNameStyle = {
    fontFamily: FONT_HEADING, fontSize: '1.15rem', color: DARK, letterSpacing: '0.5px', lineHeight: 1.1,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  }

  return (
    <div
      className="grid items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-gray-100 hover:shadow-md transition-shadow duration-200"
      style={{ gridTemplateColumns: '190px 1px minmax(0, 1fr) 104px 84px', minWidth: 640 }}
    >
      {/* Player */}
      <div className="flex items-center gap-3 min-w-0">
        <PlayerAvatar slug={player.slug} name={player.name} size="sm" />
        <div className="min-w-0">
          <div style={{ fontFamily: FONT_HEADING, fontSize: '1.1rem', color: DARK, letterSpacing: '0.5px', lineHeight: 1.1 }}>
            {player.name}
          </div>
          {player.position && (
            <div style={{ fontFamily: FONT_BODY, fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.1em' }}>
              {player.position}
            </div>
          )}
          {stats && (
            <div style={{ fontFamily: FONT_BODY, fontSize: '0.85rem', color: DARK, fontWeight: 700, marginTop: 3, whiteSpace: 'nowrap' }}>
              {stats.points ?? 0} PTS · {stats.rebounds ?? 0} REB · {stats.assists ?? 0} AST
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-8 bg-gray-100" />

      {/* Match */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
        <span style={{ ...teamNameStyle, textAlign: 'right' }}>{home}</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600 }}>vs</span>
        <span style={{ ...teamNameStyle, textAlign: 'left' }}>{away}</span>
      </div>

      {/* Tournament badge */}
      <div className="flex justify-center">
        {tournament && (
          <span
            className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-center"
            style={{ fontFamily: FONT_BODY, background: '#f3f4f6', color: '#6b7280' }}
          >
            {tournament}
          </span>
        )}
      </div>

      {/* Score or time */}
      <div className="text-right">
        {hasScore ? (
          <>
            <div style={{ fontFamily: FONT_HEADING, fontSize: '1.4rem', color: '#374151', letterSpacing: '2px', lineHeight: 1 }}>
              {hs}:{as_}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: '0.68rem', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.08em' }}>
              Lõpp
            </div>
          </>
        ) : ts ? (
          <>
            <div style={{ fontFamily: FONT_HEADING, fontSize: '1.4rem', color: BLUE, letterSpacing: '1px', lineHeight: 1 }}>
              {formatTime(ts)}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: '0.68rem', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.08em' }}>
              Eesti aeg
            </div>
          </>
        ) : null}
      </div>
    </div>
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
              stats: {
                points: parseInt(g.PTS, 10) || 0,
                rebounds: parseInt(g.REB, 10) || 0,
                assists: parseInt(g.AST, 10) || 0,
              },
              event: {
                id: `pb-${player.slug}-${g.DATE}-${opponentField}`,
                startTimestamp,
                homeTeam: { name: isHome ? (clubName || 'Kodu') : opponentCode },
                awayTeam: { name: isHome ? opponentCode : (clubName || 'Võõrsil') },
                tournament: { name: g.LEAGUE },
                homeScore: { current: s1 },
                awayScore: { current: s2 },
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
    <div className="pb-12">
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
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
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
              <div className="flex flex-col gap-2 overflow-x-auto">
                {group.rows.map((g, i) => (
                  <GameRow key={`${g.player.slug}-${g.event.id ?? i}`} player={g.player} event={g.event} isPast={g.isPast} stats={g.stats} />
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
