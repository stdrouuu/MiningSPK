import React from 'react'
import { RiCloseLine } from 'react-icons/ri'
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

  // onClose sering dibuat inline di parent, jadi identitasnya berubah tiap render.
  // Simpan di ref agar efek di bawah tidak depend pada identitas fungsi.
  const onCloseRef = React.useRef(onClose)
  React.useEffect(() => {
    onCloseRef.current = onClose
  })

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Move focus into dialog for keyboard users — hanya sekali saat terbuka,
    // dan jangan merebut fokus dari kontrol yang sedang diketik user.
    const t = window.setTimeout(() => {
      const el = contentRef.current
      if (!el) return
      if (el.contains(document.activeElement)) return
      el.focus()
    }, 30)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      window.clearTimeout(t)
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="emil-backdrop fixed inset-0 bg-slate-950/60 backdrop-blur-sm dark:bg-black/75"
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
          'emil-modal relative z-50 w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto outline-none dark:border-slate-800 dark:bg-slate-950 dark:shadow-2xl',
          className
        )}
      >
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-medium tracking-tight text-slate-900 dark:text-slate-50">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Tutup dialog"
            className="rounded-md p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors cursor-pointer dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 dark:focus-visible:ring-slate-100"
          >
            <RiCloseLine className="h-5 w-5" />
          </button>
        </div>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  )
}
