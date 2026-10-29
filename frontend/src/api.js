// Calls to Pedro's PHP API stay here, instead of being spread across the React pages.
// During development, Vite forwards /api to http://127.0.0.1:8000.
// The PHP session uses a cookie. Never keep passwords in localStorage.
async function request(path, options = {}) {
  let response

  try {
    response = await fetch(`/api/${path}`, {
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...options,
    })
  } catch {
    throw new Error('PHP backend not connected yet.')
  }

  let result
  try {
    result = await response.json()
  } catch {
    throw new Error('Invalid API response. Check that PHP is running on port 8000.')
  }

  if (!response.ok || result?.success !== true) {
    throw new Error(result?.message || `API request failed (${response.status}).`)
  }

  return result
}

// PHP/MySQL can send numbers as strings. Convert them before displaying a game.
function formatGame(game) {
  if (!game || !Number.isInteger(Number(game.id)) || !game.title) {
    throw new Error('Invalid game data. Ask Pedro to check the API response.')
  }

  const score = Number(game.rating)
  return {
    id: Number(game.id),
    title: String(game.title),
    genre: String(game.genre || 'Other'),
    rating: Number.isFinite(score) ? score : 0,
    image: String(game.image || ''),
    tags: Array.isArray(game.tags) ? game.tags : [],
    description: String(game.description || 'Description not available yet.'),
    developer: String(game.developer || 'Not available'),
    publisher: String(game.publisher || 'Not available'),
    release: String(game.release || 'Not available'),
    platforms: String(game.platforms || 'Not available'),
  }
}

export async function fetchGames() {
  const response = await request('games.php')
  if (!Array.isArray(response.games)) {
    throw new Error('Expected an array called "games" from the API.')
  }
  return { games: response.games.map(formatGame) }
}

export async function fetchGame(id) {
  const response = await request(`game.php?id=${encodeURIComponent(id)}`)
  return { game: formatGame(response.game) }
}

export function getSession() {
  return request('session.php')
}

export function registerUser(user) {
  return request('register.php', { method: 'POST', body: JSON.stringify(user) })
}

export function loginUser(credentials) {
  return request('login.php', { method: 'POST', body: JSON.stringify(credentials) })
}

export function logoutUser() {
  return request('logout.php', { method: 'POST', body: JSON.stringify({}) })
}
