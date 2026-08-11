import { cookies } from 'next/headers'
import { TOKEN_COOKIE, isTokenExpired } from '@/lib/auth/token'
import { LandingPage } from '@/components/landing/LandingPage'

export default async function LocaleHome() {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value

  // Signed-in visitors are deliberately NOT redirected to /budgets any more.
  // This page is the only place the product is explained, and redirecting made
  // it unreachable for anyone holding a session — there was no way back to it
  // from inside the app. The nav swaps Sign In / Get Started for a single
  // "Open app" button instead, so a returning user is still one click away.
  //
  // Expiry is checked the same way the app layout checks it, so a stale cookie
  // doesn't offer "Open app" and then bounce to the login screen.
  const isAuthenticated = token ? !isTokenExpired(token) : false

  return <LandingPage isAuthenticated={isAuthenticated} />
}
