import Box from '@mui/material/Box'
import { LandingNav } from '@/components/landing/sections/LandingNav'
import { LandingFooter } from '@/components/landing/sections/LandingFooter'

/**
 * Shared chrome for the feature pages, so every group route carries the same
 * nav and footer as the landing page it was reached from.
 */
export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <LandingNav />
      <Box sx={{ flex: 1 }}>{children}</Box>
      <LandingFooter />
    </Box>
  )
}
