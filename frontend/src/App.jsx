import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import PlayersPage from './pages/PlayersPage'
import PlayerPage from './pages/PlayerPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/mangijad" replace />} />
        <Route path="/mangijad" element={<PlayersPage />} />
        <Route path="/mangijad/:slug" element={<PlayerPage />} />
      </Routes>
    </BrowserRouter>
  )
}
