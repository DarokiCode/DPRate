import { useEffect, useState } from 'react'
import { changePlan, fetchPlans } from '../api'
import { AvatarArt } from '../components/Avatar'
import { formatPrice } from '../lib/format'
import { useDocumentTitle } from '../lib/hooks'

// How DPRate would pay for itself (business model from Assessment 1 and 2).
const REVENUE = [
  { title: 'Silver and Gold plans', text: 'Monthly subscriptions for players who want no ads and a few extras.' },
  { title: 'Advertising', text: 'Ad spaces on the home page and the game pages. Only Standard players and visitors see them.' },
  { title: 'Sponsored spot', text: 'A studio can pay to show its game first on the home page. It is always labelled “Sponsored”.' },
  { title: 'Store links', text: 'The “Where to buy” links on each game page earn a small share of each sale from the store.' },
]

export default function PlansPage({ user, sessionReady, params, onUserChanged, toast }) {
  useDocumentTitle('Plans')
  const [plans, setPlans] = useState([])
  const [status, setStatus] = useState('loading')
  const [confirming, setConfirming] = useState(null) // plan id waiting for "Yes, switch"
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    fetchPlans()
      .then(list => { if (active) { setPlans(list); setStatus('ready') } })
      .catch(() => { if (active) setStatus('error') })
    return () => { active = false }
  }, [])

  // #plans?section=advertise opens the page at the advertising section.
  useEffect(() => {
    if (params.get('section') === 'advertise' && status !== 'loading') {
      document.getElementById('advertise')?.scrollIntoView({ block: 'start' })
    }
  }, [params, status])

  const current = user?.plan || 'standard'

  async function switchPlan(plan) {
    setBusy(true)
    setMessage('')
    try {
      const updated = await changePlan(plan.id)
      onUserChanged(updated)
      setConfirming(null)
      toast(`You are on ${plan.name} now.${plan.ads ? '' : ' Ads are gone.'}`)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  function action(plan) {
    if (!user) {
      return plan.id === 'standard'
        ? <a className="btn btn-primary btn-large plan-button" href="#register">Create a free account</a>
        : <a className="btn btn-secondary btn-large plan-button" href="#login">Log in to choose {plan.name}</a>
    }
    if (plan.id === current) {
      return <p className="plan-current" aria-live="polite">✓ Your current plan</p>
    }
    if (confirming === plan.id) {
      return (
        <div className="plan-confirm" role="group" aria-label={`Confirm ${plan.name}`}>
          <p>
            Switch to {plan.name}{plan.price > 0 ? ` for ${formatPrice(plan.price)} a month` : ''}?
            <strong> Demo: no payment is taken.</strong>
          </p>
          <div className="plan-confirm-actions">
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => switchPlan(plan)}>
              {busy ? 'Switching…' : 'Yes, switch'}
            </button>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setConfirming(null)}>Cancel</button>
          </div>
        </div>
      )
    }
    return (
      <button type="button" className={`btn btn-large plan-button ${plan.id === 'standard' ? 'btn-secondary' : 'btn-primary'}`}
        onClick={() => { setConfirming(plan.id); setMessage('') }}>
        {plan.id === 'standard' ? 'Go back to Standard' : `Choose ${plan.name}`}
      </button>
    )
  }

  return (
    <div className="plans-page">
      <header className="wrap plans-head">
        <h1>Pick your plan</h1>
        <p className="plans-lede">
          Rating and reviewing games is free on every plan. Silver and Gold remove the ads and add a few extras. Prices are in Australian dollars.
        </p>
        <p className="demo-note" role="note"><strong>Student demo:</strong> you can switch plans freely. No card is asked for and no payment is taken.</p>
      </header>

      <div className="wrap">
        {status === 'loading' && <p className="muted" role="status">Loading the plans…</p>}
        {status === 'error' && <p className="form-message is-error" role="alert">The plans could not be loaded. Please try again later.</p>}
        {message && <p className="form-message is-error" role="alert">{message}</p>}

        {status === 'ready' && (
          <ul className="plan-grid">
            {plans.map(plan => (
              <li key={plan.id} className={`plan-card plan-${plan.id} ${plan.id === current && user ? 'is-current' : ''}`}>
                <h2 className="plan-name">{plan.name}</h2>
                <p className="plan-price">
                  <strong>{formatPrice(plan.price)}</strong>
                  {plan.price > 0 && <span> a month</span>}
                </p>
                <ul className="plan-perks">
                  {plan.perks.map(perk => <li key={perk}>{perk}</li>)}
                  {plan.ads && <li className="plan-perk-ads">Sees ads</li>}
                </ul>
                <div className="plan-avatars" aria-hidden="true">
                  {plan.avatars.slice(0, 4).map(id => <span key={id} className="avatar avatar-small avatar-art"><AvatarArt id={id} /></span>)}
                </div>
                {sessionReady ? action(plan) : null}
              </li>
            ))}
          </ul>
        )}

        <section className="plans-fair" aria-labelledby="fair-title">
          <h2 id="fair-title">Money never changes a score</h2>
          <p>
            Every player’s review counts the same in the average, whatever their plan. A badge or a highlight only changes how a review looks,
            and a sponsored game is rated by players like any other.
          </p>
        </section>

        <section className="revenue" aria-labelledby="revenue-title">
          <h2 id="revenue-title">How DPRate makes money</h2>
          <ol className="revenue-list">
            {REVENUE.map(item => (
              <li key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="advertise" id="advertise" aria-labelledby="advertise-title">
          <h2 id="advertise-title">Advertise on DPRate</h2>
          <p>
            Studios and publishers can reach players while they choose their next game: banner spaces, the sponsored spot at the top of the home page,
            and store links on their game page. Ads are always labelled and never shown to Silver or Gold players.
          </p>
          <p className="muted">This is a student project, so there is no ad sales team yet. A live DPRate would have a contact form here.</p>
        </section>
      </div>
    </div>
  )
}
