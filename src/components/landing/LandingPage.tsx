'use client'

import Box from '@mui/material/Box'
import { LandingNav } from './sections/LandingNav'
import { HeroCarousel } from './sections/HeroCarousel'
import { WhatIsSection } from './sections/WhatIsSection'
import { ShowcaseSection } from './sections/ShowcaseSection'
import { HighlightsSection } from './sections/HighlightsSection'
import { FeaturesSection } from './sections/FeaturesSection'
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
      {/* Show the product before describing it — the captures do more selling
          than the feature list, so they come first. */}
      <ShowcaseSection />
      <HighlightsSection />
      <FeaturesSection />
      <UseCasesSection />
      <PricingSection />
      <DownloadSection />
      <AboutSection />
      <LandingFooter />
    </Box>
  )
}
