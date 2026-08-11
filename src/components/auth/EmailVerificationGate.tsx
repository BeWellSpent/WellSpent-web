'use client'

import { useQuery } from '@tanstack/react-query'
import { UserService } from '@/gen/wellspent/v1/user_connect'
import { useClient } from '@/hooks/useClient'
import { VerifyEmailDialog } from './emailVerificationGate/VerifyEmailDialog'

/**
 * Blocks the whole authenticated app until the account's email is verified.
 *
 * Mounted once in the (app) layout rather than per page — the previous
 * reminder banner had to be remembered at three separate mount sites, and a
 * hard gate that a new route can forget to include isn't a gate.
 *
 * Google and Apple sign-ups are verified at creation, so they never see this.
 */
export function EmailVerificationGate({ children }: { children: React.ReactNode }) {
  const userClient = useClient(UserService)

  const { data } = useQuery({
    queryKey: ['getMe'],
    queryFn: () => userClient.getMe({}),
    // The verification link opens in a browser tab, so returning to this one
    // is exactly the moment the answer may have changed. staleTime overrides
    // the 30s app-wide default, which would otherwise swallow that refetch
    // and leave a just-verified user staring at the gate.
    refetchOnWindowFocus: true,
    staleTime: 0,
  })

  const user = data?.user
  // Render through while the first GetMe is in flight: the alternative
  // flashes a verification wall at every verified user on every cold load.
  if (!user || user.isVerified) return <>{children}</>

  return <VerifyEmailDialog email={user.email} />
}
