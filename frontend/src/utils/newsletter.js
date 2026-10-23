// Uudiskirja päringud backendile (backend/newsletter.py). Veateade tuleb API-st
// eesti keeles; ühenduse katkemisel ja ootamatul vastusel anname oma teate.

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const TIMEOUT_MS = 20_000

export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''

// Sama lõdv kontroll mis backendis: aadressi kehtivuse otsustab kinnituskiri
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export async function postNewsletter(path, body) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let res
  try {
    res = await fetch(`${API}/newsletter/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch {
    throw new Error('Serveriga ei saanud ühendust. Proovi uuesti.')
  } finally {
    clearTimeout(timer)
  }
  if (res.ok) return
  const data = await res.json().catch(() => null)
  throw new Error(typeof data?.detail === 'string' ? data.detail : 'Midagi läks valesti. Proovi hiljem uuesti.')
}

// Turnstile'i skript laetakse alles siis, kui keegi vormi kasutama hakkab: nii ei
// lähe iga lehevaatamisega päringut Cloudflare'i ja leht jääb kergemaks.
let turnstileLoad = null

export function loadTurnstile() {
  if (!turnstileLoad) {
    turnstileLoad = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile puudub')))
      script.onerror = () => {
        turnstileLoad = null
        script.remove()
        reject(new Error('Turnstile ei laadinud'))
      }
      document.head.appendChild(script)
    })
  }
  return turnstileLoad
}
