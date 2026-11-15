import { useState } from 'react'

// Game artwork with a designed fallback, so a missing image never shows a broken icon.
export default function Cover({ src, title, className = '', eager = false }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className={`cover-fallback ${className}`} role="img" aria-label={`${title} cover`}>
        <span>{title}</span>
      </div>
    )
  }

  return (
    <img
      className={className}
      src={src}
      alt={`${title} cover art`}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
