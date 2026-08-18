import { useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

const BLUE = '#0072ce'

function HighlightCard({ src, onDismiss }) {
  const reduced = useReducedMotion()
  const videoRef = useRef(null)

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full"
    >
      <div className="relative rounded-md overflow-hidden bg-black shadow-xl ring-1 ring-[#0072ce]/50 w-full aspect-video">
        <span className="absolute -top-1 -left-1 w-2.5 h-2.5" style={{ background: BLUE }} aria-hidden="true" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5" style={{ background: BLUE }} aria-hidden="true" />
        <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5" style={{ background: BLUE }} aria-hidden="true" />
        <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5" style={{ background: BLUE }} aria-hidden="true" />

        <button
          onClick={onDismiss}
          aria-label="Sulge video"
          className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-black/60 text-white
                     flex items-center justify-center hover:bg-black/80 transition-colors duration-150
                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3 h-3">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <video
          ref={videoRef}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload nofullscreen noremoteplayback"
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Stefan Vaaksi hooaja highlightid"
          className="w-full h-full block object-cover pointer-events-none"
        />
      </div>
    </motion.div>
  )
}

// Katsetus: Stefan Vaaksi profiili juurde avaneb automaatselt lühike highlight-klipp.
export default function HighlightReel({ src }) {
  const [dismissed, setDismissed] = useState(false)

  return (
    <AnimatePresence>
      {!dismissed && (
        <HighlightCard key="card" src={src} onDismiss={() => setDismissed(true)} />
      )}
    </AnimatePresence>
  )
}
