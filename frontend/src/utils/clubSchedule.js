// Klubide mängugraafik (src/data/klubide_graafikud_<hooaeg>.json) klubikorvpalli
// lehe "Ajakava" vaate jaoks. JSON-is on kuupäev ja kellaaeg klubi koduriigi
// kohalikus ajas; siin teisendame need ajatempliks, et kuvada Eesti aeg ja
// teada, millal mäng "kätte jõuab".

const TALLINN = 'Europe/Tallinn'

// JSON-i riiginimi -> IANA ajavöönd. USA klubidel on see koduareeni vöönd;
// võõrsilmängud teises vööndis võivad olla kuni 3 tundi paigast.
const COUNTRY_TZ = {
  'Eesti': TALLINN,
  'Leedu': 'Europe/Vilnius',
  'Poola': 'Europe/Warsaw',
  'Saksamaa': 'Europe/Berlin',
  'Itaalia': 'Europe/Rome',
  'Hispaania': 'Europe/Madrid',
  'Prantsusmaa': 'Europe/Paris',
  'Rumeenia': 'Europe/Bucharest',
  'Jaapan': 'Asia/Tokyo',
  'USA': 'America/New_York',
}

const DAY = 86400

// Ajavööndi nihe (sekundites) antud ajahetkel.
function tzOffsetSeconds(utcMs, tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
  }).formatToParts(new Date(utcMs))
  const get = type => parseInt(parts.find(p => p.type === type).value, 10)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return Math.round((asUtc - utcMs) / 1000)
}

// Seinakella aeg ("2026-09-19", "18:30") ajavööndis tz -> unix-sekundid.
// Kaks iteratsiooni katavad suveaja ülemineku, kus esimene nihe võib olla vale.
export function zonedToTimestamp(date, time, tz) {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = (time || '00:00').split(':').map(Number)
  const wall = Date.UTC(y, m - 1, d, hh, mm) / 1000
  let ts = wall - tzOffsetSeconds(wall * 1000, tz)
  ts = wall - tzOffsetSeconds(ts * 1000, tz)
  return ts
}

// Nimede sidumine JSON-i ja DB vahel: täpitähed, sidekriipsud ja tühikud
// ei tohi mängu rolli mängida ("Maik-Kalev Kotsar" vs "Maik Kalev Kotsar").
function nameKey(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Sarja nimi sildiks: sulgudes täpsustus ("PLK (Orlen Basket Liga)") jääb ära.
export function competitionLabel(name) {
  return (name || '').replace(/\s*\(.*$/, '').trim()
}

// Kõik graafiku mängud ühtsel kujul. `players` on API mängijate nimekiri;
// mäng, mille klubist ühtki meie mängijat ei leita, jääb välja.
export function buildScheduleRows(data, players) {
  const bySlugKey = new Map(players.map(p => [nameKey(p.name), p]))
  const rows = []

  for (const club of data.clubs || []) {
    const clubPlayers = (club.players || []).map(n => bySlugKey.get(nameKey(n))).filter(Boolean)
    if (!clubPlayers.length) continue
    const tz = COUNTRY_TZ[club.country] || TALLINN

    for (const comp of club.competitions || []) {
      for (const g of comp.games || []) {
        if (!g.date || !g.opponent) continue
        const timeTBD = !g.time_local
        // Kellaajata mäng: kuupäev on ainus, mida teame — kasutame Eesti
        // päeva, sest just Eesti aja järgi kuvame ja kaotame ta graafikust.
        const dayStart = zonedToTimestamp(g.date, '00:00', TALLINN)
        const startTimestamp = timeTBD ? null : zonedToTimestamp(g.date, g.time_local, tz)
        rows.push({
          id: `${club.club}|${comp.name}|${g.date}|${g.opponent}`,
          club: club.club,
          opponent: g.opponent,
          home: !!g.home,
          competition: comp.name,
          note: g.note || null,
          players: clubPlayers,
          timeTBD,
          startTimestamp,
          // Mis hetkest alates mäng graafikust kaob
          visibleUntil: timeTBD ? dayStart + DAY : startTimestamp,
          // Järjestus ja päevade kaupa grupeerimine; kellaajata mäng päeva lõppu
          sortTimestamp: timeTBD ? dayStart + DAY - 1 : startTimestamp,
        })
      }
    }
  }

  rows.sort((a, b) => a.sortTimestamp - b.sortTimestamp)
  return rows
}

// Mängud, mis pole veel alanud ja algavad `days` päeva jooksul.
export function upcomingRows(rows, nowSeconds, days = 14) {
  const until = nowSeconds + days * DAY
  return rows.filter(r => r.visibleUntil > nowSeconds && r.sortTimestamp <= until)
}

// Esimene mäng pärast akent, et tühi vaade saaks öelda, millal midagi tuleb.
export function nextRowAfter(rows, nowSeconds, days = 14) {
  const until = nowSeconds + days * DAY
  return rows.find(r => r.visibleUntil > nowSeconds && r.sortTimestamp > until) || null
}
