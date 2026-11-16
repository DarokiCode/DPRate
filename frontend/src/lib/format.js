// Small display helpers shared by the pages.

// Colour band of a player score (used by the score chips).
export function scoreBand(rating) {
  if (rating == null) return 'none'
  if (rating >= 4) return 'high'
  if (rating >= 3) return 'mid'
  return 'low'
}

export const formatScore = rating => (rating == null ? 'New' : rating.toFixed(1))

export const plural = (count, word, many = `${word}s`) => `${count} ${count === 1 ? word : many}`

// "2026-11-15 10:30:00" -> "15 Nov 2026" (Australian style).
export function formatDate(value) {
  if (!value) return ''
  const date = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

// Average like MySQL ROUND(AVG(rating), 1), used for the live score preview.
export function average(ratings) {
  if (!ratings.length) return null
  const sum = ratings.reduce((total, value) => total + value, 0)
  return Math.round((sum / ratings.length) * 10) / 10
}

const AVATAR_COLOURS = ['#7c4dff', '#2f9e74', '#c2410c', '#0e7490', '#b4237a', '#a16207']

// The same username always gets the same avatar colour.
export function avatarColour(name = '') {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return AVATAR_COLOURS[hash % AVATAR_COLOURS.length]
}

export const wordCount = text => (text.trim() ? text.trim().split(/\s+/).length : 0)

export const MAX_REVIEW_WORDS = 500

// "2026-11-19" -> midnight local time of the player's device on that day
// (Rockstar launches GTA VI at midnight local time in every region).
export function releaseMoment(date) {
  const [year, month, day] = String(date).split('-').map(Number)
  return year ? new Date(year, month - 1, day) : null
}

// "2026-11-19" -> "19 Nov" for small labels on cards.
export function shortDate(date) {
  const moment = releaseMoment(date)
  return moment ? new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short' }).format(moment) : ''
}

// Price in Australian dollars: 2.99 -> "A$2.99", 0 -> "Free".
export const formatPrice = price => (price > 0 ? `A$${price.toFixed(2)}` : 'Free')
