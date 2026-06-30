import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function PlayerPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [player, setPlayer] = useState(null)
  const [extIndex, setExtIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/players/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Mängijat ei leitud')
        return res.json()
      })
      .then(data => setPlayer(data))
      .catch(() => navigate('/mangijad', { replace: true }))
      .finally(() => setLoading(false))
  }, [slug, navigate])

  if (loading || !player) return null

  const initials = player.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="px-4 py-10 max-w-2xl">
      <button
        onClick={() => navigate('/mangijad')}
        className="flex items-center gap-2 text-[#0072ce] font-semibold mb-8 cursor-pointer hover:opacity-75 transition-opacity duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0072ce] rounded"
        style={{ fontFamily: "'Rajdhani', sans-serif" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Tagasi mängijate juurde
      </button>

      <div className="flex items-center gap-6 mb-10">
        <div className="w-24 h-24 rounded-full overflow-hidden shadow-md shrink-0">
          {extIndex < 2 ? (
            <img
              src={`/players/${player.slug}.${['jpg', 'png'][extIndex]}`}
              alt={player.name}
              className="w-full h-full object-cover object-top"
              onError={() => setExtIndex(i => i + 1)}
            />
          ) : (
            <div className="w-full h-full bg-[#0072ce] flex items-center justify-center">
              <span
                className="text-white font-bold text-2xl select-none"
                style={{ fontFamily: "'Bebas Neue', cursive" }}
              >
                {initials}
              </span>
            </div>
          )}
        </div>
        <h1
          className="text-4xl text-[#08060d]"
          style={{ fontFamily: "'Bebas Neue', cursive", letterSpacing: '1px' }}
        >
          {player.name}
        </h1>
      </div>

      <p
        className="text-gray-400 italic"
        style={{ fontFamily: "'Rajdhani', sans-serif" }}
      >
        Statistika tuleb varsti.
      </p>
    </div>
  )
}
