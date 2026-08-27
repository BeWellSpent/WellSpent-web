'use client'

import { useMe } from '@/hooks/useMe'
import { isProfileComplete } from './profileCompletionGate/isProfileComplete'
import { CompleteProfileDialog } from './profileCompletionGate/CompleteProfileDialog'

/**
 * Blocks the app until the account has the profile fields the registration
 * form collects.
 *
 * Sits *inside* `EmailVerificationGate` rather than beside it, so an
 * unverified account is asked one thing at a time. In practice the two never
 * both apply — social sign-ups are auto-verified and are the only accounts
 * that reach this gate — but the ordering is deliberate rather than incidental.
 */
export function ProfileCompletionGate({ children }: { children: React.ReactNode }) {
  const { user } = useMe()

  // Render through while the first GetMe is in flight, matching the
  // verification gate: the alternative flashes a form at every complete
  // account on every cold load.
  if (!user || isProfileComplete(user)) return <>{children}</>

  return (
    <CompleteProfileDialog
      firstName={user.firstName}
      lastName={user.lastName}
      language={user.language}
      currency={user.currency}
    />
  )
}
