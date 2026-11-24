import { RiCheckLine } from 'react-icons/ri'

const labels = ['Profil', 'Prioritas', 'Hasil']

export function StepperPreview({ step, onStep }: { step: number; onStep: (step: number) => void }) {
  return (
    <ol data-tour="kuesioner-stepper" aria-label="Langkah kuesioner" className="flex gap-2">
      {labels.map((label, i) => {
        const active = i === step
        const done = i < step
        return (
          <li key={label} className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => { if (done) onStep(i) }}
              disabled={!done}
              aria-current={active ? 'step' : undefined}
              className={`flex w-full items-center gap-2 rounded-full px-3 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-[#0C52EE] text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'} ${done ? 'cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700' : 'cursor-default'}`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${active ? 'bg-white/20 text-white' : done ? 'bg-slate-400/60 text-white' : ''}`}>
                {done ? <RiCheckLine aria-hidden="true" className="h-4 w-4" /> : i + 1}
              </span>
              <span className="truncate">{label}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
