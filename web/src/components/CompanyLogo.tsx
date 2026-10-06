import { useState } from 'react'

interface CompanyLogoProps {
  companyName: string
  logoUrl?: string
  size?: 'sm' | 'md'
}

// Shows the original company logo from the source posting when available.
// Falls back to the initial-letter tile when missing or failing to load.
export function CompanyLogo({ companyName, logoUrl, size = 'md' }: CompanyLogoProps) {
  const [failed, setFailed] = useState(false)
  const dims = size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-xs'
  const letters = (companyName || '??').substring(0, 2).toUpperCase()

  if (!logoUrl || failed) {
    return (
      <div
        className={`${dims} rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-medium flex items-center justify-center shrink-0`}
        aria-hidden="true"
      >
        {letters}
      </div>
    )
  }

  return (
    <img
      src={logoUrl}
      alt={`Logo ${companyName}`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${dims} rounded-lg object-contain bg-white border border-slate-200 shrink-0`}
    />
  )
}
