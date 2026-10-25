import { useEffect, useMemo, useRef, useState } from 'react'
import { RiSearchLine, RiCheckLine, RiArrowDownSLine, RiUserAddLine } from 'react-icons/ri'
import type { StudentProfile } from '../types/data'
import { avatarForStudent } from '../lib/avatar'
import { cn } from '../lib/utils'

interface StudentPresetDropdownProps {
  students: StudentProfile[]
  selectedId?: string
  onSelect: (student: StudentProfile) => void
  onAddNewProfile?: () => void
}

/** Dropdown custom profil contoh mahasiswa — avatar DiceBear di kiri nama. */
export function StudentPresetDropdown({
  students,
  selectedId,
  onSelect,
  onAddNewProfile,
}: StudentPresetDropdownProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selected = students.find((s) => s.student_id === selectedId) || null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return students
    return students.filter(
      (s) =>
        s.student_name.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q) ||
        s.preferred_category?.toLowerCase().includes(q) ||
        s.student_location_clean?.toLowerCase().includes(q)
    )
  }, [students, query])

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
  }, [open ])

  useEffect(() => {
    if (open) window.setTimeout(() => searchRef.current?.focus(), 30)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center gap-3 p-2 pr-3 rounded-xl border bg-white dark:bg-slate-900 text-left transition-colors cursor-pointer',
          open ? 'border-[#0C52EE] dark:border-blue-500 ring-2 ring-[#0C52EE]/15 dark:ring-blue-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
        )}
      >
        {selected ? (
          <img
            src={avatarForStudent(selected.student_id, selected.student_name)}
            alt={selected.student_name}
            loading="lazy"
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 object-cover shrink-0"
          />
        ) : (
          <span className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm shrink-0">
            ?
          </span>
        )}
        <span className="flex-1 min-w-0">
          {selected ? (
            <>
              <span className="block text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{selected.student_name}</span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-light truncate">
                {selected.student_id} • {selected.preferred_category}
              </span>
            </>
          ) : (
            <>
              <span className="block text-xs font-medium text-slate-900 dark:text-slate-100">Pilih profil contoh…</span>
              <span className="block text-[11px] text-slate-400 dark:text-slate-500 font-light">{students.length} mahasiswa tersedia</span>
            </>
          )}
        </span>
        <RiArrowDownSLine className={cn('w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform shrink-0', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama, NIM, atau minat…"
                className="w-full h-8 pl-8 pr-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:border-[#0C52EE] dark:focus:border-blue-400"
              />
            </div>
          </div>

          <ul role="listbox" aria-label="Daftar profil contoh mahasiswa" className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
            {onAddNewProfile && (
              <li className="pb-1 mb-1 border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    onAddNewProfile()
                    setOpen(false)
                    setQuery('')
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-lg text-left bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 border border-blue-200/80 dark:border-blue-800/80 transition-colors cursor-pointer group"
                >
                  <span className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/80 border border-blue-300 dark:border-blue-700 flex items-center justify-center text-[#0C52EE] dark:text-blue-300 group-hover:scale-105 transition-transform shrink-0">
                    <RiUserAddLine className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold text-[#0C52EE] dark:text-blue-400">
                      + Tambahkan Profil Mahasiswa Baru
                    </span>
                    <span className="block text-[11px] text-blue-600/80 dark:text-blue-300/80 font-light truncate">
                      Buat profil baru & sesuaikan preferensi sendiri
                    </span>
                  </span>
                </button>
              </li>
            )}

            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500 font-light">
                Tidak ada mahasiswa yang cocok dengan “{query}”.
              </li>
            ) : (
              filtered.map((s) => {
                const active = s.student_id === selectedId
                return (
                  <li key={s.student_id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onSelect(s)
                        setOpen(false)
                        setQuery('')
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors cursor-pointer',
                        active ? 'bg-blue-50/80 dark:bg-blue-950/60' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      )}
                    >
                      <img
                        src={avatarForStudent(s.student_id, s.student_name)}
                        alt={s.student_name}
                        loading="lazy"
                        className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 object-cover shrink-0"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{s.student_name}</span>
                          {active && <RiCheckLine className="w-3.5 h-3.5 text-[#0C52EE] dark:text-blue-400 shrink-0" />}
                        </span>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-light truncate">
                          {s.student_id} • {s.preferred_category}
                        </span>
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-light truncate">
                          {s.student_location_clean} • Rp {(s.min_expected_salary || 0).toLocaleString('id-ID')}/jam • {s.student_expected_work_hour} jam/mgg
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>

          <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 text-[10px] text-slate-400 dark:text-slate-500 font-light flex items-center justify-between">
            <span>{filtered.length} dari {students.length} profil</span>
            <span>Avatar oleh DiceBear</span>
          </div>
        </div>
      )}
    </div>
  )
}
