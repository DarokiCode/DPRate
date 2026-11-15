import { useEffect, useState } from 'react'

// True when the visitor asked the system for less motion.
export function useReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(() => window.matchMedia?.(query).matches ?? false)
  useEffect(() => {
    const media = window.matchMedia?.(query)
    if (!media) return undefined
    const onChange = () => setReduced(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  return reduced
}

// Browser tab title for each page.
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · DPRate` : 'DPRate · Game reviews by players'
  }, [title])
}
