// Ehitusaegne sisenemispunkt. Seda ei laadi ükski brauser: scripts/prerender.js
// impordib selle Node'is ja kutsub render() iga marsruudi kohta.
//
// StrictMode on tahtlikult puudu: see renderdaks kaks korda ja HTML-i jaoks pole
// sellest kasu. CSS-i siia ei impordita, selle eest hoolitseb kliendi build.
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { AppRoutes } from './App.jsx'
import { PRELOAD_KEY } from './preload.js'

// players seatakse globaliks, sest brauseris tuleb sama väärtus HTML-i süstitud
// skriptist. Kui lehed loeksid seda propsist, ei langeks server ja klient kokku.
export function render(url, players = null) {
  globalThis[PRELOAD_KEY] = players
  try {
    return renderToString(
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>
    )
  } finally {
    globalThis[PRELOAD_KEY] = null
  }
}
