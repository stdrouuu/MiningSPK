import { LandingNav } from './LandingNav'
import { LandingHero } from './LandingHero'
import { LogoWall } from './LogoWall'
import { CriteriaBento } from './CriteriaBento'
import { HowItWorks } from './HowItWorks'
import { Testimonials } from './Testimonials'
import { LandingCTA } from './LandingCTA'

interface LandingPageProps {
  savedCount: number
  onEnterPortal: () => void
  onShowMethod: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

// Page composition uses 5 layout families: split hero, logo strip,
// asymmetric bento, sticky split steps, 2-col quotes, centered CTA.
// Theme locked to app theme via dark: variant, no section inversion.
export function LandingPage({ savedCount, onEnterPortal, onShowMethod, theme, onToggleTheme }: LandingPageProps) {
  return (
    <div className="min-h-[100dvh] bg-white font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <LandingNav onEnterPortal={onEnterPortal} onShowMethod={onShowMethod} savedCount={savedCount} theme={theme} onToggleTheme={onToggleTheme} />
      <main>
        <LandingHero onEnterPortal={onEnterPortal} onShowMethod={onShowMethod} />
        <LogoWall />
        <CriteriaBento />
        <HowItWorks />
        <Testimonials />
        <LandingCTA onEnterPortal={onEnterPortal} />
      </main>
    </div>
  )
}
