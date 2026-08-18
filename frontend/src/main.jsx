import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
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
