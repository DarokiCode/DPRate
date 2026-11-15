import { formatScore, plural, scoreBand } from '../lib/format'

// Coloured chip with the players' average score.
export function ScoreChip({ rating, size = 'normal' }) {
  const label = rating == null ? 'Not rated yet' : `Player score ${rating.toFixed(1)} out of 5`
  return (
    <span className={`score-chip score-${scoreBand(rating)} score-chip-${size}`} aria-label={label} title={label}>
      {formatScore(rating)}
    </span>
  )
}

// Five stars; works with averages too (4.3 fills 4 stars and 30% of the fifth).
export function Stars({ value, size = 18 }) {
  const percent = Math.max(0, Math.min(100, ((value || 0) / 5) * 100))
  return (
    <span className="stars" style={{ '--star-size': `${size}px` }} aria-hidden="true">
      <span className="stars-empty">★★★★★</span>
      <span className="stars-full" style={{ width: `${percent}%` }}>★★★★★</span>
    </span>
  )
}

// Big scoreboard block: average, stars, review count and how the stars are spread.
export function ScoreBoard({ rating, count, reviews = null }) {
  const spread = [5, 4, 3, 2, 1].map(star => ({
    star,
    total: reviews ? reviews.filter(review => review.rating === star).length : 0,
  }))

  return (
    <div className="scoreboard">
      <div className="scoreboard-main">
        <span className={`scoreboard-number score-text-${scoreBand(rating)}`}>{rating == null ? '0.0' : rating.toFixed(1)}</span>
        <div className="scoreboard-meta">
          <Stars value={rating} size={22} />
          <span>{rating == null ? 'Not rated yet' : `from ${plural(count, 'player review')}`}</span>
        </div>
      </div>
      {reviews && reviews.length > 0 && (
        <ul className="spread" aria-label="How players rated this game">
          {spread.map(({ star, total }) => (
            <li key={star}>
              <span className="spread-label">{star}★</span>
              <span className="spread-bar"><span style={{ width: `${(total / reviews.length) * 100}%` }} /></span>
              <span className="spread-total">{total}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
