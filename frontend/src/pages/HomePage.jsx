import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useLoading } from '../contexts/LoadingContext'
import Seo, { SITE_URL } from '../components/Seo'

// Kaardid animeeruvad lingil endal, et grid-lapse venitus jääks samaks
const MotionLink = motion.create(Link)

const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"

// Sama palett mis koondise lehel
const BLUE = '#0072ce'
const TEXT = '#f0f4fa'
const MUTED = '#8a97ac'
const DARK = '#08060d'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
})

// Sama liikumine kerimisel, ühtlustatud koondise lehe reveal-väärtustega
const revealUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay },
})

const HERO_BG = '#06111f'

// Foto ja teksti vahele ei tule sirget serva, vaid koondisesärgi külgvolt:
// sinine/must/valge piirdeliist, kaardus nagu kolmepunktijoon. Kaar on
// keskelt kõige laiem, seega lõikab see fotost ainult tühjad ülemised ja
// alumised nurgad, mitte figuuri.
//
// clipPath kasutab objectBoundingBox ühikuid (0..1), et kuju venikski
// paneeliga kaasa. Liistu joonistab sama kaar kolm korda, laiemast
// kitsamani: pealtvaates annab see peegelpildis triibu ilma kolme eraldi
// kõverat arvutamata. non-scaling-stroke hoiab jämeduse pikslites, kuigi
// preserveAspectRatio="none" venitab koordinaadistikku ebaühtlaselt.
const SEAM_CLIP_DESKTOP = 'M0.12,0 Q-0.12,0.5 0.12,1 L1,1 L1,0 Z'
const SEAM_PATH_DESKTOP = 'M12,0 Q-12,50 12,100'
const SEAM_CLIP_MOBILE = 'M0,0 L1,0 L1,0.86 Q0.5,1.04 0,0.86 Z'
const SEAM_PATH_MOBILE = 'M0,86 Q50,104 100,86'

const SEAM_BANDS = [
  { width: 7, color: BLUE },
  { width: 4.5, color: '#0a0a1a' },
  { width: 2, color: 'rgba(255,255,255,0.92)' },
]

// Foto on kõrgvõtmes: valge särk valges saalis. Kate ei lange tekstile, vaid
// jääb kärpe sisse ja tumendab ainult foto ülaserva ning välimist serva, et
// hele pool istuks tumeda kõrval, mitte ei paistaks eraldi kleebitud pildina.
const PHOTO_SCRIM_TOP =
  'linear-gradient(180deg, rgba(4,9,22,0.42) 0%, rgba(4,9,22,0.16) 12%, rgba(4,9,22,0) 24%)'

// Ainult lauaarvutis: seal jookseb foto ekraani servani ja vajab sulgevat
// äärt. Mobiilis on riba täislaiuses, ühepoolne tumendus mõjuks vinjetina.
const PHOTO_SCRIM_EDGE =
  'linear-gradient(270deg, rgba(4,9,22,0.28) 0%, rgba(4,9,22,0) 32%)'

// Positsioneerimine peab jääma div'i peale, mitte svg'le. SVG on CSS mõistes
// asendatav element: selle auto-laius tuleks viewBox'i kuvasuhtest ja right
// jäetaks vahele, nii et liist venitataks eri laiuse peal kui foto kärbe ja
// triiviks kaare pealt maha. h-full/w-full mõõdetakse div'i sisukastist, mis
// on foto ümbrisega täpselt sama kast.
function SeamStroke({ d, className }) {
  return (
    <div className={className} aria-hidden="true">
      {/* overflow visible, sest liistu välimine pool ulatub kaare tipus
          viewBox'ist välja */}
      <svg
        viewBox="0 0 100 100" preserveAspectRatio="none"
        className="h-full w-full" style={{ overflow: 'visible' }}
      >
        {SEAM_BANDS.map(b => (
          <path
            key={b.width} d={d} fill="none" stroke={b.color} strokeWidth={b.width}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  )
}

// ── Ikoonid (sama stiil mis Navbaris: joonistatud, mitte täidetud) ──
function Icon({ children, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}
    >
      {children}
    </svg>
  )
}

const FlagIcon = p => <Icon {...p}><path d="M5 21V4" /><path d="M5 4.5h11l-2.2 3.4L16 11.3H5" /></Icon>
const PlayerIcon = p => <Icon {...p}><circle cx="12" cy="7.6" r="3.9" /><path d="M4.6 20.4a7.4 7.4 0 0 1 14.8 0" /></Icon>
const ChartIcon = p => <Icon {...p}><path d="M4 20h16" /><path d="M7.5 20v-4.5" /><path d="M12 20V8" /><path d="M16.5 20v-8" /></Icon>
const GlobeIcon = p => <Icon {...p}><circle cx="12" cy="12" r="8.6" /><path d="M3.4 12h17.2" /><ellipse cx="12" cy="12" rx="3.8" ry="8.6" /></Icon>
const TicketIcon = p => <Icon {...p}><path d="M4 8.4a1.8 1.8 0 0 1 1.8-1.8h12.4A1.8 1.8 0 0 1 20 8.4v1.8a2 2 0 0 0 0 3.6v1.8a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 15.6v-1.8a2 2 0 0 0 0-3.6z" /><path d="M13.4 7.2v1.6M13.4 11.2v1.6M13.4 15.2v1.6" /></Icon>

const PRIMARY = [
  {
    to: '/koondis',
    label: 'Koondis',
    Icon: FlagIcon,
    text: 'Järgmised mängud, viimased tulemused ja alagrupi seis. Iga mängitud kohtumise juurest avaneb koondislaste statistika.',
  },
  {
    to: '/mangijad',
    label: 'Mängijad',
    Icon: PlayerIcon,
    text: 'Kõigi koondislaste profiilid: positsioon, vanus, pikkus ja statistika nii koondises kui klubis.',
  },
]

const SECONDARY = [
  { to: '/statistika', label: 'Statistika', Icon: ChartIcon, text: 'Pingeread punktide, lauapallide ja söötude järgi' },
  { to: '/klubikorvpall', label: 'Klubikorvpall', Icon: GlobeIcon, text: 'Eestlaste mängud klubides üle maailma' },
  { to: '/piletid', label: 'Piletid', Icon: TicketIcon, text: 'Kodumängude piletid ja mängupäevad' },
]

const JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'EstHoop',
    url: `${SITE_URL}/`,
    inLanguage: 'et-EE',
    description:
      'Eesti korvpallikoondise mängud, mängijate profiilid ja statistika ühes kohas.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'EstHoop',
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/logo/logo.png`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: 'Eesti korvpallikoondis',
    alternateName: [
      'Eesti meeste korvpallikoondis',
      'Eesti rahvuskoondis korvpallis',
      'Estonia national basketball team',
    ],
    sport: 'Korvpall',
    url: `${SITE_URL}/koondis`,
    logo: `${SITE_URL}/logo/logo.png`,
    // TOIMETADA: kontrolli, et peatreener on endiselt Heiko Rannula
    coach: { '@type': 'Person', name: 'Heiko Rannula' },
    memberOf: {
      '@type': 'SportsOrganization',
      name: 'Eesti Korvpalliliit',
      url: 'https://www.basket.ee',
    },
  },
]

// Iga pealkirjarida libiseb oma maski tagant välja. Bebas Neue jaoks loeb see
// palju paremini kui tuhmumine, ja on sama võte mis spordiülekannete tiitlites.
function RevealLine({ children, delay, reducedMotion, style }) {
  if (reducedMotion) return <span style={{ display: 'block', ...style }}>{children}</span>
  return (
    <span style={{ display: 'block', overflow: 'hidden' }}>
      <motion.span
        style={{ display: 'block', ...style }}
        initial={{ y: '116%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay }}
      >
        {children}
      </motion.span>
    </span>
  )
}

// ── Eesti lipp üleminekuna tumedalt valgele (sama võte mis koondisel) ──
function FlagStripes() {
  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ height: 7, background: BLUE }} />
      <div style={{ height: 7, background: '#0a0a1a' }} />
      <div style={{ height: 7, background: 'rgba(255,255,255,0.93)' }} />
    </div>
  )
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function PrimaryCard({ to, label, text, Icon: CardIcon, reveal, delay }) {
  return (
    <MotionLink
      to={to}
      {...reveal(delay)}
      className="group flex flex-col rounded-xl border border-gray-200 bg-white p-7 shadow-sm
                 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0072ce]
                 hover:shadow-md focus-visible:outline focus-visible:outline-2
                 focus-visible:outline-offset-2 focus-visible:outline-[#0072ce]"
    >
      <div className="mb-2 flex items-center gap-3">
        <CardIcon className="h-7 w-7 shrink-0" style={{ color: BLUE }} />
        <h3
          style={{ fontFamily: FONT_HEADING, fontSize: '1.85rem', color: DARK, letterSpacing: 1, lineHeight: 1 }}
          className="transition-colors duration-200 group-hover:text-[#0072ce]"
        >
          {label}
        </h3>
        <span className="ml-auto" style={{ color: BLUE }}><Arrow /></span>
      </div>
      <p style={{ fontFamily: FONT_BODY, color: '#6b7280', fontWeight: 500, fontSize: '1.02rem', lineHeight: 1.55 }}>
        {text}
      </p>
    </MotionLink>
  )
}

function SecondaryRow({ to, label, text, Icon: RowIcon }) {
  // Eraldusjooned tulevad konteineri divide-utilitidest, et need pöörduks
  // mobiili horisontaalsest lauaarvuti vertikaalseks ilma JS-ita
  return (
    <Link
      to={to}
      className="group flex items-center gap-3.5 px-6 py-5 transition-colors duration-150
                 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2
                 focus-visible:outline-offset-2 focus-visible:outline-[#0072ce]
                 md:flex-1 md:flex-col md:items-start md:gap-1.5 md:py-6"
    >
      <span className="flex items-center gap-2.5 shrink-0">
        <RowIcon className="h-5 w-5 shrink-0" style={{ color: BLUE }} />
        <span
          style={{ fontFamily: FONT_HEADING, fontSize: '1.25rem', color: DARK, letterSpacing: 1, lineHeight: 1 }}
          className="transition-colors duration-200 group-hover:text-[#0072ce]"
        >
          {label}
        </span>
      </span>
      <span
        style={{ fontFamily: FONT_BODY, color: '#9ca3af', fontWeight: 500, fontSize: '0.92rem', lineHeight: 1.4 }}
        className="min-w-0"
      >
        {text}
      </span>
    </Link>
  )
}

export default function HomePage() {
  const { signalReady } = useLoading()
  const reducedMotion = useReducedMotion()

  // Avaleht ei oota andmeid, seega vabasta laadimisriba kohe
  useEffect(() => { signalReady() }, [])

  const anim = reducedMotion ? () => ({}) : fadeUp
  const reveal = reducedMotion ? () => ({}) : revealUp

  return (
    <>
      <Seo
        path="/"
        description={
          'EstHoop koondab Eesti korvpallikoondise mängud, mängijate profiilid ja statistika ' +
          'ühte kohta. Vaata rahvuskoondise tulemusi, alagrupi seisu, koondislaste pingeridu ' +
          'ja Eesti mängijate käekäiku klubides.'
        }
        image={`${SITE_URL}/hero.jpg`}
        jsonLd={JSON_LD}
      />

      {/* ── Hero ──────────────────────────────────────────── */}
      <div style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)' }}>
        {/* Kaarelõiked. objectBoundingBox tähendab, et sama kuju venib nii
            mobiili horisontaalse riba kui lauaarvuti vertikaalse paneeliga. */}
        <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
          <defs>
            <clipPath id="heroSeamMobile" clipPathUnits="objectBoundingBox">
              <path d={SEAM_CLIP_MOBILE} />
            </clipPath>
            <clipPath id="heroSeamDesktop" clipPathUnits="objectBoundingBox">
              <path d={SEAM_CLIP_DESKTOP} />
            </clipPath>
          </defs>
        </svg>

        <div className="relative overflow-hidden" style={{ background: HERO_BG }}>
          {/* --band hoiab mobiiliriba kõrguse ja sellest tuleneva teksti
              ülapadding'u ühest kohast. Lauaarvutis kaob riba ära ja foto
              läheb paremasse paneeli, seega lg: nullib mõlemad. */}
          <div
            className="relative mx-auto w-full max-w-[1120px] px-6
                       pt-[calc(var(--band)+2rem)] pb-14
                       lg:flex lg:min-h-[min(78vh,720px)] lg:items-center lg:pt-0 lg:pb-0"
            style={{ '--band': 'clamp(230px, 40vh, 340px)' }}
          >
            {/* Foto. Mobiilis täislaiuses riba ülal, lauaarvutis parem paneel,
                mis murrab konteinerist välja ekraani servani. Tekstile katet
                ei lange, kumbki elab omal pool õmblust. */}
            <div
              className="absolute left-0 right-0 top-0 h-[var(--band)]
                         [clip-path:url(#heroSeamMobile)]
                         lg:bottom-0 lg:left-[48%] lg:right-[calc(50%-50vw)] lg:h-auto
                         lg:[clip-path:url(#heroSeamDesktop)]"
            >
              <motion.img
                src="/kotsar.webp"
                alt="Maik-Kalev Kotsar Eesti korvpallikoondise särgis"
                width="2400"
                height="1600"
                loading="eager"
                fetchPriority="high"
                className="h-full w-full object-cover object-[48%_6%]"
                {...(reducedMotion ? {} : {
                  initial: { opacity: 0, scale: 1.06 },
                  animate: { opacity: 1, scale: 1 },
                  transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
                })}
              />
              <div className="absolute inset-0" style={{ background: PHOTO_SCRIM_TOP }} />
              <div className="absolute inset-0 hidden lg:block" style={{ background: PHOTO_SCRIM_EDGE }} />
            </div>

            {/* Piirdeliist käib lõikejoone peal, seega jääb kärpest välja */}
            <SeamStroke
              d={SEAM_PATH_MOBILE}
              className="pointer-events-none absolute left-0 right-0 top-0 h-[var(--band)] lg:hidden"
            />
            <SeamStroke
              d={SEAM_PATH_DESKTOP}
              className="pointer-events-none absolute bottom-0 top-0 hidden
                         lg:left-[48%] lg:right-[calc(50%-50vw)] lg:block"
            />

            <div className="relative z-10 lg:w-[46%] lg:py-24 lg:pr-8">
              <motion.p
                {...anim(0.05)}
                style={{
                  fontFamily: FONT_BODY, color: MUTED, fontSize: '0.7rem', fontWeight: 700,
                  letterSpacing: '0.22em', textTransform: 'uppercase', margin: '0 0 20px',
                }}
              >
                Eesti korvpalli fännileht
              </motion.p>

              <h1
                style={{
                  fontFamily: FONT_HEADING, fontSize: 'clamp(3.1rem, 13vw, 5.9rem)',
                  letterSpacing: 2, lineHeight: 0.88, textTransform: 'uppercase',
                  margin: '0 0 22px',
                }}
              >
                <RevealLine delay={0.2} reducedMotion={reducedMotion} style={{ color: TEXT }}>
                  Eesti
                </RevealLine>
                {/* Sama täidetud/kontuur duaal mis koondise heros eristab meid vastasest */}
                <RevealLine
                  delay={0.3}
                  reducedMotion={reducedMotion}
                  style={{
                    color: 'rgba(240,244,250,0.08)',
                    WebkitTextStroke: '1.5px rgba(240,244,250,0.6)',
                  }}
                >
                  Korvpall
                </RevealLine>
              </h1>

              <motion.p
                {...anim(0.46)}
                style={{
                  fontFamily: FONT_BODY, color: 'rgba(240,244,250,0.74)', fontWeight: 500,
                  fontSize: '1.1rem', lineHeight: 1.6, margin: '0 0 30px',
                }}
              >
                Koondise mängud ja tulemused, kõigi koondislaste profiilid ning statistika
                nii rahvuskoondises kui klubides üle maailma.
              </motion.p>

              <motion.div {...anim(0.56)} className="flex flex-wrap gap-3">
                <Link
                  to="/koondis"
                  className="rounded-full px-7 py-3 transition-opacity duration-200 hover:opacity-85
                             focus-visible:outline focus-visible:outline-2
                             focus-visible:outline-offset-2 focus-visible:outline-[#7fc4ff]"
                  style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: '0.98rem', letterSpacing: 0.5, background: BLUE, color: 'white' }}
                >
                  Koondise mängud
                </Link>
                <Link
                  to="/mangijad"
                  className="rounded-full border px-7 py-3 transition-colors duration-200 hover:bg-white/10
                             focus-visible:outline focus-visible:outline-2
                             focus-visible:outline-offset-2 focus-visible:outline-[#7fc4ff]"
                  style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: '0.98rem', letterSpacing: 0.5, color: TEXT, borderColor: 'rgba(255,255,255,0.25)' }}
                >
                  Mängijate profiilid
                </Link>
              </motion.div>
            </div>
          </div>
        </div>

        <FlagStripes />
      </div>

      {/* ── Sisukord ──────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-[1120px] px-6 pt-14 pb-4">
        <motion.h2
          {...reveal()}
          style={{ fontFamily: FONT_HEADING, fontSize: '1.6rem', color: DARK, letterSpacing: 1, margin: '0 0 20px' }}
        >
          Kust alustada
        </motion.h2>

        <div className="mb-4 grid gap-4 md:grid-cols-2">
          {PRIMARY.map((c, i) => (
            <PrimaryCard key={c.to} {...c} reveal={reveal} delay={0.08 + i * 0.08} />
          ))}
        </div>

        <motion.div
          {...reveal(0.24)}
          className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200
                     bg-white shadow-sm md:flex md:divide-x md:divide-y-0"
        >
          {SECONDARY.map(s => <SecondaryRow key={s.to} {...s} />)}
        </motion.div>
      </div>

      {/* ── Sisutekst ─────────────────────────────────────── */}
      {/* TOIMETADA: kogu allolev tekst on mustand, kontrolli faktid ja kohenda tooni. */}
      <div className="mx-auto w-full max-w-3xl px-6 pb-20 pt-12">
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 40 }}>
          <motion.section {...reveal()} className="mb-9">
            <h2
              style={{ fontFamily: FONT_HEADING, fontSize: '1.6rem', color: DARK, letterSpacing: 1, margin: '0 0 10px' }}
            >
              Eesti korvpallikoondis
            </h2>
            <p
              style={{ fontFamily: FONT_BODY, color: '#374151', fontWeight: 500, fontSize: '1.05rem', lineHeight: 1.7, margin: '0 0 12px' }}
            >
              Eesti meeste korvpallikoondis mängib FIBA maailmameistrivõistluste 2027. aasta
              Euroopa valiksarjas. EstHoopist leiad koondise järgmised mängud koos kuupäeva ja
              kellaajaga, viimaste kohtumiste tulemused ning alagrupi seisu. Kõik need uuenevad
              automaatselt iga päev.
            </p>
            <p style={{ fontFamily: FONT_BODY, color: '#374151', fontWeight: 500, fontSize: '1.05rem', lineHeight: 1.7, margin: 0 }}>
              Iga mängitud kohtumise juurest saab avada mängijate statistika: kes viskas punkte,
              kes võttis lauapalle ja kui palju keegi platsil aega sai. Koondise koosseisu ja
              kogu teekonna leiad{' '}
              <Link to="/koondis" style={{ color: BLUE, fontWeight: 700 }} className="hover:underline">
                koondise lehelt
              </Link>.
            </p>
          </motion.section>

          <motion.section {...reveal()} className="mb-9">
            <h2
              style={{ fontFamily: FONT_HEADING, fontSize: '1.6rem', color: DARK, letterSpacing: 1, margin: '0 0 10px' }}
            >
              Koondislased ja nende statistika
            </h2>
            <p style={{ fontFamily: FONT_BODY, color: '#374151', fontWeight: 500, fontSize: '1.05rem', lineHeight: 1.7, margin: '0 0 12px' }}>
              Igal Eesti koondislasel on oma profiil, kust leiad positsiooni, vanuse, pikkuse ning
              statistika nii rahvuskoondises kui klubikarjääris, hooaegade kaupa: punktid,
              lauapallid ja resultatiivsed söödud mängu kohta.
            </p>
            <p style={{ fontFamily: FONT_BODY, color: '#374151', fontWeight: 500, fontSize: '1.05rem', lineHeight: 1.7, margin: 0 }}>
              Mängijate võrdlemiseks on{' '}
              <Link to="/statistika" style={{ color: BLUE, fontWeight: 700 }} className="hover:underline">
                statistikaleht
              </Link>{' '}
              parim koht, sest pingeread jooksevad nii koondise kui klubinumbrite peal. Igapäevast
              käekäiku näitab{' '}
              <Link to="/klubikorvpall" style={{ color: BLUE, fontWeight: 700 }} className="hover:underline">
                klubikorvpalli leht
              </Link>.
            </p>
          </motion.section>

          <motion.section {...reveal()}>
            <h2
              style={{ fontFamily: FONT_HEADING, fontSize: '1.6rem', color: DARK, letterSpacing: 1, margin: '0 0 10px' }}
            >
              Korvpallipiletid
            </h2>
            <p style={{ fontFamily: FONT_BODY, color: '#374151', fontWeight: 500, fontSize: '1.05rem', lineHeight: 1.7, margin: 0 }}>
              Koondise kodumängude piletid ja mängupäevade info on koos{' '}
              <Link to="/piletid" style={{ color: BLUE, fontWeight: 700 }} className="hover:underline">
                piletite lehel
              </Link>. Sealt näed, millal ja kus järgmine kodumäng toimub ning kust piletid osta.
            </p>
          </motion.section>
        </div>
      </div>
    </>
  )
}
