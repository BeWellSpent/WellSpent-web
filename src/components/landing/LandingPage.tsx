import Box from '@mui/material/Box'
import { LandingNav } from './sections/LandingNav'
import { HeroSection } from './sections/HeroSection'
import { HowItWorksSection } from './sections/HowItWorksSection'
import { FeaturesSection } from './sections/FeaturesSection'
import { PricingSection } from './sections/PricingSection'
import { AudienceSection } from './sections/AudienceSection'
import { DownloadSection } from './sections/DownloadSection'
import { LandingFooter } from './sections/LandingFooter'

/** The whole site: one page in the iOS app's design language. WellSpent is mobile-only; there is no web app. */
export function LandingPage() {
  return (
    <Box id="top" sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <LandingNav />
      <Box component="main">
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <PricingSection />
        <AudienceSection />
        <DownloadSection />
      </Box>
      <LandingFooter />
    </Box>
  )
}
