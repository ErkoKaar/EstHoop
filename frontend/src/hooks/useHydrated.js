import { useSyncExternalStore } from 'react'

// Väärtus ei muutu enam pärast mount'i, seega tellimus on tühi funktsioon
const subscribe = () => () => {}
const onClient = () => true
const onServer = () => false

// Tagastab false eelrenderdusel ja esimesel kliendirenderdusel, true pärast seda.
//
// Selle taga on ajast sõltuvad väärtused: Date.now() annaks build'i ajal ja
// vaatamise ajal eri tulemuse, mis lõhuks hydration'i. Selle lipuga saab need
// välja jätta seni, kuni server ja klient on kokku langenud.
export default function useHydrated() {
  return useSyncExternalStore(subscribe, onClient, onServer)
}
