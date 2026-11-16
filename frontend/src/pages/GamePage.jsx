import { useCallback, useEffect, useState } from 'react'
import Cover from '../components/Cover'
import { ScoreBoard } from '../components/Score'
import Shelf from '../components/Shelf'
import ReviewSection from '../components/ReviewSection'
import Countdown from '../components/Countdown'
import AdSlot from '../components/AdSlot'
import { fetchGame, fetchReviews } from '../api'
import { useDocumentTitle } from '../lib/hooks'
import { responsiveImage, shortDate } from '../lib/format'

export default function GamePage({ gameId, games, user, isFavourite, favouriteBusy, onToggleFavourite, onLogin, onGamesChanged, toast }) {
  const [game, setGame] = useState(() => games.find(item => item.id === gameId) || null)
  const [status, setStatus] = useState('loading')
  const [reviews, setReviews] = useState([])
  const [reviewStatus, setReviewStatus] = useState('loading')

  const load = useCallback(async () => {
    setReviewStatus(current => (current === 'ready' ? 'ready' : 'loading'))
    const [details, list] = await Promise.allSettled([fetchGame(gameId), fetchReviews(gameId)])
    if (details.status === 'fulfilled') {
      setGame(details.value)
      setStatus('ready')
    } else {
      setStatus(details.reason?.status === 404 ? 'missing' : 'error')
    }
    if (list.status === 'fulfilled') {
      setReviews(list.value)
      setReviewStatus('ready')
    } else {
      setReviewStatus('error')
    }
  }, [gameId])

  useEffect(() => {
    setGame(games.find(item => item.id === gameId) || null)
    setStatus('loading')
    setReviews([])
    load()
    // Only a different game id reloads the page data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  useDocumentTitle(game?.title || (status === 'missing' ? 'Game not found' : 'Loading'))

  // After a review is posted, edited or deleted: new reviews, new average, new home page scores.
  const refresh = useCallback(async () => {
    await load()
    await onGamesChanged()
  }, [load, onGamesChanged])

  if (status === 'missing' || (status === 'error' && !game)) {
    return (
      <div className="wrap page-message">
        <h1>{status === 'missing' ? 'Game not found' : 'This game could not be loaded'}</h1>
        <p>{status === 'missing' ? 'This game is not in the DPRate collection.' : 'Check your connection and try again.'}</p>
        <a className="btn btn-primary" href="#browse">Browse all games</a>
      </div>
    )
  }

  if (!game) {
    return <div className="wrap page-message"><p role="status">Loading the game…</p></div>
  }

  const more = games.filter(item => item.genre === game.genre && item.id !== game.id)

  return (
    <article className="game-page">
      <div className="game-hero">
        <div className="game-backdrop" aria-hidden="true">
          <img src={game.banner || game.image} {...responsiveImage(game.banner || game.image)} alt="" fetchPriority="high" decoding="async" />
        </div>
        <div className="wrap game-hero-inner">
          <div className="game-cover"><Cover src={game.image} title={game.title} eager /></div>
          <div className="game-head">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <a href="#home">Home</a><span aria-hidden="true">/</span>
              <a href={`#browse?genre=${encodeURIComponent(game.genre)}`}>{game.genre}</a><span aria-hidden="true">/</span>
              <span aria-current="page">{game.title}</span>
            </nav>
            {game.sponsored && <span className="sponsored-tag">Sponsored · demo</span>}
            <h1>{game.title}</h1>
            <p className="game-facts">{game.genre} · {game.released ? game.release : `Out ${game.releaseLabel}`} · {game.developer}</p>
            {!game.released && (
              <div className="game-countdown">
                <span className="game-countdown-label">Release day in</span>
                <Countdown date={game.releaseDate} onReached={load} compact />
              </div>
            )}
            <ul className="tag-list" aria-label="Tags">
              {game.tags.map(tag => <li key={tag}>{tag}</li>)}
            </ul>
            <div className="game-actions">
              <button
                type="button"
                className={`btn btn-large ${isFavourite ? 'btn-secondary is-on' : 'btn-primary'}`}
                aria-pressed={Boolean(user) && isFavourite}
                disabled={favouriteBusy}
                onClick={() => onToggleFavourite(game)}
              >
                {favouriteBusy ? 'Saving…' : isFavourite ? '♥ In your favourites' : '♡ Add to favourites'}
              </button>
              <a className="btn btn-large btn-secondary" href="#write-review" onClick={event => { event.preventDefault(); document.getElementById('write-review')?.scrollIntoView() }}>
                {game.released ? 'Rate this game' : `Reviews open ${shortDate(game.releaseDate)}`}
              </a>
            </div>
          </div>
          <ScoreBoard rating={game.rating} count={game.reviewCount} reviews={reviewStatus === 'ready' ? reviews : null} upcoming={!game.released} />
        </div>
      </div>

      <div className="wrap game-body">
        <section className="game-about" aria-labelledby="about-title">
          <h2 id="about-title">About the game</h2>
          <div className="game-about-grid">
            <p className="game-description">{game.description}</p>
            <dl className="facts">
              <div><dt>Developer</dt><dd>{game.developer}</dd></div>
              <div><dt>Publisher</dt><dd>{game.publisher}</dd></div>
              <div><dt>{game.released ? 'Released' : 'Release date'}</dt><dd>{game.releaseLabel}</dd></div>
              <div><dt>Platforms</dt><dd>{game.platforms.replaceAll('|', '\u2009|\u2009')}</dd></div>
              <div><dt>Genre</dt><dd><a className="link" href={`#browse?genre=${encodeURIComponent(game.genre)}`}>{game.genre}</a></dd></div>
            </dl>
          </div>
          {game.stores.length > 0 && (
            <div className="stores" aria-labelledby="stores-title">
              <h3 id="stores-title">{game.released ? 'Where to buy' : 'Where to pre-order'}</h3>
              <ul className="store-list">
                {game.stores.map(store => (
                  <li key={store.url}>
                    <a className="btn btn-secondary store-link" href={store.url} target="_blank" rel="sponsored noopener noreferrer">
                      {store.name}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
              <p className="stores-note">
                Official stores only. On a live DPRate these would be affiliate links: the store pays DPRate a small share of each sale, and the price stays the same for you. In this student demo they are plain links.
              </p>
            </div>
          )}
        </section>

        <ReviewSection
          key={game.id}
          game={game}
          reviews={reviews}
          status={reviewStatus}
          user={user}
          onRetry={load}
          onLogin={onLogin}
          onChanged={refresh}
          onReleased={load}
          toast={toast}
        />

        <AdSlot user={user} kind="advertise" />

        {more.length > 0 && (
          <Shelf id="more-genre" title={`More ${game.genre} games`} link={`#browse?genre=${encodeURIComponent(game.genre)}`} linkLabel={`All ${game.genre}`} games={more} />
        )}
      </div>
    </article>
  )
}
