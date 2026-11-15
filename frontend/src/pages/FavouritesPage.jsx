import GameCard from '../components/GameCard'
import { plural } from '../lib/format'
import { useDocumentTitle } from '../lib/hooks'

export default function FavouritesPage({ user, sessionReady, favourites, status, busyId, onRemove, onRetry }) {
  useDocumentTitle('My favourites')

  if (!user) {
    return (
      <div className="wrap page-message">
        <h1>My favourites</h1>
        <p>{sessionReady ? 'Log in to keep the games you love in one place.' : 'Checking your session…'}</p>
        {sessionReady && <a className="btn btn-primary btn-large" href="#login">Log in</a>}
      </div>
    )
  }

  return (
    <div className="wrap favourites-page">
      <header className="page-head">
        <h1>My favourites</h1>
        <p>{status === 'ready' ? `${plural(favourites.length, 'game')} saved by ${user.username}.` : 'Your saved games, on any device you log in from.'}</p>
      </header>

      {status === 'loading' && <p className="muted" role="status">Loading your favourites…</p>}
      {status === 'error' && (
        <div className="empty-panel" role="alert">
          <p>Your favourites could not be loaded.</p>
          <button type="button" className="btn btn-secondary" onClick={onRetry}>Try again</button>
        </div>
      )}
      {status === 'ready' && favourites.length === 0 && (
        <div className="empty-panel">
          <h2>Nothing saved yet</h2>
          <p>Open any game and press “Add to favourites”. It will wait for you here.</p>
          <a className="btn btn-primary" href="#browse">Find games</a>
        </div>
      )}
      {status === 'ready' && favourites.length > 0 && (
        <div className="game-grid">
          {favourites.map(game => (
            <div key={game.id} className="favourite-item">
              <GameCard game={game} />
              <button type="button" className="btn btn-small btn-ghost favourite-remove" disabled={busyId !== null} onClick={() => onRemove(game)}>
                {busyId === game.id ? 'Removing…' : 'Remove'}<span className="sr-only"> {game.title} from favourites</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
