import { useNavigate } from 'react-router-dom'
import { LandingNav } from './LandingNav'
import { LandingHero } from './LandingHero'
import { CategoryGrid, FeaturedJobs, StatsPartners, BlueBanner, LandingFooter } from './LandingSections'
import type { RankedJobResult } from '../../types/data'
import { ROUTES } from '../../lib/routes'

interface LandingPageProps {
  savedCount: number
  jobs: RankedJobResult[]
  onOpenSavedJobs: () => void
  onQuickSearch: (q: string) => void
  onSelectCategory: (cat: string) => void
  onOpenJob: (job: RankedJobResult) => void
}

export function LandingPage({
  savedCount,
  jobs,
  onOpenSavedJobs,
  onQuickSearch,
  onSelectCategory,
  onOpenJob,
}: LandingPageProps) {
  const navigate = useNavigate()

  const onNavigate = (view: 'landing' | 'portal' | 'matrix') => {
    navigate(view === 'landing' ? ROUTES.LANDING : view === 'portal' ? ROUTES.PORTAL : ROUTES.MATRIX)
  }

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] font-sans text-slate-900">
      <LandingNav active="landing" savedCount={savedCount} onNavigate={onNavigate} onOpenSavedJobs={onOpenSavedJobs} />
      <main>
        <LandingHero totalJobs={jobs.length} onEnterPortal={() => navigate(ROUTES.PORTAL)} />
        <CategoryGrid
          jobs={jobs}
          onSelectCategory={onSelectCategory}
          onExploreAll={() => navigate(ROUTES.PORTAL)}
        />
        <FeaturedJobs jobs={jobs} onOpenJob={onOpenJob} onBrowseAll={() => navigate(ROUTES.PORTAL)} />
        <StatsPartners jobs={jobs} />
        <BlueBanner onQuickSearch={onQuickSearch} />
      </main>
      <LandingFooter totalJobs={jobs.length} onNavigate={onNavigate} />
    </div>
  )
}
