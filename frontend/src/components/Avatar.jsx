import { useId } from 'react'
import { avatarColour } from '../lib/format'

// Profile pictures (A1 minor feature). Drawn in SVG for DPRate, so there is nothing to upload.
// The ids and the plan that unlocks each one come from the API (includes/membership.php).
const D = 'rgba(10, 12, 19, 0.42)' // detail colour inside the white shapes

const ART = {
  // Standard
  controller: { colours: ['#7c4dff', '#4b2bb8'], shape: (
    <>
      <path d="M19 23h26c6 0 10 5 11 11l2 9c1 5-4 8-8 5l-6-5H20l-6 5c-4 3-9 0-8-5l2-9c1-6 5-11 11-11z" fill="#fff" />
      <path d="M21 29h4v4h4v4h-4v4h-4v-4h-4v-4h4z" fill={D} /><circle cx="42" cy="31" r="2.6" fill={D} /><circle cx="47" cy="36" r="2.6" fill={D} />
    </>
  ) },
  joystick: { colours: ['#2f9e74', '#17654a'], shape: (
    <><rect x="14" y="40" width="36" height="12" rx="6" fill="#fff" /><rect x="30" y="22" width="4" height="20" rx="2" fill="#fff" /><circle cx="32" cy="19" r="8" fill="#fff" /><circle cx="22" cy="46" r="3" fill={D} /></>
  ) },
  sword: { colours: ['#0e7490', '#0a4a5c'], shape: (
    <><path d="M44 10h10v10L30 44l-10-10z" fill="#fff" /><path d="M16 34l14 14-3 3-14-14z" fill="#fff" /><path d="M14 46l4 4-6 6-4-4z" fill="#fff" /><path d="M49 15L27 37" stroke={D} strokeWidth="2" /></>
  ) },
  shield: { colours: ['#c2410c', '#7a2a07'], shape: (
    <><path d="M32 8l20 7v15c0 13-9 22-20 26C21 52 12 43 12 30V15z" fill="#fff" /><path d="M32 13v38M17 28h30" stroke={D} strokeWidth="4" /></>
  ) },
  potion: { colours: ['#b4237a', '#6e1249'], shape: (
    <><rect x="27" y="9" width="10" height="9" rx="2" fill="#fff" /><path d="M26 18h12v6c7 3 12 9 12 17 0 9-8 15-18 15S14 50 14 41c0-8 5-14 12-17z" fill="#fff" /><path d="M16 41h32c0 7-7 12-16 12s-16-5-16-12z" fill={D} /><circle cx="26" cy="33" r="2.5" fill={D} /></>
  ) },
  ghost: { colours: ['#475569', '#1e293b'], shape: (
    <><path d="M32 10c-11 0-18 8-18 18v24l6-5 6 5 6-5 6 5 6-5 6 5V28c0-10-7-18-18-18z" fill="#fff" /><circle cx="26" cy="28" r="3.5" fill={D} /><circle cx="38" cy="28" r="3.5" fill={D} /></>
  ) },
  rocket: { colours: ['#a16207', '#5c3804'], shape: (
    <><path d="M32 6c8 6 12 16 12 26l-4 10H24l-4-10c0-10 4-20 12-26z" fill="#fff" /><path d="M21 33l-7 11h9zM43 33l7 11h-9z" fill="#fff" /><circle cx="32" cy="24" r="5" fill={D} /><path d="M27 45h10l-5 12z" fill="#ffc23d" /></>
  ) },
  heart: { colours: ['#e11d48', '#881337'], shape: (
    <path d="M32 52S12 40 12 25c0-7 5-12 11-12 4 0 7 2 9 6 2-4 5-6 9-6 6 0 11 5 11 12 0 15-20 27-20 27z" fill="#fff" />
  ) },
  // Silver
  wizard: { colours: ['#64748b', '#334155'], shape: (
    <><path d="M35 7c-7 9-15 23-17 37h28C44 30 41 18 35 7z" fill="#fff" /><rect x="10" y="43" width="44" height="8" rx="4" fill="#fff" /><path d="M31 23l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z" fill={D} /></>
  ) },
  knight: { colours: ['#6b7280', '#374151'], shape: (
    <><path d="M32 8c-11 0-18 8-18 19v21c0 4 3 7 7 7h22c4 0 7-3 7-7V27c0-11-7-19-18-19z" fill="#fff" /><rect x="19" y="27" width="26" height="5" rx="2.5" fill={D} /><rect x="30" y="34" width="4" height="15" rx="2" fill={D} /></>
  ) },
  robot: { colours: ['#4b5563', '#1f2937'], shape: (
    <><rect x="30" y="9" width="4" height="8" fill="#fff" /><circle cx="32" cy="8" r="3.5" fill="#fff" /><rect x="14" y="17" width="36" height="30" rx="8" fill="#fff" /><rect x="9" y="26" width="5" height="11" rx="2.5" fill="#fff" /><rect x="50" y="26" width="5" height="11" rx="2.5" fill="#fff" /><circle cx="25" cy="30" r="4" fill={D} /><circle cx="39" cy="30" r="4" fill={D} /><rect x="24" y="39" width="16" height="3" rx="1.5" fill={D} /></>
  ) },
  alien: { colours: ['#52525b', '#27272a'], shape: (
    <><path d="M32 8c-12 0-20 9-20 20 0 13 11 26 20 28 9-2 20-15 20-28 0-11-8-20-20-20z" fill="#fff" /><ellipse cx="24" cy="31" rx="6.5" ry="4" transform="rotate(32 24 31)" fill={D} /><ellipse cx="40" cy="31" rx="6.5" ry="4" transform="rotate(-32 40 31)" fill={D} /></>
  ) },
  // Gold
  crown: { colours: ['#f5b301', '#a86b00'], shape: (
    <><path d="M10 22l11 9 11-15 11 15 11-9-5 24H15z" fill="#fff" /><rect x="15" y="45" width="34" height="7" rx="2" fill="#fff" /><circle cx="32" cy="36" r="3" fill={D} /><circle cx="22" cy="38" r="2.4" fill={D} /><circle cx="42" cy="38" r="2.4" fill={D} /></>
  ) },
  gem: { colours: ['#eab308', '#92400e'], shape: (
    <><path d="M18 14h28l10 12-24 30L8 26z" fill="#fff" /><path d="M8 26h48M24 14l-6 12 14 30 14-30-6-12" stroke={D} strokeWidth="2" fill="none" /></>
  ) },
  trophy: { colours: ['#f59e0b', '#9a5b00'], shape: (
    <><path d="M20 10h24v10c0 9-5 16-12 18-7-2-12-9-12-18z" fill="#fff" /><path d="M20 15h-6c0 8 3 12 8 13M44 15h6c0 8-3 12-8 13" stroke="#fff" strokeWidth="4" fill="none" /><rect x="29" y="37" width="6" height="8" fill="#fff" /><rect x="19" y="45" width="26" height="7" rx="2" fill="#fff" /></>
  ) },
  medal: { colours: ['#fbbf24', '#b45309'], shape: (
    <><path d="M21 7h9l5 15h-9zM43 7h-9l-5 15h9z" fill="#fff" opacity="0.85" /><circle cx="32" cy="39" r="15" fill="#fff" /><path d="M32 30l2.8 5.6 6.2.9-4.5 4.4 1 6.1-5.5-2.9-5.5 2.9 1-6.1-4.5-4.4 6.2-.9z" fill={D} /></>
  ) },
}

export function AvatarArt({ id }) {
  const gradient = `avatar-gradient${useId().replace(/:/g, '')}` // unique per picture on the page
  const art = ART[id]
  if (!art) return null
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={art.colours[0]} /><stop offset="1" stopColor={art.colours[1]} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" fill={`url(#${gradient})`} />
      {art.shape}
    </svg>
  )
}

// The chosen picture, or the coloured first letter of the username.
// Silver and Gold players get a metal ring around it.
export default function Avatar({ name, avatar = null, plan = 'standard', size = 'small' }) {
  const ring = plan === 'gold' || plan === 'silver' ? ` avatar-ring-${plan}` : ''
  if (avatar && ART[avatar]) {
    return <span className={`avatar avatar-${size} avatar-art${ring}`} aria-hidden="true"><AvatarArt id={avatar} /></span>
  }
  return (
    <span className={`avatar avatar-${size}${ring}`} style={{ background: avatarColour(name) }} aria-hidden="true">
      {(name || '?').charAt(0).toUpperCase()}
    </span>
  )
}

// Small "Silver" or "Gold" label next to a username.
export function PlanBadge({ plan }) {
  if (plan !== 'silver' && plan !== 'gold') return null
  return <span className={`plan-badge plan-badge-${plan}`}>{plan === 'gold' ? 'Gold' : 'Silver'}</span>
}
