// Every call to the PHP API lives here, instead of being spread across the pages.
// In development Vite forwards /api to http://127.0.0.1:8000; on the live site
// React and PHP share the same address, so the session cookie just works.
// Passwords are never kept in the browser.

// CSRF token of this PHP session. PHP sends it in session.php and again whenever
// it changes it (login, logout, password change). Every request that changes data
// sends it back in the X-CSRF-Token header.
let csrfToken = ''

async function send(path, options) {
  const method = options.method || 'GET'
  const headers = { Accept: 'application/json' }
  if (options.body) headers['Content-Type'] = 'application/json'
  if (method !== 'GET' && csrfToken) headers['X-CSRF-Token'] = csrfToken

  let response
  try {
    response = await fetch(`/api/${path}`, { ...options, method, headers, credentials: 'same-origin' })
  } catch {
    throw new Error('Could not reach the DPRate server. Check your connection and try again.')
  }

  let result = null
  try {
    result = await response.json()
  } catch {
    // Not JSON: the server is down or misconfigured.
  }

  if (typeof result?.csrf_token === 'string') csrfToken = result.csrf_token
  return { response, result }
}

async function request(path, options = {}) {
  let { response, result } = await send(path, options)

  // The token can expire with the session: get a fresh one and try once more.
  if (response.status === 403 && result?.csrf === true) {
    await send('session.php', {})
    ;({ response, result } = await send(path, options))
  }

  if (!response.ok || result?.success !== true) {
    const error = new Error(result?.message || 'The server could not complete this request. Please try again.')
    error.status = response.status
    throw error
  }

  return result
}

const json = (method, body) => ({ method, body: JSON.stringify(body) })

// PHP/MySQL can send numbers as strings. Convert them before displaying a game.
function formatGame(game) {
  if (!game || !Number.isInteger(Number(game.id)) || !game.title) {
    throw new Error('The server sent a game in an unexpected format.')
  }

  const score = game.rating == null || game.rating === '' ? null : Number(game.rating)
  return {
    id: Number(game.id),
    title: String(game.title),
    genre: String(game.genre || 'Other'),
    rating: score !== null && Number.isFinite(score) ? score : null,
    reviewCount: Number(game.review_count) || 0,
    image: String(game.image || ''),
    banner: game.banner ? String(game.banner) : null,
    logo: game.logo ? String(game.logo) : null,
    tags: Array.isArray(game.tags) ? game.tags : [],
    description: String(game.description || ''),
    developer: String(game.developer || 'Not available'),
    publisher: String(game.publisher || 'Not available'),
    release: String(game.release || ''),                       // year, for cards
    releaseLabel: String(game.release_label || game.release || 'Not available'), // full date for the game page
    releaseDate: typeof game.release_date === 'string' ? game.release_date : '',
    released: game.released !== false,                          // false = coming soon, reviews closed
    platforms: String(game.platforms || 'Not available'),
    sponsored: game.sponsored === true,                         // paid home page spot (demo)
    stores: Array.isArray(game.stores)
      ? game.stores.filter(store => /^https:\/\//.test(store?.url)).map(store => ({ name: String(store.store), url: store.url }))
      : [],
  }
}

function formatReview(item) {
  const rating = Number(item?.rating)
  if (!Number.isInteger(Number(item?.id)) || !Number.isInteger(rating) || rating < 1 || rating > 5 ||
      typeof item.comment !== 'string') {
    throw new Error('The server sent a review in an unexpected format.')
  }
  return {
    id: Number(item.id),
    gameId: Number(item.game_id),
    userId: Number(item.user_id),
    username: String(item.username || ''),
    plan: ['silver', 'gold'].includes(item.plan) ? item.plan : 'standard',
    avatar: typeof item.avatar === 'string' ? item.avatar : null,
    rating,
    comment: item.comment,
    createdAt: typeof item.created_at === 'string' ? item.created_at : '',
    gameTitle: typeof item.game_title === 'string' ? item.game_title : '',
    gameImage: typeof item.game_image === 'string' ? item.game_image : '',
  }
}

function formatUser(item) {
  if (!item) return null
  return {
    id: Number(item.id),
    username: String(item.username),
    email: String(item.email),
    plan: ['silver', 'gold'].includes(item.plan) ? item.plan : 'standard',
    avatar: typeof item.avatar === 'string' ? item.avatar : null,
  }
}

// ---------- Games and genres ----------

export async function fetchGames() {
  const { games } = await request('games.php')
  return games.map(formatGame)
}

export async function fetchGame(id) {
  const { game } = await request(`game.php?id=${encodeURIComponent(id)}`)
  return formatGame(game)
}

export async function fetchGenres() {
  const { genres } = await request('genres.php')
  return genres.map(genre => ({ id: Number(genre.id), name: String(genre.name), count: Number(genre.game_count) || 0 }))
}

// ---------- Session and accounts ----------

export async function getSession() {
  const { user } = await request('session.php')
  return formatUser(user)
}

export async function registerUser(user) {
  return formatUser((await request('register.php', json('POST', user))).user)
}

export async function loginUser(credentials) {
  return formatUser((await request('login.php', json('POST', credentials))).user)
}

export function logoutUser() {
  return request('logout.php', json('POST', {}))
}

export async function fetchAccount() {
  const { user, reviews } = await request('account.php')
  return { user: formatUser(user), reviews: reviews.map(formatReview) }
}

export async function updateAccountDetails({ username, email }) {
  return formatUser((await request('account.php', json('PUT', { username, email }))).user)
}

// Plans: demo of the subscription model, no payment is taken.
export async function changePlan(plan) {
  return formatUser((await request('account.php', json('PUT', { plan }))).user)
}

// null goes back to the coloured initials.
export async function changeAvatar(avatar) {
  return formatUser((await request('account.php', json('PUT', { avatar }))).user)
}

export async function fetchPlans() {
  const { plans } = await request('plans.php')
  return plans.map(plan => ({
    id: String(plan.id),
    name: String(plan.name),
    price: Number(plan.price) || 0,
    ads: plan.ads === true,
    perks: Array.isArray(plan.perks) ? plan.perks.map(String) : [],
    avatars: Array.isArray(plan.avatars) ? plan.avatars.map(String) : [],
  }))
}

export function changeAccountPassword({ currentPassword, newPassword }) {
  return request('account.php', json('PUT', { current_password: currentPassword, new_password: newPassword }))
}

// ---------- Reviews ----------

export async function fetchReviews(gameId) {
  const { reviews } = await request(`reviews.php?game_id=${encodeURIComponent(gameId)}`)
  return reviews.map(formatReview)
}

export async function fetchRecentReviews(limit = 6) {
  const { reviews } = await request(`reviews.php?recent=${limit}`)
  return reviews.map(formatReview)
}

export function createReview({ gameId, rating, comment }) {
  return request('reviews.php', json('POST', { game_id: gameId, rating, comment }))
}

export function updateReview(id, { rating, comment }) {
  return request('reviews.php', json('PUT', { id, rating, comment }))
}

export function deleteReview(id) {
  return request(`reviews.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// ---------- Favourites ----------

export async function fetchFavourites() {
  const { favourites } = await request('favourites.php')
  return favourites.map(formatGame)
}

export function addFavourite(gameId) {
  return request('favourites.php', json('POST', { game_id: gameId }))
}

export function removeFavourite(gameId) {
  return request(`favourites.php?game_id=${encodeURIComponent(gameId)}`, { method: 'DELETE' })
}
