import { useEffect, useRef, useState } from 'react'

const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"

function formatDuration(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

// Mängija highlight-video. Enne klikki on ainult kaanepilt ja videost ei laeta
// baitigi (video element tekib alles klikiga). Klikk on kasutaja žest, seega
// brauser lubab video kohe heliga käivitada. Failid teeb scripts/encode-videos.sh.
export default function HighlightReel({ slug, name, duration }) {
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef(null)
  const poster = `/videos/${slug}.webp`
  const length = formatDuration(duration)

  // Klaviatuuriga käivitanu saab kohe pausi panna ja kerida
  useEffect(() => {
    if (playing) videoRef.current?.focus()
  }, [playing])

  return (
    <div
      className="group relative isolate aspect-video w-full overflow-hidden rounded-xl bg-[#08060d] shadow-md
                 has-[:focus-visible]:outline has-[:focus-visible]:outline-2
                 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#0072ce]"
    >
      {/* Kaanepilt jääb video alla, et video sisse hajuks pildi pealt, mitte tumedast kastist */}
      <img
        src={poster}
        alt=""
        width={960}
        height={540}
        decoding="async"
        fetchPriority="low"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[250ms]
                   ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:group-hover:scale-[1.03]"
      />

      {playing ? (
        <video
          ref={videoRef}
          src={`/videos/${slug}.mp4`}
          poster={poster}
          controls
          autoPlay
          playsInline
          controlsList="nodownload"
          onEnded={() => setPlaying(false)}
          aria-label={`Highlightid: ${name}`}
          className="absolute inset-0 h-full w-full bg-[#08060d] object-contain outline-none
                     transition-opacity duration-200 ease-out starting:opacity-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Esita highlightid, ${length}`}
          className="absolute inset-0 cursor-pointer focus-visible:outline-none"
        >
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
            <span>
              <span className="block text-2xl leading-none text-white" style={{ fontFamily: FONT_HEADING, letterSpacing: '1px' }}>
                Highlightid
              </span>
              <span className="block text-sm font-semibold text-white/80 tabular-nums" style={{ fontFamily: FONT_BODY }}>
                {length}
              </span>
            </span>
          </span>
        </button>
      )}
    </div>
  )
}
