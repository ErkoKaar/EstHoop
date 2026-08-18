import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { LoadingProvider, useLoading } from './contexts/LoadingContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import PageLoader from './components/PageLoader'
import HomePage from './pages/HomePage'
import PlayersPage from './pages/PlayersPage'
import PlayerPage from './pages/PlayerPage'
import StatsPage from './pages/StatsPage'
import KoondisPage from './pages/KoondisPage'
import PiletidPage from './pages/PiletidPage'
import KlubiKorvpallPage from './pages/KlubiKorvpallPage'
import NotFoundPage from './pages/NotFoundPage'
import PrivaatsusPage from './pages/PrivaatsusPage'
import TingimusedPage from './pages/TingimusedPage'
import './App.css'

function RouteChangeWatcher() {
  const location = useLocation()
  const { startLoading } = useLoading()
  const firstRender = useRef(true)

  useEffect(() => {
    startLoading()

    // Esimest renderit ei puutu: seal paneb brauser kerimiskoha ise paika.
    // Kõigil järgnevatel marsruudivahetustel algab leht ülevalt, ka tagasi
    // ja edasi nupu puhul.
    if (firstRender.current) {
      firstRender.current = false
      return
    }

    window.scrollTo(0, 0)
  }, [location.pathname])

  return null
}

// Router on tahtlikult väljaspool: brauseris mähib selle BrowserRouter, ehitusaegne
// eelrendedus aga StaticRouter (vt src/entry-server.jsx).
export function AppRoutes() {
  return (
    <LoadingProvider>
      <RouteChangeWatcher />
      <Navbar />
      <PageLoader />
      {/* #root on index.css-is juba min-height:100svh flex-veerg, seega flex-1
          main-il surub footeri lühikestel lehtedel alla ilma lisamähiseta */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/mangijad" element={<PlayersPage />} />
          <Route path="/mangijad/:slug" element={<PlayerPage />} />
          <Route path="/statistika" element={<StatsPage />} />
          <Route path="/koondis" element={<KoondisPage />} />
          <Route path="/piletid" element={<PiletidPage />} />
          <Route path="/klubikorvpall" element={<KlubiKorvpallPage />} />
          <Route path="/privaatsus" element={<PrivaatsusPage />} />
          <Route path="/tingimused" element={<TingimusedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </LoadingProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
