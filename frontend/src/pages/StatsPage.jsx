import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLoading } from '../contexts/LoadingContext'
import PlayerAvatar from '../components/PlayerAvatar'
import Skeleton from '../components/Skeleton'
import StatsTabToggle from '../components/StatsTabToggle'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"
const BLUE = '#0072ce'

const CLUB_TABS = [
  { key: 'PTS', label: 'Punktid' },
  { key: 'REB', label: 'Lauapallid' },
  { key: 'AST', label: 'Söödud' },
  { key: 'EFF', label: 'Efektiivsus' },
  { key: 'STL', label: 'Vaheltlõiked' },
  { key: 'BLK', label: 'Blokid' },
]

const NAT_TABS = [
  { key: 'ppg', label: 'Punktid' },
  { key: 'rpg', label: 'Lauapallid' },
  { key: 'apg', label: 'Söödud' },
  { key: 'eff', label: 'Efektiivsus' },
]

const MEDAL = ['#F59E0B', '#94A3B8', '#CD7F32']
const MEDAL_LABEL = ['#78350F', '#334155', '#7C2D12']
const MEDAL_BG = ['#FEF3C7', '#F1F5F9', '#FFF7ED']

function PodiumCard({ player, rank, statKey }) {
  const navigate = useNavigate()
  const medalColor = MEDAL[rank - 1]
  const labelColor = MEDAL_LABEL[rank - 1]
  const bgColor = MEDAL_BG[rank - 1]
  const isFirst = rank === 1

  return (
    <button
      onClick={() => navigate(`/mangijad/${player.slug}`)}
      className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0072ce] w-full"
      style={{ background: bgColor, borderColor: medalColor }}
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: medalColor, fontFamily: FONT_BODY }}>
        {rank}
      </div>
      <PlayerAvatar slug={player.slug} name={player.name} size={isFirst ? 'lg' : 'md'} />
      <div className="text-center">
        <p className="font-semibold leading-tight mb-1" style={{ fontFamily: FONT_BODY, color: labelColor, fontSize: isFirst ? '1rem' : '0.875rem' }}>
          {player.name}
        </p>
        <p className="leading-none" style={{ fontFamily: FONT_HEADING, color: medalColor, fontSize: isFirst ? '2.5rem' : '2rem' }}>
          {player.statValue ?? '—'}
        </p>
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: labelColor, fontFamily: FONT_BODY, opacity: 0.7 }}>
          {statKey}
        </p>
      </div>
    </button>
  )
}

function RankRow({ player, rank, statKey }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(`/mangijad/${player.slug}`)}
      className="flex items-center gap-4 w-full px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors duration-150 cursor-pointer text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0072ce]"
    >
      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 bg-gray-100 shrink-0" style={{ fontFamily: FONT_BODY }}>
        {rank}
      </span>
      <PlayerAvatar slug={player.slug} name={player.name} size="sm" />
      <span className="flex-1 font-semibold text-[#08060d] text-base" style={{ fontFamily: FONT_BODY }}>
        {player.name}
      </span>
      <div className="text-right shrink-0">
        <span className="text-2xl leading-none" style={{ fontFamily: FONT_HEADING, color: BLUE }}>
          {player.statValue ?? '—'}
        </span>
        <span className="block text-xs text-gray-400 tracking-widest uppercase" style={{ fontFamily: FONT_BODY }}>
          {statKey}
        </span>
      </div>
    </button>
  )
}

function computeNatStat(data, key) {
  if (!data?.length) return null
  const gp = data.reduce((s, r) => s + r.gp, 0)
  if (!gp) return null
  return parseFloat((data.reduce((s, r) => s + r[key] * r.gp, 0) / gp).toFixed(1))
}

export default function StatsPage() {
  const [view, setView] = useState('koondis')
  const [activeClubStat, setActiveClubStat] = useState('PTS')
  const [activeNatStat, setActiveNatStat] = useState('ppg')
  const [players, setPlayers] = useState([])
  const [clubMap, setClubMap] = useState({})
  const [natMap, setNatMap] = useState({})
  const [clubLoading, setClubLoading] = useState(true)
  const [natLoading, setNatLoading] = useState(true)
  const { signalReady } = useLoading()

  useEffect(() => {
    async function load() {
      const res = await fetch(`${API}/players`)
      const allPlayers = await res.json()
      setPlayers(allPlayers)
      signalReady()

      // Club stats
      Promise.allSettled(
        allPlayers.map(p => fetch(`${API}/players/${p.slug}/stats`).then(r => r.ok ? r.json() : null))
      ).then(results => {
        const map = {}
        results.forEach((r, i) => {
          const slug = allPlayers[i].slug
          if (r.status === 'fulfilled' && r.value) {
            const seasons = r.value.seasons
            map[slug] = seasons?.[seasons.length - 1] ?? null
          } else {
            map[slug] = null
          }
        })
        setClubMap(map)
        setClubLoading(false)
      })

      // National team stats
      Promise.allSettled(
        allPlayers.map(p => fetch(`${API}/players/${p.slug}/fiba-stats`).then(r => r.ok ? r.json() : null))
      ).then(results => {
        const map = {}
        results.forEach((r, i) => {
          const slug = allPlayers[i].slug
          if (r.status === 'fulfilled' && r.value) {
            map[slug] = r.value.national_team ?? null
          } else {
            map[slug] = null
          }
        })
        setNatMap(map)
        setNatLoading(false)
      })
    }

    load().catch(() => { setClubLoading(false); setNatLoading(false); signalReady() })
  }, [API])

  const isKoondis = view === 'koondis'
  const loading = isKoondis ? natLoading : clubLoading
  const activeStat = isKoondis ? activeNatStat : activeClubStat
  const statTabs = isKoondis ? NAT_TABS : CLUB_TABS

  const ranked = [...players]
    .map(p => {
      let statValue = null
      if (isKoondis) {
        statValue = computeNatStat(natMap[p.slug], activeNatStat)
      } else {
        const raw = clubMap[p.slug]?.[activeClubStat]
        statValue = raw != null ? parseFloat(raw) : null
      }
      return { ...p, statValue }
    })
    .sort((a, b) => {
      if (a.statValue == null && b.statValue == null) return 0
      if (a.statValue == null) return 1
      if (b.statValue == null) return -1
      return b.statValue - a.statValue
    })

  const top3 = ranked.slice(0, 3)
  const rest = ranked.slice(3)
  const podiumOrder = loading ? [] : [top3[1], top3[0], top3[2]]

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <h1 className="text-5xl text-[#08060d] mb-6" style={{ fontFamily: FONT_HEADING, letterSpacing: '1px' }}>
        Statistika
      </h1>

      {/* Koondis / Klubi toggle */}
      <StatsTabToggle active={view} onChange={v => { setView(v); }} />

      {/* Stat tabid */}
      <div className="flex flex-wrap gap-2 mb-8">
        {statTabs.map(({ key, label }) => {
          const isActive = isKoondis ? activeNatStat === key : activeClubStat === key
          return (
            <button
              key={key}
              onClick={() => isKoondis ? setActiveNatStat(key) : setActiveClubStat(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide cursor-pointer
                transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0072ce]
                ${isActive ? 'bg-[#0072ce] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              style={{ fontFamily: FONT_BODY }}
            >
              {key.toUpperCase()} — {label}
            </button>
          )
        })}
      </div>

      {/* Poodium */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
          <Skeleton className="h-52" />
          <Skeleton className="h-64" />
          <Skeleton className="h-44" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, alignItems: 'end', marginBottom: 32 }}>
          {podiumOrder.map((player, i) => {
            if (!player) return <div key={i} />
            const rank = i === 1 ? 1 : i === 0 ? 2 : 3
            return (
              <div key={player.slug} style={{ marginTop: i === 0 ? 32 : i === 2 ? 48 : 0 }}>
                <PodiumCard player={player} rank={rank} statKey={activeStat.toUpperCase()} />
              </div>
            )
          })}
        </div>
      )}

      <div className="border-t border-gray-100 mb-4" />

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : (
        <div className="flex flex-col">
          {rest.map((player, i) => (
            <RankRow key={player.slug} player={player} rank={i + 4} statKey={activeStat.toUpperCase()} />
          ))}
        </div>
      )}
    </div>
  )
}
