import { Bookmark, Building2, Trash2, ExternalLink } from 'lucide-react'
import { Dialog } from './ui/Dialog'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import type { RankedJobResult } from '../types/data'
import { formatRupiah } from '../lib/utils'

interface SavedJobsModalProps {
  open: boolean
  onClose: () => void
  savedJobs: RankedJobResult[]
  onRemoveSaved: (jobId: string) => void
  onSelectJob: (job: RankedJobResult) => void
}

export function SavedJobsModal({
  open,
  onClose,
  savedJobs,
  onRemoveSaved,
  onSelectJob,
}: SavedJobsModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Lowongan Tersimpan (${savedJobs.length})`}
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {savedJobs.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 space-y-2">
            <Bookmark className="h-8 w-8 mx-auto text-zinc-400" />
            <p className="text-sm font-medium">Belum ada lowongan yang disimpan</p>
            <p className="text-xs">
              Klik ikon bookmark pada kartu lowongan untuk menyimpannya di sini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 max-h-[60vh] overflow-y-auto">
            {savedJobs.map((job) => (
              <div
                key={job.job_id}
                className="py-3.5 flex items-center justify-between gap-4 group"
              >
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => {
                    onSelectJob(job)
                    onClose()
                  }}
                >
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline truncate">
                      {job.job_title}
                    </h4>
                    <Badge variant="outline" className="text-[10px]">
                      {job.job_category}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {job.company_name}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-100 font-medium">
                      {formatRupiah(job.work_salaryperhour)}
                    </span>
                    <span>•</span>
                    <span>{job.work_job_location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {job.url && (
                    <a href={job.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Buka URL">
                        <ExternalLink className="h-4 w-4 text-zinc-500" />
                      </Button>
                    </a>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveSaved(job.job_id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    title="Hapus dari simpanan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Tutup
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
