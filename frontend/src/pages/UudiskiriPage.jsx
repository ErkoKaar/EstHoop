import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Seo from '../components/Seo'
import { SubscribeForm } from '../components/NewsletterSignup'
import { useLoading } from '../contexts/LoadingContext'
import { postNewsletter } from '../utils/newsletter'

// /uudiskiri: liitumisvorm ja kinnituslingi sihtkoht (/uudiskiri?token=...).
// Token loetakse alles pärast mount'i: eelrenderdatud HTML-is päringuparameetrit
// pole, seega renderdamise ajal URL-i lugemine lõhuks hydration'i.
// Tellimus kinnitatakse nupuga, mitte lingi avamisega (vt backend/newsletter.py).

const FONT_HEADING = "'Bebas Neue', cursive"
const FONT_BODY = "'Rajdhani', sans-serif"
const DARK = '#08060d'
const BODY_TEXT = '#3f4654'
const BLUE = '#0072ce'
const NAVY = '#06111f'
const TEXT = '#f0f4fa'
const ERROR = '#ffa4a4'

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7fc4ff]'

const bodyStyle = { fontFamily: FONT_BODY, color: BODY_TEXT, fontWeight: 500, fontSize: '1.08rem', lineHeight: 1.7 }
const panelTitle = { fontFamily: FONT_HEADING, color: TEXT, fontSize: '1.9rem', letterSpacing: 0.8, lineHeight: 1.05 }
const panelText = { fontFamily: FONT_BODY, color: '#c4cedc', fontWeight: 500, fontSize: '1.05rem', lineHeight: 1.6 }

function Confirm({ token }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState('idle') // idle | sending | done | error
  const [error, setError] = useState('')

  async function confirm() {
    if (status === 'sending') return
    setStatus('sending')
    try {
      await postNewsletter('confirm', { token })
      // Token aadressiribalt ära, et värskendus või jagatud link ei kinnitaks uuesti
      navigate('/uudiskiri', { replace: true })
      setStatus('done')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div role="status">
        <h2 style={panelTitle} className="mb-2">Tellimus on kinnitatud</h2>
        <p style={panelText}>
          Esimene kiri tuleb esmaspäeva hommikul. Seni näed nädala mänge{' '}
          <Link to="/klubikorvpall" className={`underline transition-colors duration-150 hover:text-[#7fc4ff] ${FOCUS}`} style={{ color: TEXT }}>
            klubikorvpalli lehel
          </Link>.
        </p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <>
        <h2 style={panelTitle} className="mb-2">Kinnitamine ei õnnestunud</h2>
        <p role="alert" style={{ ...panelText, color: ERROR, fontWeight: 600 }} className="mb-6">{error}</p>
        <SubscribeForm />
      </>
    )
  }

  return (
    <>
      <h2 style={panelTitle} className="mb-2">Kinnita tellimus</h2>
      <p style={panelText} className="mb-5">Pärast kinnitamist tuleb nädalakiri igal esmaspäeval sinu postkasti.</p>
      <button
        type="button"
        onClick={confirm}
        disabled={status === 'sending'}
        className={`inline-flex min-h-[48px] cursor-pointer items-center rounded-lg px-6 text-white
                    transition-[background-color,transform] duration-150 hover:bg-[#005fae] active:scale-[0.98]
                    disabled:cursor-wait disabled:opacity-70 ${FOCUS}`}
        style={{ background: BLUE, fontFamily: FONT_BODY, fontSize: '1.05rem', fontWeight: 700 }}
      >
        {status === 'sending' ? 'Kinnitan…' : 'Kinnitan tellimuse'}
      </button>
    </>
  )
}

export default function UudiskiriPage() {
  const { signalReady } = useLoading()
  const [token, setToken] = useState(null)

  useEffect(() => {
    signalReady()
    setToken(new URLSearchParams(window.location.search).get('token'))
  }, [])

  return (
    <>
      <Seo
        title="Uudiskiri Eestlased välismaal"
        description="EstHoopi tasuta nädalakiri: iga esmaspäev kõik möödunud nädala Eesti korvpallurite mängud välisklubides ja nädala parimad sooritused."
        path="/uudiskiri"
        breadcrumbs={[{ name: 'Uudiskiri' }]}
      />

      <div className="mx-auto w-full max-w-2xl px-6 pt-20 pb-24">
        <h1
          style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(2.4rem, 7vw, 3.6rem)', color: DARK, letterSpacing: 1, lineHeight: 1 }}
          className="mb-4"
        >
          Eestlased välismaal
        </h1>
        <p style={bodyStyle} className="mb-4">
          EstHoopi nädalakiri Eesti korvpalluritest välisklubides. Iga esmaspäeva hommikul saad
          postkasti möödunud nädala kolm parimat sooritust ja kõigi mänginud eestlaste mängud koos
          tulemuse, punktide, lauapallide ja resultatiivsete söötudega.
        </p>
        <p style={bodyStyle} className="mb-10">
          Kiri on tasuta ja tuleb ainult siis, kui nädalas oli mänge. Loobuda saab iga kirja lõpust.
        </p>

        <div className="rounded-2xl px-6 py-7 sm:px-8 sm:py-8" style={{ background: NAVY }}>
          {token ? <Confirm token={token} /> : <SubscribeForm />}
        </div>
      </div>
    </>
  )
}
