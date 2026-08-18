// Eelrenderdusel (scripts/prerender.js) tõmmatakse mängijate nimekiri API-st ja
// süstitakse valmis HTML-i. Nii saab crawler mängijate nimed ja lingid otse
// märgistusest, ilma JS-i käivitamata.
//
// Sama väärtus on olemas nii Node'is renderdamise ajal kui brauseris enne
// rakenduse käivitumist, seega server ja klient renderdavad esimesel korral
// identse puu ja hydration ei lähe rikki.

export const PRELOAD_KEY = '__ESTHOOP_PLAYERS__'

export function getPreloadedPlayers() {
  const value = globalThis[PRELOAD_KEY]
  return Array.isArray(value) && value.length ? value : null
}

export function getPreloadedPlayer(slug) {
  return getPreloadedPlayers()?.find(p => p?.slug === slug) ?? null
}
