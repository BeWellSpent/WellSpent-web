import { LandingPage } from '@/components/landing/LandingPage'

// The web app is parked — this is a pure marketing page now, with no CTA
// back into the app (iOS/Android are the product going forward). No longer
// needs to know whether the visitor has a session.
export default function LocaleHome() {
  return <LandingPage />
}
