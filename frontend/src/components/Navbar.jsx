import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { NAV_LINKS } from '../navigation'
import SocialLinks from './SocialLinks'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hovered, setHovered] = useState(null)
  const location = useLocation()
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Juurteed peab võrdlema täpselt: startsWith('/') on tõene igal lehel ja
  // tõmbaks aktiivse oleku alati Avalehe alla
  const activeHref = NAV_LINKS.find(l =>
    l.href === '/' ? location.pathname === '/' : location.pathname.startsWith(l.href)
  )?.href ?? null
  // joon puhkab aktiivse lingi all, hoverdades voolab hovered lingi alla
  const inkHref = hovered ?? activeHref

  return (
    <nav
      className={`sticky top-0 z-50 w-screen -ml-[calc(50vw-50%)] ${scrolled ? 'backdrop-blur-md' : ''}`}
      style={{
        fontFamily: "'Rajdhani', sans-serif",
        background: scrolled
          ? 'linear-gradient(90deg, rgba(0,84,160,0.93), rgba(0,114,206,0.93))'
          : 'linear-gradient(90deg, #0054a0, #0072ce)',
        boxShadow: scrolled
          ? 'inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 24px rgba(2,20,50,0.35)'
          : 'inset 0 1px 0 rgba(255,255,255,0.18), 0 2px 8px rgba(2,20,50,0.25)',
        transition: 'box-shadow 0.3s ease, background 0.3s ease',
      }}
    >
      <div className={`mx-auto flex max-w-[1126px] items-center justify-between px-6 transition-[padding] duration-300 ${scrolled ? 'py-2' : 'py-4'}`}>
        {/* Logo — hoverdades teeb pall ühe täispöörde */}
        <Link
          to="/"
          className="group flex items-center gap-2 select-none cursor-pointer"
        >
          <img
            src="/logo/logo_white.png"
            alt="EstHoop logo"
            className={`w-auto transition-all duration-500 ease-out ${reducedMotion ? '' : 'group-hover:rotate-[360deg]'} ${scrolled ? 'h-8' : 'h-9'}`}
          />
          <span
            className="text-3xl tracking-widest text-white"
            style={{ fontFamily: "'Bebas Neue', cursive", letterSpacing: '2px' }}
          >
            EstHoop
          </span>
        </Link>

        {/* Desktop links + social badges */}
        <div className="hidden md:flex items-center gap-9">
          <ul
            className="flex items-center gap-8 list-none m-0 p-0"
            onMouseLeave={() => setHovered(null)}
          >
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href} className="relative">
                <Link
                  to={href}
                  onMouseEnter={() => setHovered(href)}
                  onFocus={() => setHovered(href)}
                  onBlur={() => setHovered(null)}
                  className={`relative block font-semibold text-[17px] tracking-wide no-underline transition-colors duration-200 cursor-pointer ${
                    activeHref === href ? 'text-white' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {label}
                </Link>
                {inkHref === href && (
                  <motion.span
                    layoutId="nav-ink"
                    transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 40 }}
                    className="absolute left-0 right-0 -bottom-[6px] h-[2px] rounded-full bg-white"
                    style={{ boxShadow: '0 0 8px rgba(255,255,255,0.7)' }}
                  />
                )}
              </li>
            ))}
          </ul>
          <SocialLinks />
        </div>

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

      {/* Mobile menu — kõrguse animatsioon + lingid astmeliselt */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="md:hidden overflow-hidden"
            initial={reducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <ul className="flex flex-col list-none m-0 px-6 pb-4 gap-1">
              {NAV_LINKS.map(({ label, href }, i) => (
                <motion.li
                  key={href}
                  initial={reducedMotion ? false : { opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: reducedMotion ? 0 : 0.05 + i * 0.04, duration: 0.25 }}
                >
                  <Link
                    to={href}
                    onClick={() => setOpen(false)}
                    className={`block py-2 font-semibold text-[17px] tracking-wide transition-colors duration-200 cursor-pointer ${
                      activeHref === href ? 'text-white' : 'text-white/85 hover:text-white'
                    }`}
                  >
                    {label}
                  </Link>
                </motion.li>
              ))}
            </ul>
            <div className="flex justify-center gap-4 pb-5">
              <SocialLinks />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

