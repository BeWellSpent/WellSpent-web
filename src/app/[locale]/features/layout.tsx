import { cookies } from 'next/headers'
import Box from '@mui/material/Box'
import { TOKEN_COOKIE, isTokenExpired } from '@/lib/auth/token'
import { LandingNav } from '@/components/landing/sections/LandingNav'
import { LandingFooter } from '@/components/landing/sections/LandingFooter'

/**
 * Shared chrome for the feature pages, so every group route carries the same
 * nav and footer as the landing page it was reached from.
 */
export default async function FeaturesLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value
  const isAuthenticated = token ? !isTokenExpired(token) : false

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <LandingNav isAuthenticated={isAuthenticated} />
      <Box sx={{ flex: 1 }}>{children}</Box>
      <LandingFooter />
    </Box>
  )
}
