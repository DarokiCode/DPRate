import { useState } from 'react'
import Dropdown from './Dropdown'
import SearchBox from './SearchBox'
import Avatar from './Avatar'

export default function Navbar({ user, games, genres, favouriteCount, routeName, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const current = name => (routeName === name ? 'page' : undefined)
  const close = () => setMenuOpen(false)

  return (
    <header className="navbar">
      <div className="wrap navbar-inner">
        <a className="brand" href="#home" aria-label="DPRate home">
          <img src="/assets/dprate-wordmark.png" alt="DPRate" width="208" height="52" />
        </a>

        <nav className="nav-main" aria-label="Main">
          <a className="nav-link" href="#home" aria-current={current('home')}>Home</a>
          <Dropdown id="menu-games" label="Games">
            <a className="dropdown-item" href="#browse">All games <span>{games.length}</span></a>
            <a className="dropdown-item" href="#browse?sort=top">Top rated</a>
            <a className="dropdown-item" href="#browse?sort=reviews">Most reviewed</a>
            <a className="dropdown-item" href="#browse?sort=new">Newest and upcoming</a>
          </Dropdown>
          <Dropdown id="menu-genres" label="Genres">
            {genres.map(genre => (
              <a key={genre.id} className="dropdown-item" href={`#browse?genre=${encodeURIComponent(genre.name)}`}>
                {genre.name} <span>{genre.count}</span>
              </a>
            ))}
          </Dropdown>
          <a className="nav-link" href="#plans" aria-current={current('plans')}>Plans</a>
          {user && (
            <a className="nav-link" href="#favourites" aria-current={current('favourites')}>
              Favourites <span className="nav-count" aria-label={`${favouriteCount} saved`}>{favouriteCount}</span>
            </a>
          )}
        </nav>

        <div className="nav-search"><SearchBox games={games} id="nav-search" /></div>

        <div className="nav-actions">
          {user ? (
            <Dropdown
              id="menu-user"
              align="right"
              buttonClass="nav-user"
              label={<><Avatar name={user.username} avatar={user.avatar} plan={user.plan} /><span className="nav-username">{user.username}</span></>}
            >
              <a className="dropdown-item" href="#account">My account</a>
              <a className="dropdown-item" href="#favourites">My favourites</a>
              <a className="dropdown-item" href="#plans">My plan <span>{user.plan === 'standard' ? 'Standard' : user.plan === 'silver' ? 'Silver' : 'Gold'}</span></a>
              <button type="button" className="dropdown-item" onClick={onLogout}>Log out</button>
            </Dropdown>
          ) : (
            <>
              <a className="btn btn-ghost" href="#login">Log in</a>
              <a className="btn btn-primary" href="#register">Sign up</a>
            </>
          )}
        </div>

        <button type="button" className="menu-toggle" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen(open => !open)}>
          <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
          <span className={`burger ${menuOpen ? 'is-open' : ''}`} aria-hidden="true"><span /><span /><span /></span>
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu" id="mobile-menu" onClick={event => { if (event.target.closest('a, button.dropdown-item')) close() }}>
          <div className="wrap">
            <SearchBox games={games} id="mobile-search" onDone={close} />
            <nav aria-label="Mobile">
              <a href="#home">Home</a>
              <a href="#browse">All games</a>
              <a href="#browse?sort=top">Top rated</a>
              <a href="#plans">Plans</a>
              {user && <a href="#favourites">My favourites ({favouriteCount})</a>}
              {user && <a href="#account">My account</a>}
            </nav>
            <div className="mobile-genres">
              {genres.map(genre => <a key={genre.id} href={`#browse?genre=${encodeURIComponent(genre.name)}`}>{genre.name}</a>)}
            </div>
            <div className="mobile-actions">
              {user ? (
                <button type="button" className="btn btn-secondary dropdown-item" onClick={() => { close(); onLogout() }}>Log out</button>
              ) : (
                <>
                  <a className="btn btn-secondary" href="#login">Log in</a>
                  <a className="btn btn-primary" href="#register">Sign up</a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
