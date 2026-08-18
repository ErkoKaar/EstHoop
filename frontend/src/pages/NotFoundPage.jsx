import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLoading } from '../contexts/LoadingContext'
import Seo from '../components/Seo'

const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"
const BLUE = '#0072ce'
const DARK = '#08060d'

const LINKS = [
  { to: '/koondis', label: 'Koondis' },
  { to: '/mangijad', label: 'Mängijad' },
  { to: '/statistika', label: 'Statistika' },
  { to: '/klubikorvpall', label: 'Klubikorvpall' },
  { to: '/piletid', label: 'Piletid' },
]

export default function NotFoundPage() {
  const { signalReady } = useLoading()

  useEffect(() => { signalReady() }, [])

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-24 text-center">
      {/*
        Staatiline SPA ei saa päris 404 staatust tagastada — vercel.json kirjutab kõik
        teed index.html peale ümber. noindex hoiab ära, et Google prügi-URL-e indekseerib.
      */}
      <Seo
        title="Lehte ei leitud"
        description="Seda lehte EstHoopis ei ole. Vaata koondise mänge, mängijate profiile või statistikat."
        noindex
      />

      <p
        style={{ fontFamily: FONT_HEADING, fontSize: '5rem', color: BLUE, letterSpacing: 2, lineHeight: 1 }}
      >
        404
      </p>
      <h1
        style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', color: DARK, letterSpacing: 1 }}
        className="mb-3"
      >
        Sellist lehte ei ole
      </h1>
      <p
        style={{ fontFamily: FONT_BODY, color: '#6b7280', fontWeight: 500, fontSize: '1.05rem' }}
        className="mb-8"
      >
        Link võib olla vana või kirjaviga sisse lipsanud. Proovi siit:
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className="rounded-full bg-gray-100 px-5 py-2 font-bold text-gray-700
                       transition-colors duration-150 hover:bg-gray-200
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0072ce]"
            style={{ fontFamily: FONT_BODY }}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
