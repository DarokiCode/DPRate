import { useState } from 'react'
import { loginUser, registerUser } from '../api'
import { useDocumentTitle } from '../lib/hooks'

function PasswordInput({ id, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="password-input">
      <input id={id} className="input" type={visible ? 'text' : 'password'} autoComplete={autoComplete} required minLength={autoComplete === 'new-password' ? 8 : undefined} value={value} onChange={onChange} />
      <button type="button" className="password-toggle" onClick={() => setVisible(shown => !shown)} aria-pressed={visible}>
        {visible ? 'Hide' : 'Show'}<span className="sr-only"> password</span>
      </button>
    </div>
  )
}

export default function AuthPage({ mode, onAuthenticated }) {
  const isLogin = mode === 'login'
  useDocumentTitle(isLogin ? 'Log in' : 'Create an account')
  const [fields, setFields] = useState({ login: '', username: '', email: '', password: '', confirm: '' })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const set = field => event => { setFields(current => ({ ...current, [field]: event.target.value })); setMessage('') }

  async function submit(event) {
    event.preventDefault()
    if (!isLogin && fields.password !== fields.confirm) return setMessage('The two passwords do not match.')
    setBusy(true)
    setMessage('')
    try {
      const user = isLogin
        ? await loginUser({ login: fields.login.trim(), password: fields.password })
        : await registerUser({ username: fields.username.trim(), email: fields.email.trim(), password: fields.password })
      onAuthenticated(user, isLogin ? `Welcome back, ${user.username}!` : `Welcome to DPRate, ${user.username}!`)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-art">
        <img src="/assets/auth-fantasy.jpg" alt="" aria-hidden="true" />
        <div className="auth-art-copy">
          <h2>Every score on DPRate comes from a player.</h2>
          <ul>
            <li>Rate any game from 1 to 5 stars</li>
            <li>Write reviews and edit them later</li>
            <li>Keep your favourite games in one list</li>
          </ul>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-tabs" role="tablist" aria-label="Account">
          <a role="tab" aria-selected={isLogin} className={isLogin ? 'is-active' : ''} href="#login">Log in</a>
          <a role="tab" aria-selected={!isLogin} className={!isLogin ? 'is-active' : ''} href="#register">Create account</a>
        </div>
        <h1>{isLogin ? 'Welcome back' : 'Join DPRate'}</h1>
        <p className="auth-lede">{isLogin ? 'Log in with your username or email.' : 'Free, and it takes less than a minute.'}</p>

        <form className="auth-form" onSubmit={submit} noValidate={false}>
          {isLogin ? (
            <div className="field">
              <label htmlFor="login-name">Username or email</label>
              <input id="login-name" className="input" autoComplete="username" required value={fields.login} onChange={set('login')} />
            </div>
          ) : (
            <>
              <div className="field">
                <label htmlFor="register-username">Username</label>
                <input id="register-username" className="input" autoComplete="username" required minLength={3} maxLength={30} pattern="[A-Za-z0-9_]{3,30}" value={fields.username} onChange={set('username')} />
                <span className="field-hint">3 to 30 letters, numbers or underscores. Shown on your reviews.</span>
              </div>
              <div className="field">
                <label htmlFor="register-email">Email</label>
                <input id="register-email" className="input" type="email" autoComplete="email" required value={fields.email} onChange={set('email')} />
              </div>
            </>
          )}
          <div className="field">
            <label htmlFor="auth-password">Password</label>
            <PasswordInput id="auth-password" value={fields.password} onChange={set('password')} autoComplete={isLogin ? 'current-password' : 'new-password'} />
            {!isLogin && <span className="field-hint">At least 8 characters.</span>}
          </div>
          {!isLogin && (
            <div className="field">
              <label htmlFor="auth-confirm">Confirm password</label>
              <PasswordInput id="auth-confirm" value={fields.confirm} onChange={set('confirm')} autoComplete="new-password" />
            </div>
          )}
          {message && <p className="form-message is-error" role="alert">{message}</p>}
          <button type="submit" className="btn btn-primary btn-large auth-submit" disabled={busy}>
            {busy ? (isLogin ? 'Logging in…' : 'Creating your account…') : isLogin ? 'Log in' : 'Create my account'}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? <>New to DPRate? <a className="link" href="#register">Create an account</a></> : <>Already a member? <a className="link" href="#login">Log in</a></>}
        </p>
      </div>
    </div>
  )
}
