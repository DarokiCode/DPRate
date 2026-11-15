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
    const error = new Error('Invalid API response. Check that PHP is running on port 8000.')
    error.status = response.status // Lets favourites preview detect ONLY a missing endpoint (404).
    throw error
  }

  if (!response.ok || result?.success !== true) {
    const error = new Error(result?.message || `API request failed (${response.status}).`)
    error.status = response.status
    throw error
  }

  return result
}

// PHP/MySQL can send numbers as strings. Convert them before displaying a game.
function formatGame(game) {
  if (!game || !Number.isInteger(Number(game.id)) || !game.title) {
    throw new Error('Invalid game data. Ask Pedro to check the API response.')
  }

  const score = game.rating == null || game.rating === '' ? null : Number(game.rating)
  return {
    id: Number(game.id),
    title: String(game.title),
    genre: String(game.genre || 'Other'),
    rating: score !== null && Number.isFinite(score) ? score : null,
    reviewCount: Number.isInteger(Number(game.review_count)) && game.review_count != null ? Number(game.review_count) : null,
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

// A3 review API contract — Pedro implements backend/public/api/reviews.php.
// GET returns { success: true, reviews: [{ id, game_id, user_id, username, rating, comment, created_at }] }.
function formatReview(item) {
  const id = Number(item?.id)
  const userId = Number(item?.user_id)
  const rating = Number(item?.rating)
  if (!Number.isInteger(id) || !Number.isInteger(userId) ||
      !Number.isInteger(rating) || rating < 1 || rating > 5 ||
      typeof item.username !== 'string' || typeof item.comment !== 'string') {
    throw new Error('Invalid review data from PHP. Check the agreed API contract.')
  }
  return {
    id,
    game_id: Number(item.game_id),
    user_id: userId,
    username: item.username,
    rating,
    comment: item.comment,
    created_at: typeof item.created_at === 'string' ? item.created_at : '',
  }
}

export async function fetchReviews(gameId) {
  const response = await request(`reviews.php?game_id=${encodeURIComponent(gameId)}`)
  if (!Array.isArray(response.reviews)) {
    throw new Error('Expected an array called "reviews" from the PHP API.')
  }
  return { reviews: response.reviews.map(formatReview) }
}

export function createReview(review) {
  return request('reviews.php', { method: 'POST', body: JSON.stringify(review) })
}

export function updateReview(id, changes) {
  return request('reviews.php', { method: 'PUT', body: JSON.stringify({ id, ...changes }) })
}

export function deleteReview(id) {
  return request(`reviews.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// A3 favourite API contract: backend/public/api/favourites.php (implemented by Pedro).
// GET -> { success: true, favourites: [<full game objects like games.php>] }.
// POST { game_id: 2 }; DELETE ?game_id=2. All operations use PHP session auth.
export async function fetchFavourites() {
  const response = await request('favourites.php')
  if (!Array.isArray(response.favourites)) {
    throw new Error('Expected an array called "favourites" from the PHP API.')
  }
  return { favourites: response.favourites.map(formatGame) }
}

export function addFavourite(gameId) {
  return request('favourites.php', {
    method: 'POST', body: JSON.stringify({ game_id: gameId }),
  })
}

export function removeFavourite(gameId) {
  return request(`favourites.php?game_id=${encodeURIComponent(gameId)}`, { method: 'DELETE' })
}


// A3 Account Page contract — Pedro implements backend/public/api/account.php.
// GET requires the PHP session and returns current user plus THEIR reviews.
function formatAccountReview(item) {
  const id = Number(item?.id)
  const gameId = Number(item?.game_id)
  const rating = Number(item?.rating)
  if (!Number.isInteger(id) || !Number.isInteger(gameId) ||
      !Number.isInteger(rating) || rating < 1 || rating > 5 ||
      typeof item.game_title !== 'string' || typeof item.comment !== 'string') {
    throw new Error('Invalid account review from PHP. Check the API contract.')
  }
  return {
    id, game_id: gameId, game_title: item.game_title, rating,
    comment: item.comment,
    created_at: typeof item.created_at === 'string' ? item.created_at : '',
  }
}

function formatAccountUser(item) {
  if (!Number.isInteger(Number(item?.id)) ||
      typeof item?.username !== 'string' || typeof item?.email !== 'string') {
    throw new Error('Invalid account user from PHP. Check the API contract.')
  }
  return { id: Number(item.id), username: item.username, email: item.email }
}

export async function fetchAccount() {
  const response = await request('account.php')
  if (!Array.isArray(response.reviews)) {
    throw new Error('Expected an array called "reviews" from the account API.')
  }
  return {
    user: formatAccountUser(response.user),
    reviews: response.reviews.map(formatAccountReview),
  }
}

export async function updateAccountDetails({ username, email }) {
  const response = await request('account.php', {
    method: 'PUT', body: JSON.stringify({ username, email }),
  })
  return { user: formatAccountUser(response.user) }
}

export function changeAccountPassword({ current_password, new_password }) {
  return request('account.php', {
    method: 'PUT', body: JSON.stringify({ current_password, new_password }),
  })
}
