import { useState } from 'react'

const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"
const BLUE = '#0072ce'

// Sama duotoon nagu parimate soorituste plakatitel: valge taust muutub kaardi siniseks
const DUOTONE_ID = 'highlight-duotoon'

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

// Mängija highlight-video YouTube'ist. Enne klikki on EstHoopi enda kaart (mängija foto
// duotoonis), YouTube'ist ei laeta midagi ja küpsiseid pole. Mängija iframe tekib alles
// klikiga; klikk on kasutaja žest, seega autoplay lubatakse. YouTube'i reeglite järgi ei
// tohi mängija peal midagi olla, seepärast on allikas kaardi all, mitte video peal.
export default function YouTubeEmbed({ id, slug, name, channel }) {
  const [playing, setPlaying] = useState(false)
  const [hasPhoto, setHasPhoto] = useState(true)

  return (
    <figure className="m-0 w-full">
      <DuotoneFilter />
      <div
        className="group relative isolate aspect-video w-full overflow-hidden rounded-xl shadow-md
                   has-[:focus-visible]:outline has-[:focus-visible]:outline-2
                   has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#0072ce]"
        style={{ background: playing ? '#08060d' : BLUE }}
      >
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
            title={`Highlightid: ${name}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Esita highlightid YouTube'ist: ${name}`}
            className="absolute inset-0 cursor-pointer text-left focus-visible:outline-none"
          >
            {/* Foto paremas servas, ruut kaardi kõrgusest; vasak serv hajub nagu plakatitel */}
            {hasPhoto && (
              <span
                className="absolute bottom-0 right-0 h-full aspect-square origin-bottom transition-transform duration-500
                           ease-out motion-safe:group-hover:scale-[1.04]"
                aria-hidden="true"
              >
                <img
                  src={`/players/${slug}.webp`}
                  alt=""
                  width={700}
                  height={700}
                  decoding="async"
                  onError={() => setHasPhoto(false)}
                  className="h-full w-full object-cover object-top"
                  style={{
                    filter: `url(#${DUOTONE_ID})`,
                    maskImage: 'linear-gradient(to right, transparent 0%, #000 24%)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 24%)',
                  }}
                />
              </span>
            )}
            <img src="/logo/logo_white.png" alt="" aria-hidden="true" className="absolute left-4 top-4 h-8 w-8 object-contain" />
            <span className="absolute bottom-4 left-4 flex items-center gap-3" aria-hidden="true">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0072ce] shadow-lg
                           transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-active:scale-[0.94]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5">
                  <path d="M8 5.5v13l11-6.5z" />
                </svg>
              </span>
              <span className="block text-2xl leading-none text-white" style={{ fontFamily: FONT_HEADING, letterSpacing: '1px' }}>
                Highlightid
              </span>
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-2 text-sm font-semibold text-gray-500" style={{ fontFamily: FONT_BODY }}>
        Video: {channel}, YouTube
      </figcaption>
    </figure>
  )
}
