import { Link } from 'react-router-dom'
import { NAV_LINKS } from '../navigation'
import SocialLinks from './SocialLinks'

const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"

const BLUE = '#0072ce'
const ICE = '#7fc4ff'
const TEXT = '#f0f4fa'
const MUTED = '#8a97ac'

// Kraabitavad allikad, millele omistus käib
const SOURCES = [
  { label: 'FIBA', href: 'https://www.fiba.basketball' },
  { label: 'ProBallers', href: 'https://www.proballers.com' },
]

// Alumise riba kolmas veerg, Severuni andmete järel
const LEGAL = [
  { to: '/privaatsus', label: 'Privaatsuspoliitika' },
  { to: '/tingimused', label: 'Kasutajatingimused' },
]

const EXTERNAL = [
  { label: 'Eesti Korvpalliliit', href: 'https://www.basket.ee' },
  { label: 'FIBA', href: 'https://www.fiba.basketball' },
  { label: 'Piletitasku', href: 'https://www.piletitasku.ee/et/search?category=193' },
]

const columnTitle = {
  fontFamily: FONT_BODY, color: MUTED, fontSize: '0.66rem', fontWeight: 700,
  letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 14px',
}

const linkStyle = {
  fontFamily: FONT_BODY, color: 'rgba(240,244,250,0.72)',
  fontWeight: 600, fontSize: '0.98rem',
}

function ExternalLink({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={linkStyle}
      className="transition-colors duration-150 hover:text-[#7fc4ff] focus-visible:outline
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7fc4ff]"
    >
      {label}
    </a>
  )
}

export default function Footer() {
  return (
    <footer style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)' }}>
      {/* Lipuribad pöördjärjestuses: valge sisu läheb tumedaks, hero teeb vastupidi */}
      <div>
        <div style={{ height: 7, background: 'rgba(255,255,255,0.93)' }} />
        <div style={{ height: 7, background: '#0a0a1a' }} />
        <div style={{ height: 7, background: BLUE }} />
      </div>

      <div style={{ background: '#06111f' }}>
        <div className="mx-auto w-full max-w-[1120px] px-6 pt-14 pb-10">
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr]">

            {/* Bränd */}
            <div>
              <Link
                to="/"
                className="mb-3 inline-flex items-center gap-3 focus-visible:outline
                           focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7fc4ff]"
              >
                <img src="/logo/logo_white.png" alt="" className="h-9 w-9 object-contain" />
                <span style={{ fontFamily: FONT_HEADING, color: TEXT, fontSize: '1.7rem', letterSpacing: 1, lineHeight: 1 }}>
                  EstHoop
                </span>
              </Link>
              <p
                style={{ fontFamily: FONT_BODY, color: MUTED, fontWeight: 500, fontSize: '0.98rem', lineHeight: 1.6 }}
                className="mb-5 max-w-xs"
              >
                Eesti korvpalli fännileht. Koondise mängud, mängijate profiilid ja statistika
                uuenevad iga päev.
              </p>
              <SocialLinks />
            </div>

            {/* Sisemine navigatsioon */}
            <nav aria-label="Footeri navigatsioon">
              <h2 style={columnTitle}>Leht</h2>
              <ul className="flex flex-col gap-2.5">
                {NAV_LINKS.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      to={href}
                      style={linkStyle}
                      className="transition-colors duration-150 hover:text-[#7fc4ff] focus-visible:outline
                                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7fc4ff]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Välised */}
            <div>
              <h2 style={columnTitle}>Mujal</h2>
              <ul className="flex flex-col gap-2.5">
                {EXTERNAL.map(l => (
                  <li key={l.href}><ExternalLink {...l} /></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Alumine riba */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-2 px-6 pt-6 pb-7 md:flex-row md:gap-10
                          md:items-center md:justify-between">
            <p style={{ fontFamily: FONT_BODY, color: '#6b7684', fontWeight: 500, fontSize: '0.85rem', lineHeight: 1.6 }}>
              © {new Date().getFullYear()} EstHoop. Fännileht, ei ole Eesti Korvpalliliidu
              ametlik veebileht.
              <br />
              Andmed:{' '}
              {SOURCES.map((s, i) => (
                <span key={s.href}>
                  {i > 0 && ', '}
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors duration-150 hover:text-[#7fc4ff]"
                    style={{ color: '#8a97ac', fontWeight: 600 }}
                  >
                    {s.label}
                  </a>
                </span>
              ))}
              .
            </p>

            <p
              style={{ fontFamily: FONT_BODY, color: '#6b7684', fontWeight: 500, fontSize: '0.85rem', lineHeight: 1.6 }}
              className="shrink-0"
            >
              Haldab{' '}
              {/* TOIMETADA: kontrolli, et severun.com on õige aadress */}
              <a
                href="https://severun.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-150 hover:text-[#7fc4ff] focus-visible:outline
                           focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7fc4ff]"
                style={{ color: ICE, fontWeight: 700 }}
              >
                Severun OÜ
              </a>
              {/* TOIMETADA: aadressile on vaja linna ja postiindeksit */}
              , registrikood 17564409, Töökoja 1
              <br />
              <a
                href="mailto:contact@severun.com"
                className="transition-colors duration-150 hover:text-[#7fc4ff] focus-visible:outline
                           focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7fc4ff]"
                style={{ color: '#8a97ac', fontWeight: 600 }}
              >
                contact@severun.com
              </a>
            </p>

            <nav aria-label="Õigusinfo" className="shrink-0">
              <ul className="flex flex-col gap-1.5">
                {LEGAL.map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      style={{ fontFamily: FONT_BODY, color: '#8a97ac', fontWeight: 600, fontSize: '0.85rem' }}
                      className="transition-colors duration-150 hover:text-[#7fc4ff] focus-visible:outline
                                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7fc4ff]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
