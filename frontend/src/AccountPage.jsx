import { useEffect, useState } from 'react'
import { fetchAccount, updateAccountDetails, changeAccountPassword, updateReview, deleteReview } from './api'
import './AccountPage.css'

const MAX_REVIEW_WORDS = 500
const countWords = value => value.trim() ? value.trim().split(/\s+/).length : 0

// The Account Page reads personal details and reviews from Pedro's PHP/MySQL API.
// No browser-only 'fake account changes': forms are available once account.php responds.
export default function AccountPage({ activeUser, sessionLoading, onLogin, onBrowse, onOpenGame, onUserChanged, onReviewsChanged }) {
  const [profile, setProfile] = useState(activeUser)
  const [reviews, setReviews] = useState([])
  const [mode, setMode] = useState('loading') // loading | ready | missing | error
  const [loadError, setLoadError] = useState('')
  const [retry, setRetry] = useState(0)
  const [profileForm, setProfileForm] = useState({ username: activeUser?.username || '', email: activeUser?.email || '' })
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [profileBusy, setProfileBusy] = useState(false)
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [reviewBusy, setReviewBusy] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editRating, setEditRating] = useState(0)
  const [editComment, setEditComment] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')

  useEffect(() => {
    if (!activeUser?.id) {
      setMode('loading')
      setProfile(null)
      setReviews([])
      return
    }
    let current = true
    setMode('loading')
    setLoadError('')
    fetchAccount()
      .then(({ user, reviews: items }) => {
        if (!current) return
        setProfile(user)
        setProfileForm({ username: user.username, email: user.email })
        setReviews(items)
        setMode('ready')
      })
      .catch(error => {
        if (!current) return
        setProfile(activeUser)
        setProfileForm({ username: activeUser.username, email: activeUser.email })
        setReviews([])
        setMode(error.status === 404 ? 'missing' : 'error')
        setLoadError(error.message)
      })
    return () => { current = false }
    // Refetch only for the signed-in user's ID or an explicit retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUser?.id, retry])

  async function reloadAccount() {
    const result = await fetchAccount()
    setProfile(result.user)
    setProfileForm({ username: result.user.username, email: result.user.email })
    setReviews(result.reviews)
    return result
  }

  async function saveProfile(event) {
    event.preventDefault()
    const username = profileForm.username.trim()
    const email = profileForm.email.trim()
    if (username.length < 3 || username.length > 30) {
      setProfileMessage('Username must be between 3 and 30 characters.')
      return
    }
    setProfileBusy(true)
    setProfileMessage('')
    try {
      const result = await updateAccountDetails({ username, email })
      // The server should return the updated user and update its PHP session.
      onUserChanged(result.user)
      setProfile(result.user)
      setProfileForm({ username: result.user.username, email: result.user.email })
      setProfileMessage('Account details updated successfully.')
      // Refresh the reviews so the current username is reflected there too.
      try { await reloadAccount() } catch { /* The saved profile is still valid. */ }
    } catch (error) {
      setProfileMessage(error.message)
    } finally {
      setProfileBusy(false)
    }
  }

  async function savePassword(event) {
    event.preventDefault()
    if (passwordForm.next.length < 8) {
      setPasswordMessage('The new password must have at least 8 characters.')
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage('The new passwords do not match.')
      return
    }
    setPasswordBusy(true)
    setPasswordMessage('')
    try {
      await changeAccountPassword({ current_password: passwordForm.current, new_password: passwordForm.next })
      setPasswordForm({ current: '', next: '', confirm: '' })
      setPasswordMessage('Password changed successfully.')
    } catch (error) {
      setPasswordMessage(error.message)
    } finally {
      setPasswordBusy(false)
    }
  }

  function startEditing(review) {
    setEditId(review.id)
    setEditRating(review.rating)
    setEditComment(review.comment)
    setReviewMessage('')
  }

  function cancelEditing() {
    setEditId(null)
    setEditRating(0)
    setEditComment('')
  }

  async function saveReview(event) {
    event.preventDefault()
    if (editId === null || reviewBusy) return
    if (editRating < 1 || editRating > 5 || !editComment.trim() || countWords(editComment) > MAX_REVIEW_WORDS) {
      setReviewMessage(`Choose 1–5 stars and write 1–${MAX_REVIEW_WORDS} words.`)
      return
    }
    const review = reviews.find(item => item.id === editId)
    setReviewBusy(true)
    setReviewMessage('')
    try {
      await updateReview(editId, { rating: editRating, comment: editComment.trim() })
      cancelEditing()
      setReviewMessage('Your review was updated.')
      try { await reloadAccount() } catch { setReviewMessage('Review updated, but the list could not refresh. Reload this page.') }
      if (review) onReviewsChanged(review.game_id)
    } catch (error) {
      setReviewMessage(error.message)
    } finally {
      setReviewBusy(false)
    }
  }

  async function removeReview(review) {
    if (!window.confirm(`Delete your review of ${review.game_title}? This cannot be undone.`)) return
    if (reviewBusy) return
    setReviewBusy(true)
    setReviewMessage('')
    try {
      await deleteReview(review.id)
      if (editId === review.id) cancelEditing()
      setReviews(items => items.filter(item => item.id !== review.id))
      setReviewMessage('Your review was deleted.')
      try { await reloadAccount() } catch { /* Optimistic removal after successful response. */ }
      onReviewsChanged(review.game_id)
    } catch (error) {
      setReviewMessage(error.message)
    } finally {
      setReviewBusy(false)
    }
  }

  if (!activeUser) {
    return (
      <section className="account-page" aria-label="My Account">
        <button className="account-back" onClick={onBrowse} type="button">← Back to games</button>
        <div className="account-header"><div><p className="account-eyebrow">PLAYER DASHBOARD</p><h1>My <span>Account</span></h1></div></div>
        <div className="account-empty">
          <h2>{sessionLoading ? 'Checking your session...' : 'Log in to manage your account'}</h2>
          <p>Update your details and manage the game reviews you have posted.</p>
          {!sessionLoading && <button type="button" className="account-primary" onClick={onLogin}>Log In</button>}
        </div>
      </section>
    )
  }

  const initials = (profile?.username || activeUser.username || '?').slice(0, 1).toUpperCase()
  const enabled = mode === 'ready'
  return (
    <section className="account-page" aria-label="My Account">
      <button className="account-back" onClick={onBrowse} type="button">← Back to games</button>
      <div className="account-header">
        <div>
          <p className="account-eyebrow">PLAYER DASHBOARD</p>
          <h1>My <span>Account</span></h1>
          <p>Manage your DPRate profile, password and submitted reviews.</p>
        </div>
        <div className="account-avatar" aria-label={`${profile?.username || activeUser.username}'s profile`}>{initials}</div>
      </div>

      {mode === 'loading' && <p className="account-status" role="status">Loading account details...</p>}
      {mode === 'missing' && (
        <div className="account-alert" role="status"><strong>Frontend preview</strong> — your logged-in details are shown below, but saving changes and loading your review history require Pedro's <code>/api/account.php</code> endpoint. No changes are stored in this mode.</div>
      )}
      {mode === 'error' && (
        <div className="account-alert account-alert-error" role="alert">
          <strong>Could not load the account API.</strong> {loadError}
          <button type="button" onClick={() => setRetry(value => value + 1)}>Try Again</button>
        </div>
      )}

      <div className="account-grid">
        <div className="account-form-stack">
          <section className="account-panel">
            <div className="account-panel-heading"><h2>Profile Details</h2><p>Update your username or email address.</p></div>
            <form onSubmit={saveProfile} className="account-form">
              <label htmlFor="account-username">Username</label>
              <input id="account-username" autoComplete="username" required minLength={3} maxLength={30} disabled={!enabled || profileBusy} value={profileForm.username} onChange={e => { setProfileForm(v => ({ ...v, username: e.target.value })); setProfileMessage('') }} />
              <label htmlFor="account-email">Email address</label>
              <input id="account-email" type="email" autoComplete="email" required disabled={!enabled || profileBusy} value={profileForm.email} onChange={e => { setProfileForm(v => ({ ...v, email: e.target.value })); setProfileMessage('') }} />
              <button className="account-primary" type="submit" disabled={!enabled || profileBusy || (!profileForm.username.trim() && !profileForm.email.trim())}>{profileBusy ? 'Saving...' : 'Save Changes'}</button>
              {profileMessage && <p role="status" className="account-form-message">{profileMessage}</p>}
            </form>
          </section>
          <section className="account-panel">
            <div className="account-panel-heading"><h2>Change Password</h2><p>Your current password is required for security.</p></div>
            <form className="account-form" onSubmit={savePassword}>
              <label htmlFor="account-current-password">Current password</label>
              <input id="account-current-password" type="password" autoComplete="current-password" required disabled={!enabled || passwordBusy} value={passwordForm.current} onChange={e => { setPasswordForm(v => ({ ...v, current: e.target.value })); setPasswordMessage('') }} />
              <label htmlFor="account-new-password">New password</label>
              <input id="account-new-password" type="password" autoComplete="new-password" minLength={8} required disabled={!enabled || passwordBusy} value={passwordForm.next} onChange={e => { setPasswordForm(v => ({ ...v, next: e.target.value })); setPasswordMessage('') }} />
              <label htmlFor="account-confirm-password">Confirm new password</label>
              <input id="account-confirm-password" type="password" autoComplete="new-password" minLength={8} required disabled={!enabled || passwordBusy} value={passwordForm.confirm} onChange={e => { setPasswordForm(v => ({ ...v, confirm: e.target.value })); setPasswordMessage('') }} />
              <button className="account-primary" type="submit" disabled={!enabled || passwordBusy}>{passwordBusy ? 'Updating...' : 'Update Password'}</button>
              {passwordMessage && <p role="status" className="account-form-message">{passwordMessage}</p>}
            </form>
          </section>
        </div>
        <section className="account-panel account-reviews-panel" aria-label="My Submitted Reviews">
          <div className="account-panel-heading account-reviews-heading"><div><h2>My Reviews</h2><p>All the game reviews you have submitted.</p></div>{enabled && <span className="account-review-count">{reviews.length} review{reviews.length === 1 ? '' : 's'}</span>}</div>
          {reviewMessage && <p className="account-form-message" role="status">{reviewMessage}</p>}
          {!enabled ? (
            <div className="account-reviews-empty"><span aria-hidden="true">☆</span><h3>Reviews not available yet</h3><p>Once Pedro connects the account API, your submitted reviews will appear here.</p></div>
          ) : reviews.length === 0 ? (
            <div className="account-reviews-empty"><span aria-hidden="true">☆</span><h3>No reviews yet</h3><p>Explore games and share your first rating.</p><button className="account-primary" onClick={onBrowse} type="button">Explore Games</button></div>
          ) : (
            <div className="account-review-list">
              {reviews.map(review => (
                <article className="account-review" key={review.id}>
                  <div className="account-review-top"><button className="account-game-name" onClick={() => onOpenGame(review.game_id)} type="button">{review.game_title}</button><span className="account-review-stars" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></div>
                  {editId === review.id ? (
                    <form className="account-review-edit" onSubmit={saveReview}>
                      <div className="account-star-picker" role="group" aria-label="Update star rating">
                        {[1, 2, 3, 4, 5].map(value => <button type="button" key={value} aria-label={`${value} star${value > 1 ? 's' : ''}`} aria-pressed={editRating === value} className={value <= editRating ? 'is-selected' : ''} disabled={reviewBusy} onClick={() => setEditRating(value)}>★</button>)}
                      </div>
                      <label className="account-sr-only" htmlFor={`edit-comment-${review.id}`}>Your review</label>
                      <textarea id={`edit-comment-${review.id}`} required value={editComment} disabled={reviewBusy} onChange={e => setEditComment(e.target.value)} />
                      <small>{countWords(editComment)}/{MAX_REVIEW_WORDS} words</small>
                      <div className="account-review-actions"><button type="submit" disabled={reviewBusy || !editRating || !editComment.trim() || countWords(editComment) > MAX_REVIEW_WORDS}>Save Review</button><button type="button" disabled={reviewBusy} onClick={cancelEditing}>Cancel</button></div>
                    </form>
                  ) : (
                    <><p className="account-review-comment">{review.comment}</p>{review.created_at && <p className="account-review-date">{review.created_at.slice(0, 10)}</p>}<div className="account-review-actions"><button type="button" disabled={reviewBusy} onClick={() => startEditing(review)}>Edit</button><button type="button" disabled={reviewBusy} className="account-delete" onClick={() => removeReview(review)}>Delete</button></div></>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  )
}
