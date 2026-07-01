import { createContext, useContext, useRef, useState } from 'react'

const LoadingContext = createContext(null)
const MIN_MS = 1000

export function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false)
  const startRef = useRef(null)
  const timerRef = useRef(null)

  function startLoading() {
    if (timerRef.current) clearTimeout(timerRef.current)
    startRef.current = Date.now()
    setIsLoading(true)
  }

  function signalReady() {
    const elapsed = Date.now() - (startRef.current ?? Date.now())
    const wait = Math.max(0, MIN_MS - elapsed)
    timerRef.current = setTimeout(() => setIsLoading(false), wait)
  }

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, signalReady }}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  return useContext(LoadingContext)
}
