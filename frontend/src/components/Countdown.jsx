import { useEffect, useState } from 'react'
import { releaseMoment } from '../lib/format'

// Live countdown to a game's release day. When it reaches zero it says so,
// and the review form opens (the server checks the date too).
export default function Countdown({ date, onReached, compact = false }) {
  const target = releaseMoment(date)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const left = target ? target.getTime() - now : 0
  useEffect(() => {
    if (target && left <= 0 && onReached) onReached()
    // Only the moment it reaches zero matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left <= 0])

  if (!target) return null
  if (left <= 0) return <p className="countdown-done" role="status">Out now</p>

  const units = [
    ['days', Math.floor(left / 86400000)],
    ['hours', Math.floor(left / 3600000) % 24],
    ['minutes', Math.floor(left / 60000) % 60],
    ['seconds', Math.floor(left / 1000) % 60],
  ]
  const spoken = `${units[0][1]} days, ${units[1][1]} hours and ${units[2][1]} minutes to go`

  return (
    <div className={`countdown ${compact ? 'countdown-compact' : ''}`} role="timer" aria-label={spoken}>
      {units.map(([label, value]) => (
        <span key={label} className="countdown-unit" aria-hidden="true">
          <strong>{String(value).padStart(2, '0')}</strong>
          <span>{label}</span>
        </span>
      ))}
    </div>
  )
}
