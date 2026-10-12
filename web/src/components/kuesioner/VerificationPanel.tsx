import { RiCheckLine, RiEditLine } from 'react-icons/ri'
import { Button } from '../ui/Button'

interface Props {
  saved: boolean
  editCount: number
  onAccept: () => void
  onToggleEdit: () => void
  editing: boolean
}

export function VerificationPanel({ saved, editCount, onAccept, onToggleEdit, editing }: Props) {
  return (
    <div className="bg-white border border-[#0C52EE]/25 rounded-xl p-4 shadow-2xs space-y-3">
      <div>
        <h3 className="text-sm font-medium text-slate-900">Cocok dengan hasil ini?</h3>
        <p className="text-xs text-slate-500 font-light mt-0.5">
          Kalau setuju, kami simpan. Kalau tidak, atur rank-nya sendiri di atas.
          {editCount > 0 && <span className="font-medium text-slate-700"> (sudah diubah {editCount}x)</span>}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button onClick={onAccept} className="text-xs gap-1.5 flex-1">
          <RiCheckLine className="h-3.5 w-3.5" />
          {saved ? 'Tersimpan — Setuju' : 'Setuju dengan rekomendasi'}
        </Button>
        <Button variant="outline" onClick={onToggleEdit} className="text-xs gap-1.5 flex-1">
          <RiEditLine className="h-3.5 w-3.5" />
          {editing ? 'Sembunyikan editor' : 'Atur kriteria sendiri'}
        </Button>
      </div>
      {saved && (
        <p className="text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
          Preferensimu tersimpan di perangkat ini (anonim, tanpa NIM).
        </p>
      )}
    </div>
  )
}
