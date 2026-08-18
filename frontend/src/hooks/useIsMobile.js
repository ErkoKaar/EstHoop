import { useCallback, useSyncExternalStore } from 'react'

// useSyncExternalStore, mitte useState + useEffect: kolmas argument on
// serveripoolne hetktõmmis, mida eelrenderdus kasutab. Nii ei puutu see
// window'it renderdamisel ja server ning klient renderdavad esimesel korral sama.
export default function useIsMobile(bp = 900) {
  const query = `(max-width: ${bp - 1}px)`

  const subscribe = useCallback(onChange => {
    const mq = window.matchMedia(query)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}
