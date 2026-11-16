// Advertising space (part of the DPRate business model).
// Standard players and visitors see it; Silver and Gold players do not.
// The ads are DPRate's own: no company has paid for an ad on this student site.
const ADS = {
  plans: {
    title: 'Go ad-free with DPRate Silver',
    text: 'A$2.99 a month: no ads, a Silver badge on your reviews and extra profile pictures.',
    action: 'See the plans',
    href: '#plans',
  },
  advertise: {
    title: 'Your game here',
    text: 'Reach players who rate games. Banner ads, the sponsored spot on the home page and store links.',
    action: 'Advertise on DPRate',
    href: '#plans?section=advertise',
  },
}

export default function AdSlot({ user, kind = 'plans', className = '' }) {
  if (user && user.plan !== 'standard') return null
  const ad = ADS[kind]
  return (
    <aside className={`ad-slot ad-${kind} ${className}`} aria-label="Advertisement">
      <span className="ad-label">Advertisement</span>
      <div className="ad-body">
        <strong className="ad-title">{ad.title}</strong>
        <p>{ad.text}</p>
      </div>
      <a className="btn ad-button" href={ad.href}>{ad.action}</a>
    </aside>
  )
}
