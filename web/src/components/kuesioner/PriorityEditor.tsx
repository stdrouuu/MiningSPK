import { useRef, useState } from 'react'
import {
  RiRefreshLine,
  RiDraggable,
  RiArrowUpSLine,
  RiArrowDownSLine,
} from 'react-icons/ri'
import type { CriterionKey, Ranks } from '../../types/priority'
import { ALL_KEYS, metaOf } from '../../lib/priority'
import { weightsWithTies, weightPct } from '../../lib/roc'

interface Props {
  ranks: Ranks
  onChange: (next: Ranks, edited: boolean) => void
  onReset: () => void
  showReset?: boolean
}

export function PriorityEditor({ ranks, onChange, onReset, showReset = true }: Props) {
  const weights = weightsWithTies(ranks)

  // Urutan tampil = urutan prioritas (index 0 = Rank 1)
  const orderedKeys = ALL_KEYS.slice().sort((a, b) => ranks[a] - ranks[b])

  // Drag-to-reorder dengan susun-ulang live: baris lain langsung minggir saat
  // item diseret ke posisinya.
  const dragFromRef = useRef<number | null>(null)
  const droppedRef = useRef(false)
  const preDragRef = useRef<Ranks | null>(null)
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [openFaqKey, setOpenFaqKey] = useState<CriterionKey | null>(null)

  /** Urutan key baru jika item fromIndex pindah ke toIndex. */
  const movedOrder = (fromIndex: number, toIndex: number): CriterionKey[] => {
    const next = orderedKeys.slice()
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    return next
  }

  const ranksOf = (order: CriterionKey[]): Ranks => {
    const updated = { ...ranks }
    order.forEach((key, idx) => {
      updated[key] = idx + 1
    })
    return updated
  }

  /** Susun ulang final (satu edit tercatat). */
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return
    onChange(ranksOf(movedOrder(fromIndex, toIndex)), true)
  }

  /** Preview live saat drag (tidak tercatat sebagai edit). */
  const previewReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return
    dragFromRef.current = toIndex
    setDragFromIndex(toIndex)
    onChange(ranksOf(movedOrder(fromIndex, toIndex)), false)
  }

  const moveRank = (key: CriterionKey, direction: -1 | 1) => {
    const fromIndex = orderedKeys.indexOf(key)
    const toIndex = fromIndex + direction
    if (toIndex < 0 || toIndex >= orderedKeys.length) return
    handleReorder(fromIndex, toIndex)
  }

  const clearDrag = () => {
    dragFromRef.current = null
    setDragFromIndex(null)
    setIsDragging(false)
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-slate-900 dark:text-white">Susunan kriteria versimu</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
            Seret untuk menyusun — atas = paling penting • bobot otomatis
          </p>
        </div>
        {showReset && (
          <button
            onClick={onReset}
            className="emil-press shrink-0 inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 h-7 bg-white dark:bg-slate-800"
          >
            <RiRefreshLine className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        {orderedKeys.map((key, index) => {
          const m = metaOf(key)
          const currentRank = index + 1
          const isDragged = isDragging && dragFromIndex === index

          return (
            <div
              key={key}
              draggable
              onDragStart={(e) => {
                dragFromRef.current = index
                preDragRef.current = { ...ranks }
                droppedRef.current = false
                setDragFromIndex(index)
                setIsDragging(true)
                e.dataTransfer.effectAllowed = 'move'
                try {
                  e.dataTransfer.setData('text/plain', String(index))
                } catch {
                  /* abaikan */
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                const from = dragFromRef.current ?? Number(e.dataTransfer.getData('text/plain'))
                if (Number.isNaN(from) || from === index) return
                previewReorder(from, index)
              }}
              onDrop={(e) => {
                e.preventDefault()
                droppedRef.current = true
                // Susunan sudah sesuai preview terakhir — catat satu edit final
                onChange({ ...ranks }, true)
                clearDrag()
              }}
              onDragEnd={() => {
                // Drag batal (mis. tekan Escape): kembalikan susunan semula
                if (!droppedRef.current && preDragRef.current) {
                  onChange(preDragRef.current, false)
                }
                droppedRef.current = false
                preDragRef.current = null
                clearDrag()
              }}
              className={`emil-press flex flex-col gap-1.5 p-2.5 rounded-lg border text-xs select-none transition-opacity ${
                isDragged
                  ? 'border-[#0C52EE] dark:border-blue-500 bg-[#0C52EE]/[0.04] dark:bg-blue-500/10 opacity-40'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2">
                {/* Drag handle */}
                <span
                  title="Seret untuk memindahkan"
                  className="flex h-8 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-grab active:cursor-grabbing touch-none"
                >
                  <RiDraggable className="h-4 w-4" />
                </span>

                {/* Nomor prioritas */}
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#0C52EE] dark:bg-blue-600 text-white font-medium text-xs font-mono">
                  {currentRank}
                </span>

                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate font-medium text-slate-900 dark:text-white">
                    {m.title}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-medium text-white bg-[#0C52EE] dark:bg-blue-600 px-2.5 py-1 rounded-md text-xs shadow-2xs tabular-nums">
                    {weightPct(weights[key])}
                  </span>
                {/* Fallback tombol untuk mobile / keyboard */}
                <span className="flex flex-col -space-y-0.5">
                  <button
                    type="button"
                    aria-label={`Naikkan ${m.title}`}
                    disabled={index === 0}
                    onClick={() => moveRank(key, -1)}
                    className="p-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <RiArrowUpSLine className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Turunkan ${m.title}`}
                    disabled={index === orderedKeys.length - 1}
                    onClick={() => moveRank(key, 1)}
                    className="p-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <RiArrowDownSLine className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
              </div>

              <div
                className="pl-8 pr-1"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onDragStart={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <button
                  type="button"
                  aria-expanded={openFaqKey === key}
                  onClick={() => setOpenFaqKey((prev) => (prev === key ? null : key))}
                  className={`inline-flex cursor-pointer items-center gap-1 text-xs font-medium transition-colors ${
                    openFaqKey === key
                      ? 'text-[#0C52EE] dark:text-blue-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-[#0C52EE] dark:hover:text-blue-400'
                  }`}
                >
                  <span>Apa maksud kriteria ini?</span>
                  <RiArrowDownSLine
                    className={`h-3.5 w-3.5 transition-transform duration-150 ${
                      openFaqKey === key ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaqKey === key && (
                  <div className="mt-1.5 rounded-md border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/70 px-3 py-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300 select-text">
                    <p>
                      {
                        {
                          C1_kategori:
                            'Mencocokkan bidang lowongan dengan kategori yang kamu minati.',
                          C2_gaji:
                            'Membandingkan upah per jam dengan target minimum yang kamu pilih.',
                          C3_lokasi:
                            'Mempertimbangkan jarak lokasi dan sistem kerja (onsite, remote, hybrid).',
                          C4_jam_kerja:
                            'Mencocokkan jam kerja lowongan dengan waktu luangmu.',
                          C5_skill:
                            'Mencocokkan skill yang kamu punya dengan kebutuhan lowongan.',
                        }[key]
                      }
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {m.example}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Posisi paling atas = Rank 1 (bobot 45.7%). Rank selalu unik 1–5.
      </p>
    </div>
  )
}
