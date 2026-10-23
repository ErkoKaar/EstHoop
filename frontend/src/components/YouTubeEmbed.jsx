import { useState } from 'react'

const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"

// Mängija highlight-video YouTube'ist. Enne klikki on ainult YouTube'i kaanepilt (i.ytimg.com
// ei pane küpsiseid), mängija iframe tekib alles klikiga, nii et ilma klikita küpsiseid pole.
// Klikk on kasutaja žest, seega autoplay lubatakse. YouTube'i reeglite järgi ei tohi mängija
// peal midagi olla, seepärast on allikas kaardi all, mitte video peal.
export default function YouTubeEmbed({ id, name, channel }) {
  const [playing, setPlaying] = useState(false)

  return (
    <figure className="m-0 w-full">
      <div
        className="group relative isolate aspect-video w-full overflow-hidden rounded-xl bg-[#08060d] shadow-md
                   has-[:focus-visible]:outline has-[:focus-visible]:outline-2
                   has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#0072ce]"
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
            className="absolute inset-0 cursor-pointer focus-visible:outline-none"
          >
            <img
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              alt=""
              width={480}
              height={360}
              decoding="async"
              fetchPriority="low"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[250ms]
                         ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:group-hover:scale-[1.03]"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" aria-hidden="true" />
            <span className="absolute bottom-4 left-4 flex items-center gap-3 text-left" aria-hidden="true">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0072ce] text-white shadow-lg
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
