import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { inject } from '@vercel/analytics'
import './index.css'
import App from './App.jsx'

const container = document.getElementById('root')
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Eelrenderdatud lehel on juurkonteineris juba serveripoolne märgistus, siis
// hüdreerime selle. Dev-serveris ja eelrenderdamata teedel on konteiner tühi,
// siis renderdame nullist.
if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}

// Vercel Web Analytics: küpsisteta, IP-d ei säilitata. inject() lisab ainult <script> <head>-i,
// React'i puud ei puutu, seega ei sega hüdreerimist. Siin, mitte App-is, sest see fail jookseb
// ainult brauseris: eelrenderdus (entry-server.jsx) analüütikat ei laadi. Töötab, kui Analytics
// on Verceli projektis sisse lülitatud.
inject()
