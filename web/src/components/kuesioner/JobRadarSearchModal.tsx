import { useEffect, useMemo, useState } from 'react'
import { CompanyLogo } from '../CompanyLogo'
import type { RankedJobResult } from '../../types/data'

interface JobRadarSearchModalProps {
  open: boolean
  location: string
  userName: string
  topJobs: RankedJobResult[]
  totalJobsCount: number
  onComplete: () => void
}

interface RegionMapConfig {
  label: string
  areaSubtitle: string
  lat: number
  lng: number
  zoom: number
}

// Koordinat asli (Latitude & Longitude) pusat aktivitas tiap wilayah di Jabodetabek untuk OpenStreetMap
const REGION_CONFIGS: Record<string, RegionMapConfig> = {
  'Jakarta Selatan': {
    label: 'Jakarta Selatan',
    areaSubtitle: 'Blok M • Panglima Polim • Melawai • Fatmawati',
    lat: -6.2442,
    lng: 106.7997,
    zoom: 15,
  },
  'Jakarta Barat': {
    label: 'Jakarta Barat',
    areaSubtitle: 'Tanjung Duren • Grogol • Kampus UKRIDA • Central Park',
    lat: -6.1738,
    lng: 106.7889,
    zoom: 15,
  },
  'Jakarta Pusat': {
    label: 'Jakarta Pusat',
    areaSubtitle: 'Bundaran HI • Thamrin • Menteng • Sudirman',
    lat: -6.195,
    lng: 106.823,
    zoom: 15,
  },
  'Jakarta Timur': {
    label: 'Jakarta Timur',
    areaSubtitle: 'Rawamangun • Pemuda • Jatinegara • Cawang',
    lat: -6.1931,
    lng: 106.889,
    zoom: 15,
  },
  'Jakarta Utara': {
    label: 'Jakarta Utara',
    areaSubtitle: 'Kelapa Gading • Boulevard Raya • Sunter • Pluit',
    lat: -6.1561,
    lng: 106.9056,
    zoom: 15,
  },
  Depok: {
    label: 'Depok',
    areaSubtitle: 'Jl. Margonda Raya • Kampus UI • Pondok Cina • MargoCity',
    lat: -6.3688,
    lng: 106.833,
    zoom: 15,
  },
  'Tangerang Selatan': {
    label: 'Tangerang Selatan',
    areaSubtitle: 'BSD City • Serpong • Bintaro • Alam Sutera',
    lat: -6.3016,
    lng: 106.6534,
    zoom: 15,
  },
  Tangerang: {
    label: 'Tangerang',
    areaSubtitle: 'Cikokol • Tangcity • Karawaci • Pusat Kota Tangerang',
    lat: -6.1783,
    lng: 106.6319,
    zoom: 15,
  },
  Bogor: {
    label: 'Bogor',
    areaSubtitle: 'Kebun Raya Bogor • Jl. Pajajaran • Botani Square',
    lat: -6.5971,
    lng: 106.799,
    zoom: 15,
  },
  Bekasi: {
    label: 'Bekasi',
    areaSubtitle: 'Summarecon Bekasi • Ahmad Yani • Pekayon • Galaxy',
    lat: -6.226,
    lng: 107.001,
    zoom: 15,
  },
}

// Koordinat kemunculan pin loker di sekitar radar (persentase X, Y)
const JOB_PIN_SLOTS: Array<{ x: number; y: number }> = [
  { x: 25, y: 28 },
  { x: 75, y: 27 },
  { x: 24, y: 72 },
  { x: 76, y: 70 },
  { x: 50, y: 16 },
]

function resolveRegionConfig(location: string): RegionMapConfig {
  const clean = (location || '').trim()
  if (REGION_CONFIGS[clean]) return REGION_CONFIGS[clean]
  const lower = clean.toLowerCase()
  if (lower.includes('tangerang') && lower.includes('selatan')) {
    return REGION_CONFIGS['Tangerang Selatan']
  }
  if (lower.includes('tangerang')) return REGION_CONFIGS['Tangerang']
  if (lower.includes('selatan')) return REGION_CONFIGS['Jakarta Selatan']
  if (lower.includes('barat')) return REGION_CONFIGS['Jakarta Barat']
  if (lower.includes('pusat')) return REGION_CONFIGS['Jakarta Pusat']
  if (lower.includes('timur')) return REGION_CONFIGS['Jakarta Timur']
  if (lower.includes('utara')) return REGION_CONFIGS['Jakarta Utara']
  if (lower.includes('depok')) return REGION_CONFIGS['Depok']
  if (lower.includes('bogor')) return REGION_CONFIGS['Bogor']
  if (lower.includes('bekasi')) return REGION_CONFIGS['Bekasi']
  return REGION_CONFIGS['Jakarta Barat']
}

/**
 * Proyeksi Web Mercator standar Leaflet / OpenStreetMap (tanpa API key, 100% gratis).
 * Menghitung posisi piksel presisi setiap tile 256x256 agar jalanan & gedung tersambung mulus.
 */
function computeOsmTileLayout(lat: number, lng: number, zoom: number) {
  const tileSize = 256
  const scale = tileSize * Math.pow(2, zoom)
  const worldX = ((lng + 180) / 360) * scale
  const sinLat = Math.sin((lat * Math.PI) / 180)
  const worldY =
    (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale

  const centerTileX = Math.floor(worldX / tileSize)
  const centerTileY = Math.floor(worldY / tileSize)
  const offsetX = Math.round(worldX - centerTileX * tileSize)
  const offsetY = Math.round(worldY - centerTileY * tileSize)

  const tiles: Array<{
    key: string
    url: string
    dx: number
    dy: number
    leftOffset: number
    topOffset: number
  }> = []

  // Render grid 5x5 tile 256px di sekitar titik pusat (lat, lng)
  const subdomains = ['a', 'b', 'c']
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const tx = centerTileX + dx
      const ty = centerTileY + dy
      const sub = subdomains[Math.abs(tx + ty) % subdomains.length]
      tiles.push({
        key: `${zoom}-${tx}-${ty}`,
        url: `https://${sub}.tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`,
        dx,
        dy,
        leftOffset: dx * tileSize - offsetX,
        topOffset: dy * tileSize - offsetY,
      })
    }
  }

  return tiles
}

export function JobRadarSearchModal({
  open,
  location,
  userName,
  topJobs,
  totalJobsCount,
  onComplete,
}: JobRadarSearchModalProps) {
  const [visiblePins, setVisiblePins] = useState(0)
  const [phase, setPhase] = useState<0 | 1 | 2>(0)

  const region = useMemo(() => resolveRegionConfig(location), [location])
  const osmTiles = useMemo(
    () => computeOsmTileLayout(region.lat, region.lng, region.zoom),
    [region.lat, region.lng, region.zoom]
  )
  const jobsToPin = useMemo(() => topJobs.slice(0, 5), [topJobs])

  useEffect(() => {
    if (!open) {
      setVisiblePins(0)
      setPhase(0)
      return
    }

    const timers: number[] = []
    // Munculkan pin loker satu per satu di atas peta OpenStreetMap
    for (let i = 1; i <= 5; i++) {
      timers.push(
        window.setTimeout(() => {
          setVisiblePins(i)
        }, i * 520)
      )
    }

    timers.push(window.setTimeout(() => setPhase(1), 1200))
    timers.push(window.setTimeout(() => setPhase(2), 2500))
    timers.push(
      window.setTimeout(() => {
        onComplete()
      }, 3700)
    )

    return () => {
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [open, onComplete])

  if (!open) return null

  const statusText =
    phase === 0
      ? `Pencarian diprioritaskan di ${region.label}...`
      : phase === 1
        ? `Memindai ${totalJobsCount} lowongan di sekitar ${region.label}...`
        : `Ditemukan lowongan terbaik untuk ${userName.trim() || 'kamu'}!`

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs select-none"
      role="dialog"
      aria-modal="true"
      aria-label={`Mencari rekomendasi lowongan di sekitar ${region.label}`}
    >
      <style>{`
        @keyframes upmatch-radar-pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.35);
            opacity: 0.85;
          }
          70% {
            opacity: 0.35;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.55);
            opacity: 0;
          }
        }
        @keyframes upmatch-radar-sweep {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
        @keyframes upmatch-pin-pop {
          0% {
            transform: translate(-50%, -50%) scale(0.4) translateY(10px);
            opacity: 0;
          }
          70% {
            transform: translate(-50%, -50%) scale(1.06) translateY(-2px);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1) translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      <div className="relative w-full max-w-lg rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Header Bar Atas */}
        <div className="px-5 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0C52EE]" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                Mencari Lowongan di Sekitar {region.label}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {region.areaSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onComplete}
            className="text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Lewati
          </button>
        </div>

        {/* Kanvas Peta OpenStreetMap Asli (Gratis, Tanpa API Key) */}
        <div className="relative w-full h-[360px] sm:h-[390px] bg-[#E8ECEF] overflow-hidden">
          {/* Layer 1: Tile Peta OpenStreetMap Presisi Piksel (256x256 per tile) */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {osmTiles.map((tile) => (
              <img
                key={tile.key}
                src={tile.url}
                alt=""
                width={256}
                height={256}
                draggable={false}
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${tile.leftOffset}px)`,
                  top: `calc(50% + ${tile.topOffset}px)`,
                  width: '256px',
                  height: '256px',
                  maxWidth: 'none',
                }}
                className="select-none"
              />
            ))}
          </div>

          {/* Layer 2: Lingkaran Radar Biru di Tengah Peta */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full bg-[#0C52EE]/20 border border-[#0C52EE]/35 pointer-events-none z-10" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full bg-[#0C52EE]/25 border border-[#0C52EE]/45 pointer-events-none z-10" />

          {/* Gelombang Radar Biru Berdenyut (Pulse Rings) */}
          <div
            style={{
              animation: 'upmatch-radar-pulse 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite',
            }}
            className="absolute left-1/2 top-1/2 w-52 h-52 rounded-full bg-[#0C52EE]/25 border-2 border-[#0C52EE]/55 pointer-events-none z-10"
          />
          <div
            style={{
              animation: 'upmatch-radar-pulse 2.2s cubic-bezier(0.16, 1, 0.3, 1) 1.1s infinite',
            }}
            className="absolute left-1/2 top-1/2 w-52 h-52 rounded-full bg-[#0C52EE]/20 border-2 border-[#0C52EE]/45 pointer-events-none z-10"
          />

          {/* Sapuan Radar Biru Berputar (Sweep Beam) */}
          <div
            style={{
              animation: 'upmatch-radar-sweep 2.8s linear infinite',
              background:
                'conic-gradient(from 0deg, rgba(12, 82, 238, 0.36) 0deg, rgba(12, 82, 238, 0.0) 85deg, transparent 360deg)',
            }}
            className="absolute left-1/2 top-1/2 w-56 h-56 rounded-full pointer-events-none z-10"
          />

          {/* Layer 3: Pin Loker (Hanya Ikon & Nama Loker, Tanpa Persentase / Peringkat) */}
          {jobsToPin.map((job, idx) => {
            if (idx >= visiblePins) return null
            const slot = JOB_PIN_SLOTS[idx % JOB_PIN_SLOTS.length]

            return (
              <div
                key={job.job_id}
                style={{
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  animation: 'upmatch-pin-pop 360ms cubic-bezier(0.16, 1, 0.3, 1) both',
                }}
                className="absolute z-20 flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/95 shadow-lg border border-slate-200/90 backdrop-blur-xs pointer-events-none max-w-[195px]"
              >
                <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden">
                  <CompanyLogo
                    companyName={job.company_name}
                    logoUrl={job.company_logo}
                    size="sm"
                    className="w-5 h-5 rounded-full object-contain"
                  />
                </div>
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {job.job_title}
                </span>
              </div>
            )
          })}

          {/* Pin Pusat Lokasi Pengguna (Warna Biru) + Pill "Pencarian diprioritaskan..." */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center pointer-events-none">
            <div className="relative flex flex-col items-center">
              <div className="w-11 h-11 rounded-full bg-[#0C52EE] border-[3px] border-white shadow-lg flex items-center justify-center text-white">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19V5m0 0l-6 6m6-6l6 6"
                  />
                </svg>
              </div>
              <div className="w-3 h-3 bg-white rotate-45 -mt-1.5 shadow-xs" />
            </div>

            <div className="mt-2 px-3.5 py-1.5 rounded-full bg-white shadow-lg border border-slate-200/90 flex items-center gap-2 whitespace-nowrap">
              <span className="w-4 h-4 rounded-full bg-[#0C52EE] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                ★
              </span>
              <span className="text-xs font-semibold text-slate-800">
                {statusText}
              </span>
            </div>
          </div>

          {/* Atribusi Standar OpenStreetMap */}
          <div className="absolute bottom-1.5 right-2 z-20 px-1.5 py-0.5 rounded bg-white/80 text-[9px] text-slate-500 pointer-events-none">
            © OpenStreetMap contributors
          </div>
        </div>

        {/* Footer Progress Bar & Ringkasan */}
        <div className="px-5 py-3.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              Memindai lowongan di sekitar{' '}
              <strong className="text-slate-900 dark:text-white">{region.label}</strong>
            </span>
            <span className="font-mono text-[11px] font-semibold text-[#0C52EE] dark:text-blue-400 tabular-nums">
              {Math.min(100, Math.round(((visiblePins + 1) / 6) * 100))}%
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-[#0C52EE] dark:bg-blue-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.round(((visiblePins + 1) / 6) * 100))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
