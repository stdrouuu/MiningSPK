import { useEffect, useMemo, useRef, useState } from 'react'
import {
  RiArrowDownSLine,
  RiFileList3Line,
  RiVideoChatLine,
  RiCustomerService2Line,
  RiPaletteLine,
  RiBookOpenLine,
  RiCupLine,
  RiCodeSSlashLine,
  RiTruckLine,
  RiMegaphoneLine,
  RiStore2Line,
  RiBriefcaseLine,
} from 'react-icons/ri'

export interface CategoryOption {
  value: string
  label: string
  hint: string
}

interface Props {
  options: CategoryOption[]
  value: string
  onChange: (value: string) => void
}

function CategoryIcon({ category, className = 'h-3.5 w-3.5' }: { category: string; className?: string }) {
  const c = category.toLowerCase()
  if (c.includes('admin')) return <RiFileList3Line className={className} />
  if (c.includes('content')) return <RiVideoChatLine className={className} />
  if (c.includes('customer')) return <RiCustomerService2Line className={className} />
  if (c.includes('design')) return <RiPaletteLine className={className} />
  if (c.includes('education')) return <RiBookOpenLine className={className} />
  if (c.includes('food')) return <RiCupLine className={className} />
  if (c.includes('it')) return <RiCodeSSlashLine className={className} />
  if (c.includes('logistics')) return <RiTruckLine className={className} />
  if (c.includes('marketing')) return <RiMegaphoneLine className={className} />
  if (c.includes('retail')) return <RiStore2Line className={className} />
  return <RiBriefcaseLine className={className} />
}

export function CategoryDropdownVariants({ options, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const sortedOptions = useMemo(
    () => [...options].sort((a, b) => a.label.localeCompare(b.label, 'id')),
    [options]
  )

  const selected = sortedOptions.find((o) => o.value === value) || null

  const grouped = useMemo(() => {
    const map = new Map<string, CategoryOption[]>()
    sortedOptions.forEach((o) => {
      const ch = o.label.trim().charAt(0).toUpperCase()
      const list = map.get(ch) ?? []
      list.push(o)
      map.set(ch, list)
    })
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [sortedOptions])

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (val: string) => {
    onChange(val)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Bidang pekerjaan yang diminati"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all cursor-pointer ${
          open
            ? 'border-[#0C52EE] dark:border-blue-500 ring-2 ring-[#0C52EE]/15 dark:ring-blue-500/20 bg-white dark:bg-slate-950'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selected && (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0C52EE] dark:text-blue-400">
              <CategoryIcon category={selected.value} className="h-3.5 w-3.5" />
            </span>
          )}
          <div className="min-w-0">
            {selected ? (
              <>
                <span className="block text-xs sm:text-sm font-medium text-slate-900 dark:text-white truncate">
                  {selected.label}
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-light truncate">
                  {selected.hint}
                </span>
              </>
            ) : (
              <span className="block text-xs sm:text-sm text-slate-400 dark:text-slate-500">
                Pilih satu bidang…
              </span>
            )}
          </div>
        </div>
        <RiArrowDownSLine
          className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-150 ${
            open ? 'rotate-180 text-[#0C52EE] dark:text-blue-400' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl divide-y divide-slate-100 dark:divide-slate-800"
        >
          {grouped.map(([letter, items]) => (
            <div key={letter}>
              <div className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-xs px-3 py-1 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                {letter}
              </div>
              <div className="flex flex-wrap gap-1.5 px-3 py-2.5">
                {items.map((o) => {
                  const isSel = o.value === value
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="option"
                      aria-selected={isSel}
                      title={o.hint}
                      onClick={() => pick(o.value)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                        isSel
                          ? 'bg-[#0C52EE] text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 hover:text-[#0C52EE] dark:hover:bg-blue-950/60 dark:hover:text-blue-300'
                      }`}
                    >
                      <CategoryIcon category={o.value} className="h-3.5 w-3.5 shrink-0" />
                      <span>{o.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
