import { useEffect, useMemo, useState } from 'react'
import './App.css'
import ReviewSection from './ReviewSection'
import MyFavourites from './MyFavourites'
import AccountPage from './AccountPage'
import { fetchGames, fetchGame, getSession, loginUser, registerUser, logoutUser, fetchFavourites, addFavourite, removeFavourite } from './api'

// Temporary fallback used ONLY when the PHP/MySQL server is offline.
// The finished prototype reads games from MySQL through PHP endpoints.
const sampleGames = [
  {
    id: 2, title: 'League of Legends', genre: 'Strategy', rating: 4.6,
    image: '/assets/league-of-legends.jpg', tags: ['Strategy', 'MOBA', 'Multiplayer'],
    description: "League of Legends is a multiplayer online, fast-paced strategy game where two teams of five players fight to destroy the enemy's main base.",
    developer: 'Riot Games', publisher: 'Riot Games', release: '2009', platforms: 'PC'
  },
  {
    id: 3, title: 'Valorant', genre: 'Action', rating: 4.5,
    image: '/assets/valorant.jpg', tags: ['Action', 'Tactical Shooter', 'Multiplayer'],
    description: 'A team-based tactical shooter where players use their skills and abilities to compete in exciting matches.',
    developer: 'Riot Games', publisher: 'Riot Games', release: '2020', platforms: 'PC and consoles'
  },
  {
    id: 4, title: 'Counter-Strike 2', genre: 'Action', rating: 4.8,
    image: '/assets/counter-strike-2.jpg', tags: ['Action', 'FPS', 'Multiplayer'],
    description: 'A competitive tactical shooter with objective-based matches and team gameplay.',
    developer: 'Valve', publisher: 'Valve', release: '2023', platforms: 'PC'
  },
]

const genres = ['Action', 'Adventure', 'RPG', 'Sports', 'Strategy', 'Simulation']

// Keep navigation in the URL so browser Back/Forward also works.
function pageFromHash() {
  const hash = window.location.hash
  const match = hash.match(/^#game\/(\d+)$/)
  if (match) return { gameId: Number(match[1]), authMode: null, favourites: false, account: false }
  if (hash === '#favourites') return { gameId: null, authMode: null, favourites: true, account: false }
  if (hash === '#account') return { gameId: null, authMode: null, favourites: false, account: true }
  if (hash === '#login' || hash === '#register') {
    return { gameId: null, authMode: hash.slice(1), favourites: false, account: false }
  }
  return { gameId: null, authMode: null, favourites: false, account: false }
}

// Temporary local preview is scoped to a user ID and stores only game IDs.
// It is NOT a substitute for Pedro's MySQL API or cross-device persistence.
const previewKey = userId => `dprate-a3-favourites-preview-user-${userId}`
function readPreviewIds(userId) {
  try {
    const values = JSON.parse(window.localStorage.getItem(previewKey(userId)) || '[]')
    return Array.isArray(values) ? [...new Set(values.map(Number).filter(id => Number.isInteger(id) && id > 0))] : []
  } catch { return [] }
}
function savePreviewIds(userId, ids) {
  window.localStorage.setItem(previewKey(userId), JSON.stringify(ids))
}

function App() {
  const [games, setGames] = useState(sampleGames)
  const [dataMode, setDataMode] = useState('loading')
  const [dataError, setDataError] = useState('')
  const [activeUser, setActiveUser] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [favouriteGames, setFavouriteGames] = useState([])
  const [previewFavouriteIds, setPreviewFavouriteIds] = useState([])
  const [favouritesMode, setFavouritesMode] = useState('idle')
  const [favouritesError, setFavouritesError] = useState('')
  const [favouritesRetry, setFavouritesRetry] = useState(0)
  const [favouriteBusyId, setFavouriteBusyId] = useState(null)
  const [returnToGameId, setReturnToGameId] = useState(null)
  const [authBusy, setAuthBusy] = useState(false)
  const [loadedDetail, setLoadedDetail] = useState(null)
  // Live review statistics for games that have been opened in this session.
  const [reviewStats, setReviewStats] = useState({})
  const [search, setSearch] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [sortTopRated, setSortTopRated] = useState(false)
  const [notice, setNotice] = useState('')
  const [selectedGameId, setSelectedGameId] = useState(() => pageFromHash().gameId)
  const [authMode, setAuthMode] = useState(() => pageFromHash().authMode)
  const [showFavourites, setShowFavourites] = useState(() => pageFromHash().favourites)
  const [showAccount, setShowAccount] = useState(() => pageFromHash().account)
  const [authMessage, setAuthMessage] = useState('')
  const [authFields, setAuthFields] = useState({ username: '', email: '', password: '', confirm: '', remember: false })

  useEffect(() => {
    function updatePage() {
      const page = pageFromHash()
      setSelectedGameId(page.gameId)
      setAuthMode(page.authMode)
      setShowFavourites(page.favourites)
      setShowAccount(page.account)
      setAuthMessage('')
    }
    window.addEventListener('hashchange', updatePage)
    return () => window.removeEventListener('hashchange', updatePage)
  }, [])

  // Front-end work: try Pedro's API, but keep the mockup games for offline preview.
  useEffect(() => {
    let active = true
    fetchGames()
      .then(result => {
        if (!active) return
        setGames(result.games)
        setDataMode('live')
      })
      .catch(error => {
        if (!active) return
        setDataMode('demo')
        setDataError(error.message)
      })
    getSession()
      .then(result => { if (active) setActiveUser(result.user) })
      .catch(() => { if (active) setActiveUser(null) })
      .finally(() => { if (active) setSessionLoading(false) })
    return () => { active = false }
  }, [])

  // Load a signed-in user's favourites. The database is authoritative once the
  // endpoint exists. Only a *missing* API (HTTP 404) enables browser-only preview.
  useEffect(() => {
    let active = true
    if (!activeUser?.id) {
      setFavouriteGames([])
      setPreviewFavouriteIds([])
      setFavouritesMode('idle')
      setFavouritesError('')
      return () => { active = false }
    }

    setFavouritesMode('loading')
    setFavouritesError('')
    fetchFavourites()
      .then(({ favourites }) => {
        if (!active) return
        setFavouriteGames(favourites)
        setPreviewFavouriteIds([])
        setFavouritesMode('live')
      })
      .catch(error => {
        if (!active) return
        if (error.status === 404) {
          setPreviewFavouriteIds(readPreviewIds(activeUser.id))
          setFavouritesMode('preview')
        } else {
          setFavouritesError(error.message)
          setFavouritesMode('error')
        }
      })
    return () => { active = false }
  }, [activeUser?.id, favouritesRetry])

  // Each game page requests its own details from the API when available.
  useEffect(() => {
    if (!selectedGameId || dataMode !== 'live') {
      setLoadedDetail(null)
      return
    }
    let active = true
    setLoadedDetail(null)
    fetchGame(selectedGameId)
      .then(result => { if (active) setLoadedDetail(result.game) })
      .catch(() => { if (active) setLoadedDetail(null) })
    return () => { active = false }
  }, [selectedGameId, dataMode])

  const displayedGames = useMemo(() => {
    let matchingGames = games.filter(game =>
      game.title.toLowerCase().includes(search.toLowerCase()) &&
      (!selectedGenre || game.genre === selectedGenre)
    )
    if (sortTopRated) matchingGames = [...matchingGames].sort((a, b) => (reviewStats[b.id]?.rating ?? b.rating ?? -1) - (reviewStats[a.id]?.rating ?? a.rating ?? -1))
    return matchingGames
  }, [games, search, selectedGenre, sortTopRated, reviewStats])

  const favouriteIds = favouritesMode === 'preview'
    ? previewFavouriteIds
    : favouriteGames.map(game => game.id)
  const displayedFavourites = favouritesMode === 'preview'
    ? previewFavouriteIds.map(id => games.find(game => game.id === id)).filter(Boolean)
    : favouriteGames.map(favourite => games.find(game => game.id === favourite.id) || favourite)

  const selectedGame = loadedDetail?.id === selectedGameId ? loadedDetail : games.find(game => game.id === selectedGameId)

  function updateReviewStats(gameId, reviews) {
    const count = reviews.length
    const rating = count === 0 ? null : reviews.reduce((sum, review) => sum + review.rating, 0) / count
    setReviewStats(previous => ({ ...previous, [gameId]: { rating, count } }))
  }

  async function refreshGameRatings(gameId) {
    // Do not misreport a saved review as failed if an optional ratings refresh fails.
    const [details, listing] = await Promise.allSettled([fetchGame(gameId), fetchGames()])
    if (details.status === 'fulfilled') setLoadedDetail(details.value.game)
    if (listing.status === 'fulfilled') setGames(listing.value.games)
  }

  function ratingLabel(game) {
    const score = reviewStats[game.id]?.rating ?? (Object.prototype.hasOwnProperty.call(reviewStats, game.id) ? null : game.rating)
    return score == null ? 'Not rated' : Number(score).toFixed(1)
  }

  function resetFilters() {
    setSearch('')
    setSelectedGenre('')
    setSortTopRated(false)
  }

  // Proper navigation dropdown actions (instead of decorative arrow-only links).
  function browseGames({ genre = '', topRated = false } = {}) {
    setSelectedGameId(null)
    setAuthMode(null)
    setShowFavourites(false)
    setShowAccount(false)
    setSearch('')
    setSelectedGenre(genre)
    setSortTopRated(topRated)
    setNotice('')
    window.location.hash = 'featured-games'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeDropdown(event) {
    const details = event.currentTarget.closest('details')
    if (details) details.open = false
  }

  function goHome() {
    setSelectedGameId(null)
    setAuthMode(null)
    setShowFavourites(false)
    setShowAccount(false)
    setNotice('')
    resetFilters()
    window.location.hash = 'home'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openGame(gameId) {
    setSelectedGameId(gameId)
    setAuthMode(null)
    setShowFavourites(false)
    setShowAccount(false)
    setNotice('')
    window.location.hash = `game/${gameId}`
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openFavourites() {
    setSelectedGameId(null)
    setAuthMode(null)
    setShowFavourites(true)
    setShowAccount(false)
    setNotice('')
    window.location.hash = 'favourites'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openAccount() {
    setSelectedGameId(null)
    setAuthMode(null)
    setShowFavourites(false)
    setShowAccount(true)
    setNotice('')
    window.location.hash = 'account'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function toggleFavourite(game) {
    if (!activeUser?.id) {
      setReturnToGameId(game.id)
      openAuth('login')
      setNotice('Log in to save games to My Favourites.')
      return
    }
    if (favouriteBusyId !== null || favouritesMode === 'loading') return
    if (favouritesMode === 'error' || favouritesMode === 'idle') {
      setNotice('Favourites are unavailable right now. Please try again.')
      return
    }
    const removing = favouriteIds.includes(game.id)
    const message = removing ? `${game.title} removed from My Favourites.` : `${game.title} added to My Favourites.`

    if (favouritesMode === 'preview') {
      const nextIds = removing
        ? previewFavouriteIds.filter(id => id !== game.id)
        : [...previewFavouriteIds, game.id]
      try {
        savePreviewIds(activeUser.id, nextIds)
        setPreviewFavouriteIds(nextIds)
        setNotice(`${message} Browser preview only — not saved in MySQL.`)
      } catch {
        setNotice('Browser storage is unavailable. Could not save the preview favourites.')
      }
      return
    }

    setFavouriteBusyId(game.id)
    try {
      if (removing) await removeFavourite(game.id)
      else await addFavourite(game.id)
      // Update immediately after a successful write. Fetching again is a bonus,
      // and a refresh failure must not be reported as a failed save.
      setFavouriteGames(current => removing
        ? current.filter(item => item.id !== game.id)
        : current.some(item => item.id === game.id) ? current : [...current, game])
      setNotice(message)
      try {
        const { favourites } = await fetchFavourites()
        setFavouriteGames(favourites)
      } catch { /* A successful write is still successful. */ }
    } catch (error) {
      setNotice(`Could not update favourites: ${error.message}`)
    } finally {
      setFavouriteBusyId(null)
    }
  }

  function showComingSoon(feature) {
    setNotice(`${feature} is not included in Assessment 2.`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openAuth(mode) {
    setSelectedGameId(null)
    setAuthMode(mode)
    setShowFavourites(false)
    setShowAccount(false)
    setAuthMessage('')
    setNotice('')
    window.location.hash = mode
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function changeAuthField(field, value) {
    setAuthFields(previous => ({ ...previous, [field]: value }))
    setAuthMessage('')
  }

  async function submitAuth(event) {
    event.preventDefault()
    if (authMode === 'register' && authFields.password !== authFields.confirm) {
      setAuthMessage('Passwords do not match. Please try again.')
      return
    }
    setAuthBusy(true)
    setAuthMessage('')
    try {
      const result = authMode === 'register'
        ? await registerUser({ username: authFields.username.trim(), email: authFields.email.trim(), password: authFields.password })
        : await loginUser({ login: authFields.username.trim(), password: authFields.password })
      setActiveUser(result.user)
      setAuthFields({ username: '', email: '', password: '', confirm: '', remember: false })
      const success = authMode === 'register' ? 'Account registered successfully.' : 'Logged in successfully.'
      if (returnToGameId !== null) {
        openGame(returnToGameId)
        setReturnToGameId(null)
      } else {
        goHome()
      }
      setNotice(success)
    } catch (error) {
      setAuthMessage(error.message)
    } finally {
      setAuthBusy(false)
    }
  }

  async function signOut() {
    try {
      await logoutUser()
      setActiveUser(null)
      setReturnToGameId(null)
      goHome()
      setNotice('You have signed out.')
    } catch (error) {
      setNotice(error.message)
    }
  }

  return (
    <div className="site" id="home">
      <div className="site-content">
        <header className="navbar">
          <a className="brand" href="#home" onClick={goHome} aria-label="DPRate home">
            <img src="/assets/logo-dprate.png" alt="DPRate" />
          </a>

          <nav className="nav-links" aria-label="Main navigation">
            <a href="#home" onClick={goHome}>Home</a>
            <details className="nav-dropdown">
              <summary>Games <span className="chevron">▾</span></summary>
              <div className="nav-dropdown-menu">
                <button type="button" onClick={event => { browseGames(); closeDropdown(event) }}>All Games</button>
                <button type="button" onClick={event => { browseGames({ topRated: true }); closeDropdown(event) }}>Top Rated</button>
                {activeUser && <button type="button" onClick={event => { openFavourites(); closeDropdown(event) }}>My Favourites</button>}
              </div>
            </details>
            <details className="nav-dropdown">
              <summary>Genres <span className="chevron">▾</span></summary>
              <div className="nav-dropdown-menu">
                {genres.map(genre => <button type="button" key={genre} onClick={event => { browseGames({ genre }); closeDropdown(event) }}>{genre}</button>)}
              </div>
            </details>
            <button className="nav-link-button" type="button" onClick={() => browseGames({ topRated: true })}>Top Rated</button>
            {activeUser && <a href="#favourites" onClick={openFavourites} aria-current={showFavourites ? 'page' : undefined}>♡ My Favourites <span className="favourites-nav-count">{favouriteIds.length}</span></a>}
            {activeUser && <a href="#account" onClick={openAccount} aria-current={showAccount ? 'page' : undefined}>My Account</a>}
          </nav>

          <div className="nav-actions">
            <label className="search-field">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="search-icon">
                <circle cx="10.8" cy="10.8" r="6.4" stroke="currentColor" strokeWidth="2.4" fill="none" />
                <path d="m15.6 15.6 5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
              <input value={search} onChange={e => { setSearch(e.target.value); setSelectedGameId(null); setAuthMode(null); setShowFavourites(false); setShowAccount(false); window.location.hash = 'featured-games' }} placeholder="Search for games..." aria-label="Search for games" />
            </label>
            {activeUser ? (
              <div className="signed-in-controls">
                <span className="signed-in-name">Hi, {activeUser.username}</span>
                <button className="login-button" type="button" onClick={signOut}>Log Out</button>
              </div>
            ) : (
              <>
                <button className="login-button" type="button" onClick={() => openAuth('login')}>Log In</button>
                <button className="signup-button" type="button" onClick={() => openAuth('register')}>Sign Up</button>
              </>
            )}
          </div>
        </header>

        {notice && (
          <div className="notice" role="status">
            <span>{notice}</span>
            <button type="button" aria-label="Dismiss message" onClick={() => setNotice('')}>×</button>
          </div>
        )}

        <main>
          {showFavourites ? (
            <MyFavourites
              activeUser={activeUser}
              sessionLoading={sessionLoading}
              games={displayedFavourites}
              mode={favouritesMode}
              error={favouritesError}
              busyId={favouriteBusyId}
              onBrowse={goHome}
              onLogin={() => openAuth('login')}
              onOpenGame={openGame}
              onRemove={toggleFavourite}
              onRetry={() => setFavouritesRetry(count => count + 1)}
              ratingLabel={ratingLabel}
            />
          ) : showAccount ? (
            <AccountPage
              activeUser={activeUser}
              sessionLoading={sessionLoading}
              onLogin={() => openAuth('login')}
              onBrowse={goHome}
              onOpenGame={openGame}
              onUserChanged={setActiveUser}
              onReviewsChanged={refreshGameRatings}
            />
          ) : authMode ? (
            <section className="auth-page" aria-label={authMode === 'login' ? 'Log in to DPRate' : 'Register for DPRate'}>
              <div className="auth-art">
                <div className="auth-art-copy">
                  <h1>Join The<br /><span>DPRate Community</span></h1>
                  <p>Discover new games for your next adventure, read honest ratings from actual players and connect with them.</p>
                </div>
              </div>

              <div className="auth-side">
                <div className="auth-tabs" role="tablist" aria-label="Account form">
                  <button type="button" role="tab" aria-selected={authMode === 'login'} className={authMode === 'login' ? 'active' : ''} onClick={() => openAuth('login')}>Log In</button>
                  <button type="button" role="tab" aria-selected={authMode === 'register'} className={authMode === 'register' ? 'active' : ''} onClick={() => openAuth('register')}>Register</button>
                </div>

                <div className="auth-card">
                  <h2>{authMode === 'login' ? 'Welcome Back Traveler' : <>Join <span>DPRate</span></>}</h2>
                  <p className="auth-subtitle">{authMode === 'login' ? 'Log in into your DPRate account' : 'Create your DPRate account'}</p>

                  <form className="auth-form" onSubmit={submitAuth}>
                    {authMode === 'register' ? (
                      <>
                        <label className="sr-only" htmlFor="register-username">Username</label>
                        <input id="register-username" type="text" placeholder="Username" autoComplete="username" value={authFields.username} onChange={e => changeAuthField('username', e.target.value)} required minLength={3} />
                        <label className="sr-only" htmlFor="register-email">Email</label>
                        <input id="register-email" type="email" placeholder="Email" autoComplete="email" value={authFields.email} onChange={e => changeAuthField('email', e.target.value)} required />
                        <label className="sr-only" htmlFor="register-password">Password</label>
                        <input id="register-password" type="password" placeholder="Password" autoComplete="new-password" value={authFields.password} onChange={e => changeAuthField('password', e.target.value)} required minLength={8} />
                        <label className="sr-only" htmlFor="register-confirm">Confirm Password</label>
                        <input id="register-confirm" type="password" placeholder="Confirm Password" autoComplete="new-password" value={authFields.confirm} onChange={e => changeAuthField('confirm', e.target.value)} required minLength={8} />
                        <button className="auth-submit" type="submit" disabled={authBusy}>{authBusy ? 'Creating account...' : 'Register'}</button>
                      </>
                    ) : (
                      <>
                        <label className="sr-only" htmlFor="login-username">Username or Email</label>
                        <input id="login-username" type="text" placeholder="Username or Email" autoComplete="username" value={authFields.username} onChange={e => changeAuthField('username', e.target.value)} required />
                        <label className="sr-only" htmlFor="login-password">Password</label>
                        <input id="login-password" type="password" placeholder="Password" autoComplete="current-password" value={authFields.password} onChange={e => changeAuthField('password', e.target.value)} required />
                        <div className="auth-extras">
                          <label><input type="checkbox" checked={authFields.remember} onChange={e => changeAuthField('remember', e.target.checked)} /> Remember Me</label>
                          <button type="button" className="auth-text-button" onClick={() => setAuthMessage('Password reset is not included in this prototype.')}>Forgot Password?</button>
                        </div>
                        <button className="auth-submit" type="submit" disabled={authBusy}>{authBusy ? 'Signing in...' : 'Log In'}</button>
                        <div className="auth-divider"><span>or</span></div>
                        <button type="button" className="google-button" onClick={() => setAuthMessage('Google sign-in is not included in this prototype.')}><span className="google-g">G</span> Continue with Google</button>
                      </>
                    )}
                  </form>
                  {authMessage && <p className="auth-feedback" role="status">{authMessage}</p>}
                </div>
              </div>
            </section>
          ) : selectedGame ? (
            <section className="details-page" aria-label={`${selectedGame.title} details`}>
              <button type="button" className="back-link" onClick={() => { setSelectedGameId(null); window.location.hash = 'featured-games' }}>
                ← Back to games
              </button>
              <div className="details-hero">
                <img className="details-cover" src={selectedGame.image} alt={`${selectedGame.title} cover`} />
                <div className="details-info">
                  <h1>{selectedGame.title}</h1>
                  <div className="details-rating"><span className="star">★</span> {ratingLabel(selectedGame)}</div>
                  <div className="details-tags">
                    {selectedGame.tags.map(tag => <span key={tag}>{tag}</span>)}
                  </div>
                  <p className="details-description">{selectedGame.description}</p>
                  <dl className="details-metadata">
                    <div><dt>Developer</dt><dd>{selectedGame.developer}</dd></div>
                    <div><dt>Publisher</dt><dd>{selectedGame.publisher}</dd></div>
                    <div><dt>Release</dt><dd>{selectedGame.release}</dd></div>
                    <div><dt>Platforms</dt><dd>{selectedGame.platforms}</dd></div>
                  </dl>
                  <button
                    className={`favourites-link ${favouriteIds.includes(selectedGame.id) ? 'is-favourite' : ''}`}
                    type="button"
                    disabled={activeUser && (favouritesMode === 'loading' || favouriteBusyId === selectedGame.id)}
                    aria-pressed={activeUser ? favouriteIds.includes(selectedGame.id) : false}
                    onClick={() => toggleFavourite(selectedGame)}
                  >
                    {favouriteBusyId === selectedGame.id ? 'Updating...' : favouriteIds.includes(selectedGame.id) ? '♥ Remove from Favourites' : '♡ Add to Favourites'}
                  </button>
                </div>
              </div>

              <ReviewSection
                key={selectedGame.id}
                gameId={selectedGame.id}
                activeUser={activeUser}
                onLogin={() => openAuth('login')}
                onReviewsChanged={refreshGameRatings}
                onRatingLoaded={updateReviewStats}
              />
            </section>
          ) : (
            <>
              <section className="hero" aria-label="Discover new games">
                <div className="hero-copy">
                  <h1>DISCOVER<br /><span>NEW GAMES</span></h1>
                  <p>Find new games to play, read honest<br className="desktop-break" /> ratings and join a community of gamers</p>
                </div>
              </section>

              <section className="genre-section" id="genres">
                <div className="section-heading">
                  <h2>Browse by genre</h2>
                  <button className="section-link" type="button" onClick={() => setSelectedGenre('')}>View all genres →</button>
                </div>
                <div className="genre-buttons">
                  {genres.map(genre => (
                    <button key={genre} type="button" className={`genre-pill ${selectedGenre === genre ? 'is-selected' : ''}`}
                      onClick={() => { setSelectedGenre(selectedGenre === genre ? '' : genre); setSortTopRated(false) }}>
                      {genre}
                    </button>
                  ))}
                </div>
              </section>

              <section className="featured-section" id="featured-games">
                <div className="section-heading">
                  <h2>{sortTopRated ? 'Top Rated Games' : 'Featured Games'}</h2>
                  <button className="section-link" type="button" onClick={resetFilters}>View all games →</button>
                </div>
                {dataMode === 'loading' && <p className="source-status" role="status">Checking game API...</p>}
                {dataMode === 'demo' && <p className="source-status" role="status">Demo data — API not connected. {dataError}</p>}
                {displayedGames.length > 0 ? (
                  <div className="game-grid">
                    {displayedGames.map(game => (
                      <button type="button" className="game-card game-card-button" key={game.id} onClick={() => openGame(game.id)} aria-label={`View details for ${game.title}`}>
                        <img className="game-cover" src={game.image} alt={`${game.title} cover`} />
                        <div className="game-info">
                          <h3>{game.title}</h3>
                          <div className="game-meta">
                            <span>{game.genre}</span>
                            <span className="rating"><span className="star" aria-label="Rating">★</span>{ratingLabel(game)}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="no-results">No games found. Try another search or genre.</p>
                )}
              </section>
            </>
          )}
        </main>
      </div>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/assets/logo-dprate.png" alt="DPRate" />
            <small>Games, Opinions &amp; Building a stronger<br />community</small>
          </div>
          <div className="footer-links">
            <a href="#about" onClick={e => { e.preventDefault(); showComingSoon('About') }}>About</a>
            <a href="#contact" onClick={e => { e.preventDefault(); showComingSoon('Contact') }}>Contact</a>
            <a href="#privacy" onClick={e => { e.preventDefault(); showComingSoon('Privacy') }}>Privacy</a>
            <a href="#terms" onClick={e => { e.preventDefault(); showComingSoon('Terms') }}>Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
