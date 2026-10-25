import type { LeaderScenario } from '../../lib/sensitivity'
import { sensitivityMessage } from '../../lib/sensitivity'

export function SensitivityPanel({ scenarios }: { scenarios: LeaderScenario[] }) {
  if (!scenarios.length) return null
  const message = sensitivityMessage(scenarios)

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3">
      <div>
        <h3 className="text-sm font-medium text-slate-900 dark:text-white">Kalau prioritasmu berubah, apa yang terjadi?</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-light mt-0.5">
          Tiap baris = simulasi "kriteria ini jadi nomor 1". Juara bisa berganti — itu normal.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            <tr>
              <th className="py-2 px-3">Kalau yang nomor 1…</th>
              <th className="py-2 px-3">Juara 1–3</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {scenarios.map((s) => (
              <tr key={s.leader} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="py-2 px-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">{s.leaderTitle}</td>
                <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-light">
                  {s.top3.length ? (
                    <ol className="space-y-0.5">
                      {s.top3.map((j, i) => (
                        <li key={j.job_id} className="truncate">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{i + 1}. {j.job_title}</span>
                          <span className="text-slate-400 dark:text-slate-500"> — {j.company_name}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">Tidak ada data</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-light">
        {message}
      </p>
    </div>
  )
}
