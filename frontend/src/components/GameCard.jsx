import Cover from './Cover'
import { ScoreChip } from './Score'
import { shortDate } from '../lib/format'

// One game in a grid or a shelf. A real link, so it also opens in a new tab.
export default function GameCard({ game, eager = false }) {
  const meta = `${game.genre} · ${game.released ? game.release : `Out ${shortDate(game.releaseDate)} ${game.release}`}`
  return (
    <a className="game-card" href={`#game/${game.id}`}>
      <div className="game-card-art">
        <Cover src={game.image} title={game.title} eager={eager} decorative />
        <ScoreChip rating={game.rating} upcoming={!game.released} />
      </div>
      <div className="game-card-body">
        <h3>{game.title}</h3>
        <p>{meta}</p>
      </div>
    </a>
  )
}
