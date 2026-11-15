// True when a game matches the search text (title, genre, studio or tag).
export function matchesSearch(game, query) {
  const text = query.trim().toLowerCase()
  if (!text) return true
  return [game.title, game.genre, game.developer, game.publisher, ...game.tags]
    .some(value => value.toLowerCase().includes(text))
}
