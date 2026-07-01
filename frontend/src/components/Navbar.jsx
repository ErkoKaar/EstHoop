import { useState } from 'react'
import { Link } from 'react-router-dom'

const NAV_LINKS = [
  { label: 'Koondis', href: '/koondis' },
  { label: 'Mängijad', href: '/mangijad' },
  { label: 'Statistika', href: '/statistika' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav
      className="sticky top-0 z-50 w-screen -ml-[calc(50vw-50%)] bg-[#0072ce] shadow-md"
      style={{ fontFamily: "'Rajdhani', sans-serif" }}
    >
      <div className="mx-auto flex max-w-[1126px] items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 select-none cursor-pointer"
        >
          <img src="/logo/logo_white.png" alt="EstHoop logo" className="h-9 w-auto" />
          <span
            className="text-3xl tracking-widest text-white"
            style={{ fontFamily: "'Bebas Neue', cursive", letterSpacing: '2px' }}
          >
            EstHoop
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <NavLink href={href} label={label} />
            </li>
          ))}
        </ul>

        {/* Hamburger — mobile only */}
        <button
          onClick={() => setOpen(o => !o)}
          className="flex md:hidden flex-col justify-center items-center w-11 h-11 gap-[6px] cursor-pointer rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          aria-label={open ? 'Sulge menüü' : 'Ava menüü'}
          aria-expanded={open}
        >
          <span className={`block h-[2px] w-6 bg-white transition-all duration-200 origin-center ${open ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block h-[2px] w-6 bg-white transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
          <span className={`block h-[2px] w-6 bg-white transition-all duration-200 origin-center ${open ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-250 ease-in-out ${open ? 'max-h-48' : 'max-h-0'}`}
      >
        <ul className="flex flex-col list-none m-0 px-6 pb-4 gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <Link
                to={href}
                onClick={() => setOpen(false)}
                className="block py-2 font-semibold text-[17px] text-white/85 hover:text-white tracking-wide transition-colors duration-200 cursor-pointer"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

function NavLink({ href, label }) {
  return (
    <Link
      to={href}
      className="relative font-semibold text-[17px] tracking-wide text-white/85 hover:text-white no-underline transition-colors duration-200 cursor-pointer group"
    >
      {label}
      <span className="absolute left-0 -bottom-1 h-[2px] w-full bg-white scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-250 ease-out" />
    </Link>
  )
}
