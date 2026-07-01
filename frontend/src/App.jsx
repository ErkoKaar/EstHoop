import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { LoadingProvider, useLoading } from './contexts/LoadingContext'
import Navbar from './components/Navbar'
import PageLoader from './components/PageLoader'
import PlayersPage from './pages/PlayersPage'
import PlayerPage from './pages/PlayerPage'
import StatsPage from './pages/StatsPage'
import KoondisPage from './pages/KoondisPage'
import './App.css'

function RouteChangeWatcher() {
  const location = useLocation()
  const { startLoading } = useLoading()
  useEffect(() => {
    startLoading()
  }, [location.pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <LoadingProvider>
        <RouteChangeWatcher />
        <Navbar />
        <PageLoader />
        <Routes>
          <Route path="/" element={<Navigate to="/mangijad" replace />} />
          <Route path="/mangijad" element={<PlayersPage />} />
          <Route path="/mangijad/:slug" element={<PlayerPage />} />
          <Route path="/statistika" element={<StatsPage />} />
          <Route path="/koondis" element={<KoondisPage />} />
        </Routes>
      </LoadingProvider>
    </BrowserRouter>
  )
}
