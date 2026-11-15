import { useEffect, useRef, useState } from 'react'

// Menu that opens on click or keyboard and closes on Escape, outside click or choosing an item.
export default function Dropdown({ id, label, align = 'left', buttonClass = 'nav-link', children }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointer = event => { if (!rootRef.current?.contains(event.target)) setOpen(false) }
    const onKey = event => {
      if (event.key === 'Escape') {
        setOpen(false)
        rootRef.current?.querySelector('button')?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="dropdown" ref={rootRef}>
      <button type="button" className={`${buttonClass} dropdown-toggle`} aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>
        {label}<span className="chevron" aria-hidden="true" />
      </button>
      {open && (
        <div id={id} className={`dropdown-menu dropdown-${align}`} onClick={event => { if (event.target.closest('a, button')) setOpen(false) }}>
          {children}
        </div>
      )}
    </div>
  )
}
