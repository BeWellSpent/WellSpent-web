'use client'

import Box from '@mui/material/Box'
import { LandingNav } from './sections/LandingNav'
import { HeroCarousel } from './sections/HeroCarousel'
import { WhatIsSection } from './sections/WhatIsSection'
import { ShowcaseSection } from './sections/ShowcaseSection'
import { HighlightsSection } from './sections/HighlightsSection'
import { UseCasesSection } from './sections/UseCasesSection'
import { PricingSection } from './sections/PricingSection'
import { DownloadSection } from './sections/DownloadSection'
import { AboutSection } from './sections/AboutSection'
import { LandingFooter } from './sections/LandingFooter'

type Props = {
  /** Swaps the sign-in CTAs for a link back into the app. */
  isAuthenticated: boolean
}

export function LandingPage({ isAuthenticated }: Props) {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <LandingNav isAuthenticated={isAuthenticated} />
      <HeroCarousel isAuthenticated={isAuthenticated} />
      <WhatIsSection />
      {/* The root is a summary: captures and the two differentiators. Feature
          detail lives on its own routes under /features, reached from the nav
          dropdown, so this page stays skimmable. */}
      <ShowcaseSection />
      <HighlightsSection />
      <UseCasesSection />
      <PricingSection />
      <DownloadSection />
      <AboutSection />
      <LandingFooter />
    </Box>
  )
}
