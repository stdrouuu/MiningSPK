import { jobProximity, NEARBY_KM } from '../tmp-geo-check/lib/geo.js'
import assert from 'node:assert'

// Sama area -> tier 0, badge "Satu area"
assert.deepStrictEqual(jobProximity({ work_job_location: 'Jakarta Barat', work_system: 'Onsite' }, 'Jakarta Barat'), { tier: 0, label: 'Satu area' })

// Job remote selalu tier 0
assert.deepStrictEqual(jobProximity({ work_job_location: 'Tangerang', work_system: 'Remote' }, 'Jakarta Barat'), { tier: 0, label: 'Remote' })

// Profil remote -> tanpa badge
assert.deepStrictEqual(jobProximity({ work_job_location: 'Jakarta Selatan', work_system: 'Onsite' }, 'Remote'), { tier: 0, label: null })

// Lokasi tak dikenal -> tier 0 tanpa badge (tidak menyaring)
assert.deepStrictEqual(jobProximity({ work_job_location: 'Jakarta Selatan', work_system: 'Onsite' }, 'Surabaya'), { tier: 0, label: null })

// Dekat: Jakbar-Tangsel ±14 km -> tier 1; Tangerang-Jakpus  -> tier 1; Depok-Jaksel -> tier 1
const p1 = jobProximity({ work_job_location: 'Tangerang Selatan', work_system: 'Onsite' }, 'Jakarta Barat')
assert.strictEqual(p1.tier, 1, `Jakbar-Tangsel harus tier 1, dapat ${JSON.stringify(p1)}`)
assert.strictEqual(jobProximity({ work_job_location: 'Jakarta Pusat', work_system: 'Hybrid' }, 'Tangerang').tier, 1)
const p3 = jobProximity({ work_job_location: 'Jakarta Selatan', work_system: 'Onsite' }, 'Depok')
assert.strictEqual(p3.tier, 1, `Depok-Jaksel harus tier 1 (komuter), dapat ${JSON.stringify(p3)}`)

// Jauh: Jakbar-Bogor & Tangsel-Bekasi -> tier 2
assert.strictEqual(jobProximity({ work_job_location: 'Bogor', work_system: 'Onsite' }, 'Jakarta Barat').tier, 2)
assert.strictEqual(jobProximity({ work_job_location: 'Bekasi', work_system: 'Onsite' }, 'Tangerang Selatan').tier, 2)

// Batas konsisten: label tier 1 <= NEARBY_KM
const near = jobProximity({ work_job_location: 'Depok', work_system: 'Onsite' }, 'Jakarta Selatan')
assert.ok(near.label.startsWith('±'))

console.log(`geo tiers OK (NEARBY_KM = ${NEARBY_KM})`)
