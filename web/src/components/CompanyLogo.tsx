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
  const dims = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'
  const letter = companyName?.charAt(0)?.toUpperCase() || 'J'

  if (!logoUrl || failed) {
    return (
      <div
        className={`${dims} rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700`}
        aria-hidden="true"
      >
        {letter}
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
      className={`${dims} rounded-lg object-contain bg-white border border-zinc-200 dark:border-zinc-700 shrink-0`}
    />
  )
}
