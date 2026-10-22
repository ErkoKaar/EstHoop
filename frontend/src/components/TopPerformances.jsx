// Parimad sooritused plakatitena: klubikorvpalli lehel ja avalehel. Andmed tulevad
// /club/highlights endpointist (backend/club_highlights.py), mis valib viimase kahe
// nädala parimad: igalt mängijalt üks mäng, järjestus EFF, punktid, uuem mäng.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { EXTENSIONS as PHOTO_EXTENSIONS } from './PlayerAvatar'
import Skeleton from './Skeleton'
import useIsMobile from '../hooks/useIsMobile'

const EASE = [0.22, 1, 0.36, 1]
const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"
const BLUE = '#0072ce'
const DARK = '#08060d'
const MUTED = '#8a97ac'

function statValue(v) {
  if (v == null) return '–'
  const str = String(v).trim()
  return str === '' || str === '-' ? '–' : str
}

function formatShortDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('et-EE', {
    day: 'numeric', month: 'short',
    timeZone: 'Europe/Tallinn',
  })
}

const TOP_STAGGER = 0.12

// EFF jookseb nullist lõppväärtuseni nagu tablool. MotionValue renderdatakse
// otse, nii et React ei renderda iga kaadri peal uuesti. minWidth hoiab laiuse
// lõppväärtuse järgi paigal, et kõrvalolev tekst numbri kasvades ei hüppaks.
function CountUp({ value, delay, style }) {
  const reduce = useReducedMotion()
  const format = v => (Number.isInteger(value) ? String(Math.round(v)) : v.toFixed(1))
  const mv = useMotionValue(reduce ? value : 0)
  const text = useTransform(mv, format)

  useEffect(() => {
    if (reduce) { mv.set(value); return }
    const controls = animate(mv, value, { duration: 0.9, delay, ease: EASE })
    return () => controls.stop()
  }, [mv, value, delay, reduce])

  return (
    <motion.span style={{ textAlign: 'right', ...style, display: 'inline-block', minWidth: `${format(value).length}ch` }}>
      {text}
    </motion.span>
  )
}

// Sinimustvalge duotoon: foto heledus kaardistatakse DARK -> BLUE. Valge taust
// muutub täpselt kaardi siniseks ja läbipaistev taust näitab kaarti ennast,
// nii et valge taustaga ja välja lõigatud fotod näevad ühesugused välja.
const DUOTONE_ID = 'parimad-duotoon'

function DuotoneFilter() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      <filter id={DUOTONE_ID} colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0" />
        <feComponentTransfer>
          <feFuncR type="table" tableValues="0.031 0" />
          <feFuncG type="table" tableValues="0.024 0.447" />
          <feFuncB type="table" tableValues="0.051 0.808" />
        </feComponentTransfer>
      </filter>
    </svg>
  )
}

// Foto sama laiendite järjekorraga nagu PlayerAvatar; kui ühtki pole, jääb
// kaart ilma fotota (tekst ja number kannavad kaardi ise).
function PosterPhoto({ slug, delay }) {
  const reduce = useReducedMotion()
  const [extIndex, setExtIndex] = useState(0)
  if (extIndex >= PHOTO_EXTENSIONS.length) return null

  return (
    <motion.img
      src={`/players/${slug}.${PHOTO_EXTENSIONS[extIndex]}`}
      alt=""
      onError={() => setExtIndex(i => i + 1)}
      className="h-full w-full object-cover object-top"
      style={{
        filter: `url(#${DUOTONE_ID})`,
        // Vasak serv hajub, et fotoruudu serv ei joonistuks numbri ja nime kõrvale
        maskImage: 'linear-gradient(to right, transparent 0%, #000 24%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 24%)',
      }}
      initial={reduce ? false : { opacity: 0, transform: 'translateY(12%)' }}
      animate={{ opacity: 1, transform: 'translateY(0%)' }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    />
  )
}

// Mõõdud: esikoht on suur plakat, 2. ja 3. väiksemad. EFF on igal kaardil
// suurim element, kohanumber ainult kontuurina taustal.
const POSTER_SIZES = {
  desktop: {
    lead: { poster: 352, pad: 20, eff: '7rem', name: '2.4rem', club: '0.95rem', ghost: '20rem', ghostLeft: '30%', stat: '1.6rem' },
    rest: { poster: 140, pad: 16, eff: '4.2rem', name: '1.5rem', club: '0.8rem', ghost: '9rem', ghostLeft: '34%', stat: '1.25rem' },
  },
  mobile: {
    lead: { poster: 250, pad: 16, eff: '5.25rem', name: '1.9rem', club: '0.85rem', ghost: '14rem', ghostLeft: '34%', stat: '1.4rem' },
    rest: { poster: 150, pad: 12, eff: '3.4rem', name: '1.15rem', club: '0.72rem', ghost: '8rem', ghostLeft: '30%', stat: '1.1rem' },
  },
}

// Esikoht suure plakatina, 2. ja 3. kõrval väiksematena (töölaual paremal
// üksteise all, mobiilis esikoha all kõrvuti). Kaardid avanevad kohtade
// kaupa altpoolt üles, foto tõuseb ja EFF jookseb nullist.
export default function TopPerformances({
  entries,
  loading,
  title = 'Parimad sooritused',
  subtitle = 'Viimase kahe nädala kõrgeim efektiivsus (EFF), igalt mängijalt parim mäng',
  headingId = 'parimad-sooritused',
  className = 'mb-8',
}) {
  const isMobile = useIsMobile()
  const reduce = useReducedMotion()
  const n = entries.length
  const sizes = POSTER_SIZES[isMobile ? 'mobile' : 'desktop']

  const gridStyle = isMobile
    ? { gridTemplateColumns: n === 3 ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 1fr)' }
    : {
        gridTemplateColumns: n === 1 ? 'minmax(0, 1fr)' : 'minmax(0, 1.35fr) minmax(0, 1fr)',
        gridTemplateRows: n === 3 ? 'auto auto' : 'auto',
      }

  return (
    <section aria-labelledby={headingId} className={`${className} text-left`}>
      <h2 id={headingId} style={{ fontFamily: FONT_HEADING, fontSize: '1.6rem', letterSpacing: '1px', lineHeight: 1, color: DARK }}>
        {title}
      </h2>
      <p className="mt-1 mb-3" style={{ fontFamily: FONT_BODY, fontSize: '0.9rem', color: '#6b7280', fontWeight: 500 }}>
        {subtitle}
      </p>

      {loading ? (
        <Skeleton className={isMobile ? 'h-[34rem]' : 'h-[26rem]'} />
      ) : (
        <>
          <DuotoneFilter />
          <ol role="list" className="grid gap-2" style={gridStyle}>
            {entries.map((game, i) => {
              const { eff } = game
              const lead = i === 0
              const s = lead ? sizes.lead : sizes.rest
              const { player, event: ev, playerIsHome, stats } = game
              const ownScore = playerIsHome ? ev.homeScore?.current : ev.awayScore?.current
              const oppScore = playerIsHome ? ev.awayScore?.current : ev.homeScore?.current
              const club = playerIsHome ? ev.homeTeam?.name : ev.awayTeam?.name
              const opponent = playerIsHome ? ev.awayTeam?.name : ev.homeTeam?.name
              const won = game.result === 'W' ? true : game.result === 'L' ? false : ownScore !== oppScore ? ownScore > oppScore : null
              const outcome = won == null ? 'Lõpp' : won ? 'Võit' : 'Kaotus'
              const outcomeColor = won == null ? MUTED : won ? '#4ade80' : '#f87171'
              const delay = i * TOP_STAGGER
              const placement = isMobile
                ? { gridColumn: lead || n < 3 ? '1 / -1' : undefined }
                : { gridRow: lead && n === 3 ? '1 / span 2' : undefined }
              const compact = isMobile && !lead && n === 3

              return (
                <motion.li
                  key={player.slug}
                  className="group relative flex flex-col overflow-hidden rounded-2xl"
                  style={{ background: BLUE, ...placement }}
                  // Kaart avaneb altpoolt üles (clip-path), vähendatud liikumisega ainult hajub
                  initial={reduce ? { opacity: 0 } : { clipPath: 'inset(100% 0% 0% 0% round 16px)' }}
                  animate={reduce ? { opacity: 1 } : { clipPath: 'inset(0% 0% 0% 0% round 16px)' }}
                  transition={{ duration: reduce ? 0.2 : 0.7, ease: EASE, delay }}
                >
                  {/* Kogu kaart on link profiilile; DOM-is esimene, et Tab jõuaks enne profiili, siis skoori */}
                  <Link
                    to={`/mangijad/${player.slug}`}
                    aria-label={`${player.name}, EFF ${statValue(stats.EFF)}`}
                    className="absolute inset-0 z-10 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:-outline-offset-4"
                  />
                  <div className="relative flex flex-1 flex-col overflow-hidden" style={{ minHeight: s.poster }}>
                    {/* Foto paremas servas, ruut poster'i kõrgusest; hover suumib aeglaselt */}
                    <div
                      className="absolute bottom-0 right-0 h-full aspect-square origin-bottom transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
                    >
                      <PosterPhoto slug={player.slug} delay={delay + 0.12} />
                    </div>

                    {/* Kohanumber kontuurina fotol, ei konkureeri EFF-iga */}
                    <motion.span
                      aria-hidden="true"
                      className="absolute pointer-events-none select-none"
                      style={{
                        left: s.ghostLeft, bottom: '-0.08em',
                        fontFamily: FONT_HEADING, fontSize: s.ghost, lineHeight: 0.8,
                        color: 'transparent', WebkitTextStroke: `${lead ? 3 : 2}px rgba(255,255,255,0.32)`,
                      }}
                      initial={reduce ? false : { opacity: 0, transform: 'translateX(-10%)' }}
                      animate={{ opacity: 1, transform: 'translateX(0%)' }}
                      transition={{ duration: 0.9, ease: EASE, delay: delay + 0.08 }}
                    >
                      {i + 1}
                    </motion.span>

                    {/* Tumenev üleminek alla: nimi loetav ja kaart sulandub tabloo ribasse */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(to top, rgba(8,6,13,0.62) 0%, rgba(8,6,13,0) 48%)' }}
                    />

                    <div className="relative flex flex-1 flex-col justify-between gap-3" style={{ padding: s.pad }}>
                      <div className="flex flex-col items-start">
                        <CountUp
                          value={eff}
                          delay={delay + 0.2}
                          style={{
                            textAlign: 'left', fontFamily: FONT_HEADING, fontSize: s.eff, lineHeight: 0.82,
                            color: '#fff', letterSpacing: '0.5px', fontVariantNumeric: 'tabular-nums',
                          }}
                        />
                        <span style={{ fontFamily: FONT_BODY, fontSize: lead ? '0.85rem' : '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: '#fff', marginTop: 4 }}>
                          EFF
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span
                          className="block text-white decoration-2 underline-offset-4 group-hover:underline"
                          style={{ fontFamily: FONT_HEADING, fontSize: s.name, letterSpacing: '0.5px', lineHeight: 0.95, overflowWrap: 'anywhere' }}
                        >
                          {player.name}
                        </span>
                        <span className="block" style={{ fontFamily: FONT_BODY, fontSize: s.club, fontWeight: 600, color: '#fff', marginTop: 4, lineHeight: 1.2 }}>
                          {club}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tabloo riba nagu mängureal */}
                  <div
                    className="flex flex-wrap items-center gap-x-4 gap-y-1"
                    style={{ background: DARK, padding: `${compact ? 8 : 10}px ${s.pad}px` }}
                  >
                    <div className="flex gap-4">
                      {['PTS', 'REB', 'AST'].map(k => (
                        <div key={k} className="flex flex-col">
                          <span style={{ fontFamily: FONT_HEADING, fontSize: s.stat, color: '#fff', letterSpacing: '0.5px', lineHeight: 1 }}>
                            {statValue(stats[k])}
                          </span>
                          <span style={{ fontFamily: FONT_BODY, fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.08em', color: MUTED, marginTop: 2 }}>
                            {k}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div
                      className={compact ? '' : 'ml-auto text-right'}
                      style={{ fontFamily: FONT_BODY, fontSize: compact ? '0.72rem' : '0.8rem', fontWeight: 600, color: MUTED, lineHeight: 1.25 }}
                    >
                      <div>
                        <span style={{ color: outcomeColor }}>{outcome}</span>{' '}
                        {/* Skoor viib ProBallersi mängu lehele ja on kaardi profiililingist kõrgemal */}
                        {ev.gameUrl ? (
                          <a
                            href={ev.gameUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Vaata mängu statistikat ProBallersis"
                            className="relative z-20 inline-block -my-2 py-2 rounded text-white underline decoration-white/40 decoration-2 underline-offset-4
                                       transition-colors duration-150 hover:decoration-white
                                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                          >
                            {ownScore}:{oppScore}
                          </a>
                        ) : (
                          <span style={{ color: outcomeColor }}>{ownScore}:{oppScore}</span>
                        )}
                        {' '}vs {opponent}
                      </div>
                      <div>{formatShortDate(ev.startTimestamp)}</div>
                    </div>
                  </div>
                </motion.li>
              )
            })}
          </ol>
        </>
      )}
    </section>
  )
}

