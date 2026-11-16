import { useMemo, useState } from 'react'
import { createReview, deleteReview, updateReview } from '../api'
import { Stars } from './Score'
import Avatar, { PlanBadge } from './Avatar'
import Countdown from './Countdown'
import { average, formatDate, MAX_REVIEW_WORDS, plural, wordCount } from '../lib/format'

const SORTS = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id,
  highest: (a, b) => b.rating - a.rating || b.id - a.id,
  lowest: (a, b) => a.rating - b.rating || b.id - a.id,
}

// Accessible 1 to 5 star input (a radio group: arrow keys work too).
function StarPicker({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  const labels = ['', 'Poor', 'Below average', 'Good', 'Great', 'Masterpiece']

  function onKeyDown(event) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') { event.preventDefault(); onChange(Math.min(5, (value || 0) + 1)) }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') { event.preventDefault(); onChange(Math.max(1, (value || 1) - 1)) }
  }

  return (
    <div className="star-picker-wrap">
      <div className="star-picker" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)} onKeyDown={onKeyDown}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? 's' : ''}, ${labels[star]}`}
            tabIndex={value === star || (!value && star === 1) ? 0 : -1}
            className={star <= shown ? 'is-lit' : ''}
            disabled={disabled}
            onMouseEnter={() => setHover(star)}
            onClick={() => onChange(star)}
          >★</button>
        ))}
      </div>
      <span className="star-picker-label">{shown ? labels[shown] : 'Choose 1 to 5 stars'}</span>
    </div>
  )
}

export default function ReviewSection({ game, reviews, status, user, onRetry, onLogin, onChanged, onReleased, toast }) {
  const [sort, setSort] = useState('newest')
  const [editingId, setEditingId] = useState(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const myReview = user ? reviews.find(review => review.userId === user.id) : null
  const others = reviews.filter(review => review.id !== myReview?.id).sort(SORTS[sort])
  const words = wordCount(comment)
  const formOpen = game.released && user && status === 'ready' && (!myReview || editingId === myReview.id)

  // The live thing: what the player score becomes with this rating, before posting.
  const preview = useMemo(() => {
    if (!rating) return null
    const kept = reviews.filter(review => review.id !== editingId).map(review => review.rating)
    return average([...kept, rating])
  }, [rating, reviews, editingId])

  function startEditing(review) {
    setEditingId(review.id)
    setRating(review.rating)
    setComment(review.comment)
    setMessage('')
    document.getElementById('write-review')?.scrollIntoView({ block: 'start' })
  }

  function resetForm() {
    setEditingId(null)
    setRating(0)
    setComment('')
  }

  async function submit(event) {
    event.preventDefault()
    if (!rating) return setMessage('Choose a rating from 1 to 5 stars.')
    if (!comment.trim()) return setMessage('Write a few words about the game.')
    if (words > MAX_REVIEW_WORDS) return setMessage(`Keep your review to ${MAX_REVIEW_WORDS} words or fewer.`)

    setBusy(true)
    setMessage('')
    try {
      if (editingId) await updateReview(editingId, { rating, comment: comment.trim() })
      else await createReview({ gameId: game.id, rating, comment: comment.trim() })
      toast(editingId ? 'Your review was updated.' : 'Your review is live. Thanks for rating!')
      resetForm()
      await onChanged()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(review) {
    setBusy(true)
    try {
      await deleteReview(review.id)
      toast('Your review was deleted.')
      setConfirmDeleteId(null)
      if (editingId === review.id) resetForm()
      await onChanged()
    } catch (error) {
      toast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  function renderReview(review, mine = false) {
    return (
      <article key={review.id} className={`review-card ${mine ? 'is-mine' : ''} ${review.plan === 'gold' ? 'is-gold' : ''}`}>
        <header className="review-head">
          <Avatar name={review.username} avatar={review.avatar} plan={review.plan} size="medium" />
          <div>
            <strong className="review-author">
              {review.username}
              <PlanBadge plan={review.plan} />
              {mine && <span className="mine-tag">(you)</span>}
            </strong>
            <span className="review-date">{formatDate(review.createdAt)}</span>
          </div>
          <span className="review-stars"><Stars value={review.rating} size={18} /><span className="sr-only">{review.rating} out of 5 stars</span></span>
        </header>
        <p className="review-text">{review.comment}</p>
        {mine && (
          <div className="review-actions">
            {confirmDeleteId === review.id ? (
              <>
                <span>Delete this review for good?</span>
                <button type="button" className="btn btn-small btn-danger" disabled={busy} onClick={() => remove(review)}>Yes, delete</button>
                <button type="button" className="btn btn-small btn-ghost" onClick={() => setConfirmDeleteId(null)}>Keep it</button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-small btn-secondary" disabled={busy} onClick={() => startEditing(review)}>Edit</button>
                <button type="button" className="btn btn-small btn-ghost" disabled={busy} onClick={() => setConfirmDeleteId(review.id)}>Delete</button>
              </>
            )}
          </div>
        )}
      </article>
    )
  }

  return (
    <section className="reviews" aria-labelledby="reviews-title">
      <div className="reviews-list">
        <div className="section-head">
          <h2 id="reviews-title">Player reviews <span className="count">{reviews.length}</span></h2>
          {reviews.length > 1 && (
            <div className="select-wrap reviews-sort">
              <label className="sr-only" htmlFor="review-sort">Sort reviews</label>
              <select id="review-sort" className="select" value={sort} onChange={event => setSort(event.target.value)}>
                <option value="newest">Newest first</option>
                <option value="highest">Highest rated</option>
                <option value="lowest">Lowest rated</option>
              </select>
            </div>
          )}
        </div>

        {status === 'loading' && <p className="muted" role="status">Loading player reviews…</p>}
        {status === 'error' && (
          <div className="empty-panel" role="alert">
            <p>The reviews could not be loaded.</p>
            <button type="button" className="btn btn-secondary" onClick={onRetry}>Try again</button>
          </div>
        )}
        {status === 'ready' && reviews.length === 0 && (
          <div className="empty-panel">
            <p>{game.released
              ? `Nobody has reviewed ${game.title} yet. Your review will be the first one here.`
              : `${game.title} comes out on ${game.releaseLabel}. Player reviews open that day, so every score comes from someone who has played it.`}</p>
          </div>
        )}
        {myReview && editingId !== myReview.id && renderReview(myReview, true)}
        {others.map(review => renderReview(review))}
      </div>

      <aside className="review-form-panel" id="write-review" aria-labelledby="write-title">
        <h2 id="write-title">{editingId ? 'Edit your review' : `Rate ${game.title}`}</h2>

        {!game.released && (
          <div className="review-locked">
            <p>Reviews open on <strong>{game.releaseLabel}</strong>, when the game comes out. Nobody can rate a game before it can be played.</p>
            <Countdown date={game.releaseDate} onReached={onReleased} />
          </div>
        )}

        {game.released && !user && (
          <div className="review-guest">
            <p>Log in to give your score and write a review. It takes a minute to create an account.</p>
            <button type="button" className="btn btn-primary btn-large" onClick={onLogin}>Log in to rate</button>
          </div>
        )}

        {game.released && user && myReview && editingId !== myReview.id && (
          <div className="review-guest">
            <p>You rated this game {plural(myReview.rating, 'star')}. You can change your score or your words at any time.</p>
            <button type="button" className="btn btn-secondary btn-large" onClick={() => startEditing(myReview)}>Edit my review</button>
          </div>
        )}

        {formOpen && (
          <form className="review-form" onSubmit={submit}>
            <StarPicker value={rating} onChange={value => { setRating(value); setMessage('') }} disabled={busy} />

            <p className="score-preview" aria-live="polite">
              {preview == null
                ? `Your score is averaged with every other player’s score.`
                : <>With your score, {game.title} would be on <strong>{preview.toFixed(1)}</strong>{game.rating != null ? <> (now {game.rating.toFixed(1)})</> : <> (its first score)</>}.</>}
            </p>

            <div className="field">
              <label htmlFor="review-comment">Your review</label>
              <textarea id="review-comment" className="textarea" value={comment} disabled={busy}
                placeholder="What did you love? What would you warn other players about?"
                onChange={event => { setComment(event.target.value); setMessage('') }} />
              <span className={`field-hint ${words > MAX_REVIEW_WORDS ? 'is-over' : ''}`}>{words} / {MAX_REVIEW_WORDS} words</span>
            </div>

            {message && <p className="form-message is-error" role="alert">{message}</p>}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary btn-large" disabled={busy || !rating || !comment.trim() || words > MAX_REVIEW_WORDS}>
                {busy ? 'Saving…' : editingId ? 'Save changes' : 'Publish review'}
              </button>
              {editingId && <button type="button" className="btn btn-ghost btn-large" onClick={resetForm}>Cancel</button>}
            </div>
          </form>
        )}
      </aside>
    </section>
  )
}
