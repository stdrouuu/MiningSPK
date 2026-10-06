// ─── Gaya tombol navbar yang sedang aktif: teks gelap + titik pink ────
const BASE = 'px-3 py-1.5 rounded-lg transition-colors'

/** Class tombol nav — panggil dengan status aktif/tidak. */
export function navButtonClass(active: boolean): string {
  if (!active) return `${BASE} text-slate-600 hover:text-slate-900 hover:bg-slate-100`
  return `${BASE} relative text-slate-900 font-medium hover:bg-slate-100`
}

/** Class titik pink di bawah tombol aktif. */
export function navIndicatorClass(): string {
  return 'absolute left-1/2 -translate-x-1/2 bottom-0 w-1.5 h-1.5 rounded-full bg-[#ED1E79]'
}
