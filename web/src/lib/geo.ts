import type { CleanJob } from '../types/data'

/**
 * Lingkup jarak user -> loker (opsi A: SPK global 221 tetap, filter/jarak
 * hanya di lapisan tampilan).
 *
 * ponytail: jarak = antar pusat kota (matriks koordinat statis), bukan titik
 * jalan/kecamatan. Upgrade: kalau dataset naik ke level kecamatan/koordinat,
 * ganti AREA_COORDS punya per-record lat/lng + Haversine penuh.
 */

const AREA_COORDS: Record<string, [number, number]> = {
  'Jakarta Barat': [-6.1683, 106.7583],
  'Jakarta Pusat': [-6.1751, 106.8272],
  'Jakarta Selatan': [-6.2433, 106.8006],
  'Jakarta Timur': [-6.2159, 106.8892],
  'Jakarta Utara': [-6.1570, 106.9055],
  Tangerang: [-6.1783, 106.6267],
  'Tangerang Selatan': [-6.2860, 106.7050],
  Bekasi: [-6.2383, 107.0000],
  Depok: [-6.4000, 106.8200],
  Bogor: [-6.5950, 106.8160],
}

/** Tier jarak: 0 = satu area / remote, 1 = <= NEARBY_KM, 2 = Jabodetabek sisanya. */
export type DistanceTier = 0 | 1 | 2

export const NEARBY_KM = 25
/** Auto-widen: kurang dari sekian loker dekat -> ikutkan seluruh Jabodetabek. */
export const NEARBY_MIN_RESULTS = 5

type ProximityJob = Pick<CleanJob, 'work_job_location' | 'work_system'>

function haversineKm(a: [number, number], b: [number, number]): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b[0] - a[0])
  const dLon = rad(b[1] - a[1])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

export interface JobProximity {
  tier: DistanceTier
  /** Badge di kartu; null = tidak informatif (profil Remote / lokasi tak dikenal). */
  label: string | null
}

/**
 * Tier jarak loker terhadap lokasi user. Remote selalu tier 0 (bisa dikerjakan
 * dari rumah). Lokasi di luar daftar -> tier 0 tanpa badge (jangan salah cite).
 */
export function jobProximity(job: ProximityJob, studentLocation: string): JobProximity {
  const jLoc = (job.work_job_location || '').trim().toLowerCase()
  const sLoc = (studentLocation || '').trim().toLowerCase()

  if (job.work_system?.toLowerCase() === 'remote' || jLoc === 'remote') {
    return { tier: 0, label: 'Remote' }
  }
  if (sLoc === 'remote') return { tier: 0, label: null }

  const sCity = AREA_COORDS[studentLocation.trim()]
  const jCity = AREA_COORDS[job.work_job_location?.trim() || '']
  if (!sCity || !jCity) return { tier: 0, label: null }

  if (sLoc === jLoc) return { tier: 0, label: 'Satu area' }
  const kmRaw = haversineKm(sCity, jCity)
  // Tier ditentukan jarak mentah; pembulatan hanya untuk label (ceil ke 5 km
  // supaya label tier 1 & tier 2 tidak bentrok di batas 25 km).
  const km = Math.ceil(kmRaw / 5) * 5
  return { tier: kmRaw <= NEARBY_KM ? 1 : 2, label: `±${km} km` }
}
