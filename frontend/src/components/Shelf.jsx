import { useRef } from 'react'
import GameCard from './GameCard'

// Horizontal row of games that scrolls sideways (with buttons, keyboard, touch or trackpad).
export default function Shelf({ id, title, link, linkLabel, games, children }) {
  const rowRef = useRef(null)
  const scroll = direction => {
    const row = rowRef.current
    if (row) row.scrollBy({ left: direction * row.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <section className="shelf" aria-labelledby={`${id}-title`}>
      <div className="section-head">
        <h2 id={`${id}-title`}>{title}</h2>
        <div className="section-head-actions">
          {link && <a className="link" href={link}>{linkLabel}</a>}
          <button type="button" className="shelf-arrow" onClick={() => scroll(-1)} aria-label={`Scroll ${title} left`}>‹</button>
          <button type="button" className="shelf-arrow" onClick={() => scroll(1)} aria-label={`Scroll ${title} right`}>›</button>
        </div>
      </div>
      {children}
      <div className="shelf-row" ref={rowRef} tabIndex={0} aria-label={title}>
        {games.map(game => <GameCard key={game.id} game={game} />)}
      </div>
    </section>
  )
}
