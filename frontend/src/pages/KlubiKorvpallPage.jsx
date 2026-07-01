import { useEffect, useState } from 'react'
import { useLoading } from '../contexts/LoadingContext'

const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"
const BLUE = '#0072ce'
const DARK = '#08060d'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
const SS_URL = (id) => `https://api.sofascore.com/api/v1/player/${id}/events/next/0`

function tallinDate(ts) {
  // Returns YYYY-MM-DD in Tallinn timezone for grouping
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

// ── Player avatar ─────────────────────────────────────────────────────────────
function PlayerAvatar({ player }) {
  const [imgFailed, setImgFailed] = useState(false)
  const initials = player.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden shadow-sm" style={{ background: BLUE }}>
      {!imgFailed ? (
        <img
          src={`/players/${player.slug}.jpg`}
          alt={player.name}
          className="w-full h-full object-cover object-top"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span style={{ fontFamily: FONT_HEADING, fontSize: '0.95rem', color: '#fff' }}>{initials}</span>
        </div>
      )}
    </div>
  )
}

// ── Game row ──────────────────────────────────────────────────────────────────
function GameRow({ player, event: ev }) {
  const home = ev.homeTeam?.name || '?'
  const away = ev.awayTeam?.name || '?'
  const tournament = shortTournament(ev.tournament?.name)
  const ts = ev.startTimestamp

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-gray-100 hover:shadow-md transition-shadow duration-200"
    >
      {/* Player */}
      <PlayerAvatar player={player} />
      <div className="shrink-0 min-w-[110px]">
        <div style={{ fontFamily: FONT_HEADING, fontSize: '1.1rem', color: DARK, letterSpacing: '0.5px', lineHeight: 1.1 }}>
          {player.name}
        </div>
        {player.position && (
          <div style={{ fontFamily: FONT_BODY, fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.1em' }}>
            {player.position}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="shrink-0 w-px h-8 bg-gray-100" />

      {/* Match */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span style={{ fontFamily: FONT_HEADING, fontSize: '1.2rem', color: DARK, letterSpacing: '1px', lineHeight: 1.1 }}>
            {home}
          </span>
          <span style={{ fontFamily: FONT_BODY, fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>vs</span>
          <span style={{ fontFamily: FONT_HEADING, fontSize: '1.2rem', color: DARK, letterSpacing: '1px', lineHeight: 1.1 }}>
            {away}
          </span>
        </div>
        {tournament && (
          <span
            className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ fontFamily: FONT_BODY, background: '#f3f4f6', color: '#6b7280' }}
          >
            {tournament}
          </span>
        )}
      </div>

      {/* Time */}
      {ts && (
        <div className="shrink-0 text-right">
          <div style={{ fontFamily: FONT_HEADING, fontSize: '1.4rem', color: BLUE, letterSpacing: '1px', lineHeight: 1 }}>
            {formatTime(ts)}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: '0.68rem', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.08em' }}>
            Eesti aeg
          </div>
        </div>
      )}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function RowSkeleton() {
  return <div className="animate-pulse bg-gray-100 rounded-2xl h-16" />
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
    fetch(`${BACKEND_URL}/players`)
      .then(r => r.json())
      .then(players => {
        const withSS = players.filter(p => p.sofascore_id)
        setTotalCount(withSS.length)

        const promises = withSS.map(player =>
          fetch(SS_URL(player.sofascore_id))
            .then(r => r.json())
            .then(data => {
              const events = data.events || []
              setLoadedCount(c => c + 1)
              return events.map(ev => ({ player, event: ev }))
            })
            .catch(() => {
              setLoadedCount(c => c + 1)
              return []
            })
        )

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
  const seen = {}
  for (const g of games) {
    const ts = g.event.startTimestamp
    if (!ts) continue
    const key = tallinDate(ts)
    if (!seen[key]) {
      seen[key] = true
      grouped.push({ dateKey: key, ts, rows: [] })
    }
    grouped[grouped.length - 1].rows.push(g)
  }

  return (
    <div className="pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: DARK, letterSpacing: '2px', lineHeight: 1 }}>
          Klubikorvpall
        </h1>
        <p style={{ fontFamily: FONT_BODY, fontSize: '1.05rem', color: '#6b7280', fontWeight: 500, marginTop: 6 }}>
          Eesti koondislaste tulevad mängud klubides üle maailma
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
          {Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}
        </div>
      )}

      {/* No games */}
      {!loading && !error && games.length === 0 && (
        <div className="text-center py-20 rounded-3xl" style={{ background: '#f8fafc' }}>
          <p style={{ fontFamily: FONT_HEADING, fontSize: '2rem', color: '#d1d5db', letterSpacing: '1px' }}>
            EELSEISVAID MÄNGE EI LEITUD
          </p>
          <p className="mt-3" style={{ fontFamily: FONT_BODY, fontSize: '1rem', color: '#9ca3af' }}>
            Hooajapaus — mängud algavad septembris
          </p>
        </div>
      )}

      {/* Grouped timeline */}
      {!loading && grouped.map(group => (
        <div key={group.dateKey} className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="text-xs font-bold tracking-widest uppercase"
              style={{ fontFamily: FONT_BODY, color: '#9ca3af' }}
            >
              {formatDateHeader(group.ts)}
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="flex flex-col gap-2">
            {group.rows.map((g, i) => (
              <GameRow key={`${g.player.slug}-${g.event.id ?? i}`} player={g.player} event={g.event} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
