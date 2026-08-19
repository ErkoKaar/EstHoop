import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLoading } from '../contexts/LoadingContext'
import Seo, { SITE_URL } from '../components/Seo'
import { getPreloadedPlayer, getPreloadedPlayerStats } from '../preload'
import Skeleton from '../components/Skeleton'
import StatsTabToggle from '../components/StatsTabToggle'
import {
  LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
// Fotod on WebP-s. jpg ja png jäävad varuks, kui mõni pilt hiljem muus vormingus lisatakse.
const PHOTO_EXTENSIONS = ['webp', 'jpg', 'png']
const BLUE = '#0072ce'
const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"

const POSITION_LABELS = {
  PG: 'mängujuht',
  SG: 'viskav tagamängija',
  SF: 'kerge ääremängija',
  PF: 'võimas ääremängija',
  C: 'keskmängija',
}

// Positsioon pole kõigil mängijatel täidetud — kirjeldus peab ka ilma töötama
function playerDescription(player, lastSeason, natAvg) {
  const role = POSITION_LABELS[player.position]
  const parts = [
    `${player.name} on Eesti korvpallikoondise${role ? ` ${role}` : ' mängija'}.`,
  ]
  if (lastSeason?.TEAM) {
    parts.push(`Klubi: ${lastSeason.TEAM}${lastSeason.LEAGUE ? ` (${lastSeason.LEAGUE})` : ''}.`)
  }
  if (natAvg?.gp) {
    parts.push(`${natAvg.gp} mängu koondises.`)
  }
  parts.push('Vaata statistikat koondises ja klubis, hooaegade kaupa.')
  return parts.join(' ')
}

function playerJsonLd(player, { heightCm, lastSeason }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: player.name,
    url: `${SITE_URL}/mangijad/${player.slug}`,
    jobTitle: 'Korvpallur',
    nationality: { '@type': 'Country', name: 'Eesti' },
    memberOf: [
      { '@type': 'SportsTeam', name: 'Eesti korvpallikoondis', url: `${SITE_URL}/koondis` },
      lastSeason?.TEAM ? { '@type': 'SportsTeam', name: lastSeason.TEAM } : undefined,
    ].filter(Boolean),
    height: heightCm
      ? { '@type': 'QuantitativeValue', value: heightCm, unitCode: 'CMT' }
      : undefined,
  }
}

function getLastSeason(seasons) {
  if (!seasons?.length) return null
  return seasons[seasons.length - 1]
}

function computeAge(birthDateIso) {
  if (!birthDateIso) return null
  const birth = new Date(birthDateIso)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const hadBirthdayThisYear =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate())
  if (!hadBirthdayThisYear) age--
  return age
}

function computeNatAvg(data) {
  if (!data?.length) return null
  const gp = data.reduce((s, r) => s + r.gp, 0)
  if (!gp) return null
  return {
    ppg: (data.reduce((s, r) => s + r.ppg * r.gp, 0) / gp).toFixed(1),
    rpg: (data.reduce((s, r) => s + r.rpg * r.gp, 0) / gp).toFixed(1),
    apg: (data.reduce((s, r) => s + r.apg * r.gp, 0) / gp).toFixed(1),
    eff: (data.reduce((s, r) => s + r.eff * r.gp, 0) / gp).toFixed(1),
    gp,
  }
}

// ── Hero infolahter ───────────────────────────────────────
function FactItem({ label, value }) {
  if (!value) return null
  return (
    <div className="flex flex-col">
      <span className="text-gray-400 text-xs font-semibold tracking-widest uppercase" style={{ fontFamily: FONT_BODY }}>
        {label}
      </span>
      <span className="text-[#08060d] text-xl font-bold" style={{ fontFamily: FONT_HEADING, letterSpacing: '1px' }}>
        {value}
      </span>
    </div>
  )
}

// ── Stat highlight kaart ──────────────────────────────────
function StatCard({ label, value, sub }) {
  return (
    <div className="flex flex-col items-center justify-center bg-[#0072ce] rounded-xl px-4 py-5 shadow-md min-w-0">
      <span
        className="text-white leading-none mb-1"
        style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(2rem, 5vw, 3rem)' }}
      >
        {value ?? '—'}
      </span>
      <span
        className="text-white/70 text-sm font-semibold tracking-widest uppercase"
        style={{ fontFamily: FONT_BODY }}
      >
        {label}
      </span>
      {sub && (
        <span className="text-white/50 text-xs mt-0.5" style={{ fontFamily: FONT_BODY }}>
          {sub}
        </span>
      )}
    </div>
  )
}

// ── Klubi: karjääritrend ──────────────────────────────────
function CareerChart({ seasons }) {
  const data = seasons
    .filter(s => s.PTS && s.REB)
    .map(s => ({
      season: s.SEASON,
      PTS: parseFloat(s.PTS),
      REB: parseFloat(s.REB),
      AST: parseFloat(s.AST),
    }))

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <h3 className="text-lg text-[#08060d] mb-4" style={{ fontFamily: FONT_HEADING, letterSpacing: '1px' }}>
        Karjääritrend
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <XAxis dataKey="season" tick={{ fontSize: 11, fontFamily: FONT_BODY }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11, fontFamily: FONT_BODY }} />
          <Tooltip contentStyle={{ fontFamily: FONT_BODY, fontSize: 13, borderRadius: 8 }} labelStyle={{ fontWeight: 700 }} />
          <Legend wrapperStyle={{ fontFamily: FONT_BODY, fontSize: 13 }} />
          <Line type="monotone" dataKey="PTS" stroke={BLUE} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="REB" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="AST" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Klubi: hooaja profiil ─────────────────────────────────
function ProfileChart({ season }) {
  const fields = [
    { key: 'PTS', max: 30 },
    { key: 'REB', max: 15 },
    { key: 'AST', max: 10 },
    { key: 'STL', max: 3 },
    { key: 'BLK', max: 3 },
    { key: 'EFF', max: 30 },
  ]

  const data = fields.map(({ key, max }) => ({
    stat: key,
    value: Math.min(100, Math.round((parseFloat(season[key] ?? 0) / max) * 100)),
    raw: season[key] ?? '—',
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm shadow-md" style={{ fontFamily: FONT_BODY }}>
        <span className="font-bold">{d.stat}</span>: {d.raw}
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <h3 className="text-lg text-[#08060d] mb-4" style={{ fontFamily: FONT_HEADING, letterSpacing: '1px' }}>
        Hooaja profiil ({season.SEASON})
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="stat" tick={{ fontSize: 12, fontFamily: FONT_BODY, fontWeight: 600 }} />
          <Radar dataKey="value" stroke={BLUE} fill={BLUE} fillOpacity={0.2} strokeWidth={2} />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Klubi: hooaegade tabel ────────────────────────────────
function SeasonsTable({ seasons }) {
  const lastSeason = getLastSeason(seasons)
  const cols = ['SEASON', 'TEAM', 'LEAGUE', 'GP', 'MIN', 'PTS', 'FG%', '3%', '1%', 'REB', 'OR', 'DR', 'AST', 'STL', 'BLK', 'TO', 'FO', 'EFF']

  return (
    <div>
      <h3 className="text-xl text-[#08060d] mb-3" style={{ fontFamily: FONT_HEADING, letterSpacing: '1px' }}>
        Hooaja keskmised
      </h3>
      <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
        <table className="w-full text-sm" style={{ fontFamily: FONT_BODY }}>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {cols.map(c => (
                <th key={c} className="px-3 py-2 text-left font-bold text-gray-500 text-xs tracking-wider whitespace-nowrap">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...seasons].reverse().map((s, i) => {
              const isLast = s.SEASON === lastSeason?.SEASON && s.TEAM === lastSeason?.TEAM
              return (
                <tr key={i} className={`border-b border-gray-50 last:border-0 ${isLast ? 'bg-blue-50 font-bold' : 'hover:bg-gray-50'}`}>
                  {cols.map(c => (
                    <td key={c} className="px-3 py-2 whitespace-nowrap text-[#08060d]">{s[c] ?? '—'}</td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Klubi: viimased mängud ────────────────────────────────
const GAME_COLS = [
  { key: 'DATE', label: 'Kuupäev' },
  { key: 'OPPONENT', label: 'Vastane' },
  { key: 'LEAGUE', label: 'Liiga' },
  { key: 'RESULT', label: 'W/L' },
  { key: 'SCORE', label: 'Skoor' },
  { key: 'MIN', label: 'MIN' },
  { key: 'PTS', label: 'PTS' },
  { key: '2M-2A', label: '2P' },
  { key: '3M-3A', label: '3P' },
  { key: '1M-1A', label: 'FT' },
  { key: 'FG%', label: 'FG%' },
  { key: '1%', label: 'FT%' },
  { key: 'REB', label: 'REB' },
  { key: 'OR', label: 'OR' },
  { key: 'DR', label: 'DR' },
  { key: 'AST', label: 'AST' },
  { key: 'STL', label: 'STL' },
  { key: 'BLK', label: 'BLK' },
  { key: 'TO', label: 'TO' },
  { key: 'FO', label: 'FO' },
  { key: 'EFF', label: 'EFF' },
  { key: '+/-', label: '+/-' },
]

function GamesTable({ games }) {
  if (!games?.length) return null
  return (
    <div>
      <h3 className="text-xl text-[#08060d] mb-3" style={{ fontFamily: FONT_HEADING, letterSpacing: '1px' }}>
        Viimased mängud
      </h3>
      <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
        <table className="w-full text-sm" style={{ fontFamily: FONT_BODY }}>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {GAME_COLS.map(({ key, label }) => (
                <th key={key} className="px-3 py-2 text-left font-bold text-gray-500 text-xs tracking-wider whitespace-nowrap">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {games.map((g, i) => {
              const win = g.RESULT === 'W'
              const loss = g.RESULT === 'L'
              return (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  {GAME_COLS.map(({ key }) => (
                    <td
                      key={key}
                      className={`px-3 py-2 whitespace-nowrap ${
                        key === 'RESULT'
                          ? win ? 'text-emerald-600 font-bold' : loss ? 'text-red-500 font-bold' : 'text-gray-600'
                          : 'text-[#08060d]'
                      }`}
                    >
                      {g[key] ?? '—'}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Koondis: võistluste graafik ───────────────────────────
function NationalTeamChart({ data }) {
  const chartData = [...data].reverse().map(r => ({
    label: `${r.year}`,
    PPG: r.ppg,
    RPG: r.rpg,
    APG: r.apg,
  }))

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <h3 className="text-lg text-[#08060d] mb-4" style={{ fontFamily: FONT_HEADING, letterSpacing: '1px' }}>
        Koondise trend
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11, fontFamily: FONT_BODY }} />
          <YAxis tick={{ fontSize: 11, fontFamily: FONT_BODY }} />
          <Tooltip contentStyle={{ fontFamily: FONT_BODY, fontSize: 13, borderRadius: 8 }} labelStyle={{ fontWeight: 700 }} />
          <Legend wrapperStyle={{ fontFamily: FONT_BODY, fontSize: 13 }} />
          <Line type="monotone" dataKey="PPG" stroke={BLUE} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="RPG" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="APG" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Koondis: profiil viimase võistluse järgi ──────────────
function NationalProfileChart({ entry }) {
  const fields = [
    { key: 'ppg', label: 'PPG', max: 30 },
    { key: 'rpg', label: 'RPG', max: 15 },
    { key: 'apg', label: 'APG', max: 10 },
    { key: 'eff', label: 'EFF', max: 30 },
  ]

  const data = fields.map(({ key, label, max }) => ({
    stat: label,
    value: Math.min(100, Math.round((entry[key] / max) * 100)),
    raw: entry[key],
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm shadow-md" style={{ fontFamily: FONT_BODY }}>
        <span className="font-bold">{d.stat}</span>: {d.raw}
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <h3 className="text-lg text-[#08060d] mb-4" style={{ fontFamily: FONT_HEADING, letterSpacing: '1px' }}>
        Profiil ({entry.year})
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="stat" tick={{ fontSize: 12, fontFamily: FONT_BODY, fontWeight: 600 }} />
          <Radar dataKey="value" stroke={BLUE} fill={BLUE} fillOpacity={0.2} strokeWidth={2} />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Koondis: võistluste tabel ─────────────────────────────
function NationalTeamTable({ data }) {
  const cols = [
    { key: 'year',  label: 'Aasta' },
    { key: 'event', label: 'Võistlus' },
    { key: 'gp',   label: 'GP' },
    { key: 'ppg',  label: 'PPG' },
    { key: 'rpg',  label: 'RPG' },
    { key: 'apg',  label: 'APG' },
    { key: 'eff',  label: 'EFF' },
  ]

  return (
    <div>
      <h3 className="text-xl text-[#08060d] mb-3" style={{ fontFamily: FONT_HEADING, letterSpacing: '1px' }}>
        Võistluste keskmised
      </h3>
      <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
        <table className="w-full text-sm" style={{ fontFamily: FONT_BODY }}>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {cols.map(c => (
                <th key={c.key} className="px-3 py-2 text-left font-bold text-gray-500 text-xs tracking-wider whitespace-nowrap">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={i} className={`border-b border-gray-50 last:border-0 ${i === 0 ? 'bg-blue-50 font-bold' : 'hover:bg-gray-50'}`}>
                <td className="px-3 py-2 whitespace-nowrap text-[#08060d]">{r.year}</td>
                <td className="px-3 py-2 text-[#08060d] max-w-xs truncate">{r.event}</td>
                <td className="px-3 py-2 whitespace-nowrap text-[#08060d]">{r.gp}</td>
                <td className="px-3 py-2 whitespace-nowrap text-[#08060d]">{r.ppg}</td>
                <td className="px-3 py-2 whitespace-nowrap text-[#08060d]">{r.rpg}</td>
                <td className="px-3 py-2 whitespace-nowrap text-[#08060d]">{r.apg}</td>
                <td className="px-3 py-2 whitespace-nowrap text-[#08060d]">{r.eff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Peakomponent ──────────────────────────────────────────
export default function PlayerPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { signalReady } = useLoading()
  // Eelrenderdusel on nii mängija kui tema statistika HTML-i süstitud, seega
  // pealkiri, hooaegade tabel ja numbrid jõuavad märgistusse ilma API-päringuta.
  // Klient laeb need effectis üle, et andmed oleksid värsked.
  const preloaded = getPreloadedPlayer(slug)
  const preloadedStats = getPreloadedPlayerStats(slug)
  const [player, setPlayer] = useState(preloaded)
  const [stats, setStats] = useState(preloadedStats?.stats ?? null)
  const [fibaStats, setFibaStats] = useState(preloadedStats?.fibaStats ?? null)
  const [tab, setTab] = useState('koondis')
  const [extIndex, setExtIndex] = useState(0)
  const [playerLoading, setPlayerLoading] = useState(!preloaded)
  const [statsLoading, setStatsLoading] = useState(!preloadedStats)
  const [statsError, setStatsError] = useState(false)
  const [fibaLoading, setFibaLoading] = useState(!preloadedStats)
  const [fibaError, setFibaError] = useState(false)

  useEffect(() => {
    fetch(`${API}/players/${slug}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setPlayer)
      .catch(() => navigate('/mangijad', { replace: true }))
      .finally(() => { setPlayerLoading(false); signalReady() })

    fetch(`${API}/players/${slug}/stats`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setStats)
      .catch(() => setStatsError(true))
      .finally(() => setStatsLoading(false))

    fetch(`${API}/players/${slug}/fiba-stats`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => setFibaStats(d.national_team))
      .catch(() => setFibaError(true))
      .finally(() => setFibaLoading(false))
  }, [slug, navigate])

  if (playerLoading) return null

  const initials = player.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const lastSeason = getLastSeason(stats?.seasons)
  const natAvg = computeNatAvg(fibaStats)
  const isKoondis = tab === 'koondis'
  const nationalGames = stats?.nationalGames || []
  const clubGames = stats?.clubGames || []
  const age = computeAge(stats?.birthDate)
  const heightCm = stats?.heightCm
  const isVaaks = player.slug === 'stefan-vaaks'

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto w-full min-w-0 text-center">
      {/*
        Jagamiskaardid on eraldi JPEG-id, mille teeb scripts/generate-og-images.py.
        Facebook ja LinkedIn ei toeta WebP-d og:image'ina, ja ruudukujuline foto
        lõigataks kaardil ribaks. Käivita skript uuesti, kui fotod muutuvad.
      */}
      <Seo
        title={`${player.name} statistika ja profiil`}
        path={`/mangijad/${player.slug}`}
        description={playerDescription(player, lastSeason, natAvg)}
        image={`${SITE_URL}/og/players/${player.slug}.jpg`}
        imageAlt={`${player.name}, Eesti korvpallikoondis`}
        ogType="profile"
        jsonLd={playerJsonLd(player, { heightCm, lastSeason })}
        breadcrumbs={[
          { name: 'Mängijad', path: '/mangijad' },
          { name: player.name },
        ]}
      />

      {/* Tagasi */}
      <button
        onClick={() => navigate('/mangijad')}
        className="flex items-center gap-2 text-[#0072ce] font-semibold mb-8 cursor-pointer hover:opacity-75 transition-opacity duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0072ce] rounded"
        style={{ fontFamily: FONT_BODY }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Tagasi mängijate juurde
      </button>

      {/* ① Hero */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10 mb-8">
        <div className="flex items-center gap-7 shrink-0">
          <div className="w-36 h-36 rounded-full overflow-hidden shadow-md shrink-0">
            {extIndex < PHOTO_EXTENSIONS.length ? (
              <img
                src={`/players/${player.slug}.${PHOTO_EXTENSIONS[extIndex]}`}
                alt={player.name}
                className="w-full h-full object-cover object-top"
                onError={() => setExtIndex(i => i + 1)}
              />
            ) : (
              <div className="w-full h-full bg-[#0072ce] flex items-center justify-center">
                <span className="text-white font-bold text-4xl select-none" style={{ fontFamily: FONT_HEADING }}>
                  {initials}
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-5xl text-[#08060d] leading-none mb-1" style={{ fontFamily: FONT_HEADING, letterSpacing: '1px' }}>
              {player.name}
            </h1>
            <p className="text-gray-500 font-semibold text-base" style={{ fontFamily: FONT_BODY }}>
              {[
                isKoondis
                  ? `Eesti Koondis${natAvg ? ` · ${natAvg.gp} mängu` : ''}`
                  : lastSeason
                    ? `${lastSeason.TEAM} · ${lastSeason.LEAGUE} · ${lastSeason.SEASON}`
                    : '—',
                !isVaaks && age && `${age} a.`,
                !isVaaks && heightCm && `${heightCm} cm`,
              ].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        {/* HighlightReel on ajutiselt kasutusest väljas: komponent ja video on
            alles, video assets-source/videos/ all, et see deploy'sse ei läheks. */}
        {isVaaks && (
          <div className="flex items-center gap-6 shrink-0 pt-3 mt-1 border-t border-gray-200
                          md:pt-0 md:mt-0 md:border-t-0 md:border-l md:pl-8">
            <FactItem label="Positsioon" value={player.position} />
            <FactItem label="Vanus" value={age && `${age} a.`} />
            <FactItem label="Pikkus" value={heightCm && `${heightCm} cm`} />
          </div>
        )}
      </div>

      {/* ② Tab toggle */}
      <StatsTabToggle active={tab} onChange={setTab} />

      {/* ③ KOONDIS vaade */}
      {isKoondis && (
        <>
          {/* Stat kaardid */}
          {fibaLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : fibaError || !fibaStats?.length ? (
            <p className="text-gray-400 text-sm mb-8" style={{ fontFamily: FONT_BODY }}>
              Koondisstatistika puudub.
            </p>
          ) : natAvg ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <StatCard label="PPG" value={natAvg.ppg} sub="punkti" />
              <StatCard label="RPG" value={natAvg.rpg} sub="lauapalli" />
              <StatCard label="APG" value={natAvg.apg} sub="söötu" />
              <StatCard label="EFF" value={natAvg.eff} sub="efektiivsus" />
            </div>
          ) : null}

          {/* Graafikud */}
          {!fibaLoading && !fibaError && fibaStats?.length > 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <NationalTeamChart data={fibaStats} />
              <NationalProfileChart entry={fibaStats[0]} />
            </div>
          )}

          {fibaLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          )}

          {/* Võistluste tabel */}
          {!fibaLoading && !fibaError && fibaStats?.length > 0 && (
            <div className="mb-8">
              <NationalTeamTable data={fibaStats} />
            </div>
          )}

          {statsLoading && <Skeleton className="h-48 mb-8" />}

          {/* Viimased mängud (koondis) */}
          {!statsLoading && !statsError && nationalGames.length > 0 && (
            <GamesTable games={nationalGames} />
          )}
        </>
      )}

      {/* ④ KLUBI vaade */}
      {!isKoondis && (
        <>
          {/* Stat kaardid */}
          {statsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : statsError ? (
            <p className="text-gray-400 text-sm mb-8" style={{ fontFamily: FONT_BODY }}>
              Statistika laadimine ebaõnnestus.
            </p>
          ) : lastSeason ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <StatCard label="PTS" value={lastSeason.PTS} sub="punkti" />
              <StatCard label="REB" value={lastSeason.REB} sub="lauapalli" />
              <StatCard label="AST" value={lastSeason.AST} sub="söötu" />
              <StatCard label="EFF" value={lastSeason.EFF} sub="efektiivsus" />
            </div>
          ) : null}

          {/* Graafikud */}
          {!statsLoading && !statsError && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <CareerChart seasons={stats.seasons} />
              {lastSeason && <ProfileChart season={lastSeason} />}
            </div>
          )}

          {statsLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          )}

          {/* Hooaegade tabel */}
          {!statsLoading && !statsError && stats?.seasons?.length > 0 && (
            <div className="mb-8">
              <SeasonsTable seasons={stats.seasons} />
            </div>
          )}

          {statsLoading && <Skeleton className="h-48 mb-8" />}

          {/* Viimased mängud */}
          {!statsLoading && !statsError && clubGames.length > 0 && (
            <GamesTable games={clubGames} />
          )}
        </>
      )}
    </div>
  )
}
