import { useEffect, useState } from 'react'
import { changeAccountPassword, deleteReview, fetchAccount, updateAccountDetails, updateReview } from '../api'
import { Avatar } from '../components/Navbar'
import Cover from '../components/Cover'
import { Stars } from '../components/Score'
import { average, formatDate, MAX_REVIEW_WORDS, plural, wordCount } from '../lib/format'
import { useDocumentTitle } from '../lib/hooks'

export default function AccountPage({ user, sessionReady, games, favouriteCount, onUserChanged, onGamesChanged, toast }) {
  useDocumentTitle('My account')
  const [status, setStatus] = useState('loading')
  const [reviews, setReviews] = useState([])
  const [profile, setProfile] = useState({ username: '', email: '' })
  const [profileState, setProfileState] = useState({ busy: false, message: '', type: '' })
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [passwordState, setPasswordState] = useState({ busy: false, message: '', type: '' })
  const [editing, setEditing] = useState(null) // { id, rating, comment }
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [reviewBusy, setReviewBusy] = useState(false)

  async function load() {
    try {
      const account = await fetchAccount()
      setProfile({ username: account.user.username, email: account.user.email })
      setReviews(account.reviews)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }

  useEffect(() => {
    if (user) load()
    // Reload only when another account logs in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  if (!user) {
    return (
      <div className="wrap page-message">
        <h1>My account</h1>
        <p>{sessionReady ? 'Log in to manage your details and your reviews.' : 'Checking your session…'}</p>
        {sessionReady && <a className="btn btn-primary btn-large" href="#login">Log in</a>}
      </div>
    )
  }

  async function saveProfile(event) {
    event.preventDefault()
    setProfileState({ busy: true, message: '', type: '' })
    try {
      const updated = await updateAccountDetails({ username: profile.username.trim(), email: profile.email.trim() })
      onUserChanged(updated)
      setProfileState({ busy: false, message: 'Your details were saved.', type: 'success' })
      await load()
    } catch (error) {
      setProfileState({ busy: false, message: error.message, type: 'error' })
    }
  }

  async function savePassword(event) {
    event.preventDefault()
    if (passwords.next !== passwords.confirm) {
      return setPasswordState({ busy: false, message: 'The new passwords do not match.', type: 'error' })
    }
    setPasswordState({ busy: true, message: '', type: '' })
    try {
      await changeAccountPassword({ currentPassword: passwords.current, newPassword: passwords.next })
      setPasswords({ current: '', next: '', confirm: '' })
      setPasswordState({ busy: false, message: 'Password changed. Use the new one next time you log in.', type: 'success' })
    } catch (error) {
      setPasswordState({ busy: false, message: error.message, type: 'error' })
    }
  }

  async function saveReview(event) {
    event.preventDefault()
    setReviewBusy(true)
    try {
      await updateReview(editing.id, { rating: editing.rating, comment: editing.comment.trim() })
      toast('Your review was updated.')
      setEditing(null)
      await load()
      await onGamesChanged()
    } catch (error) {
      toast(error.message, 'error')
    } finally {
      setReviewBusy(false)
    }
  }

  async function removeReview(review) {
    setReviewBusy(true)
    try {
      await deleteReview(review.id)
      toast(`Your review of ${review.gameTitle} was deleted.`)
      setConfirmDeleteId(null)
      await load()
      await onGamesChanged()
    } catch (error) {
      toast(error.message, 'error')
    } finally {
      setReviewBusy(false)
    }
  }

  const coverOf = gameId => games.find(game => game.id === gameId)?.image
  const givenAverage = average(reviews.map(review => review.rating))
  const editWords = editing ? wordCount(editing.comment) : 0

  return (
    <div className="wrap account-page">
      <header className="account-head">
        <Avatar name={user.username} size="large" />
        <div>
          <h1>{user.username}</h1>
          <p>{user.email}</p>
        </div>
        <dl className="account-stats">
          <div><dt>Reviews</dt><dd>{reviews.length}</dd></div>
          <div><dt>Favourites</dt><dd>{favouriteCount}</dd></div>
          <div><dt>Average score given</dt><dd>{givenAverage == null ? 'None yet' : givenAverage.toFixed(1)}</dd></div>
        </dl>
      </header>

      {status === 'error' && (
        <div className="empty-panel" role="alert">
          <p>Your account details could not be loaded.</p>
          <button type="button" className="btn btn-secondary" onClick={load}>Try again</button>
        </div>
      )}

      <div className="account-grid">
        <section className="account-reviews" aria-labelledby="my-reviews-title">
          <div className="section-head">
            <h2 id="my-reviews-title">My reviews <span className="count">{reviews.length}</span></h2>
          </div>
          {status === 'loading' && <p className="muted" role="status">Loading your reviews…</p>}
          {status === 'ready' && reviews.length === 0 && (
            <div className="empty-panel">
              <p>You have not reviewed a game yet. Your reviews will be listed here, ready to edit.</p>
              <a className="btn btn-primary" href="#browse">Find a game to rate</a>
            </div>
          )}
          {reviews.map(review => (
            <article key={review.id} className="account-review">
              <a className="account-review-cover" href={`#game/${review.gameId}`} tabIndex={-1} aria-hidden="true">
                <Cover src={coverOf(review.gameId)} title={review.gameTitle} />
              </a>
              <div className="account-review-body">
                <header>
                  <a className="account-review-game" href={`#game/${review.gameId}`}>{review.gameTitle}</a>
                  <span className="review-date">{formatDate(review.createdAt)}</span>
                </header>

                {editing?.id === review.id ? (
                  <form className="account-review-edit" onSubmit={saveReview}>
                    <div className="star-picker" role="radiogroup" aria-label="Your rating">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" role="radio" aria-checked={editing.rating === star}
                          aria-label={`${star} star${star > 1 ? 's' : ''}`} className={star <= editing.rating ? 'is-lit' : ''}
                          onClick={() => setEditing(current => ({ ...current, rating: star }))}>★</button>
                      ))}
                    </div>
                    <label className="sr-only" htmlFor={`edit-${review.id}`}>Your review</label>
                    <textarea id={`edit-${review.id}`} className="textarea" value={editing.comment}
                      onChange={event => setEditing(current => ({ ...current, comment: event.target.value }))} />
                    <span className="field-hint">{editWords} / {MAX_REVIEW_WORDS} words</span>
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary" disabled={reviewBusy || !editing.comment.trim() || editWords > MAX_REVIEW_WORDS}>Save review</button>
                      <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <Stars value={review.rating} size={18} /><span className="sr-only">{review.rating} out of 5 stars</span>
                    <p className="review-text">{review.comment}</p>
                    <div className="review-actions">
                      {confirmDeleteId === review.id ? (
                        <>
                          <span>Delete this review for good?</span>
                          <button type="button" className="btn btn-small btn-danger" disabled={reviewBusy} onClick={() => removeReview(review)}>Yes, delete</button>
                          <button type="button" className="btn btn-small btn-ghost" onClick={() => setConfirmDeleteId(null)}>Keep it</button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="btn btn-small btn-secondary" onClick={() => { setEditing({ id: review.id, rating: review.rating, comment: review.comment }); setConfirmDeleteId(null) }}>Edit</button>
                          <button type="button" className="btn btn-small btn-ghost" onClick={() => setConfirmDeleteId(review.id)}>Delete</button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </article>
          ))}
        </section>

        <div className="account-forms">
          <section className="panel" aria-labelledby="details-title">
            <h2 id="details-title">Profile details</h2>
            <form className="stack" onSubmit={saveProfile}>
              <div className="field">
                <label htmlFor="account-username">Username</label>
                <input id="account-username" className="input" required minLength={3} maxLength={30} pattern="[A-Za-z0-9_]{3,30}" autoComplete="username"
                  value={profile.username} disabled={status !== 'ready'} onChange={event => setProfile(current => ({ ...current, username: event.target.value }))} />
                <span className="field-hint">Shown on all your reviews.</span>
              </div>
              <div className="field">
                <label htmlFor="account-email">Email</label>
                <input id="account-email" className="input" type="email" required autoComplete="email"
                  value={profile.email} disabled={status !== 'ready'} onChange={event => setProfile(current => ({ ...current, email: event.target.value }))} />
              </div>
              {profileState.message && <p className={`form-message is-${profileState.type}`} role="status">{profileState.message}</p>}
              <button type="submit" className="btn btn-primary" disabled={profileState.busy || status !== 'ready'}>{profileState.busy ? 'Saving…' : 'Save details'}</button>
            </form>
          </section>

          <section className="panel" aria-labelledby="password-title">
            <h2 id="password-title">Change password</h2>
            <form className="stack" onSubmit={savePassword}>
              <div className="field">
                <label htmlFor="current-password">Current password</label>
                <input id="current-password" className="input" type="password" required autoComplete="current-password"
                  value={passwords.current} onChange={event => setPasswords(current => ({ ...current, current: event.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="new-password">New password</label>
                <input id="new-password" className="input" type="password" required minLength={8} autoComplete="new-password"
                  value={passwords.next} onChange={event => setPasswords(current => ({ ...current, next: event.target.value }))} />
                <span className="field-hint">At least 8 characters.</span>
              </div>
              <div className="field">
                <label htmlFor="confirm-password">Confirm new password</label>
                <input id="confirm-password" className="input" type="password" required minLength={8} autoComplete="new-password"
                  value={passwords.confirm} onChange={event => setPasswords(current => ({ ...current, confirm: event.target.value }))} />
              </div>
              {passwordState.message && <p className={`form-message is-${passwordState.type}`} role="status">{passwordState.message}</p>}
              <button type="submit" className="btn btn-secondary" disabled={passwordState.busy}>{passwordState.busy ? 'Updating…' : 'Update password'}</button>
            </form>
          </section>
          <p className="muted account-note">{plural(reviews.length, 'review')} written. Your password is stored only as a secure hash.</p>
        </div>
      </div>
    </div>
  )
}
