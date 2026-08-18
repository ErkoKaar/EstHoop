// Eelrenderdusel (scripts/prerender.js) tõmmatakse andmed API-st ja süstitakse
// valmis HTML-i. Nii näeb crawler mängijate nimesid ja statistikat otse
// märgistusest, ilma JS-i käivitamata.
//
// Sama väärtus on olemas nii Node'is renderdamise ajal kui brauseris enne
// rakenduse käivitumist, seega server ja klient renderdavad esimesel korral
// identse puu ja hydration ei lähe rikki.
//
// Iga leht saab ainult need andmed, mida ta ise vajab, et HTML ei paisuks.

export const PRELOAD_KEY = '__ESTHOOP_PRELOAD__'

function preload() {
  const value = globalThis[PRELOAD_KEY]
  return value && typeof value === 'object' ? value : null
}

export function getPreloadedPlayers() {
  const list = preload()?.players
  return Array.isArray(list) && list.length ? list : null
}

export function getPreloadedPlayer(slug) {
  return getPreloadedPlayers()?.find(p => p?.slug === slug) ?? null
}

// Slug'i kontroll on oluline: kliendipoolsel navigeerimisel ühelt mängijalt
// teisele jääb globaal alles ja ilma kontrollita näidataks eelmise numbreid.
export function getPreloadedPlayerStats(slug) {
  const data = preload()?.playerStats
  return data && data.slug === slug ? data : null
}
