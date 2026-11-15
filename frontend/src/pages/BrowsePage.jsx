import { useEffect, useMemo, useState } from 'react'
import GameCard from '../components/GameCard'
import { matchesSearch } from '../lib/search'
import { plural } from '../lib/format'
import { useDocumentTitle } from '../lib/hooks'

const SORTS = [
  { id: 'featured', label: 'Featured (shuffled)' },
  { id: 'top', label: 'Top rated' },
  { id: 'reviews', label: 'Most reviewed' },
  { id: 'new', label: 'Newest releases' },
  { id: 'title', label: 'Title A to Z' },
]

const SORTERS = {
  featured: () => 0,
  top: (a, b) => (b.rating ?? -1) - (a.rating ?? -1) || b.reviewCount - a.reviewCount,
  reviews: (a, b) => b.reviewCount - a.reviewCount || (b.rating ?? -1) - (a.rating ?? -1),
  new: (a, b) => Number(b.release) - Number(a.release) || a.title.localeCompare(b.title),
  title: (a, b) => a.title.localeCompare(b.title),
}

// The filters live in the address (#browse?genre=RPG&sort=top&q=ring),
// so menus, links and the back button all work. App gives this page a new key for every
// new address, so the filters start again from the address each time.
export default function BrowsePage({ games, genres, params }) {
  const [genre, setGenre] = useState(params.get('genre') || '')
  const [sort, setSort] = useState(SORTERS[params.get('sort')] ? params.get('sort') : 'featured')
  const [query, setQuery] = useState(params.get('q') || '')

  useEffect(() => {
    const next = new URLSearchParams()
    if (genre) next.set('genre', genre)
    if (sort !== 'featured') next.set('sort', sort)
    if (query.trim()) next.set('q', query.trim())
    const hash = `#browse${next.toString() ? `?${next}` : ''}`
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash)
  }, [genre, sort, query])

  const results = useMemo(
    () => games.filter(game => (!genre || game.genre === genre) && matchesSearch(game, query)).sort(SORTERS[sort]),
    [games, genre, sort, query],
  )

  const heading = genre ? `${genre} games` : sort === 'top' ? 'Top rated games' : 'All games'
  useDocumentTitle(heading)

  return (
    <div className="wrap browse-page">
      <header className="page-head">
        <h1>{heading}</h1>
        <p>{plural(results.length, 'game')}{query.trim() ? ` matching “${query.trim()}”` : ''}{genre ? ` in ${genre}` : ''}.</p>
      </header>

      <div className="browse-controls">
        <div className="field browse-search">
          <label htmlFor="browse-search">Search</label>
          <input id="browse-search" className="input" type="search" placeholder="Title, studio or tag" value={query} onChange={event => setQuery(event.target.value)} />
        </div>
        <div className="field browse-sort">
          <label htmlFor="browse-sort">Sort by</label>
          <div className="select-wrap">
            <select id="browse-sort" className="select" value={sort} onChange={event => setSort(event.target.value)}>
              {SORTS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="chip-row" role="group" aria-label="Filter by genre">
        <button type="button" className={`chip ${genre === '' ? 'is-selected' : ''}`} aria-pressed={genre === ''} onClick={() => setGenre('')}>
          All <span>{games.length}</span>
        </button>
        {genres.map(item => (
          <button key={item.id} type="button" className={`chip ${genre === item.name ? 'is-selected' : ''}`} aria-pressed={genre === item.name} onClick={() => setGenre(genre === item.name ? '' : item.name)}>
            {item.name} <span>{item.count}</span>
          </button>
        ))}
      </div>

      {results.length > 0 ? (
        <div className="game-grid browse-grid">
          {results.map((game, index) => <GameCard key={game.id} game={game} eager={index < 6} />)}
        </div>
      ) : (
        <div className="empty-panel">
          <h2>No games found</h2>
          <p>Nothing matches these filters. Try another genre or a shorter search.</p>
          <button type="button" className="btn btn-primary" onClick={() => { setGenre(''); setQuery(''); setSort('featured') }}>Clear the filters</button>
        </div>
      )}
    </div>
  )
}
