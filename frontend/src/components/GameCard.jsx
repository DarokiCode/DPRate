import Cover from './Cover'
import { ScoreChip } from './Score'

// One game in a grid or a shelf. A real link, so it also opens in a new tab.
export default function GameCard({ game, eager = false }) {
  return (
    <a className="game-card" href={`#game/${game.id}`} aria-label={`${game.title}, ${game.genre}, ${game.rating == null ? 'not rated yet' : `player score ${game.rating.toFixed(1)}`}`}>
      <div className="game-card-art">
        <Cover src={game.image} title={game.title} eager={eager} />
        <ScoreChip rating={game.rating} />
      </div>
      <div className="game-card-body">
        <h3>{game.title}</h3>
        <p>{game.genre} · {game.release}</p>
      </div>
    </a>
  )
}
