import { useState } from 'react'

const FONT_HEADING = "'Bebas Neue', cursive"
const BLUE = '#0072ce'
const EXTENSIONS = ['jpg', 'png']
const PX = { lg: 96, md: 64, sm: 40 }
const FONT_SIZE = { lg: '1.5rem', md: '1.1rem', sm: '0.75rem' }

export default function PlayerAvatar({ slug, name, size = 'md' }) {
  const [extIndex, setExtIndex] = useState(0)
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const px = PX[size]

  return (
    <div
      className="rounded-full overflow-hidden shrink-0 shadow-md"
      style={{ width: px, height: px, minWidth: px }}
    >
      {extIndex < EXTENSIONS.length ? (
        <img
          src={`/players/${slug}.${EXTENSIONS[extIndex]}`}
          alt={name}
          className="w-full h-full object-cover object-top"
          onError={() => setExtIndex(i => i + 1)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{ background: BLUE }}>
          <span
            className="text-white font-bold select-none"
            style={{ fontFamily: FONT_HEADING, fontSize: FONT_SIZE[size] }}
          >
            {initials}
          </span>
        </div>
      )}
    </div>
  )
}
