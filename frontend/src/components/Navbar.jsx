import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { NAV_LINKS } from '../navigation'
import { getPreloadedNationalTeam, getPreloadedPlayers } from '../preload'
import SocialLinks from './SocialLinks'
import TeamFlag from './TeamFlag'
import { teamNameEt } from '../utils/teamNames'
import scheduleData from '../data/klubide_graafikud_2026-27.json'
import { buildScheduleRows, clubGameDay, HIDDEN_PLAYERS } from '../utils/clubSchedule'

const SHRINK_AT = 72
const GROW_AT = 24
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const BAR_BG = 'linear-gradient(90deg, #0054a0, #0072ce)'
// Nii lähedal olev koondise mäng on menüükaardil klubimängudest tähtsam
const NATIONAL_SOON = 7 * 86400
const CARD_LABEL = { margin: 0, fontWeight: 600, fontSize: 15, color: '#dbeafe' }
const CARD_BUTTON = 'menuu__nupp inline-flex min-h-11 items-center rounded-lg bg-white px-5 font-bold text-[17px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2'

// timeTBD mängul on kellaaeg platshoidja: loe see möödunuks alles päeva lõpus (nagu koondise lehel)
function pickNextGame(list) {
  const now = Date.now()
  return (list ?? [])
    .filter(ev => ev.startTimestamp * 1000 + (ev.timeTBD ? 86_400_000 : 0) > now)
    .sort((a, b) => a.startTimestamp - b.startTimestamp)[0] ?? null
}

function shortTournament(name = '') {
  if (name.includes('World Cup') && name.includes('Qualifiers')) return 'MM-valiksari'
  if (name.includes('EuroBasket') && name.includes('Qualifiers')) return 'EM-valiksari'
  if (name.includes('EuroBasket')) return 'EuroBasket'
  return name
}

// Kaart tuleb ainult brauseris pärast andmete saabumist, seega Date siin hydration'it ei lõhu
function NextGameCard({ game, onNavigate }) {
  const home = game.homeTeam?.name === 'Estonia'
  const date = new Date(game.startTimestamp * 1000)
  const day = date.toLocaleDateString('et-EE', { day: 'numeric', month: 'long', timeZone: 'Europe/Tallinn' })
  const time = date.toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Tallinn' })
  const team = { fontFamily: "'Bebas Neue', cursive", fontSize: '2.1rem', lineHeight: 1, letterSpacing: '0.5px', color: '#fff' }

  return (
    <aside className="menuu__kaart" aria-label="Järgmine mäng">
      <p style={CARD_LABEL}>Järgmine mäng</p>
      <div className="mt-3 grid gap-2">
        {[game.homeTeam?.name, game.awayTeam?.name].map(name => (
          <div key={name} className="flex items-center gap-3">
            <TeamFlag name={name} size={34} />
            <span style={team}>{teamNameEt(name)}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 mb-0 font-bold text-[17px] text-white">
        {day}{game.timeTBD ? '' : `, kell ${time}`}
      </p>
      <p className="m-0 font-semibold text-[15px]" style={{ color: '#dbeafe' }}>
        {home ? 'Kodumäng' : 'Võõrsil'}, {shortTournament(game.tournament?.name)}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        {home && (
          <Link to="/piletid" onClick={onNavigate} className={CARD_BUTTON} style={{ color: '#0072ce' }}>
            Piletid
          </Link>
        )}
        <Link
          to="/koondis"
          onClick={onNavigate}
          className="inline-flex min-h-11 items-center font-bold text-[17px] text-white underline decoration-white/40 decoration-2 underline-offset-4 transition-colors duration-150 hover:decoration-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 rounded"
        >
          Koondise mängud
        </Link>
      </div>
    </aside>
  )
}

// Koondise akende vahel: tänased klubimängud või järgmise mängupäeva omad
function ClubDayCard({ day, onNavigate }) {
  const rows = day.rows.slice(0, 3)
  const more = day.rows.length - rows.length
  const label = day.today
    ? 'Täna klubides'
    : `Järgmine klubimängupäev, ${new Date(day.rows[0].sortTimestamp * 1000).toLocaleDateString('et-EE', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Tallinn',
    })}`

  return (
    <aside className="menuu__kaart" aria-label={label}>
      <p style={CARD_LABEL}>{label}</p>
      <ul className="m-0 mt-3 grid list-none gap-3 p-0">
        {rows.map(r => (
          <li key={r.id}>
            <span className="block text-white" style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.7rem', lineHeight: 1, letterSpacing: '0.5px' }}>
              {r.players.map(p => p.name.split(' ').at(-1)).join(', ')}
            </span>
            <span className="block font-semibold text-[15px]" style={{ color: '#dbeafe' }}>
              {r.home ? `${r.club} - ${r.opponent}` : `${r.opponent} - ${r.club}`},{' '}
              {r.timeTBD ? 'aeg selgub' : `kell ${new Date(r.startTimestamp * 1000).toLocaleTimeString('et-EE', {
                hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Tallinn',
              })}`}
            </span>
          </li>
        ))}
      </ul>
      {more > 0 && (
        <p className="mt-3 mb-0 font-semibold text-[15px]" style={{ color: '#dbeafe' }}>
          ja veel {more} {more === 1 ? 'mäng' : 'mängu'}
        </p>
      )}
      <Link to="/klubikorvpall" onClick={onNavigate} className={`${CARD_BUTTON} mt-5`} style={{ color: '#0072ce' }}>
        Kõik klubimängud
      </Link>
    </aside>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [nextGame, setNextGame] = useState(null)
  const [clubPlayers, setClubPlayers] = useState(null)
  // Kaardi valiku ajahetk (sekundites); seatakse avamisel ja andmete saabudes,
  // et renderdamine ise kella ei loeks
  const [checkedAt, setCheckedAt] = useState(null)
  const location = useLocation()
  const reducedMotion = useReducedMotion()
  const navRef = useRef(null)
  const panelRef = useRef(null)
  const buttonRef = useRef(null)
  const gameRequested = useRef(false)

  useEffect(() => {
    // Hüsterees: väiksemaks läheb riba 72 piksli juures, tagasi suureks alles 24
    // juures. Ühe lävendiga võnkus riba lühikese lehe lõpus edasi-tagasi, sest
    // riba on voos ja kokkutõmbumine lühendab dokumenti ~20 piksli võrra. See
    // lükkas kerimiskoha lävendist tagasi allapoole, riba kasvas, dokument
    // pikenes ja ring algas otsast. 48 piksli surnud tsoon on sellest suurem.
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(prev => (prev ? y > GROW_AT : y > SHRINK_AT))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Kaardi andmed laetakse alles siis, kui menüü vaja läheb (hiir nupul või avamine),
  // mitte igal lehel. API ebaõnnestumisel proovitakse eelrenderdatud andmeid.
  function loadCardData() {
    if (gameRequested.current) return
    gameRequested.current = true
    const stamp = () => setCheckedAt(Math.floor(Date.now() / 1000))
    fetch(`${API}/national-team/games`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(data => setNextGame(pickNextGame(data?.upcoming)))
      .catch(() => setNextGame(pickNextGame(getPreloadedNationalTeam()?.upcoming)))
      .finally(stamp)
    const pre = getPreloadedPlayers()
    ;(pre ? Promise.resolve(pre) : fetch(`${API}/players`).then(r => (r.ok ? r.json() : [])))
      .then(list => setClubPlayers((Array.isArray(list) ? list : []).filter(p => !HIDDEN_PLAYERS.has(p.slug))))
      .catch(() => setClubPlayers([]))
      .finally(stamp)
  }

  const clubDay = useMemo(
    () => (clubPlayers?.length && checkedAt ? clubGameDay(buildScheduleRows(scheduleData, clubPlayers), checkedAt) : null),
    [clubPlayers, checkedAt],
  )
  const nationalSoon = nextGame && checkedAt && nextGame.startTimestamp - checkedAt < NATIONAL_SOON
  const card = nationalSoon ? 'national' : clubDay ? 'club' : nextGame ? 'national' : null

  // Lehe vahetus sulgeb menüü, ka brauseri tagasi-nupu puhul. Renderdamise ajal,
  // mitte effectis: nii ei joonistu uus leht hetkeks lahtise menüü all.
  const [menuPath, setMenuPath] = useState(location.pathname)
  if (menuPath !== location.pathname) {
    setMenuPath(location.pathname)
    setOpen(false)
  }

  // Lahti olles: leht ei keri, taust on inert (Tab ei lähe menüü alla), Esc sulgeb
  useEffect(() => {
    if (!open) return
    const own = [navRef.current, panelRef.current]
    const background = [...(navRef.current?.parentElement?.children ?? [])].filter(el => !own.includes(el))
    const onKey = e => {
      if (e.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    document.documentElement.style.overflow = 'hidden'
    background.forEach(el => el.setAttribute('inert', ''))
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = ''
      background.forEach(el => el.removeAttribute('inert'))
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Pikim sobiv tee võidab: /koondis/ajalugu on Ajalugu, mitte Koondis.
  // Juurteed peab võrdlema täpselt, startsWith('/') on tõene igal lehel.
  const activeHref = NAV_LINKS
    .filter(l => (l.href === '/' ? location.pathname === '/' : location.pathname.startsWith(l.href)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null

  // Lahtise menüü ajal on riba ja paneel üks pind: sama taust, varju pole
  const solid = open || !scrolled

  return (
    <>
      <nav
        ref={navRef}
        className={`sticky top-0 z-50 w-screen -ml-[calc(50vw-50%)] ${scrolled && !open ? 'backdrop-blur-md' : ''}`}
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          background: solid ? BAR_BG : 'linear-gradient(90deg, rgba(0,84,160,0.93), rgba(0,114,206,0.93))',
          boxShadow: open
            ? 'inset 0 1px 0 rgba(255,255,255,0.18)'
            : scrolled
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

          {/* Ribal on ainult sotsiaalikoonid (laual) ja menüünupp; lingid on täisekraani menüüs */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex">
              <SocialLinks />
            </div>
            <button
              ref={buttonRef}
              type="button"
              onClick={() => {
                loadCardData()
                // "Täna" värskeks ka siis, kui leht on kaua lahti olnud
                if (!open) setCheckedAt(Math.floor(Date.now() / 1000))
                setOpen(o => !o)
              }}
              onPointerEnter={loadCardData}
              className="menuu-nupp flex h-11 min-w-11 items-center justify-center gap-3 rounded px-1 text-white cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              aria-label={open ? 'Sulge menüü' : 'Ava menüü'}
              aria-expanded={open}
              aria-controls="peamenuu"
              data-open={open || undefined}
            >
              <span className="menuu-nupp__triibud" aria-hidden="true">
                <span />
                <span />
              </span>
              <span className="menuu-nupp__silt hidden md:grid font-semibold text-[17px] tracking-wide" aria-hidden="true">
                <span>Menüü</span>
                <span>Sulge</span>
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Väljaspool <nav>-i: kerides saab riba backdrop-filteri ja see teeks fixed-paneeli
          ribasuuruseks. Paneel on riba all (z-45), seega laskub nähtavalt riba seest. */}
      <div
        ref={panelRef}
        id="peamenuu"
        className="menuu"
        data-open={open || undefined}
        style={{ background: BAR_BG }}
      >
        <div className="menuu__sisu">
          <nav aria-label="Peamenüü">
            <ul className="menuu__lista m-0 grid list-none p-0">
              {NAV_LINKS.map(({ label, href }, i) => {
                const current = activeHref === href
                return (
                  <li key={href} style={{ '--i': i }}>
                    <Link
                      to={href}
                      onClick={() => setOpen(false)}
                      aria-current={current ? 'page' : undefined}
                      className="menuu__link rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4"
                    >
                      <span className="menuu__sona">
                        {label}
                        {/* Tablookuma: valge plaat sinise sõnaga, avaneb clip-path'iga vasakult */}
                        <span className="menuu__plaat" aria-hidden="true">{label}</span>
                      </span>
                      {current && <span aria-hidden="true" className="menuu__joon" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
          {card === 'national' && <NextGameCard game={nextGame} onNavigate={() => setOpen(false)} />}
          {card === 'club' && <ClubDayCard day={clubDay} onNavigate={() => setOpen(false)} />}
          {/* Laual on ikoonid ribal, siin ainult telefonis */}
          <div className="menuu__lisad">
            <SocialLinks large />
          </div>
        </div>
      </div>
    </>
  )
}
