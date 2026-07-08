import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLoading } from '../contexts/LoadingContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"
const BLUE = '#0072ce'

const EXTENSIONS = ['jpg', 'png']

const GROUPS = [
  { key: 'guard',   label: 'Tagamängijad', sub: 'PG · SG', positions: ['PG', 'SG'] },
  { key: 'forward', label: 'Ääremängijad', sub: 'SF · PF',  positions: ['SF', 'PF'] },
  { key: 'center',  label: 'Keskmängijad', sub: 'C',        positions: ['C'] },
]

function PlayerCard({ player }) {
  const navigate = useNavigate()
  const [extIndex, setExtIndex] = useState(0)

  const initials = player.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const showPlaceholder = extIndex >= EXTENSIONS.length

  return (
    <button
      onClick={() => navigate(`/mangijad/${player.slug}`)}
      className="group flex flex-col items-center gap-2 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0072ce] rounded-xl p-3 transition-all duration-200 hover:bg-gray-50"
    >
      <div className="relative w-full aspect-square rounded-full overflow-hidden shadow-md group-hover:shadow-lg transition-shadow duration-200">
        {!showPlaceholder ? (
          <img
            src={`/players/${player.slug}.${EXTENSIONS[extIndex]}`}
            alt={player.name}
            className="w-full h-full object-cover object-top"
            onError={() => setExtIndex(i => i + 1)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: BLUE }}>
            <span
              className="text-white font-bold select-none"
              style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}
            >
              {initials}
            </span>
          </div>
        )}
        {/* Positsioon badge */}
        {player.position && (
          <span
            className="absolute bottom-1 right-1 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full"
            style={{ background: BLUE, fontFamily: FONT_BODY, lineHeight: 1.4 }}
          >
            {player.position}
          </span>
        )}
      </div>

      <span
        className="text-[#08060d] font-semibold text-sm text-center leading-tight group-hover:text-[#0072ce] transition-colors duration-200"
        style={{ fontFamily: FONT_BODY }}
      >
        {player.name}
      </span>

    </button>
  )
}

function GroupSection({ group, players, statsMap, statsLoading }) {
  const sorted = [...players].sort((a, b) => {
    if (statsLoading) return 0
    return (statsMap[b.slug] ?? -1) - (statsMap[a.slug] ?? -1)
  })

  return (
    <section className="mb-10">
      <div className="flex items-baseline gap-3 mb-5">
        <h2
          className="text-3xl text-[#08060d]"
          style={{ fontFamily: FONT_HEADING, letterSpacing: '1px' }}
        >
          {group.label}
        </h2>
        <span
          className="text-sm font-semibold text-gray-400 tracking-widest uppercase"
          style={{ fontFamily: FONT_BODY }}
        >
          {group.sub}
        </span>
        <span
          className="ml-auto text-sm font-semibold text-gray-400"
          style={{ fontFamily: FONT_BODY }}
        >
          {players.length} mängijat
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
        {sorted.map(player => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </section>
  )
}

export default function PlayersPage() {
  const [players, setPlayers] = useState([])
  const [statsMap, setStatsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState(null)
  const { signalReady } = useLoading()

  useEffect(() => {
    fetch(`${API}/players`)
      .then(res => {
        if (!res.ok) throw new Error('Viga mängijate laadimisel')
        return res.json()
      })
      .then(async allPlayers => {
        setPlayers(allPlayers)

        const results = await Promise.allSettled(
          allPlayers.map(p =>
            fetch(`${API}/players/${p.slug}/fiba-stats`).then(r => r.ok ? r.json() : null)
          )
        )

        const map = {}
        results.forEach((result, i) => {
          const slug = allPlayers[i].slug
          if (result.status === 'fulfilled' && result.value) {
            const data = result.value.national_team
            if (data?.length) {
              const gp = data.reduce((s, r) => s + r.gp, 0)
              map[slug] = gp ? parseFloat((data.reduce((s, r) => s + r.ppg * r.gp, 0) / gp).toFixed(1)) : null
            } else {
              map[slug] = null
            }
          } else {
            map[slug] = null
          }
        })
        setStatsMap(map)
        setStatsLoading(false)
        setLoading(false)
        signalReady()
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
        signalReady()
      })
  }, [])

  if (loading) {
    return (
      <div className="px-4 py-10 max-w-5xl mx-auto">
        {GROUPS.map(g => (
          <div key={g.key} className="mb-10">
            <div className="h-8 w-48 rounded bg-gray-200 animate-pulse mb-5" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-3 animate-pulse">
                  <div className="w-full aspect-square rounded-full bg-gray-200" />
                  <div className="h-3 w-20 rounded bg-gray-200" />
                  <div className="h-4 w-10 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="py-16 text-center text-red-600">{error}</p>
  }

  return (
    <div className="px-6 py-10 max-w-screen-xl mx-auto">
      <h1
        className="text-5xl text-[#08060d] mb-10"
        style={{ fontFamily: FONT_HEADING, letterSpacing: '1px' }}
      >
        Mängijad
      </h1>

      {GROUPS.map(group => {
        const groupPlayers = players.filter(p => group.positions.includes(p.position))
        if (!groupPlayers.length) return null
        return (
          <GroupSection
            key={group.key}
            group={group}
            players={groupPlayers}
            statsMap={statsMap}
            statsLoading={statsLoading}
          />
        )
      })}
    </div>
  )
}
