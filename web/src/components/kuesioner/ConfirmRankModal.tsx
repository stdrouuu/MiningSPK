import { RiCheckLine, RiEditLine } from 'react-icons/ri'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import type { CriterionKey, Ranks } from '../../types/priority'
import { metaOf } from '../../lib/priority'
import { weightsWithTies, weightPct } from '../../lib/roc'

interface Props {
  open: boolean
  onClose: () => void
  ranks: Ranks
  onConfirm: () => void
}

/** Modal konfirmasi ranking — muncul dari langkah Prioritas sebelum hasil dihitung. */
export function ConfirmRankModal({ open, onClose, ranks, onConfirm }: Props) {
  const weights = weightsWithTies(ranks)

  return (
    <Dialog open={open} onClose={onClose} title="Kunci ranking ini?" className="max-w-lg">
      <div className="space-y-3">
        <p className="text-xs text-slate-500 font-light">
          Ini susunan yang dipakai menghitung rekomendasimu. Rank unik 1–5, total bobot 100%.
        </p>
        <ol className="space-y-1.5">
          {(Object.keys(ranks) as CriterionKey[])
            .sort((a, b) => ranks[a] - ranks[b])
            .map((key) => (
              <li key={key} className="flex items-center gap-2 text-xs">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#0C52EE] text-white font-mono text-[11px]">
                  {ranks[key]}
                </span>
                <span className="font-medium text-slate-900">{metaOf(key).title}</span>
                <span className="text-slate-400 font-light tabular-nums">
                  {weightPct(weights[key])}
                </span>
              </li>
            ))}
        </ol>
        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button onClick={onConfirm} className="text-xs gap-1.5 flex-1">
            <RiCheckLine className="h-3.5 w-3.5" />
            Setuju dengan ranking kriteria
          </Button>
          <Button variant="outline" onClick={onClose} className="text-xs gap-1.5 flex-1">
            <RiEditLine className="h-3.5 w-3.5" />
            Ubah ranking kriteria
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
