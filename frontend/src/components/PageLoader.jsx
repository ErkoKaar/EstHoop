import { useEffect, useState } from 'react'
import { useLoading } from '../contexts/LoadingContext'

export default function PageLoader() {
  const { isLoading } = useLoading()
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (isLoading) {
      setFading(false)
      setVisible(true)
    } else if (visible) {
      setFading(true)
      const t = setTimeout(() => { setVisible(false); setFading(false) }, 350)
      return () => clearTimeout(t)
    }
  }, [isLoading])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center bg-white transition-opacity duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`}
      aria-label="Laadimine"
      role="status"
    >
      <img
        src="/logo/logo.png"
        alt=""
        aria-hidden="true"
        className="logo-heartbeat"
        style={{ height: 96, width: 'auto' }}
      />
    </div>
  )
}
