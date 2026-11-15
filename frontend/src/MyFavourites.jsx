import './MyFavourites.css'

// Davi's Assessment 3 page. All real favourites are loaded/saved by Pedro's PHP API.
// When that endpoint is missing, App.jsx switches to an explicitly labelled local preview.
export default function MyFavourites({
  activeUser, sessionLoading, games, mode, error, busyId,
  onBrowse, onLogin, onOpenGame, onRemove, onRetry, ratingLabel,
}) {
  const heading = activeUser ? `${activeUser.username}'s collection` : 'Your personal game collection'

  return (
    <section className="favourites-page" aria-label="My Favourites">
      <button className="favourites-back" type="button" onClick={onBrowse}>← Back to games</button>
      <div className="favourites-header">
        <div>
          <p className="favourites-eyebrow">YOUR COLLECTION</p>
          <h1>My <span>Favourites</span></h1>
          <p className="favourites-subtitle">{heading} — keep your favourite games in one place.</p>
        </div>
        {activeUser && <div className="favourites-counter"><strong>{games.length}</strong><span>Saved games</span></div>}
      </div>

      {!activeUser ? (
        <div className="favourites-empty" role="status">
          <div className="favourites-empty-heart" aria-hidden="true">♡</div>
          <h2>{sessionLoading ? 'Checking your session...' : 'Log in to view My Favourites'}</h2>
          {!sessionLoading && <>
            <p>Save the games you love and find them here whenever you want.</p>
            <button type="button" className="favourites-primary" onClick={onLogin}>Log In</button>
          </>}
        </div>
      ) : (
        <>
          {mode === 'preview' && (
            <div className="favourites-preview-note" role="status">
              <strong>Preview mode</strong> — these favourites are saved only in this browser.
              Pedro's PHP API is still needed before final submission; preview favourites do not sync to MySQL.
            </div>
          )}
          {mode === 'loading' && <p className="favourites-feedback" role="status">Loading your favourite games...</p>}
          {mode === 'error' && (
            <div className="favourites-error" role="alert">
              <strong>Could not load your favourites.</strong>
              <p>{error}</p>
              <button type="button" className="favourites-primary" onClick={onRetry}>Try Again</button>
            </div>
          )}
          {(mode === 'live' || mode === 'preview') && (
            games.length === 0 ? (
              <div className="favourites-empty">
                <div className="favourites-empty-heart" aria-hidden="true">♡</div>
                <h2>No favourites yet</h2>
                <p>Explore the game collection and click the heart on any game's details page.</p>
                <button type="button" className="favourites-primary" onClick={onBrowse}>Explore Games</button>
              </div>
            ) : (
              <>
                <div className="favourites-section-heading">
                  <h2>Saved Games</h2>
                  <button type="button" onClick={onBrowse}>+ Discover more games</button>
                </div>
                <div className="favourites-grid">
                  {games.map(game => (
                    <article className="favourites-card" key={game.id}>
                      <button type="button" className="favourites-card-open" onClick={() => onOpenGame(game.id)} aria-label={`View details for ${game.title}`}>
                        <img src={game.image} alt={`${game.title} cover`} />
                      </button>
                      <div className="favourites-card-content">
                        <h3>{game.title}</h3>
                        <div className="favourites-card-meta">
                          <span>{game.genre}</span>
                          <span className="favourites-rating" aria-label={`Rating: ${ratingLabel(game)}`}><span aria-hidden="true">★</span> {ratingLabel(game)}</span>
                        </div>
                        <div className="favourites-card-actions">
                          <button type="button" className="favourites-view" onClick={() => onOpenGame(game.id)}>View details</button>
                          <button
                            type="button"
                            className="favourites-remove"
                            onClick={() => onRemove(game)}
                            disabled={busyId !== null}
                            aria-label={`Remove ${game.title} from favourites`}
                          >{busyId === game.id ? 'Removing...' : '♥ Remove'}</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )
          )}
        </>
      )}
    </section>
  )
}
