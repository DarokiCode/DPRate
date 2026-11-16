import { useEffect, useMemo, useState } from 'react'
import HeroCarousel from '../components/HeroCarousel'
import Shelf from '../components/Shelf'
import GameCard from '../components/GameCard'
import Cover from '../components/Cover'
import { Stars } from '../components/Score'
import Avatar, { PlanBadge } from '../components/Avatar'
import AdSlot from '../components/AdSlot'
import { fetchRecentReviews } from '../api'
import { formatDate, plural } from '../lib/format'
import { useDocumentTitle } from '../lib/hooks'

export default function HomePage({ games, genres, user }) {
  useDocumentTitle('')
  const [recent, setRecent] = useState({ status: 'loading', reviews: [] })

  useEffect(() => {
    let active = true
    fetchRecentReviews(6)
      .then(reviews => { if (active) setRecent({ status: 'ready', reviews }) })
      .catch(() => { if (active) setRecent({ status: 'error', reviews: [] }) })
    return () => { active = false }
  }, [])

  // games.php sends the games in a random order, so the home page changes on every visit.
  // The sponsored game (paid placement, part of the business model) always comes first.
  const featured = useMemo(
    () => games.filter(game => game.banner).sort((a, b) => Number(b.sponsored) - Number(a.sponsored)).slice(0, 5),
    [games],
  )
  const topRated = useMemo(
    () => games.filter(game => game.rating != null)
      .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
      .slice(0, 10),
    [games],
  )
  const discover = useMemo(() => games.slice(0, 12), [games])
  // While few games have scores, the shelf shows the scored ones first, then the rest.
  const scoreShelf = useMemo(
    () => [...topRated, ...games.filter(game => game.rating == null)].slice(0, 10),
    [topRated, games],
  )
  const genreTiles = useMemo(
    () => genres.map(genre => ({ ...genre, art: games.find(game => game.genre === genre.name) })),
    [genres, games],
  )

  return (
    <>
      <HeroCarousel featured={featured} user={user} />

      <div className="wrap home-sections">
        {topRated.length >= 5 ? (
          <Shelf id="top-rated" title="Top rated by players" link="#browse?sort=top" linkLabel="See the full ranking" games={topRated} />
        ) : (
          <Shelf id="scores" title="Player scores so far" link="#browse?sort=top" linkLabel="See the ranking" games={scoreShelf}>
            <p className="section-lede">
              {topRated.length === 0
                ? 'No game has a player score yet. Open one you have played and be the first to rate it.'
                : `${topRated.length} of ${games.length} games have a player score. The ones marked New are waiting for their first review.`}
            </p>
          </Shelf>
        )}

        <section className="genres" aria-labelledby="genres-title">
          <div className="section-head">
            <h2 id="genres-title">Browse by genre</h2>
            <a className="link" href="#browse">All genres</a>
          </div>
          <div className="genre-tiles">
            {genreTiles.map(genre => (
              <a key={genre.id} className="genre-tile" href={`#browse?genre=${encodeURIComponent(genre.name)}`}>
                {genre.art && <Cover src={genre.art.banner || genre.art.image} title={genre.art.title} />}
                <span className="genre-tile-text">
                  <strong>{genre.name}</strong>
                  <span>{plural(genre.count, 'game')}</span>
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="community" aria-labelledby="community-title">
          <div className="section-head">
            <h2 id="community-title">Fresh from the community</h2>
          </div>
          {recent.status === 'loading' && <p className="muted" role="status">Loading the latest reviews…</p>}
          {recent.status === 'error' && <p className="muted">The latest reviews could not be loaded right now.</p>}
          {recent.status === 'ready' && recent.reviews.length === 0 && (
            <div className="empty-panel">
              <p>No reviews yet. Pick a game you know and write the very first one.</p>
              <a className="btn btn-primary" href="#browse">Find a game to review</a>
            </div>
          )}
          {recent.reviews.length > 0 && (
            <div className="review-feed">
              {recent.reviews.map(review => (
                <a key={review.id} className="feed-card" href={`#game/${review.gameId}`}>
                  <Cover src={review.gameImage} title={review.gameTitle} className="feed-cover" />
                  <span className="feed-body">
                    <span className="feed-game">{review.gameTitle}</span>
                    <Stars value={review.rating} size={16} />
                    <span className="sr-only">{review.rating} out of 5 stars</span>
                    <span className="feed-comment">{review.comment}</span>
                    <span className="feed-author">
                      <Avatar name={review.username} avatar={review.avatar} plan={review.plan} />
                      <span>{review.username} <PlanBadge plan={review.plan} /> · {formatDate(review.createdAt)}</span>
                    </span>
                  </span>
                </a>
              ))}
            </div>
          )}
        </section>

        <AdSlot user={user} kind="plans" />

        <section className="discover" aria-labelledby="discover-title">
          <div className="section-head">
            <h2 id="discover-title">More to discover</h2>
            <a className="link" href="#browse">Browse all {games.length} games</a>
          </div>
          <div className="game-grid">
            {discover.map(game => <GameCard key={game.id} game={game} />)}
          </div>
        </section>
      </div>

      {!user && (
        <section className="join-band" aria-labelledby="join-title">
          <div className="wrap join-inner">
            <h2 id="join-title">Your score counts.</h2>
            <p>Create a free account to rate games, write reviews and keep a list of your favourites.</p>
            <a className="btn btn-large join-button" href="#register">Create my account</a>
          </div>
        </section>
      )}
    </>
  )
}
