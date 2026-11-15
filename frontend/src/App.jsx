import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Toasts from './components/Toasts'
import HomePage from './pages/HomePage'
import BrowsePage from './pages/BrowsePage'
import GamePage from './pages/GamePage'
import AuthPage from './pages/AuthPage'
import FavouritesPage from './pages/FavouritesPage'
import AccountPage from './pages/AccountPage'
import { addFavourite, fetchFavourites, fetchGames, fetchGenres, getSession, logoutUser, removeFavourite } from './api'

// The page lives in the address after the # (for example #game/8 or #browse?genre=RPG).
// Hash routes work on any static host, with no server configuration.
let routeStamp = 0

function readRoute() {
  routeStamp += 1
  const stamp = routeStamp
  const [path, query = ''] = window.location.hash.replace(/^#\/?/, '').split('?')
  const params = new URLSearchParams(query)
  const game = path.match(/^game\/(\d+)$/)
  if (game) return { name: 'game', gameId: Number(game[1]), params, stamp }
  if (['browse', 'login', 'register', 'favourites', 'account'].includes(path)) return { name: path, params, stamp }
  return { name: 'home', params, stamp }
}

let nextToastId = 1

export default function App() {
  const [route, setRoute] = useState(readRoute)
  const [user, setUser] = useState(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [games, setGames] = useState([])
  const [genres, setGenres] = useState([])
  const [catalogue, setCatalogue] = useState('loading') // loading | ready | error
  const [favourites, setFavourites] = useState([])
  const [favouritesStatus, setFavouritesStatus] = useState('idle')
  const [favouriteBusyId, setFavouriteBusyId] = useState(null)
  const [toasts, setToasts] = useState([])
  // Where to go back after logging in (never the login page itself).
  const returnTo = useRef(/^#(login|register)/.test(window.location.hash) ? '#home' : window.location.hash || '#home')

  const toast = useCallback((message, type = 'success') => {
    const id = nextToastId++
    setToasts(current => [...current.slice(-2), { id, message, type }])
    setTimeout(() => setToasts(current => current.filter(item => item.id !== id)), 4500)
  }, [])

  // Follow the address. A new object every time, so a page always notices the change.
  useEffect(() => {
    const onHashChange = () => {
      const next = readRoute()
      setRoute(next)
      if (!['login', 'register'].includes(next.name)) returnTo.current = window.location.hash || '#home'
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const loadCatalogue = useCallback(async () => {
    try {
      const [gameList, genreList] = await Promise.all([fetchGames(), fetchGenres()])
      setGames(gameList)
      setGenres(genreList)
      setCatalogue('ready')
    } catch {
      setCatalogue('error')
    }
  }, [])

  // Ratings change after a review: refresh the scores but keep the current order of the games.
  const refreshGames = useCallback(async () => {
    try {
      const fresh = await fetchGames()
      setGames(current => {
        const byId = new Map(fresh.map(game => [game.id, game]))
        const kept = current.filter(game => byId.has(game.id)).map(game => byId.get(game.id))
        return [...kept, ...fresh.filter(game => !current.some(old => old.id === game.id))]
      })
    } catch { /* the old scores stay on screen */ }
  }, [])

  useEffect(() => {
    getSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setSessionReady(true))
    loadCatalogue()
  }, [loadCatalogue])

  const loadFavourites = useCallback(async () => {
    setFavouritesStatus('loading')
    try {
      setFavourites(await fetchFavourites())
      setFavouritesStatus('ready')
    } catch {
      setFavouritesStatus('error')
    }
  }, [])

  useEffect(() => {
    if (user?.id) loadFavourites()
    else { setFavourites([]); setFavouritesStatus('idle') }
  }, [user?.id, loadFavourites])

  const favouriteIds = useMemo(() => new Set(favourites.map(game => game.id)), [favourites])

  async function toggleFavourite(game) {
    if (!user) {
      returnTo.current = `#game/${game.id}`
      toast('Log in to save games to your favourites.', 'info')
      window.location.hash = 'login'
      return
    }
    const removing = favouriteIds.has(game.id)
    setFavouriteBusyId(game.id)
    try {
      if (removing) await removeFavourite(game.id)
      else await addFavourite(game.id)
      setFavourites(current => (removing ? current.filter(item => item.id !== game.id) : [game, ...current]))
      toast(removing ? `${game.title} was removed from your favourites.` : `${game.title} was added to your favourites.`)
      loadFavourites()
    } catch (error) {
      toast(error.message, 'error')
    } finally {
      setFavouriteBusyId(null)
    }
  }

  function onAuthenticated(account, message) {
    setUser(account)
    toast(message)
    window.location.hash = returnTo.current.replace(/^#/, '') || 'home'
  }

  async function logout() {
    try {
      await logoutUser()
      setUser(null)
      toast('You have logged out. See you soon!')
      if (['favourites', 'account'].includes(route.name)) window.location.hash = 'home'
    } catch (error) {
      toast(error.message, 'error')
    }
  }

  function goToLogin() {
    returnTo.current = window.location.hash || '#home'
    window.location.hash = 'login'
  }

  let page
  if (catalogue === 'error') {
    page = (
      <div className="wrap page-message">
        <h1>DPRate is not reachable right now</h1>
        <p>The game list could not be loaded from the server. Please check your connection and try again.</p>
        <button type="button" className="btn btn-primary btn-large" onClick={() => { setCatalogue('loading'); loadCatalogue() }}>Try again</button>
      </div>
    )
  } else if (catalogue === 'loading' && ['home', 'browse'].includes(route.name)) {
    page = (
      <div className="wrap skeleton-page" role="status" aria-label="Loading games">
        <div className="skeleton skeleton-hero" />
        <div className="game-grid">{Array.from({ length: 6 }, (_, index) => <div key={index} className="skeleton skeleton-card" />)}</div>
      </div>
    )
  } else if (route.name === 'browse') {
    page = <BrowsePage key={route.stamp} games={games} genres={genres} params={route.params} />
  } else if (route.name === 'game') {
    page = (
      <GamePage
        gameId={route.gameId}
        games={games}
        user={user}
        isFavourite={favouriteIds.has(route.gameId)}
        favouriteBusy={favouriteBusyId === route.gameId}
        onToggleFavourite={toggleFavourite}
        onLogin={goToLogin}
        onGamesChanged={refreshGames}
        toast={toast}
      />
    )
  } else if (route.name === 'login' || route.name === 'register') {
    page = user
      ? <div className="wrap page-message"><h1>You are logged in</h1><p>Logged in as {user.username}.</p><a className="btn btn-primary" href="#home">Go to the home page</a></div>
      : <AuthPage key={route.name} mode={route.name} onAuthenticated={onAuthenticated} />
  } else if (route.name === 'favourites') {
    page = (
      <FavouritesPage user={user} sessionReady={sessionReady} favourites={favourites} status={favouritesStatus}
        busyId={favouriteBusyId} onRemove={toggleFavourite} onRetry={loadFavourites} />
    )
  } else if (route.name === 'account') {
    page = (
      <AccountPage user={user} sessionReady={sessionReady} games={games} favouriteCount={favourites.length}
        onUserChanged={setUser} onGamesChanged={refreshGames} toast={toast} />
    )
  } else {
    page = <HomePage games={games} genres={genres} user={user} />
  }

  return (
    <>
      <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); document.getElementById('main')?.focus() }}>Skip to content</a>
      <Navbar user={user} games={games} genres={genres} favouriteCount={favourites.length} routeName={route.name} onLogout={logout} />
      <main id="main" tabIndex={-1} className={`page page-${route.name}`}>{page}</main>
      <Footer genres={genres} user={user} />
      <Toasts toasts={toasts} onDismiss={id => setToasts(current => current.filter(item => item.id !== id))} />
    </>
  )
}
