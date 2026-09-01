import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLoading } from '../contexts/LoadingContext'
import Seo from '../components/Seo'
import { getPreloadedStats } from '../preload'
import PlayerAvatar from '../components/PlayerAvatar'
import Skeleton from '../components/Skeleton'
import StatsTabToggle from '../components/StatsTabToggle'
import Panel from '../components/Panel'
import FlagDivider from '../components/FlagDivider'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"
const BLUE = '#0072ce'
const DARK = '#08060d'

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

function PodiumCard({ player, rank, statKey }) {
  const navigate = useNavigate()
  const isFirst = rank === 1

  return (
    <button
      onClick={() => navigate(`/mangijad/${player.slug}`)}
      className="flex flex-col items-center gap-3 p-5 rounded-2xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0072ce] w-full"
      style={{ background: isFirst ? 'rgba(0,114,206,0.05)' : 'white', borderColor: isFirst ? BLUE : '#f3f4f6' }}
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: isFirst ? BLUE : '#9ca3af', fontFamily: FONT_BODY }}>
        {rank}
      </div>
      <PlayerAvatar slug={player.slug} name={player.name} size={isFirst ? 'lg' : 'md'} />
      <div className="text-center">
        <p className="font-semibold leading-tight mb-1" style={{ fontFamily: FONT_BODY, color: DARK, fontSize: isFirst ? '1rem' : '0.875rem' }}>
          {player.name}
        </p>
        <p className="leading-none" style={{ fontFamily: FONT_HEADING, color: isFirst ? BLUE : '#6b7280', fontSize: isFirst ? '2.5rem' : '2rem' }}>
          {player.statValue ?? '—'}
        </p>
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#9ca3af', fontFamily: FONT_BODY }}>
          {statKey}
        </p>
      </div>
    </button>
  )
}

function RankRow({ player, rank, statKey, maxValue }) {
  const navigate = useNavigate()
  // riba pikkus = mängija näitaja osakaal liidri omast; ilma näitajata riba ei kuvata
  const pct = player.statValue != null && maxValue > 0
    ? Math.max(0, Math.min(100, (player.statValue / maxValue) * 100))
    : null
  return (
    <button
      onClick={() => navigate(`/mangijad/${player.slug}`)}
      className="flex items-center gap-4 w-full px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors duration-150 cursor-pointer text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0072ce]"
    >
      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 bg-gray-100 shrink-0" style={{ fontFamily: FONT_BODY }}>
        {rank}
      </span>
      <PlayerAvatar slug={player.slug} name={player.name} size="sm" />
      <span className="max-w-[45%] truncate font-semibold text-[#08060d] text-base" style={{ fontFamily: FONT_BODY }}>
        {player.name}
      </span>
      <span className="invisible sm:visible flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden" aria-hidden="true">
        {pct != null && (
          <span
            className="block h-full rounded-full"
            style={{ width: `${pct}%`, background: BLUE, transition: 'width 0.45s cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        )}
      </span>
      <div className="text-right shrink-0 w-16">
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

// Sama lühendiloogika mis koondise ja piletite lehel, et sari kannaks kogu
// saidil sama nime.
function shortTournament(name) {
  if (!name) return ''
  if (name.includes('World Cup') && name.includes('Qualifiers')) return 'FIBA MM Kval.'
  if (name.includes('EuroBasket') && name.includes('Qualifiers')) return 'EuroBasket Kval.'
  if (name.includes('EuroBasket')) return 'EuroBasket'
  if (name.includes('Olympic')) return 'Olümpia Kval.'
  return name.length > 22 ? name.slice(0, 20) + '…' : name
}

// Käimasolev sari tuletatakse andmetest, mitte kõvakodeeringust: kui valiksari
// lõpeb ja algab EuroBasket, vahetub silt ise. Valik langeb suurima aasta peale,
// võrdse aasta korral sellele, kus on rohkem mänge.
function findCurrentEvent(natMap) {
  let best = null
  for (const rows of Object.values(natMap)) {
    for (const r of rows ?? []) {
      if (!r?.event || !r.year) continue
      if (!best || r.year > best.year) best = { year: r.year, event: r.event, gp: r.gp ?? 0 }
      else if (r.year === best.year && r.event === best.event) best.gp += r.gp ?? 0
    }
  }
  return best
}

export default function StatsPage() {
  const [view, setView] = useState('koondis')
  const [activeClubStat, setActiveClubStat] = useState('PTS')
  const [activeNatStat, setActiveNatStat] = useState('ppg')
  // 'all' = kogu koondisekarjäär, 'current' = ainult käimasolev sari
  const [natScope, setNatScope] = useState('all')
  // Eelrenderdusel on pingeread HTML-i süstitud. Siis ei tehta ühtegi päringut:
  // andmebaas uueneb niikuinii ainult öösel ja leht ehitatakse pärast seda
  // uuesti, seega päringud annaksid täpselt samad numbrid 45 käigu hinnaga.
  const pre = getPreloadedStats()
  const [players, setPlayers] = useState(pre?.players ?? [])
  const [clubMap, setClubMap] = useState(pre?.clubMap ?? {})
  const [natMap, setNatMap] = useState(pre?.natMap ?? {})
  const [clubLoading, setClubLoading] = useState(!pre)
  const [natLoading, setNatLoading] = useState(!pre)
  const { signalReady } = useLoading()

  useEffect(() => {
    if (pre) {
      signalReady()
      return
    }

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

  const currentEvent = useMemo(() => findCurrentEvent(natMap), [natMap])
  const scopedNat = natScope === 'current' && currentEvent
    ? slug => (natMap[slug] ?? []).filter(r => r.event === currentEvent.event)
    : slug => natMap[slug]

  // Mitmel mängijal on selles sarjas üldse kirje: ilma selleta jääks arusaamatuks,
  // miks osa nimesid on kriipsuga.
  const inCurrentEvent = currentEvent
    ? players.filter(p => (natMap[p.slug] ?? []).some(r => r.event === currentEvent.event)).length
    : 0

  const ranked = [...players]
    .map(p => {
      let statValue = null
      if (isKoondis) {
        statValue = computeNatStat(scopedNat(p.slug), activeNatStat)
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
    <div className="w-full px-6 py-8 max-w-5xl mx-auto text-center">
      <Seo
        title="Eesti korvpalli statistika ja pingeread"
        path="/statistika"
        breadcrumbs={[{ name: 'Statistika' }]}
        description={
          'Eesti koondislaste ja klubimängijate statistika: punktid, lauapallid ja ' +
          'resultatiivsed söödud mängu kohta. Pingeread nii koondise kui klubinumbrite peal.'
        }
      />

      <div className="mb-6">
        <h1 className="text-5xl text-[#08060d]" style={{ fontFamily: FONT_HEADING, letterSpacing: '1px' }}>
          Statistika
        </h1>
        <p style={{ fontFamily: FONT_BODY, fontSize: '1.05rem', color: '#6b7280', fontWeight: 500, marginTop: 6 }}>
          Eesti koondislaste ja klubimängijate pingeread
        </p>
      </div>

      {/* Koondis / Klubi toggle */}
      <StatsTabToggle active={view} onChange={v => { setView(v); }} />

      {/* Stat tabid ja vasakul, ajavahemiku lüliti paremal. Lüliti on tahtlikult
          teistsuguse kaaluga kui pillid: pillid valivad MIDA vaadata, lüliti MILLAL. */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
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

        {isKoondis && currentEvent && (
          <div
            className="ml-auto flex items-center overflow-hidden rounded-full border border-gray-300"
            role="group"
            aria-label="Statistika ajavahemik"
          >
            {[
              { key: 'all', label: 'Läbi aegade' },
              { key: 'current', label: shortTournament(currentEvent.event) },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setNatScope(key)}
                aria-pressed={natScope === key}
                className={`px-3.5 py-1 text-xs font-bold tracking-wide cursor-pointer
                  transition-colors duration-150 focus-visible:outline focus-visible:outline-2
                  focus-visible:-outline-offset-2 focus-visible:outline-[#0072ce]
                  ${natScope === key
                    ? 'bg-[#08060d] text-white'
                    : 'bg-white text-gray-500 hover:text-[#08060d]'}`}
                style={{ fontFamily: FONT_BODY }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sarja täisnimi ja kaetus. Ilma selleta jääks arusaamatuks, mis sari
          täpselt on ja miks osa mängijaid on kriipsuga. */}
      {isKoondis && natScope === 'current' && currentEvent && (
        <p
          className="-mt-6 mb-8 text-sm"
          style={{ fontFamily: FONT_BODY, color: '#6b7280', fontWeight: 500 }}
        >
          {currentEvent.event}
          <span style={{ color: '#9ca3af' }}>
            {' · '}{inCurrentEvent} mängijat {players.length}-st on selles sarjas mänginud
          </span>
        </p>
      )}

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

      <FlagDivider />

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : (
        <Panel>
          {rest.map((player, i) => (
            <div key={player.slug} style={{ borderBottom: i < rest.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <RankRow player={player} rank={i + 4} statKey={activeStat.toUpperCase()} maxValue={ranked[0]?.statValue ?? 0} />
            </div>
          ))}
        </Panel>
      )}
    </div>
  )
}
