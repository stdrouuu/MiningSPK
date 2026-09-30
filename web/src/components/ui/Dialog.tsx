import React from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Move focus into dialog for keyboard users
    const t = window.setTimeout(() => contentRef.current?.focus(), 30)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      window.clearTimeout(t)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="emil-backdrop fixed inset-0 bg-zinc-950/60 backdrop-blur-sm dark:bg-black/75"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Content Box — modal stays centered (exempt from trigger-origin) */}
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={cn(
          'emil-modal relative z-50 w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-2xl',
          className
        )}
      >
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Tutup dialog"
            className="rounded-md p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 transition-colors cursor-pointer dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  )
}
