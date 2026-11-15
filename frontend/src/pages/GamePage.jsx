import { useCallback, useEffect, useState } from 'react'
import Cover from '../components/Cover'
import { ScoreBoard } from '../components/Score'
import Shelf from '../components/Shelf'
import ReviewSection from '../components/ReviewSection'
import { fetchGame, fetchReviews } from '../api'
import { useDocumentTitle } from '../lib/hooks'

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
          <img src={game.banner || game.image} alt="" />
        </div>
        <div className="wrap game-hero-inner">
          <div className="game-cover"><Cover src={game.image} title={game.title} eager /></div>
          <div className="game-head">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <a href="#home">Home</a><span aria-hidden="true">/</span>
              <a href={`#browse?genre=${encodeURIComponent(game.genre)}`}>{game.genre}</a><span aria-hidden="true">/</span>
              <span aria-current="page">{game.title}</span>
            </nav>
            <h1>{game.title}</h1>
            <p className="game-facts">{game.genre} · {game.release} · {game.developer}</p>
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
              <a className="btn btn-large btn-secondary" href="#write-review" onClick={event => { event.preventDefault(); document.getElementById('write-review')?.scrollIntoView() }}>Rate this game</a>
            </div>
          </div>
          <ScoreBoard rating={game.rating} count={game.reviewCount} reviews={reviewStatus === 'ready' ? reviews : null} />
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
              <div><dt>Released</dt><dd>{game.release}</dd></div>
              <div><dt>Platforms</dt><dd>{game.platforms}</dd></div>
              <div><dt>Genre</dt><dd><a className="link" href={`#browse?genre=${encodeURIComponent(game.genre)}`}>{game.genre}</a></dd></div>
            </dl>
          </div>
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
          toast={toast}
        />

        {more.length > 0 && (
          <Shelf id="more-genre" title={`More ${game.genre} games`} link={`#browse?genre=${encodeURIComponent(game.genre)}`} linkLabel={`All ${game.genre}`} games={more} />
        )}
      </div>
    </article>
  )
}
