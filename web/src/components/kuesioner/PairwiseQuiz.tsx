import { useMemo, useState } from 'react'
import { RiCheckLine } from 'react-icons/ri'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import type { CriterionKey } from '../../types/priority'
import { PAIRWISE_PAIRS, metaOf } from '../../lib/priority'

interface Props {
  open: boolean
  onClose: () => void
  onFinish: (points: Record<CriterionKey, number>) => void
}

export function PairwiseQuiz({ open, onClose, onFinish }: Props) {
  const [step, setStep] = useState(0)
  const [points, setPoints] = useState<Record<CriterionKey, number>>({
    C1_kategori: 0,
    C2_gaji: 0,
    C3_lokasi: 0,
    C4_jam_kerja: 0,
    C5_skill: 0,
  })
  const [history, setHistory] = useState<CriterionKey[]>([])

  const pair = PAIRWISE_PAIRS[Math.min(step, PAIRWISE_PAIRS.length - 1)]
  const done = step >= PAIRWISE_PAIRS.length

  const progress = useMemo(
    () => Math.min(100, Math.round((step / PAIRWISE_PAIRS.length) * 100)),
    [step]
  )

  const reset = () => {
    setStep(0)
    setHistory([])
    setPoints({ C1_kategori: 0, C2_gaji: 0, C3_lokasi: 0, C4_jam_kerja: 0, C5_skill: 0 })
  }

  const choose = (winner: CriterionKey) => {
    const next = { ...points, [winner]: points[winner] + 1 }
    setPoints(next)
    setHistory([...history, winner])
    const nextStep = step + 1
    setStep(nextStep)
    if (nextStep >= PAIRWISE_PAIRS.length) {
      onFinish(next)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const undo = () => {
    if (!history.length || step === 0) return
    const last = history[history.length - 1]
    setPoints({ ...points, [last]: Math.max(0, points[last] - 1) })
    setHistory(history.slice(0, -1))
    setStep(step - 1)
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Kuis cepat: pilih yang lebih penting" className="max-w-lg">
      {!done && pair ? (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
              <span>Pertanyaan {step + 1} dari {PAIRWISE_PAIRS.length}</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="emil-meter h-full bg-[#0C52EE] dark:bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <p className="text-sm text-slate-900 dark:text-white font-medium text-center">Mana yang lebih penting buatmu?</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {pair.map((key) => {
              const m = metaOf(key)
              return (
                <button
                  key={key}
                  onClick={() => choose(key)}
                  className="emil-press text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-[#0C52EE] dark:hover:border-blue-400 hover:bg-[#0C52EE]/[0.03] dark:hover:bg-blue-500/10 transition-colors"
                >
                  <div className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">{m.title}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-light mt-1">{m.desc}</div>
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={undo}
              disabled={step === 0}
              className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-40 underline"
            >
              Kembali ke soal sebelumnya
            </button>
            <button onClick={handleClose} className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline">
              Batalkan kuis
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-3 py-4">
          <div className="mx-auto w-10 h-10 rounded-full bg-green-50 dark:bg-emerald-950/60 border border-green-200 dark:border-emerald-800 flex items-center justify-center">
            <RiCheckLine className="h-5 w-5 text-green-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">Kuis selesai</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-light">Prioritasmu sudah dihitung dari jawabanmu.</p>
          <Button size="sm" onClick={handleClose} className="text-xs bg-[#0C52EE] hover:bg-[#0942c4] dark:bg-blue-600 dark:hover:bg-blue-500">Lihat hasilku</Button>
        </div>
      )}
    </Dialog>
  )
}
