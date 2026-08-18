import { useEffect } from 'react'
import { useLoading } from '../contexts/LoadingContext'

// Jagatud raam privaatsuspoliitikale ja kasutajatingimustele. Mõlemal on identne
// tüpograafia, ainult sisu erineb, seega stiilid elavad ühes kohas.

const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"
const DARK = '#08060d'
const BODY_TEXT = '#3f4654'
const MUTED = '#6b7280'

const bodyStyle = {
  fontFamily: FONT_BODY, color: BODY_TEXT, fontWeight: 500,
  fontSize: '1.02rem', lineHeight: 1.7,
}

export function P({ children }) {
  return <p style={bodyStyle} className="mb-4">{children}</p>
}

export function Ul({ children }) {
  return (
    <ul style={bodyStyle} className="mb-4 list-disc pl-5 [&>li]:mb-2">
      {children}
    </ul>
  )
}

export function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2
        style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(1.4rem, 3.5vw, 1.8rem)', color: DARK, letterSpacing: 0.8 }}
        className="mb-3"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function LegalLayout({ title, intro, updated, children }) {
  const { signalReady } = useLoading()

  useEffect(() => { signalReady() }, [])

  return (
    <div className="mx-auto w-full max-w-2xl px-6 pt-20 pb-24">
      <h1
        style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(2.2rem, 6vw, 3.2rem)', color: DARK, letterSpacing: 1, lineHeight: 1.05 }}
        className="mb-3"
      >
        {title}
      </h1>

      {intro && (
        <p style={{ ...bodyStyle, fontSize: '1.12rem' }} className="mb-2">
          {intro}
        </p>
      )}

      <p
        style={{ fontFamily: FONT_BODY, color: MUTED, fontWeight: 600, fontSize: '0.88rem' }}
        className="mb-12"
      >
        Viimati uuendatud: {updated}
      </p>

      {children}
    </div>
  )
}
