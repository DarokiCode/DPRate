import { useState } from 'react'

// Game artwork with a designed fallback, so a missing image never shows a broken icon.
// decorative: the title is already written next to the picture (game cards), so screen readers skip it.
export default function Cover({ src, title, className = '', eager = false, decorative = false }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className={`cover-fallback ${className}`} {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': `${title} cover` })}>
        <span>{title}</span>
      </div>
    )
  }

  return (
    <img
      className={className}
      src={src}
      alt={decorative ? '' : `${title} cover art`}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
