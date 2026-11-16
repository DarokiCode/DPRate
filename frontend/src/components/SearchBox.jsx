import { useId, useMemo, useState } from 'react'
import Cover from './Cover'
import { ScoreChip } from './Score'
import { matchesSearch } from '../lib/search'

// Search with instant suggestions. Enter opens the full results on the Browse page.
export default function SearchBox({ games, id: givenId, onDone }) {
  const autoId = useId()
  const id = givenId || `search-${autoId}`
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const results = useMemo(
    () => (query.trim() ? games.filter(game => matchesSearch(game, query)).slice(0, 6) : []),
    [games, query],
  )

  function finish(hash) {
    window.location.hash = hash
    setOpen(false)
    setQuery('')
    setActive(-1)
    onDone?.()
  }

  function onSubmit(event) {
    event.preventDefault()
    if (active >= 0 && results[active]) finish(`game/${results[active].id}`)
    else if (query.trim()) finish(`browse?q=${encodeURIComponent(query.trim())}`)
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActive(index => Math.min(index + 1, results.length - 1)) }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive(index => Math.max(index - 1, -1)) }
    if (event.key === 'Escape') { setOpen(false); setActive(-1) }
  }

  const showList = open && query.trim() !== ''

  return (
    <form className="search" role="search" onSubmit={onSubmit} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
      <label className="sr-only" htmlFor={id}>Search games</label>
      <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>
      <input
        id={id}
        type="search"
        className="search-input"
        placeholder="Search games, genres, studios"
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={`${id}-list`}
        aria-activedescendant={active >= 0 ? `${id}-option-${active}` : undefined}
        value={query}
        onChange={event => { setQuery(event.target.value); setOpen(true); setActive(-1) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <div className="search-results" id={`${id}-list`} role="listbox" aria-label="Search suggestions">
          {results.length === 0 && <p className="search-empty">No games match “{query.trim()}”.</p>}
          {results.map((game, index) => (
            <a
              key={game.id}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={index === active}
              className={`search-result ${index === active ? 'is-active' : ''}`}
              href={`#game/${game.id}`}
              onClick={() => finish(`game/${game.id}`)}
            >
              <Cover src={game.image} title={game.title} className="search-thumb" />
              <span className="search-text"><strong>{game.title}</strong><span>{game.genre} · {game.release}</span></span>
              <ScoreChip rating={game.rating} size="small" upcoming={!game.released} />
            </a>
          ))}
          {results.length > 0 && (
            <a className="search-all" href={`#browse?q=${encodeURIComponent(query.trim())}`} onClick={() => finish(`browse?q=${encodeURIComponent(query.trim())}`)}>
              See all results for “{query.trim()}”
            </a>
          )}
        </div>
      )}
    </form>
  )
}
