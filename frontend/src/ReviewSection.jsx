import { useEffect, useState } from 'react'
import { createReview, deleteReview, fetchReviews, updateReview } from './api'

// A3: this component is the React side of the PHP review API.
// No fabricated reviews or browser-only persistence: the database is the source of truth.
const MAX_WORDS = 500

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

export default function ReviewSection({ gameId, activeUser, onLogin, onReviewsChanged, onRatingLoaded }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let current = true
    setLoading(true)
    setError('')
    setMessage('')
    setReviews([])
    setRating(0)
    setComment('')
    setEditingReviewId(null)

    fetchReviews(gameId)
      .then(({ reviews: items }) => {
        if (!current) return
        setReviews(items)
        onRatingLoaded(gameId, items)
      })
      .catch(err => {
        if (!current) return
        setError(err.message)
      })
      .finally(() => { if (current) setLoading(false) })

    return () => { current = false }
    // onRatingLoaded is intentionally not a dependency: only a game change/retry loads reviews.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, reloadCount])

  const myReview = activeUser
    ? reviews.find(item => item.user_id === Number(activeUser.id))
    : null

  function startEditing(review) {
    setEditingReviewId(review.id)
    setRating(review.rating)
    setComment(review.comment)
    setMessage('')
  }

  function cancelEditing() {
    setEditingReviewId(null)
    setRating(0)
    setComment('')
    setMessage('')
  }

  async function reloadAfterChange(successMessage) {
    const { reviews: items } = await fetchReviews(gameId)
    setReviews(items)
    onRatingLoaded(gameId, items)
    setEditingReviewId(null)
    setRating(0)
    setComment('')
    setMessage(successMessage)
    // Refresh the homepage and game details from Pedro's API as well.
    await onReviewsChanged(gameId)
  }

  async function submitReview(event) {
    event.preventDefault()
    if (!activeUser) {
      onLogin()
      return
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setMessage('Please choose a rating from 1 to 5 stars.')
      return
    }
    if (!comment.trim()) {
      setMessage('Please write a review before submitting.')
      return
    }
    if (wordCount(comment) > MAX_WORDS) {
      setMessage(`Your review must be ${MAX_WORDS} words or fewer.`)
      return
    }
    setBusy(true)
    setMessage('')
    try {
      if (editingReviewId !== null) {
        await updateReview(editingReviewId, { rating, comment: comment.trim() })
        await reloadAfterChange('Your review has been updated.')
      } else {
        await createReview({ game_id: gameId, rating, comment: comment.trim() })
        await reloadAfterChange('Your review has been published.')
      }
    } catch (err) {
      setMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function removeReview(review) {
    if (!window.confirm('Delete your review permanently?')) return
    setBusy(true)
    setMessage('')
    try {
      await deleteReview(review.id)
      await reloadAfterChange('Your review has been deleted.')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  const words = wordCount(comment)
  const allowForm = activeUser && !loading && !error && (!myReview || editingReviewId === myReview.id)

  return (
    <div className="reviews-layout">
      <section className="reviews-area" aria-label="Player reviews">
        <h2>Player Reviews</h2>
        {loading && <p className="sample-label" role="status">Loading player reviews...</p>}
        {!loading && error && (
          <div className="reviews-error" role="alert">
            <p>Could not load reviews: {error}</p>
            <button type="button" onClick={() => setReloadCount(count => count + 1)}>Try again</button>
          </div>
        )}
        {!loading && !error && reviews.length === 0 && (
          <p className="sample-label">No reviews yet. Be the first to rate this game!</p>
        )}
        {!loading && !error && reviews.map(review => (
          <article key={review.id} className="review-card">
            <div className="review-avatar" aria-hidden="true">{(review.username || '?').charAt(0).toUpperCase()}</div>
            <div className="review-content">
              <strong>{review.username}</strong>
              <div className="review-score" aria-label={`${review.rating} out of 5 stars`}>
                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} ({review.rating}/5)
              </div>
              <p>{review.comment}</p>
              {review.created_at && <small className="review-date">{review.created_at.slice(0, 10)}</small>}
              {activeUser && review.user_id === Number(activeUser.id) && (
                <div className="review-actions">
                  <button type="button" disabled={busy} onClick={() => startEditing(review)}>Edit</button>
                  <button type="button" disabled={busy} onClick={() => removeReview(review)}>Delete</button>
                </div>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="review-form-area" aria-label="Write a review">
        <h2>Write a Review</h2>
        <div className="review-form-card">
          {!activeUser ? (
            <div className="review-sign-in">
              <p>Log in to share your rating and review.</p>
              <button type="button" onClick={onLogin}>Log In</button>
            </div>
          ) : myReview && editingReviewId === null ? (
            <div className="review-sign-in">
              <p>You have already reviewed this game. You can edit or delete your review on the left.</p>
              <button type="button" onClick={() => startEditing(myReview)}>Edit My Review</button>
            </div>
          ) : (
            <form onSubmit={submitReview}>
              <h3>Your Rating:</h3>
              <div className="review-star-picker" role="group" aria-label="Choose a rating from 1 to 5 stars" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map(value => (
                  <button
                    key={value}
                    type="button"
                    className={`review-star-button ${value <= (hoverRating || rating) ? 'is-selected' : ''}`}
                    aria-label={`${value} star${value === 1 ? '' : 's'}`}
                    aria-pressed={rating === value}
                    disabled={!allowForm || busy}
                    onMouseEnter={() => setHoverRating(value)}
                    onFocus={() => setHoverRating(value)}
                    onBlur={() => setHoverRating(0)}
                    onClick={() => setRating(value)}
                  >★</button>
                ))}
              </div>
              <h3>Your Review:</h3>
              <textarea
                value={comment}
                onChange={event => setComment(event.target.value)}
                placeholder="Share your thoughts about this game..."
                aria-label="Your review"
                disabled={!allowForm || busy}
                required
              />
              <small className="review-word-count">{words}/{MAX_WORDS} words</small>
              <div className="review-form-actions">
                {editingReviewId !== null && <button type="button" disabled={busy} onClick={cancelEditing}>Cancel</button>}
                <button type="submit" disabled={!allowForm || busy || !rating || !comment.trim() || words > MAX_WORDS}>
                  {busy ? 'Saving...' : editingReviewId !== null ? 'Save Changes' : 'Submit Review'}
                </button>
              </div>
            </form>
          )}
          {message && <p className="review-feedback" role="status">{message}</p>}
          {error && <small className="review-service-note">Review submissions require Pedro's /api/reviews.php endpoint.</small>}
        </div>
      </section>
    </div>
  )
}
