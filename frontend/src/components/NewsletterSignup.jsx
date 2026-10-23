import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { EMAIL_RE, TURNSTILE_SITE_KEY, loadTurnstile, postNewsletter } from '../utils/newsletter'

// Uudiskirja "Eestlased välismaal" liitumine: tume plokk avalehel ja klubikorvpalli
// lehel, vorm ise ka /uudiskiri lehel. Tellimus kehtib alles pärast kinnituslinki.

const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"

const BLUE = '#0072ce'
const TEXT = '#f0f4fa'
const MUTED = '#8a97ac'
const NAVY = '#06111f'
const ERROR = '#ffa4a4'

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7fc4ff]'

export function SubscribeForm() {
  const id = useId()
  const inputRef = useRef(null)
  const widgetRef = useRef(null)
  const widgetId = useRef(null)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent
  const [error, setError] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [captcha, setCaptcha] = useState('')
  const [captchaWanted, setCaptchaWanted] = useState(false)
  const [captchaBlocked, setCaptchaBlocked] = useState(false)
  const successRef = useRef(null)

  // Vorm asendub teatega, fookus liigub sinna, et ekraanilugeja selle ette loeks
  useEffect(() => {
    if (status === 'sent') successRef.current?.focus()
  }, [status])

  // Robotikontroll käivitub esimesel puudutusel, selleks ajaks kui aadress on
  // kirjas, on token tavaliselt olemas. Nähtav on vidin ainult siis, kui
  // Cloudflare tahab kasutajalt midagi küsida.
  useEffect(() => {
    if (!captchaWanted || !TURNSTILE_SITE_KEY) return
    let cancelled = false
    loadTurnstile()
      .then(turnstile => {
        if (cancelled || !widgetRef.current || widgetId.current != null) return
        widgetId.current = turnstile.render(widgetRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action: 'uudiskiri',
          theme: 'dark',
          appearance: 'interaction-only',
          callback: token => { setCaptcha(token); setCaptchaBlocked(false) },
          'expired-callback': () => setCaptcha(''),
          'error-callback': () => setCaptcha(''),
        })
      })
      .catch(() => { if (!cancelled) setCaptchaBlocked(true) })
    return () => {
      cancelled = true
      removeWidget()
    }
  }, [captchaWanted])

  function removeWidget() {
    if (widgetId.current == null) return
    try { window.turnstile?.remove(widgetId.current) } catch { /* konteiner juba kadunud */ }
    widgetId.current = null
  }

  async function submit(e) {
    e.preventDefault()
    if (status === 'sending') return
    const value = email.trim()
    if (!EMAIL_RE.test(value)) {
      setError('Kontrolli e-posti aadressi.')
      inputRef.current?.focus()
      return
    }
    if (!TURNSTILE_SITE_KEY) {
      setError('Uudiskiri pole veel kasutusel.')
      return
    }
    if (!captcha) {
      setCaptchaWanted(true)
      setError(captchaBlocked
        ? 'Robotikontroll ei laadinud. Luba brauseris challenges.cloudflare.com või proovi teise brauseriga.'
        : 'Robotikontroll on veel pooleli. Proovi mõne sekundi pärast uuesti.')
      return
    }

    setStatus('sending')
    setError('')
    try {
      await postNewsletter('subscribe', { email: value, turnstileToken: captcha })
      removeWidget()
      setSentTo(value)
      setStatus('sent')
    } catch (err) {
      // Turnstile'i token kehtib ühe korra, uueks katseks on vaja uut
      setCaptcha('')
      if (widgetId.current != null) window.turnstile?.reset(widgetId.current)
      setError(err.message)
      setStatus('idle')
    }
  }

  if (status === 'sent') {
    return (
      <div ref={successRef} tabIndex={-1} className="outline-none" style={{ fontFamily: FONT_BODY, color: TEXT }}>
        <p style={{ fontFamily: FONT_HEADING, fontSize: '1.7rem', letterSpacing: 0.8, lineHeight: 1.1 }} className="mb-2">
          Vaata postkasti
        </p>
        <p style={{ color: '#c4cedc', fontWeight: 500, fontSize: '1.05rem', lineHeight: 1.6 }}>
          Saatsime aadressile <strong style={{ color: TEXT }}>{sentTo}</strong> kinnituslingi. Tellimus
          hakkab kehtima, kui avad lingi ja vajutad „Kinnitan tellimuse“. Kirja pole? Vaata ka
          rämpsposti kausta.
        </p>
      </div>
    )
  }

  const errorId = `${id}-viga`
  const noteId = `${id}-info`

  return (
    <form onSubmit={submit} noValidate>
      <label
        htmlFor={`${id}-email`}
        style={{ fontFamily: FONT_BODY, color: TEXT, fontWeight: 700, fontSize: '0.98rem' }}
        className="mb-2 block"
      >
        E-post
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          ref={inputRef}
          id={`${id}-email`}
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={254}
          placeholder="nimi@domeen.ee"
          value={email}
          onChange={e => { setEmail(e.target.value); if (error) setError('') }}
          onFocus={() => setCaptchaWanted(true)}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${error ? errorId : ''} ${noteId}`.trim()}
          className={`min-h-[48px] w-full min-w-0 flex-1 rounded-lg px-4 placeholder:text-[#6b7a90] ${FOCUS}`}
          style={{
            fontFamily: FONT_BODY, fontSize: '1.08rem', fontWeight: 600, color: TEXT,
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${error ? ERROR : 'rgba(255,255,255,0.24)'}`,
          }}
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className={`inline-flex min-h-[48px] shrink-0 cursor-pointer items-center justify-center rounded-lg px-6 text-white
                      transition-[background-color,transform] duration-150 hover:bg-[#005fae] active:scale-[0.98]
                      disabled:cursor-wait disabled:opacity-70 ${FOCUS}`}
          style={{ background: BLUE, fontFamily: FONT_BODY, fontSize: '1.05rem', fontWeight: 700 }}
        >
          {status === 'sending' ? 'Saadan…' : 'Telli'}
        </button>
      </div>

      <p id={errorId} role="alert" style={{ fontFamily: FONT_BODY, color: ERROR, fontWeight: 600, fontSize: '0.98rem' }}>
        {error && <span className="mt-2 block">{error}</span>}
      </p>

      <div ref={widgetRef} className="mt-3 empty:mt-0" />

      <p id={noteId} className="mt-3" style={{ fontFamily: FONT_BODY, color: MUTED, fontWeight: 500, fontSize: '0.92rem', lineHeight: 1.5 }}>
        Üks kiri nädalas, loobuda saab iga kirja lõpust.{' '}
        <Link to="/privaatsus" className={`underline transition-colors duration-150 hover:text-[#7fc4ff] ${FOCUS}`}>
          Privaatsuspoliitika
        </Link>
      </p>
    </form>
  )
}

export default function NewsletterSignup({ className = '' }) {
  const headingId = useId()
  return (
    <section
      aria-labelledby={headingId}
      className={`relative overflow-hidden rounded-2xl text-left ${className}`}
      style={{ background: NAVY }}
    >
      {/* Lipuribad vasakul serval, sama motiiv mis footeris */}
      <div aria-hidden="true" className="absolute inset-y-0 left-0 flex">
        <div style={{ width: 6, background: BLUE }} />
        <div style={{ width: 6, background: '#0a0a1a' }} />
        <div style={{ width: 6, background: 'rgba(255,255,255,0.93)' }} />
      </div>

      <div className="grid gap-7 py-8 pr-6 pl-10 sm:py-10 sm:pr-10 sm:pl-14 md:grid-cols-[1fr_1.15fr] md:items-center md:gap-12">
        <div>
          <h2
            id={headingId}
            style={{ fontFamily: FONT_HEADING, color: TEXT, fontSize: 'clamp(2rem, 4.5vw, 2.8rem)', letterSpacing: 1, lineHeight: 1 }}
            className="mb-3"
          >
            Eestlased välismaal
          </h2>
          <p style={{ fontFamily: FONT_BODY, color: '#c4cedc', fontWeight: 500, fontSize: '1.08rem', lineHeight: 1.6 }} className="max-w-md">
            Iga esmaspäeva hommikul postkasti: kõik möödunud nädala välisklubide mängud ja nädala
            kolm parimat sooritust.
          </p>
        </div>
        <SubscribeForm />
      </div>
    </section>
  )
}
