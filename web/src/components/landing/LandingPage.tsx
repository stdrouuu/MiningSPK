import { useNavigate } from 'react-router-dom'
import { LandingNav } from './LandingNav'
import { LandingHero } from './LandingHero'
import { CategoryGrid, FeaturedJobs, StatsPartners, BlueBanner, LandingFooter } from './LandingSections'
import type { RankedJobResult } from '../../types/data'
import { ROUTES } from '../../lib/routes'
interface LandingPageProps {
  mode: 'user' | 'data'
  savedCount: number
  jobs: RankedJobResult[]
  onOpenSavedJobs: () => void
  onQuickSearch: (q: string) => void
  onSelectCategory: (cat: string) => void
  onOpenJob: (job: RankedJobResult) => void
}

export function LandingPage({
  mode,
  savedCount,
  jobs,
  onOpenSavedJobs,
  onQuickSearch,
  onSelectCategory,
  onOpenJob,
}: LandingPageProps) {
  const navigate = useNavigate()
  const portalPath = mode === 'data' ? ROUTES.DATA_PORTAL : ROUTES.PORTAL
  const matrixPath = mode === 'data' ? ROUTES.DATA_MATRIX : ROUTES.MATRIX
  const landingPath = mode === 'data' ? ROUTES.DATA : ROUTES.LANDING

  const onNavigate = (view: 'landing' | 'portal' | 'matrix' | 'kuesioner') => {
    if (view === 'landing') navigate(landingPath)
    else if (view === 'portal') navigate(portalPath)
    else if (view === 'matrix') navigate(matrixPath)
    else navigate(ROUTES.KUESIONER)
  }

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors">
      <LandingNav mode={mode} active="landing" savedCount={savedCount} onNavigate={onNavigate} onOpenSavedJobs={onOpenSavedJobs} />
      <main>
        <LandingHero totalJobs={jobs.length} onEnterPortal={() => navigate(portalPath)} />
        <CategoryGrid
          jobs={jobs}
          onSelectCategory={onSelectCategory}
          onExploreAll={() => navigate(portalPath)}
        />
        <FeaturedJobs jobs={jobs} onOpenJob={onOpenJob} onBrowseAll={() => navigate(portalPath)} />
        <StatsPartners jobs={jobs} />
        <BlueBanner onQuickSearch={onQuickSearch} />
      </main>
      <LandingFooter totalJobs={jobs.length} onNavigate={onNavigate} />
    </div>
  )
}
