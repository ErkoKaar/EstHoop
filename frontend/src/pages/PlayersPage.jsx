import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const EXTENSIONS = ['jpg', 'png']

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
      className="group flex flex-col items-center gap-3 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0072ce] rounded-xl p-4 transition-all duration-200 hover:bg-gray-50"
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
          <div className="w-full h-full bg-[#0072ce] flex items-center justify-center">
            <span
              className="text-white font-bold select-none"
              style={{
                fontFamily: "'Bebas Neue', cursive",
                fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
              }}
            >
              {initials}
            </span>
          </div>
        )}
      </div>
      <span
        className="text-[#08060d] font-semibold text-base text-center leading-tight group-hover:text-[#0072ce] transition-colors duration-200"
        style={{ fontFamily: "'Rajdhani', sans-serif" }}
      >
        {player.name}
      </span>
    </button>
  )
}

export default function PlayersPage() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/players`)
      .then(res => {
        if (!res.ok) throw new Error('Viga mängijate laadimisel')
        return res.json()
      })
      .then(data => setPlayers(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-4 py-10">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3 p-4 animate-pulse">
            <div className="w-full aspect-square rounded-full bg-gray-200" />
            <div className="h-4 w-24 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p className="py-16 text-center text-red-600">{error}</p>
    )
  }

  return (
    <div className="px-4 py-10">
      <h1
        className="text-4xl text-[#08060d] mb-8 text-left"
        style={{ fontFamily: "'Bebas Neue', cursive", letterSpacing: '1px' }}
      >
        Mängijad
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {players.map(player => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  )
}
