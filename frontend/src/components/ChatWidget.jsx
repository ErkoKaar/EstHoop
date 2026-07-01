import { useState, useRef, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"
const BLUE = '#0072ce'
const DARK = '#08060d'

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-gray-400"
          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  )
}

function fmtDate(ts) {
  return new Date(ts * 1000).toLocaleString('et-EE', {
    timeZone: 'Europe/Tallinn', day: '2-digit', month: '2-digit',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

async function fetchStatsContext() {
  try {
    const players = await fetch(`${API}/players`).then(r => r.json())
    const [fibaResults, clubResults] = await Promise.all([
      Promise.allSettled(players.map(p => fetch(`${API}/players/${p.slug}/fiba-stats`).then(r => r.ok ? r.json() : null))),
      Promise.allSettled(players.map(p => fetch(`${API}/players/${p.slug}/stats`).then(r => r.ok ? r.json() : null))),
    ])

    const natLines = []
    fibaResults.forEach((r, i) => {
      const p = players[i]
      const nt = r.status === 'fulfilled' && r.value ? r.value.national_team : null
      if (!nt?.length) return
      const gp = nt.reduce((s, row) => s + row.gp, 0)
      if (!gp) return
      const ppg = (nt.reduce((s, row) => s + row.ppg * row.gp, 0) / gp).toFixed(1)
      const rpg = (nt.reduce((s, row) => s + row.rpg * row.gp, 0) / gp).toFixed(1)
      const apg = (nt.reduce((s, row) => s + row.apg * row.gp, 0) / gp).toFixed(1)
      natLines.push(`- ${p.name} (${p.position || '?'}): ${ppg} ppg, ${rpg} rpg, ${apg} apg (${gp} mängu)`)
    })

    const clubLines = []
    clubResults.forEach((r, i) => {
      const p = players[i]
      const seasons = r.status === 'fulfilled' && r.value ? r.value.seasons : null
      if (!seasons?.length) return
      const last = seasons[seasons.length - 1]
      const pts = last.PTS ?? '-', reb = last.REB ?? '-', ast = last.AST ?? '-'
      const league = last.league || last.competition || ''
      clubLines.push(`- ${p.name}: ${pts} pts, ${reb} reb, ${ast} ast (${league})`)
    })

    const parts = []
    if (natLines.length) parts.push('Koondise statistika (karjäär kaalutud):\n' + natLines.join('\n'))
    if (clubLines.length) parts.push('Klubi statistika (viimane hooaeg):\n' + clubLines.join('\n'))
    return parts.length ? parts.join('\n\n') : null
  } catch {
    return null
  }
}

async function fetchNationalTeamContext() {
  try {
    const [nextData, lastData, standingsData] = await Promise.all([
      fetch('https://api.sofascore.com/api/v1/team/25373/events/next/0').then(r => r.json()),
      fetch('https://api.sofascore.com/api/v1/team/25373/events/last/0').then(r => r.json()),
      fetch('https://api.sofascore.com/api/v1/unique-tournament/10437/season/54504/standings/total').then(r => r.json()),
    ])

    const parts = []

    const upcoming = nextData.events || []
    if (upcoming.length) {
      parts.push('Eelseisvad mängud:\n' + upcoming.slice(0, 5).map(ev =>
        `- ${ev.homeTeam?.name} vs ${ev.awayTeam?.name} | ${fmtDate(ev.startTimestamp)} | ${ev.tournament?.name || ''}`
      ).join('\n'))
    } else {
      parts.push('Eelseisvaid koondise mänge ei ole.')
    }

    const recent = [...(lastData.events || [])].reverse().slice(0, 5)
    if (recent.length) {
      parts.push('Viimased tulemused:\n' + recent.map(ev => {
        const hs = ev.homeScore?.current ?? '?', as = ev.awayScore?.current ?? '?'
        return `- ${ev.homeTeam?.name} ${hs}:${as} ${ev.awayTeam?.name} | ${fmtDate(ev.startTimestamp)}`
      }).join('\n'))
    }

    const group = standingsData.standings?.find(g => g.name?.includes('Group H'))
    const rows = group?.rows || []
    if (rows.length) {
      parts.push('Tabeliseis (Grupp H):\n' + rows.map(row =>
        `- ${row.position}. ${row.team?.name}: ${row.wins}V-${row.losses}K (${row.matches} mängu)`
      ).join('\n'))
    }

    return parts.join('\n\n') || null
  } catch {
    return null
  }
}

async function fetchClubGamesContext() {
  try {
    const players = await fetch(`${API}/players`).then(r => r.json())
    const withSS = players.filter(p => p.sofascore_id)
    const results = await Promise.allSettled(
      withSS.map(p =>
        fetch(`https://api.sofascore.com/api/v1/player/${p.sofascore_id}/events/next/0`)
          .then(r => r.json()).then(d => ({ player: p, events: d.events || [] }))
      )
    )
    const lines = []
    results.forEach(r => {
      if (r.status !== 'fulfilled') return
      const { player: p, events } = r.value
      events.slice(0, 2).forEach(ev => {
        const home = ev.homeTeam?.name || '?', away = ev.awayTeam?.name || '?'
        const tour = ev.tournament?.name || ''
        lines.push(`- ${p.name}: ${home} vs ${away} | ${fmtDate(ev.startTimestamp)} | ${tour}`)
      })
    })
    lines.sort((a, b) => a.localeCompare(b))
    return lines.length ? lines.join('\n') : 'Eelseisvaid klubi mänge ei leitud.'
  } catch {
    return null
  }
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Tere! Olen EstHoop AI abiline. Küsi koondise mängude, mängijate või tulemuste kohta.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [gamesContext, setGamesContext] = useState(null)
  const [statsContext, setStatsContext] = useState(null)
  const [clubGamesContext, setClubGamesContext] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    fetchNationalTeamContext().then(ctx => setGamesContext(ctx))
    fetchStatsContext().then(ctx => setStatsContext(ctx))
    fetchClubGamesContext().then(ctx => setClubGamesContext(ctx))
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const r = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, games_context: gamesContext, stats_context: statsContext, club_games_context: clubGamesContext }),
      })
      if (!r.ok) throw new Error()
      const data = await r.json()
      setMessages(m => [...m, { role: 'assistant', content: data.response }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Vabandust, tekkis viga. Proovi uuesti.' }])
    } finally {
      setLoading(false)
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @keyframes chat-slide-up {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .chat-panel { animation: chat-slide-up 0.2s ease-out; }
      `}</style>

      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        style={{ background: BLUE, color: '#fff' }}
        aria-label={open ? 'Sulge vestlus' : 'Ava AI abiline'}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="chat-panel fixed bottom-24 right-6 z-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{ width: 340, height: 480, background: '#fff', border: '1px solid #e5e7eb' }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-2 px-4 py-3 shrink-0"
            style={{ background: BLUE }}
          >
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span style={{ fontFamily: FONT_HEADING, fontSize: '1.1rem', color: '#fff', letterSpacing: '1px' }}>
              EstHoop AI
            </span>
            <span style={{ fontFamily: FONT_BODY, fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', marginLeft: 2 }}>
              · Claude Haiku
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[82%] px-3 py-2 rounded-2xl text-sm leading-snug"
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: '0.95rem',
                    background: m.role === 'user' ? BLUE : '#f3f4f6',
                    color: m.role === 'user' ? '#fff' : DARK,
                    borderBottomRightRadius: m.role === 'user' ? 4 : 16,
                    borderBottomLeftRadius: m.role === 'assistant' ? 4 : 16,
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-gray-100" style={{ borderBottomLeftRadius: 4 }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 flex items-center gap-2 px-3 py-3 border-t border-gray-100">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Küsi midagi..."
              disabled={loading}
              className="flex-1 resize-none rounded-xl px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-[#0072ce] transition-colors duration-200 disabled:opacity-50"
              style={{ fontFamily: FONT_BODY, fontSize: '0.9rem', maxHeight: 80, lineHeight: 1.4 }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-85"
              style={{ background: BLUE, color: '#fff' }}
              aria-label="Saada"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
