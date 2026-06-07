import React from 'react'

function KapitalMark({ className = '' }) {
  return (
    <svg className={`kapital-mark ${className}`} viewBox="0 0 64 64" role="img" aria-label="Kapital">
      <path className="kapital-mark-ink" d="M10 8h15v20L10 42V8Z" />
      <path className="kapital-mark-ink" d="M31 8h25v25l-8-8-13 13-7-7 14-14H31V8Z" />
      <path className="kapital-mark-accent" d="M10 35l14-13v34H10V35Z" />
      <path className="kapital-mark-accent" d="M25 38l10-10 21 21v7H45L32 43l-7 7V38Z" />
      <path className="kapital-mark-accent" d="M43 39l13-13v17l-7 7-6-11Z" />
    </svg>
  )
}

export default function KapitalBrand({ className = '', compact = false }) {
  return (
    <div className={`kapital-brand ${compact ? 'compact' : ''} ${className}`}>
      <KapitalMark />
      {!compact && <span className="kapital-wordmark">Kapital</span>}
    </div>
  )
}
