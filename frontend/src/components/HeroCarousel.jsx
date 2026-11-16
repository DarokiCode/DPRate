import { useEffect, useState } from 'react'
import { ScoreChip } from './Score'
import { useReducedMotion } from '../lib/hooks'
import { plural } from '../lib/format'

const SLIDE_MS = 7000

// First screen: what DPRate is (the h1) over the artwork of a featured game.
// The featured games change every 7 seconds; hovering or focusing pauses them.
export default function HeroCarousel({ featured, user }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reducedMotion = useReducedMotion()
  const game = featured[index % Math.max(featured.length, 1)]

  useEffect(() => {
    if (paused || reducedMotion || featured.length < 2) return undefined
    const timer = setTimeout(() => setIndex(current => (current + 1) % featured.length), SLIDE_MS)
    return () => clearTimeout(timer)
  }, [index, paused, reducedMotion, featured.length])

  return (
    <section
      className={`hero ${paused || reducedMotion ? 'is-paused' : ''}`}
      aria-labelledby="hero-title"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false) }}
    >
      <div className="hero-media" aria-hidden="true">
        {featured.map((item, itemIndex) => (
          <img
            key={item.id}
            src={item.banner || item.image}
            alt=""
            className={itemIndex === index ? 'is-active' : ''}
            loading={itemIndex === 0 ? 'eager' : 'lazy'}
            fetchPriority={itemIndex === 0 ? 'high' : 'low'}
            decoding="async"
          />
        ))}
      </div>
      <div className="hero-scrim" aria-hidden="true" />

      <div className="wrap hero-inner">
        <div className="hero-copy">
          <h1 id="hero-title">Rated by players.<br />Not by critics.</h1>
          <p className="hero-lede">
            Discover games on every platform, read honest reviews from the people who play them, and add your own score.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary btn-large" href="#browse">Browse all games</a>
            {user
              ? <a className="btn btn-secondary btn-large" href="#favourites">My favourites</a>
              : <a className="btn btn-secondary btn-large" href="#register">Join DPRate, it’s free</a>}
          </div>
        </div>

        {game && (
          <div className="hero-feature">
            <a className="hero-feature-game" href={`#game/${game.id}`} key={game.id}>
              {game.sponsored && <span className="sponsored-tag">Sponsored · demo</span>}
              {game.logo
                ? <img className="hero-logo" src={game.logo} alt={game.title} />
                : <span className="hero-feature-title">{game.title}</span>}
              <span className="hero-feature-facts">
                <ScoreChip rating={game.rating} size="large" upcoming={!game.released} />
                <span>
                  {game.logo && <strong>{game.title}</strong>}
                  <span>{game.genre} · {!game.released
                    ? `Out ${game.releaseLabel}, reviews open that day`
                    : `${game.release} · ${game.rating == null ? 'Be the first to rate it' : plural(game.reviewCount, 'player review')}`}</span>
                </span>
              </span>
            </a>
            <div className="hero-thumbs" role="group" aria-label="Featured games">
              {featured.map((item, itemIndex) => (
                <button
                  key={item.id}
                  type="button"
                  className={`hero-thumb ${itemIndex === index ? 'is-active' : ''}`}
                  aria-label={`Feature ${item.title}`}
                  aria-current={itemIndex === index ? 'true' : undefined}
                  onClick={() => setIndex(itemIndex)}
                  style={{ '--slide-ms': `${SLIDE_MS}ms` }}
                >
                  <img src={item.image} alt="" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
